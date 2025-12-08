"""
Payment Service - Razorpay Integration
Handles payment order creation, webhook verification, and status updates
"""
import razorpay
from sqlalchemy.orm import Session
from decimal import Decimal
import hmac
import hashlib
import logging
from typing import Dict, Optional

from app.config import settings
from app.models import Payment, Booking

logger = logging.getLogger(__name__)


class PaymentService:
    """Service for payment-related operations"""
    
    def __init__(self):
        """Initialize Razorpay client"""
        if settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET:
            self.client = razorpay.Client(
                auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
            )
        else:
            self.client = None
            logger.warning("Razorpay credentials not configured")
    
    def create_order(
        self,
        db: Session,
        payment: Payment
    ) -> Dict:
        """
        Create Razorpay order for payment.
        
        Args:
            db: Database session
            payment: Payment model instance
        
        Returns:
            Razorpay order details
        
        Raises:
            Exception: If order creation fails
        """
        if not self.client:
            # Mock response for development
            logger.warning("Using mock payment (Razorpay not configured)")
            return {
                "id": f"order_mock_{payment.id}",
                "amount": int(payment.amount * 100),  # Convert to paise
                "currency": payment.currency,
                "status": "created"
            }
        
        try:
            # Convert amount to paise (INR smallest unit)
            amount_paise = int(payment.amount * 100)
            
            # Create order
            order_data = {
                "amount": amount_paise,
                "currency": payment.currency,
                "receipt": str(payment.booking_id),
                "notes": {
                    "booking_id": str(payment.booking_id),
                    "payment_id": str(payment.id)
                }
            }
            
            order = self.client.order.create(data=order_data)
            
            # Update payment record
            payment.gateway = "razorpay"
            payment.gateway_order_id = order['id']
            payment.raw_request = order_data
            payment.raw_response = order
            
            db.commit()
            
            logger.info(f"Created Razorpay order {order['id']} for payment {payment.id}")
            
            return order
            
        except Exception as e:
            logger.error(f"Error creating Razorpay order: {e}")
            raise
    
    def verify_webhook_signature(
        self,
        payload: str,
        signature: str
    ) -> bool:
        """
        Verify Razorpay webhook signature.
        
        Args:
            payload: Request body as string
            signature: X-Razorpay-Signature header value
        
        Returns:
            True if signature is valid, False otherwise
        """
        if not settings.RAZORPAY_WEBHOOK_SECRET:
            logger.warning("Razorpay webhook secret not configured, skipping verification")
            return True  # Allow in development
        
        try:
            expected_signature = hmac.new(
                settings.RAZORPAY_WEBHOOK_SECRET.encode('utf-8'),
                payload.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(expected_signature, signature)
            
        except Exception as e:
            logger.error(f"Error verifying webhook signature: {e}")
            return False
    
    def verify_payment_signature(
        self,
        order_id: str,
        payment_id: str,
        signature: str
    ) -> bool:
        """
        Verify Razorpay payment signature (from frontend).
        
        Args:
            order_id: Razorpay order ID
            payment_id: Razorpay payment ID
            signature: Razorpay signature
        
        Returns:
            True if signature is valid, False otherwise
        """
        if not settings.RAZORPAY_KEY_SECRET:
            logger.warning("Razorpay key secret not configured, skipping verification")
            return True  # Allow in development
        
        try:
            # Create message: order_id|payment_id
            message = f"{order_id}|{payment_id}"
            
            expected_signature = hmac.new(
                settings.RAZORPAY_KEY_SECRET.encode('utf-8'),
                message.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(expected_signature, signature)
            
        except Exception as e:
            logger.error(f"Error verifying payment signature: {e}")
            return False
    
    def handle_payment_success(
        self,
        db: Session,
        payment: Payment,
        gateway_payment_id: str,
        gateway_data: Optional[Dict] = None
    ) -> Booking:
        """
        Handle successful payment.
        
        Args:
            db: Database session
            payment: Payment model instance
            gateway_payment_id: Payment ID from gateway
            gateway_data: Additional gateway response data
        
        Returns:
            Updated booking
        """
        from app.services.booking_service import BookingService
        
        # Update payment status
        payment.status = 'SUCCESS'
        payment.gateway_payment_id = gateway_payment_id
        
        if gateway_data:
            payment.raw_response = gateway_data
        
        # Update booking status
        booking = payment.booking
        booking.status = 'CONFIRMED'
        
        # Generate invoice number if not exists
        if not booking.invoice_number:
            booking.invoice_number = BookingService.generate_invoice_number(
                str(booking.organization_id)
            )
        
        db.commit()
        
        logger.info(f"Payment {payment.id} successful, booking {booking.id} confirmed")
        
        return booking
    
    def handle_payment_failure(
        self,
        db: Session,
        payment: Payment,
        gateway_data: Optional[Dict] = None
    ) -> Booking:
        """
        Handle failed payment.
        
        Args:
            db: Database session
            payment: Payment model instance
            gateway_data: Gateway response data
        
        Returns:
            Updated booking
        """
        # Update payment status
        payment.status = 'FAILED'
        
        if gateway_data:
            payment.raw_response = gateway_data
        
        # Update booking status (frees the slot)
        booking = payment.booking
        booking.status = 'FAILED'
        
        db.commit()
        
        logger.info(f"Payment {payment.id} failed, booking {booking.id} marked as failed")
        
        return booking
    
    def get_payment_status(
        self,
        payment_id: str
    ) -> Optional[Dict]:
        """
        Get payment status from Razorpay.
        
        Args:
            payment_id: Razorpay payment ID
        
        Returns:
            Payment details or None
        """
        if not self.client:
            return None
        
        try:
            payment = self.client.payment.fetch(payment_id)
            return payment
        except Exception as e:
            logger.error(f"Error fetching payment status: {e}")
            return None

    def process_webhook(
        self,
        db: Session,
        webhook_data: dict
    ) -> None:
        """
        Process Razorpay webhook events.
        
        Args:
            db: Database session
            webhook_data: Webhook payload from Razorpay
        """
        event = webhook_data.get('event')
        
        if not event:
            logger.warning("Webhook received without event type")
            return
        
        # Extract payment entity from payload
        payload = webhook_data.get('payload', {})
        payment_entity = payload.get('payment', {}).get('entity', {})
        order_entity = payload.get('order', {}).get('entity', {})
        
        logger.info(f"Processing webhook event: {event}")
        
        try:
            if event == 'payment.captured':
                # Payment successful
                order_id = payment_entity.get('order_id')
                payment_id = payment_entity.get('id')
                
                if not order_id:
                    logger.error("No order_id in payment.captured webhook")
                    return
                
                # Find payment by gateway order ID
                payment = db.query(Payment).filter(
                    Payment.gateway_order_id == order_id
                ).first()
                
                if not payment:
                    logger.error(f"Payment not found for order_id: {order_id}")
                    return
                
                # Handle successful payment
                self.handle_payment_success(db, payment, payment_id, payment_entity)
                logger.info(f"Payment {payment.id} marked as successful")
                
            elif event == 'payment.failed':
                # Payment failed
                order_id = payment_entity.get('order_id')
                
                if not order_id:
                    logger.error("No order_id in payment.failed webhook")
                    return
                
                # Find payment by gateway order ID
                payment = db.query(Payment).filter(
                    Payment.gateway_order_id == order_id
                ).first()
                
                if not payment:
                    logger.error(f"Payment not found for order_id: {order_id}")
                    return
                
                # Handle failed payment
                self.handle_payment_failure(db, payment, payment_entity)
                logger.info(f"Payment {payment.id} marked as failed")
                
            elif event == 'order.paid':
                # Order paid event (alternative to payment.captured)
                order_id = order_entity.get('id')
                
                if not order_id:
                    logger.error("No order_id in order.paid webhook")
                    return
                
                payment = db.query(Payment).filter(
                    Payment.gateway_order_id == order_id
                ).first()
                
                if payment and payment.status != 'SUCCESS':
                    # Mark as successful if not already
                    payment_id = order_entity.get('payments', [{}])[0].get('id') if order_entity.get('payments') else None
                    self.handle_payment_success(db, payment, payment_id, order_entity)
                    
            else:
                logger.info(f"Unhandled webhook event: {event}")
                
        except Exception as e:
            logger.error(f"Error processing webhook: {e}", exc_info=True)
            db.rollback()
            raise


# Global payment service instance
payment_service = PaymentService()
