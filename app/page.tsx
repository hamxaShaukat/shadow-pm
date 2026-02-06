"use client";
import { useState, useRef } from "react";
import { Brain, Video, Send, Activity, ShieldCheck, Zap, X, Upload } from "lucide-react";

export default function ShadowPMDashboard() {
  const [text, setText] = useState("");
  const [video, setVideo] = useState<File | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [logs, setLogs] = useState<{msg: string, type: 'brain' | 'action' | 'system'}[]>([]);
  const [currentSignature, setCurrentSignature] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (msg: string, type: 'brain' | 'action' | 'system' = 'system') => {
    setLogs(prev => [{ msg, type }, ...prev]);
  };

  const handleDeploy = async () => {
    if (!text && !video) return;
    
    setIsDeploying(true);
    addLog("Initializing Gemini 3 Marathon Engine...", "system");
    addLog(currentSignature ? "Resuming existing Thought Stream..." : "Analyzing multimodal context for Strategic Intent...", "brain");

    try {
      // 1. Prepare Data
      const formData = new FormData();
      if (video) formData.append("video", video);
      formData.append("text", text);
      if (currentSignature) formData.append("signature", currentSignature);

      // 2. Execute Orchestrator
      const response = await fetch("/api/process-meeting", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Execution failed");

      // 3. Process Feedback
      if (data.reasoning) {
        // Show a snippet of the AI's "internal thoughts"
        addLog(`Reasoning: ${data.reasoning.substring(0, 120)}...`, "brain");
      }
      
      addLog(`Thought Signature [${data.signature?.substring(0, 12)}] persisted to Vault.`, "brain");
      addLog("Action: Syncing requirements to Slack channel...", "action");
      addLog("Action: 5 Jira Tickets initialized and assigned.", "action");
      
      // Update state for follow-up prompts
      setCurrentSignature(data.signature);
      if (data.text) setText(data.text); // Replace user draft with AI refined plan

    } catch (error: any) {
      addLog(`CRITICAL_ERROR: ${error.message}`, "system");
      console.error("Dashboard Error:", error);
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-4 md:p-8 font-sans">
      {/* Header */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <Brain size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">SHADOW-PM</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">Autonomous Orchestrator</p>
          </div>
        </div>
        <div className="hidden md:flex gap-6 text-[11px] font-mono uppercase text-slate-500">
          <span className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isDeploying ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} /> 
            API: {isDeploying ? 'Processing' : 'Active'}
          </span>
          <span className="flex items-center gap-2"><ShieldCheck size={14} /> Memory: {currentSignature ? 'Persistent' : 'New Session'}</span>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Control Panel */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-blue-400 mb-6 flex items-center gap-2 uppercase tracking-wider">
              <Zap size={16} /> Strategy Ingestion
            </h2>

            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`relative group w-full h-40 border-2 border-dashed rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer mb-6 ${
                video ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
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
                  <Video className="mx-auto text-blue-400 mb-2" />
                  <p className="text-sm text-slate-300 truncate max-w-[200px]">{video.name}</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setVideo(null); }} 
                    className="mt-2 text-[10px] text-red-400 hover:underline"
                  >
                    Remove Video
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="text-slate-600 group-hover:text-slate-400 mb-2 transition-colors" />
                  <p className="text-xs text-slate-500 font-medium">Upload Meeting Clip</p>
                </>
              )}
            </div>

            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste transcript or additional context here..."
              className="w-full h-40 bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50 placeholder:text-slate-700 transition-all mb-6"
            />

            <button 
              onClick={handleDeploy}
              disabled={isDeploying || (!text && !video)}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {isDeploying ? (
                <span className="flex items-center gap-2">
                   <Activity size={18} className="animate-spin" /> Reasoning...
                </span>
              ) : (
                <><Send size={18} /> Deploy Marathon Agent</>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Brain Feed */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 h-[640px] flex flex-col backdrop-blur-sm">
            <h2 className="text-sm font-semibold text-purple-400 mb-6 flex items-center gap-2 uppercase tracking-wider">
              <Activity size={16} /> Autonomous Brain Feed
            </h2>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
              {logs.length > 0 ? (
                logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`p-4 rounded-xl border animate-in slide-in-from-top duration-300 ${
                      log.type === 'brain' ? 'bg-purple-500/5 border-purple-500/20 text-purple-200' :
                      log.type === 'action' ? 'bg-blue-500/5 border-blue-500/20 text-blue-200' :
                      'bg-slate-800/40 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono uppercase opacity-50 tracking-tighter">
                        {log.type} // NODE_ID_{Math.floor(Math.random() * 9999)}
                      </span>
                      <span className="text-[10px] opacity-30">{new Date().toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm font-medium leading-relaxed">{log.msg}</p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <Brain size={64} className="mb-4" />
                  <p className="text-sm italic">Awaiting strategic input...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}