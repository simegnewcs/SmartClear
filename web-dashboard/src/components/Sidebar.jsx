import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Settings, 
  LogOut, 
  Layers,
  Users,
  UserPlus,
  ShieldCheck,
  History
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();
  
  // 🛡️ የገባውን ተጠቃሚ ሚና (Role) እናወጣለን
  const role = localStorage.getItem('role') || 'staff';

  // 1. ለአድሚን ብቻ የሚታዩ ሊንኮች
  const adminMenu = [
    { name: 'Admin Overview', path: '/admin', icon: <LayoutDashboard size={20} /> },
    { name: 'User Management', path: '/users', icon: <Users size={20} /> },
    { name: 'Add New User', path: '/add-user', icon: <UserPlus size={20} /> },
    { name: 'System Logs', path: '/logs', icon: <History size={20} /> },
  ];

  // 2. ለሰራተኛ (Staff) ብቻ የሚታዩ ሊንኮች
  const staffMenu = [
    { name: 'Pending Approvals', path: '/admin', icon: <CheckSquare size={20} /> },
    { name: 'Approval History', path: '/history', icon: <ShieldCheck size={20} /> },
  ];

  // 3. የጋራ የሆኑ ሊንኮች
  const commonMenu = [
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> },
  ];

  // 🔄 እንደ ሚናው ዝርዝሩን መለየት
  const menuItems = role === 'admin' ? [...adminMenu, ...commonMenu] : [...staffMenu, ...commonMenu];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  return (
    <div className="w-72 bg-slate-950 h-screen flex flex-col text-white sticky top-0 border-r border-white/5 shadow-2xl">
      
      {/* 🔹 Brand Identity */}
      <div className="p-8 flex items-center gap-4 border-b border-white/5 bg-slate-900/50">
        <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-600/30 ring-2 ring-blue-400/20">
          <Layers size={24} className="text-white" />
        </div>
        <div>
          <span className="text-xl font-black tracking-tighter block leading-none">DEVVOLTZ</span>
          <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1 block">Enterprise</span>
        </div>
      </div>

      {/* 🔹 Role Badge */}
      <div className="px-6 mt-6">
        <div className="bg-slate-900 border border-white/5 p-3 rounded-2xl flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${role === 'admin' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-blue-500 shadow-[0_0_8px_#3b82f6]'}`}></div>
          <span className="text-xs font-black uppercase tracking-widest text-slate-400">
            {role === 'admin' ? 'System Administrator' : 'Staff Access'}
          </span>
        </div>
      </div>

      {/* 🔹 Navigation Links */}
      <nav className="flex-1 mt-6 px-4 space-y-2 overflow-y-auto">
        <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Main Navigation</p>
        
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            // ✅ FIX: isActive must be inside the function argument
            className={({ isActive }) => `
              flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 group
              ${isActive 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20 translate-x-1' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'}
            `}
          >
            {/* ✅ FIX: Here we check isActive again using a function if needed, or simple logic */}
            {({ isActive }) => (
              <>
                <div className={`${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'} transition-colors`}>
                  {item.icon}
                </div>
                <span className="font-bold text-[15px]">{item.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* 🔹 Footer Section (Logout) */}
      <div className="p-6 border-t border-white/5 bg-slate-900/30">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-4 px-4 py-4 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-2xl transition-all duration-200 font-bold group"
        >
          <div className="p-2 bg-slate-800 rounded-xl group-hover:bg-red-400/20 transition-colors">
            <LogOut size={20} />
          </div>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;