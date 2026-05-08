import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Settings, 
  LogOut, 
  Layers,
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  History,
  Building2,
  FileCheck,
  Clock,
  BarChart3,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Sidebar = ({ 
  roleLabels = {}, 
  roleIcons = {},
  isMobileOpen,
  setIsMobileOpen 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 🔄 Collapse/Expand State (desktop only)
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 📱 Responsive: Auto-collapse on smaller screens
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        // Mobile: let parent control mobile state
        setIsCollapsed(false); // Always full menu when shown
      } else if (window.innerWidth < 1280) {
        // Medium screens: collapsed
        setIsCollapsed(true);
      } else {
        // Large screens: expanded
        setIsCollapsed(false);
      }
    };

    // Initial check
    handleResize();

    // Listen for resize
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 🛡️ Get user role and data from localStorage
  const role = localStorage.getItem('role') || 'staff';
  const userData = JSON.parse(localStorage.getItem('user') || '{}');
  const assignedNode = userData.assigned_node || localStorage.getItem('assigned_node');
  
  // Format assigned node name for display
  const nodeDisplayName = assignedNode 
    ? assignedNode.replace(/_/g, ' ').replace(/status/g, '').trim()
    : null;

  // ============================================
  // 1. SUPER ADMIN MENU - Full System Access
  // Can view all modules, users, approvals, analytics
  // ============================================
  const superAdminMenu = [
    { 
      name: 'Dashboard Overview', 
      path: '/admin', 
      icon: <LayoutDashboard size={20} />,
      description: 'System-wide analytics and stats'
    },
    { 
      name: 'Clearance Requests', 
      path: '/admin', 
      icon: <FileCheck size={20} />,
      description: 'View all student & staff clearances'
    },
    { 
      name: 'User Management', 
      path: '/users', 
      icon: <Users size={20} />,
      description: 'Manage users and assign roles'
    },
    { 
      name: 'Departments', 
      path: '/departments', 
      icon: <Building2 size={20} />,
      description: '21 nodes and 8 student offices'
    },
    { 
      name: 'Audit Logs', 
      path: '/logs', 
      icon: <History size={20} />,
      description: 'Track all admin actions'
    },
  ];

  // ============================================
  // 2. STAFF APPROVAL TEAM MENU (8 + 21 members)
  // Only see their assigned department approvals
  // ============================================
  const staffMenu = [
    { 
      name: 'My Dashboard', 
      path: '/approvals', 
      icon: <LayoutDashboard size={20} />,
      description: 'Your approval statistics'
    },
    { 
      name: 'Pending Approvals', 
      path: '/approvals?tab=pending', 
      icon: <CheckSquare size={20} />,
      description: `Requests awaiting ${nodeDisplayName || 'your'} approval`
    },
    { 
      name: 'Approval History', 
      path: '/approvals?tab=history', 
      icon: <History size={20} />,
      description: 'Your past approval decisions'
    },
  ];

  // ============================================
  // 3. SUPERVISOR MENU - Department Heads Only
  // Can approve initial staff clearance requests
  // ============================================
  const supervisorMenu = [
    { 
      name: 'Supervisor Dashboard', 
      path: '/supervisor-approvals', 
      icon: <Shield size={20} />,
      description: 'Review staff clearance applications'
    },
  ];

  // ============================================
  // 4. COMMON MENU - Shared Access
  // ============================================
  const commonMenu = [
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: <Settings size={20} />,
      description: 'Account preferences'
    },
  ];

  // 🎯 Determine menu based on role
  const getMenuItems = () => {
    switch (role) {
      case 'admin':
        return [...superAdminMenu, ...supervisorMenu, ...commonMenu];
      case 'supervisor':
        return [...supervisorMenu, ...commonMenu];
      case 'department_head':
        return [...supervisorMenu, ...staffMenu, ...commonMenu];
      case 'staff':
        return [...staffMenu, ...commonMenu];
      default:
        return commonMenu;
    }
  };

  const menuItems = getMenuItems();
  
  // Get role display configuration
  const getRoleConfig = () => {
    switch (role) {
      case 'admin':
        return {
          label: 'Super Administrator',
          color: 'bg-emerald-500',
          shadow: 'shadow-[0_0_8px_#10b981]',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20'
        };
      case 'supervisor':
        return {
          label: 'Supervisor',
          color: 'bg-indigo-500',
          shadow: 'shadow-[0_0_8px_#6366f1]',
          bgColor: 'bg-indigo-500/10',
          borderColor: 'border-indigo-500/20'
        };
      case 'department_head':
        return {
          label: 'Department Head',
          color: 'bg-purple-500',
          shadow: 'shadow-[0_0_8px_#a855f7]',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/20'
        };
      case 'staff':
        return {
          label: nodeDisplayName ? `${nodeDisplayName} Officer` : 'Approval Officer',
          color: 'bg-blue-500',
          shadow: 'shadow-[0_0_8px_#3b82f6]',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/20'
        };
      default:
        return {
          label: 'User',
          color: 'bg-slate-500',
          shadow: 'shadow-[0_0_8px_#64748b]',
          bgColor: 'bg-slate-500/10',
          borderColor: 'border-slate-500/20'
        };
    }
  };
  
  const roleConfig = getRoleConfig();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.clear();
      window.location.href = '/';
    }
  };

  // 🔄 Toggle collapse state
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* 🗂️ Sidebar Container - Entire sidebar scrolls together */}
      <div 
        className={`
          fixed lg:sticky top-0 left-0 h-screen bg-slate-950 flex flex-col text-white 
          border-r border-white/5 shadow-2xl z-40 transition-all duration-500 ease-in-out
          overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900
          ${isCollapsed ? 'w-20' : 'w-72'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >

      {/* 🔹 Header with Brand & Collapse Toggle */}
      <div className={`flex items-center border-b border-white/5 bg-slate-900/50 ${isCollapsed ? 'p-4 justify-center' : 'p-6 justify-between'}`}>
        {/* Brand Logo */}
        <div className={`flex items-center gap-3 ${isCollapsed ? 'hidden' : 'flex'}`}>
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2.5 rounded-xl shadow-lg shadow-blue-500/30">
            <Layers size={22} className="text-white" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight block leading-none">SmartClear</span>
            <span className="text-[10px] font-medium text-blue-400 uppercase tracking-wider mt-0.5 block">Enterprise</span>
          </div>
        </div>
        
        {/* Collapsed Logo */}
        <div className={`${isCollapsed ? 'flex' : 'hidden'}`}>
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 p-2 rounded-lg shadow-lg shadow-blue-500/30">
            <Layers size={20} className="text-white" />
          </div>
        </div>

        {/* Close Button for Mobile */}
        <button
          onClick={() => setIsMobileOpen(false)}
          className={`
            lg:hidden p-2 rounded-lg transition-all duration-300 hover:bg-white/10 
            ${isCollapsed ? 'hidden' : 'flex items-center justify-center'}
          `}
          aria-label="Close sidebar"
          title="Close sidebar"
        >
          <X size={20} className="text-slate-400 hover:text-white" />
        </button>

        {/* Collapse/Expand Toggle Button */}
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-lg transition-all duration-300 hover:bg-white/10 ${isCollapsed ? 'hidden lg:hidden' : 'lg:flex hidden'}`}
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight size={18} className="text-slate-400 hover:text-white" />
          ) : (
            <ChevronLeft size={18} className="text-slate-400 hover:text-white" />
          )}
        </button>
      </div>

      {/* 🔹 User Profile Section */}
      <div className={`border-b border-white/5 bg-slate-900/30 ${isCollapsed ? 'p-3' : 'p-4'}`}>
        <div className={`flex items-center gap-3 rounded-xl overflow-hidden ${roleConfig.bgColor} border ${roleConfig.borderColor} ${isCollapsed ? 'p-2 justify-center' : 'p-3'}`}>
          {/* Avatar */}
          <div className={`flex items-center justify-center rounded-full ${roleConfig.color} ${roleConfig.shadow} ${isCollapsed ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'} font-bold text-white flex-shrink-0`}>
            {userData.full_name ? userData.full_name.charAt(0).toUpperCase() : 'U'}
          </div>
          
          {/* User Info - Hidden when collapsed */}
          <div className={`flex-1 min-w-0 ${isCollapsed ? 'hidden' : 'block'}`}>
            <p className="text-sm font-semibold text-white truncate">
              {userData.full_name || 'User'}
            </p>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider truncate">
              {roleConfig.label}
            </p>
          </div>
        </div>
        
        {/* Assigned Node Info - Hidden when collapsed */}
        {!isCollapsed && (role === 'staff' || role === 'department_head') && nodeDisplayName && (
          <div className="mt-3 px-3 py-2 bg-slate-900/50 rounded-lg border border-white/5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Department</p>
            <p className="text-xs font-medium text-blue-400 truncate">{nodeDisplayName}</p>
          </div>
        )}
      </div>

      {/* 🔹 Navigation Links - No scroll, entire sidebar scrolls */}
      <nav className="py-4 px-3 space-y-1">
        {/* Section Title */}
        <p className={`px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3 ${isCollapsed ? 'hidden' : 'block'}`}>
          {role === 'admin' ? 'Administration' : 'My Workspace'}
        </p>
        
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
          
          return (
            <NavLink
              key={`${item.path}-${index}`}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 rounded-xl transition-all duration-300 group relative ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25' : 'text-slate-400 hover:bg-white/5 hover:text-white'} ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'}`}
              title={isCollapsed ? item.name : ''}
            >
              {/* Icon */}
              <div className={`transition-colors flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-400'}`}>
                {React.cloneElement(item.icon, { size: isCollapsed ? 22 : 20 })}
              </div>
              
              {/* Text Content - Hidden when collapsed */}
              <div className={`flex-1 min-w-0 ${isCollapsed ? 'hidden' : 'block'}`}>
                <span className="font-medium text-sm block truncate">{item.name}</span>
                {item.description && (
                  <span className="text-[10px] text-slate-500 group-hover:text-slate-400 block truncate">
                    {item.description}
                  </span>
                )}
              </div>

              {/* Active Indicator */}
              {isActive && (
                <div className={`absolute right-0 top-1/2 -translate-y-1/2 w-1 bg-white rounded-l-full ${isCollapsed ? 'h-6' : 'h-8'}`} />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* 🔹 Quick Actions Footer */}
      <div className={`border-t border-white/5 bg-slate-900/30 ${isCollapsed ? 'p-3' : 'p-4'}`}>
        {/* Notification Bell */}
        <button 
          className={`w-full flex items-center gap-3 rounded-xl transition-all duration-300 text-slate-400 hover:text-white hover:bg-white/5 mb-2 ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'}`}
          title="Notifications"
        >
          <div className="relative">
            <Bell size={isCollapsed ? 22 : 20} />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
              3
            </span>
          </div>
          <span className={`font-medium text-sm ${isCollapsed ? 'hidden' : 'block'}`}>Notifications</span>
        </button>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 rounded-xl transition-all duration-300 text-slate-400 hover:text-red-400 hover:bg-red-400/10 ${isCollapsed ? 'justify-center p-3' : 'px-4 py-3'}`}
          title="Sign Out"
        >
          <LogOut size={isCollapsed ? 22 : 20} />
          <span className={`font-medium text-sm ${isCollapsed ? 'hidden' : 'block'}`}>Sign Out</span>
        </button>
      </div>

      {/* 🔹 Collapse Toggle (Bottom - for collapsed state) */}
      <button
        onClick={toggleSidebar}
        className={`lg:flex hidden items-center justify-center p-3 border-t border-white/5 text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300 ${isCollapsed ? 'block' : 'hidden'}`}
        title="Expand Sidebar"
      >
        <ChevronRight size={20} />
      </button>
    </div>

    {/* 📱 Mobile Overlay */}
    {isMobileOpen && (
      <div 
        className="lg:hidden fixed inset-0 bg-black/50 z-30"
        onClick={() => setIsMobileOpen(false)}
      />
    )}
  </>
  );
};

export default Sidebar;