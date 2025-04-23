/* renderer.js — Marumbi Gerente  (multi-abas “Fat. Marumbi …”) */
const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { Chart, registerables } = require('chart.js');
Chart.register(...registerables);

let chartInstance = null;

/* ---------- util texto ---------- */
function slug(str) {
  return String(str)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]/g, '');      // remove pontuação e espaços
}

/* ---------- tema ---------- */
function setupTheme() {
  const toggle = document.getElementById('themeToggle');
  const label  = document.getElementById('themeLabel');
  toggle.checked = localStorage.getItem('theme') === 'dark';
  apply(toggle.checked);
  toggle.onchange = () => {
    apply(toggle.checked);
    localStorage.setItem('theme', toggle.checked ? 'dark' : 'light');
  };
  function apply(dark) {
    document.body.classList.toggle('dark', dark);
    label.textContent = dark ? 'Tema Escuro' : 'Tema Claro';
  }
}

/* ---------- navegação ---------- */
function setupNav() {
  const links = {
    dash: document.getElementById('nav-dashboard'),
    set : document.getElementById('nav-settings')
  };
  const pages = {
    dash: document.getElementById('page-dashboard'),
    set : document.getElementById('page-settings')
  };
  function show(k) {
    Object.values(links).forEach(a => a.classList.remove('active'));
    Object.values(pages).forEach(p => p.classList.remove('visible'));
    links[k].classList.add('active');
    pages[k].classList.add('visible');
    if (k === 'dash') loadDashboard();
  }
  links.dash.onclick = e => { e.preventDefault(); show('dash'); };
  links.set .onclick = e => { e.preventDefault(); show('set');  };
}

/* ---------- localizar arquivo ---------- */
function findXlsx() {
  const desks = [
    path.join(os.homedir(), 'OneDrive', 'Área de Trabalho'),
    path.join(os.homedir(), 'Desktop')
  ];
  for (const desk of desks) {
    if (!fs.existsSync(desk)) continue;
    const file = fs
      .readdirSync(desk)
      .find(f => f.toLowerCase().startsWith('planilha') && f.toLowerCase().endsWith('.xlsx'));
    if (file) return path.join(desk, file);
  }
  return null;
}

/* ---------- parsers ---------- */
function parseMoney(v) {
  if (v == null || v === '') return 0;
  if (typeof v === 'number') return v;

  let s = String(v).replace(/[^0-9.,-]/g, '');
  if (!s) return 0;

  const lastComma = s.lastIndexOf(',');
  const lastDot   = s.lastIndexOf('.');
  const decPos    = Math.max(lastComma, lastDot);

  if (decPos !== -1) {
    const intPart = s.slice(0, decPos).replace(/[.,]/g, '');
    const decPart = s.slice(decPos + 1).replace(/[.,]/g, '');
    s = intPart + '.' + decPart;
  } else {
    s = s.replace(/[.,]/g, '');
  }
  return parseFloat(s) || 0;
}

function parseDate(v) {
  if (v instanceof Date) return v;

  // número serial Excel
  if (typeof v === 'number') {
    const d = XLSX.SSF.parse_date_code(v);
    return new Date(d.y, d.m - 1, d.d);
  }

  // 01/abr ou 01-abr
  const ptMonths = { jan:0, fev:1, mar:2, abr:3, mai:4, jun:5,
                     jul:6, ago:7, set:8, out:9, nov:10, dez:11 };
  let m = String(v).match(/(\\d{1,2})[\\/-]([a-z]{3})/i);
  if (m) {
    const [, d, mon] = m;
    const y = new Date().getFullYear();
    return new Date(y, ptMonths[mon.toLowerCase()], parseInt(d, 10));
  }

  // 01/04/25 ou 01-04-2025
  m = String(v).match(/(\\d{1,2})[\\/-](\\d{1,2})[\\/-](\\d{2,4})/);
  if (m) {
    let [, d, mo, y] = m.map(Number);
    if (y < 100) y += 2000;
    return new Date(y, mo - 1, d);
  }
  return new Date(NaN);
}

function weekOfMonth(date) {
  const offset = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return Math.ceil((date.getDate() + offset) / 7);
}

/* ---------- DASHBOARD ---------- */
function loadDashboard() {
  const file = findXlsx();
  if (!file) {
    document.getElementById('card').textContent = 'Nenhum .xlsx encontrado.';
    return;
  }

  const wb = XLSX.readFile(file, { cellDates: true });

  // todas as abas que começam com "Fat. Marumbi"
  const marumbiSheets = wb.SheetNames.filter(n => slug(n).startsWith('fatmarumbi'));
  if (marumbiSheets.length === 0) {
    document.getElementById('card').textContent = 'Nenhuma aba “Fat. Marumbi …” encontrada.';
    return;
  }

  let totalMonth = 0;
  const weekly = {};   // { semana : soma }

  /* ---- percorre cada aba ---- */
  for (const sheetName of marumbiSheets) {
    const ws   = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

    // achar cabeçalho
    let headerRow = 0;
    for (let i = 0; i < Math.min(20, rows.length); i++) {
      const cols = rows[i].map(slug);
      if (cols.includes('dinheiro') && cols.includes('debito')) { headerRow = i; break; }
    }
    const headers = rows[headerRow].map(slug);
    const idx = n => headers.indexOf(n);

    const hasTotal = idx('total') !== -1;
    const col = {
      date: idx('data'),
      total: idx('total'),
      din : idx('dinheiro'),
      deb : idx('debito'),
      cre : idx('credito'),
      pix : idx('pix'),
      vou : idx('voucher')
    };

    // varre linhas da aba
    for (let i = headerRow + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r || r.every(c => c === '')) continue;

      const d = parseDate(r[col.date]);
      if (isNaN(d)) continue;

      const w = weekOfMonth(d);
      if (!weekly[w]) weekly[w] = 0;

      const rowTotal = hasTotal
        ? parseMoney(r[col.total])
        : parseMoney(r[col.din]) + parseMoney(r[col.deb]) + parseMoney(r[col.cre]) +
          parseMoney(r[col.pix]) + parseMoney(r[col.vou]);

      totalMonth += rowTotal;
      weekly[w]  += rowTotal;
    }
  }

  renderCard(totalMonth);
  renderChart(weekly);
}

/* ---------- render ---------- */
function renderCard(val) {
  document.getElementById('card').innerHTML = `
    <h2>FATURAMENTO MENSAL</h2>
    <p>R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
  `;
}

function renderChart(weekly) {
  const weeks  = Object.keys(weekly).map(Number).sort((a,b)=>a-b);
  const labels = weeks.map(w => 'Semana ' + w);
  const values = weeks.map(w => weekly[w]);

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(
    document.getElementById('chart').getContext('2d'),
    {
      type : 'line',
      data : { labels, datasets:[{ data:values, tension:.35, borderWidth:3, pointRadius:4 }] },
      options: {
        interaction: { mode: 'nearest', intersect: false },
        maintainAspectRatio:false,
        plugins:{ legend:{display:false},
          tooltip:{callbacks:{label:c=>'R$ '+c.parsed.y.toLocaleString('pt-BR',{minimumFractionDigits:2})}} },
        scales:{ y:{ beginAtZero:true, ticks:{callback:v=>'R$ '+v.toLocaleString('pt-BR')}} }
      }
    }
  );
}

/* ---------- init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  setupNav();
  setupTheme();
  loadDashboard();
});
