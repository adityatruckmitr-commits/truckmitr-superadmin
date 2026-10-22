import { X, Phone, User, Clock, MessageSquare, FileText } from 'lucide-react-teleadmin';

const CallStatusModal = ({ title, data, onClose, gradient = 'bg-gradient-to-r from-green-600 to-emerald-600' }) => {
  const isEmpty = (value) => {
    return value === null || value === undefined || value === '' || value === 0 || value === '0';
  };

  const renderValue = (value) => {
    if (isEmpty(value)) {
      return <span className="text-red-500 font-medium">-</span>;
    }
    return <span className="text-gray-900">{value}</span>;
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={`${gradient} px-6 py-4 flex items-center justify-between`}>
          <div>
            <h2 className="text-2xl font-bold text-white">{title}</h2>
            <p className="text-green-100 text-sm">Total Records: {data?.length || 0}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {!data || data.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No records found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User Info</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Assigned To</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Call Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Feedback</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Remarks</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Call Time</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((record, index) => (
                    <tr key={index} className={`border-b border-gray-200 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                      {/* User Info */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-sm">
                              {record.user_name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{renderValue(record.user_name)}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {renderValue(record.user_number)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Assigned To */}
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{renderValue(record.assigned_name)}</div>
                          <div className="text-xs text-gray-500 capitalize">
                            {renderValue(record.assigned_role?.replace('-', ' '))}
                          </div>
                        </div>
                      </td>

                      {/* Call Status */}
                      <td className="px-4 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          record.call_status === 'connected' 
                            ? 'bg-green-100 text-green-700' 
                            : record.call_status === 'not_connected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {renderValue(record.call_status?.replace('_', ' '))}
                        </span>
                      </td>

                      {/* Feedback */}
                      <td className="px-4 py-4">
                        <div className="max-w-xs">
                          <div className="text-sm text-gray-900">{renderValue(record.feedback)}</div>
                          {!isEmpty(record.notes) && (
                            <div className="text-xs text-gray-500 mt-1 flex items-start gap-1">
                              <FileText className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{record.notes}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="px-4 py-4">
                        <div className="max-w-xs text-sm text-gray-900">
                          {renderValue(record.remarks)}
                        </div>
                      </td>

                      {/* Call Time */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {formatDateTime(record.call_initiated_at || record.call_time)}
                        </div>
                      </td>

                      {/* Duration */}
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDuration(record.call_duration)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallStatusModal;
