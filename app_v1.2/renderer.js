/* renderer.js – roteador + tema usando require() (CommonJS) */

/* --- carrega módulos uma única vez --------------------------------- */
const dashboard = require('./dashboard.js');
const cadastro  = require('./cadastro.js');
const config    = require('./config.js');   // só para initTheme()

/* --- mapeamento das páginas/navs ----------------------------------- */
const routes = {
  dash : { nav: 'nav-dashboard', page: 'page-dashboard', init: dashboard.init },
  cad  : { nav: 'nav-cadastro' , page: 'page-cadastro' , init: cadastro.init  },
  set  : { nav: 'nav-settings' , page: 'page-settings' , init: config.init    }
};

document.addEventListener('DOMContentLoaded', () => {
  /* tema precisa estar pronto logo de cara */
  config.initTheme();

  /* nav-links */
  Object.entries(routes).forEach(([k, { nav }]) => {
    document.getElementById(nav).onclick = e => {
      e.preventDefault();
      navigate(k);
    };
  });

  navigate('dash');           // tela inicial
});

let current = '';
function navigate(key) {
  if (current === key) return;

  /* ativa link / mostra página */
  Object.entries(routes).forEach(([k, { nav, page }]) => {
    document.getElementById(nav ).classList.toggle('active' , k === key);
    document.getElementById(page).classList.toggle('visible', k === key);
  });

  /* executa o init da página (carrega dados, etc.) */
  routes[key].init();
  current = key;
}
