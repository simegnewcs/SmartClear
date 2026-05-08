import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';  // Use authenticated API instance
import { 
  CheckCircle, XCircle, Search, RefreshCw, 
  Clock, AlertCircle, User, BookOpen, 
  Building2, ShieldCheck, Filter, Lock
} from 'lucide-react';

const StaffApprovals = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [history, setHistory] = useState([]);
    const [stats, setStats] = useState({ approved: 0, rejected: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('pending');
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'history'

    // 🛡️ Get staff info from localStorage
    const staffName = localStorage.getItem('full_name') || 'Staff';
    const userRole = localStorage.getItem('role');
    const assignedNode = localStorage.getItem('assigned_node') || 'library_status';

    // Redirect supervisor users to their own dashboard
    useEffect(() => {
        if (userRole === 'supervisor') {
            navigate('/supervisor-approvals', { replace: true });
        }
    }, [userRole, navigate]);
    
    // Format office name for display (e.g., library_status -> LIBRARY)
    const officeName = assignedNode.replace('_status', '').toUpperCase();

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch pending approvals
            const pendingRes = await api.get('/staff/my-pending-approvals');
            if (pendingRes.data?.success) {
                setRequests(pendingRes.data.data || []);
            }
            
            // Fetch staff dashboard stats (includes history)
            const dashboardRes = await api.get('/staff/dashboard');
            if (dashboardRes.data?.success) {
                setStats({
                    approved: dashboardRes.data.stats?.total_approved || 0,
                    rejected: dashboardRes.data.stats?.total_rejected || 0,
                    today: dashboardRes.data.stats?.approved_today || 0
                });
                // Recent activity includes who approved
                setHistory(dashboardRes.data.recent_activity || []);
            }
        } catch (err) {
            console.error("Staff Fetch Error:", err);
            if (err.response?.status === 401) {
                setError("Session expired. Please login again.");
                setTimeout(() => window.location.href = '/login', 2000);
            } else {
                setError("Failed to load requests. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAction = async (requestId, action) => {
        const confirmMsg = action === 'approved' ? "ጥያቄውን ማጽደቅ ይፈልጋሉ?" : "ጥያቄውን መሰረዝ ይፈልጋሉ?";
        if (!window.confirm(confirmMsg)) return;

        try {
            // Use the staff approve-request endpoint with authentication
            const res = await api.post('/staff/approve-request', {
                request_id: requestId,
                action: action,
                remarks: `Processed at ${officeName} by ${staffName}`
            });

            if (res.data.success) {
                alert(`Request ${action} successfully!`);
                fetchRequests(); // Refresh list
            }
        } catch (err) {
            console.error("Action Error:", err);
            if (err.response?.status === 401) {
                alert("Session expired. Please login again.");
                window.location.href = '/login';
            } else {
                alert(err.response?.data?.message || "Action failed. Please try again.");
            }
        }
    };

    // Filter logic
    const filteredData = requests.filter(req => {
        const searchName = req.applicant_name || req.full_name || '';
        const searchId = req.applicant_id_number || req.identifier_id || '';
        const matchesSearch = searchName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             searchId.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || req.node_status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans relative z-10">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                        <Building2 className="text-blue-600" size={32} />
                        {officeName} APPROVALS
                    </h1>
                    <p className="text-slate-500 font-medium mt-1">
                        Welcome back, <span className="text-blue-600 font-bold">{staffName}</span>. Managing student clearances.
                    </p>
                </div>
                <button 
                    onClick={fetchRequests}
                    className="flex items-center gap-2 bg-white border border-slate-200 px-6 py-3 rounded-2xl font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                    <RefreshCw size={20} className={loading ? 'animate-spin text-blue-600' : ''} />
                    Sync Requests
                </button>
            </div>

            {/* Stats Overview - Responsive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-8">
                <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl lg:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-5 text-center sm:text-left">
                    <div className="bg-blue-50 p-2 sm:p-3 lg:p-4 rounded-xl lg:rounded-2xl text-blue-600 flex-shrink-0"><Clock size={20} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7"/></div>
                    <div className="min-w-0">
                        <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest truncate">Ready</p>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-800">{requests.filter(r => r.node_status === 'pending').length}</h3>
                    </div>
                </div>
                <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl lg:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-5 text-center sm:text-left">
                    <div className="bg-amber-50 p-2 sm:p-3 lg:p-4 rounded-xl lg:rounded-2xl text-amber-600 flex-shrink-0"><Lock size={20} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7"/></div>
                    <div className="min-w-0">
                        <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest truncate">Waiting</p>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-800">{requests.filter(r => r.node_status === 'locked').length}</h3>
                    </div>
                </div>
                <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl lg:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-5 text-center sm:text-left">
                    <div className="bg-emerald-50 p-2 sm:p-3 lg:p-4 rounded-xl lg:rounded-2xl text-emerald-600 flex-shrink-0"><CheckCircle size={20} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7"/></div>
                    <div className="min-w-0">
                        <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest truncate">Approved</p>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-800">{stats.approved}</h3>
                    </div>
                </div>
                <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl lg:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-5 text-center sm:text-left">
                    <div className="bg-red-50 p-2 sm:p-3 lg:p-4 rounded-xl lg:rounded-2xl text-red-600 flex-shrink-0"><XCircle size={20} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7"/></div>
                    <div className="min-w-0">
                        <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest truncate">Rejected</p>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-800">{stats.rejected}</h3>
                    </div>
                </div>
                <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl sm:rounded-2xl lg:rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 lg:gap-5 text-center sm:text-left">
                    <div className="bg-purple-50 p-2 sm:p-3 lg:p-4 rounded-xl lg:rounded-2xl text-purple-600 flex-shrink-0"><CheckCircle size={20} className="sm:w-6 sm:h-6 lg:w-7 lg:h-7"/></div>
                    <div className="min-w-0">
                        <p className="text-slate-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider sm:tracking-widest truncate">Today</p>
                        <h3 className="text-xl sm:text-2xl font-black text-slate-800">{stats.today || 0}</h3>
                    </div>
                </div>
            </div>

            {/* Tab Toggle */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                        activeTab === 'pending' 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                >
                    Pending Requests ({requests.length})
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                        activeTab === 'history' 
                        ? 'bg-blue-600 text-white shadow-lg' 
                        : 'bg-white text-slate-600 border border-slate-200'
                    }`}
                >
                    My Approval History ({history.length})
                </button>
            </div>

            {/* Controls Row */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-6 flex flex-col lg:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                    <input 
                        type="text" 
                        placeholder="ተማሪ በስም ወይም በ ID ይፈልጉ..."
                        className="w-full pl-12 pr-6 py-3.5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-500/5 transition-all font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 w-full lg:w-auto">
                    {['all', 'pending', 'approved', 'rejected'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tight transition-all ${
                                filterStatus === status 
                                ? 'bg-white text-blue-600 shadow-sm' 
                                : 'text-slate-400 hover:text-slate-600'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table Section - Responsive */}
            <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="overflow-x-auto">
                    {activeTab === 'pending' ? (
                        <table className="w-full text-left table-fixed">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-slate-500 font-bold text-xs uppercase tracking-widest w-[35%] sm:w-[40%]">Student</th>
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-slate-500 font-bold text-xs uppercase tracking-widest hidden sm:table-cell w-[20%]">Department</th>
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-slate-500 font-bold text-xs uppercase tracking-widest w-[25%] sm:w-[15%] text-center">Status</th>
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-slate-500 font-bold text-xs uppercase tracking-widest w-[40%] sm:w-[25%] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="4" className="py-16 sm:py-24 text-center text-slate-400 font-bold animate-pulse">Fetching records...</td></tr>
                                ) : error ? (
                                    <tr><td colSpan="4" className="py-16 sm:py-24 text-center text-red-500 font-bold px-4"><AlertCircle className="inline mr-2"/>{error}</td></tr>
                                ) : filteredData.length > 0 ? (
                                    filteredData.map((req) => (
                                        <tr key={req.request_id} className="hover:bg-blue-50/30 transition-all group">
                                            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                                                <div className="flex items-center gap-3 sm:gap-4">
                                                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-black group-hover:bg-blue-600 group-hover:text-white transition-all flex-shrink-0">
                                                        <User size={18} className="sm:w-5 sm:h-5" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-extrabold text-slate-800 text-sm sm:text-base lg:text-lg truncate">{req.applicant_name || req.full_name}</p>
                                                        <p className="text-xs text-slate-400 font-mono font-bold tracking-wider truncate">{req.applicant_id_number || req.identifier_id}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 hidden sm:table-cell">
                                                <p className="text-slate-600 font-semibold text-sm truncate">{req.applicant_department || req.department_name}</p>
                                            </td>
                                            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-center">
                                                <span className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-wide shadow-md border-2 min-w-[80px] sm:min-w-[100px] lg:min-w-[120px] ${
                                                    req.node_status === 'pending' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 
                                                    req.node_status === 'locked' ? 'bg-amber-100 text-amber-700 border-amber-300' :
                                                    req.node_status === 'approved' ? 'bg-blue-100 text-blue-700 border-blue-300' : 
                                                    'bg-red-100 text-red-700 border-red-300'
                                                }`}>
                                                    {req.node_status === 'pending' && <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />}
                                                    {req.node_status === 'locked' && <Lock size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />}
                                                    {req.node_status === 'approved' && <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />}
                                                    {req.node_status === 'rejected' && <XCircle size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />}
                                                    <span className="whitespace-nowrap">{req.node_status}</span>
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-right">
                                                {req.node_status === 'pending' ? (
                                                    <div className="flex items-center justify-end gap-2 sm:gap-3 flex-wrap">
                                                        <button 
                                                            onClick={() => handleAction(req.request_id, 'approved')}
                                                            className="flex items-center gap-1.5 sm:gap-2 bg-emerald-50 text-emerald-600 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-sm whitespace-nowrap"
                                                        >
                                                            <CheckCircle size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Approve</span><span className="sm:hidden">✓</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAction(req.request_id, 'rejected')}
                                                            className="flex items-center gap-1.5 sm:gap-2 bg-red-50 text-red-600 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs hover:bg-red-600 hover:text-white transition-all shadow-sm whitespace-nowrap"
                                                        >
                                                            <XCircle size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Reject</span><span className="sm:hidden">✕</span>
                                                        </button>
                                                    </div>
                                                ) : req.node_status === 'locked' ? (
                                                    <div className="text-amber-500 flex items-center justify-end gap-1.5 sm:gap-2 text-xs font-bold">
                                                        <Lock size={14} className="sm:w-4 sm:h-4" /> <span className="truncate hidden sm:inline">Waiting...</span>
                                                    </div>
                                                ) : (
                                                    <div className="text-slate-300 flex items-center justify-end gap-1.5 sm:gap-2 text-xs font-bold italic">
                                                        <ShieldCheck size={14} className="sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Done</span>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-32 text-center">
                                            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <BookOpen size={40} className="text-slate-200" />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight">No Requests Found</h3>
                                            <p className="text-slate-400 font-medium">All students are currently up-to-date.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        /* History Tab - Responsive */
                        <table className="w-full text-left table-fixed">
                            <thead className="bg-slate-50/50 border-b border-slate-100">
                                <tr>
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-slate-500 font-bold text-xs uppercase tracking-widest w-[30%] sm:w-[35%]">Student</th>
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-slate-500 font-bold text-xs uppercase tracking-widest w-[20%] sm:w-[15%] text-center">Action</th>
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-slate-500 font-bold text-xs uppercase tracking-widest hidden sm:table-cell w-[25%]">Approved By</th>
                                    <th className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 text-slate-500 font-bold text-xs uppercase tracking-widest w-[50%] sm:w-[25%] text-right">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loading ? (
                                    <tr><td colSpan="4" className="py-16 sm:py-24 text-center text-slate-400 font-bold animate-pulse px-4">Fetching history...</td></tr>
                                ) : history.length > 0 ? (
                                    history.map((log, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-all">
                                            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                                                <p className="font-bold text-slate-800 text-sm sm:text-base truncate">{log.applicant_name}</p>
                                                <p className="text-xs text-slate-400 truncate">#{log.request_id}</p>
                                            </td>
                                            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-center">
                                                <span className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 lg:px-5 py-1.5 sm:py-2 rounded-full text-xs font-bold uppercase tracking-wide shadow-md border-2 min-w-[80px] sm:min-w-[100px] lg:min-w-[120px] ${
                                                    log.action === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : 
                                                    'bg-red-100 text-red-700 border-red-300'
                                                }`}>
                                                    {log.action === 'approved' ? <CheckCircle size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" /> : <XCircle size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />}
                                                    <span className="whitespace-nowrap">{log.action}</span>
                                                </span>
                                            </td>
                                            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 hidden sm:table-cell">
                                                <p className="font-semibold text-slate-700 text-sm truncate">{log.approver_name}</p>
                                                <p className="text-xs text-slate-400 truncate">{log.node_name?.replace('_status', '')}</p>
                                            </td>
                                            <td className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 text-right">
                                                <p className="text-slate-600 font-medium text-sm">{new Date(log.created_at).toLocaleDateString()}</p>
                                                <p className="text-xs text-slate-400">{new Date(log.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-32 text-center">
                                            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <BookOpen size={40} className="text-slate-200" />
                                            </div>
                                            <h3 className="text-xl font-black text-slate-800 tracking-tight">No History Yet</h3>
                                            <p className="text-slate-400 font-medium">Your approvals will appear here.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 text-center pb-8 border-t border-slate-100 pt-8">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">
                    System Security Managed by <span className="text-slate-900">DEVVOLTZ Intelligence</span>
                </p>
            </div>
        </div>
    );
};

export default StaffApprovals;