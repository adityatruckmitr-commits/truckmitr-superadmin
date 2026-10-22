import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import telecallersApi from '../../services/api/telecallersApi';
import EmployeeDetailsModal from './components/EmployeeDetailsModal';
import AddTelecallerModal from './components/AddTelecallerModal';
import UpdateProcessModal from './components/UpdateProcessModal';
import {
  Users,
  RefreshCw,
  Search,
  Phone,
  Briefcase,
  Calendar,
  UserPlus
} from 'lucide-react-teleadmin';

const TelecallerEmployees = () => {
  // Get today's date in UTC
  const todayDate = new Date().toISOString().split('T')[0];

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [updatingEmployee, setUpdatingEmployee] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [selectedNotListedEmployee, setSelectedNotListedEmployee] = useState(null);

  // Fetch agent revenue data
  // Fetch agent revenue data and match making data
  const { data: employees = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['telecallers-consolidated', selectedDate],
    queryFn: async () => {
      const [agentRevenueData, matchMakingData] = await Promise.all([
        telecallersApi.getAgentRevenue(selectedDate),
        telecallersApi.getMatchMakingReports(selectedDate)
      ]);

      console.log(agentRevenueData)
      const welcomeCallsRaw = agentRevenueData?.telechamp_summary || (Array.isArray(agentRevenueData) ? agentRevenueData : []);

      // Filter out match-making users from agentRevenueData (only keep welcome-call users)
      const welcomeCallsWithProcess = welcomeCallsRaw
        .filter(emp => {
          const process = emp.process || 'welcome-call';
          return !process.includes('match-making');
        })
        .map(emp => ({
          ...emp,
          process: emp.process || 'welcome-call'
        }));

      const matchMakingRaw = Array.isArray(matchMakingData)
        ? matchMakingData
        : (matchMakingData?.data || []);

      const normalizedMatchMaking = matchMakingRaw.map(agent => ({
        id: agent.agent_id,
        name: agent.agent_name,
        process: 'match-making',
        CA: agent.call_attempts,
        UCA: agent.unique_attempted_calls,
        CC: agent.connected_calls,
        UCC: agent.unique_connected_calls,
        NC: agent.not_connected_calls,
        UNC: agent.unique_not_connected_calls,
        CB: agent.callback_calls,
        UCB: agent.unique_callback_calls,
        Pending: agent.pending_calls,
        Unique_Pending: agent.unique_pending_calls,
        // Preserve original fields if needed
        ...agent
      }));

      return [...welcomeCallsWithProcess, ...normalizedMatchMaking];
    },
    refetchInterval: 60000,
  });
  
  // Fetch not-listed telechamps
  const { data: notListedResponse, isLoading: isLoadingNotListed, refetch: refetchNotListed } = useQuery({
    queryKey: ['not-listed-telechamps'],
    queryFn: () => telecallersApi.getNotListedTeleChamps(),
    refetchInterval: 60000,
  });

  const notListedEmployees = notListedResponse?.data || [];
  const totalCount = employees.length;

  // Separate employees by process
  const welcomeCallEmployees = employees.filter(emp => {
    const matchesSearch = searchTerm === '' || emp.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const isWelcomeCall = emp.process === 'welcome-call';
    return matchesSearch && isWelcomeCall;
  });

  const matchMakingEmployees = employees.filter(emp => {
    const matchesSearch = searchTerm === '' || emp.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const isMatchMaking = emp.process?.includes('match-making');
    return matchesSearch && isMatchMaking;
  });

  const renderWelcomeCallTable = () => (
    <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-gray-200 mb-8">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Phone className="w-5 h-5 text-green-600" />
          Welcome Call Telechamps
        </h2>
        <span className="text-sm text-gray-500 font-medium">Total: {welcomeCallEmployees.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Telechamp Info</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Call Attempts</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Connected</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Not Connected</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Callbacks</th>
              <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">Pending Calls</th>
            </tr>
          </thead>
          <tbody>
            {welcomeCallEmployees.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No welcome call telechamps found</td></tr>
            ) : (
              welcomeCallEmployees.map((emp, index) => {
                const fresh = emp.backlogData?.yesterday1830_to_today1830 || {};
                const backlog = emp.backlogData?.before_day_before_yesterday_1830 || {};

                const getSum = (key) => (Number(fresh[key] || 0) + Number(backlog[key] || 0));

                return (
                  <tr key={emp.id} className={index < welcomeCallEmployees.length - 1 ? 'border-b border-gray-200' : ''}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-semibold text-sm">{emp.name?.charAt(0).toUpperCase() || 'T'}</span>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{emp.name}</div>
                          <UpdateProcessButton emp={emp} />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center"><StatCell value={getSum('CA')} unique={getSum('UCA')} color="text-gray-900" /></td>
                    <td className="px-6 py-4 text-center"><StatCell value={getSum('CC')} unique={getSum('UCC')} color="text-green-600" /></td>
                    <td className="px-6 py-4 text-center"><StatCell value={getSum('NC')} unique={getSum('UNC')} color="text-red-600" /></td>
                    <td className="px-6 py-4 text-center"><StatCell value={getSum('CB')} unique={getSum('UCB')} color="text-orange-600" /></td>
                    <td className="px-6 py-4 text-center"><StatCell value={getSum('Pending')} unique={getSum('Unique_Pending')} color="text-gray-900" /></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderMatchMakingTable = () => (
    <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-purple-600" />
          Job Matching Telechamps
        </h2>
        <span className="text-sm text-gray-500 font-medium">Total: {matchMakingEmployees.length}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Telechamp Info</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Call Attempts</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Connected</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Not Connected</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Callbacks</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Pending Calls</th>
            </tr>
          </thead>
          <tbody>
            {matchMakingEmployees.length === 0 ? (
              <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No job matching telechamps found</td></tr>
            ) : (
              matchMakingEmployees.map((emp, index) => (
                <tr key={emp.id} className={index < matchMakingEmployees.length - 1 ? 'border-b border-gray-200' : ''}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-purple-600 font-semibold text-sm">{emp.name?.charAt(0).toUpperCase() || 'M'}</span>
                      </div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900">{emp.name}</div>
                        <UpdateProcessButton emp={emp} />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center"><StatCell value={emp.CA} unique={emp.UCA} color="text-gray-900" /></td>
                  <td className="px-6 py-4 text-center"><StatCell value={emp.CC} unique={emp.UCC} color="text-green-600" /></td>
                  <td className="px-6 py-4 text-center"><StatCell value={emp.NC} unique={emp.UNC} color="text-red-600" /></td>
                  <td className="px-6 py-4 text-center"><StatCell value={emp.CB} unique={emp.UCB} color="text-orange-600" /></td>
                  <td className="px-6 py-4 text-center"><StatCell value={emp.Pending} unique={emp.Unique_Pending} color="text-gray-900" /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const UpdateProcessButton = ({ emp }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        setUpdatingEmployee(emp);
      }}
      className={`mt-1 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full transition-all cursor-pointer border ${emp.process?.includes('match-making')
        ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
        : 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
        }`}
    >
      {emp.process ? emp.process.replace('-', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Assign'}
    </button>
  );

  const StatCell = ({ value, unique, color }) => (
    <div className="flex flex-col items-center justify-center">
      <span className={`text-sm font-bold ${color}`}>{value || 0}</span>
      <span className="text-[10px] text-gray-500">Unique: {unique || 0}</span>
    </div>
  );

  const RenderStatBreakdown = ({ data, title, color, borderColor }) => {
    if (!data) return <span className="text-gray-400">-</span>;
    // sum of fresh + backlog (if passed consolidated) or just fields
    return (
      <div className={`text-left p-2 rounded-lg border ${borderColor} ${color} shadow-sm`}>
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
          <div title="Attempts"><span className="font-semibold text-gray-600">CA:</span> <span className="font-bold">{data.CA || 0}</span></div>
          <div title="Connected"><span className="font-semibold text-green-600">CC:</span> <span className="font-bold">{data.CC || 0}</span></div>
          <div title="Not Connected"><span className="font-semibold text-red-600">NC:</span> <span className="font-bold">{data.NC || 0}</span></div>
          <div title="Callbacks"><span className="font-semibold text-orange-600">CB:</span> <span className="font-bold">{data.CB || 0}</span></div>
          <div className="col-span-2 mt-1 pt-1 border-t border-gray-200">
            <span className="font-semibold text-gray-700">Pending:</span> <span className="font-bold">{data.Pending || 0}</span>
            <span className="text-[10px] text-gray-500 ml-1">({data.Unique_Pending || 0})</span>
          </div>
        </div>
      </div>
    )
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h3 className="text-lg font-semibold text-red-900 text-center mb-2">Error Loading Data</h3>
          <p className="text-red-700 text-center">{error.message}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 rounded-2xl shadow-2xl p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">TeleChamps</h1>
            <p className="text-purple-100 text-lg">
              {selectedDate === todayDate
                ? "Today's Performance"
                : `Data for ${new Date(selectedDate).toLocaleDateString('en-IN')}`}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Date Picker */}
            {/* <div className="flex items-center gap-2 bg-white/20 rounded-xl px-4 py-2">
              <Calendar className="w-5 h-5 text-white" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-white border-none outline-hidden cursor-pointer placeholder-white/70"
                style={{ colorScheme: 'dark' }}
              />
              {selectedDate !== todayDate && (
                <button
                  onClick={() => setSelectedDate(todayDate)}
                  className="ml-1 text-white/70 hover:text-white transition-colors"
                  title="Reset to today"
                >
                  ×
                </button>
              )}
            </div> */}

            {/* Refresh Button */}
            <button
              onClick={() => refetch()}
              disabled={isFetching}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all font-medium disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${isFetching ? 'animate-spin' : ''}`} />
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </button>

            {/* Add Employee Button */}
            {/* <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all font-medium"
            >
              <UserPlus className="w-5 h-5" />
              Add Employee
            </button> */}
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Total Employees</p>
              <p className="text-3xl font-bold mt-1">{totalCount}</p>
            </div>
            <Users className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Job Matching</p>
              <p className="text-3xl font-bold mt-1">{employees.filter(e => e.process === 'match-making').length}</p>
            </div>
            <Briefcase className="w-12 h-12 opacity-80" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90">Welcome Call</p>
              <p className="text-3xl font-bold mt-1">{employees.filter(e => e.process === 'welcome-call').length}</p>
            </div>
            <Phone className="w-12 h-12 opacity-80" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-xs p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative flex justify-center items-center">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, mobile, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-full !pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Roles</option>
              <option value="match-making">Job Matching</option>
              <option value="welcome-call">Welcome Call</option>
            </select>
          </div>
        </div>

        <div className="mt-4 text-sm text-gray-600">
          Showing <span className="font-semibold text-gray-900">{welcomeCallEmployees.length + matchMakingEmployees.length}</span> of{' '}
          <span className="font-semibold text-gray-900">{totalCount}</span> employees
        </div>
      </div>

      {/* Employee Tables */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-xs p-12 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading employees...</p>
        </div>
      ) : (
        <>
          {(roleFilter === 'all' || roleFilter === 'welcome-call') && renderWelcomeCallTable()}
          {(roleFilter === 'all' || roleFilter === 'match-making') && renderMatchMakingTable()}
          
          {/* Not Listed TeleChamps Section */}
          {(roleFilter === 'all' || roleFilter === 'match-making') && (
            <div className="bg-white rounded-xl shadow-xs overflow-hidden border border-gray-200 mt-8">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-orange-50 to-amber-50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-orange-600" />
                  Not Listed TeleChamps (Available to Add)
                </h2>
                <span className="text-sm text-gray-500 font-medium">Total: {notListedEmployees.length}</span>
              </div>
              
              {isLoadingNotListed ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-orange-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading not-listed employees...</p>
                </div>
              ) : notListedEmployees.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900">No employees available</h3>
                  <p className="text-gray-500 text-sm mt-1">All employees from department 6 are already listed</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {notListedEmployees.map((employee, index) => (
                        <tr key={index} className="hover:bg-orange-50/50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white font-bold shadow-sm">
                                {employee.full_name?.charAt(0)?.toUpperCase() || 'T'}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{employee.full_name}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-gray-700">{employee.email}</p>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => {
                                setSelectedNotListedEmployee(employee);
                                setIsAddModalOpen(true);
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg"
                            >
                              <UserPlus className="w-4 h-4" />
                              Add to System
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <EmployeeDetailsModal
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      {/* Add Employee Modal */}
      {isAddModalOpen && (
        <AddTelecallerModal
          onClose={() => {
            setIsAddModalOpen(false);
            setSelectedNotListedEmployee(null);
          }}
          selectedEmployee={selectedNotListedEmployee}
          onSuccess={() => {
            refetch();
            refetchNotListed();
          }}
        />
      )}
      {/* Update Process Modal */}
      {updatingEmployee && (
        <UpdateProcessModal
          employee={updatingEmployee}
          onClose={() => setUpdatingEmployee(null)}
        />
      )}
    </div>
  );
};

export default TelecallerEmployees;
