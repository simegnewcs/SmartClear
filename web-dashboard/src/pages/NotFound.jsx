import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Compass } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-slate-100 p-6 rounded-full mb-6">
        <Compass size={64} className="text-slate-300 animate-pulse" />
      </div>
      <h1 className="text-4xl font-black text-slate-900 mb-2">404</h1>
      <p className="text-slate-500 mb-8 max-w-md">
        የፈለጉት ገጽ አልተገኘም። ምናልባት ወደ ሌላ ቦታ ተዛውሮ ወይም ተሰርዞ ሊሆን ይችላል።
      </p>
      <button 
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all"
      >
        <Home size={18} /> Back to Dashboard
      </button>
    </div>
  );
};

export default NotFound;