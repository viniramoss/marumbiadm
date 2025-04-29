// renderer.js  (CommonJS continua ok com nodeIntegration: true)
const dashboard = require('../dashboard.js');
const cadastro  = require('../cadastro.js');
const despesas  = require('../despesas.js');
const relatorio = require('../relatorio.js');
const config    = require('../config.js');   // só tema

document.addEventListener('DOMContentLoaded', () => {
  config.initTheme();              // aplica tema antes de tudo

  // qual arquivo está aberto?  ex.: dashboard.html → "dashboard"
  const page = window.location.pathname.split('/').pop().replace('.html', '');

  // chama init correspondente
  switch (page) {
    case 'dashboard': dashboard.init(); break;
    case 'cadastro' : cadastro.init();  break;
    case 'despesas' : despesas.init();  break;
    case 'relatorio': relatorio.init(); break;
    case 'settings' : config.init();    break;      // tela de tema
  }
});

// /* renderer.js – roteador + tema usando require() (CommonJS) */

// /* --- carrega módulos uma única vez --------------------------------- */
// const dashboard = require('./dashboard.js');
// const cadastro  = require('./cadastro.js');
// const despesas  = require('./despesas.js');
// const relatorio = require('./relatorio.js');
// const config    = require('./config.js');   // só para initTheme()

// /* --- mapeamento das páginas/navs ----------------------------------- */
// const routes = {
//   dash : { nav: 'nav-dashboard', page: 'page-dashboard', init: dashboard.init },
//   cad  : { nav: 'nav-cadastro' , page: 'page-cadastro' , init: cadastro.init  },
//   desp : { nav:'nav-despesas' , page:'page-despesas' , init: despesas.init },
//   rel  : { nav:'nav-relatorio', page:'page-relatorio', init: relatorio.init },
//   set  : { nav: 'nav-settings' , page: 'page-settings' , init: config.init    }
// };

// document.addEventListener('DOMContentLoaded', () => {
//   /* tema precisa estar pronto logo de cara */
//   config.initTheme();

//   /* nav-links */
//   Object.entries(routes).forEach(([k, { nav }]) => {
//     document.getElementById(nav).onclick = e => {
//       e.preventDefault();
//       navigate(k);
//     };
//   });

//   navigate('dash');           // tela inicial
// });

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
