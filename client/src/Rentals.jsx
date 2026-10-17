import { Badge, Card, Err, api, money, today, useForm, useLive, useRun } from './lib.jsx';

const Opts = ({ list, label }) => list.map((x) => <option key={x._id} value={x._id}>{label(x)}</option>);

function OwnerForms({ props, tenants, vacant }) {
  const [p, bindP] = useForm({ name: '', address: '' });
  const [u, bindU] = useForm({ propertyId: '', name: '', rentAmount: '' });
  const [r, bindR, setR] = useForm({ propertyId: '', tenantId: '', unit: '', rentAmount: '', startDate: today(), endDate: '' });
  const [pErr, runP] = useRun(), [uErr, runU] = useRun(), [rErr, runR] = useRun();
  const upid = u.propertyId || props[0]?._id || '';
  const rpid = r.propertyId || props[0]?._id || '';
  const opts = vacant.filter((x) => x.property?._id === rpid);
  const unit = opts.find((x) => x.name === r.unit) || opts[0];
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Card className="h-fit">
        <h2 className="font-semibold mb-3">Add property</h2>
        <input className="inp mb-2" placeholder="Property name" {...bindP('name')} />
        <input className="inp mb-2" placeholder="Address" {...bindP('address')} />
        <Err>{pErr}</Err>
        <button className="btn w-full" onClick={() => runP(() => api('/properties', 'POST', p))}>Add property</button>
      </Card>
      <Card className="h-fit">
        <h2 className="font-semibold mb-3">Add rentable unit</h2>
        <select className="inp mb-2" value={upid} onChange={bindU('propertyId').onChange}><Opts list={props} label={(x) => x.name} /></select>
        <div className="flex gap-2 mb-2"><input className="inp" placeholder="Unit (e.g. A-102)" {...bindU('name')} /><input type="number" min="1" className="inp" placeholder="Rent ₹/month" {...bindU('rentAmount')} /></div>
        <Err>{uErr}</Err>
        <button className="btn w-full" onClick={() => runU(() => api('/units', 'POST', { ...u, propertyId: upid, rentAmount: Number(u.rentAmount) }))}>Add unit</button>
      </Card>
      <Card>
        <h2 className="font-semibold mb-3">Create rental (assign tenant)</h2>
        <select className="inp mb-2" value={rpid} onChange={(e) => setR((x) => ({ ...x, propertyId: e.target.value, unit: '', rentAmount: '' }))}><Opts list={props} label={(x) => x.name} /></select>
        <select className="inp mb-2" value={r.tenantId || tenants[0]?._id || ''} onChange={bindR('tenantId').onChange}><Opts list={tenants} label={(x) => `${x.name} (${x.email})`} /></select>
        <select className="inp mb-2" value={unit?.name || ''} onChange={bindR('unit').onChange}>
          {opts.length ? opts.map((x) => <option key={x._id} value={x.name}>{x.name} – {money(x.rentAmount)}</option>) : <option value="">No vacant units</option>}
        </select>
        <input type="number" min="1" className="inp mb-2" placeholder={unit ? `Monthly rent ₹ (default ${unit.rentAmount})` : 'Monthly rent ₹'} {...bindR('rentAmount')} />
        <div className="flex gap-2 mb-2"><input type="date" className="inp" title="Start date" {...bindR('startDate')} /><input type="date" className="inp" title="End date (optional)" {...bindR('endDate')} /></div>
        <Err>{rErr}</Err>
        <button className="btn w-full" onClick={() => runR(() => api('/rentals', 'POST', {
          propertyId: rpid, tenantId: r.tenantId || tenants[0]?._id, unit: unit?.name, rentAmount: Number(r.rentAmount) || unit?.rentAmount,
          startDate: r.startDate, endDate: r.endDate || undefined }))}>Create rental</button>
      </Card>
    </div>
  );
}

export function Rentals({ user }) {
  const owner = user.role === 'owner';
  const vacant = useLive('/units/available') || [];
  const rentals = useLive('/rentals') || [];
  const props = useLive('/properties', owner) || [];
  const users = useLive('/users', owner) || [];
  const alertErr = (e) => alert(e.message);
  return (
    <section className="space-y-4">
      {owner && <OwnerForms props={props} tenants={users.filter((x) => x.role === 'tenant')} vacant={vacant} />}
      <h2 className="font-semibold">Available to rent</h2>
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
        {vacant.map((x) => (
          <Card key={x._id}>
            <b>{x.property?.name}</b><p className="text-xs text-slate-500">{x.property?.address}</p>
            <p className="mt-2 text-sm">Unit <b>{x.name}</b></p>
            <p className="text-lg font-semibold text-indigo-600">{money(x.rentAmount)}<span className="text-xs text-slate-400"> /month</span></p>
            {owner && <button className="btn-s mt-2 text-red-600" onClick={() => window.confirm('Remove this unit?') && api('/units/' + x._id, 'DELETE').catch(alertErr)}>Remove unit</button>}
          </Card>
        ))}
        {!vacant.length && <p className="text-slate-500">No vacant units right now.</p>}
      </div>
      <h2 className="font-semibold">{user.role === 'tenant' ? 'My rentals' : 'All rentals'}</h2>
      <div className="space-y-3">
        {rentals.map((x) => (
          <Card key={x._id} className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <b>{x.property?.name} · {x.unit}</b> <Badge s={x.status} />
              <p className="text-sm">{x.tenant?.name || 'Removed user'} · {money(x.rentAmount)}/month</p>
              <p className="text-xs text-slate-500">{x.startDate} → {x.endDate || 'open-ended'}</p>
            </div>
            {owner && x.status === 'Active' && <button className="btn-s" onClick={() => window.confirm('End this rental?') && api(`/rentals/${x._id}/end`, 'POST').catch(alertErr)}>End rental</button>}
          </Card>
        ))}
        {!rentals.length && <p className="text-slate-500">No rentals yet.</p>}
      </div>
    </section>
  );
}

export function Users() {
  const users = useLive('/users') || [];
  const [f, bind] = useForm({ name: '', email: '', password: '', role: 'tenant' });
  const [err, run] = useRun();
  const remove = (u) => window.confirm(`Remove ${u.name}? Their active rentals will end and upcoming bookings will be cancelled.`) && api('/users/' + u._id, 'DELETE').catch((e) => alert(e.message));
  return (
    <section className="grid md:grid-cols-3 gap-4">
      <Card className="h-fit">
        <h2 className="font-semibold mb-3">Add staff or tenant</h2>
        <input className="inp mb-2" placeholder="Full name" {...bind('name')} />
        <input className="inp mb-2" type="email" placeholder="Email" {...bind('email')} />
        <input className="inp mb-2" type="password" placeholder="Temporary password (6+ chars)" {...bind('password')} />
        <select className="inp mb-2" {...bind('role')}><option value="tenant">Tenant</option><option value="staff">Staff</option></select>
        <Err>{err}</Err>
        <button className="btn w-full" onClick={() => run(() => api('/users', 'POST', f))}>Add user</button>
      </Card>
      <div className="md:col-span-2 space-y-3">
        {users.map((u) => (
          <Card key={u._id} className="flex items-center justify-between gap-2">
            <div><b>{u.name}</b> <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 capitalize">{u.role}</span><p className="text-sm text-slate-500">{u.email}</p></div>
            <button className="btn-s text-red-600" onClick={() => remove(u)}>Remove</button>
          </Card>
        ))}
        {!users.length && <p className="text-slate-500">No staff or tenants yet.</p>}
      </div>
    </section>
  );
}
