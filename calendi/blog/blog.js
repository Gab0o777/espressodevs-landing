// JS compartido del blog: copiado de calendi/index.html (navbar flotante + dropdown "Recursos").
// navbar flotante: se activa apenas se deja el tope de la página
(function () {
  var nav = document.querySelector('nav');
  if (!nav || !('IntersectionObserver' in window)) return;

  var sentinel = document.createElement('div');
  sentinel.setAttribute('aria-hidden', 'true');
  sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:24px;pointer-events:none;';
  document.body.prepend(sentinel);

  new IntersectionObserver(function (entries) {
    nav.classList.toggle('is-floating', !entries[0].isIntersecting);
  }).observe(sentinel);
})();

// dropdown "Recursos" del nav
(function () {
  var dropdown = document.getElementById('navResourcesDropdown');
  var trigger = document.getElementById('navResourcesBtn');
  if (!dropdown || !trigger) return;

  function close() {
    dropdown.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  }
  function toggle(e) {
    e.stopPropagation();
    var isOpen = dropdown.classList.toggle('is-open');
    trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  }

  trigger.addEventListener('click', toggle);
  document.addEventListener('click', function (e) {
    if (!dropdown.contains(e.target)) close();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();


// calculadora de plan (solo en los posts que la incluyen)
(function () {
  var root = document.getElementById('planCalc');
  if (!root) return;

  var USD_RATE = 40; // UYU por USD, cotización 2026-10-09
  var MSGS_PER_TURNO = 2; // recordatorio + confirmación
  var REGISTER = 'https://calendi.espressodevs.com/auth/register';
  var WA = 'https://wa.me/59892364754?text=';

  var PLANS = {
    free:   { name: 'calendi Free', uyu: 0,    msgs: 0,    items: ['Turnos ilimitados en tu agenda', 'Link de reservas (hasta 30 reservas por mes desde el link)', 'Sincronización con Google Calendar o iPhone'] },
    solo:   { name: 'calendi Solo', uyu: 599,  msgs: 0,    items: ['Recordatorios y confirmaciones por email', 'Cobros con Mercado Pago sin comisión', 'Historial de visitas de cada cliente'] },
    soloia: { name: 'calendi Solo + IA', uyu: 999, msgs: 0, items: ['Todo lo del plan Solo', 'IA que contesta los mensajes de tus clientes', 'Cobros con Mercado Pago sin comisión'] },
    pro:    { name: 'calendi Pro',  uyu: 1050, msgs: 300,  items: ['Hasta 3 barberos', '300 mensajes de WhatsApp por mes', 'Recordatorios, confirmaciones y reagendas automáticas'] },
    proia:  { name: 'calendi Pro + IA', uyu: 1799, msgs: 300, items: ['Todo lo del plan Pro', 'IA que contesta los mensajes de tus clientes', '300 mensajes de WhatsApp por mes'] },
    max:    { name: 'calendi Max',  uyu: 2490, msgs: 1500, items: ['Hasta 10 barberos', '1.500 mensajes de WhatsApp por mes', 'Difusiones y mensajes desde tu propio número'] }
  };

  var $ = function (id) { return document.getElementById(id); };
  var pros = $('calcPros'), turnos = $('calcTurnos'), wa = $('calcWa'), ia = $('calcIa'), max = $('calcMax'), mp = $('calcMp');
  var LINK_SHARE = 0.1; // estimamos que 1 de cada 10 turnos entra por el link de reservas

  function fmt(n) { return n.toLocaleString('es-UY'); }

  function pick(p, t, needWa, needIa, needMax, needMp) {
    var msgs = needWa ? t * MSGS_PER_TURNO : 0;
    if (p > 10) return { key: null, msgs: msgs };
    if (p > 3 || needMax || msgs > 300) return { key: 'max', msgs: msgs };
    if (p > 1 || needWa) return { key: needIa ? 'proia' : 'pro', msgs: msgs };
    if (needIa) return { key: 'soloia', msgs: msgs };
    return { key: (needMp || t * LINK_SHARE > 30) ? 'solo' : 'free', msgs: msgs };
  }

  function render() {
    var p = +pros.value, t = +turnos.value;
    $('calcProsOut').textContent = p > 10 ? '10+' : p;
    $('calcTurnosOut').textContent = t >= 1000 ? '1.000+' : fmt(t);

    var r = pick(p, t, wa.checked, ia.checked, max.checked, mp.checked);
    var cta = $('calcCta'), note = $('calcNote'), list = $('calcList');

    if (!r.key) {
      $('calcPlan').textContent = 'Plan a medida';
      $('calcUsd').textContent = 'Hablemos';
      $('calcUyu').textContent = 'Para más de 10 barberos';
      list.innerHTML = '<li>Armamos un plan para tu equipo</li><li>Soporte de 7 a 21 h, todos los días</li>';
      note.textContent = '';
      cta.textContent = 'Escribinos por WhatsApp';
      cta.href = WA + encodeURIComponent('Hola! Tengo una barbería con más de 10 barberos y quiero saber más de calendi');
      return;
    }

    var plan = PLANS[r.key];
    $('calcPlan').textContent = plan.name;
    $('calcUsd').textContent = plan.uyu ? 'USD ' + Math.round(plan.uyu / USD_RATE) : 'Gratis';
    $('calcUyu').textContent = plan.uyu ? 'UYU ' + fmt(plan.uyu) + ' por mes' : 'para siempre';
    list.innerHTML = plan.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') +
      '<li>Soporte de 7 a 21 h, todos los días</li>';

    var notes = [];
    if (r.msgs) notes.push('Estimamos ' + fmt(r.msgs) + ' mensajes de WhatsApp por mes (' + MSGS_PER_TURNO + ' por turno); tu plan incluye ' + fmt(plan.msgs) + '.');
    if (r.msgs > plan.msgs && plan.msgs) notes.push('Si necesitás más mensajes, escribinos y lo armamos a tu medida.');
    if (r.key === 'max' && ia.checked) notes.push('La IA para el plan Max la cotizamos a medida: escribinos.');
    if (plan.uyu) notes.push('Sin comisión por tus ventas: este es el precio final que le pagás a calendi.');
    note.textContent = notes.join(' ');

    cta.textContent = plan.uyu ? 'Probar gratis' : 'Crear cuenta gratis';
    cta.href = REGISTER;
  }

  [pros, turnos, wa, ia, max, mp].forEach(function (el) { el.addEventListener('input', render); });
  render();
})();
