"""
Invoice Service - PDF Invoice Generation
Creates PDF invoices with QR codes for confirmed bookings
"""
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph,
    Spacer, Image
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from io import BytesIO
import qrcode
from datetime import datetime
from typing import BinaryIO

from app.models import Booking


class InvoiceService:
    """Service for generating PDF invoices"""
    
    @staticmethod
    def generate_qr_code(data: str) -> BytesIO:
        """
        Generate QR code image.
        
        Args:
            data: Data to encode in QR code
        
        Returns:
            BytesIO containing PNG image
        """
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Save to BytesIO
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        
        return buffer
    
    @staticmethod
    def generate_invoice_pdf(booking: Booking) -> BytesIO:
        """
        Generate PDF invoice for a booking.
        
        Args:
            booking: Booking model instance (must be CONFIRMED)
        
        Returns:
            BytesIO containing PDF file
        """
        buffer = BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )
        
        # Container for PDF elements
        elements = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#1a237e'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        header_style = ParagraphStyle(
            'CustomHeader',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1a237e'),
            spaceAfter=12
        )
        
        # Title
        elements.append(Paragraph("BOOKING INVOICE", title_style))
        elements.append(Spacer(1, 0.2 * inch))
        
        # Invoice details table
        invoice_data = [
            ['Invoice Number:', str(booking.invoice_number)],
            ['Booking ID:', str(booking.id)],
            ['Date:', booking.created_at.strftime('%d %B %Y')],
            ['Status:', booking.status]
        ]
        
        invoice_table = Table(invoice_data, colWidths=[2 * inch, 4 * inch])
        invoice_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(invoice_table)
        elements.append(Spacer(1, 0.3 * inch))
        
        # Customer details
        elements.append(Paragraph("Customer Details", header_style))
        
        customer_data = [
            ['Name:', f"{booking.user.first_name} {booking.user.last_name or ''}"],
            ['Email:', booking.user.email],
            ['Phone:', booking.user.phone or 'N/A'],
            ['Address:', booking.user.address or 'N/A']
        ]
        
        customer_table = Table(customer_data, colWidths=[1.5 * inch, 4 * inch])
        customer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(customer_table)
        elements.append(Spacer(1, 0.3 * inch))
        
        # Booking details
        elements.append(Paragraph("Booking Details", header_style))
        
        booking_data = [
            ['Venue:', booking.venue.name],
            ['Court:', booking.court.name],
            ['Location:', f"{booking.venue.city or ''}, {booking.venue.state or ''}"],
            ['Date:', booking.start_time.strftime('%d %B %Y')],
            ['Time:', f"{booking.start_time.strftime('%I:%M %p')} - {booking.end_time.strftime('%I:%M %p')}"],
            ['Duration:', f"{int((booking.end_time - booking.start_time).total_seconds() / 60)} minutes"]
        ]
        
        booking_table = Table(booking_data, colWidths=[1.5 * inch, 4 * inch])
        booking_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(booking_table)
        elements.append(Spacer(1, 0.3 * inch))
        
        # Payment summary
        elements.append(Paragraph("Payment Summary", header_style))
        
        payment_data = [
            ['Description', 'Amount'],
            ['Court Booking Fee', f"₹ {float(booking.total_price):.2f}"],
            ['', ''],
            ['Total Amount', f"₹ {float(booking.total_price):.2f}"]
        ]
        
        payment_table = Table(payment_data, colWidths=[4 * inch, 2 * inch])
        payment_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('LINEABOVE', (0, 0), (-1, 0), 1, colors.black),
            ('LINEABOVE', (0, -1), (-1, -1), 1, colors.black),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#f0f0f0')),
        ]))
        
        elements.append(payment_table)
        elements.append(Spacer(1, 0.3 * inch))
        
        # QR Code
        qr_data = f"BOOKING:{booking.id}|INVOICE:{booking.invoice_number}|AMOUNT:{booking.total_price}"
        qr_buffer = InvoiceService.generate_qr_code(qr_data)
        
        qr_image = Image(qr_buffer, width=1.5 * inch, height=1.5 * inch)
        
        qr_table = Table([[qr_image]], colWidths=[1.5 * inch])
        qr_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ]))
        
        elements.append(Paragraph("Scan QR Code for Verification", styles['Normal']))
        elements.append(Spacer(1, 0.1 * inch))
        elements.append(qr_table)
        elements.append(Spacer(1, 0.2 * inch))
        
        # Footer
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontSize=8,
            textColor=colors.grey,
            alignment=TA_CENTER
        )
        
        elements.append(Paragraph(
            "Thank you for booking with us!<br/>For support, contact your venue directly.",
            footer_style
        ))
        
        # Build PDF
        doc.build(elements)
        
        buffer.seek(0)
        return buffer
    
    @staticmethod
    def get_invoice_filename(booking: Booking) -> str:
        """
        Get standardized filename for invoice.
        
        Args:
            booking: Booking model instance
        
        Returns:
            Filename string
        """
        return f"invoice_{booking.invoice_number}.pdf"


# Global invoice service instance
invoice_service = InvoiceService()
