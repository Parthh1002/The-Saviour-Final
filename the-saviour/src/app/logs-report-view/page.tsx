"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0B6623', '#1E8449', '#f59e0b', '#475569'];

export default function LogsReportView() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (id) {
      fetch(`/api/report-data?id=${id}`)
        .then(res => res.json())
        .then(data => setData(data))
        .catch(console.error);
    }
  }, [id]);

  if (!data) return <div className="p-10 font-mono text-xs">Loading audit logs for PDF engine...</div>;

  return (
    <div className="bg-white text-black p-8 w-[800px] mx-auto" style={{ fontFamily: 'sans-serif' }}>
      
      {/* Header */}
      <div className="border-b-2 border-emerald-800 pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">THE SAVIOUR</h1>
          <p className="text-slate-600 font-medium">System Activity & Officer Audit Log</p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p>Generated: {new Date(data.timestamp).toLocaleString()}</p>
          <p>Audit ID: {data.id.split('-')[0].toUpperCase()}</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatBox label="Total Logins" value={data.officerSummary.totalLogins} />
        <StatBox label="Total Sessions" value={data.officerSummary.totalSessions} />
        <StatBox label="Active Time" value={data.officerSummary.totalActiveTime} />
        <StatBox label="Officers Logged" value={data.officerSummary.activeOfficers} />
      </div>

      {/* AI Insights */}
      <div className="mb-6 bg-slate-50 border border-slate-200 p-4 rounded">
        <h2 className="text-sm font-bold text-slate-800 mb-2 border-b border-slate-200 pb-1">AI Audit Intelligence</h2>
        <ul className="list-disc pl-5 text-xs space-y-1 text-slate-700 font-medium">
          {data.aiInsights.map((insight: string, i: number) => (
            <li key={i}>{insight}</li>
          ))}
        </ul>
      </div>

      {/* Login Table */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-2">Officer Session History (Last 24h)</h2>
        <table className="w-full text-[10px] text-left border-collapse">
          <thead>
            <tr className="bg-emerald-800 text-white">
              <th className="border border-slate-300 p-1.5">Officer ID</th>
              <th className="border border-slate-300 p-1.5">Login Time</th>
              <th className="border border-slate-300 p-1.5">Logout Time</th>
              <th className="border border-slate-300 p-1.5">Duration</th>
            </tr>
          </thead>
          <tbody>
            {data.loginLogoutTable.map((h: any, i: number) => (
              <tr key={i} className="even:bg-slate-50">
                <td className="border border-slate-300 p-1.5 font-bold text-emerald-800">{h.officer}</td>
                <td className="border border-slate-300 p-1.5">{h.login}</td>
                <td className="border border-slate-300 p-1.5">{h.logout}</td>
                <td className="border border-slate-300 p-1.5 font-medium">{h.duration}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Activity Logs */}
      <div className="mb-6">
        <h2 className="text-sm font-bold text-slate-800 mb-2">Detailed System Interaction Logs</h2>
        <table className="w-full text-[10px] text-left border-collapse">
          <thead>
            <tr className="bg-slate-200 text-slate-800">
              <th className="border border-slate-300 p-1.5">Time</th>
              <th className="border border-slate-300 p-1.5">Officer</th>
              <th className="border border-slate-300 p-1.5">Action Performed</th>
              <th className="border border-slate-300 p-1.5">Location/IP</th>
              <th className="border border-slate-300 p-1.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.activityLogs.map((l: any, i: number) => (
              <tr key={i} className="even:bg-slate-50">
                <td className="border border-slate-300 p-1.5 font-mono">{l.time}</td>
                <td className="border border-slate-300 p-1.5 font-bold">{l.officer}</td>
                <td className="border border-slate-300 p-1.5">{l.action}</td>
                <td className="border border-slate-300 p-1.5 text-slate-600">{l.location}</td>
                <td className={`border border-slate-300 p-1.5 text-center font-bold ${l.status === 'Failed' ? 'text-red-600' : 'text-emerald-700'}`}>{l.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-4 mt-6 break-inside-avoid">
        <div className="border border-slate-200 p-3 rounded">
          <h3 className="text-xs font-bold text-center mb-2">System Usage Over Time (24h)</h3>
          <LineChart width={340} height={160} data={data.chartData.activityTimeline}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" fontSize={9} />
            <YAxis fontSize={9} />
            <Line type="monotone" dataKey="value" stroke="#0B6623" strokeWidth={2} isAnimationActive={false} dot={false} />
          </LineChart>
        </div>

        <div className="border border-slate-200 p-3 rounded">
          <h3 className="text-xs font-bold text-center mb-2">Action Distribution</h3>
          <PieChart width={340} height={160}>
            <Pie data={data.chartData.actionDistribution} cx="50%" cy="50%" outerRadius={50} dataKey="value" label={({name, percent}) => `${name} ${((percent || 0) * 100).toFixed(0)}%`} labelLine={false} isAnimationActive={false}>
              {data.chartData.actionDistribution.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        </div>

        <div className="col-span-2 border border-slate-200 p-3 rounded break-inside-avoid">
          <h3 className="text-xs font-bold text-center mb-2">Total Actions per Officer</h3>
          <BarChart width={730} height={180} data={data.chartData.actionsPerOfficer}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" fontSize={10} />
            <YAxis fontSize={10} />
            <Bar dataKey="actions" fill="#1E8449" isAnimationActive={false} />
          </BarChart>
        </div>
      </div>

      <div className="mt-8 pt-4 border-t border-slate-300 text-center text-[10px] text-slate-500 font-mono">
        STRICTLY CONFIDENTIAL. DO NOT DISTRIBUTE. SAVIOUR AUTOMATED AUDIT SYSTEM.
      </div>

    </div>
  );
}

function StatBox({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="bg-slate-100 border border-slate-300 p-3 rounded text-center">
      <div className="text-xl font-bold text-emerald-900">{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-slate-600 font-bold mt-1">{label}</div>
    </div>
  );
}
