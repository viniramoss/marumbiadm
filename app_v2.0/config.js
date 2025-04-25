/* config.js – apenas tema */

function initTheme(){
    const t   = document.getElementById('themeToggle');
    const lbl = document.getElementById('themeLabel');
  
    /* estado salvo em localStorage */
    t.checked = localStorage.getItem('theme') === 'dark';
    apply(t.checked);
  
    t.onchange = () => {
      apply(t.checked);
      localStorage.setItem('theme', t.checked ? 'dark' : 'light');
    };
  
    function apply(dark){
      document.body.classList.toggle('dark', dark);
      lbl.textContent = dark ? 'Tema Escuro' : 'Tema Claro';
    }
  }
  
  /* quando entrar na página Config, não há mais nada além do tema */
  function init(){ /* vazio, mas mantido para roteador */ }
  
  module.exports = { initTheme, init };
  