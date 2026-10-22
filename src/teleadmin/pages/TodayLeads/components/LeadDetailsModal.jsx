import { useState, useEffect } from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, FileText, Briefcase, Award, CreditCard, Loader } from 'lucide-react-teleadmin';
import { IMAGE_BASE_URL } from '../../../config/api.config';
import axiosInstance from '../../../services/api/axiosInstance';
import CallLogsModal from './CallLogsModal';
import AppliedJobsModal from './AppliedJobsModal';

const LeadDetailsModal = ({ lead, onClose }) => {
  const [detailedData, setDetailedData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCallLogs, setShowCallLogs] = useState(false);
  const [showAppliedJobs, setShowAppliedJobs] = useState(false);

  console.log(detailedData)
  // Fetch detailed user data
  useEffect(() => {
    const fetchDetailedData = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get(`/telehead/userdetails?unique_id=${lead.unique_id}`);
        if (response.data.success) {
          setDetailedData(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching detailed data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (lead?.unique_id) {
      fetchDetailedData();
    }
  }, [lead?.unique_id]);

  // Helper function to check if value is empty/null/0
  const isEmpty = (value) => {
    return value === null || value === undefined || value === '' || value === 0 || value === '0';
  };

  // Helper function to render value with red color if empty
  const renderValue = (value, formatter = null) => {
    if (isEmpty(value)) {
      return <span className="text-red-500 font-medium">-</span>;
    }
    return <span className="font-medium text-gray-900">{formatter ? formatter(value) : value}</span>;
  };

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-IN');
  };

  const profileCompletion = lead.full_details?.profile_completion || lead.profile_completion || 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16">
              {/* Profile completion ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle cx="32" cy="32" r="30" stroke="#ffffff30" strokeWidth="3" fill="none" />
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  stroke="#ffffff"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray={`${(profileCompletion / 100) * 188.5} 188.5`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-[3px] bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                {lead.images ? (
                  <img src={`${IMAGE_BASE_URL}${lead.images}`} alt={lead.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-2xl">{lead.name?.charAt(0).toUpperCase() || 'U'}</span>
                )}
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{lead.name}</h2>
              <p className="text-indigo-100 text-sm">{lead.unique_id}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${lead.role === 'driver' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                  {lead.role === 'driver' ? 'Driver' : 'Transporter'}
                </span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${profileCompletion >= 75 ? 'bg-green-100 text-green-700' :
                  profileCompletion >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                  {profileCompletion}% Complete
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-indigo-600" />
                Personal Details
              </h3>
              <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <span className="text-sm text-gray-500">Name:</span>
                  <div>{renderValue(lead.name_eng)}</div>
                </div>

                {lead.role === 'driver' && (
                  <>
                    <div>
                      <span className="text-sm text-gray-500">Father's Name:</span>
                      <div>{renderValue(lead.Father_Name)}</div>
                    </div>

                    <div>
                      <span className="text-sm text-gray-500">DOB:</span>
                      <div>{renderValue(lead.DOB, formatDate)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Gender:</span>
                      <div>{renderValue(lead.Sex)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Marital Status:</span>
                      <div>{renderValue(lead.Marital_Status)}</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Highest Education:</span>
                      <div>{renderValue(lead.Highest_Education)}</div>
                    </div>
                  </>
                )
                }
                {/* <div>
                  <span className="text-sm text-gray-500">Language:</span>
                  <div>{renderValue(lead.user_lang, (v) => v.toUpperCase())}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Status:</span>
                  <div>{renderValue(lead.status, (v) => v === '1' ? 'Active' : 'Inactive')}</div>
                </div> */}
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Phone className="w-5 h-5 text-indigo-600" />
                Contact Details
              </h3>
              <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                <div>
                  <span className="text-sm text-gray-500">Mobile:</span>
                  <div>{renderValue(lead.mobile)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <div className="text-sm">{renderValue(lead.email)}</div>
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <div className="space-y-3 bg-gray-50 rounded-lg p-4">
                {lead.role === 'driver' && (
                  <div>
                    <span className="text-sm text-gray-500">City:</span>
                    <div>{renderValue(lead.city)}</div>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-500">State:</span>
                  <div>{renderValue(lead.state_detail?.name || lead.states)}</div>
                </div>
                {/* <div>
                  <span className="text-sm text-gray-500">PIN Code:</span>
                  <div>{renderValue(lead.pincode)}</div>
                </div> */}
                <div>
                  <span className="text-sm text-gray-500">Address:</span>
                  <div>{renderValue(lead.address)}</div>
                </div>
              </div>
            </div>

            {/* Driver Details */}
            {lead.role === 'driver' && (
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Driving Details
                </h3>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <span className="text-sm text-gray-500">Vehicle Type:</span>
                    <div>{renderValue(lead.vehicle_type?.vehicle_name || lead.vehicle_type_name)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Driving Experience:</span>
                    <div>{renderValue(lead.Driving_Experience)} Yrs</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Preferred Location:</span>
                    <div>{renderValue(lead.Preferred_Location)}</div>
                  </div>

                  <div>
                    <span className="text-sm text-gray-500">Current Income:</span>
                    <div>{renderValue(lead.Current_Monthly_Income, (v) => `₹${v}`)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Expected Income:</span>
                    <div>{renderValue(lead.Expected_Monthly_Income, (v) => `₹${v}`)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">License Type:</span>
                    <div>{renderValue(lead.Type_of_License)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Previous Employer:</span>
                    <div>{renderValue(lead.previous_employer)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Job Placement:</span>
                    <div>{renderValue(lead.job_placement)}</div>
                  </div>
                </div>
              </div>
            )}

            {lead.role === 'driver' && (
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Uploaded Docs
                </h3>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <span className="text-sm text-gray-500">Aadhar Number:</span>
                    <div>{renderValue(lead.Aadhar_Number)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">License Number:</span>
                    <div>{renderValue(lead.License_Number)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">License Expiry:</span>
                    <div>{renderValue(lead.Expiry_date_of_License, formatDate)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Aadhar Image:</span>
                    <div className="flex items-center justify-center overflow-hidden">
                      {lead.Aadhar_Photo ? (
                        <img src={`${IMAGE_BASE_URL}${lead.Aadhar_Photo}`} alt={lead.Aadhar_Photo} className="h-[150px] w-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-2xl">{lead.name?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Driving Image:</span>
                    <div className="flex items-center justify-center overflow-hidden">
                      {lead.Driving_License ? (
                        <img src={`${IMAGE_BASE_URL}${lead.Driving_License}`} alt={lead.Driving_License} className="h-[150px] w-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-2xl">{lead.name?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Transporter Details */}
            {lead.role === 'transporter' && (
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Fleet Details
                </h3>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <span className="text-sm text-gray-500">Transport Name:</span>
                    <div>{renderValue(lead.Transport_Name)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Year of Establishment:</span>
                    <div>{renderValue(lead.Year_of_Establishment)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Fleet Size:</span>
                    <div>{renderValue(lead.Fleet_Size)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Operational Segment:</span>
                    <div>{renderValue(lead.Operational_Segment)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Average KM:</span>
                    <div>{renderValue(lead.Average_KM)}</div>
                  </div>
                  {/* <div>
                    <span className="text-sm text-gray-500">Registered ID:</span>
                    <div>{renderValue(lead.Registered_ID)}</div>
                  </div> */}

                </div>
              </div>
            )}

            {lead.role === 'transporter' && (
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-600" />
                  Uploaded Docs
                </h3>
                <div className="grid grid-cols-3 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <span className="text-sm text-gray-500">GST Number:</span>
                    <div className="text-xs">{renderValue(lead.GST_Number)}</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">PAN Number:</span>
                    <div>{renderValue(lead.PAN_Number)}</div>
                  </div>
                  <br />

                  <div>
                    <span className="text-sm text-gray-500">GST Image:</span>
                    <div className="flex items-center justify-center overflow-hidden">
                      {lead.images ? (
                        <img src={`${IMAGE_BASE_URL}${lead.GST_Certificate}`} alt={lead.GST_Certificate} className="h-[150px] w-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-2xl">{lead.name?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">PAN Image:</span>
                    <div className="flex items-center justify-center overflow-hidden">
                      {lead.images ? (
                        <img src={`${IMAGE_BASE_URL}${lead.PAN_Image}`} alt={lead.GST_Certificate} className="h-[150px] w-full object-cover" />
                      ) : (
                        <span className="text-white font-bold text-2xl">{lead.name?.charAt(0).toUpperCase() || 'U'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="col-span-2 flex items-center justify-center py-12">
                <Loader className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="ml-3 text-gray-600">Loading detailed information...</span>
              </div>
            )}

            {/* Subscription Info */}
            {!loading && detailedData?.payments && detailedData.payments.length > 0 && (
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  Subscription Details
                </h3>
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                  {detailedData.payments.map((payment, index) => (
                    <div key={index} className="grid grid-cols-4 gap-4">
                      <div>
                        <span className="text-sm text-gray-500">Start Date:</span>
                        <div className="font-medium text-gray-900">
                          {new Date(payment.start_at).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">End Date:</span>
                        <div className="font-medium text-gray-900">
                          {new Date(payment.end_at).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Amount:</span>
                        <div className="font-medium text-green-600">₹{payment.amount}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">User Type :</span>
                        <div className="text-sm font-medium text-gray-900">{lead.role}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Call Logs Summary */}
            {!loading && detailedData?.call_logs && (
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-indigo-600" />
                  Call Logs
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-indigo-600">{detailedData.call_logs.length}</span>
                      <span className="text-gray-600 ml-2">Total Calls</span>
                    </div>
                    <button
                      onClick={() => setShowCallLogs(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      View All Calls
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Applied Jobs Summary */}
            {!loading && detailedData?.appliedJobsCount > 0 && (
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                  Applied Jobs
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-2xl font-bold text-blue-600">{detailedData.appliedJobsCount}</span>
                      <span className="text-gray-600 ml-2">Jobs Applied</span>
                    </div>
                    <button
                      onClick={() => setShowAppliedJobs(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      View All Jobs
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Training Info */}
            {!loading && detailedData?.training_info && (
              <div className="col-span-2">
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-600" />
                  Training Information
                </h3>
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-200">
                  <div className="grid grid-cols-5 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Tier:</span>
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${detailedData.training_info.tier === 'Diamond' ? 'bg-cyan-100 text-cyan-700' :
                          detailedData.training_info.tier === 'Platinum' ? 'bg-slate-100 text-slate-700' :
                            detailedData.training_info.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' :
                              detailedData.training_info.tier === 'Silver' ? 'bg-gray-200 text-gray-700' :
                                detailedData.training_info.tier === 'Bronze' ? 'bg-orange-100 text-orange-700' :
                                  'bg-gray-100 text-gray-500'
                          }`}>
                          {detailedData.training_info.tier}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Percentage:</span>
                      <div className="font-medium text-gray-900">{detailedData.training_info.percentage}%</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Rating:</span>
                      <div className="font-medium text-gray-900">{detailedData.training_info.rating}/5</div>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Correct Answers:</span>
                      <div className="font-medium text-gray-900">
                        {detailedData.training_info.correct_answers}/{detailedData.training_info.total_questions}
                      </div>
                    </div>
                    {/* <div>
                      <span className="text-sm text-gray-500">Status:</span>
                      <div>
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                          detailedData.training_info.is_completed 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {detailedData.training_info.is_completed ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    </div> */}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Call Logs Modal */}
      {showCallLogs && detailedData?.call_logs && (
        <CallLogsModal
          lead={{ ...lead, call_logs: detailedData.call_logs }}
          onClose={() => setShowCallLogs(false)}
        />
      )}

      {/* Applied Jobs Modal */}
      {showAppliedJobs && detailedData?.appliedJobs && (
        <AppliedJobsModal
          jobs={detailedData.appliedJobs}
          userName={lead.name}
          onClose={() => setShowAppliedJobs(false)}
        />
      )}
    </div>
  );
};

export default LeadDetailsModal;
