import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  FileSpreadsheet,
  ShieldCheck,
  Cpu,
  Radio,
  ArrowRight,
} from "lucide-react";

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#0A0A0A] text-white font-sans selection:bg-[#E2FF00] selection:text-black">
      <div aria-hidden="true" className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-25" style={{ backgroundImage: "url('/assets/debate.png')" }} />
      <div aria-hidden="true" className="absolute inset-0 z-[1] bg-[#0A0A0A]/85" />
      {/* Navigation Bar */}
      <nav className="relative z-10 max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-[#E2FF00] text-black font-black flex items-center justify-center text-lg">
            T
          </div>
          <div>
            <span className="display-type text-xl tracking-tight text-white block leading-none">
              TABULA™
            </span>
            <span className="micro-label text-[9px] text-[#888] block">
              TABULATION & SURVEY STUDIO
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-xs font-bold uppercase tracking-widest">
          <button
            onClick={() => navigate("/login")}
            className="text-[#A0A0A0] hover:text-[#E2FF00] transition-colors"
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-[#E2FF00] hover:bg-[#CBE600] text-black px-5 py-2.5 font-black uppercase tracking-widest transition-colors flex items-center space-x-2"
          >
            <span>Open Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center space-y-8 overflow-hidden">
        <div className="inline-flex items-center space-x-2 border border-white/20 px-3.5 py-1.5 bg-[#141414]">
          <div className="w-2 h-2 rounded-full bg-[#E2FF00] animate-pulse" />
          <span className="micro-label text-[#A0A0A0]">
            DETERMINISTIC TABULATION & SURVEY INTELLIGENCE ENGINE
          </span>
        </div>

        <div className="space-y-2">
          <h1 className="display-type text-5xl md:text-8xl tracking-tight text-white uppercase leading-none">
            ARCHITECTS OF{" "}
            <span className="accent-text">DIGITAL TABULATION</span>
          </h1>
          <p className="text-base md:text-lg text-[#A0A0A0] max-w-2xl mx-auto leading-relaxed font-normal">
            Engineered for championship debate tournaments and qualitative
            research. Deterministic rankings, verified ballot verification, and
            OpenRouter survey intelligence.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto px-8 py-4 bg-[#E2FF00] hover:bg-[#CBE600] text-black text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center space-x-2"
          >
            <span>ENTER ENTERPRISE CONSOLE</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/events?filter=Completed")}
            className="w-full sm:w-auto px-8 py-4 bg-[#141414] hover:bg-[#1C1C1C] text-white text-xs font-bold uppercase tracking-widest border border-white/20 transition-colors"
          >
            VIEW PUBLISHED STANDINGS
          </button>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#141414] border border-white/10 p-8 space-y-4">
          <div className="flex items-center justify-between">
            <Trophy className="w-7 h-7 text-[#E2FF00]" />
            <span className="micro-label">MODULE 01</span>
          </div>
          <h3 className="display-type text-2xl text-white">
            Tabulation Engine
          </h3>
          <p className="text-xs text-[#A0A0A0] leading-relaxed">
            Support for British Parliamentary, World Schools, Asian
            Parliamentary, and Policy formats with strict tie-breaking
            algorithms.
          </p>
        </div>

        <div className="bg-[#141414] border border-white/10 p-8 space-y-4">
          <div className="flex items-center justify-between">
            <FileSpreadsheet className="w-7 h-7 text-[#E2FF00]" />
            <span className="micro-label">MODULE 02</span>
          </div>
          <h3 className="display-type text-2xl text-white">
            Survey Intelligence
          </h3>
          <p className="text-xs text-[#A0A0A0] leading-relaxed">
            Multi-type survey builder powered by OpenRouter AI for automated
            qualitative theme extraction and sentiment analysis.
          </p>
        </div>

        <div className="bg-[#141414] border border-white/10 p-8 space-y-4">
          <div className="flex items-center justify-between">
            <ShieldCheck className="w-7 h-7 text-[#E2FF00]" />
            <span className="micro-label">MODULE 03</span>
          </div>
          <h3 className="display-type text-2xl text-white">
            Enterprise Governance
          </h3>
          <p className="text-xs text-[#A0A0A0] leading-relaxed">
            Role-based access control, immutable audit trails, score
            verification protocols, and clean administrative control.
          </p>
        </div>
      </section>
    </div>
  );
};
