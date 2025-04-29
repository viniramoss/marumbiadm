/* dashboard.js – gera cards e gráfico a partir do Excel */

const XLSX = require('xlsx');
const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { Chart, registerables } = require('chart.js');
Chart.register(...registerables);

let chart=null;

/* helpers */
const slug=s=>String(s??'').trim().toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]/g,'');
function parseMoney(v){if(v==null||v==='')return 0;if(typeof v==='number')return v;
  let s=String(v).replace(/[^0-9,.\-]/g,'');if(!s)return 0;
  const d=Math.max(s.lastIndexOf(','),s.lastIndexOf('.'));
  s=d!==-1?s.slice(0,d).replace(/[.,]/g,'')+'.'+s.slice(d+1).replace(/[.,]/g,''):s.replace(/[.,]/g,'');
  return parseFloat(s)||0;}
function parseDate(v){if(v instanceof Date)return v;if(typeof v==='number'){const d=XLSX.SSF.parse_date_code(v);return new Date(d.y,d.m-1,d.d);}
  const pt={jan:0,fev:1,mar:2,abr:3,mai:4,jun:5,jul:6,ago:7,set:8,out:9,nov:10,dez:11};
  let m=String(v).match(/(\\d{1,2})[\\/-]([a-z]{3})/i);
  if(m)return new Date(new Date().getFullYear(),pt[m[2].toLowerCase()],+m[1]);
  m=String(v).match(/(\\d{1,2})[\\/-](\\d{1,2})[\\/-](\\d{2,4})/);
  if(m){let[,d,mo,y]=m.map(Number);if(y<100)y+=2000;return new Date(y,mo-1,d);}return new Date(NaN);}
const weekOfMonth=d=>Math.ceil((d.getDate()+new Date(d.getFullYear(),d.getMonth(),1).getDay())/7);
function findXlsx(){const desks=[path.join(os.homedir(),'OneDrive','Área de Trabalho'),path.join(os.homedir(),'Desktop')];
  for(const d of desks){if(!fs.existsSync(d))continue;
    const f=fs.readdirSync(d).find(f=>f.toLowerCase().startsWith('planilha')&&f.toLowerCase().endsWith('.xlsx'));
    if(f)return path.join(d,f);}return null;}

function renderCards(rec,desp){
  const diff=rec-desp;
  document.getElementById('cards').innerHTML=`
    <div class="card"><h2>FATURAMENTO MENSAL</h2><p>R$ ${rec.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p></div>
    <div class="card"><h2>DESPESA MENSAL</h2><p>R$ ${desp.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p></div>
    <div class="card"><h2>DIFERENÇA</h2><p>R$ ${diff.toLocaleString('pt-BR',{minimumFractionDigits:2})}</p></div>`;
}
function renderChart(weekly){
  const ctx=document.getElementById('chart').getContext('2d');
  if(chart)chart.destroy();
  const weeks=Object.keys(weekly).map(Number).sort((a,b)=>a-b);
  chart=new Chart(ctx,{type:'line',
    data:{labels:weeks.map(w=>'Semana '+w),datasets:[{data:weeks.map(w=>weekly[w]),tension:.35,borderWidth:3,pointRadius:4}]},
    options:{interaction:{mode:'nearest',intersect:false},maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>'R$ '+c.parsed.y.toLocaleString('pt-BR',{minimumFractionDigits:2})}}},
      scales:{y:{beginAtZero:true,ticks:{callback:v=>'R$ '+v.toLocaleString('pt-BR')}}}}});
}

function init(){
  const file=findXlsx();
  if(!file){renderCards(0,0);renderChart({});return;}

  const wb=XLSX.readFile(file,{cellDates:true});
  const fatSheets = wb.SheetNames.filter(n=>slug(n).startsWith('fatmarumbi'));
  const despSheets= wb.SheetNames.filter(n=>slug(n).startsWith('despmarumbi'));

  let totalFat=0,totalDesp=0;const weekly={};

  /* receita */
  for(const s of fatSheets){
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[s],{header:1,defval:''});
    const h=rows.findIndex(r=>r.map(slug).includes('dinheiro')); if(h===-1)continue;
    const head=rows[h].map(slug),idx=x=>head.indexOf(x);
    const col={d:idx('data'),t:idx('total'),din:idx('dinheiro'),deb:idx('debito'),cre:idx('credito'),pix:idx('pix'),vou:idx('voucher')};
    const hasTotal=col.t!==-1;
    for(let i=h+1;i<rows.length;i++){
      const r=rows[i]; if(!r||r.every(c=>c===''))continue;
      const dt=parseDate(r[col.d]); if(isNaN(dt))continue;
      const v=hasTotal?parseMoney(r[col.t]):['din','deb','cre','pix','vou'].reduce((s,k)=>s+parseMoney(r[col[k]]),0);
      totalFat+=v; const w=weekOfMonth(dt); weekly[w]=(weekly[w]||0)+v;
    }
  }

  /* despesa */
  for(const s of despSheets){
    const rows=XLSX.utils.sheet_to_json(wb.Sheets[s],{header:1,defval:''});
    let pegou=false; outer:for(let r=0;r<10;r++)for(let c=0;c<10;c++){
      if(slug(rows[r]?.[c])==='totalgeral'){
        for(let k=r+1;k<r+6;k++){const v=parseMoney(rows[k]?.[c]);if(v>0){totalDesp+=v;pegou=true;break outer;}}
      }}
    if(pegou)continue;
    const h=rows.findIndex(r=>r.map(slug).some(h=>['valor','r'].includes(h))); if(h===-1)continue;
    const header=rows[h].map(slug);
    const valCols=header.map((h,i)=>['valor','r'].includes(h)?i:-1).filter(i=>i!==-1);
    for(let i=h+1;i<rows.length;i++){
      const row=rows[i]; if(!row)continue;
      for(const c of valCols) totalDesp+=parseMoney(row[c]);
    }
  }

  renderCards(totalFat,totalDesp);
  renderChart(weekly);
}

module.exports.init = init;
module.exports.initTheme = ()=>{};