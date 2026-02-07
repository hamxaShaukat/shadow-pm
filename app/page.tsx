"use client";
import { useState, useRef } from "react";
import { Brain, Video, Send, Activity, ShieldCheck, Zap, Upload, Github } from "lucide-react";
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export default function ShadowPMDashboard() {
  const [text, setText] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: 'brain' | 'action' | 'system'}[]>([]);
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast Helper
  const Toast = MySwal.mixin({
    toast: true,
    position: 'top-end',
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    background: '#0f172a',
    color: '#f8fafc',
    didOpen: (toast) => {
      toast.addEventListener('mouseenter', Swal.stopTimer)
      toast.addEventListener('mouseleave', Swal.resumeTimer)
    }
  });

  const addLog = (msg: string, type: 'brain' | 'action' | 'system' = 'system') => {
    setLogs(prev => [{ msg, type }, ...prev]);
  };

  const handleDeploy = async () => {
    if (!text && !video) return;
    
    setIsDeploying(true);
    // Initial Loading Alert
    MySwal.fire({
      title: 'Initializing Marathon Engine',
      html: 'Analyzing multimodal context and syncing strategic intent...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); },
      background: '#0f172a',
      color: '#60a5fa'
    });

    addLog("Initializing Gemini 3 Marathon Engine...", "system");

    try {
      const formData = new FormData();
      if (video) formData.append("video", video);
      formData.append("text", text);
      if (currentSignature) formData.append("signature", currentSignature);

      const response = await fetch("/api/process-meeting", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Execution failed");

      // SUCCESS HANDLING
      MySwal.close();
      Toast.fire({
        icon: 'success',
        title: 'Strategy Persisted to Vault'
      });

      if (data.reasoning) {
        addLog(`Internal Reasoning: ${data.reasoning.substring(0, 150)}...`, "brain");
      }
      
      addLog(`Signature [${data.signature?.substring(0, 12)}] Secured.`, "brain");
      addLog("Action: Syncing to Slack & Jira...", "action");
      
      setCurrentSignature(data.signature);
      if (data.text) setText(data.text); 

    } catch (error: any) {
      MySwal.fire({
        icon: 'error',
        title: 'Deployment Failed',
        text: error.message,
        background: '#0f172a',
        color: '#f8fafc'
      });
      addLog(`CRITICAL_ERROR: ${error.message}`, "system");
    } finally {
      setIsDeploying(false);
    }
  };

  // NEW: Manual Audit Button for Demo
  const handleManualAudit = async () => {
    if (!currentSignature) {
        Toast.fire({ icon: 'error', title: 'No Strategy Signature Found' });
        return;
    }

    const { value: prNum } = await MySwal.fire({
        title: 'Enter PR Number to Audit',
        input: 'text',
        inputLabel: 'Target PR #',
        inputValue: '3',
        showCancelButton: true,
        background: '#0f172a',
        color: '#f8fafc',
        inputAttributes: { style: 'color: black' }
    });

    if (prNum) {
        addLog(`Sentinel: Intercepting PR #${prNum}...`, "system");
        // Trigger your review-pr API manually
        Toast.fire({ icon: 'info', title: 'Audit in progress...' });
    }
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-[0_0_20px_rgba(37,99,235,0.5)]">
            <Brain size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white italic">SHADOW-PM</h1>
            <p className="text-[10px] text-blue-400 font-mono uppercase tracking-[0.2em]">Strategy Sentinel v3.0</p>
          </div>
        </div>
        
        <div className="flex gap-4">
            <button 
                onClick={handleManualAudit}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-[11px] font-mono transition-colors border border-slate-700"
            >
                <Github size={14} /> Audit Repo
            </button>
            <div className="hidden md:flex gap-6 text-[11px] font-mono uppercase text-slate-500 items-center">
                <span className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isDeploying ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} /> 
                    {isDeploying ? 'Thinking' : 'Ready'}
                </span>
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Control Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
            <h2 className="text-xs font-bold text-blue-500 mb-6 flex items-center gap-2 uppercase tracking-[0.3em]">
              <Zap size={14} /> Ingestion Node
            </h2>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative group w-full h-44 border-2 border-dashed rounded-2xl transition-all flex flex-col items-center justify-center cursor-pointer mb-6 ${
                video ? 'border-blue-500/50 bg-blue-500/10' : 'border-slate-800 hover:border-blue-500/30 hover:bg-slate-800/50'
              }`}
            >
              <input type="file" ref={fileInputRef} onChange={(e) => setVideo(e.target.files?.[0] || null)} className="hidden" accept="video/*" />
              {video ? (
                <div className="text-center p-4">
                  <Video className="mx-auto text-blue-400 mb-2 animate-bounce" />
                  <p className="text-sm font-mono text-slate-300 truncate max-w-50">{video.name}</p>
                </div>
              ) : (
                <>
                  <Upload className="text-slate-600 group-hover:text-blue-400 mb-2 transition-all" />
                  <p className="text-[11px] text-slate-500 font-mono">DRAG_DROP_STRATEGY_VIDEO</p>
                </>
              )}
            </div>

            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Inject strategic mandates or meeting transcripts..."
              className="w-full h-44 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/50 placeholder:text-slate-700 transition-all mb-6 font-mono"
            />

            <button 
              onClick={handleDeploy}
              disabled={isDeploying || (!text && !video)}
              className="w-full bg-linear-to-r from-blue-700 to-blue-500 hover:from-blue-600 hover:to-blue-400 disabled:from-slate-800 disabled:to-slate-800 text-white font-black py-4 rounded-2xl shadow-[0_10px_20px_rgba(37,99,235,0.2)] transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
            >
              {isDeploying ? <Activity size={18} className="animate-spin" /> : <Send size={18} />}
              {isDeploying ? 'Processing Strategy' : 'Execute Deploy'}
            </button>
          </div>
        </div>

        {/* Right Column: Brain Feed */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 h-175 flex flex-col backdrop-blur-md shadow-inner">
            <h2 className="text-xs font-bold text-purple-400 mb-6 flex items-center gap-2 uppercase tracking-[0.3em]">
              <Activity size={14} /> Marathon Stream
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-3 custom-scrollbar">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`p-5 rounded-2xl border transition-all duration-500 hover:scale-[1.01] ${
                      log.type === 'brain' ? 'bg-purple-500/10 border-purple-500/30 text-purple-100 shadow-[0_0_15px_rgba(168,85,247,0.1)]' :
                      log.type === 'action' ? 'bg-blue-500/10 border-blue-500/30 text-blue-100 shadow-[0_0_15px_rgba(59,130,246,0.1)]' :
                      'bg-slate-800/20 border-slate-800 text-slate-400 font-mono'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[9px] font-black uppercase opacity-60 tracking-widest">
                        {log.type} :: LOG_{logs.length - i}
                      </span>
                      <span className="text-[9px] font-mono opacity-40">{new Date().toLocaleTimeString([], {hour12: false})}</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed tracking-tight">{log.msg}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <Brain size={80} className="mb-4 animate-pulse" />
                  <p className="text-xs font-mono tracking-widest uppercase">System_Idle_Waiting_For_Input</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}