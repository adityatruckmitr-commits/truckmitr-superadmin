import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import telecallersApi from '../../../services/api/telecallersApi';
import { X, UserPlus, User, Mail, Phone, Lock, Briefcase, Save, AlertCircle } from 'lucide-react-teleadmin';
import toast from 'react-hot-toast';
import { Eye, EyeOff } from 'lucide-react-teleadmin';

const AddTelecallerModal = ({ onClose, selectedEmployee = null, onSuccess }) => {
    const queryClient = useQueryClient();
const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        password: '',
        tc_for: 'welcome-call'
    });

    // Prefill form data when selectedEmployee is provided
    useEffect(() => {
        if (selectedEmployee) {
            setFormData(prev => ({
                ...prev,
                name: selectedEmployee.full_name || '',
                email: selectedEmployee.email || '',
            }));
        }
    }, [selectedEmployee]);

    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        if (errorMessage) setErrorMessage('');
    };

    const addTelecallerMutation = useMutation({
        mutationFn: (payload) => telecallersApi.addTelecaller(payload),
        onSuccess: () => {
            toast.success('Telechamp added successfully');
            queryClient.invalidateQueries({ queryKey: ['telecallers-consolidated'] });
            queryClient.invalidateQueries({ queryKey: ['not-listed-telechamps'] });
            if (onSuccess) onSuccess();
            onClose();
        },
        onError: (error) => {
            const msg = error.response?.data?.message || error.message || 'Failed to add telechamp';
            setErrorMessage(msg);
            toast.error(msg);
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        setErrorMessage('');

        const { name, mobile, email, password, tc_for } = formData;

        if (!name || !mobile || !email || !password || !tc_for) {
            toast.error('Please fill in all fields');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        addTelecallerMutation.mutate(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <UserPlus className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Add New TeleChamp</h2>
                            <p className="text-emerald-100 text-sm opacity-90">
                                {selectedEmployee ? `Adding: ${selectedEmployee.full_name}` : 'Register a new team member'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form Content */}
                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Name */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                <User className="w-4 h-4 text-gray-500" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="e.g. John Doe"
                                disabled={!!selectedEmployee}
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block focus:outline-hidden transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed"
                            />
                        </div>

                        {/* Mobile and Email Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Mobile */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Phone className="w-4 h-4 text-gray-500" />
                                    Mobile Number
                                </label>
                                <input
                                    type="tel"
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleChange}
                                    placeholder="e.g. 9876543210"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block focus:outline-hidden transition-shadow"
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="e.g. john@truckmitr.com"
                                    disabled={!!selectedEmployee}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block focus:outline-hidden transition-shadow disabled:bg-gray-100 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>

                        {/* Password and Process Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Password */}
<div className="space-y-2">
    <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Lock className="w-4 h-4 text-gray-500" />
        Password
    </label>

    <div className="relative">
        <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Min 6 characters"
            className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block focus:outline-hidden transition-shadow"
        />

        <button
            type="button"
            onClick={() => setShowPassword(prev => !prev)}
            className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
            tabIndex={-1}
        >
            {showPassword ? (
                <EyeOff className="w-5 h-5" />
            ) : (
                <Eye className="w-5 h-5" />
            )}
        </button>
    </div>
</div>


                            {/* Process Selection */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                    <Briefcase className="w-4 h-4 text-gray-500" />
                                    Process Assignment
                                </label>
                                <select
                                    name="tc_for"
                                    value={formData.tc_for}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block focus:outline-hidden transition-shadow"
                                >
                                    <option value="welcome-call">Welcome Call</option>
                                    <option value="match-making">Match Making</option>
                                </select>
                            </div>
                        </div>

                        {/* Error Message Display */}
                        {errorMessage && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                                    <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setErrorMessage('')}
                                    className="text-red-400 hover:text-red-500 transition-colors"
                                >
                                    <span className="sr-only">Dismiss</span>
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2 sticky bottom-0 bg-white pb-2">
                            <button
                                type="submit"
                                disabled={addTelecallerMutation.isPending}
                                className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99] focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            >
                                {addTelecallerMutation.isPending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Adding TeleChamp...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Register TeleChamp
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddTelecallerModal;
