import { Phone, Mail, MapPin, Calendar, User, Briefcase, CreditCard, FileText, Award } from 'lucide-react-teleadmin';
import { IMAGE_BASE_URL } from '../../../config/api.config';

const UserDetailsTooltip = ({ lead }) => {
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

  const profileCompletion = lead?.profile_completion || 0;

  return (
    <div className="absolute left-0 top-full mt-2 w-[900px] max-h-[600px] overflow-y-auto bg-white border-2 border-indigo-200 rounded-lg shadow-2xl p-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
          <div className="relative h-14 w-14">
            {/* Profile completion ring */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="26"
                stroke="#e5e7eb"
                strokeWidth="3"
                fill="none"
              />
              <circle
                cx="28"
                cy="28"
                r="26"
                stroke={profileCompletion >= 75 ? '#10b981' : profileCompletion >= 50 ? '#f59e0b' : '#ef4444'}
                strokeWidth="3"
                fill="none"
                strokeDasharray={`${(profileCompletion / 100) * 163.36} 163.36`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-[3px] bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden">
              {lead.images ? (
                <img
                  src={`${IMAGE_BASE_URL}${lead.images}`}
                  alt={lead.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-indigo-600 font-bold text-xl">
                  {lead.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900 text-lg">{lead.name}</div>
            {!isEmpty(lead.name_eng) && lead.name_eng !== lead.name && (
              <div className="text-sm text-gray-600">({lead.name_eng})</div>
            )}
            <div className="text-sm text-indigo-600 font-medium">{lead.unique_id}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                lead.role === 'driver' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {lead.role === 'driver' ? 'Driver' : 'Transporter'}
              </span>
              <span className={`inline-block px-2 py-0.5 text-xs font-semibold rounded-full ${
                profileCompletion >= 75 ? 'bg-green-100 text-green-700' : 
                profileCompletion >= 50 ? 'bg-amber-100 text-amber-700' : 
                'bg-red-100 text-red-700'
              }`}>
                {profileCompletion}% Complete
              </span>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Contact Information</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Phone className="w-4 h-4 text-indigo-500" />
              {renderValue(lead.mobile)}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4 text-indigo-500" />
              <span className="text-xs truncate">{renderValue(lead.email)}</span>
            </div>
          </div>
        </div>

        {/* Location Information */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase">Location</h4>
          <div className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-indigo-500" />
              {isEmpty(lead.city) && isEmpty(lead.state_detail?.name) ? (
                <span className="text-red-500 font-medium">-</span>
              ) : (
                <span className="font-medium text-gray-900">
                  {[lead.city, lead.state_detail?.name].filter(v => !isEmpty(v)).join(', ')}
                </span>
              )}
            </div>
            <div className="text-gray-700">
              <span className="text-gray-500 text-xs">Pincode:</span> {renderValue(lead.pincode)}
            </div>
            <div className="text-gray-700">
              <span className="text-gray-500 text-xs">Address:</span> {renderValue(lead.address)}
            </div>
          </div>
        </div>

        {/* Driver Specific Information */}
        {lead.role === 'driver' && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
              <User className="w-3 h-3" /> Driver Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Father's Name:</span>
                <div>{renderValue(lead.Father_Name)}</div>
              </div>
              <div>
                <span className="text-gray-500">DOB:</span>
                <div>{renderValue(lead.DOB, (v) => new Date(v).toLocaleDateString('en-IN'))}</div>
              </div>
              <div>
                <span className="text-gray-500">Gender:</span>
                <div>{renderValue(lead.Sex)}</div>
              </div>
              <div>
                <span className="text-gray-500">Marital Status:</span>
                <div>{renderValue(lead.Marital_Status)}</div>
              </div>
              <div>
                <span className="text-gray-500">Education:</span>
                <div>{renderValue(lead.Highest_Education)}</div>
              </div>
              <div>
                <span className="text-gray-500">License Type:</span>
                <div>{renderValue(lead.Type_of_License)}</div>
              </div>
              <div>
                <span className="text-gray-500">License No:</span>
                <div>{renderValue(lead.License_Number)}</div>
              </div>
              <div>
                <span className="text-gray-500">License Expiry:</span>
                <div>{renderValue(lead.Expiry_date_of_License, (v) => new Date(v).toLocaleDateString('en-IN'))}</div>
              </div>
              <div>
                <span className="text-gray-500">Experience:</span>
                <div>{renderValue(lead.Driving_Experience)}</div>
              </div>
              <div>
                <span className="text-gray-500">Vehicle Type:</span>
                <div>{renderValue(lead.vehicle_type)}</div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Preferred Location:</span>
                <div>{renderValue(lead.Preferred_Location)}</div>
              </div>
              <div>
                <span className="text-gray-500">Current Income:</span>
                <div>{renderValue(lead.Current_Monthly_Income, (v) => `₹${v}`)}</div>
              </div>
              <div>
                <span className="text-gray-500">Expected Income:</span>
                <div>{renderValue(lead.Expected_Monthly_Income, (v) => `₹${v}`)}</div>
              </div>
              <div>
                <span className="text-gray-500">Aadhar:</span>
                <div>{renderValue(lead.Aadhar_Number)}</div>
              </div>
              <div>
                <span className="text-gray-500">Job Placement:</span>
                <div>{renderValue(lead.job_placement)}</div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Previous Employer:</span>
                <div>{renderValue(lead.previous_employer)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Transporter Specific Information */}
        {lead.role === 'transporter' && (
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
              <Briefcase className="w-3 h-3" /> Transporter Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="col-span-2">
                <span className="text-gray-500">Transport Name:</span>
                <div>{renderValue(lead.Transport_Name)}</div>
              </div>
              <div>
                <span className="text-gray-500">Established:</span>
                <div>{renderValue(lead.Year_of_Establishment)}</div>
              </div>
              <div>
                <span className="text-gray-500">Fleet Size:</span>
                <div>{renderValue(lead.Fleet_Size)}</div>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">Operational Segment:</span>
                <div>{renderValue(lead.Operational_Segment)}</div>
              </div>
              <div>
                <span className="text-gray-500">Average KM:</span>
                <div>{renderValue(lead.Average_KM)}</div>
              </div>
              <div>
                <span className="text-gray-500">Registered ID:</span>
                <div>{renderValue(lead.Registered_ID)}</div>
              </div>
              <div>
                <span className="text-gray-500">PAN:</span>
                <div>{renderValue(lead.PAN_Number)}</div>
              </div>
              <div>
                <span className="text-gray-500">GST:</span>
                <div className="text-xs">{renderValue(lead.GST_Number)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Training Institute Information */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
            <Award className="w-3 h-3" /> Training Institute
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="col-span-2">
              <span className="text-gray-500">Institute Name:</span>
              <div>{renderValue(lead.Training_Institute_Name)}</div>
            </div>
            <div>
              <span className="text-gray-500">Seats Available:</span>
              <div>{renderValue(lead.Number_of_Seats_Available)}</div>
            </div>
            <div>
              <span className="text-gray-500">Monthly Turnout:</span>
              <div>{renderValue(lead.Monthly_Turnout)}</div>
            </div>
            <div>
              <span className="text-gray-500">Training Language:</span>
              <div>{renderValue(lead.Language_of_Training)}</div>
            </div>
            <div>
              <span className="text-gray-500">Placement Candidates:</span>
              <div>{renderValue(lead.Placement_Candidates)}</div>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Pay Scale:</span>
              <div>{renderValue(lead.Pay_Scale)}</div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="space-y-2 pt-2 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-gray-500">Referral Code:</span>
              <div>{renderValue(lead.Referral_Code)}</div>
            </div>
            <div>
              <span className="text-gray-500">Language:</span>
              <div>{renderValue(lead.user_lang, (v) => v.toUpperCase())}</div>
            </div>
            <div>
              <span className="text-gray-500">Provider:</span>
              <div>{renderValue(lead.provider)}</div>
            </div>
            <div className="col-span-2 flex items-center gap-2 text-gray-600">
              <Calendar className="w-4 h-4 text-indigo-500" />
              <span className="text-xs">
                Registered: {new Date(lead.Created_at).toLocaleDateString('en-IN')} at{' '}
                {new Date(lead.Created_at).toLocaleTimeString('en-IN', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Arrow pointer */}
      <div className="absolute -top-2 left-8 w-4 h-4 bg-white border-l-2 border-t-2 border-indigo-200 transform rotate-45"></div>
    </div>
  );
};

export default UserDetailsTooltip;
