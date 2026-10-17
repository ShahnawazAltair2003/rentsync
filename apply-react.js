// Switches your RentSync project to the React frontend in ./client
// Usage: unzip into your project folder (next to package.json), then run:  node apply-react.js
const fs = require('fs');
const die = (m) => { console.error('❌ ' + m); process.exit(1); };
if (!fs.existsSync('server.js') || !fs.existsSync('package.json')) die('Run this from your project folder (the one with package.json).');
if (!fs.existsSync('client/package.json')) die('The client folder is missing. Unzip the file into your project folder first.');

let s = fs.readFileSync('server.js', 'utf8');
const old = "app.use(express.static(path.join(__dirname, 'public')));";
if (s.includes("'client', 'dist'")) console.log('ℹ️  server.js already updated');
else {
  if (!s.includes(old)) die('Could not find the static-files line in server.js. Send me your server.js and I will adjust.');
  fs.mkdirSync('backup-before-react', { recursive: true });
  fs.copyFileSync('server.js', 'backup-before-react/server.js');
  s = s.replace(old, () => "// Serve the React build when it exists, otherwise the original page in /public\nconst dist = path.join(__dirname, 'client', 'dist');\napp.use(express.static(require('fs').existsSync(dist) ? dist : path.join(__dirname, 'public')));");
  fs.writeFileSync('server.js', s);
  console.log('✅ server.js updated');
}
const p = JSON.parse(fs.readFileSync('package.json', 'utf8'));
p.scripts = p.scripts || {};
p.scripts.build = 'npm --prefix client install --include=dev && npm --prefix client run build';
p.scripts['dev:client'] = 'npm --prefix client run dev';
fs.writeFileSync('package.json', JSON.stringify(p, null, 2) + '\n');
let g = fs.existsSync('.gitignore') ? fs.readFileSync('.gitignore', 'utf8') : '';
for (const line of ['client/dist', 'backup-before-react']) if (!g.includes(line)) g = g.trimEnd() + '\n' + line + '\n';
fs.writeFileSync('.gitignore', g);
console.log('✅ package.json and .gitignore updated\n\nNext: npm run build   then   npm start   (open http://localhost:3000)');
