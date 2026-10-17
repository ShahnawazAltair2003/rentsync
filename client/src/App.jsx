import { useState } from 'react';
import { Public, Auth } from './Public.jsx';
import Amenities from './Amenities.jsx';
import { Rentals, Users } from './Rentals.jsx';
import { Badge, Card, Err, api, fmt, money, useConnected, useForm, useLive, useRun } from './lib.jsx';

const Stat = ({ label, v, sub }) => (
  <Card><div className="text-sm text-slate-500">{label}</div><div className="text-3xl font-bold">{v}</div><div className="text-xs text-slate-400">{sub}</div></Card>
);

function Dashboard({ user, go }) {
  const tenant = user.role === 'tenant';
  const d = useLive('/dashboard');
  const rentals = useLive('/rentals', tenant);
  if (!d) return <p className="text-slate-500">Loading…</p>;
  const m = d.maintenance, mine = (rentals || []).filter((r) => r.status === 'Active');
  const max = Math.max(1, ...d.usage.map((u) => u.n));
  return (
    <>
      {tenant && (mine.length ? (
        <>
          <h2 className="font-semibold mb-2">My rented property</h2>
          <div className="grid md:grid-cols-2 gap-3 mb-6">
            {mine.map((r) => (
              <Card key={r._id} className="border-l-4 border-indigo-500">
                <div className="text-lg font-bold">{r.property?.name}</div>
                <p className="text-sm text-slate-500">{r.property?.address}</p>
                <p className="mt-2 text-sm"><b>Unit {r.unit}</b> · {money(r.rentAmount)}/month</p>
                <p className="text-xs text-slate-500">Lease: {r.startDate} → {r.endDate || 'open-ended'}</p>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card className="mb-6">
          <h2 className="font-semibold">My rented property</h2>
          <p className="text-sm text-slate-500 mt-1">You don't have an active rental yet.</p>
          <button className="btn mt-3" onClick={() => go('rentals')}>Browse available properties</button>
        </Card>
      ))}
      {!tenant && (
        <>
          <h2 className="font-semibold mb-2">Rental overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"><Stat label="Active rentals" v={d.activeRentals} /><Stat label="Monthly rent roll" v={money(d.monthlyRent)} /></div>
        </>
      )}
      <h2 className="font-semibold mb-2">Maintenance overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <Stat label="Pending" v={m.Pending} /><Stat label="In progress" v={m['In Progress']} /><Stat label="Completed" v={m.Completed} />
        <Stat label="Completion rate" v={d.completionRate + '%'} sub="Target ≥ 90%" />
        <Stat label="Avg resolution" v={d.avgResolutionHours + ' h'} sub="Target ≤ 48 h" />
      </div>
      <h2 className="font-semibold mb-2">Amenity usage overview</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
        <Stat label="Amenities available" v={`${d.amenitiesAvailable}/${d.amenitiesTotal}`} /><Stat label="Bookings today" v={d.bookingsToday} /><Stat label="In use now" v={d.inUseNow} />
      </div>
      <Card>
        <h3 className="text-sm font-medium mb-2">Total bookings by amenity</h3>
        {d.usage.length ? d.usage.map((u) => (
          <div key={u.name} className="flex items-center gap-2 text-sm mb-1"><span className="w-32">{u.name}</span><div className="bg-indigo-500 h-3 rounded" style={{ width: `${(u.n / max) * 100}%` }} /><span>{u.n}</span></div>
        )) : <p className="text-sm text-slate-400">No bookings yet</p>}
      </Card>
    </>
  );
}

function Maintenance({ user }) {
  const list = useLive('/maintenance') || [];
  const props = useLive('/properties') || [];
  const [f, bind, setF] = useForm({ propertyId: '', title: '', description: '', priority: 'Medium' });
  const [err, run] = useRun();
  const pid = f.propertyId || props[0]?._id || '';
  const submit = () => run(async () => { await api('/maintenance', 'POST', { ...f, propertyId: pid }); setF((x) => ({ ...x, title: '', description: '' })); });
  return (
    <section className="grid md:grid-cols-3 gap-4">
      <Card className="h-fit">
        <h2 className="font-semibold mb-3">New maintenance request</h2>
        <select className="inp mb-2" value={pid} onChange={bind('propertyId').onChange}>
          {props.length ? props.map((p) => <option key={p._id} value={p._id}>{p.name}</option>) : <option value="">No property assigned yet</option>}
        </select>
        <input className="inp mb-2" placeholder="Issue title" {...bind('title')} />
        <textarea className="inp mb-2" rows={3} placeholder="Describe the issue" {...bind('description')} />
        <select className="inp mb-2" {...bind('priority')}><option>Low</option><option>Medium</option><option>High</option></select>
        <Err>{err}</Err>
        <button className="btn w-full" onClick={submit}>Submit request</button>
      </Card>
      <div className="md:col-span-2 space-y-3">
        {list.map((r) => (
          <Card key={r._id}>
            <div className="flex justify-between gap-2"><b>{r.title}</b><Badge s={r.status} /></div>
            <p className="text-sm mt-1">{r.description}</p>
            <p className="text-xs text-slate-500 mt-2">{r.property?.name} · by {r.createdBy?.name} · {r.priority} priority<br />Created {fmt(r.createdAt)} · Resolved {fmt(r.resolutionDate)}</p>
            {user.role !== 'tenant' && (
              <select className="inp mt-2 !w-auto" value={r.status} onChange={(e) => api(`/maintenance/${r._id}/status`, 'PATCH', { status: e.target.value }).catch((x) => alert(x.message))}>
                {['Pending', 'In Progress', 'Completed'].map((s) => <option key={s}>{s}</option>)}
              </select>
            )}
          </Card>
        ))}
        {!list.length && <p className="text-slate-500">No maintenance requests yet.</p>}
      </div>
    </section>
  );
}

function Shell({ user }) {
  const tabs = ['dashboard', 'maintenance', 'amenities', 'rentals', ...(user.role === 'owner' ? ['users'] : [])];
  const [tab, setTab] = useState('dashboard');
  const live = useConnected();
  return (
    <div>
      <header className="bg-white shadow px-4 py-3 flex flex-wrap items-center gap-3">
        <b className="text-lg">🏠 RentSync</b>
        <nav className="flex gap-1 text-sm">
          {tabs.map((t) => <button key={t} className={`px-3 py-1 rounded hover:bg-slate-100 capitalize ${tab === t ? 'font-semibold bg-slate-100' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
        </nav>
        <div className="ml-auto text-sm flex items-center gap-2">
          <span title="Real-time connection" className={`w-2 h-2 rounded-full ${live ? 'bg-green-500' : 'bg-red-500'}`} />
          <span>{user.name} ({user.role})</span>
          <button className="underline" onClick={() => { localStorage.clear(); location.reload(); }}>Logout</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        {tab === 'dashboard' && <Dashboard user={user} go={setTab} />}
        {tab === 'maintenance' && <Maintenance user={user} />}
        {tab === 'amenities' && <Amenities user={user} />}
        {tab === 'rentals' && <Rentals user={user} />}
        {tab === 'users' && <Users />}
      </main>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.user || 'null'));
  const [login, setLogin] = useState(false);
  if (user && localStorage.token) return <Shell user={user} />;
  return login ? <Auth onDone={setUser} onBack={() => setLogin(false)} /> : <Public onLogin={() => setLogin(true)} />;
}
