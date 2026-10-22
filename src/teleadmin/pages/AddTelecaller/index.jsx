import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import telecallersApi from '../../services/api/telecallersApi';
import { UserPlus, User, Mail, Phone, Lock, Briefcase, Save, AlertCircle } from 'lucide-react-teleadmin';
import toast from 'react-hot-toast';

const AddTelecaller = () => {
    const [formData, setFormData] = useState({
        name: '',
        mobile: '',
        email: '',
        password: '',
        tc_for: 'welcome-call'
    });

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
            toast.success('Telecaller added successfully');
            setFormData({
                name: '',
                mobile: '',
                email: '',
                password: '',
                tc_for: 'welcome-call'
            });
            setErrorMessage('');
        },
        onError: (error) => {
            const msg = error.response?.data?.message || error.message || 'Failed to add telecaller';
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
        <div className="space-y-6 max-w-2xl mx-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl shadow-xl p-8 text-white">
                <div className="flex items-center gap-4">
                    <div className="bg-white/20 p-3 rounded-xl">
                        <UserPlus className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold mb-1">Add New Telecaller</h1>
                        <p className="text-emerald-100 opacity-90">Register a new team member</p>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
                <div className="p-8">
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
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block"
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
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block"
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
                                    placeholder="e.g. admin@truckmitr.com"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block"
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
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min 6 characters"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block"
                                />
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
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-emerald-500 focus:border-emerald-500 block"
                                >
                                    <option value="welcome-call">Welcome Call</option>
                                    <option value="match-making">Match Making</option>
                                </select>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={addTelecallerMutation.isPending}
                                className="w-full flex justify-center items-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.99]"
                            >
                                {addTelecallerMutation.isPending ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Adding Telecaller...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Register Telecaller
                                    </>
                                )}
                            </button>

                            {/* Error Message Display */}
                            {errorMessage && (
                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-red-800">Error</h3>
                                        <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setErrorMessage('')}
                                        className="text-red-400 hover:text-red-500"
                                    >
                                        <span className="sr-only">Dismiss</span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AddTelecaller;
