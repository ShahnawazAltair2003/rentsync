// Adds "owner can add/remove amenities" to your RentSync project.
// Usage: copy this file into your project folder (next to package.json), then run:  node add-amenities-patch.js
const fs = require('fs');
const d = (x) => Buffer.from(x, 'base64').toString('utf8');
const jobs = [
 {
  "file": "routes.js",
  "marker": "cm91dGVyLnBvc3QoJy9hbWVuaXRpZXMn",
  "edits": [
   [
    "Ly8gVGltZSBzbG90cyBhbHJlYWR5IHRha2VuIGZvciBhbiBhbWVuaXR5IG9uIGEgZGF0ZSAobm8gcGVyc29uYWwgaW5mbyk=",
    "cm91dGVyLnBvc3QoJy9hbWVuaXRpZXMnLCBhdXRoKCdvd25lcicpLCB3cmFwKGFzeW5jIChyZXEsIHJlcykgPT4gewogIGNvbnN0IHsgcHJvcGVydHlJZCwgbmFtZSwgb3BlblRpbWUsIGNsb3NlVGltZSB9ID0gcmVxLmJvZHk7CiAgaWYgKCFwcm9wZXJ0eUlkIHx8ICFuYW1lKSByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ1Byb3BlcnR5IGFuZCBhbWVuaXR5IG5hbWUgYXJlIHJlcXVpcmVkJyB9KTsKICBjb25zdCBvcGVuID0gb3BlblRpbWUgfHwgJzA2OjAwJywgY2xvc2UgPSBjbG9zZVRpbWUgfHwgJzIyOjAwJzsKICBpZiAoIXRpbWVPayhvcGVuKSB8fCAhdGltZU9rKGNsb3NlKSB8fCBvcGVuID49IGNsb3NlKSByZXR1cm4gcmVzLnN0YXR1cyg0MDApLmpzb24oeyBlcnJvcjogJ0Nsb3NpbmcgdGltZSBtdXN0IGJlIGFmdGVyIG9wZW5pbmcgdGltZScgfSk7CiAgaWYgKCEoYXdhaXQgTS5Qcm9wZXJ0eS5leGlzdHMoeyBfaWQ6IHByb3BlcnR5SWQgfSkpKSByZXR1cm4gcmVzLnN0YXR1cyg0MDQpLmpzb24oeyBlcnJvcjogJ1Byb3BlcnR5IG5vdCBmb3VuZCcgfSk7CiAgaWYgKGF3YWl0IE0uQW1lbml0eS5maW5kT25lKHsgcHJvcGVydHk6IHByb3BlcnR5SWQsIG5hbWUgfSkpIHJldHVybiByZXMuc3RhdHVzKDQwOSkuanNvbih7IGVycm9yOiBgJHtuYW1lfSBhbHJlYWR5IGV4aXN0cyBhdCB0aGlzIHByb3BlcnR5YCB9KTsKICBjb25zdCBhID0gYXdhaXQgTS5BbWVuaXR5LmNyZWF0ZSh7IG5hbWUsIHByb3BlcnR5OiBwcm9wZXJ0eUlkLCBvcGVuVGltZTogb3BlbiwgY2xvc2VUaW1lOiBjbG9zZSB9KTsKICBlbWl0KHJlcSk7IHJlcy5zdGF0dXMoMjAxKS5qc29uKGEpOwp9KSk7Cgpyb3V0ZXIuZGVsZXRlKCcvYW1lbml0aWVzLzppZCcsIGF1dGgoJ293bmVyJyksIHdyYXAoYXN5bmMgKHJlcSwgcmVzKSA9PiB7CiAgY29uc3QgYSA9IGF3YWl0IE0uQW1lbml0eS5maW5kQnlJZChyZXEucGFyYW1zLmlkKTsKICBpZiAoIWEpIHJldHVybiByZXMuc3RhdHVzKDQwNCkuanNvbih7IGVycm9yOiAnQW1lbml0eSBub3QgZm91bmQnIH0pOwogIGF3YWl0IE0uQm9va2luZy51cGRhdGVNYW55KHsgYW1lbml0eTogYS5faWQsIHN0YXR1czogJ0Jvb2tlZCcgfSwgeyBzdGF0dXM6ICdDYW5jZWxsZWQnIH0pOwogIGF3YWl0IE0uQm9va2luZy51cGRhdGVNYW55KHsgYW1lbml0eTogYS5faWQsIHN0YXR1czogJ0NoZWNrZWQtSW4nIH0sIHsgc3RhdHVzOiAnQ2hlY2tlZC1PdXQnLCBjaGVja091dEF0OiBuZXcgRGF0ZSgpIH0pOwogIGF3YWl0IGEuZGVsZXRlT25lKCk7IGVtaXQocmVxKTsgcmVzLmpzb24oeyBvazogdHJ1ZSB9KTsKfSkpOwoKLy8gVGltZSBzbG90cyBhbHJlYWR5IHRha2VuIGZvciBhbiBhbWVuaXR5IG9uIGEgZGF0ZSAobm8gcGVyc29uYWwgaW5mbyk="
   ],
   [
    "eyAkcHJvamVjdDogeyBuYW1lOiB7ICRhcnJheUVsZW1BdDogWyckYS5uYW1lJywgMF0gfSwgbjogMSB9IH0sIHsgJHNvcnQ6IHsgbjogLTEgfSB9XSk7",
    "eyAkcHJvamVjdDogeyBuYW1lOiB7ICRhcnJheUVsZW1BdDogWyckYS5uYW1lJywgMF0gfSwgbjogMSB9IH0sIHsgJG1hdGNoOiB7IG5hbWU6IHsgJG5lOiBudWxsIH0gfSB9LCB7ICRzb3J0OiB7IG46IC0xIH0gfV0pOw=="
   ]
  ]
 },
 {
  "file": "public/index.html",
  "marker": "YXN5bmMgZnVuY3Rpb24gYWRkQW1lbml0eSgp",
  "edits": [
   [
    "PGRpdiBpZD0iYUxpc3QiIGNsYXNzPSJncmlkIHNtOmdyaWQtY29scy0yIG1kOmdyaWQtY29scy00IGdhcC0zIj48L2Rpdj4=",
    "PGRpdiBpZD0ib3duZXJBbWVuIiBjbGFzcz0iaGlkZGVuIGNhcmQiPgogICAgICAgIDxoMiBjbGFzcz0iZm9udC1zZW1pYm9sZCBtYi0zIj5BZGQgYW1lbml0eSB0byBhIHByb3BlcnR5PC9oMj4KICAgICAgICA8ZGl2IGNsYXNzPSJncmlkIHNtOmdyaWQtY29scy01IGdhcC0yIGl0ZW1zLWVuZCI+CiAgICAgICAgICA8ZGl2IGNsYXNzPSJzbTpjb2wtc3Bhbi0yIj48bGFiZWwgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS01MDAiPlByb3BlcnR5PC9sYWJlbD48c2VsZWN0IGlkPSJhUHJvcCIgY2xhc3M9ImlucCI+PC9zZWxlY3Q+PC9kaXY+CiAgICAgICAgICA8ZGl2PjxsYWJlbCBjbGFzcz0idGV4dC14cyB0ZXh0LXNsYXRlLTUwMCI+QW1lbml0eSBuYW1lPC9sYWJlbD48aW5wdXQgaWQ9ImFOYW1lIiBjbGFzcz0iaW5wIiBwbGFjZWhvbGRlcj0iZS5nLiBHeW0iPjwvZGl2PgogICAgICAgICAgPGRpdj48bGFiZWwgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS01MDAiPk9wZW5zPC9sYWJlbD48aW5wdXQgaWQ9ImFPcGVuIiB0eXBlPSJ0aW1lIiBjbGFzcz0iaW5wIiB2YWx1ZT0iMDY6MDAiPjwvZGl2PgogICAgICAgICAgPGRpdj48bGFiZWwgY2xhc3M9InRleHQteHMgdGV4dC1zbGF0ZS01MDAiPkNsb3NlczwvbGFiZWw+PGlucHV0IGlkPSJhQ2xvc2UiIHR5cGU9InRpbWUiIGNsYXNzPSJpbnAiIHZhbHVlPSIyMjowMCI+PC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICAgICAgPHAgaWQ9ImFFcnIiIGNsYXNzPSJ0ZXh0LXJlZC02MDAgdGV4dC1zbSBteS0yIj48L3A+CiAgICAgICAgPGJ1dHRvbiBjbGFzcz0iYnRuIiBvbmNsaWNrPSJhZGRBbWVuaXR5KCkiPkFkZCBhbWVuaXR5PC9idXR0b24+CiAgICAgIDwvZGl2PgogICAgICA8ZGl2IGlkPSJhTGlzdCIgY2xhc3M9ImdyaWQgc206Z3JpZC1jb2xzLTIgbWQ6Z3JpZC1jb2xzLTQgZ2FwLTMiPjwvZGl2Pg=="
   ],
   [
    "ICBpZiAodXNlci5yb2xlID09PSAnb3duZXInKSAkKCcjb3duZXJSZW50JykuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7",
    "ICBpZiAodXNlci5yb2xlID09PSAnb3duZXInKSAkKCcjb3duZXJSZW50JykuY2xhc3NMaXN0LnJlbW92ZSgnaGlkZGVuJyk7CiAgaWYgKHVzZXIucm9sZSA9PT0gJ293bmVyJykgJCgnI293bmVyQW1lbicpLmNsYXNzTGlzdC5yZW1vdmUoJ2hpZGRlbicpOw=="
   ],
   [
    "WycjbVByb3AnLCAnI3JQcm9wJywgJyNuUHJvcCddLmZvckVhY2goKGlkKSA9PiB7",
    "WycjbVByb3AnLCAnI3JQcm9wJywgJyNuUHJvcCcsICcjYVByb3AnXS5mb3JFYWNoKChpZCkgPT4gew=="
   ],
   [
    "TWFyayAke2EuYXZhaWxhYmlsaXR5U3RhdHVzID09PSAnQXZhaWxhYmxlJyA/ICd1bmF2YWlsYWJsZScgOiAnYXZhaWxhYmxlJ308L2J1dHRvbj5gIDogJyd9",
    "TWFyayAke2EuYXZhaWxhYmlsaXR5U3RhdHVzID09PSAnQXZhaWxhYmxlJyA/ICd1bmF2YWlsYWJsZScgOiAnYXZhaWxhYmxlJ308L2J1dHRvbj4gPGJ1dHRvbiBjbGFzcz0iYnRuLXMgbXQtMiB0ZXh0LXJlZC02MDAiIG9uY2xpY2s9InJlbW92ZUFtZW5pdHkoJyR7YS5faWR9JykiPlJlbW92ZTwvYnV0dG9uPmAgOiAnJ30="
   ],
   [
    "YXN5bmMgZnVuY3Rpb24gc2V0QW1lbml0eShpZCwgYXZhaWxhYmlsaXR5U3RhdHVzKQ==",
    "YXN5bmMgZnVuY3Rpb24gYWRkQW1lbml0eSgpIHsKICB0cnkgewogICAgYXdhaXQgYXBpKCcvYW1lbml0aWVzJywgeyBtZXRob2Q6ICdQT1NUJywgYm9keTogeyBwcm9wZXJ0eUlkOiAkKCcjYVByb3AnKS52YWx1ZSwgbmFtZTogJCgnI2FOYW1lJykudmFsdWUsIG9wZW5UaW1lOiAkKCcjYU9wZW4nKS52YWx1ZSwgY2xvc2VUaW1lOiAkKCcjYUNsb3NlJykudmFsdWUgfSB9KTsKICAgICQoJyNhTmFtZScpLnZhbHVlID0gJCgnI2FFcnInKS50ZXh0Q29udGVudCA9ICcnOwogIH0gY2F0Y2ggKGUpIHsgJCgnI2FFcnInKS50ZXh0Q29udGVudCA9IGUubWVzc2FnZTsgfQp9CmFzeW5jIGZ1bmN0aW9uIHJlbW92ZUFtZW5pdHkoaWQpIHsKICBpZiAoY29uZmlybSgnUmVtb3ZlIHRoaXMgYW1lbml0eT8gVXBjb21pbmcgYm9va2luZ3MgZm9yIGl0IHdpbGwgYmUgY2FuY2VsbGVkLicpKSB0cnkgeyBhd2FpdCBhcGkoJy9hbWVuaXRpZXMvJyArIGlkLCB7IG1ldGhvZDogJ0RFTEVURScgfSk7IH0gY2F0Y2ggKGUpIHsgYWxlcnQoZS5tZXNzYWdlKTsgfQp9CmFzeW5jIGZ1bmN0aW9uIHNldEFtZW5pdHkoaWQsIGF2YWlsYWJpbGl0eVN0YXR1cyk="
   ],
   [
    "JHtlc2MoYi5hbWVuaXR5Py5uYW1lKX08L2I+",
    "JHtlc2MoYi5hbWVuaXR5Py5uYW1lIHx8ICdSZW1vdmVkIGFtZW5pdHknKX08L2I+"
   ]
  ]
 }
];
const out = {};
for (const j of jobs) {
  if (!fs.existsSync(j.file)) { console.error('❌ Cannot find ' + j.file + '. Run this from your project folder (the one with package.json).'); process.exit(1); }
  let s = fs.readFileSync(j.file, 'utf8');
  if (s.includes(d(j.marker))) { console.log('ℹ️  ' + j.file + ' is already updated'); continue; }
  for (const [o, n] of j.edits) {
    const old = d(o), c = s.split(old).length - 1;
    if (c !== 1) { console.error('❌ Could not update ' + j.file + ': expected 1 match but found ' + c + ' for:\n   ' + old.slice(0, 90) + '\nNo files were changed. Send me this message and I will help.'); process.exit(1); }
    s = s.replace(old, () => d(n));
  }
  out[j.file] = s;
}
fs.mkdirSync('backup-before-amenities', { recursive: true });
for (const [f, s] of Object.entries(out)) {
  fs.copyFileSync(f, 'backup-before-amenities/' + f.replace(/\//g, '_'));
  fs.writeFileSync(f, s);
  console.log('✅ Updated ' + f);
}
console.log(Object.keys(out).length ? '\nDone. Restart the server (npm start) and hard-refresh the browser (Ctrl+Shift+R).' : '\nNothing to do.');
