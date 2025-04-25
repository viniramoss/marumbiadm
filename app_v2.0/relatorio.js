/* relatorio.js – lista + filtros + marcação pago/nao-pago */

const despesasMod = require('./despesas.js');

let ready   = false;     // listeners criados?
let tblBody, fUnid, fTipo, fStat;

function init() {
  /* ––––– primeira vez: captura refs e liga eventos ––––– */
  if (!ready) {
    tblBody = document.querySelector('#tblPag tbody');
    fUnid   = document.getElementById('f-unidade');
    fTipo   = document.getElementById('f-tipo');
    fStat   = document.getElementById('f-status');

    [fUnid, fTipo, fStat].forEach(sel => sel.onchange = render);
    ready = true;
  }
  /* sempre que a página for exibida */
  render();
}

function render() {
  tblBody.innerHTML = '';

  /* ordena por data crescente */
  const list = despesasMod.store.slice()
    .sort((a,b)=> new Date(a.data) - new Date(b.data));

  const u  = fUnid.value;
  const t  = fTipo.value;
  const s  = fStat.value;   // p | np | all

  for (const d of list) {
    if (u !== 'all' && d.unidade !== u)         continue;
    if (t !== 'all' && d.tipo     !== t)        continue;
    if (s === 'p'  && !d.pago)                  continue;
    if (s === 'np' &&  d.pago)                  continue;

    const tr = document.createElement('tr');
    tr.className = d.pago ? 'pago' : 'nao-pago';
    const dataFmt = new Date(d.data + 'T00:00').toLocaleDateString('pt-BR'); // dd/mm/yyyy
    tr.innerHTML = `
    <td>${dataFmt}</td>
    <td>${d.fornecedor}</td>
    <td>${d.tipo}</td>
    <td>${d.unidade}</td>
    <td class="valor">R$ ${Number(d.valor).toLocaleString('pt-BR',{minimumFractionDigits:2})}</td>
    <td><input type="checkbox" ${d.pago ? 'checked' : ''}></td>`;

    /* alterna status pago ↔ não pago */
    tr.querySelector('input').onchange = e => {
      d.pago = e.target.checked;
      tr.className = d.pago ? 'pago' : 'nao-pago';
      render();                 // re-aplica filtros & ordem
    };

    tblBody.appendChild(tr);
  }
}

module.exports.init = init;
