import { useState, useEffect } from 'react';
import { collection, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../services/firebase';
// import { httpsCallable } from 'firebase/functions'; // Unused for now
import Card from '../common/Card';
import Button from '../common/Button';
import ConfirmationModal from '../common/ConfirmationModal';
import Pagination from '../common/Pagination';

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, userId: null, role: '' });
    const [message, setMessage] = useState({ type: '', text: '' }); // For Success/Error feedback

    useEffect(() => {
        // In a real app, this should probably not be a realtime listener on ALL users for performance.
        // But for this project scope, it's fine.
        const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
            const usersList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setUsers(usersList);
        });
        return () => unsubscribe();
    }, []);

    const handleChangeRole = (userId, newRole) => {
        setConfirmModal({ isOpen: true, userId, role: newRole });
    };

    const confirmChangeRole = async () => {
        const { userId, role } = confirmModal;
        if (!userId) return;

        setLoading(true);
        setConfirmModal({ ...confirmModal, isOpen: false });
        setMessage({ type: 'info', text: 'Updating role...' });

        try {
            // DIRECT UPDATE to Firestore (Bypassing Cloud Function for local testing/simplicity)
            // Ideally, we should also update Auth Custom Claims via Cloud Function in production.
            await updateDoc(doc(db, 'users', userId), {
                role: role
            });

            setMessage({ type: 'success', text: `User role updated to ${role}` });
        } catch (error) {
            console.error("Error changing role: ", error);
            setMessage({ type: 'error', text: `Failed: ${error.message}` });
        } finally {
            setLoading(false);
            // Clear message after 3s
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        }
    };

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Filter
    const filteredUsers = users.filter(user =>
        (user.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">User Management</h2>

            <input
                type="text"
                placeholder="Search users by name or email..."
                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            {message.text && (
                <div className={`p-3 rounded-lg ${message.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {message.text}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="p-4 font-semibold text-gray-600">User</th>
                            <th className="p-4 font-semibold text-gray-600">Current Role</th>
                            <th className="p-4 font-semibold text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map(user => (
                            <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="p-4">
                                    <p className="font-bold text-gray-900">{user.displayName || 'No Name'}</p>
                                    <p className="text-sm text-gray-500">{user.email}</p>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase
                                        ${user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}
                                    `}>
                                        {user.role || 'user'}
                                    </span>
                                </td>
                                <td className="p-4 flex gap-2">
                                    <Button size="sm" variant="secondary" onClick={() => handleChangeRole(user.id, 'manager')} disabled={loading}>Make Manager</Button>
                                    <Button size="sm" variant="outline" onClick={() => handleChangeRole(user.id, 'superadmin')} disabled={loading}>Make Superadmin</Button>
                                    <Button size="sm" variant="danger" onClick={() => handleChangeRole(user.id, 'user')} disabled={loading}>Revoke</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && <p className="p-8 text-center text-gray-500">No users found.</p>}
            </div>

            <Pagination
                currentPage={currentPage}
                totalItems={filteredUsers.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
            />

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmChangeRole}
                title="Change User Role?"
                message={`Are you sure you want to change this user's role to ${confirmModal.role}?`}
                confirmText="Update Role"
                isDanger={false}
            />
        </div>
    );
}
