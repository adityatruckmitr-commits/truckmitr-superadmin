import { useQuery } from '@tanstack/react-query';
import {
    X, User, Calendar, Phone, MapPin, Star, Shield,
    Activity, CalendarDays, Mail, FileText, CheckCircle2,
    Clock, AlertTriangle, ChevronDown, Award, Smile, Info
} from 'lucide-react-teleadmin';
import { useState } from 'react';
import jobMatchingApi from '../services/api/jobMatchingApi';

const IMAGE_BASE_URL = 'https://truckmitr.com/public/';

const SECTION_QUESTIONS = [
    { title: "Experience & Skills", startIndex: 0, endIndex: 6, scoreKey: "Experience & Skills" },
    { title: "Document & Identity", startIndex: 6, endIndex: 9, scoreKey: "Document Accuracy" },
    { title: "Compliance & Background", startIndex: 9, endIndex: 13, scoreKey: "Compliance & Background" },
    { title: "Availability & Readiness", startIndex: 13, endIndex: 18, scoreKey: "Location & Availability" },
    { title: "Medical & Fitness", startIndex: 18, endIndex: 20 },
    { title: "Technology Readiness", startIndex: 20, endIndex: 24, scoreKey: "Technology & Readiness" },
    { title: "Verification Consent", startIndex: 24, endIndex: 26, scoreKey: "Verification & Consent" },
    { title: "Financial & Intent", startIndex: 26, endIndex: 32, scoreKey: "Intent & Stability" },
];

const QUESTIONS_TEXT = [
    "1. कृपया अपना पूरा नाम बताइए, जैसा कि आपके ड्राइविंग लाइसेंस में लिखा है।",
    "2. आपको ट्रेलर वाहन चलाने का कुल कितना वर्षों का अनुभव है?",
    "3. आपने किस प्रकार के ट्रेलर चलाए हैं?",
    "4. क्या आप वर्तमान में ट्रेलर चला रहे हैं?",
    "5. आपने आखिरी बार किस ट्रांसपोर्टर या कंपनी के साथ काम किया था?",
    "6. जिस ट्रेलर को आप आखिरी बार चला रहे थे, उसका अनुमानित GVW कितना था?",
    "7. क्या आपके ड्राइविंग लाइसेंस, आधार कार्ड और पैन कार्ड में आपका नाम, पिता का नाम और जन्मतिथि बिल्कुल एक जैसी है?",
    "8. क्या आपके सभी दस्तावेज़ (DL, आधार, पैन) वैध और मूल (Original) हैं?",
    "9. क्या आपको कभी किसी कंपनी ने दस्तावेज़ों में गड़बड़ी या वेरिफिकेशन फेल होने के कारण रिजेक्ट किया है?",
    "10. क्या आपको कभी किसी ट्रांसपोर्टर या कंपनी ने फायर किया, सस्पेंड किया या ब्लैकलिस्ट किया है?",
    "11. क्या ट्रेलर चलाते समय आपका कभी कोई एक्सीडेंट हुआ है?",
    "12. क्या आप ग्रीनलाइन के सभी नियम और SOPs को सख्ती से फॉलो करने के लिए तैयार हैं?",
    "13. क्या आप स्पीड लिमिट, रूट डिसिप्लिन और रेस्ट आवश्यकताओं जैसे नियमों का पालन करते हैं?",
    "14. क्या आप ग्रीनलाइन द्वारा बताए गए इंटरव्यू लोकेशन पर उसी तय तारीख को रिपोर्ट करने के लिए पूरी तरह तैयार हैं?",
    "15. क्या कोई मेडिकल, पारिवारिक या व्यक्तिगत समस्या है, जिससे आप तय तारीख पर रिपोर्ट नहीं कर पाएँगे?",
    "16. क्या आप इंटरव्यू के बाद आपको दिए गए किसी भी रूट पर गाड़ी चलाने के लिए तैयार हैं?",
    "17. क्या आप लंबी दूरी, नाइट ड्राइविंग और इंटरस्टेट रूट्स पर काम करने के लिए तैयार हैं?",
    "18. अगर अचानक रूट या वाहन बदल दिया जाए, तो आप सामान्यतः कैसे प्रतिक्रिया देते हैं?",
    "19. क्या आपको कोई मेडिकल समस्या है जैसे आँखों की कमजोरी, BP, डायबिटीज़, कमर दर्द आदि?",
    "20. क्या आपने पिछले 12 महीनों में कोई मेडिकल फिटनेस चेकअप करवाया है?",
    "21. क्या आपके पास स्मार्टफोन है जिसमें कैमरा, इंटरनेट और वीडियो कॉलिंग की सुविधा है?",
    "22. क्या आप ग्रीनलाइन अधिकारियों के साथ जब भी कहा जाए, वीडियो इंटरव्यू देने के लिए तैयार हैं?",
    "23. क्या आप इंटरव्यू और ऑनबोर्डिंग प्रक्रिया के दौरान अपना फोन चालू और reachable रखेंगे?",
    "24. क्या आप मोबाइल ऐप के ज़रिए हाज़िरी, ट्रिप अपडेट या डॉक्यूमेंट अपलोड करने में सहज हैं?",
    "25. क्या आप अपने ID, कोर्ट चेक और एड्रेस वेरिफिकेशन से जुड़े OTP साझा करने के लिए सहमत हैं?",
    "26. क्या आप बैकग्राउंड वेरिफिकेशन (कोर्ट, पुलिस, एड्रेस चेक) के लिए अपनी पूरी सहमति देते हैं?",
    "27. क्या आपके ऊपर किसी ट्रांसपोर्टर से लिया हुआ कोई लोन या एडवांस है?",
    "28. क्या आप कंपनी के सैलरी साइकल (मासिक / पखवाड़ा) से सहज हैं?",
    "29. यदि ग्रीनलाइन द्वारा चयन हो जाता है, तो आप कितने दिनों में जॉइन कर सकते हैं?",
    "30. आप ग्रीनलाइन के साथ काम क्यों करना चाहते हैं, अपनी पिछली या मौजूदा कंपनी के बजाय?",
    "31. क्या आपने कभी बिना बताए बीच में नौकरी छोड़ी है?",
    "32. यदि चयन हो जाता है, तो क्या आप पक्का कमिट करते हैं कि इंटरव्यू या सेलेक्शन के बाद ड्रॉप नहीं करेंगे?"
];

const ApplicantDetailsModal = ({ isOpen, onClose, jobId, userId, driverName }) => {
    const [activeTab, setActiveTab] = useState('screening'); // 'screening' or 'profile'

    const { data: detailsResponse, isLoading } = useQuery({
        queryKey: ['applicant-details', jobId, userId],
        queryFn: () => jobMatchingApi.getApplicantDetails(jobId, userId),
        enabled: isOpen && !!jobId && !!userId,
    });

    const data = detailsResponse?.data || {};
    const driverDetails = detailsResponse?.driver_details || {};
    const screening = data?.screening_questions || {};

    if (!isOpen) return null;

    const calculateScreeningScore = () => {
        if (!screening || !Object.keys(screening).length) {
            return { score: 0, status: "N/A", color: "gray", breakdown: {} };
        }

        let totalScore = 0;
        const breakdown = {};

        // 1. Experience & Skills (25)
        let expScore = 0;
        if (screening.answer2?.toLowerCase() === 'yes') expScore += 15;
        if (screening.answer3?.toLowerCase() === 'yes' && screening.answer6?.toLowerCase() === 'yes') expScore += 10;
        else if (screening.answer3?.toLowerCase() === 'yes') expScore += 5;
        breakdown["Experience & Skills"] = { earned: expScore, total: 25 };
        totalScore += expScore;

        // 2. Document Accuracy (20)
        let docScore = 0;
        if (screening.answer7?.toLowerCase() === 'yes') docScore += 15;
        if (screening.answer8?.toLowerCase() === 'yes') docScore += 5;
        breakdown["Document Accuracy"] = { earned: docScore, total: 20 };
        totalScore += docScore;

        // 3. Compliance & Background (15)
        let compScore = 0;
        if (screening.answer10?.toLowerCase() === 'no') compScore += 5;
        if (screening.answer11?.toLowerCase() === 'no') compScore += 5;
        if (screening.answer12?.toLowerCase() === 'yes' || screening.answer13?.toLowerCase() === 'yes') compScore += 5;
        breakdown["Compliance & Background"] = { earned: compScore, total: 15 };
        totalScore += compScore;

        // 4. Location & Availability (15)
        let locScore = 0;
        if (screening.answer14?.toLowerCase() === 'yes') locScore += 8;
        if (screening.answer15?.toLowerCase() === 'yes') locScore += 3;
        if (screening.answer16?.toLowerCase() === 'yes' || screening.answer17?.toLowerCase() === 'yes') locScore += 4;
        breakdown["Location & Availability"] = { earned: locScore, total: 15 };
        totalScore += locScore;

        // 5. Technology & Readiness (10)
        let techScore = 0;
        if (screening.answer21?.toLowerCase() === 'yes') techScore += 3;
        if (screening.answer22?.toLowerCase() === 'yes') techScore += 3;
        if (screening.answer23?.toLowerCase() === 'yes' || screening.answer24?.toLowerCase() === 'yes') techScore += 4;
        breakdown["Technology & Readiness"] = { earned: techScore, total: 10 };
        totalScore += techScore;

        // 6. Verification & Consent (10)
        let verScore = 0;
        if (screening.answer25?.toLowerCase() === 'yes' || screening.answer26?.toLowerCase() === 'yes') verScore += 10;
        breakdown["Verification & Consent"] = { earned: verScore, total: 10 };
        totalScore += verScore;

        // 7. Intent & Stability (5)
        let intentScore = 0;
        if (screening.answer31?.toLowerCase() === 'no' && screening.answer32?.toLowerCase() === 'yes') intentScore += 5;
        breakdown["Intent & Stability"] = { earned: intentScore, total: 5 };
        totalScore += intentScore;

        // Final Assessment
        const score = screening.result ? parseInt(screening.result) : totalScore;
        const status = screening.status || (score >= 80 ? "Recommended" : score >= 65 ? "Hold/Review" : "Reject");
        const color = score >= 80 ? "emerald" : score >= 65 ? "amber" : "red";

        return { score, status, color, breakdown };
    };

    const { score, status, color, breakdown } = calculateScreeningScore();

    return (
        <div className="fixed inset-0 z-[120] overflow-hidden">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />

            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">

                    {/* Header */}
                    <div className="p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-white/10 shadow-2xl bg-slate-800">
                                        <img
                                            src={driverDetails.images ? `${IMAGE_BASE_URL}${driverDetails.images}` : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-xl bg-${color}-500 flex items-center justify-center shadow-lg border-2 border-slate-900`}>
                                        <Award className="w-4 h-4 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black tracking-tight mb-1 uppercase">{driverName || driverDetails.name}</h2>
                                    <div className="flex items-center gap-4">
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
                                            <Shield className="w-3.5 h-3.5" />
                                            {driverDetails.unique_id}
                                        </span>
                                        <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400 bg-white/10 px-3 py-1 rounded-full uppercase tracking-wider">
                                            <Activity className="w-3.5 h-3.5" />
                                            {data.job_title}
                                        </span>
                                        <div className="text-white">{data.job_id}</div>
                                    </div>
                                </div>
                            </div>

                            <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/10 group">
                                <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
                            </button>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="flex bg-slate-50 border-b border-slate-100 shrink-0">
                        <button
                            onClick={() => setActiveTab('screening')}
                            className={`flex-1 py-5 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'screening' ? 'bg-white text-indigo-600 shadow-[inset_0_-4px_0_0_#4f46e5]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Screening Analysis
                        </button>
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`flex-1 py-5 text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'profile' ? 'bg-white text-indigo-600 shadow-[inset_0_-4px_0_0_#4f46e5]' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            Full Driver Profile
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-auto bg-white custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                                <div className="w-16 h-16 bg-slate-100 rounded-full mb-4" />
                                <div className="h-4 w-48 bg-slate-100 rounded-sm" />
                            </div>
                        ) : activeTab === 'screening' ? (
                            <div className="p-10">
                                {/* Score Dashboard */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                                    <div className={`bg-${color}-50 border-2 border-${color}-100 rounded-3xl p-6 flex flex-col items-center justify-center shadow-lg shadow-${color}-500/5`}>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Assessed Score</p>
                                        <h3 className={`text-5xl font-black text-${color}-600 tracking-tighter`}>{score}<span className="text-xl text-slate-300">/100</span></h3>
                                    </div>
                                    <div className="bg-slate-50 border-2 border-slate-100 rounded-3xl p-6 flex flex-col items-center justify-center col-span-2 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-3">
                                            <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-black text-indigo-600 uppercase tracking-widest shadow-xs">
                                                Status: {data.current_status || 'Pending'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className={`w-3 h-3 rounded-full bg-${color}-500 animate-pulse`} />
                                            <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{status}</h4>
                                        </div>
                                        <p className="text-xs font-bold text-slate-500 text-center px-8 mb-4">Recommendation is based on automated evaluation of document consistency, past experience, and compliance history.</p>

                                        {screening.telecaller_remarks && (
                                            <div className="mt-2 p-3 bg-indigo-50 border border-indigo-100/50 rounded-2xl w-full">
                                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1 px-1">Telecaller Remarks</p>
                                                <p className="text-xs font-bold text-slate-600 italic px-1 line-clamp-2">{screening.telecaller_remarks}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Screening Responses */}
                                <div className="space-y-10">
                                    {SECTION_QUESTIONS.map((section, sIdx) => (
                                        <div key={sIdx} className="relative">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center font-black text-indigo-600 text-sm">{sIdx + 1}</div>
                                                    <h5 className="text-lg font-black text-slate-800 uppercase tracking-tight">{section.title}</h5>
                                                </div>
                                                {section.scoreKey && breakdown[section.scoreKey] && (
                                                    <div className="flex flex-col items-end">
                                                        <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-xl border border-indigo-100 shadow-xs">
                                                            Score: {breakdown[section.scoreKey].earned} / {breakdown[section.scoreKey].total}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="h-px bg-slate-100 mb-6" />

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {QUESTIONS_TEXT.slice(section.startIndex, section.endIndex).map((q, qIdx) => {
                                                    const key = `answer${section.startIndex + qIdx + 1}`;
                                                    const val = screening[key] || 'N/A';
                                                    const isPositive = val?.toLowerCase() === 'yes';
                                                    const isNegative = val?.toLowerCase() === 'no';

                                                    return (
                                                        <div key={qIdx} className="bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all border border-slate-100 rounded-2xl p-4 flex flex-col justify-between gap-3 group">
                                                            <p className="text-xs font-bold text-slate-600 leading-snug group-hover:text-slate-900 transition-colors">{q}</p>
                                                            <div className="flex items-center justify-between mt-auto">
                                                                <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${isPositive ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                    isNegative ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                        'bg-slate-100 text-slate-500 border-slate-200'
                                                                    }`}>
                                                                    {val}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="p-10">
                                <div className="max-w-4xl mx-auto space-y-8">
                                    {/* Header Section */}
                                    <div className="flex items-center gap-8 bg-slate-50 border border-slate-100 rounded-[32px] p-8">
                                        <div className="relative shrink-0">
                                            <div className="w-32 h-32 rounded-3xl overflow-hidden border-4 border-white shadow-xl bg-slate-200">
                                                <img
                                                    src={driverDetails.images ? `${IMAGE_BASE_URL}${driverDetails.images}` : 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            {/* <div className="absolute -bottom-2 -left-2 bg-indigo-600 text-white rounded-xl px-2 py-1 shadow-lg border-2 border-white">
                                                <p className="text-[8px] font-black uppercase tracking-widest">{driverDetails.profile_completion || 0}% Complete</p>
                                            </div> */}
                                        </div>

                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight mb-1">{driverDetails.name}</h3>
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                        {driverDetails.unique_id}
                                                    </span>
                                                    <span className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                        <MapPin className="w-3 h-3" />
                                                        {driverDetails.states || 'N/A'}
                                                    </span>
                                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                                        <Phone className="w-3 h-3" />
                                                        {driverDetails.mobile}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Registered At */}
                                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">Registered At</p>
                                            <p className="text-sm font-bold text-slate-700">
                                                {driverDetails.Created_at
                                                    ? new Date(driverDetails.Created_at).toLocaleString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                        hour: 'numeric',
                                                        hour12: true
                                                    })
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        {/* DOB */}
                                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">Date of Birth</p>
                                            <p className="text-sm font-bold text-slate-700">
                                                {driverDetails.DOB
                                                    ? new Date(driverDetails.DOB).toLocaleDateString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })
                                                    : 'N/A'}
                                            </p>
                                        </div>
                                        {/* Driving Experience */}
                                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">Driving Experience</p>
                                            <p className="text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg inline-block">{driverDetails.Driving_Experience || 'N/A'} Years</p>
                                        </div>

                                        {/* License Number */}
                                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">License Number</p>
                                            <p className="text-sm font-bold text-slate-700 uppercase">{driverDetails.License_Number || 'N/A'}</p>
                                        </div>
                                        {/* Type of License */}
                                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">Type of License</p>
                                            <p className="text-sm font-bold text-slate-700">{driverDetails.Type_of_License || 'N/A'}</p>
                                        </div>
                                        {/* License Expiry */}
                                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">License Expiry Date</p>
                                            <p className="text-sm font-bold text-rose-600">
                                                {driverDetails.Expiry_date_of_License
                                                    ? new Date(driverDetails.Expiry_date_of_License).toLocaleDateString('en-GB', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric',
                                                    })
                                                    : 'N/A'}
                                            </p>
                                        </div>

                                        {/* Highest Education */}
                                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">Highest Education</p>
                                            <p className="text-sm font-bold text-slate-700">{driverDetails.Highest_Education || 'N/A'}</p>
                                        </div>
                                        {/* ID Check Status */}
                                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">ID Check Status</p>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${driverDetails.id_check === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                <p className={`text-sm font-black uppercase tracking-tight ${driverDetails.id_check === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>{driverDetails.id_check?.replace('_', ' ') || 'Pending'}</p>
                                            </div>
                                        </div>
                                        {/* Court Check Status */}
                                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">Court Check Status</p>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${driverDetails.court_check === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                <p className={`text-sm font-black uppercase tracking-tight ${driverDetails.court_check === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>{driverDetails.court_check?.replace('_', ' ') || 'Pending'}</p>
                                            </div>
                                        </div>

                                        {/* DAV Status */}
                                        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 font-mono">DAV Status</p>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${driverDetails.dav === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                                <p className={`text-sm font-black uppercase tracking-tight ${driverDetails.dav === 'verified' ? 'text-emerald-600' : 'text-amber-600'}`}>{driverDetails.dav?.replace('_', ' ') || 'Pending'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-slate-50 border-t border-slate-100 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <Info className="w-4 h-4 text-indigo-600" />
                                </div>
                                <p className="text-[10px] font-bold text-slate-500 max-w-sm leading-tight">These results are for screening purposes only and should be followed by a manual verification of documents and a physical driving test.</p>
                            </div>
                            <button onClick={onClose} className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl hover:-translate-y-1 active:scale-95">
                                Close Panel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ApplicantDetailsModal;
