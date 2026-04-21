import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  CheckCircle, XCircle, Search, RefreshCw, 
  Clock, AlertCircle, User, BookOpen, 
  Building2, ShieldCheck, Filter
} from 'lucide-react';

const StaffApprovals = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('pending');

    // 🛡️ Get staff info from localStorage
    const staffName = localStorage.getItem('full_name') || 'Staff';
    const assignedNode = localStorage.getItem('assigned_node') || 'library_status';
    
    // Format office name for display (e.g., library_status -> LIBRARY)
    const officeName = assignedNode.replace('_status', '').toUpperCase();

    const API_BASE_URL = 'http://192.168.137.1:5000/api/v1/admin';

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch requests specifically for this office node
            const response = await axios.get(`${API_BASE_URL}/clearance-requests?node=${assignedNode}`);
            if (response.data?.success) {
                setRequests(response.data.data || []);
            }
        } catch (err) {
            console.error("Staff Fetch Error:", err);
            setError("ዳታውን መጫን አልተቻለም። ሰርቨሩ መኖሩን ያረጋግጡ።");
        } finally {
            setLoading(false);
        }
    }, [assignedNode]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAction = async (requestId, action) => {
        const confirmMsg = action === 'approved' ? "ጥያቄውን ማጽደቅ ይፈልጋሉ?" : "ጥያቄውን መሰረዝ ይፈልጋሉ?";
        if (!window.confirm(confirmMsg)) return;

        try {
            const res = await axios.patch(`${API_BASE_URL}/update-status/${requestId}`, {
                status: action,
                node: assignedNode,
                remark: `Processed at ${officeName} by ${staffName}`
            });

            if (res.data.success) {
                fetchRequests(); // Refresh list
            }
        } catch (err) {
            alert("Action failed. Please try again.");
        }
    };

    // Filter logic
    const filteredData = requests.filter(req => {
        const matchesSearch = req.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             req.identifier_id?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen font-sans">
            
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

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="bg-blue-50 p-4 rounded-2xl text-blue-600"><Clock size={28}/></div>
                    <div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Pending</p>
                        <h3 className="text-2xl font-black text-slate-800">{requests.filter(r => r.status === 'pending').length}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="bg-emerald-50 p-4 rounded-2xl text-emerald-600"><CheckCircle size={28}/></div>
                    <div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Approved</p>
                        <h3 className="text-2xl font-black text-slate-800">{requests.filter(r => r.status === 'approved').length}</h3>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="bg-red-50 p-4 rounded-2xl text-red-600"><XCircle size={28}/></div>
                    <div>
                        <p className="text-slate-400 text-xs font-black uppercase tracking-widest">Rejected</p>
                        <h3 className="text-2xl font-black text-slate-800">{requests.filter(r => r.status === 'rejected').length}</h3>
                    </div>
                </div>
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

            {/* Table Section */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th className="px-8 py-5 text-slate-500 font-bold text-xs uppercase tracking-widest">Student Information</th>
                                <th className="px-8 py-5 text-slate-500 font-bold text-xs uppercase tracking-widest">Department</th>
                                <th className="px-8 py-5 text-slate-500 font-bold text-xs uppercase tracking-widest">Status</th>
                                <th className="px-8 py-5 text-slate-500 font-bold text-xs uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr><td colSpan="4" className="py-24 text-center text-slate-400 font-bold animate-pulse">Fetching records...</td></tr>
                            ) : error ? (
                                <tr><td colSpan="4" className="py-24 text-center text-red-500 font-bold"><AlertCircle className="inline mr-2"/>{error}</td></tr>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((req) => (
                                    <tr key={req.id} className="hover:bg-blue-50/30 transition-all group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 font-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-slate-800 text-lg">{req.full_name}</p>
                                                    <p className="text-xs text-slate-400 font-mono font-bold tracking-wider">{req.identifier_id}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <p className="text-slate-600 font-semibold">{req.department_name}</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight shadow-sm border ${
                                                req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                                req.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                                'bg-red-50 text-red-600 border-red-100'
                                            }`}>
                                                {req.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {req.status === 'pending' ? (
                                                <div className="flex items-center justify-end gap-3">
                                                    <button 
                                                        onClick={() => handleAction(req.id, 'approved')}
                                                        className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <CheckCircle size={16} /> Approve
                                                    </button>
                                                    <button 
                                                        onClick={() => handleAction(req.id, 'rejected')}
                                                        className="flex items-center gap-2 bg-red-50 text-red-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-red-600 hover:text-white transition-all shadow-sm"
                                                    >
                                                        <XCircle size={16} /> Reject
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="text-slate-300 flex items-center justify-end gap-2 text-xs font-bold italic">
                                                    <ShieldCheck size={16} /> Processed
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