import React, { useState, useEffect, useMemo } from 'react';
import {
  Laptop,
  Smartphone,
  Monitor,
  Headphones,
  HardDrive,
  FileText,
  Calendar,
  Award,
  LifeBuoy,
  CheckCircle2,
  XCircle,
  Plus,
  Search,
  Filter,
  RotateCw,
  QrCode,
  Download,
  Eye,
  AlertTriangle,
  User,
  Clock,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
  X
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import hrmsApi from '../../services/hrmsApi';

export default function HrmsWorkplace() {
  const [activeTab, setActiveTab] = useState('assets'); // 'assets' | 'helpdesk' | 'policies' | 'calendar' | 'rewards'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddAssetModalOpen, setIsAddAssetModalOpen] = useState(false);
  const [selectedQrAsset, setSelectedQrAsset] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Hardware Assets dataset
  const [assets, setAssets] = useState([
    {
      id: 'AST-LP-001',
      tag: 'TM-MAC-M2-01',
      name: 'MacBook Air M2 (16GB, 512GB)',
      category: 'Laptop',
      assignedTo: 'Tarun Kumar',
      empId: 'TM-EMP-001',
      condition: 'Excellent',
      status: 'Assigned',
      purchaseDate: '15 Jan 2025',
      serialNo: 'C02G41ABQ05D'
    },
    {
      id: 'AST-LP-002',
      tag: 'TM-DEL-XPS-02',
      name: 'Dell XPS 15 (i7, 32GB RAM)',
      category: 'Laptop',
      assignedTo: 'Sourabh Singh',
      empId: 'TM-EMP-002',
      condition: 'Good',
      status: 'Assigned',
      purchaseDate: '20 Feb 2025',
      serialNo: 'DL-882910-XPS'
    },
    {
      id: 'AST-PH-001',
      tag: 'TM-SMP-09',
      name: 'Samsung Galaxy A34 5G',
      category: 'Smartphone',
      assignedTo: 'Chandarbhan',
      empId: 'TM-EMP-004',
      condition: 'Good',
      status: 'Assigned',
      purchaseDate: '10 May 2025',
      serialNo: 'SM-A346E-0992'
    },
    {
      id: 'AST-MN-001',
      tag: 'TM-MNTR-27',
      name: 'LG 27-inch 4K UHD Monitor',
      category: 'Monitor',
      assignedTo: 'Deepak Bhati',
      empId: 'TM-EMP-003',
      condition: 'Excellent',
      status: 'Assigned',
      purchaseDate: '14 Jun 2025',
      serialNo: 'LG-27UL-850'
    },
    {
      id: 'AST-LP-003',
      tag: 'TM-LEN-THK-05',
      name: 'Lenovo ThinkPad E14',
      category: 'Laptop',
      assignedTo: 'Unassigned',
      empId: '—',
      condition: 'In Stock',
      status: 'Available',
      purchaseDate: '01 Aug 2026',
      serialNo: 'LN-E14-44109'
    }
  ]);

  // Helpdesk Tickets dataset
  const [tickets, setTickets] = useState([
    {
      id: 'TKT-1081',
      empId: 'TM-EMP-004',
      name: 'Chandarbhan',
      category: 'IT Hardware & SIM',
      subject: 'Telecalling outbound SIM network connectivity issue',
      priority: 'High',
      status: 'In Progress',
      createdDate: '12 Oct 2026',
      description: 'The primary outbound calling SIM card is losing GSM carrier signal repeatedly since yesterday.'
    },
    {
      id: 'TKT-1082',
      empId: 'TM-EMP-005',
      name: 'Raksha',
      category: 'Facilities & Access',
      subject: 'Office biometric door access card malfunctioning',
      priority: 'Medium',
      status: 'Open',
      createdDate: '13 Oct 2026',
      description: 'Need card re-encoding on reader 2 (Floor 3 entry).'
    },
    {
      id: 'TKT-1079',
      empId: 'TM-EMP-002',
      name: 'Sourabh Singh',
      category: 'Software & Cloud',
      subject: 'VPN key renewal for AWS staging environment',
      priority: 'Low',
      status: 'Resolved',
      createdDate: '08 Oct 2026',
      description: 'Staging OpenVPN profile certificate renewed and tested.'
    }
  ]);

  // Company Policies dataset
  const [policies, setPolicies] = useState([
    {
      id: 'POL-01',
      title: 'TruckMitr Code of Conduct & Business Ethics',
      category: 'General Governance',
      version: 'v2.4',
      updatedAt: '01 Jan 2026',
      fileSize: '1.4 MB PDF'
    },
    {
      id: 'POL-02',
      title: 'Leave & Attendance Policy 2026 (CL, SL, WFH & Biometrics)',
      category: 'Human Resources',
      version: 'v3.1',
      updatedAt: '15 Mar 2026',
      fileSize: '890 KB PDF'
    },
    {
      id: 'POL-03',
      title: 'Information Security & Device Usage Standard (ISMS)',
      category: 'IT & Security',
      version: 'v1.8',
      updatedAt: '10 Jun 2026',
      fileSize: '2.1 MB PDF'
    },
    {
      id: 'POL-04',
      title: 'Field Operations & Transporter Visit Expense Reimbursement',
      category: 'Finance & Travel',
      version: 'v2.0',
      updatedAt: '05 Aug 2026',
      fileSize: '640 KB PDF'
    }
  ]);

  // Office Calendar / Holidays
  const [holidays, setHolidays] = useState([
    { date: '20 Oct 2026', day: 'Tuesday', name: 'Dussehra (Vijayadashami)', type: 'Gazetted Holiday' },
    { date: '08 Nov 2026', day: 'Sunday', name: 'Diwali (Deepavali)', type: 'National Holiday' },
    { date: '09 Nov 2026', day: 'Monday', name: 'Govardhan Puja', type: 'Company Holiday' },
    { date: '10 Nov 2026', day: 'Tuesday', name: 'Bhai Dooj', type: 'Restricted Holiday' },
    { date: '25 Dec 2026', day: 'Friday', name: 'Christmas Day', type: 'Gazetted Holiday' },
    { date: '26 Jan 2027', day: 'Tuesday', name: 'Republic Day', type: 'National Holiday' }
  ]);

  // Rewards & Recognition
  const [rewards, setRewards] = useState([
    {
      id: 'RWD-01',
      employee: 'Sourabh Singh',
      award: 'Quarterly Star Performer',
      date: 'Sep 2026',
      citation: 'Architecting high-concurrency microservices and database clustering.'
    },
    {
      id: 'RWD-02',
      employee: 'Chandarbhan',
      award: 'Customer Hero & Tele-Excellence',
      date: 'Aug 2026',
      citation: 'Highest resolution rate and driver engagement conversion index.'
    }
  ]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await hrmsApi.get('/assets');
      showToast('Assets & workplace records updated.');
    } catch {
      showToast('Workplace synchronized.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTicketStatus = (id, newStatus) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    setSelectedTicket(null);
    showToast(`Ticket #${id} status changed to ${newStatus}.`);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 w-full bg-slate-50 min-h-screen text-slate-800 antialiased">
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs px-4 py-2.5 rounded-xl shadow-2xl flex items-center space-x-2 border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-slate-900 rounded-xl text-white shadow-xs">
                <Laptop className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Workplace & Assets Center
              </h1>
              <span className="text-xs bg-slate-200 text-slate-800 font-bold px-2.5 py-0.5 rounded-full">
                AssetOps
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              IT equipment inventory, QR tagging, employee helpdesk, company policies, and workplace holiday calendars.
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-all shadow-xs disabled:opacity-50"
              title="Refresh Workplace"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-slate-900' : ''}`} />
            </button>

            <button
              onClick={() => setIsAddAssetModalOpen(true)}
              className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Register Asset</span>
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Assets</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{assets.length} Units</p>
              <span className="inline-flex items-center text-[11px] font-semibold text-emerald-600 mt-1">
                4 Assigned, 1 In Stock
              </span>
            </div>
            <div className="p-3 bg-slate-100 text-slate-800 rounded-xl">
              <Laptop className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Helpdesk</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{tickets.filter(t => t.status !== 'Resolved').length} Tickets</p>
              <span className="inline-flex items-center text-[11px] font-semibold text-amber-600 mt-1">
                1 High Priority SIM issue
              </span>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <LifeBuoy className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Policies</p>
              <p className="text-2xl font-black text-slate-900 mt-1">4 Documents</p>
              <span className="inline-flex items-center text-[11px] font-semibold text-blue-600 mt-1">
                All staff acknowledged
              </span>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Upcoming Holiday</p>
              <p className="text-2xl font-black text-slate-900 mt-1">20 Oct</p>
              <span className="inline-flex items-center text-[11px] font-semibold text-purple-600 mt-1">
                Dussehra (Vijayadashami)
              </span>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Tab Strip */}
        <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold text-slate-500 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('assets')}
            className={`pb-2.5 transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap ${
              activeTab === 'assets'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>Hardware & Assets ({assets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('helpdesk')}
            className={`pb-2.5 transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap ${
              activeTab === 'helpdesk'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>IT Helpdesk & Support ({tickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('policies')}
            className={`pb-2.5 transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap ${
              activeTab === 'policies'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Company Policies ({policies.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`pb-2.5 transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Office Calendar & Holidays</span>
          </button>

          <button
            onClick={() => setActiveTab('rewards')}
            className={`pb-2.5 transition-all flex items-center space-x-2 border-b-2 whitespace-nowrap ${
              activeTab === 'rewards'
                ? 'border-slate-900 text-slate-900 font-bold'
                : 'border-transparent hover:text-slate-800'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Rewards & Recognitions</span>
          </button>
        </div>

        {/* Tab 1: Hardware & Assets */}
        {activeTab === 'assets' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Registered Devices & Inventory</h2>
                <p className="text-xs text-slate-500">Track serial numbers, current holders, and QR code inspection labels.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Asset Tag & Device</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Serial #</th>
                    <th className="py-3 px-4">Assigned To</th>
                    <th className="py-3 px-4">Condition</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assets.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{a.name}</div>
                        <div className="text-[11px] font-mono text-slate-500 font-semibold">{a.tag}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[11px]">
                          {a.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {a.serialNo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{a.assignedTo}</div>
                        <div className="text-[10px] text-emerald-600 font-mono">{a.empId}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {a.condition}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          a.status === 'Assigned' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {a.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedQrAsset(a)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>QR Label</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 2: IT Helpdesk */}
        {activeTab === 'helpdesk' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Internal Helpdesk Tickets</h2>
                <p className="text-xs text-slate-500">Employee hardware complaints, SIM network issues, and software requests.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Priority</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tickets.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        {t.id}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{t.name}</div>
                        <div className="text-[11px] font-mono text-emerald-600">{t.empId}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {t.category}
                      </td>
                      <td className="py-3 px-4 max-w-sm text-slate-800 font-medium truncate">
                        {t.subject}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          t.priority === 'High'
                            ? 'bg-rose-100 text-rose-800'
                            : t.priority === 'Medium'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          t.status === 'Resolved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : t.status === 'In Progress'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {t.status !== 'Resolved' ? (
                          <button
                            onClick={() => handleTicketStatus(t.id, 'Resolved')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold"
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-bold text-xs">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Company Policies */}
        {activeTab === 'policies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {policies.map((p) => (
              <div key={p.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between space-x-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {p.id}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{p.category}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm leading-snug">{p.title}</h3>
                  <p className="text-[11px] text-slate-500">
                    Version: {p.version} • Updated: {p.updatedAt} • {p.fileSize}
                  </p>
                </div>

                <button
                  onClick={() => showToast(`Downloading ${p.title}`)}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors shrink-0"
                  title="Download Policy PDF"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Office Calendar & Holidays */}
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Official Company Holiday Calendar</h2>
                <p className="text-xs text-slate-500">Scheduled public and restricted gazetted holidays for calendar year 2026-27.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Day</th>
                    <th className="py-3 px-4">Holiday / Occasion</th>
                    <th className="py-3 px-4">Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {holidays.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {h.date}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {h.day}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-bold">
                        {h.name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-full font-bold text-[11px]">
                          {h.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Rewards & Recognition */}
        {activeTab === 'rewards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rewards.map((r) => (
              <div key={r.id} className="bg-white p-5 rounded-xl border border-amber-200/80 shadow-xs flex items-start space-x-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                    {r.award} ({r.date})
                  </span>
                  <h3 className="font-bold text-slate-900 text-base">{r.employee}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{r.citation}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: QR Code Asset Label */}
      {selectedQrAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-center">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400">TRUCKMITR ASSET TAG</span>
              <button onClick={() => setSelectedQrAsset(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-2 flex justify-center">
              <QRCodeCanvas
                value={`https://truckmitr.com/assets/${selectedQrAsset.tag}`}
                size={160}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="H"
              />
            </div>

            <div>
              <p className="text-sm font-black text-slate-900">{selectedQrAsset.name}</p>
              <p className="text-xs font-mono font-bold text-emerald-600 mt-0.5">{selectedQrAsset.tag}</p>
              <p className="text-[11px] text-slate-500 mt-1">Serial: {selectedQrAsset.serialNo}</p>
              <p className="text-xs text-slate-700 font-semibold mt-2">Assigned to: {selectedQrAsset.assignedTo}</p>
            </div>

            <button
              onClick={() => {
                showToast('Asset QR code printed.');
                setSelectedQrAsset(null);
              }}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
            >
              Print Barcode Label
            </button>
          </div>
        </div>
      )}

      {/* Modal: Register New Asset */}
      {isAddAssetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Register Hardware Asset</h3>
              <button onClick={() => setIsAddAssetModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                showToast('New asset registered in inventory.');
                setIsAddAssetModalOpen(false);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-slate-600 font-medium mb-1">Asset Model Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dell Latitude 5430"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Category</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none">
                    <option>Laptop</option>
                    <option>Monitor</option>
                    <option>Smartphone</option>
                    <option>Peripherals</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Condition</label>
                  <select className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none">
                    <option>Brand New</option>
                    <option>Excellent</option>
                    <option>Good</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Serial Number</label>
                <input
                  type="text"
                  placeholder="e.g. SN-9948210"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddAssetModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs"
                >
                  Save Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
