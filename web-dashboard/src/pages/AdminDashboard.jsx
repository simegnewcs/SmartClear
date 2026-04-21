import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  Users, ClipboardCheck, Clock, Search, 
  RefreshCw, AlertCircle, ShieldCheck, Filter,
  CheckCircle, XCircle, UserCheck, ShieldAlert
} from 'lucide-react';

const AdminDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState({
        totalStudents: 0,
        pendingRequests: 0,
        completedClearances: 0,
        totalStaffs: 0, // አዲስ ለአድሚን
        totalUsers: 0   // አዲስ ለአድሚን
    });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);

    // 🛡️ ሚናውን እና ቢሮውን ከ localStorage እናውጣ
    const userRole = localStorage.getItem('role') || 'staff';
    const assignedNode = localStorage.getItem('assigned_node') || '';

    const API_BASE_URL = 'http://192.168.137.1:5000/api/v1/admin';

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // ለአድሚን እና ለስታፍ የተለያየ endpoint መጠቀም ይቻላል
            const endpoint = userRole === 'admin' 
                ? `${API_BASE_URL}/clearance-requests` 
                : `${API_BASE_URL}/clearance-requests?node=${assignedNode}`;

            const [requestsRes, statsRes] = await Promise.all([
                axios.get(endpoint),
                axios.get(`${API_BASE_URL}/stats`)
            ]);

            if (requestsRes.data?.success) {
                setRequests(requestsRes.data.data || []);
            }

            if (statsRes.data?.success) {
                setStats(statsRes.data.stats);
            }
        } catch (err) {
            console.error("Fetch Error:", err);
            setError("ዳታውን ማምጣት አልተቻለም። ሰርቨሩን ያረጋግጡ።");
        } finally {
            setLoading(false);
        }
    }, [userRole, assignedNode]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleStatusUpdate = async (id, newStatus) => {
        try {
            const res = await axios.patch(`${API_BASE_URL}/update-status/${id}`, {
                status: newStatus,
                remark: `Processed by ${userRole}`
            });
            if (res.data.success) {
                fetchData();
            }
        } catch (err) {
            alert("Update failed!");
        }
    };

    const filteredRequests = requests.filter(req => 
        req.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        req.identifier_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 bg-[#F8FAFC] min-h-screen">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">
                        {userRole === 'admin' ? 'System Overview' : 'Staff Workspace'}
                    </h1>
                    <p className="text-slate-500 font-medium">
                        {userRole === 'admin' ? 'Global system monitoring' : `Managing ${assignedNode.replace('_status', '')} approvals`}
                    </p>
                </div>
                <button onClick={fetchData} className="flex items-center gap-2 bg-white border px-5 py-2.5 rounded-2xl font-bold shadow-sm">
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Sync
                </button>
            </div>

            {/* 📊 Role-Based Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {userRole === 'admin' ? (
                    <>
                        <StatCard icon={<Users/>} color="blue" label="Total Users" value={stats.totalUsers} />
                        <StatCard icon={<UserCheck/>} color="emerald" label="Total Staffs" value={stats.totalStaffs} />
                        <StatCard icon={<Clock/>} color="amber" label="Pending Global" value={stats.pendingRequests} />
                        <StatCard icon={<ShieldCheck/>} color="indigo" label="Total Students" value={stats.totalStudents} />
                    </>
                ) : (
                    <>
                        <StatCard icon={<Clock/>} color="amber" label="Your Pending" value={filteredRequests.length} />
                        <StatCard icon={<ClipboardCheck/>} color="emerald" label="Completed" value={stats.completedClearances} />
                    </>
                )}
            </div>

            {/* Search & List */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input 
                            type="text" 
                            placeholder="ተማሪ ይፈልጉ..."
                            className="w-full pl-12 pr-6 py-3.5 bg-slate-50 rounded-2xl focus:outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50">
                            <tr className="text-slate-500 font-bold text-xs uppercase tracking-widest">
                                <th className="px-8 py-5">Student</th>
                                <th className="px-8 py-5">Department</th>
                                <th className="px-8 py-5">Status</th>
                                <th className="px-8 py-5 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredRequests.map((req) => (
                                <tr key={req.id} className="hover:bg-blue-50/30 transition-all">
                                    <td className="px-8 py-6 font-bold text-slate-800">
                                        {req.full_name} <br/>
                                        <span className="text-xs font-mono text-slate-400">{req.identifier_id}</span>
                                    </td>
                                    <td className="px-8 py-6 text-slate-600 font-medium">{req.department_name}</td>
                                    <td className="px-8 py-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase ${
                                            req.status === 'pending' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                                        }`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        {req.status === 'pending' && (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleStatusUpdate(req.id, 'approved')} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white">
                                                    <CheckCircle size={18} />
                                                </button>
                                                <button onClick={() => handleStatusUpdate(req.id, 'rejected')} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-600 hover:text-white">
                                                    <XCircle size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// ተደጋጋሚ ካርዶችን ለመቀነስ የሚረዳ Component
const StatCard = ({ icon, color, label, value }) => (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex items-center gap-5">
        <div className={`bg-${color}-500/10 p-4 rounded-2xl text-${color}-600`}>{icon}</div>
        <div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">{label}</p>
            <h3 className="text-2xl font-black text-slate-800">{value}</h3>
        </div>
    </div>
);

export default AdminDashboard;