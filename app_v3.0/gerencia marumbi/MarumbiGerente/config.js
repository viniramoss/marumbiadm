/* config.js — agora com tema funcionando corretamente */

function applyTheme(dark) {
  // Aplica classe dark no BODY, não no documentElement
  document.body.classList.toggle('dark', dark);

  // Atualiza legenda, se existir na página
  const lbl = document.getElementById('themeLabel');
  if (lbl) lbl.textContent = dark ? 'Tema Escuro' : 'Tema Claro';
}

function initTheme() {
  /* 1) busca valor salvo; 2) se não existir, assume escuro */
  const saved = localStorage.getItem('theme');          // "dark" | "light" | null
  const dark  = saved ? saved === 'dark' : true;        // default = escuro
  applyTheme(dark);

  /* liga o toggle se a página for settings.html */
  const toggle = document.getElementById('themeToggle');
  if (toggle) {
    toggle.checked = dark;
    toggle.onchange = () => {
      localStorage.setItem('theme', toggle.checked ? 'dark' : 'light');
      applyTheme(toggle.checked);
    };
  }
}

function init() { /* vazio (apenas para cumprir interface) */ }

module.exports = { initTheme, init };