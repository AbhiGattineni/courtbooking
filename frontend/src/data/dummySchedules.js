export const defaultOperatingHours = {
    monday: { open: "06:00", close: "22:00", isOpen: true },
    tuesday: { open: "06:00", close: "22:00", isOpen: true },
    wednesday: { open: "06:00", close: "22:00", isOpen: true },
    thursday: { open: "06:00", close: "22:00", isOpen: true },
    friday: { open: "06:00", close: "22:00", isOpen: true },
    saturday: { open: "07:00", close: "23:00", isOpen: true },
    sunday: { open: "08:00", close: "21:00", isOpen: true }
};

export const dummySpecialDates = [
    {
        date: "2025-12-25",
        isClosed: true,
        reason: "Christmas Holiday",
        hours: null
    },
    {
        date: "2026-01-01",
        isClosed: true,
        reason: "New Year's Day",
        hours: null
    }
];
