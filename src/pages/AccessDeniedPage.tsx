import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { tabulaStore } from '../lib/store';

export const AccessDeniedPage: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = tabulaStore.getCurrentUser();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full bg-[#141414] border border-[#FF4D4D]/30 p-8 text-center space-y-6 shadow-2xl">
        <div className="w-14 h-14 bg-[#FF4D4D]/10 border border-[#FF4D4D]/30 text-[#FF4D4D] flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="micro-label text-[#FF4D4D]">403 ACCESS RESTRICTED</span>
          <h1 className="display-type text-3xl text-white uppercase tracking-tight">
            ROLE PERMISSION DENIED
          </h1>
          <p className="text-xs text-[#A0A0A0] leading-relaxed">
            Your current role context (<strong className="text-[#E2FF00] font-mono">{currentUser.role}</strong>) does not have authorization to view or execute actions in this section.
          </p>
        </div>

        <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-4 py-2.5 bg-[#1C1C1C] hover:bg-[#252525] border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 px-4 py-2.5 bg-[#E2FF00] hover:bg-[#CBE600] text-black text-xs font-black uppercase tracking-wider transition-colors flex items-center justify-center space-x-1.5"
          >
            <Home className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
