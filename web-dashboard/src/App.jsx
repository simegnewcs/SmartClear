import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Layouts - በንጹህ መንገድ እንዲቀመጡ
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Lazy Loading - ገጾች ሲፈለጉ ብቻ እንዲጫኑ (App Speed ይጨምራል)
const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const StaffApprovals = lazy(() => import('./pages/StaffApprovals'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));

// 🛡️ Protected Route Logic (Enhanced)
const ProtectedRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;
  
  // ሮል ካልተዛመደ (ለምሳሌ ስታፍ ወደ አድሚን ሊገባ ሲል)
  if (allowedRole && userRole !== allowedRole) {
    return <Navigate to={userRole === 'admin' ? '/admin' : '/approvals'} replace />;
  }

  return children;
};

// 🌀 Loading Spinner (UX Improvement)
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-slate-50/50">
    <div className="flex flex-col items-center gap-4">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      <p className="text-slate-500 font-medium animate-pulse text-sm">DEVVOLTZ is loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <Router>
      {/* Suspense ተጠቃሚው ገጽ እስኪከፈት ደብዛዛ ነጭ ስክሪን እንዳያይ ይረዳል */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Private Dashboard Area */}
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <div className="flex h-screen bg-slate-50 overflow-hidden">
                  
                  {/* 1. Sidebar - በዴስክቶፕ ቋሚ፣ በሞባይል የሚደበቅ (Sidebar ውስጥ ይስተካከላል) */}
                  <Sidebar />
                  
                  <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    
                    {/* 2. Top Navigation - ፕሮፋይል እና ኖቲፊኬሽን */}
                    <Navbar />
                    
                    {/* 3. Main Dynamic Content */}
                    <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8 scroll-smooth">
                      <div className="max-w-7xl mx-auto">
                        <Routes>
                          {/* Admin Only */}
                          <Route path="/admin" element={
                            <ProtectedRoute allowedRole="admin">
                              <AdminDashboard />
                            </ProtectedRoute>
                          } />
                          
                          {/* Staff Only */}
                          <Route path="/approvals" element={
                            <ProtectedRoute allowedRole="staff">
                              <StaffApprovals />
                            </ProtectedRoute>
                          } />
                          
                          {/* Shared Routes */}
                          <Route path="/settings" element={<Settings />} />
                          
                          {/* Intelligent Redirects */}
                          <Route path="/" element={<Navigate to="/admin" replace />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </div>
                    </main>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;