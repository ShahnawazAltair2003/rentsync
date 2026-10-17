import { useEffect, useRef, useState } from 'react';
import { api, money, useLive, useRun, useForm, Err, Card } from './lib.jsx';
import { CONTACT } from './contact.js';

const blank = (v) => v || '____________';
const mailSubject = (p = {}) => `Rental enquiry – ${blank(p.property)}`;
const mailBody = (p = {}) => `Hello,

I would like to enquire about renting a property.

Property: ${blank(p.property)}
Unit: ${blank(p.unit)}
Monthly rent: ₹ ${blank(p.rent)}
Preferred move-in date: ____________
Lease duration (months): ____________
Number of occupants: ____________

My details
Name: ____________
Phone: ____________
Email: ____________

Please let me know the next steps and when I can visit the property.

Thank you,
____________`;

function UnitCard({ u, onEnquire }) {
  return (
    <Card>
      <b>{u.property}</b>
      <p className="text-xs text-slate-500">{u.address}</p>
      <p className="mt-2 text-sm">Unit <b>{u.unit}</b></p>
      <p className="text-lg font-semibold text-indigo-600">{money(u.rentAmount)}<span className="text-xs text-slate-400"> /month</span></p>
      <button data-enquire className="btn-s mt-2" onClick={() => onEnquire(u)}>Enquire about this unit</button>
    </Card>
  );
}

function ContactMenu({ open, setOpen, mail, setMail }) {
  const ref = useRef();
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const h = (e) => { if (!ref.current?.contains(e.target) && !e.target.closest('[data-enquire]')) setOpen(false); };
    document.addEventListener('click', h);
    return () => document.removeEventListener('click', h);
  }, [setOpen]);
  const href = `mailto:${CONTACT.email}?subject=${encodeURIComponent(mail.subject)}&body=${encodeURIComponent(mail.body)}`;
  const copy = async () => {
    await navigator.clipboard?.writeText(`Subject: ${mail.subject}\n\n${mail.body}`);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div ref={ref} className="relative">
      <button className="btn-s !text-sm !px-3 !py-2" onClick={() => setOpen(!open)}>Contact ▾</button>
      {open && (
        <div className="absolute right-0 mt-2 w-96 max-w-[92vw] z-30 bg-white rounded-xl shadow-lg border border-slate-200 p-4 text-left">
          <h3 className="font-semibold mb-2">Contact me</h3>
          <p className="text-sm">📧 <a className="text-indigo-600 underline" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a></p>
          <p className="text-sm mb-3">📞 <a className="text-indigo-600 underline" href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>{CONTACT.phone}</a></p>
          <p className="text-xs font-medium text-slate-500 mb-1">Suggested email — fill in the blanks (____)</p>
          <input className="inp mb-2" value={mail.subject} onChange={(e) => setMail({ ...mail, subject: e.target.value })} />
          <textarea rows={15} className="inp mb-2 font-mono text-xs" value={mail.body} onChange={(e) => setMail({ ...mail, body: e.target.value })} />
          <div className="flex gap-2">
            <a className="btn flex-1 text-center" href={href}>Open in email app</a>
            <button className="btn-s" onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Public({ onLogin }) {
  const [tab, setTab] = useState('home');
  const [open, setOpen] = useState(false);
  const [mail, setMail] = useState({ subject: mailSubject(), body: mailBody() });
  const units = useLive('/public/units') || [];
  const enquire = (u) => {
    setMail({ subject: mailSubject({ property: u.property }), body: mailBody({ property: u.property, unit: u.unit, rent: u.rentAmount.toLocaleString('en-IN') }) });
    setOpen(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const cards = (list) => list.length
    ? list.map((u) => <UnitCard key={u.property + u.unit} u={u} onEnquire={enquire} />)
    : <p className="text-slate-500">No vacant units right now — contact us to be notified.</p>;
  const features = [['🔧 Live maintenance tracking', 'Report an issue and watch it move from Pending to Completed.'],
    ['📅 Conflict-free amenity booking', 'Gym, pool or hall — no double bookings, with check-in and check-out.'],
    ['🤝 Transparent communication', 'Tenants, staff and owners see the same up-to-date status.']];
  return (
    <div>
      <header className="bg-white shadow px-4 py-3 flex flex-wrap items-center gap-3">
        <b className="text-lg">🏠 RentSync</b>
        <nav className="flex gap-1 text-sm">
          {['home', 'rentals'].map((t) => <button key={t} className={`px-3 py-1 rounded hover:bg-slate-100 capitalize ${tab === t ? 'font-semibold' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ContactMenu open={open} setOpen={setOpen} mail={mail} setMail={setMail} />
          <button className="btn" onClick={onLogin}>Login</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto p-4">
        {tab === 'home' ? (
          <>
            <div className="rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-8 md:p-12 my-4">
              <h1 className="text-3xl md:text-4xl font-bold">Find your next home</h1>
              <p className="mt-2 text-indigo-100 max-w-xl">Browse available rentals, report maintenance issues and book amenities — all in one place, updated in real time.</p>
              <p className="mt-4 text-lg"><b>{units.length}</b> homes available right now</p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button className="bg-white text-indigo-700 rounded px-4 py-2 text-sm font-medium" onClick={() => setTab('rentals')}>View available rentals</button>
                <button className="border border-white rounded px-4 py-2 text-sm" onClick={onLogin}>Login / Register</button>
              </div>
            </div>
            <h2 className="font-semibold mb-2">Latest available</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3 mb-6">{cards(units.slice(0, 3))}</div>
            <div className="grid md:grid-cols-3 gap-3">{features.map(([t, d]) => <Card key={t}><b>{t}</b><p className="text-sm text-slate-500 mt-1">{d}</p></Card>)}</div>
          </>
        ) : (
          <>
            <h2 className="font-semibold mb-2">Available to rent</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">{cards(units)}</div>
          </>
        )}
      </main>
    </div>
  );
}

export function Auth({ onDone, onBack }) {
  const [mode, setMode] = useState('login');
  const [f, bind] = useForm({ name: '', email: '', password: '' });
  const [err, run] = useRun();
  const login = mode === 'login';
  const submit = () => run(async () => {
    const d = await api('/auth/' + mode, 'POST', f);
    localStorage.token = d.token; localStorage.user = JSON.stringify(d.user); onDone(d.user);
  });
  return (
    <div className="max-w-sm mx-auto mt-16 card p-6" onKeyDown={(e) => e.key === 'Enter' && submit()}>
      <h1 className="text-2xl font-bold">🏠 RentSync</h1>
      <p className="text-sm text-slate-500 mb-4">{login ? 'Sign in' : 'Create tenant account'}</p>
      {!login && <input className="inp mb-3" placeholder="Full name" {...bind('name')} />}
      <input className="inp mb-3" type="email" placeholder="Email" {...bind('email')} />
      <input className="inp mb-3" type="password" placeholder="Password" {...bind('password')} />
      <Err>{err}</Err>
      <button className="btn w-full" onClick={submit}>{login ? 'Sign in' : 'Register'}</button>
      <button className="text-sm text-indigo-600 mt-3 underline" onClick={() => setMode(login ? 'register' : 'login')}>{login ? 'New tenant? Create account' : 'Have an account? Sign in'}</button>
      <button className="text-sm text-slate-500 underline mt-3 block" onClick={onBack}>← Back to home</button>
    </div>
  );
}
