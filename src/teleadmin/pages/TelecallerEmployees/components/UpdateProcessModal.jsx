import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import telecallersApi from '../../../services/api/telecallersApi';
import { X, Briefcase, Check, AlertCircle, Save } from 'lucide-react-teleadmin';
import toast from 'react-hot-toast';

const PROCESS_OPTIONS = [
    { id: 'welcome-call', label: 'Welcome Call' },
    { id: 'match-making', label: 'Match Making' }
];

const UpdateProcessModal = ({ employee, onClose }) => {
    const queryClient = useQueryClient();
    const [selectedProcesses, setSelectedProcesses] = useState([]);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (employee?.process) {
            // Assuming process comes as a comma-separated string or single string
            // Normalize to array
            const currentProcesses = employee.process.split(',').map(p => p.trim());
            setSelectedProcesses(currentProcesses);
        }
    }, [employee]);

    const toggleProcess = (processId) => {
        setSelectedProcesses(prev => {
            if (prev.includes(processId)) {
                return prev.filter(p => p !== processId);
            } else {
                return [...prev, processId];
            }
        });
        if (errorMessage) setErrorMessage('');
    };

    const updateProcessMutation = useMutation({
        mutationFn: (payload) => telecallersApi.updateTelecallerProcess(employee.id, payload.tc_for),
        onSuccess: () => {
            toast.success('Process updated successfully');
            queryClient.invalidateQueries({ queryKey: ['agent-revenue4'] });
            onClose();
        },
        onError: (error) => {
            const msg = error.response?.data?.message || error.message || 'Failed to update process';
            setErrorMessage(msg);
            toast.error(msg);
        }
    });

    const handleSubmit = () => {
        if (selectedProcesses.length === 0) {
            setErrorMessage('Please select at least one process');
            return;
        }

        // Create comma-separated string for API
        const tc_for = selectedProcesses.join(',');
        updateProcessMutation.mutate({ tc_for });
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/20 p-2 rounded-lg">
                            <Briefcase className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Update Assignment</h2>
                            <p className="text-purple-100 text-sm opacity-90">{employee.name}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            Select Process Assignment
                        </label>
                        <div className="flex flex-wrap gap-3">
                            {PROCESS_OPTIONS.map((option) => {
                                const isSelected = selectedProcesses.includes(option.id);
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => toggleProcess(option.id)}
                                        className={`
                                            group relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 border
                                            flex items-center gap-2
                                            ${isSelected
                                                ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm ring-1 ring-purple-500/20'
                                                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        {isSelected && (
                                            <Check className="w-4 h-4 text-purple-600 animate-in zoom-in duration-200" />
                                        )}
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                            Click to select multiple processes
                        </p>
                    </div>

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-red-600">{errorMessage}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={updateProcessMutation.isPending}
                            className="flex-1 px-4 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {updateProcessMutation.isPending ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    Save Changes
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateProcessModal;
