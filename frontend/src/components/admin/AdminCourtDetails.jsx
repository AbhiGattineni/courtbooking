import { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from "firebase/firestore";
import { db } from "../../services/firebase";
import DateStrip from "../public/DateStrip";
import {
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaTimes,
  FaEdit,
  FaBan,
  FaSave,
  FaTrash,
} from "react-icons/fa";
import {
  getCourtSchedule,
  updateOperatingHours,
  blockTimeSlot,
  unblockTimeSlot,
} from "../../services/scheduleService";
import Button from "../common/Button";
import ConfirmationModal from "../common/ConfirmationModal";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

export default function AdminCourtDetails({ court, onClose }) {
  const [activeTab, setActiveTab] = useState("bookings"); // 'bookings', 'hours', 'blocks'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [summary, setSummary] = useState({ total: 0, revenue: 0 });
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  // Operating hours editing
  const [editingDay, setEditingDay] = useState(null);
  const [tempHours, setTempHours] = useState({
    open: "",
    close: "",
    isOpen: true,
  });
  const [savingHours, setSavingHours] = useState(false);

  // Block slots
  const [blockDate, setBlockDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [blockStartTime, setBlockStartTime] = useState("10:00");
  const [blockEndTime, setBlockEndTime] = useState("12:00");
  const [blockReason, setBlockReason] = useState("");
  const [blockingSlot, setBlockingSlot] = useState(false);
  const [blockedSlots, setBlockedSlots] = useState([]);
  const [deleteBlockModal, setDeleteBlockModal] = useState({
    isOpen: false,
    slot: null,
  });

  // Constants for slots (06:00 to 22:00)
  const allSlots = [];
  for (let h = 6; h < 22; h++) {
    allSlots.push(`${h}:00`);
    allSlots.push(`${h}:30`);
  }

  // Load schedule
  useEffect(() => {
    if (!court) return;

    const loadSchedule = async () => {
      try {
        const scheduleData = await getCourtSchedule(court.id);
        setSchedule(scheduleData);
        setBlockedSlots(scheduleData.blockedSlots || []);
        setLoading(false);
      } catch (error) {
        console.error("Error loading schedule:", error);
        setLoading(false);
      }
    };

    loadSchedule();
  }, [court]);

  // Load bookings
  useEffect(() => {
    if (!court || !selectedDate) return;

    const dateStr = selectedDate.toLocaleDateString("en-CA");
    const q = query(
      collection(db, "bookings"),
      where("courtId", "==", court.id),
      where("date", "==", dateStr)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const bookingData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBookings(bookingData);

      const activeBookings = bookingData.filter(
        (b) => b.status !== "cancelled"
      );
      setSummary({
        total: activeBookings.length,
        revenue: activeBookings.reduce((sum, b) => sum + (b.price || 0), 0),
      });
    });

    return () => unsubscribe();
  }, [court, selectedDate]);

  // Handle operating hours edit
  const startEditingHours = (day) => {
    const dayHours = schedule?.operatingHours?.[day] || {
      open: "06:00",
      close: "22:00",
      isOpen: true,
    };
    setEditingDay(day);
    setTempHours(dayHours);
  };

  const cancelEditingHours = () => {
    setEditingDay(null);
    setTempHours({ open: "", close: "", isOpen: true });
  };

  const saveOperatingHours = async () => {
    if (!editingDay) return;
    setSavingHours(true);
    try {
      await updateOperatingHours(court.id, editingDay, tempHours);
      // Update local state
      setSchedule((prev) => ({
        ...prev,
        operatingHours: {
          ...prev?.operatingHours,
          [editingDay]: tempHours,
        },
      }));
      setEditingDay(null);
    } catch (error) {
      console.error("Error saving operating hours:", error);
      alert("Failed to save operating hours");
    } finally {
      setSavingHours(false);
    }
  };

  // Handle block slot
  const handleBlockSlot = async () => {
    if (!blockDate || !blockStartTime || !blockEndTime || !blockReason.trim()) {
      alert("Please fill all fields");
      return;
    }

    setBlockingSlot(true);
    try {
      await blockTimeSlot(court.id, {
        date: blockDate,
        startTime: blockStartTime,
        endTime: blockEndTime,
        reason: blockReason,
      });

      // Refresh schedule
      const scheduleData = await getCourtSchedule(court.id);
      setSchedule(scheduleData);
      setBlockedSlots(scheduleData.blockedSlots || []);

      // Reset form
      setBlockReason("");
      alert("Time slot blocked successfully");
    } catch (error) {
      console.error("Error blocking slot:", error);
      alert("Failed to block time slot");
    } finally {
      setBlockingSlot(false);
    }
  };

  const handleUnblockSlot = async () => {
    if (!deleteBlockModal.slot) return;
    const { date, startTime, endTime } = deleteBlockModal.slot;

    try {
      await unblockTimeSlot(court.id, date, startTime, endTime);

      // Refresh schedule
      const scheduleData = await getCourtSchedule(court.id);
      setSchedule(scheduleData);
      setBlockedSlots(scheduleData.blockedSlots || []);

      setDeleteBlockModal({ isOpen: false, slot: null });
    } catch (error) {
      console.error("Error unblocking slot:", error);
      alert("Failed to unblock time slot");
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
        <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex items-center justify-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto animate-slide-in-right">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 z-10 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{court.name}</h2>
            <p className="text-gray-500">
              {court.location} • {court.sportType}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="text-xl text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("bookings")}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === "bookings"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaCalendarAlt className="inline mr-2" />
              Bookings
            </button>
            <button
              onClick={() => setActiveTab("hours")}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === "hours"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaClock className="inline mr-2" />
              Operating Hours
            </button>
            <button
              onClick={() => setActiveTab("blocks")}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === "blocks"
                  ? "border-b-2 border-blue-600 text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <FaBan className="inline mr-2" />
              Block Slots
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Bookings Tab */}
          {activeTab === "bookings" && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-600 font-bold uppercase">
                    Bookings Today
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {summary.total}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                  <p className="text-sm text-green-600 font-bold uppercase">
                    Est. Revenue
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    ₹{summary.revenue}
                  </p>
                </div>
              </div>

              {/* Date Picker */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <FaCalendarAlt className="mr-2 text-blue-500" /> Select Date
                </h3>
                <DateStrip
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                />
              </div>

              {/* Slots Grid */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                  <FaClock className="mr-2 text-blue-500" /> Schedule
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {allSlots.map((slot) => {
                    const booking = bookings.find(
                      (b) => b.timeSlot === slot && b.status !== "cancelled"
                    );
                    const [h, m] = slot.split(":");
                    const hour = parseInt(h);
                    const ampm = hour >= 12 ? "PM" : "AM";
                    const displayTime = `${
                      hour > 12 ? hour - 12 : hour
                    }:${m} ${ampm}`;

                    return (
                      <div
                        key={slot}
                        className={`
                                                    flex items-center justify-between p-4 rounded-xl border transition-all
                                                    ${
                                                      booking
                                                        ? "bg-red-50 border-red-100"
                                                        : "bg-white border-gray-100 hover:border-gray-200"
                                                    }
                                                `}
                      >
                        <div className="flex items-center gap-4">
                          <span className="font-mono font-bold text-gray-500 w-20">
                            {displayTime}
                          </span>
                          {booking ? (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-red-500"></div>
                              <div>
                                <p className="font-bold text-gray-900 text-sm">
                                  {booking.userName}
                                </p>
                                <p className="text-xs text-gray-500 uppercase">
                                  {booking.status}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-sm font-medium text-gray-500">
                                Available
                              </span>
                            </div>
                          )}
                        </div>

                        {booking && (
                          <div className="text-right">
                            <span className="text-xs font-bold bg-white border border-gray-200 px-2 py-1 rounded">
                              ID: {booking.id.slice(0, 4)}...
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Operating Hours Tab */}
          {activeTab === "hours" && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-800">
                Edit Operating Hours
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Set start and end times for each day of the week
              </p>

              {DAYS.map((day) => {
                const dayHours = schedule?.operatingHours?.[day.key] || {
                  open: "06:00",
                  close: "22:00",
                  isOpen: true,
                };
                const isEditing = editingDay === day.key;

                return (
                  <div
                    key={day.key}
                    className="bg-white border border-gray-200 rounded-xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-gray-800">{day.label}</h4>
                      {!isEditing ? (
                        <button
                          onClick={() => startEditingHours(day.key)}
                          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          <FaEdit /> Edit
                        </button>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            onClick={saveOperatingHours}
                            disabled={savingHours}
                            className="flex items-center gap-2 text-green-600 hover:text-green-700 text-sm font-medium disabled:opacity-50"
                          >
                            <FaSave /> {savingHours ? "Saving..." : "Save"}
                          </button>
                          <button
                            onClick={cancelEditingHours}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-700 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Open Time
                          </label>
                          <input
                            type="time"
                            value={tempHours.open}
                            onChange={(e) =>
                              setTempHours({
                                ...tempHours,
                                open: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Close Time
                          </label>
                          <input
                            type="time"
                            value={tempHours.close}
                            onChange={(e) =>
                              setTempHours({
                                ...tempHours,
                                close: e.target.value,
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Status
                          </label>
                          <select
                            value={tempHours.isOpen ? "open" : "closed"}
                            onChange={(e) =>
                              setTempHours({
                                ...tempHours,
                                isOpen: e.target.value === "open",
                              })
                            }
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          >
                            <option value="open">Open</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            dayHours.isOpen
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {dayHours.isOpen ? "Open" : "Closed"}
                        </span>
                        {dayHours.isOpen && (
                          <span className="text-gray-600">
                            {dayHours.open} - {dayHours.close}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Block Slots Tab */}
          {activeTab === "blocks" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">
                  Block Time Slot
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Block specific time slots for maintenance, events, or other
                  purposes
                </p>

                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={blockDate}
                        onChange={(e) => setBlockDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={blockStartTime}
                        onChange={(e) => setBlockStartTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={blockEndTime}
                        onChange={(e) => setBlockEndTime(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason
                      </label>
                      <input
                        type="text"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="e.g., Maintenance, Event"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleBlockSlot}
                    disabled={blockingSlot}
                    className="w-full"
                  >
                    {blockingSlot ? "Blocking..." : "Block Time Slot"}
                  </Button>
                </div>
              </div>

              {/* Blocked Slots List */}
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Blocked Slots
                </h3>
                {blockedSlots.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No blocked slots
                  </div>
                ) : (
                  <div className="space-y-2">
                    {blockedSlots.map((slot, index) => (
                      <div
                        key={index}
                        className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-gray-900">
                            {new Date(slot.date).toLocaleDateString("en-US", {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {slot.startTime} - {slot.endTime}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {slot.reason}
                          </p>
                        </div>
                        <button
                          onClick={() =>
                            setDeleteBlockModal({ isOpen: true, slot })
                          }
                          className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Unblock"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Unblock Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteBlockModal.isOpen}
        onClose={() => setDeleteBlockModal({ isOpen: false, slot: null })}
        onConfirm={handleUnblockSlot}
        title="Unblock Time Slot?"
        message={`Are you sure you want to unblock ${deleteBlockModal.slot?.date} from ${deleteBlockModal.slot?.startTime} to ${deleteBlockModal.slot?.endTime}?`}
      />
    </div>
  );
}
