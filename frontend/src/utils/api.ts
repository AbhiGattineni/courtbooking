/**
 * Simplified API Client
 * Handles all HTTP requests to FastAPI backend
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Type definitions
export interface Venue {
    id: string;
    organization_id: string;
    name: string;
    city?: string;
    pincode?: string;
    address_line1?: string;
    is_active: boolean;
}

export interface Court {
    id: string;
    venue_id: string;
    name: string;
    description?: string;
    min_booking_minutes: number;
    max_booking_minutes: number;
    is_active: boolean;
}

export interface TimeSlot {
    start_time: string;
    end_time: string;
    price: number;
    is_available: boolean;
    is_peak: boolean;
    status: string;
}

export interface Booking {
    id: string;
    user_id: string;
    court_id: string;
    venue_id: string;
    start_time: string;
    end_time: string;
    total_price: number;
    status: string;
    invoice_number?: string;
    created_at: string;
}

class APIClient {
    private baseURL: string;
    private token: string | null = null;

    constructor(baseURL: string) {
        this.baseURL = baseURL;
        if (typeof window !== 'undefined') {
            this.token = localStorage.getItem('auth_token');
        }
    }

    setToken(token: string) {
        this.token = token;
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
        }
    }

    clearToken() {
        this.token = null;
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
        }
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...(options.headers as Record<string, string>),
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(error.detail || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Venues
    async getVenues(): Promise<Venue[]> {
        return this.request('/venues');
    }

    // Courts
    async getCourts(venueId: string): Promise<Court[]> {
        return this.request(`/courts?venue_id=${venueId}`);
    }

    async getCourt(courtId: string): Promise<Court> {
        return this.request(`/courts/${courtId}`);
    }

    // Availability
    async getAvailability(courtId: string, date: string): Promise<TimeSlot[]> {
        return this.request(`/availability?court_id=${courtId}&date=${date}`);
    }

    // Bookings
    async initiateBooking(data: {
        court_id: string;
        start_time: string;
        end_time: string;
    }): Promise<{ booking: Booking; payment: any }> {
        return this.request('/bookings/initiate', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getBooking(bookingId: string): Promise<Booking> {
        return this.request(`/bookings/${bookingId}`);
    }

    async getBookingHistory(): Promise<Booking[]> {
        return this.request('/bookings/history');
    }

    async downloadInvoice(bookingId: string): Promise<Blob> {
        const headers: Record<string, string> = {};
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const response = await fetch(`${this.baseURL}/bookings/${bookingId}/invoice`, {
            headers,
        });

        if (!response.ok) {
            throw new Error('Failed to download invoice');
        }

        return response.blob();
    }
}

const api = new APIClient(API_BASE_URL);
export default api;
