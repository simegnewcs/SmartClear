import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Layers, Lock, Mail, ArrowRight, AlertCircle, 
  Eye, EyeOff, ShieldCheck, CheckCircle2 
} from 'lucide-react';
import api from '../utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data.success) {
        // 🛡️ CRITICAL FIX: Save the entire user object to localStorage
        // This ensures StaffApprovals.jsx can read 'assigned_node' correctly.
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user)); // ሙሉውን ዳታ በ JSON መልክ ማስቀመጥ
        
        // ለቀላል አጠቃቀም እነዚህንም ለየብቻ እናስቀምጣቸው
        localStorage.setItem('role', response.data.user.role);
        localStorage.setItem('assigned_node', response.data.user.assigned_node);

        // 🚀 Navigate based on role
        if (response.data.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/admin'); // ወይም ለስታፍ ተብሎ የተዘጋጀ ዩአርኤል ካለህ እሱን ተጠቀም
        }
      }
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans text-slate-900">
      
      {/* 🔵 Left Side: Brand Experience (Visible on Desktop) */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 p-16 flex-col justify-between relative">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-indigo-500 rounded-full blur-[120px]"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-12">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
              <Layers size={28} />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">DEVVOLTZ</span>
          </div>

          <h2 className="text-5xl font-extrabold text-white leading-tight mb-6">
            The future of <br />
            <span className="text-blue-500">Campus Logistics.</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-md leading-relaxed">
            Modernizing student clearance with AI-driven efficiency and secure digital workflows.
          </p>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-4 text-slate-300">
            <CheckCircle2 className="text-blue-500" size={20} />
            <span className="text-sm font-medium">90% faster processing for BIT Students</span>
          </div>
          <div className="flex items-center gap-4 text-slate-300">
            <ShieldCheck className="text-blue-500" size={20} />
            <span className="text-sm font-medium">End-to-End Enterprise Encryption</span>
          </div>
          <div className="pt-8 border-t border-slate-800">
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold italic">SmartClear v1.0 • DEVVOLTZ Enterprise</p>
          </div>
        </div>
      </div>

      {/* ⚪ Right Side: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50/50">
        <div className="max-w-[440px] w-full">
          
          <div className="mb-10 text-center lg:text-left">
            <h1 className="text-4xl font-black text-slate-900 mb-2">Welcome Back</h1>
            <p className="text-slate-500 font-medium italic">Enter your credentials to access the console.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-bounce">
              <AlertCircle size={20} />
              <span className="font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input 
                  type="email" required
                  className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-[15px] shadow-sm"
                  placeholder="smegn@devvoltz.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700">Forgot password?</button>
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={20} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-600 transition-all text-[15px] shadow-sm"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-70 shadow-xl shadow-slate-900/20 active:scale-[0.98] group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Launch Admin Console</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-slate-200 text-center">
            <p className="text-slate-400 text-sm font-medium">
              Enterprise security by <span className="text-slate-900 font-bold tracking-tight">DEVVOLTZ Technology PLC</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;