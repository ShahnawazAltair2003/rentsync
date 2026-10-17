import { Badge, Card, Err, api, fmt, today, useForm, useLive, useRun } from './lib.jsx';

export default function Amenities({ user }) {
  const owner = user.role === 'owner';
  const amen = useLive('/amenities') || [];
  const bookings = useLive('/bookings') || [];
  const props = useLive('/properties', owner) || [];
  const [a, bindA] = useForm({ propertyId: '', name: '', openTime: '06:00', closeTime: '22:00' });
  const [b, bindB] = useForm({ amenityId: '', date: today(), startTime: '10:00', endTime: '11:00' });
  const [aErr, runA] = useRun(), [bErr, runB] = useRun();
  const available = amen.filter((x) => x.availabilityStatus === 'Available');
  const amenityId = b.amenityId || available[0]?._id || '';
  const slots = useLive(`/amenities/${amenityId}/slots?date=${b.date}`, !!amenityId && !!b.date) || [];
  const pid = a.propertyId || props[0]?._id || '';
  const act = (id, action) => api(`/bookings/${id}/${action}`, 'POST').catch((e) => alert(e.message));
  const remove = (x) => window.confirm('Remove this amenity? Upcoming bookings for it will be cancelled.') && api('/amenities/' + x._id, 'DELETE').catch((e) => alert(e.message));
  return (
    <section className="space-y-4">
      {owner && (
        <Card>
          <h2 className="font-semibold mb-3">Add amenity to a property</h2>
          <div className="grid sm:grid-cols-5 gap-2 items-end">
            <div className="sm:col-span-2"><label className="text-xs text-slate-500">Property</label>
              <select className="inp" value={pid} onChange={bindA('propertyId').onChange}>{props.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}</select></div>
            <div><label className="text-xs text-slate-500">Amenity name</label><input className="inp" placeholder="e.g. Gym" {...bindA('name')} /></div>
            <div><label className="text-xs text-slate-500">Opens</label><input type="time" className="inp" {...bindA('openTime')} /></div>
            <div><label className="text-xs text-slate-500">Closes</label><input type="time" className="inp" {...bindA('closeTime')} /></div>
          </div>
          <p className="my-2"><Err>{aErr}</Err></p>
          <button className="btn" onClick={() => runA(() => api('/amenities', 'POST', { ...a, propertyId: pid }))}>Add amenity</button>
        </Card>
      )}
      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3">
        {amen.map((x) => (
          <Card key={x._id}>
            <b>{x.name}</b><div className="my-1"><Badge s={x.availabilityStatus} /></div>
            <p className="text-xs text-slate-500">{x.property?.name}<br />Open {x.openTime}–{x.closeTime}</p>
            {owner && (
              <div className="mt-2 flex gap-1">
                <button className="btn-s" onClick={() => api('/amenities/' + x._id, 'PATCH', { availabilityStatus: x.availabilityStatus === 'Available' ? 'Unavailable' : 'Available' })}>
                  Mark {x.availabilityStatus === 'Available' ? 'unavailable' : 'available'}</button>
                <button className="btn-s text-red-600" onClick={() => remove(x)}>Remove</button>
              </div>
            )}
          </Card>
        ))}
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="h-fit">
          <h2 className="font-semibold mb-3">Book an amenity</h2>
          <select className="inp mb-2" value={amenityId} onChange={bindB('amenityId').onChange}>{available.map((x) => <option key={x._id} value={x._id}>{x.name}</option>)}</select>
          <input type="date" className="inp mb-2" {...bindB('date')} />
          <div className="flex gap-2 mb-2"><input type="time" className="inp" {...bindB('startTime')} /><input type="time" className="inp" {...bindB('endTime')} /></div>
          <p className="text-xs text-slate-500 mb-2">{slots.length ? 'Already booked: ' + slots.map((s) => `${s.startTime}–${s.endTime}`).join(', ') : 'No bookings on this date yet.'}</p>
          <Err>{bErr}</Err>
          <button className="btn w-full" onClick={() => runB(() => api('/bookings', 'POST', { ...b, amenityId }))}>Book slot</button>
        </Card>
        <div className="md:col-span-2 space-y-3">
          {bookings.map((x) => (
            <Card key={x._id} className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <b>{x.amenity?.name || 'Removed amenity'}</b> <Badge s={x.status} />
                <p className="text-sm">{x.date} · {x.startTime}–{x.endTime} · {x.user?.name}</p>
                <p className="text-xs text-slate-500">Check-in: {fmt(x.checkInAt)} · Check-out: {fmt(x.checkOutAt)}</p>
              </div>
              <div className="flex gap-2">
                {x.status === 'Booked' && <><button className="btn-s" onClick={() => act(x._id, 'checkin')}>Check in</button><button className="btn-s" onClick={() => act(x._id, 'cancel')}>Cancel</button></>}
                {x.status === 'Checked-In' && <button className="btn-s" onClick={() => act(x._id, 'checkout')}>Check out</button>}
              </div>
            </Card>
          ))}
          {!bookings.length && <p className="text-slate-500">No bookings yet.</p>}
        </div>
      </div>
    </section>
  );
}
