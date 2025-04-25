/* despesas.js – cadastro de boletos / variáveis */

let ready = false;
const store = [];

function init() {
  if (ready) return;          // só configura uma vez
  ready = true;

  const form  = document.getElementById('formDesp');
  const tbody = document.querySelector('#previewDesp tbody');

  prefill();

  form.addEventListener('submit', e => {
    e.preventDefault();
  
    /* guarda a unidade escolhida ANTES de resetar */
    const unidadeSelecionada = form.unidade.value; 
    const tipoSelecionada = form.tipo.value; 
  
    /* monta o objeto da despesa */
    const d = Object.fromEntries(new FormData(form).entries());
    d.valor = parseFloat(d.valor || 0);
    d.pago  = false;              // default = não pago
    store.push(d);
    addRow(d);
  
    /* limpa o formulário, mas preserva unidade */
    form.reset();
    form.data.value    = new Date().toISOString().slice(0,10);  // data de hoje
    form.unidade.value = unidadeSelecionada;
    form.tipo.value    = tipoSelecionada;
    form.fornecedor.focus();
  });

  function prefill() {
    form.data.value = new Date().toISOString().slice(0, 10);
  }
  function money(v) {
    return 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
  }
  function addRow(o) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o.data}</td>
      <td>${o.fornecedor}</td>
      <td>${o.tipo}</td>
      <td>${o.unidade}</td>
      <td>${money(o.valor)}</td>`;
    tbody.prepend(tr);
  }
}

module.exports.init = init;
module.exports.store = store;
