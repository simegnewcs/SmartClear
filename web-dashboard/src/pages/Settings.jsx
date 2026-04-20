import React from 'react';
import { User, Bell, Shield, Database, Save } from 'lucide-react';

const Settings = () => {
  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">System Settings</h1>
      
      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600"><User size={20} /></div>
            <h2 className="font-bold text-slate-800">Admin Profile</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Full Name</label>
              <input type="text" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" defaultValue="Admin User" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Email Address</label>
              <input type="email" className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl" defaultValue="admin@devvoltz.com" />
            </div>
          </div>
        </div>

        {/* System Config */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Database size={20} /></div>
            <h2 className="font-bold text-slate-800">Clearance Rules</h2>
          </div>
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div>
              <p className="font-semibold text-slate-700">Sequential Approval Mode</p>
              <p className="text-xs text-slate-400">Advisor must approve before others can see the request.</p>
            </div>
            <div className="w-12 h-6 bg-blue-600 rounded-full relative">
               <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
            </div>
          </div>
        </div>

        <button className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
          <Save size={18} /> Save Changes
        </button>
      </div>
    </div>
  );
};

export default Settings;