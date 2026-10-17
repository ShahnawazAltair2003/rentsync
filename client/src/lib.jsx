import { useCallback, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

export const socket = io(); // one shared real-time connection
export const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
export const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');
export const today = () => new Date().toLocaleDateString('en-CA');

export async function api(path, method = 'GET', body) {
  const r = await fetch('/api' + path, {
    method, body: body ? JSON.stringify(body) : undefined,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (localStorage.token || '') }
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401 && localStorage.token) { localStorage.clear(); location.reload(); }
    throw new Error(d.error || 'Something went wrong');
  }
  return d;
}

// Loads `path`, and reloads it whenever the server announces a change (real-time)
export function useLive(path, enabled = true) {
  const [data, setData] = useState(null);
  const load = useCallback(() => { if (enabled) api(path).then(setData).catch(console.error); }, [path, enabled]);
  useEffect(() => { load(); socket.on('update', load); return () => socket.off('update', load); }, [load]);
  return data;
}

export function useConnected() {
  const [on, setOn] = useState(socket.connected);
  useEffect(() => {
    const up = () => setOn(true), down = () => setOn(false);
    socket.on('connect', up); socket.on('disconnect', down);
    return () => { socket.off('connect', up); socket.off('disconnect', down); };
  }, []);
  return on;
}

// run(fn): executes an action and keeps its error message for display
export function useRun() {
  const [err, setErr] = useState('');
  const run = async (fn) => { try { await fn(); setErr(''); return true; } catch (e) { setErr(e.message); return false; } };
  return [err, run];
}

export function useForm(init) {
  const [f, setF] = useState(init);
  const bind = (k) => ({ value: f[k], onChange: (e) => setF((x) => ({ ...x, [k]: e.target.value })) });
  return [f, bind, setF];
}

const colors = {
  Pending: 'bg-amber-100 text-amber-800', 'In Progress': 'bg-blue-100 text-blue-800', Completed: 'bg-green-100 text-green-800',
  Booked: 'bg-indigo-100 text-indigo-800', 'Checked-In': 'bg-blue-100 text-blue-800', 'Checked-Out': 'bg-green-100 text-green-800',
  Cancelled: 'bg-slate-200 text-slate-600', Available: 'bg-green-100 text-green-800', Unavailable: 'bg-red-100 text-red-800',
  Active: 'bg-green-100 text-green-800', Ended: 'bg-slate-200 text-slate-600'
};
export const Badge = ({ s }) => <span className={`text-xs px-2 py-0.5 rounded-full ${colors[s] || ''}`}>{s}</span>;
export const Err = ({ children }) => (children ? <p className="text-red-600 text-sm mb-2">{children}</p> : null);
export const Card = ({ className = '', ...p }) => <div className={`card ${className}`} {...p} />;
