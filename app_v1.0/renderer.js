/* renderer.js – receita, despesa (multi-coluna) e diferença */

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { Chart, registerables } = require('chart.js');
Chart.register(...registerables);

let chart = null;

/* ---------- util ---------- */
const slug = s => String(s ?? '')
  .trim()
  .toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]/g, '');

function parseMoney(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;
  let s = String(v).replace(/[^0-9.,-]/g, '');
  if (!s) return 0;
  const dec = Math.max(s.lastIndexOf(','), s.lastIndexOf('.'));
  s = dec !== -1
      ? s.slice(0, dec).replace(/[.,]/g, '') + '.' + s.slice(dec + 1).replace(/[.,]/g, '')
      : s.replace(/[.,]/g, '');
  return parseFloat(s) || 0;
}

function parseDate(v) {
  if (v instanceof Date) return v;
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v);
    return new Date(d.y, d.m - 1, d.d);
  }
  const pt = { jan:0, fev:1, mar:2, abr:3, mai:4, jun:5, jul:6, ago:7, set:8, out:9, nov:10, dez:11 };
  let m = String(v).match(/(\\d{1,2})[\\/-]([a-z]{3})/i);
  if (m) return new Date(new Date().getFullYear(), pt[m[2].toLowerCase()], +m[1]);
  m = String(v).match(/(\\d{1,2})[\\/-](\\d{1,2})[\\/-](\\d{2,4})/);
  if (m) { let [, d, mo, y] = m.map(Number); if (y < 100) y += 2000; return new Date(y, mo - 1, d); }
  return new Date(NaN);
}
const weekOfMonth = d => Math.ceil((d.getDate() + new Date(d.getFullYear(), d.getMonth(), 1).getDay()) / 7);

/* ---------- localizar planilha ---------- */
function findXlsx() {
  const desks = [
    path.join(os.homedir(), 'OneDrive', 'Área de Trabalho'),
    path.join(os.homedir(), 'Desktop')
  ];
  for (const d of desks) {
    if (!fs.existsSync(d)) continue;
    const f = fs.readdirSync(d).find(f => f.toLowerCase().startsWith('planilha') && f.toLowerCase().endsWith('.xlsx'));
    if (f) return path.join(d, f);
  }
  return null;
}

/* ---------- tema & navegação ---------- */
function setupTheme() {
  const t = document.getElementById('themeToggle');
  const lbl = document.getElementById('themeLabel');
  t.checked = localStorage.getItem('theme') === 'dark';
  apply(t.checked);
  t.onchange = () => { apply(t.checked); localStorage.setItem('theme', t.checked ? 'dark' : 'light'); };
  function apply(dark) {
    document.body.classList.toggle('dark', dark);
    lbl.textContent = dark ? 'Tema Escuro' : 'Tema Claro';
  }
}
function setupNav() {
  const linkDash = document.getElementById('nav-dashboard');
  const linkSet  = document.getElementById('nav-settings');
  const pageDash = document.getElementById('page-dashboard');
  const pageSet  = document.getElementById('page-settings');
  function show(dash) {
    linkDash.classList.toggle('active', dash);
    linkSet .classList.toggle('active', !dash);
    pageDash.classList.toggle('visible', dash);
    pageSet .classList.toggle('visible', !dash);
    if (dash) loadDashboard();
  }
  linkDash.onclick = e => { e.preventDefault(); show(true);  };
  linkSet .onclick = e => { e.preventDefault(); show(false); };
}

/* ---------- DASHBOARD ---------- */
function loadDashboard() {
  const file = findXlsx();
  if (!file) { renderCards(0, 0); renderChart({}); return; }

  const wb = XLSX.readFile(file, { cellDates: true });
  const fatSheets  = wb.SheetNames.filter(n => slug(n).startsWith('fatmarumbi'));
  const despSheets = wb.SheetNames.filter(n => slug(n).startsWith('despmarumbi'));

  let totalFat = 0;
  let totalDesp = 0;
  const weekly = {};

  /* ====== RECEITA ====== */
  for (const name of fatSheets) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: '' });
    const headRow = rows.findIndex(r => r.map(slug).includes('dinheiro'));
    if (headRow === -1) continue;

    const header = rows[headRow].map(slug);
    const idx = h => header.indexOf(h);
    const hasTotal = idx('total') !== -1;
    const col = { d: idx('data'), t: idx('total'), din: idx('dinheiro'), deb: idx('debito'), cre: idx('credito'), pix: idx('pix'), vou: idx('voucher') };

    for (let i = headRow + 1; i < rows.length; i++) {
      const r = rows[i]; if (!r || r.every(c => c === '')) continue;
      const date = parseDate(r[col.d]); if (isNaN(date)) continue;

      const val = hasTotal
        ? parseMoney(r[col.t])
        : parseMoney(r[col.din]) + parseMoney(r[col.deb]) + parseMoney(r[col.cre]) +
          parseMoney(r[col.pix]) + parseMoney(r[col.vou]);

      totalFat += val;
      const w = weekOfMonth(date);
      weekly[w] = (weekly[w] || 0) + val;
    }
  }

  /* ====== DESPESA ====== */
  for (const name of despSheets) {
    const ws    = wb.Sheets[name];
    const rows  = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    /* 1) tentar ler TOTAL GERAL */
    let gotTotal = false;
    for (let r = 0; r < 10 && !gotTotal; r++) {
      for (let c = 0; c < 10 && !gotTotal; c++) {
        if (slug(rows[r]?.[c]) === 'totalgeral') {
          /* pega a primeira célula numérica logo abaixo */
          for (let k = r + 1; k < r + 6; k++) {
            const v = parseMoney(rows[k]?.[c]);
            if (v > 0) { totalDesp += v; gotTotal = true; break; }
          }
        }
      }
    }
    if (gotTotal) continue;

    /* 2) fallback: soma todos os “Valor / R$” linha a linha */
    const headRow = rows.findIndex(r =>
      r.map(slug).some(h => ['valor', 'r'].includes(h))
    );
    if (headRow === -1) continue;

    const header = rows[headRow].map(slug);
    const valueCols = header
      .map((h, i) => ({ h, i }))
      .filter(c => ['valor', 'r'].includes(c.h))
      .map(c => c.i);

    for (let i = headRow + 1; i < rows.length; i++) {
      const row = rows[i]; if (!row) continue;
      for (const col of valueCols) totalDesp += parseMoney(row[col]);
    }
  }

  /* ====== render ====== */
  renderCards(totalFat, totalDesp);
  renderChart(weekly);
}

/* ---------- render ---------- */
function renderCards(rec, desp) {
  const diff = rec - desp;
  document.getElementById('cards').innerHTML = `
    <div class="card"><h2>FATURAMENTO MENSAL</h2><p>R$ ${rec.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
    <div class="card"><h2>DESPESA MENSAL</h2><p>R$ ${desp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
    <div class="card"><h2>DIFERENÇA</h2><p>R$ ${diff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
  `;
}

function renderChart(weekly) {
  const ctx = document.getElementById('chart').getContext('2d');
  if (chart) chart.destroy();

  const labels = Object.keys(weekly).map(Number).sort((a, b) => a - b).map(w => 'Semana ' + w);
  const data   = labels.map(l => weekly[parseInt(l.split(' ')[1])]);

  chart = new Chart(ctx, {
    type: 'line',
    data: { labels, datasets: [{ data, tension: .35, borderWidth: 3, pointRadius: 4 }] },
    options: {
      interaction: { mode: 'nearest', intersect: false },
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => 'R$ ' + c.parsed.y.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: v => 'R$ ' + v.toLocaleString('pt-BR') } }
      }
    }
  });
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupTheme();
  loadDashboard();
});
