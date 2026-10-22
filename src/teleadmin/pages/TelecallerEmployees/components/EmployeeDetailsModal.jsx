import { X, User, Phone, Mail, MapPin, CreditCard, Briefcase, Calendar, FileText, DollarSign } from 'lucide-react-teleadmin';

const EmployeeDetailsModal = ({ employee, onClose }) => {
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

  const formatCurrency = (amount) => {
    if (!amount) return null;
    return `₹${parseFloat(amount).toLocaleString('en-IN')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">
                {employee.caller_name?.charAt(0).toUpperCase() || 'T'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{employee.caller_name || employee.full_name}</h2>
              <p className="text-purple-100 text-sm">Employee ID: {employee.emp_id || employee.emp_id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-5 h-5 text-purple-600" />
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <span className="text-sm text-gray-500">Full Name:</span>
                  <div>{renderValue(employee.full_name || employee.caller_name)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Guardian Name:</span>
                  <div>{renderValue(employee.guardian_name)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Date of Birth:</span>
                  <div>{renderValue(employee.dob, formatDate)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Gender:</span>
                  <div>{renderValue(employee.gender)}</div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Phone className="w-5 h-5 text-purple-600" />
                Contact Information
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <span className="text-sm text-gray-500">Mobile:</span>
                  <div>{renderValue(employee.mobile || employee.caller_mobile)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Email:</span>
                  <div className="text-sm">{renderValue(employee.email || employee.caller_email?.trim())}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-500">Current Address:</span>
                  <div>{renderValue(employee.current_address)}</div>
                </div>
                <div className="col-span-2">
                  <span className="text-sm text-gray-500">Permanent Address:</span>
                  <div>{renderValue(employee.permanent_address)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">City:</span>
                  <div>{renderValue(employee.city)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">State:</span>
                  <div>{renderValue(employee.state)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">PIN Code:</span>
                  <div>{renderValue(employee.pin)}</div>
                </div>
              </div>
            </div>

            {/* Employment Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-purple-600" />
                Employment Details
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <span className="text-sm text-gray-500">Role:</span>
                  <div>{renderValue(employee.role)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Assignment:</span>
                  <div>{renderValue(employee.tc_for, (v) => v.replace('-', ' '))}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Department:</span>
                  <div>{renderValue(employee.department)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Designation:</span>
                  <div>{renderValue(employee.designation)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Date of Joining:</span>
                  <div>{renderValue(employee.doj, formatDate)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Work Location:</span>
                  <div>{renderValue(employee.work_location)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Employment Type:</span>
                  <div>{renderValue(employee.employment_type)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Reporting Manager:</span>
                  <div>{renderValue(employee.reporting_manager)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Is Reporting Manager:</span>
                  <div>{renderValue(employee.is_reporting_manager, (v) => v ? 'Yes' : 'No')}</div>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                Bank & Payment Details
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <span className="text-sm text-gray-500">Account Name:</span>
                  <div>{renderValue(employee.bank_account_name)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Bank Name:</span>
                  <div>{renderValue(employee.bank_name)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Account Number:</span>
                  <div>{renderValue(employee.bank_account_number)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">IFSC Code:</span>
                  <div>{renderValue(employee.ifsc)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">UPI ID:</span>
                  <div>{renderValue(employee.upi_id)}</div>
                </div>
              </div>
            </div>

            {/* Salary Details */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-purple-600" />
                Salary Details
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <span className="text-sm text-gray-500">CTC:</span>
                  <div>{renderValue(employee.ctc, formatCurrency)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Basic Salary:</span>
                  <div>{renderValue(employee.basic_salary, formatCurrency)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">HRA:</span>
                  <div>{renderValue(employee.hra, formatCurrency)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Conveyance Allowance:</span>
                  <div>{renderValue(employee.conveyance_allowance, formatCurrency)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Special Allowance:</span>
                  <div>{renderValue(employee.special_allowance, formatCurrency)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Gross Salary:</span>
                  <div>{renderValue(employee.gross_salary, formatCurrency)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">EPF:</span>
                  <div>{renderValue(employee.epf, formatCurrency)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">ESI:</span>
                  <div>{renderValue(employee.esi, formatCurrency)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Medical:</span>
                  <div>{renderValue(employee.medical, formatCurrency)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Gratuity:</span>
                  <div>{renderValue(employee.gratuity, formatCurrency)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Bonus:</span>
                  <div>{renderValue(employee.bonus, formatCurrency)}</div>
                </div>
              </div>
            </div>

            {/* Documents & ID Proof */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Documents & ID Proof
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <span className="text-sm text-gray-500">PAN:</span>
                  <div>{renderValue(employee.pan)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Aadhaar:</span>
                  <div>{renderValue(employee.aadhaar)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Highest Qualification:</span>
                  <div>{renderValue(employee.highest_qualification)}</div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Phone className="w-5 h-5 text-purple-600" />
                Emergency Contact
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-4">
                <div>
                  <span className="text-sm text-gray-500">Name:</span>
                  <div>{renderValue(employee.emergency_name)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Relation:</span>
                  <div>{renderValue(employee.emergency_relation)}</div>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Phone:</span>
                  <div>{renderValue(employee.emergency_phone)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;
