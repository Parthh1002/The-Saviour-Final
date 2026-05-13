"use client";

import { Activity, Camera, AlertTriangle, Users, MapPin, Search, Map as MapIcon, ChevronRight, Eye, Crosshair, TriangleAlert, Compass, Battery, Wifi, Navigation } from "lucide-react";
import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import dynamic from 'next/dynamic';
import Link from "next/link";
import { ForestLocation, MapMode } from "@/components/tracking-map";
import { DataUpload } from "@/components/saviour/DataUpload";
import { ReportTemplate } from "@/components/saviour/ReportTemplate";
import { useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSystem } from "@/components/saviour/SystemProvider";

const TrackingMap = dynamic(() => import('@/components/tracking-map'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-secondary/10 animate-pulse rounded-xl flex items-center justify-center text-secondary">Loading Intelligence Map...</div>
});

const data = [
  { time: '00:00', animals: 12, threats: 0 },
  { time: '04:00', animals: 18, threats: 1 },
  { time: '08:00', animals: 45, threats: 0 },
  { time: '12:00', animals: 65, threats: 3 },
  { time: '16:00', animals: 85, threats: 1 },
  { time: '20:00', animals: 34, threats: 5 },
  { time: '24:00', animals: 22, threats: 0 },
];

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [mapMode, setMapMode] = useState<MapMode>('standard');
  const [selectedForest, setSelectedForest] = useState<ForestLocation | null>(null);
  const [toastMsg, setToastMsg] = useState<{ title: string, desc: string, type: 'success' | 'danger' | 'warning' | 'info' } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);

  const [reportFilters, setReportFilters] = useState({
    dateRange: 'Last 7 Days',
    location: 'All',
    activityType: 'All',
    severity: 'All'
  });

  // Task System State
  const { role, officerId, playClick } = useSystem();
  const [tasks, setTasks] = useState([
    { id: 1, text: 'Investigate Zone A Perimeter', status: 'Pending', assignedTo: 'SEC-01' },
    { id: 2, text: 'Check Camera 12 Feed', status: 'In Progress', assignedTo: 'SEC-02' }
  ]);
  const [newTask, setNewTask] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setShowFilterModal(false);
    showToast("Initializing Engine", "Gathering logs and executing AI analysis models...", "info");

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportFilters)
      });

      if (!response.ok) throw new Error('PDF Generation Failed');

      // Convert response to blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Auto-download
      const a = document.createElement('a');
      a.href = url;
      a.download = `Saviour_Enterprise_Report_${new Date().getTime()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      showToast("Report Downloaded", "The enterprise-grade analysis report is ready.", "success");
    } catch (error) {
      console.error(error);
      showToast("Error", "Failed to compile the automated report. Check server logs.", "danger");
    } finally {
      setIsGenerating(false);
    }
  };

  const showToast = (title: string, desc: string, type: 'success' | 'danger' | 'warning' | 'info' = 'info') => {
    setToastMsg({ title, desc, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const stats = [
    { title: "Active Cameras", value: "09/12", sub: "3 offline for maintenance", icon: Camera, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20", link: "/cctv" },
    { title: "Detections (24h)", value: "1,284", sub: "+14% from yesterday", icon: Activity, color: "text-success", bg: "bg-success/10", border: "border-success/20" },
    { title: "Critical Alerts", value: "3", sub: "2 require immediate action", icon: AlertTriangle, color: "text-danger", bg: "bg-danger/10", border: "border-danger/20" },
    { title: "Active Personnel", value: "18", sub: "Deployed across 4 zones", icon: Users, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" }
  ];

  if (!mounted) return null;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-8 max-w-[1600px] mx-auto w-full gap-6 animate-fade-in relative">

      {/* Toast Notification */}
      {toastMsg && (
        <div className={`fixed top-20 right-8 z-[500] glass border p-4 rounded-xl shadow-lg animate-fade-in flex gap-3 min-w-[300px] ${toastMsg.type === 'danger' ? 'border-danger/50' :
          toastMsg.type === 'warning' ? 'border-warning/50' :
            toastMsg.type === 'success' ? 'border-success/50' : 'border-primary/50'
          }`}>
          <div className={`mt-1 h-2 w-2 rounded-full animate-pulse ${toastMsg.type === 'danger' ? 'bg-danger' :
            toastMsg.type === 'warning' ? 'bg-warning' :
              toastMsg.type === 'success' ? 'bg-success' : 'bg-primary'
            }`} />
          <div>
            <h4 className="font-bold text-sm text-foreground">{toastMsg.title}</h4>
            <p className="text-xs text-secondary mt-1">{toastMsg.desc}</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            Command Center
          </h1>
          <p className="text-secondary text-sm mt-1">Real-time surveillance and monitoring systems are online.</p>
        </div>
        <div className="flex gap-3">
          <Link href="/cctv" onClick={playClick} className="bg-panel border border-border text-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary/10 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm">
            <Eye className="h-4 w-4" /> View CCTV Matrix
          </Link>
          {role === 'main_officer' && (
            <button
              onClick={() => { playClick(); setShowFilterModal(true); }}
              disabled={isGenerating}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium transition-all shadow-[var(--shadow-glow)] flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Compiling PDF...</>
              ) : "Generate Report"}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6">

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              onClick={() => stat.link ? window.location.href = stat.link : null}
              className={`glass rounded-xl p-5 border border-border flex items-center justify-between group transition-all duration-300 hover:shadow-[var(--shadow-glow)] hover:-translate-y-1 ${stat.link ? 'cursor-pointer hover:border-primary/50' : ''}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div>
                <p className="text-secondary font-medium text-sm mb-1">{stat.title}</p>
                <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                <p className="text-xs text-secondary mt-2">{stat.sub}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.bg} ${stat.border} border transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">

          {/* Activity Overview */}
          <div className="lg:col-span-2 glass rounded-xl border border-border p-5 flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-semibold text-lg">Activity Overview</h3>
              <select className="bg-background border border-border text-sm rounded-md px-3 py-1 focus:outline-none focus:ring-1 focus:ring-primary text-foreground">
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAnimals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--danger)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--secondary)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'var(--panel)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-glow)' }}
                    itemStyle={{ color: 'var(--foreground)' }}
                  />
                  <Area type="monotone" dataKey="animals" stroke="var(--success)" strokeWidth={2} fillOpacity={1} fill="url(#colorAnimals)" />
                  <Area type="monotone" dataKey="threats" stroke="var(--danger)" strokeWidth={2} fillOpacity={1} fill="url(#colorThreats)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* OFFICER AUTHORITY PANEL OR TASKS */}
          {role === 'main_officer' ? (
            <div className="lg:col-span-1 glass rounded-xl border border-danger/30 p-5 flex flex-col relative overflow-hidden group bg-gradient-to-br from-panel to-danger/5">
              <div className="absolute top-0 left-0 w-full h-1 bg-danger/50" />
              <div className="flex justify-between items-center mb-4 z-10">
                <h3 className="font-semibold text-lg text-danger flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 animate-pulse" />
                  Officer Override
                </h3>
                <div className="text-[10px] bg-danger/20 text-danger px-2 py-1 rounded font-mono uppercase border border-danger/30 tracking-widest">
                  Level 5 Auth
                </div>
              </div>

              <div className="space-y-2 flex-1 mb-4">
                <button
                  onClick={() => { playClick(); showToast("Drone Deployed", "UAV-Strike Drone initialized and en route to target sector.", "danger"); }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-danger/20 bg-background hover:bg-danger/10 hover:border-danger/50 hover:scale-[1.02] active:scale-[0.98] transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <Crosshair className="w-4 h-4 text-danger" />
                    <span className="text-sm font-medium">Deploy Strike Drone</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-secondary group-hover:text-danger transition-colors" />
                </button>

                <button
                  onClick={() => { playClick(); showToast("Lockdown Initiated", "Sector lockdown protocols activated. All checkpoints secured.", "warning"); }}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-warning/20 bg-background hover:bg-warning/10 hover:border-warning/50 hover:scale-[1.02] active:scale-[0.98] transition-all group shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <TriangleAlert className="w-4 h-4 text-warning" />
                    <span className="text-sm font-medium">Initiate Sector Lockdown</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-secondary group-hover:text-warning transition-colors" />
                </button>
              </div>

              {/* Task Assignment System (Main Officer view) */}
              <div className="border-t border-border pt-4 mt-2">
                <h4 className="text-sm font-bold mb-2">Assign Field Task</h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="e.g. Check Zone B"
                    className="flex-1 bg-background border border-border rounded text-sm px-2 py-1"
                  />
                  <button onClick={() => {
                    if (newTask) {
                      playClick();
                      setTasks([...tasks, { id: Date.now(), text: newTask, status: 'Pending', assignedTo: 'SEC-ALL' }]);
                      setNewTask('');
                      showToast("Task Assigned", "Task broadcasted to field operators.", "success");
                    }
                  }} className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium">Assign</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-1 glass rounded-xl border border-primary/30 p-5 flex flex-col relative overflow-hidden group">
              <div className="flex justify-between items-center mb-4 z-10">
                <h3 className="font-semibold text-lg text-primary flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  My Field Tasks
                </h3>
                <div className="text-[10px] bg-primary/20 text-primary px-2 py-1 rounded font-mono uppercase border border-primary/30 tracking-widest">
                  Field Operator
                </div>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto pr-2">
                {tasks.map(task => (
                  <div key={task.id} className="p-3 border border-border rounded-lg bg-background">
                    <p className="text-sm font-medium mb-2">{task.text}</p>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs px-2 py-0.5 rounded font-bold ${task.status === 'Completed' ? 'bg-success/20 text-success' : task.status === 'In Progress' ? 'bg-warning/20 text-warning' : 'bg-secondary/20 text-secondary'}`}>
                        {task.status}
                      </span>
                      {task.status !== 'Completed' && (
                        <button
                          onClick={() => {
                            playClick();
                            setTasks(tasks.map(t => t.id === task.id ? { ...t, status: t.status === 'Pending' ? 'In Progress' : 'Completed' } : t));
                          }}
                          className="text-[10px] bg-primary text-primary-foreground px-2 py-1 rounded shadow-sm hover:bg-primary/90"
                        >
                          {task.status === 'Pending' ? 'Start Task' : 'Complete'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {tasks.length === 0 && <p className="text-sm text-secondary text-center mt-10">No active tasks assigned.</p>}
              </div>
            </div>
          )}
        </div>

        {/* Third Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">

          {/* Live DRONE SURVEILLANCE PANEL */}
          <div className="lg:col-span-1 glass rounded-xl border border-border p-6 flex flex-col relative overflow-hidden group shadow-lg">
            <div className="flex justify-between items-center mb-4 z-10">
              <h3 className="font-semibold text-lg text-foreground flex items-center gap-2"><Compass className="h-5 w-5 text-primary animate-spin-slow" /> Drone Surveillance</h3>
              <div className="flex gap-2">
                <span className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded font-mono shadow-sm">AUTO-PATROL</span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-danger mt-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-danger opacity-75"></span>
                </span>
              </div>
            </div>

            <div className="relative flex-1 bg-black min-h-[300px] rounded-xl overflow-hidden border border-white/10 cursor-crosshair group shadow-inner">
              {/* Live Drone Video Stream */}
              <video 
                autoPlay 
                muted 
                loop 
                playsInline
                className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-[20000ms] scale-105 group-hover:scale-110"
              >
                <source src="/videos/Drone.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 mix-blend-multiply" />
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" /> {/* Tint */}

              {/* Scan Line effect */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary/40 shadow-[0_0_15px_rgba(39,24,126,0.8)] animate-[scan_3s_ease-in-out_infinite] z-20" />

              {/* Bounding Box overlay */}
              <div className="absolute top-[35%] left-[45%] w-[80px] h-[60px] border border-danger shadow-[0_0_10px_rgba(239,68,68,0.8)] rounded-sm z-20 transition-all duration-300 group-hover:scale-110">
                <span className="absolute -top-5 left-0 bg-danger text-white text-[9px] font-mono px-1 py-0.5 whitespace-nowrap">SUSPECT: 98%</span>
                <div className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-danger" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-danger" />
              </div>

              {/* Drone Telemetry Overlay */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-start text-[9px] text-white/90 font-mono z-20">
                <div className="space-y-1">
                  <p className="flex items-center gap-1"><Battery className="h-3 w-3" /> BAT: 74%</p>
                  <p className="flex items-center gap-1"><Wifi className="h-3 w-3 text-success" /> SIG: EXCELLENT</p>
                </div>
                <div className="text-right space-y-1">
                  <p>ALT: 450m</p>
                  <p>SPD: 32km/h</p>
                </div>
              </div>

              {/* Bottom Telemetry */}
              <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end text-xs text-white/90 font-mono z-20">
                <div>
                  <p className="flex items-center gap-1"><Navigation className="h-3 w-3" /> UAV-DRONE-01</p>
                  <p className="text-primary mt-1 font-bold text-[10px]">TRACKING TARGET</p>
                </div>
                <p className="text-[10px]">{new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <DataUpload />
          </div>

        </div>

        {/* Real-time Tracking Map Section (Side by side Layout) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-2">

          {/* Details & Controls */}
          <div className="lg:col-span-1 glass rounded-xl border border-border p-6 flex flex-col justify-between transition-all duration-300">
            {selectedForest ? (
              <div className="animate-fade-in flex-1">
                <h3 className="font-semibold text-xl mb-1 flex items-center gap-2 text-primary">
                  <MapPin className="h-6 w-6" />
                  {selectedForest.name}
                </h3>
                <p className="text-secondary text-sm mb-6">{selectedForest.state} • Coordinates: {selectedForest.lat}, {selectedForest.lng}</p>

                <div className="space-y-4">
                  <div className="p-4 bg-background border border-border rounded-lg shadow-sm">
                    <p className="text-xs text-secondary uppercase font-bold tracking-wider mb-1">Risk Status</p>
                    <p className={`font-bold text-lg ${selectedForest.risk === 'Critical' ? 'text-danger' : selectedForest.risk === 'High' ? 'text-warning' : 'text-success'}`}>
                      {selectedForest.risk} Risk Zone
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-background border border-border rounded-lg">
                      <p className="text-xs text-secondary mb-1">Camera Network</p>
                      <p className="font-semibold text-foreground text-lg">{selectedForest.cameras} Units</p>
                    </div>
                    <div className="p-3 bg-background border border-border rounded-lg">
                      <p className="text-xs text-secondary mb-1">Surveillance</p>
                      <p className="font-semibold text-foreground text-sm">{selectedForest.surveillanceLevel}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-background border border-border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs text-secondary">Intrusion Probability</p>
                      <p className="text-xs font-bold text-danger">{selectedForest.humanProb}</p>
                    </div>
                    <div className="w-full bg-secondary/20 rounded-full h-1.5">
                      <div className="bg-danger h-1.5 rounded-full" style={{ width: selectedForest.humanProb }}></div>
                    </div>
                  </div>

                  <div className="p-3 bg-background border border-border rounded-lg">
                    <p className="text-xs text-secondary mb-1">Wildlife Density</p>
                    <p className="font-semibold text-foreground text-sm">{selectedForest.wildlifeDensity}</p>
                  </div>
                </div>

                <button onClick={() => setSelectedForest(null)} className="mt-6 text-xs font-medium text-secondary hover:text-foreground underline">
                  Clear Selection
                </button>
              </div>
            ) : (
              <div className="animate-fade-in flex-1">
                <h3 className="font-semibold text-xl mb-2 flex items-center gap-2">
                  <MapIcon className="h-6 w-6 text-primary" />
                  National Intelligence Map
                </h3>
                <p className="text-secondary text-sm mb-6">Select any forest reserve on the map to view live telemetry, intrusion risks, and camera unit deployment metrics.</p>

                <div className="h-48 border-2 border-dashed border-border rounded-xl flex items-center justify-center text-secondary bg-panel/30">
                  <p className="text-sm">Click a marker on the map to inspect.</p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-border">
              <p className="text-xs font-bold text-secondary uppercase tracking-wider mb-3">Vision Modes</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setMapMode('standard')}
                  className={`border border-border px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm flex items-center gap-1 ${mapMode === 'standard' ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground hover:bg-secondary/10'}`}
                >
                  <MapIcon className="h-3 w-3" /> Standard
                </button>
                <button
                  onClick={() => setMapMode('thermal')}
                  className={`border border-border px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm flex items-center gap-1 ${mapMode === 'thermal' ? 'bg-danger text-white' : 'bg-background text-foreground hover:bg-secondary/10'}`}
                >
                  <Activity className="h-3 w-3" /> Thermal
                </button>
                <button
                  onClick={() => setMapMode('night')}
                  className={`border border-border px-3 py-1.5 rounded text-xs font-medium transition-colors shadow-sm flex items-center gap-1 ${mapMode === 'night' ? 'bg-[#1b4332] text-[#4ade80] border-[#4ade80]' : 'bg-background text-foreground hover:bg-secondary/10'}`}
                >
                  <Eye className="h-3 w-3" /> Night Vision
                </button>
              </div>
            </div>
          </div>

          {/* Locked Dimension Interactive Map */}
          <div className="lg:col-span-2 glass rounded-xl border border-border p-2 h-[500px] lg:h-[600px] overflow-hidden flex flex-col relative transition-all duration-500">
            <div className="flex-1 rounded-lg overflow-hidden border border-border relative">
              <span className={`absolute top-4 right-4 z-[400] text-xs font-mono backdrop-blur px-3 py-1.5 rounded-md border flex items-center gap-2 shadow-sm ${mapMode === 'thermal' ? 'bg-danger/20 text-danger border-danger/50' : mapMode === 'night' ? 'bg-[#1b4332]/80 text-[#4ade80] border-[#4ade80]' : 'bg-panel/90 text-primary border-border'}`}>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${mapMode === 'thermal' ? 'bg-danger' : mapMode === 'night' ? 'bg-[#4ade80]' : 'bg-primary'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${mapMode === 'thermal' ? 'bg-danger' : mapMode === 'night' ? 'bg-[#4ade80]' : 'bg-primary'}`}></span>
                </span>
                {mapMode === 'thermal' ? 'LIVE THERMAL SYNC' : mapMode === 'night' ? 'NIGHT VISION ACTIVE' : 'LIVE MAP SYNC'}
              </span>
              <div className="absolute inset-0 z-0 pointer-events-none">
                {/* This wrapper locks the leaflet container perfectly */}
              </div>
              <div className="w-full h-full relative z-10 isolate">
                <TrackingMap mode={mapMode} onSelectLocation={setSelectedForest} />
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fade-in_0.2s_ease-out_forwards]">
          <div className="bg-panel border border-border rounded-xl shadow-2xl p-6 max-w-md w-full relative">
            <h2 className="text-xl font-bold mb-1 text-foreground">Configure Report</h2>
            <p className="text-xs text-secondary mb-6">Select specific data filters for the AI analysis engine.</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1">Date Range</label>
                <select className="w-full bg-background border border-border rounded p-2 text-sm" value={reportFilters.dateRange} onChange={e => setReportFilters({ ...reportFilters, dateRange: e.target.value })}>
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>All Time</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-foreground block mb-1">Location / Zone</label>
                <select className="w-full bg-background border border-border rounded p-2 text-sm" value={reportFilters.location} onChange={e => setReportFilters({ ...reportFilters, location: e.target.value })}>
                  <option>All</option>
                  <option>Sector Alpha</option>
                  <option>Sector Bravo</option>
                  <option>North Gate</option>
                  <option>River Basin</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1">Activity Type</label>
                  <select className="w-full bg-background border border-border rounded p-2 text-sm" value={reportFilters.activityType} onChange={e => setReportFilters({ ...reportFilters, activityType: e.target.value })}>
                    <option>All</option>
                    <option>Human Intrusion</option>
                    <option>Animal Detection</option>
                    <option>Vehicle Movement</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-semibold text-foreground block mb-1">Severity</label>
                  <select className="w-full bg-background border border-border rounded p-2 text-sm" value={reportFilters.severity} onChange={e => setReportFilters({ ...reportFilters, severity: e.target.value })}>
                    <option>All</option>
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button onClick={() => setShowFilterModal(false)} className="px-4 py-2 text-sm text-secondary hover:bg-secondary/10 rounded font-medium">Cancel</button>
              <button onClick={handleGenerateReport} className="px-5 py-2 text-sm bg-primary text-primary-foreground font-semibold rounded shadow-[var(--shadow-glow)]">Run AI Engine & Export</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
