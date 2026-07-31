/* Parse every math expression in every question, solution and note with the
   real KaTeX, so LaTeX syntax errors are caught outside the browser. */
const fs = require('fs');
const P = 'C:/Users/yashk/Documents/pyq-portal/';

let katex;
try { katex = require('katex'); }
catch (e) { console.log('katex not installed — run:  npm i katex'); process.exit(2); }

global.window = {};
['data/syllabus.js','data/pyqs-math.js','data/pyqs-dsa.js','data/pyqs-oop.js','data/pyqs-dld.js','data/pyqs-eee.js',
 'data/solutions-math.js','data/solutions-dsa.js','data/solutions-oop.js','data/solutions-dld.js',
 'data/solutions-eee.js','data/solutions-eee2.js',
 'data/notes-math.js','data/notes-dsa.js','data/notes-oop.js','data/notes-dld.js','data/notes-eee.js']
  .forEach(f => eval(fs.readFileSync(P + f, 'utf8')));

const RE_CODE    = /```[\s\S]*?```/g;
const RE_DISPLAY = /\$\$((?:(?!\n[ \t]*\n)[\s\S])+?)\$\$/g;
const RE_INLINE  = /\$((?:[^$\n\\]|\\.)+?)\$/g;

let exprs = 0, errors = [];

function check(label, text) {
  if (!text) return;
  const found = [];
  let t = String(text).replace(RE_CODE, () => '@@C@@');
  t = t.replace(RE_DISPLAY, (m, inner) => { found.push([inner, true]);  return '@@S@@'; });
  t = t.replace(RE_INLINE,  (m, inner) => { found.push([inner, false]); return '@@S@@'; });
  found.forEach(([src, display]) => {
    exprs++;
    try { katex.renderToString(src, { displayMode: display, throwOnError: true, strict: false }); }
    catch (e) { errors.push({ label, src: src.slice(0, 80), msg: String(e.message).slice(0, 90) }); }
  });
}

Object.keys(window.PYQ_DATA).forEach(k =>
  window.PYQ_DATA[k].questions.forEach(q => check('Q ' + q.id, q.text)));

const seen = new Set();
Object.keys(window.SOLUTIONS).forEach(id => {
  const b = window.SOLUTIONS[id];
  if (seen.has(b)) return; seen.add(b);
  check('SOL ' + id, b);
});

Object.keys(window.NOTES).forEach(k =>
  Object.keys(window.NOTES[k]).forEach(m => check('NOTES ' + k + ' M' + m, window.NOTES[k][m])));

console.log('Math expressions parsed: ' + exprs);
console.log('KaTeX errors           : ' + errors.length);
errors.slice(0, 25).forEach(e =>
  console.log('  ' + e.label + '\n     ' + e.src + '\n     ' + e.msg));
