import React, { useState, useEffect } from 'react';
import { 
  Settings, Users, Shield, Database, Plus, Edit, 
  Trash2, Activity, CheckCircle2, AlertTriangle, 
  Server, Globe, Search
} from 'lucide-react';
import axios from 'axios';

const GlobalSettings = () => {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('nodes');
  const API_URL = 'http://localhost:5000/api/v1';

  // 1. የሁሉንም ቢሮዎች (Nodes) መረጃ ከባክኤንድ መሳብ
  const fetchSystemData = async () => {
    setLoading(true);
    try {
      // ይህ API ሁሉንም Nodes እና የሃላፊዎቻቸውን ስም ያመጣል
      const response = await axios.get(`${API_URL}/admin/system-nodes`);
      setNodes(response.data);
    } catch (error) {
      console.error("System Data Fetch Error:", error);
      // ለሙከራ (Fallback Data)
      setNodes([
        { id: 1, name: 'Library Service', head: 'Abebe Balcha', status: 'active', requests: 120 },
        { id: 2, name: 'Finance - Regular Budget', head: 'Sara Kebede', status: 'active', requests: 85 },
        { id: 3, name: 'Property Administration', head: 'Tadesse Alemu', status: 'maintenance', requests: 0 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemData();
  }, []);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8">
      {/* --- Main Header --- */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="bg-slate-900 rounded-[2rem] p-8 text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-blue-500/20 rounded-2xl border border-blue-500/30">
              <Settings size={35} className="text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tight">System Control Panel</h1>
              <p className="text-slate-400 text-sm mt-1">Manage 21 nodes, security protocols, and infrastructure.</p>
            </div>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-500/20">
            <Plus size={20} /> Add New Node
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* --- Left Sidebar (Navigation & Stats) --- */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="text-slate-900 font-bold mb-4 flex items-center gap-2">
              <Activity size={18} className="text-green-500" /> Infrastructure
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm flex items-center gap-2"><Server size={14}/> Server Status</span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-md uppercase">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm flex items-center gap-2"><Database size={14}/> DB Health</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase">Optimal</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-sm flex items-center gap-2"><Globe size={14}/> API Latency</span>
                <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md uppercase">42ms</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button 
              onClick={() => setActiveTab('nodes')}
              className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'nodes' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              <Database size={20} /> Clearance Nodes
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 p-4 rounded-2xl font-bold transition-all ${activeTab === 'users' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
            >
              <Users size={20} /> Staff Accounts
            </button>
            <button 
              className="flex items-center gap-3 p-4 rounded-2xl font-bold text-slate-600 bg-white hover:bg-slate-50 transition-all"
            >
              <Shield size={20} /> System Security
            </button>
          </div>
        </div>

        {/* --- Main Content Area --- */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
            {/* Table Header */}
            <div className="p-8 border-b border-slate-50 flex flex-col md:row justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-800">Clearance Management Hub</h2>
                <p className="text-slate-400 text-sm">Managing all 21 active university clearance points</p>
              </div>
              <div className="relative w-full md:w-64">
                <Search size={18} className="absolute left-3 top-3 text-slate-400" />
                <input type="text" placeholder="Search nodes..." className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-sm outline-none" />
              </div>
            </div>

            {/* Nodes List */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Office / Node Name</th>
                    <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Department Head</th>
                    <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Health Status</th>
                    <th className="px-8 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest text-right">Settings</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {nodes.map((node) => (
                    <tr key={node.id} className="hover:bg-blue-50/30 transition-colors group">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${node.status === 'active' ? 'bg-green-100' : 'bg-amber-100'}`}>
                            <CheckCircle2 size={18} className={node.status === 'active' ? 'text-green-600' : 'text-amber-600'} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">{node.name}</p>
                            <p className="text-xs text-slate-400 italic">{node.requests} total approvals processed</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-semibold text-slate-600">{node.head}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Admin Privileges</p>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${node.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`}></div>
                          <span className={`text-xs font-black uppercase ${node.status === 'active' ? 'text-green-600' : 'text-amber-600'}`}>
                            {node.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                            <Edit size={18} />
                          </button>
                          <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex justify-center">
              <button className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors">
                View All System Audit Logs
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-slate-300 text-xs mt-12 font-medium">
        DEVELOPED BY DEVVOLTZ TECHNOLOGY PLC • SMARTCLEAR ENTERPRISE v1.0.0
      </p>
    </div>
  );
};

export default GlobalSettings;