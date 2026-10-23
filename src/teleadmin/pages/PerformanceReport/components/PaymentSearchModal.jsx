import PageJump from '../../../../components/PageJump';
import { useState } from 'react';
import { X, Search, User, Phone, Mail, MapPin, Calendar, CreditCard, CheckCircle } from 'lucide-react-teleadmin';
import telecallersApi from '../../../services/api/telecallersApi';

const PaymentSearchModal = ({ onClose }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [users, setUsers] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const handleSearch = async (page = 1) => {
        // If it's a new search (page 1), validate input
        // if (page === 1 && !searchTerm.trim()) {
        //     setError('Please enter a mobile number or ID');
        //     return;
        // }

        setIsSearching(true);
        setError(null);
        if (page === 1) {
            setUsers([]);
            setSelectedUser(null);
        }

        try {
            const response = await telecallersApi.searchPayment(searchTerm.trim(), page);

            if (response.success) {
                setUsers(response.users || []);
                setPagination(response.meta);
                setCurrentPage(page);

                if (page === 1 && (!response.users || response.users.length === 0)) {
                    // Keep error logic or let empty state handle it
                }
            } else {
                setUsers([]);
                setError(response.message || 'No users found');
            }

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Error occurred while searching.');
            setUsers([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= (pagination?.last_page || 1)) {
            handleSearch(newPage);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch(1);
        }
    };

    const formatCurrency = (amount) => {
        return `₹${parseFloat(amount || 0).toFixed(2)}`;
    };

    // Helper to extract latest payment status
    const getPaymentStatusInfo = (user) => {
        const payments = user.full_details?.payments || [];
        if (payments.length === 0) {
            return { display: 'No payment', color: 'bg-gray-100 text-gray-700' };
        }

        const latestPayment = [...payments].sort((a, b) => new Date(b.start_at) - new Date(a.start_at))[0];

        if (latestPayment) {
            return { display: 'Captured', color: 'bg-green-100 text-green-700' };
        }
        return { display: latestPayment.payment_status || 'Unknown', color: 'bg-yellow-100 text-yellow-700' };
    };

    const renderUserList = () => (
        <div className="space-y-4">
            {users.length === 0 && !isSearching ? (
                <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No users found. Try a different search.</p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-sm text-gray-500 border-b border-gray-200">
                                    <th className="py-3 px-2">Name</th>
                                    <th className="py-3 px-2">Role</th>
                                    <th className="py-3 px-2">Mobile / ID</th>
                                    <th className="py-3 px-2">Payment Status</th>
                                    <th className="py-3 px-2 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-gray-700">
                                {users.map((user) => {
                                    const { display, color } = getPaymentStatusInfo(user);
                                    return (
                                        <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                                            <td className="py-3 px-2 font-medium">{user.name || 'N/A'}</td>
                                            <td className="py-3 px-2 capitalize">{user.role}</td>
                                            <td className="py-3 px-2">
                                                <div className="text-xs text-gray-500">{user.unique_id}</div>
                                                <div>{user.mobile}</div>
                                            </td>
                                            <td className="py-3 px-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${color}`}>
                                                    {display}
                                                </span>
                                            </td>
                                            <td className="py-3 px-2 text-right">
                                                <button
                                                    onClick={() => setSelectedUser(user)}
                                                    className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-xs font-semibold"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {pagination && pagination.last_page > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-600">
                                Page {pagination.current_page} of {pagination.last_page} ({pagination.total} results)
                            </span>
                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === pagination.last_page}
                                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg disabled:opacity-50 hover:bg-gray-200 transition-colors"
                            >
                                Next
                            </button>
                            <PageJump page={currentPage} totalPages={pagination.last_page} onGo={handlePageChange} />
                        </div>
                    )}
                </>
            )}
        </div>
    );

    const renderUserDetails = () => {
        const user = selectedUser;
        const payments = user.full_details?.payments || [];
        const hasPayment = payments.length > 0;
        let latestPayment = null;
        let statusDisplay = 'No payment done';
        let statusColor = 'bg-gray-100 text-gray-700';

        if (hasPayment) {
            latestPayment = [...payments].sort((a, b) => new Date(b.start_at) - new Date(a.start_at))[0];
            const info = getPaymentStatusInfo(user);
            statusDisplay = info.display;
            statusColor = info.color;
        }

        return (
            <div className="space-y-6">
                {/* Back Button */}
                <div>
                    <button
                        onClick={() => setSelectedUser(null)}
                        className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2"
                    >
                        &larr; Back to list
                    </button>
                </div>

                {/* Payment Status Badge */}
                <div className="flex items-center justify-center">
                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusColor}`}>
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-semibold capitalize">{statusDisplay}</span>
                    </div>
                </div>

                {/* Payment Details Card */}
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-purple-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        Payment Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Amount</p>
                            <p className="font-semibold text-green-600 text-xl">
                                {latestPayment ? formatCurrency(latestPayment.amount) : '₹0.00'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Subscription Start</p>
                            <p className="font-semibold text-gray-900">
                                {latestPayment ? (latestPayment.start_at) : 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Subscription End</p>
                            <p className="font-semibold text-gray-900">
                                {latestPayment ? (latestPayment.end_at) : 'N/A'}
                            </p>
                        </div>
                    </div>
                    {/* Show all payments if multiple? For now just latest as per original design, or list? 
                         Original design only showed one card. I will stick to latest for now to match UI. 
                      */}
                </div>

                {/* User Details Card */}
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-pink-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5 text-purple-600" />
                        User Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Name</p>
                            <p className="font-semibold text-gray-900">{user.name || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Unique ID</p>
                            <p className="font-semibold text-gray-900">{user.unique_id || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Phone className="w-4 h-4" />
                                Mobile
                            </p>
                            <p className="font-semibold text-gray-900">{user.mobile || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                Email
                            </p>
                            <p className="font-semibold text-gray-900 break-all">{user.email || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Role</p>
                            <p className="font-semibold text-gray-900 capitalize">{user.role || 'N/A'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600 flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                State
                            </p>
                            <p className="font-semibold text-gray-900">{user.states || 'N/A'}</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-t-2xl z-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white">
                            {selectedUser ? 'User Details' : 'Search Payment'}
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Search Input - Hide on detail view? Or keep it? keeping it allows quick switch, but might crowd UI. 
                        Common pattern: Keep search if in list view. If in detail view, maybe hide or show small?
                        Let's hide it in detail view to focus on content.
                     */}
                    {!selectedUser && (
                        <div className="mt-4 flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Enter mobile number, name, or unique ID"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    className="w-full flex items-center h-12 !pl-10 pr-4 py-3 rounded-lg bg-white/20 text-white placeholder-white/70 focus:outline-hidden focus:ring-2 focus:ring-white/50 border-transparent placeholder-gray-200"
                                />
                            </div>
                            <button
                                onClick={() => handleSearch(1)}
                                disabled={isSearching}
                                className="px-6 py-3 bg-white text-purple-600 font-semibold rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSearching ? 'Searching...' : 'Search'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                            <p className="text-red-700 text-center">{error}</p>
                        </div>
                    )}

                    {isSearching ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">Searching...</p>
                        </div>
                    ) : (
                        selectedUser ? renderUserDetails() : renderUserList()
                    )}
                </div>
            </div>
        </div >
    );
};

export default PaymentSearchModal;
