import React, { useState } from 'react';
import { UserCheck, CreditCard, FileText, Gavel, Calendar, CheckCircle2, XCircle, AlertCircle, Eye, X, Receipt, MapPin, Building, Truck } from 'lucide-react-teleadmin';

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'N/A';
  
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options);
};

const VerificationCard = ({ title, icon: Icon, isVerified, isPending, onViewDetails, children, className = '' }) => {
  let headerBg = 'bg-slate-50/50';
  let iconColor = 'text-slate-500';

  if (isVerified) {
    headerBg = 'bg-emerald-50/50';
    iconColor = 'text-emerald-600';
  } else if (isPending) {
    headerBg = 'bg-amber-50/50';
    iconColor = 'text-amber-600';
  } else {
    headerBg = 'bg-red-50/50';
    iconColor = 'text-red-600';
  }

  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden h-full flex flex-col transition-all hover:shadow-md hover:border-indigo-100 ${className}`}>
      <div className={`px-4 py-3 border-b border-slate-100 flex items-center justify-between ${headerBg}`}>
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconColor}`} />
          <h6 className="font-bold text-slate-800 text-sm">{title}</h6>
        </div>
        {onViewDetails && !isPending && (
          <button 
            onClick={onViewDetails}
            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="p-4 flex-1">
        {children}
      </div>
    </div>
  );
};

const DetailsModal = ({ isOpen, onClose, title, data, type }) => {
  if (!isOpen) return null;

  const formatModalValue = (key, value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    if (key === 'verification_status') {
      return value == 1 ? 'Verified' : 'Pending';
    }
    if (typeof value === 'string') {
      if (value.match(/^\d{4}-\d{2}-\d{2}(?:T|\s)\d{2}:\d{2}:\d{2}/)) {
        const d = new Date(value);
        if (!isNaN(d)) {
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }).replace(/am|pm/i, m => m.toUpperCase());
        }
      } else if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const d = new Date(value);
        if (!isNaN(d)) {
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        }
      }
    }
    return String(value);
  };

  const hiddenFields = ['id', 'user_id', 'updated_at', 'raw_response', 'response_json', 'verify_id', 'client_id', 'status_code'];

  const DataRow = ({ label, value, isFullWidth = false, highlight = false }) => (
    <div className={`flex flex-col border-b border-slate-100 pb-2 ${isFullWidth ? 'col-span-2' : ''}`}>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-indigo-600' : 'text-slate-800'}`}>
        {value || 'N/A'}
      </span>
    </div>
  );

  const renderContent = () => {
    if (!data) return <p className="text-sm text-slate-500">No additional details available.</p>;

    switch (type) {
      case 'pan':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-4">
              <DataRow label="PAN Number" value={data.pan} highlight />
              <DataRow label="Full Name" value={data.full_name} />
              <DataRow label="Unique ID" value={data.unique_id} />
              <DataRow label="Date of Birth" value={formatModalValue('dob', data.dob)} />
            </div>
            <div className="space-y-4">
              <DataRow label="Gender" value={data.gender} />
              <DataRow label="Email" value={data.email} />
              <DataRow label="Mobile" value={data.mobile} />
              <div className="flex flex-col border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Aadhaar Linked</span>
                <span className={`text-sm font-semibold w-max px-2 py-0.5 rounded-sm ${data.aadharlink ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {data.aadharlink ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        );
      
      case 'dl':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="space-y-4">
                <DataRow label="License Number" value={data.dl_number} highlight />
                <DataRow label="Unique Id" value={data.unique_id} />
                <DataRow label="Full Name" value={data.user_full_name} />
                <DataRow label="Date of Birth" value={formatModalValue('user_dob', data.user_dob)} />
                <DataRow label="Father / Husband" value={data.father_or_husband} />
                <DataRow label="State" value={data.state} />
                <DataRow label="Blood Group" value={data.user_blood_group} />
              </div>
              <div className="space-y-4">
                <DataRow label="Issue Date" value={formatModalValue('issued_date', data.issued_date)} />
                <DataRow label="Expiry Date" value={formatModalValue('expiry_date', data.expiry_date)} />
                <DataRow label="Vehicle Category" value={data.vehicle_category_details_cov} />
                <DataRow label="Vehicle Category Details Issue Date" value={formatModalValue('vehicle_category_details_issue_date', data.vehicle_category_details_issue_date)} />
                <DataRow label="Vehicle Category Details Expiry Date" value={formatModalValue('vehicle_category_details_expiry_date', data.vehicle_category_details_expiry_date)} />
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                  <span className={`text-sm font-semibold w-max px-2 py-0.5 rounded-sm ${data.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {data.status === 'verified' ? 'Verified' : data.status}
                  </span>
                </div>
                <DataRow label="Verified On" value={formatModalValue('created_at', data.created_at)} />
              </div>
            </div>
            {data.user_complete_address && (
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mt-4">
                <DataRow label="Address" value={data.user_complete_address} isFullWidth />
              </div>
            )}
          </div>
        );

      case 'aadhar':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-4">
              <DataRow label="Name" value={data.name_on_card} />
              <DataRow label="Gender" value={data.gender} />
              <DataRow label="Address" value={data.address} />
              <DataRow label="State" value={data.state} />
            </div>
            <div className="space-y-4">
              <DataRow label="Aadhaar No" value={data.card_number} highlight />
              <DataRow label="DOB" value={data.date_of_birth} />
              <DataRow label="City" value={data.city} />
              <DataRow label="PIN" value={data.pin} />
            </div>
          </div>
        );

      case 'gst':
        const gstList = Array.isArray(data) ? data : [data];
        if (gstList.length === 0) return <p className="text-sm text-slate-500">No GST records found.</p>;
        const gstItem = gstList[0];
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-4">
              <DataRow label="GSTIN" value={gstItem.gstin} highlight />
              <DataRow label="Legal Name" value={gstItem.legal_name} />
              <DataRow label="Trade Name" value={gstItem.trade_name} />
              <DataRow label="Business Constitution" value={gstItem.business_constitution} />
              <DataRow label="Tax Payer Type" value={gstItem.tax_payer_type} />
              <DataRow label="Current Status" value={gstItem.current_registration_status} />
            </div>
            <div className="space-y-4">
              <DataRow label="Register Date" value={formatModalValue('register_date', gstItem.register_date)} />
              <DataRow label="Address" value={`${gstItem.building_name || ''} ${gstItem.address_1 || ''} ${gstItem.address_2 || ''} ${gstItem.locality || ''} ${gstItem.district || ''} ${gstItem.state || ''} ${gstItem.pincode || ''}`.trim() || 'N/A'} />
              <DataRow label="Business Nature" value={gstItem.business_nature} />
              <DataRow label="Verified On" value={formatModalValue('created_at', gstItem.created_at)} />
            </div>
          </div>
        );

      case 'rc':
        const rcItems = Array.isArray(data) ? data : [data];
        return (
          <div className="space-y-8">
            {rcItems.map((rcItem, idx) => (
              <div key={idx} className="border border-slate-200 rounded-lg p-4 bg-white relative">
                {rcItems.length > 1 && (
                  <span className="absolute -top-3 left-4 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded-sm">RC #{idx + 1}</span>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  <div className="space-y-4">
                    <DataRow label="Vehicle Number" value={rcItem.vehicle_number} highlight />
                    <DataRow label="Owner Name" value={rcItem.owner} />
                    <DataRow label="Father Name" value={rcItem.father_name} />
                    <DataRow label="Vehicle Class" value={rcItem.vehicle_class} />
                    <DataRow label="Fuel Type" value={rcItem.fuel_type} />
                    <DataRow label="Maker Model" value={rcItem.maker_model} />
                  </div>
                  <div className="space-y-4">
                    <DataRow label="Registration Date" value={formatModalValue('registration_date', rcItem.registration_date)} />
                    <DataRow label="Fitness Upto" value={formatModalValue('fit_upto', rcItem.fit_upto)} />
                    <DataRow label="Insurance Upto" value={formatModalValue('insurance_valid_till', rcItem.insurance_valid_till)} />
                    <DataRow label="PUCC Upto" value={formatModalValue('pucc_upto', rcItem.pucc_upto)} />
                    <DataRow label="Tax Upto" value={formatModalValue('tax_upto', rcItem.tax_upto)} />
                    <DataRow label="Verified On" value={formatModalValue('created_at', rcItem.created_at)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'challan':
        const challanList = Array.isArray(data) ? data : [data];
        if (challanList.length === 0) return <p className="text-sm text-slate-500">No challans found.</p>;
        
        return (
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Vehicle No</th>
                  <th className="px-4 py-3">Challan No</th>
                  <th className="px-4 py-3">Offense</th>
                  <th className="px-4 py-3">Place</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {challanList.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{i + 1}</td>
                    <td className="px-4 py-3 text-slate-700">{c.number}</td>
                    <td className="px-4 py-3 text-slate-700">{c.challan_number}</td>
                    <td className="px-4 py-3 text-slate-700 truncate max-w-[200px]" title={c.offense_details}>{c.offense_details}</td>
                    <td className="px-4 py-3 text-slate-700 truncate max-w-[150px]" title={c.challan_place}>{c.challan_place}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">₹{c.amount}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${(c.challan_status === 'paid' || c.challan_status === 'disposed') ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {c.challan_status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{formatModalValue('challan_date_time', c.challan_date_time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        // Generic renderer for undefined types
        return (
          <div className="space-y-3">
            {Object.entries(data).map(([key, value]) => {
              if (typeof value === 'object' || hiddenFields.includes(key.toLowerCase())) return null;
              return (
                <div key={key} className="flex flex-col border-b border-slate-50 pb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-semibold text-slate-800">{formatModalValue(key, value)}</span>
                </div>
              );
            })}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <h3 className="font-black text-slate-800 text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-1 rounded-md shadow-xs border border-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar bg-white">
          {renderContent()}
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-700 transition-colors shadow-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
const VerificationTab = ({ documentVerification, courtCheck, courtCheckApiData, davStatus, springVerifyStatus, role }) => {
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: '', data: null, type: '' });

  if (!documentVerification) return null;

  const { face_match, dl, pan, aadhar, challan, voter, rc, gst } = documentVerification;

  const openModal = (title, data, type = '') => {
    setModalConfig({ isOpen: true, title, data, type });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Face Match - Driver Only */}
        {role === 'driver' && (
          <VerificationCard 
            title="Face Match" 
            icon={UserCheck} 
            isVerified={face_match?.verified == 1}
            isPending={!face_match}
            onViewDetails={() => openModal('Face Match', face_match, 'face')}
          >
            {face_match ? (
              <div>
                <span className={`inline-flex px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider mb-3 ${
                  face_match.verified == 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                }`}>
                  {face_match.verified == 1 ? 'Verified' : 'Failed'}
                </span>
                <div className="space-y-1.5 mt-2">
                  <small className="text-slate-500 font-medium block">Similarity: {face_match.similarity}%</small>
                  <small className="text-slate-500 font-medium block">Threshold: {face_match.threshold}%</small>
                  <small className="text-slate-400 flex items-center gap-1.5 mt-2">
                    <Calendar className="w-3 h-3" /> {formatDate(face_match.created_at)}
                  </small>
                </div>
              </div>
            ) : (
              <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 rounded-sm text-[10px] font-bold uppercase tracking-wider">
                Not Submitted
              </span>
            )}
          </VerificationCard>
        )}

        {/* Driving License - Driver Only */}
        {role === 'driver' && (
          <VerificationCard 
            title="Driving License" 
            icon={CreditCard} 
            isVerified={dl?.status === 'verified'}
            isPending={!dl}
            onViewDetails={() => openModal('Driving License', dl, 'dl')}
          >
            {dl ? (
              <div>
                <span className={`inline-flex px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider mb-3 ${
                  dl.status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {dl.status}
                </span>
                <div className="space-y-1.5 mt-2">
                  <small className="text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" /> Issued: {formatDate(dl.created_at)}
                  </small>
                  {dl.expiry_date && (
                    <small className="text-slate-400 flex items-center gap-1.5 text-amber-600">
                      <AlertCircle className="w-3 h-3" /> Expires: {formatDate(dl.expiry_date)}
                    </small>
                  )}
                </div>
              </div>
            ) : (
              <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 rounded-sm text-[10px] font-bold uppercase tracking-wider">
                Not Submitted
              </span>
            )}
          </VerificationCard>
        )}

        {/* PAN Card - All */}
        <VerificationCard 
          title="PAN Card" 
          icon={CreditCard} 
          isVerified={!!pan}
          isPending={!pan}
          onViewDetails={() => openModal('PAN Card', pan, 'pan')}
        >
          {pan ? (
            <div>
              <span className="inline-flex px-2 py-1 bg-emerald-100 text-emerald-700 rounded-sm text-[10px] font-bold uppercase tracking-wider mb-3">
                Verified
              </span>
              <div className="space-y-1.5 mt-2">
                <small className="text-slate-700 font-bold block">{pan.full_name}</small>
                <small className="text-slate-400 flex items-center gap-1.5 mt-2">
                  <Calendar className="w-3 h-3" /> {formatDate(pan.created_at)}
                </small>
              </div>
            </div>
          ) : (
            <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 rounded-sm text-[10px] font-bold uppercase tracking-wider">
              Not Submitted
            </span>
          )}
        </VerificationCard>

        {/* Aadhaar Card - Driver Only */}
        {role === 'driver' && (
          <VerificationCard 
            title="Aadhaar Card" 
            icon={FileText} 
            isVerified={!!aadhar}
            isPending={!aadhar}
            onViewDetails={() => openModal('Aadhaar Card', aadhar, 'aadhar')}
          >
            {aadhar ? (
              <div>
                <span className="inline-flex px-2 py-1 bg-emerald-100 text-emerald-700 rounded-sm text-[10px] font-bold uppercase tracking-wider mb-3">
                  Verified
                </span>
                <div className="space-y-1.5 mt-2">
                  <small className="text-slate-700 font-bold block">{aadhar.name_on_card}</small>
                  <small className="text-slate-500 font-mono block">XXXX-XXXX-{aadhar.card_number?.slice(-4)}</small>
                  <small className="text-slate-400 flex items-center gap-1.5 mt-2">
                    <Calendar className="w-3 h-3" /> {formatDate(aadhar.created_at)}
                  </small>
                </div>
              </div>
            ) : (
              <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 rounded-sm text-[10px] font-bold uppercase tracking-wider">
                Not Submitted
              </span>
            )}
          </VerificationCard>
        )}

        {/* Court Check - Driver Only */}
        {role === 'driver' && (
          <VerificationCard 
            title="Court Check" 
          icon={Gavel} 
          isVerified={courtCheck?.report === 'green'}
          isPending={!courtCheck}
          onViewDetails={() => openModal('Court Check', courtCheck, 'court')}
        >
          {courtCheck ? (
            <div>
              <span className={`inline-flex px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider mb-3 ${
                courtCheck.report === 'green' ? 'bg-emerald-100 text-emerald-700' : 
                courtCheck.report === 'red' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {courtCheck.report}
              </span>
              <div className="space-y-1.5 mt-2">
                {courtCheck.statusMsg && (
                  <small className="text-slate-500 font-medium block">{courtCheck.statusMsg}</small>
                )}
                <small className="text-slate-400 flex items-center gap-1.5 mt-2">
                  <Calendar className="w-3 h-3" /> 
                  {formatDate(courtCheck.date_of_verification || courtCheck.created_at)}
                </small>
              </div>

              {courtCheckApiData && courtCheckApiData.matchedCaseDetails && courtCheckApiData.matchedCaseDetails.length > 0 && (
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <small className="text-red-600 font-bold flex items-center gap-1 mb-2">
                    <AlertCircle className="w-3 h-3" /> Matched Cases:
                  </small>
                  <ul className="space-y-2">
                    {courtCheckApiData.matchedCaseDetails.map((caseItem, idx) => (
                      <li key={idx} className="bg-red-50 p-2 rounded-sm border border-red-100 text-[10px]">
                        <strong className="text-slate-700 block mb-0.5">Case: {caseItem.caseNumber || 'N/A'}</strong>
                        <span className="text-slate-600 block">PS: {caseItem.policeStation || 'N/A'}</span>
                        <span className="text-slate-600 block">Status: {caseItem.caseStatus || 'N/A'}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {courtCheckApiData && courtCheckApiData.reportUrl && (
                <div className="mt-4">
                  <a href={courtCheckApiData.reportUrl} target="_blank" rel="noopener noreferrer" 
                     className="flex items-center justify-center w-full py-1.5 px-3 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-md text-xs font-bold transition-colors">
                     View Court Report
                  </a>
                </div>
              )}
            </div>
          ) : (
            <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 rounded-sm text-[10px] font-bold uppercase tracking-wider">
              Not Submitted
            </span>
          )}
        </VerificationCard>
        )}

        {/* Challan Records - Driver & Transporter */}
        <VerificationCard 
          title="Challan Records" 
          icon={Receipt} 
          isVerified={challan && challan.length === 0}
          isPending={!challan}
          onViewDetails={challan && challan.length > 0 ? () => openModal('Challan Records', challan, 'challan') : null}
        >
          {challan ? (
            <div>
              <span className={`inline-flex px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider mb-3 ${
                challan.length === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
              }`}>
                {challan.length === 0 ? 'No Challans' : `${challan.length} Challan(s)`}
              </span>
              <div className="space-y-1.5 mt-2">
                <small className="text-slate-500 block">Status: {challan.length === 0 ? 'Clear' : 'Found Records'}</small>
              </div>
            </div>
          ) : (
            <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 rounded-sm text-[10px] font-bold uppercase tracking-wider">Not Submitted</span>
          )}
        </VerificationCard>

        {/* DAV Status - Driver Only */}
        {role === 'driver' && (
          <VerificationCard 
            title="DAV Status" 
            icon={FileText} 
            isVerified={davStatus?.verification_status == 1}
            isPending={!davStatus}
            onViewDetails={davStatus ? () => openModal('DAV Status', davStatus, 'dav') : null}
          >
            {davStatus ? (
              <div>
                <span className={`inline-flex px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider mb-3 ${
                  davStatus.verification_status == 1 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {davStatus.verification_status == 1 ? 'Verified' : 'Pending'}
                </span>
                <div className="space-y-1.5 mt-2">
                  {davStatus.address && <small className="text-slate-500 block truncate" title={davStatus.address}>{davStatus.address}</small>}
                  <small className="text-slate-400 flex items-center gap-1.5 mt-2">
                    <Calendar className="w-3 h-3" /> {formatDate(davStatus.created_at)}
                  </small>
                </div>
              </div>
            ) : (
              <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 rounded-sm text-[10px] font-bold uppercase tracking-wider">Not Submitted</span>
            )}
          </VerificationCard>
        )}

        {/* Physical Address Verification - Driver Only */}
        {role === 'driver' && (
          <VerificationCard 
            title="Physical Address" 
            icon={MapPin} 
            isVerified={springVerifyStatus?.application_status === 'completed'}
            isPending={!springVerifyStatus}
            onViewDetails={springVerifyStatus ? () => openModal('Physical Address', springVerifyStatus, 'spring') : null}
          >
            {springVerifyStatus ? (
              <div>
                <span className={`inline-flex px-2 py-1 rounded-sm text-[10px] font-bold uppercase tracking-wider mb-3 ${
                  springVerifyStatus.application_status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                  springVerifyStatus.application_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {springVerifyStatus.application_status || 'Pending'}
                </span>
                <div className="space-y-1.5 mt-2">
                  <small className="text-slate-500 block">ID Check: {springVerifyStatus.id_check_status || 'N/A'}</small>
                  <small className="text-slate-400 flex items-center gap-1.5 mt-2">
                    <Calendar className="w-3 h-3" /> {formatDate(springVerifyStatus.created_at)}
                  </small>
                </div>
              </div>
            ) : (
              <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 rounded-sm text-[10px] font-bold uppercase tracking-wider">Not Initiated</span>
            )}
          </VerificationCard>
        )}

        {/* GST Details - Transporter Only */}
        {role === 'transporter' && (
          <VerificationCard 
            title="GST Details" 
            icon={Building} 
            isVerified={gst && gst.length > 0}
            isPending={!gst || gst.length === 0}
            onViewDetails={gst && gst.length > 0 ? () => openModal('GST Details', gst, 'gst') : null}
          >
            {gst && gst.length > 0 ? (
              <div>
                <span className="inline-flex px-2 py-1 rounded-sm bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-3">
                  Verified
                </span>
                <div className="space-y-1.5 mt-2">
                  <small className="text-slate-700 font-bold block">{gst[0].legal_name || 'N/A'}</small>
                  <small className="text-slate-500 font-mono block">{gst[0].gstin || 'N/A'}</small>
                </div>
              </div>
            ) : (
              <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 rounded-sm text-[10px] font-bold uppercase tracking-wider">Not Submitted</span>
            )}
          </VerificationCard>
        )}

        {/* RC Details - Transporter Only */}
        {role === 'transporter' && (
          <VerificationCard 
            title="RC Details" 
            icon={Truck} 
            isVerified={rc && rc.length > 0}
            isPending={!rc || rc.length === 0}
            onViewDetails={rc && rc.length > 0 ? () => openModal('RC Details', rc, 'rc') : null}
          >
            {rc && rc.length > 0 ? (
              <div>
                <span className="inline-flex px-2 py-1 rounded-sm bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-3">
                  Verified
                </span>
                <div className="space-y-1.5 mt-2">
                  <small className="text-slate-700 font-bold block">{rc[0].owner || 'N/A'}</small>
                  <small className="text-slate-500 font-mono block">{rc[0].rc_number || 'N/A'}</small>
                </div>
              </div>
            ) : (
              <span className="inline-flex px-2 py-1 bg-slate-100 text-slate-600 rounded-sm text-[10px] font-bold uppercase tracking-wider">Not Submitted</span>
            )}
          </VerificationCard>
        )}
      </div>

      <DetailsModal 
        isOpen={modalConfig.isOpen} 
        onClose={() => setModalConfig({ isOpen: false, title: '', data: null, type: '' })}
        title={modalConfig.title}
        data={modalConfig.data}
        type={modalConfig.type}
      />
    </div>
  );
};

export default VerificationTab;
