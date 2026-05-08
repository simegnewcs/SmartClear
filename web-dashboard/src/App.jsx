import React, { Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Shield, GraduationCap, Building2, UserCheck, Bell } from 'lucide-react';

// ═══════════════════════════════════════════════════════════
// 🎨 LAYOUT COMPONENTS
// ═══════════════════════════════════════════════════════════
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// ═══════════════════════════════════════════════════════════
// 📄 LAZY LOADED PAGES (Code Splitting for Performance)
// ═══════════════════════════════════════════════════════════
const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StaffApprovals = lazy(() => import('./pages/StaffApprovals'));
const SupervisorApprovals = lazy(() => import('./pages/SupervisorApprovals'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

// ═══════════════════════════════════════════════════════════
// 🔐 ROLE CONFIGURATION
// ═══════════════════════════════════════════════════════════
const ROLES = {
  SUPER_ADMIN: 'admin',
  STAFF: 'staff',
  DEPT_HEAD: 'department_head',
  SUPERVISOR: 'supervisor',
  STUDENT: 'student',
  GUARD: 'guard',
  CHAIR_HOLDER: 'chair_holder',
  BATCH_ADVISOR: 'batch_advisor'
};

// Role display names for UI
const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'System Administrator',
  [ROLES.STAFF]: 'Staff Member',
  [ROLES.DEPT_HEAD]: 'Department Head',
  [ROLES.SUPERVISOR]: 'Supervisor',
  [ROLES.CHAIR_HOLDER]: 'Chair Holder',
  [ROLES.BATCH_ADVISOR]: 'Batch Advisor',
  [ROLES.GUARD]: 'Security Guard'
};

// Role icons for visual identification
const ROLE_ICONS = {
  [ROLES.SUPER_ADMIN]: Shield,
  [ROLES.STAFF]: UserCheck,
  [ROLES.DEPT_HEAD]: Building2,
  [ROLES.SUPERVISOR]: UserCheck,
  [ROLES.CHAIR_HOLDER]: GraduationCap,
  [ROLES.BATCH_ADVISOR]: GraduationCap,
  [ROLES.GUARD]: Shield
};

// ═══════════════════════════════════════════════════════════
// 🛡️ AUTHENTICATION & AUTHORIZATION
// ═══════════════════════════════════════════════════════════

/**
 * Enhanced Protected Route Component
 * Handles authentication checks and role-based access control
 */
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  
  // Parse user data from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}');

  // 🔒 Not logged in - redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  // ✅ No specific roles required - allow access
  if (allowedRoles.length === 0) {
    return children;
  }
  
  // 🔐 Check role permissions
  const hasPermission = allowedRoles.includes(userRole);
  
  if (!hasPermission) {
    // 🔄 Smart redirect based on user's role
    if (userRole === ROLES.SUPER_ADMIN) {
      console.log('[Access Denied] Redirecting Admin to Dashboard');
      return <Navigate to="/admin" replace />;
    } else if ([ROLES.STAFF, ROLES.DEPT_HEAD, ROLES.CHAIR_HOLDER, ROLES.BATCH_ADVISOR].includes(userRole)) {
      console.log('[Access Denied] Redirecting Staff to Approvals');
      return <Navigate to="/approvals" replace />;
    } else {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

// ═══════════════════════════════════════════════════════════
// 🌀 LOADING & FALLBACK COMPONENTS
// ═══════════════════════════════════════════════════════════

/**
 * Enhanced Page Loader with branding and smooth animations
 */
const PageLoader = () => (
  <div className="fixed inset-0 z-50 flex h-screen w-full items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
    <div className="flex flex-col items-center gap-6">
      {/* Animated Logo Container */}
      <div className="relative">
        {/* Outer ring animation */}
        <div className="absolute inset-0 h-20 w-20 animate-ping rounded-full bg-blue-500/20"></div>
        {/* Inner spinner */}
        <div className="relative h-20 w-20 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 shadow-lg"></div>
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Shield className="h-8 w-8 text-blue-600" />
        </div>
      </div>
      
      {/* Loading Text */}
      <div className="flex flex-col items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-800">SmartClear</h3>
        <p className="text-sm text-slate-500 animate-pulse">Loading your workspace...</p>
      </div>
      
      {/* Progress bar */}
      <div className="w-48 h-1 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full w-1/2 bg-blue-600 animate-pulse rounded-full"></div>
      </div>
    </div>
  </div>
);

/**
 * Mini loader for inline loading states
 */
export const MiniLoader = ({ size = 'md', text = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-3'
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} animate-spin rounded-full border-slate-300 border-t-blue-600`}></div>
      {text && <span className="text-sm text-slate-500">{text}</span>}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// 🎯 ROUTING UTILITIES
// ═══════════════════════════════════════════════════════════

/**
 * Smart redirect based on user role
 * Automatically sends users to their appropriate dashboard
 */
const RoleBasedRedirect = () => {
  const userRole = localStorage.getItem('role');
  
  // 🎓 Admin users
  if (userRole === ROLES.SUPER_ADMIN) {
    console.log('[Welcome] Administrator logged in');
    return <Navigate to="/admin" replace />;
  }
  
  // 👔 Supervisor users
  if (userRole === ROLES.SUPERVISOR) {
    console.log('[Welcome] Supervisor logged in');
    return <Navigate to="/supervisor-approvals" replace />;
  }
  
  // 👔 Staff users (including Chair Holders and Batch Advisors)
  if ([ROLES.STAFF, ROLES.DEPT_HEAD, ROLES.CHAIR_HOLDER, ROLES.BATCH_ADVISOR].includes(userRole)) {
    console.log(`[Welcome] ${ROLE_LABELS[userRole] || 'Staff'} logged in`);
    return <Navigate to="/approvals" replace />;
  }
  
  // ❌ Unauthorized role
  return <Navigate to="/unauthorized" replace />;
};

/**
 * Get user's home route based on role
 */
const getHomeRoute = (role) => {
  if (role === ROLES.SUPER_ADMIN) return '/admin';
  if (role === ROLES.SUPERVISOR) return '/supervisor-approvals';
  if ([ROLES.STAFF, ROLES.DEPT_HEAD, ROLES.CHAIR_HOLDER, ROLES.BATCH_ADVISOR].includes(role)) return '/approvals';
  return '/login';
};

/**
 * Check if user has specific permission
 */
const hasPermission = (allowedRoles) => {
  const userRole = localStorage.getItem('role');
  return allowedRoles.includes(userRole);
};

// ═══════════════════════════════════════════════════════════
// 🎬 MAIN APP COMPONENT
// ═══════════════════════════════════════════════════════════

/**
 * Layout wrapper for authenticated pages
 */
const AuthenticatedLayout = ({ children }) => {
  const location = useLocation();
  
  // 📱 Mobile sidebar state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // 🔄 Toggle mobile sidebar
  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };
  
  // Track page views (for analytics)
  useEffect(() => {
    const userRole = localStorage.getItem('role');
    console.log(`[Analytics] Page view: ${location.pathname} by ${userRole}`);
  }, [location]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* 🗂️ Sidebar Navigation - Controlled from parent */}
      <Sidebar 
        roleLabels={ROLE_LABELS} 
        roleIcons={ROLE_ICONS}
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />
      
      {/* 📄 Main Content Area - Responsive */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-0">
        {/* 🔝 Top Navigation Bar - With hamburger toggle */}
        <Navbar 
          roleLabels={ROLE_LABELS} 
          roleIcons={ROLE_ICONS}
          toggleMobileSidebar={toggleMobileSidebar}
          isMobileSidebarOpen={isMobileSidebarOpen}
        />
        
        {/* 📦 Scrollable Main Content - Responsive Padding */}
        <main 
          className="flex-1 overflow-x-hidden overflow-y-auto scroll-smooth
            p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8
            pt-16 sm:pt-4 md:pt-5 lg:pt-6
          "
        >
          <div className="
            w-full mx-auto
            max-w-full sm:max-w-full md:max-w-5xl lg:max-w-6xl xl:max-w-7xl
            px-0 sm:px-0 md:px-0 lg:px-4
          ">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      {/* 🌀 Suspense prevents blank screens during lazy loading */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* ═══════════════════════════════════════════════════ */}
          {/* 🌐 PUBLIC ROUTES (No Authentication Required) */}
          {/* ═══════════════════════════════════════════════════ */}
          
          <Route path="/login" element={
            <Suspense fallback={<PageLoader />}>
              <Login roleLabels={ROLE_LABELS} />
            </Suspense>
          } />
          
          <Route path="/unauthorized" element={
            <Suspense fallback={<PageLoader />}>
              <Unauthorized roleLabels={ROLE_LABELS} />
            </Suspense>
          } />

          {/* ═══════════════════════════════════════════════════ */}
          {/* 🔒 PROTECTED ROUTES (Authentication Required) */}
          {/* ═══════════════════════════════════════════════════ */}
          
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AuthenticatedLayout>
                  <Routes>
                    {/* 🎓 ADMIN ROUTES */}
                    <Route path="/admin" element={
                      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/admin/*" element={
                      <ProtectedRoute allowedRoles={[ROLES.SUPER_ADMIN]}>
                        <AdminDashboard />
                      </ProtectedRoute>
                    } />
                    
                    {/* 👔 STAFF APPROVAL ROUTES */}
                    <Route path="/approvals" element={
                      <ProtectedRoute allowedRoles={[
                        ROLES.STAFF, 
                        ROLES.DEPT_HEAD, 
                        ROLES.CHAIR_HOLDER, 
                        ROLES.BATCH_ADVISOR
                      ]}>
                        <StaffApprovals />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/pending" element={
                      <ProtectedRoute allowedRoles={[
                        ROLES.STAFF, 
                        ROLES.DEPT_HEAD, 
                        ROLES.CHAIR_HOLDER, 
                        ROLES.BATCH_ADVISOR
                      ]}>
                        <StaffApprovals defaultTab="pending" />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/approved" element={
                      <ProtectedRoute allowedRoles={[
                        ROLES.STAFF, 
                        ROLES.DEPT_HEAD, 
                        ROLES.CHAIR_HOLDER, 
                        ROLES.BATCH_ADVISOR
                      ]}>
                        <StaffApprovals defaultTab="approved" />
                      </ProtectedRoute>
                    } />
                    
                    {/* 👨‍💼 SUPERVISOR APPROVAL ROUTES */}
                    <Route path="/supervisor-approvals" element={
                      <ProtectedRoute allowedRoles={[
                        ROLES.SUPERVISOR,
                        ROLES.DEPT_HEAD, 
                        ROLES.SUPER_ADMIN
                      ]}>
                        <SupervisorApprovals />
                      </ProtectedRoute>
                    } />
                    
                    {/* ⚙️ SHARED ROUTES */}
                    <Route path="/settings" element={
                      <ProtectedRoute allowedRoles={[
                        ROLES.SUPER_ADMIN, 
                        ROLES.STAFF, 
                        ROLES.DEPT_HEAD,
                        ROLES.CHAIR_HOLDER,
                        ROLES.BATCH_ADVISOR
                      ]}>
                        <Settings />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="/notifications" element={
                      <ProtectedRoute allowedRoles={[
                        ROLES.SUPER_ADMIN, 
                        ROLES.STAFF, 
                        ROLES.DEPT_HEAD,
                        ROLES.CHAIR_HOLDER,
                        ROLES.BATCH_ADVISOR
                      ]}>
                        <div className="text-center py-20">
                          <Bell className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                          <h2 className="text-2xl font-bold text-slate-800 mb-2">Notifications</h2>
                          <p className="text-slate-500">Notification center coming soon...</p>
                        </div>
                      </ProtectedRoute>
                    } />
                    
                    {/* 🏠 HOME / ROOT REDIRECT */}
                    <Route path="/" element={<RoleBasedRedirect />} />
                    
                    {/* ❌ 404 NOT FOUND */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AuthenticatedLayout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

// Export role utilities for use in other components
export { ROLES, ROLE_LABELS, ROLE_ICONS, getHomeRoute, hasPermission };

export default App;