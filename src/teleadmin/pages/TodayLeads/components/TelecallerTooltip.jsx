import { Phone, Mail, Briefcase, Calendar } from 'lucide-react-teleadmin';

const TelecallerTooltip = ({ assignedAdmin }) => {
  return (
    <div className="absolute left-0 top-full mt-2 w-72 bg-gray-900 text-white rounded-lg shadow-xl p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
      <div className="space-y-2">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-700">
          <div className="h-10 w-10 bg-indigo-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">
              {assignedAdmin.name?.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="font-semibold">{assignedAdmin.name}</div>
            <div className="text-xs text-gray-400 capitalize">{assignedAdmin.role}</div>
          </div>
        </div>
        
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-gray-400" />
            <span>{assignedAdmin.mobile}</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            <span className="truncate">{assignedAdmin.email}</span>
          </div>
          {assignedAdmin.tc_for && (
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-gray-400" />
              <span className="capitalize">{assignedAdmin.tc_for.replace('-', ' ')}</span>
            </div>
          )}
          <div className="flex items-center gap-2 pt-1 border-t border-gray-700">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-xs">
              Joined: {new Date(assignedAdmin.created_at).toLocaleDateString('en-IN')}
            </span>
          </div>
        </div>
      </div>
      
      {/* Arrow pointer */}
      <div className="absolute -top-2 left-4 w-4 h-4 bg-gray-900 transform rotate-45"></div>
    </div>
  );
};

export default TelecallerTooltip;
