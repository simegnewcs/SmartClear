import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleGoBack = () => {
    if (userRole === 'admin') {
      navigate('/admin');
    } else if (userRole === 'staff' || userRole === 'department_head') {
      navigate('/approvals');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Access Denied
        </h1>
        
        <p className="text-slate-500 mb-6">
          You don't have permission to access this page. This area is restricted to authorized personnel only.
        </p>

        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-slate-600">
            <span className="font-semibold">Your current role:</span>{' '}
            <span className="capitalize bg-slate-200 px-2 py-1 rounded text-xs">
              {userRole || 'Unknown'}
            </span>
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleGoBack}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
          >
            <ArrowLeft size={18} />
            Go to Dashboard
          </button>
          
          <button
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl font-semibold hover:bg-red-100 transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
