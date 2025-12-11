import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import { useAuth } from "../../contexts/AuthContext";
import { getCourtSchedule } from "../../services/scheduleService";
import Card from "../common/Card";
import ConfirmationModal from "../common/ConfirmationModal";
import { FaClock, FaStar } from "react-icons/fa";
import { FaFutbol, FaBasketballBall, FaTrophy } from "react-icons/fa";
import { MdSportsCricket, MdSportsTennis } from "react-icons/md";
import { GiShuttlecock } from "react-icons/gi";

export default function CourtCard({ court, selectedDate }) {
  const [slots, setSlots] = useState([]);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [processing, setProcessing] = useState(false);

  // Generate 30-min slots
  useEffect(() => {
    const generateTimeSlots = () => {
      const times = [];
      for (let hour = 6; hour < 22; hour++) {
        const hourFormatted = hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? "PM" : "AM";

        times.push({
          id: `${hour}:00`,
          display: `${hourFormatted}:00 ${ampm}`,
          hour: hour,
          minute: 0,
        });

        times.push({
          id: `${hour}:30`,
          display: `${hourFormatted}:30 ${ampm}`,
          hour: hour,
          minute: 30,
        });
      }
      setSlots(times);
    };
    generateTimeSlots();
  }, []);

  // Load blocked slots from schedule
  useEffect(() => {
    if (!court.id || !selectedDate) return;

    const loadBlockedSlots = async () => {
      try {
        const schedule = await getCourtSchedule(court.id);
        const dateStr = selectedDate.toLocaleDateString("en-CA");
        const adminBlocked = (schedule?.blockedSlots || [])
          .filter((blocked) => blocked.date === dateStr)
          .flatMap((blocked) => {
            const slots = [];
            const startMinutes = timeToMinutes(blocked.startTime);
            const endMinutes = timeToMinutes(blocked.endTime);

            for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
              const hours = Math.floor(minutes / 60);
              const mins = minutes % 60;
              slots.push(`${hours}:${mins.toString().padStart(2, "0")}`);
            }
            return slots;
          });

        setBlockedSlots(adminBlocked);
      } catch (error) {
        console.error("Error loading blocked slots:", error);
      }
    };

    loadBlockedSlots();
  }, [court.id, selectedDate]);

  // Listen for bookings
  useEffect(() => {
    if (!court.id || !selectedDate) return;

    const dateStr = selectedDate.toLocaleDateString("en-CA");
    const q = query(
      collection(db, "bookings"),
      where("courtId", "==", court.id),
      where("date", "==", dateStr)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const booked = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          if (data.status === "cancelled") return null;

          if (data.createdAt) {
            const created = data.createdAt.toDate();
            const now = new Date();
            const diffMins = (now - created) / 1000 / 60;

            if (data.status === "reserved" && diffMins > 5) return null;
            if (data.status === "pending" && diffMins > 10) return null;
          }

          return data.timeSlot;
        })
        .filter(Boolean);

      setBookedSlots(booked);
    });

    return () => unsubscribe();
  }, [court.id, selectedDate]);

  const timeToMinutes = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const handleSlotClick = (slotId) => {
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter((id) => id !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };

  // ✅ FIXED: Only show modal, don't create bookings yet
  const handleBooking = () => {
    if (!currentUser) {
      navigate("/login", { state: { from: location } });
      return;
    }

    if (selectedSlots.length === 0) return;

    // Just show the confirmation modal - NO DB WRITES YET
    setShowSuccessModal(true);
  };

  // ✅ NEW: Create bookings when modal is confirmed
  const handleConfirmBooking = async () => {
    setProcessing(true);
    const dateStr = selectedDate.toLocaleDateString("en-CA");

    try {
      // Create "Reserved" bookings for each slot
      const promises = selectedSlots.map((slot) =>
        addDoc(collection(db, "bookings"), {
          courtId: court.id,
          courtName: court.name,
          userId: currentUser.uid,
          userName: currentUser.displayName || "User",
          date: dateStr,
          timeSlot: slot,
          status: "reserved",
          price: court.pricePerSlot,
          createdAt: serverTimestamp(),
        })
      );

      await Promise.all(promises);

      // Navigate to payment with booking data
      const bookingData = {
        court: court,
        slots: selectedSlots,
        date: dateStr,
        totalAmount: totalPrice,
      };

      setShowSuccessModal(false);
      setSelectedSlots([]);
      navigate("/payment", { state: bookingData });
    } catch (error) {
      console.error(error);
      alert("Booking failed. Please try again.");
      setShowSuccessModal(false);
    } finally {
      setProcessing(false);
    }
  };

  const getSportIcon = (type) => {
    switch (type.toLowerCase()) {
      case "cricket":
        return <MdSportsCricket className="text-6xl text-blue-500 opacity-20" />;
      case "football":
        return <FaFutbol className="text-6xl text-green-500 opacity-20" />;
      case "badminton":
        return <GiShuttlecock className="text-6xl text-purple-500 opacity-20" />;
      case "tennis":
        return <MdSportsTennis className="text-6xl text-yellow-500 opacity-20" />;
      case "basketball":
        return <FaBasketballBall className="text-6xl text-orange-500 opacity-20" />;
      default:
        return <FaTrophy className="text-6xl text-gray-400 opacity-20" />;
    }
  };

  const totalPrice = selectedSlots.length * court.pricePerSlot;

  return (
    <>
      <Card className="hover:shadow-xl transition-shadow duration-300 border border-gray-100 flex flex-col md:flex-row overflow-hidden bg-white">
        {/* Image Section */}
        <div className="md:w-1/3 bg-gray-200 relative min-h-[250px] md:min-h-full group overflow-hidden">
          <img
            src={
              court.images && court.images.length > 0
                ? court.images[0]
                : court.image ||
                  `https://source.unsplash.com/800x600/?${court.sportType || "sport"}`
            }
            alt={court.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                "https://images.unsplash.com/photo-1526676037777-05a232554f77?auto=format&fit=crop&q=80&w=800";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
            <span className="bg-blue-600 text-white px-3 py-1 text-xs font-bold rounded shadow uppercase tracking-wider">
              {court.sportType}
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="md:w-2/3 p-6 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-2xl font-bold text-gray-900">{court.name}</h3>
                <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-bold">
                  <FaStar className="text-sm" />
                  {court.rating || "New"}
                </span>
              </div>
              <p className="text-gray-500 flex items-center gap-1 text-sm">
                <span className="text-lg">📍</span> {court.location}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-blue-600">
                ₹{court.pricePerSlot}
              </span>
              <span className="text-xs text-gray-400 block font-medium">/ 30 MINS</span>
            </div>
          </div>

          <div className="mb-6 space-y-3">
            {court.description && (
              <p className="text-gray-600 text-sm line-clamp-2" title={court.description}>
                {court.description}
              </p>
            )}

            {court.facilities && (
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(court.facilities)
                  ? court.facilities
                  : court.facilities.split(",")
                ).map((fac, idx) => (
                  <span
                    key={idx}
                    className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium border border-gray-200"
                  >
                    {fac.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm font-bold text-gray-700 mb-3 flex items-center uppercase tracking-wide">
              <FaClock className="mr-2 text-blue-500" />
              Available Slots ({selectedDate.toLocaleDateString()})
            </p>

            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-52 overflow-y-auto custom-scrollbar p-1">
              {slots.map((slot) => {
                const isBooked = bookedSlots.includes(slot.id);
                const isBlocked = blockedSlots.includes(slot.id);
                const isSelected = selectedSlots.includes(slot.id);
                const isUnavailable = isBooked || isBlocked;

                return (
                  <button
                    key={slot.id}
                    disabled={isUnavailable}
                    onClick={() => handleSlotClick(slot.id)}
                    className={`
                      text-xs py-2 px-1 rounded border transition-all relative font-bold
                      ${
                        isUnavailable
                          ? isBlocked
                            ? "bg-orange-100 text-orange-400 border-orange-200 cursor-not-allowed"
                            : "bg-gray-100 text-gray-300 border-gray-100 cursor-not-allowed"
                          : isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg transform scale-105 z-10"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm"
                      }
                    `}
                    title={
                      isBlocked ? "Blocked by admin" : isBooked ? "Already booked" : ""
                    }
                  >
                    {slot.display}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
            <div>
              <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                Total Payable
              </p>
              <p className="text-3xl font-extrabold text-gray-900">₹{totalPrice}</p>
            </div>
            <button
              onClick={handleBooking}
              disabled={selectedSlots.length === 0 || processing}
              className={`
                px-10 py-4 rounded-xl font-bold shadow-xl transition-all transform flex items-center gap-2
                ${
                  selectedSlots.length > 0 && !processing
                    ? "bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-1 hover:shadow-2xl"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }
              `}
            >
              {processing ? "Processing..." : "Proceed to Pay"}
            </button>
          </div>
        </div>
      </Card>

      {/* ✅ FIXED: Proper handlers */}
      <ConfirmationModal
        isOpen={showSuccessModal}
        onClose={() => {
          // Cancel: Just close and clear selection, NO navigation
          setShowSuccessModal(false);
          setSelectedSlots([]);
        }}
        onConfirm={handleConfirmBooking}
        createBookingMode={true}
        title="Confirm Booking"
        message={`Reserve ${selectedSlots.length} slot(s) for ${selectedDate.toLocaleDateString()}? (${selectedSlots.join(", ")})`}
      />
    </>
  );
}
