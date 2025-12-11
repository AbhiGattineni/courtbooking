import { useState, useEffect } from 'react';
import { collection, onSnapshot, addDoc, deleteDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { FaPlus, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import Card from '../common/Card';
import Button from '../common/Button';
import ConfirmationModal from '../common/ConfirmationModal';
import LoadingSpinner from '../common/LoadingSpinner';
import AdminCourtDetails from './AdminCourtDetails';
import Pagination from '../common/Pagination';

// Constants for sport types
const sportTypes = [
    { id: 'cricket', label: 'Cricket' },
    { id: 'football', label: 'Football' },
    { id: 'badminton', label: 'Badminton' },
    { id: 'tennis', label: 'Tennis' },
    { id: 'basketball', label: 'Basketball' }
];

export default function CourtManagement() {
    const [courts, setCourts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedCourt, setSelectedCourt] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null, name: '' });
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });

    const [formData, setFormData] = useState({
        name: '',
        location: '',
        sportType: 'cricket',
        pricePerSlot: '',
        description: '',
        facilities: '',
        image: '',
        isActive: true
    });

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'courts'), (snapshot) => {
            const courtsList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setCourts(courtsList);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await addDoc(collection(db, 'courts'), {
                name: formData.name,
                location: formData.location,
                sportType: formData.sportType,
                pricePerSlot: Number(formData.pricePerSlot),
                description: formData.description,
                facilities: formData.facilities,
                images: formData.image ? [formData.image] : [],
                rating: 'New',
                isActive: true,
                createdAt: serverTimestamp()
            });

            setShowAddModal(false);
            setFormData({
                name: '',
                location: '',
                sportType: 'cricket',
                pricePerSlot: '',
                description: '',
                facilities: '',
                image: '',
                isActive: true
            });

            setSuccessModal({ isOpen: true, message: 'New court has been successfully created.' });
        } catch (error) {
            console.error("Error adding court: ", error);
            alert("Failed to add court: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (court) => {
        setConfirmModal({
            isOpen: true,
            id: court.id,
            name: court.name
        });
    };

    const confirmDelete = async () => {
        if (!confirmModal.id) return;
        try {
            await deleteDoc(doc(db, 'courts', confirmModal.id));
        } catch (error) {
            console.error("Error deleting court: ", error);
        }
        setConfirmModal({ isOpen: false, id: null, name: '' });
    };

    const toggleVisibility = async (id, currentStatus) => {
        try {
            await updateDoc(doc(db, 'courts', id), {
                isActive: !currentStatus
            });
        } catch (error) {
            console.error("Error updating status: ", error);
        }
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;
    const paginatedCourts = courts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    if (loading) return <LoadingSpinner />;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Court Management</h2>
                <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
                    <FaPlus /> Add Court
                </Button>
            </div>

            {/* Single Column List */}
            <div className="grid grid-cols-1 gap-4">
                {paginatedCourts.map(court => (
                    <Card
                        key={court.id}
                        className={`relative overflow-hidden group transition-all hover:shadow-md cursor-pointer ${!court.isActive ? 'opacity-75 bg-gray-50' : 'bg-white'}`}
                        onClick={() => setSelectedCourt(court)}
                    >
                        <div className="flex flex-col md:flex-row items-center justify-between p-2">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-bold text-xl text-gray-900">{court.name}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase tracking-wider ${court.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                        {court.isActive ? 'Active' : 'Hidden'}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                    <p className="flex items-center gap-1"><span className="text-lg">🏆</span> {court.sportType}</p>
                                    <p className="flex items-center gap-1"><span className="text-lg">📍</span> {court.location}</p>
                                    <p className="flex items-center gap-1 font-bold text-blue-600"><span className="text-lg">₹</span> {court.pricePerSlot} / 30m</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 mt-4 md:mt-0" onClick={(e) => e.stopPropagation()}>
                                <button
                                    onClick={() => toggleVisibility(court.id, court.isActive)}
                                    className={`p-3 rounded-xl transition-colors ${court.isActive ? 'bg-gray-100 text-gray-600 hover:bg-yellow-100 hover:text-yellow-700' : 'bg-green-100 text-green-700'}`}
                                    title={court.isActive ? "Hide Court" : "Show Court"}
                                >
                                    {court.isActive ? <FaEyeSlash /> : <FaEye />}
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(court)}
                                    className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 hover:shadow-sm transition-colors"
                                    title="Delete Court"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Pagination
                currentPage={currentPage}
                totalItems={courts.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
            />

            {selectedCourt && (
                <AdminCourtDetails
                    court={selectedCourt}
                    onClose={() => setSelectedCourt(null)}
                />
            )}

            {/* Success Modal */}
            <ConfirmationModal
                isOpen={successModal.isOpen}
                onClose={() => setSuccessModal({ ...successModal, isOpen: false })}
                onConfirm={() => setSuccessModal({ ...successModal, isOpen: false })}
                title="Success"
                message={successModal.message}
                createBookingMode={true}
                confirmText="Proceed"
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmDelete}
                title="Delete Court?"
                message={`Are you sure you want to delete "${confirmModal.name}"? This action cannot be undone.`}
                confirmText="Delete"
                isDanger={true}
            />

            {/* Add Court Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 animate-fade-in-up overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Add New Court</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Court Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. Royal Arena"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Sport Type</label>
                                    <select
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all cursor-pointer bg-white"
                                        value={formData.sportType}
                                        onChange={(e) => setFormData({ ...formData, sportType: e.target.value })}
                                    >
                                        {sportTypes.map(type => (
                                            <option key={type.id} value={type.id}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="e.g. Indiranagar"
                                        value={formData.location}
                                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Price Per Slot (₹)</label>
                                    <input
                                        type="number"
                                        required
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        placeholder="0"
                                        min="0"
                                        value={formData.pricePerSlot}
                                        onChange={(e) => setFormData({ ...formData, pricePerSlot: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <textarea
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Brief description..."
                                    rows="2"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Facilities</label>
                                <input
                                    type="text"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="e.g. Parking, Water"
                                    value={formData.facilities}
                                    onChange={(e) => setFormData({ ...formData, facilities: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Court Image URL</label>
                                <input
                                    type="url"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="https://example.com/image.jpg"
                                    value={formData.image}
                                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Optional: Enter a direct URL to the court image</p>
                            </div>

                            <div className="flex gap-3 mt-6 pt-2">
                                <Button type="submit" disabled={loading} className="flex-1 shadow-md">
                                    {loading ? 'Creating...' : 'Add Court'}
                                </Button>
                                <Button type="button" variant="secondary" className="flex-1 bg-gray-100 hover:bg-gray-200" onClick={() => setShowAddModal(false)}>Cancel</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
