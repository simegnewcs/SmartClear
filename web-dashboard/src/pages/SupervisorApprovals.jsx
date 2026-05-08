import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/api';
import { 
  CheckCircle, XCircle, Search, RefreshCw, 
  Clock, AlertCircle, User, FileText, 
  Briefcase, ShieldCheck, Filter, ChevronDown, ChevronUp
} from 'lucide-react';

const SupervisorApprovals = () => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [approvedRequests, setApprovedRequests] = useState([]);
    const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('pending');
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [approvalComment, setApprovalComment] = useState('');
    const [processing, setProcessing] = useState(false);

    // Get supervisor info from localStorage
    const supervisorName = localStorage.getItem('full_name') || 'Supervisor';
    const supervisorId = localStorage.getItem('user_id') || '0';

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Fetch pending initial approvals for this supervisor
            const pendingRes = await api.get(`/staff/pending-initial?officer_id=${supervisorId}`);
            if (pendingRes.data?.success) {
                setPendingRequests(pendingRes.data.data || []);
                setStats(prev => ({ ...prev, pending: pendingRes.data.count || 0 }));
            }

            // Fetch approved/rejected history
            const historyRes = await api.get('/staff/dashboard');
            if (historyRes.data?.success) {
                // Filter only initial approvals done by this supervisor
                const allActivity = historyRes.data.recent_activity || [];
                const myApprovals = allActivity.filter(
                    act => act.approver_id === parseInt(supervisorId) && 
                           act.action_type === 'initial_approval'
                );
                setApprovedRequests(myApprovals);
                setStats(prev => ({ 
                    ...prev, 
                    approved: historyRes.data.stats?.initial_approved || 0,
                    rejected: historyRes.data.stats?.initial_rejected || 0
                }));
            }
        } catch (err) {
            console.error("Supervisor Fetch Error:", err);
            if (err.response?.status === 401) {
                setError("Session expired. Please login again.");
                setTimeout(() => window.location.href = '/login', 2000);
            } else {
                setError("Failed to load requests. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    }, [supervisorId]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleInitialApproval = async (requestId, action) => {
        if (!action) return;
        
        const confirmMsg = action === 'approved' 
            ? "Are you sure you want to APPROVE this clearance request?\n\nThis will unlock all 21 offices to start parallel approval."
            : "Are you sure you want to REJECT this clearance request?";
            
        if (!window.confirm(confirmMsg)) return;

        setProcessing(true);
        try {
            const res = await api.patch('/staff/initial-approval', {
                request_id: requestId,
                action: action,
                comments: approvalComment,
                officer_id: supervisorId
            });

            if (res.data.success) {
                alert(`Request ${action} successfully!`);
                setSelectedRequest(null);
                setApprovalComment('');
                fetchRequests();
            }
        } catch (err) {
            console.error("Approval Error:", err);
            alert(err.response?.data?.message || "Failed to process approval");
        } finally {
            setProcessing(false);
        }
    };

    const filteredRequests = (activeTab === 'pending' ? pendingRequests : approvedRequests)
        .filter(req => 
            req.staff_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.staff_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.department?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            approved: 'bg-green-100 text-green-800 border-green-200',
            rejected: 'bg-red-100 text-red-800 border-red-200'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.pending}`}>
                {status?.toUpperCase()}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
                            <ShieldCheck className="w-8 h-8 text-blue-600" />
                            Staff Clearance Approvals
                        </h1>
                        <p className="text-gray-600 mt-1">
                            Welcome, <span className="font-semibold text-blue-600">{supervisorName}</span>
                            <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-medium">STAFF ONLY</span>
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            Review and approve initial staff clearance requests
                        </p>
                    </div>
                    <button 
                        onClick={fetchRequests}
                        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 transition"
                        disabled={loading}
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Pending Approvals</p>
                            <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                        </div>
                        <div className="p-3 bg-yellow-100 rounded-full">
                            <Clock className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Approved</p>
                            <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full">
                            <CheckCircle className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Rejected</p>
                            <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                        </div>
                        <div className="p-3 bg-red-100 rounded-full">
                            <XCircle className="w-6 h-6 text-red-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Error Alert */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <span className="text-red-800">{error}</span>
                    </div>
                </div>
            )}

            {/* Tabs & Search */}
            <div className="bg-white rounded-xl shadow-sm border mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border-b gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setActiveTab('pending')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                activeTab === 'pending' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            Pending ({stats.pending})
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={`px-4 py-2 rounded-lg font-medium transition ${
                                activeTab === 'history' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            History
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by name, ID, or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-80 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Requests List */}
                <div className="p-4">
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-gray-500">Loading requests...</p>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="text-center py-12">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">
                                {activeTab === 'pending' 
                                    ? "No pending approval requests" 
                                    : "No approval history found"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRequests.map((request) => (
                                <div 
                                    key={request.request_id || request.id}
                                    className={`border rounded-lg p-4 transition ${
                                        selectedRequest?.request_id === request.request_id 
                                            ? 'border-blue-500 bg-blue-50' 
                                            : 'hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-start gap-3 mb-2">
                                                <div className="p-2 bg-blue-100 rounded-full">
                                                    <User className="w-5 h-5 text-blue-600" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">{request.staff_name}</h3>
                                                    <p className="text-sm text-gray-500">ID: {request.staff_id}</p>
                                                </div>
                                                {getStatusBadge(request.status || 'pending')}
                                            </div>
                                            
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3 text-sm">
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <Briefcase className="w-4 h-4" />
                                                    <span>{request.department || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <span className="font-medium">Position:</span>
                                                    <span>{request.position || 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-gray-600">
                                                    <span className="font-medium">Type:</span>
                                                    <span className="capitalize">{request.request_type?.replace(/_/g, ' ')}</span>
                                                </div>
                                            </div>

                                            {request.reason_details && (
                                                <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                                                    <span className="font-medium">Reason:</span> {request.reason_details}
                                                </div>
                                            )}

                                            <p className="text-xs text-gray-400 mt-3">
                                                Submitted: {formatDate(request.started_at)}
                                            </p>
                                        </div>

                                        {/* Action Buttons for Pending */}
                                        {activeTab === 'pending' && (
                                            <div className="flex flex-col gap-2 min-w-[200px]">
                                                {selectedRequest?.request_id === request.request_id ? (
                                                    <>
                                                        <textarea
                                                            placeholder="Add approval comments (optional)..."
                                                            value={approvalComment}
                                                            onChange={(e) => setApprovalComment(e.target.value)}
                                                            className="w-full p-2 border rounded-lg text-sm mb-2"
                                                            rows={2}
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={() => handleInitialApproval(request.request_id, 'approved')}
                                                                disabled={processing}
                                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                                                            >
                                                                <CheckCircle className="w-4 h-4" />
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => handleInitialApproval(request.request_id, 'rejected')}
                                                                disabled={processing}
                                                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                                                            >
                                                                <XCircle className="w-4 h-4" />
                                                                Reject
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedRequest(null);
                                                                setApprovalComment('');
                                                            }}
                                                            className="text-sm text-gray-500 hover:text-gray-700"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => setSelectedRequest(request)}
                                                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                                    >
                                                        Review Request
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Approval Process
                </h4>
                <ul className="text-sm text-blue-800 space-y-1 ml-6 list-disc">
                    <li>Review staff details and reason for clearance</li>
                    <li><strong>APPROVE</strong>: Unlocks all 21 offices for parallel approval</li>
                    <li><strong>REJECT</strong>: Request is denied and staff must reapply</li>
                    <li>Approved requests move to 21 offices for processing</li>
                </ul>
            </div>
        </div>
    );
};

export default SupervisorApprovals;
