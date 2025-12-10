export const dummyBookings = [
    {
        userId: "dummy-user-1",
        userName: "Rahul Dravid",
        userEmail: "rahul@example.com",
        // courtId needs to be mapped dynamically
        courtName: "Smash Arena Badminton",
        sportType: "badminton",
        date: "2025-12-15",
        startTime: "10:00",
        endTime: "10:30",
        duration: 30,
        amount: 400,
        paymentStatus: "completed",
        paymentId: "pay_12345",
        razorpayOrderId: "order_12345",
        bookingStatus: "confirmed",
        cancelReason: null
    },
    {
        userId: "dummy-user-2",
        userName: "Sunil Chhetri",
        userEmail: "sunil@example.com",
        // courtId needs to be mapped dynamically
        courtName: "Kickoff Turf",
        sportType: "football",
        date: "2025-12-16",
        startTime: "18:00",
        endTime: "19:00",
        duration: 60,
        amount: 1200,
        paymentStatus: "completed",
        paymentId: "pay_67890",
        razorpayOrderId: "order_67890",
        bookingStatus: "confirmed",
        cancelReason: null
    },
    {
        userId: "dummy-user-1",
        userName: "Rahul Dravid",
        userEmail: "rahul@example.com",
        // courtId needs to be mapped dynamically
        courtName: "Ace Tennis Academy",
        sportType: "tennis",
        date: "2025-12-18",
        startTime: "07:00",
        endTime: "08:00",
        duration: 60,
        amount: 600,
        paymentStatus: "pending", // Example of pending booking
        paymentId: null,
        razorpayOrderId: "order_11223",
        bookingStatus: "pending",
        cancelReason: null
    }
];
