/* cadastro.js – formulário de lançamento (buffer em memória) */

let initialized=false, buffer=[];

function init(){
  if(initialized) return; initialized=true;

  const form  = document.getElementById('entryForm');
  const tbody = document.querySelector('#preview tbody');

  setHoje();

  form.addEventListener('submit', e=>{
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    d.total = ['din','deb','cre','pix','vou'].reduce((s,k)=>s+parseFloat(d[k]||0),0);
    buffer.push(d); appendRow(d);
    form.reset(); setHoje(); form.operador.focus();
  });

  function setHoje(){ form.data.value = new Date().toISOString().slice(0,10); }
  function money(v){ return 'R$ '+Number(v).toLocaleString('pt-BR',{minimumFractionDigits:2}); }
  function appendRow(o){
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${o.data}</td><td>${o.operador}</td><td>${o.unidade}</td>
      <td>${money(o.din)}</td><td>${money(o.deb)}</td><td>${money(o.cre)}</td>
      <td>${money(o.pix)}</td><td>${money(o.vou)}</td><td>${money(o.total)}</td>`;
    tbody.prepend(tr);
  }
}

module.exports.init = init;
