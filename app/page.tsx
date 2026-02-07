"use client";
import { useState, useRef } from "react";
import { Brain, Video, Send, Activity, Zap, Upload, Github, Sparkles } from "lucide-react";
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
    background: '#ffffff',
    color: '#1a1a1a',
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
    MySwal.fire({
      title: 'Initializing Marathon Engine',
      html: 'Analyzing multimodal context and syncing strategic intent...',
      allowOutsideClick: false,
      didOpen: () => { Swal.showLoading(); },
      background: '#ffffff',
      color: '#6366f1'
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
        background: '#ffffff',
        color: '#1a1a1a'
      });
      addLog(`CRITICAL_ERROR: ${error.message}`, "system");
    } finally {
      setIsDeploying(false);
    }
  };

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
        background: '#ffffff',
        color: '#1a1a1a',
        inputAttributes: { style: 'color: black' }
    });

    if (prNum) {
        addLog(`Sentinel: Intercepting PR #${prNum}...`, "system");
        Toast.fire({ icon: 'info', title: 'Audit in progress...' });
    }
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-indigo-50/30 p-6 md:p-10 font-sans">
      {/* Header */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <div className="bg-linear-to-br from-indigo-600 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200">
            <Brain size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Shadow PM</h1>
            <p className="text-xs text-indigo-600 font-medium">Strategy Sentinel v3.0</p>
          </div>
        </div>
        
        <div className="flex gap-3 items-center">
            <button 
                onClick={handleManualAudit}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 rounded-lg text-sm font-medium transition-all border border-slate-200 shadow-sm hover:shadow text-slate-700"
            >
                <Github size={16} /> Audit Repo
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-full border border-slate-200 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${isDeploying ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`} /> 
                <span className="text-xs font-medium text-slate-600">{isDeploying ? 'Processing' : 'Ready'}</span>
            </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Control Panel */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Zap size={16} className="text-indigo-600" /> 
                Ingestion Node
              </h2>
              <Sparkles size={14} className="text-indigo-400" />
            </div>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative group w-full h-40 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer mb-5 ${
                video 
                  ? 'border-indigo-300 bg-indigo-50/50' 
                  : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => setVideo(e.target.files?.[0] || null)} 
                className="hidden" 
                accept="video/*" 
              />
              {video ? (
                <div className="text-center p-4">
                  <Video className="mx-auto text-indigo-600 mb-2" size={28} />
                  <p className="text-sm font-medium text-slate-700 truncate max-w-xs">{video.name}</p>
                  <p className="text-xs text-slate-500 mt-1">Click to change</p>
                </div>
              ) : (
                <>
                  <Upload className="text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" size={28} />
                  <p className="text-sm text-slate-600 font-medium">Upload strategy video</p>
                  <p className="text-xs text-slate-400 mt-1">or drag and drop</p>
                </>
              )}
            </div>

            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter strategic mandates or meeting transcripts..."
              className="w-full h-40 bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 focus:outline-none focus:border-indigo-400 focus:bg-white placeholder:text-slate-400 transition-all mb-5 resize-none"
            />

            <button 
              onClick={handleDeploy}
              disabled={isDeploying || (!text && !video)}
              className="w-full bg-linear-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:from-slate-300 disabled:to-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 disabled:shadow-none transition-all flex items-center justify-center gap-2.5 text-sm"
            >
              {isDeploying ? (
                <>
                  <Activity size={18} className="animate-spin" />
                  Processing Strategy
                </>
              ) : (
                <>
                  <Send size={18} />
                  Execute Deploy
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Activity Stream */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200 rounded-2xl p-7 h-150 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <Activity size={16} className="text-violet-600" />
                Activity Stream
              </h2>
              <span className="text-xs font-medium text-slate-500">{logs.length} events</span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-xl border transition-all duration-300 hover:shadow-md ${
                      log.type === 'brain' 
                        ? 'bg-violet-50 border-violet-200 hover:border-violet-300' :
                      log.type === 'action' 
                        ? 'bg-indigo-50 border-indigo-200 hover:border-indigo-300' :
                        'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs font-semibold uppercase tracking-wide ${
                        log.type === 'brain' ? 'text-violet-700' :
                        log.type === 'action' ? 'text-indigo-700' :
                        'text-slate-600'
                      }`}>
                        {log.type}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                      </span>
                    </div>
                    <p className={`text-sm leading-relaxed ${
                      log.type === 'brain' ? 'text-violet-900' :
                      log.type === 'action' ? 'text-indigo-900' :
                      'text-slate-700'
                    }`}>
                      {log.msg}
                    </p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-300">
                  <Brain size={64} className="mb-4 opacity-20" />
                  <p className="text-sm font-medium text-slate-400">Awaiting input...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}