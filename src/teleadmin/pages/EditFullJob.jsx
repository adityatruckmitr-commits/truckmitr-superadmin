import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from '@teleadmin/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import jobMatchingApi from '../services/api/jobMatchingApi';
import toast from 'react-hot-toast';
import {
    ArrowLeft, Save, Briefcase, MapPin, Truck, Award, IndianRupee,
    FileText, Calendar, Users, AlignLeft, AlertCircle, ToggleLeft, ToggleRight, CheckCircle, Clock
} from 'lucide-react-teleadmin';


const EXPERIENCE_OPTIONS = [
    "1_5", "5_10", "10_15", "15_20", "20+"
];

const SALARY_OPTIONS = [
    "20000-25000", "25000-30000", "30000-35000", "35000-40000", 
    "40000-45000", "45000-50000", "50000+"
];

const LICENSE_OPTIONS = [
    "LMV", "HMV", "HGMV", "HPMV/HTV"
];


const EditFullJob = () => {
    const { job_id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const [formData, setFormData] = useState({
        job_title: '',
        assigned_to: '',
        job_location: '',
        vehicle_type: '',
        Required_Experience: '',
        Salary_Range: '',
        Type_of_License: '',
        Preferred_Skills: '',
        Application_Deadline: '',
        number_of_drivers_required: '',
        Job_Description: '',
        remarks: '',
        closed_job: '',
        route: '',
        pincode: '',
        esi_pf: '',
        food_allowance: '',
        food_allowance_desc: '',
        trip_incentive: '',
        trip_incentive_desc: '',
        rahane_ki_suvidha: '',
        mileage: '',
        mileage_desc: '',
        fast_tag_road_kharcha: '',
        fast_tag_road_kharcha_desc: '',
    });

    // Fetch Job Details
    const { data: jobResponse, isLoading } = useQuery({
        queryKey: ['job-details-full', job_id],
        queryFn: async () => {
            const res = await jobMatchingApi.getJobDetails(job_id);
            return res.data?.job?.job_details || res.data?.job || res.data || res.job; 
        }
    });

    useEffect(() => {
        if (jobResponse) {
            setFormData(prev => ({
                ...prev,
                job_title: jobResponse.job_title || '',
                assigned_to: jobResponse.assigned_to || '',
                job_location: jobResponse.job_location || '',
                vehicle_type: jobResponse.vehicle_type || '',
                Required_Experience: jobResponse.Required_Experience || '',
                Salary_Range: jobResponse.Salary_Range || '',
                Type_of_License: jobResponse.Type_of_License || '',
                Preferred_Skills: jobResponse.Preferred_Skills || '',
                Application_Deadline: jobResponse.Application_Deadline ? new Date(jobResponse.Application_Deadline).toISOString().split('T')[0] : '',
                number_of_drivers_required: jobResponse.number_of_drivers_required || '',
                Job_Description: jobResponse.Job_Description || '',
                remarks: jobResponse.remarks || '',
                closed_job: jobResponse.closed_job || '',
                route: jobResponse.route || '',
                pincode: jobResponse.pincode || '',
                esi_pf: jobResponse.esi_pf || '',
                food_allowance: jobResponse.food_allowance || '',
                food_allowance_desc: jobResponse.food_allowance_desc || '',
                trip_incentive: jobResponse.trip_incentive || '',
                trip_incentive_desc: jobResponse.trip_incentive_desc || '',
                rahane_ki_suvidha: jobResponse.rahane_ki_suvidha || '',
                mileage: jobResponse.mileage || '',
                mileage_desc: jobResponse.mileage_desc || '',
                fast_tag_road_kharcha: jobResponse.fast_tag_road_kharcha || '',
                fast_tag_road_kharcha_desc: jobResponse.fast_tag_road_kharcha_desc || '',
            }));
        }
    }, [jobResponse]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Update Details Mutation
    const updateJobMutation = useMutation({
        mutationFn: async (data) => {
            return await jobMatchingApi.updateJob(job_id, data);
        },
        onSuccess: () => {
            toast.success('Job details updated successfully!');
            queryClient.invalidateQueries(['job-details-full', job_id]);
            queryClient.invalidateQueries(['job-matching-list']);
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to update job details');
        }
    });

    // Update Status Mutation
    const updateStatusMutation = useMutation({
        mutationFn: async () => {
            const dbId = jobResponse?.id || job_id;
            return await jobMatchingApi.updateJobStatus(dbId, {});
        },
        onSuccess: () => {
            toast.success('Job status updated successfully!');
            queryClient.invalidateQueries(['job-details-full', job_id]);
            queryClient.invalidateQueries(['job-matching-list']);
        },
        onError: (error) => {
            toast.error('Failed to update job status');
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        updateJobMutation.mutate(formData);
    };

    const handleStatusToggle = () => {
        const isApproved = jobResponse?.status === '1';
        const confirmMessage = isApproved 
            ? 'Do you wish to keep this pending?' 
            : 'Do you want to approve this record? (It will become LIVE and send notifications)';
            
        if (window.confirm(confirmMessage)) {
            updateStatusMutation.mutate();
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 pb-12">
            <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-20 shadow-xs">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/job-matching')}
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-bold text-slate-800">Edit Full Job</h1>
                            <p className="text-sm text-slate-500 font-medium">Job ID: {job_id}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {jobResponse && (
                            <button
                                type="button"
                                onClick={handleStatusToggle}
                                disabled={updateStatusMutation.isPending}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all shadow-xs ${
                                    jobResponse.status === '1'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                                }`}
                            >
                                {jobResponse.status === '1' ? (
                                    <><CheckCircle className="w-4 h-4" /> Approved</>
                                ) : (
                                    <><Clock className="w-4 h-4" /> Pending</>
                                )}
                            </button>
                        )}
                        
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={updateJobMutation.isPending}
                            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-70 shadow-xs"
                        >
                            {updateJobMutation.isPending ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white" />
                            ) : (
                                <Save className="w-4 h-4" />
                            )}
                            Save Changes
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    
                    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Briefcase className="w-4 h-4 text-indigo-500" />
                                Basic Job Details
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Job Title <span className="text-red-500">*</span></label>
                                <input type="text" name="job_title" value={formData.job_title} onChange={handleInputChange} required className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Job Location</label>
                                <input type="text" name="job_location" value={formData.job_location} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Vehicle Type <span className="text-red-500">*</span></label>
                                <input type="text" name="vehicle_type" value={formData.vehicle_type} onChange={handleInputChange} required className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Required Experience (Years) <span className="text-red-500">*</span></label>
                                <select name="Required_Experience" value={formData.Required_Experience} onChange={handleInputChange} required className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all">
                                    <option value="">-- Select Experience --</option>
                                    {EXPERIENCE_OPTIONS.map(exp => (
                                        <option key={exp} value={exp}>{exp} Years</option>
                                    ))}
                                    {formData.Required_Experience && !EXPERIENCE_OPTIONS.includes(formData.Required_Experience) && (
                                        <option value={formData.Required_Experience}>{formData.Required_Experience}</option>
                                    )}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Salary Range <span className="text-red-500">*</span></label>
                                <select name="Salary_Range" value={formData.Salary_Range} onChange={handleInputChange} required className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all">
                                    <option value="">-- Select Salary Range --</option>
                                    {SALARY_OPTIONS.map(salary => (
                                        <option key={salary} value={salary}>{salary}</option>
                                    ))}
                                    {formData.Salary_Range && !SALARY_OPTIONS.includes(formData.Salary_Range) && (
                                        <option value={formData.Salary_Range}>{formData.Salary_Range}</option>
                                    )}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Type of License <span className="text-red-500">*</span></label>
                                <select name="Type_of_License" value={formData.Type_of_License} onChange={handleInputChange} required className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all">
                                    <option value="">-- Select License Type --</option>
                                    {LICENSE_OPTIONS.map(license => (
                                        <option key={license} value={license}>{license}</option>
                                    ))}
                                    {formData.Type_of_License && !LICENSE_OPTIONS.includes(formData.Type_of_License) && (
                                        <option value={formData.Type_of_License}>{formData.Type_of_License}</option>
                                    )}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Preferred Skills <span className="text-red-500">*</span></label>
                                <input type="text" name="Preferred_Skills" value={formData.Preferred_Skills} onChange={handleInputChange} required className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Application Deadline <span className="text-red-500">*</span></label>
                                <input type="date" name="Application_Deadline" value={formData.Application_Deadline} onChange={handleInputChange} required className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">No. of Drivers Required <span className="text-red-500">*</span></label>
                                <input type="number" name="number_of_drivers_required" value={formData.number_of_drivers_required} onChange={handleInputChange} required className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <Truck className="w-4 h-4 text-indigo-500" />
                                Facility & Additional Details
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Route</label>
                                <input type="text" name="route" value={formData.route} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Pincode</label>
                                <input type="text" name="pincode" value={formData.pincode} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">ESI/PF Benefits</label>
                                <input type="text" name="esi_pf" value={formData.esi_pf} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Food Allowance</label>
                                <input type="text" name="food_allowance" value={formData.food_allowance} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Food Allowance Details</label>
                                <input type="text" name="food_allowance_desc" value={formData.food_allowance_desc} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Trip Incentive</label>
                                <input type="text" name="trip_incentive" value={formData.trip_incentive} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Trip Incentive Details</label>
                                <input type="text" name="trip_incentive_desc" value={formData.trip_incentive_desc} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Accommodation Facility</label>
                                <input type="text" name="rahane_ki_suvidha" value={formData.rahane_ki_suvidha} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Mileage</label>
                                <input type="text" name="mileage" value={formData.mileage} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Mileage Details</label>
                                <input type="text" name="mileage_desc" value={formData.mileage_desc} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Fastag / Road Kharcha</label>
                                <input type="text" name="fast_tag_road_kharcha" value={formData.fast_tag_road_kharcha} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Fastag Details</label>
                                <input type="text" name="fast_tag_road_kharcha_desc" value={formData.fast_tag_road_kharcha_desc} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                <AlignLeft className="w-4 h-4 text-indigo-500" />
                                Long Text & Remarks
                            </h3>
                        </div>
                        <div className="p-6 grid grid-cols-1 gap-6">
                            
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Job Description <span className="text-red-500">*</span> <span className="text-xs text-slate-400 font-normal ml-1">(max 5000 chars)</span></label>
                                <textarea name="Job_Description" value={formData.Job_Description} onChange={handleInputChange} maxLength={5000} rows={4} required className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all resize-y" />
                            </div>
                            
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-slate-700">Reason for Close Job <span className="text-xs text-slate-400 font-normal ml-1">(max 1000 chars)</span></label>
                                <textarea name="remarks" value={formData.remarks} onChange={handleInputChange} maxLength={1000} rows={3} className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all resize-y" />
                            </div>

                            <div className="space-y-1.5 max-w-sm">
                                <label className="text-sm font-medium text-slate-700">Close Job Status</label>
                                <select name="closed_job" value={formData.closed_job} onChange={handleInputChange} className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-hidden transition-all">
                                    <option value="">-- Select --</option>
                                    <option value="yes">Yes</option>
                                    <option value="no">No</option>
                                </select>
                            </div>

                        </div>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default EditFullJob;
