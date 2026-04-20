import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, Search, UserCircle, Menu, 
  LogOut, Settings, ChevronDown 
} from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  
  // 🛡️ መረጃውን ከ localStorage ማንበብ
  const userName = localStorage.getItem('full_name') || 'User';
  const role = localStorage.getItem('role') || 'Staff';
  const assignedNode = localStorage.getItem('assigned_node') || 'Clearance Office';

  // የቢሮውን ስም ለሰው በሚነበብ መልኩ ማስተካከል
  const formattedNode = assignedNode
    .replace(/_status/g, '')
    .replace(/_/g, ' ')
    .toUpperCase();

  const handleLogout = () => {
    if (window.confirm("ከሲስተሙ መውጣት ይፈልጋሉ?")) {
      localStorage.clear(); // ሁሉንም ዳታ አጽዳ
      navigate('/'); // ወደ ሎጊን ገጽ ይመለሱ
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-50 shadow-sm shadow-slate-500/5">
      
      {/* 🔹 Left Side: Brand & Context */}
      <div className="flex items-center gap-4">
        <button className="lg:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
          <Menu size={24} />
        </button>
        <div className="hidden sm:block">
          <h2 className="text-slate-900 font-black text-xl tracking-tight">
            DEVVOLTZ <span className="text-blue-600">SmartClear</span>
          </h2>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
            Enterprise Management Console
          </p>
        </div>
      </div>

      {/* 🔹 Middle: Search students globally */}
      <div className="hidden md:flex items-center bg-slate-50 border border-slate-100 rounded-2xl px-4 py-2.5 w-80 focus-within:ring-4 focus-within:ring-blue-500/5 focus-within:border-blue-200 transition-all group">
        <Search size={18} className="text-slate-400 group-focus-within:text-blue-600" />
        <input 
          type="text" 
          placeholder="Global student search..." 
          className="bg-transparent border-none focus:outline-none ml-2 text-sm text-slate-600 w-full font-medium"
        />
      </div>

      {/* 🔹 Right Side: Profile & Actions */}
      <div className="flex items-center gap-4">
        
        {/* Notifications */}
        <button className="relative p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all group">
          <Bell size={22} />
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white ring-2 ring-red-500/20"></span>
        </button>

        {/* Settings Button */}
        <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all">
          <Settings size={22} />
        </button>

        {/* User Profile Dropdown */}
        <div className="flex items-center gap-4 pl-4 border-l border-slate-100 ml-2">
          <div className="text-right hidden sm:block leading-tight">
            <p className="text-sm font-black text-slate-900">{userName}</p>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-tighter">
              {role === 'admin' ? 'Global Admin' : formattedNode}
            </p>
          </div>
          
          <div className="relative group cursor-pointer">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-400 border border-slate-200 group-hover:border-blue-200 transition-all">
              <UserCircle size={28} />
            </div>
            
            {/* Simple Hover/Click Dropdown (Optional logic can be added) */}
            <div className="absolute right-0 top-12 w-48 bg-white border border-slate-100 rounded-2xl shadow-2xl shadow-slate-200/50 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="px-3 py-2 mb-1">
                <p className="text-xs font-bold text-slate-400 uppercase">Manage Account</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
          
          <ChevronDown size={16} className="text-slate-300" />
        </div>
      </div>
    </header>
  );
};

export default Navbar;