// Calculadora de plan de calendi: la usan los posts del blog y la página de precios.
// (se activa solo si la página tiene #planCalc)
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
    pro:    { name: 'calendi Pro',  uyu: 1050, msgs: 300,  items: ['Hasta 3 profesionales', '300 mensajes de WhatsApp por mes', 'Recordatorios, confirmaciones y reagendas automáticas'] },
    proia:  { name: 'calendi Pro + IA', uyu: 1799, msgs: 300, items: ['Todo lo del plan Pro', 'IA que contesta los mensajes de tus clientes', '300 mensajes de WhatsApp por mes'] },
    max:    { name: 'calendi Max',  uyu: 2490, msgs: 1000, items: ['Hasta 8 profesionales', '1.000 mensajes de WhatsApp por mes', 'Difusiones y mensajes desde tu propio número'] },
    maxia:  { name: 'calendi Max + IA', uyu: 3490, msgs: 1000, items: ['Todo lo del plan Max', 'IA que contesta los mensajes de tus clientes', '1.000 mensajes de WhatsApp por mes'] }
  };

  var $ = function (id) { return document.getElementById(id); };
  var pros = $('calcPros'), turnos = $('calcTurnos'), wa = $('calcWa'), ia = $('calcIa'), max = $('calcMax'), mp = $('calcMp');
  var LINK_SHARE = 0.1; // estimamos que 1 de cada 10 turnos entra por el link de reservas

  function fmt(n) { return n.toLocaleString('es-UY'); }

  function pick(p, t, needWa, needIa, needMax, needMp) {
    var msgs = needWa ? t * MSGS_PER_TURNO : 0;
    if (p > 8 || msgs > 1000) return { key: null, msgs: msgs };
    if (p > 3 || needMax || msgs > 300) return { key: needIa ? 'maxia' : 'max', msgs: msgs };
    if (p > 1 || needWa) return { key: needIa ? 'proia' : 'pro', msgs: msgs };
    if (needIa) return { key: 'soloia', msgs: msgs };
    return { key: (needMp || t * LINK_SHARE > 30) ? 'solo' : 'free', msgs: msgs };
  }

  function render() {
    var p = +pros.value, t = +turnos.value;
    $('calcProsOut').textContent = p > 8 ? '8+' : p;
    $('calcTurnosOut').textContent = t >= 1000 ? '1.000+' : fmt(t);

    var r = pick(p, t, wa.checked, ia.checked, max.checked, mp.checked);
    var cta = $('calcCta'), note = $('calcNote'), list = $('calcList');

    if (!r.key) {
      $('calcPlan').textContent = 'calendi Business';
      $('calcUsd').textContent = '¡Hablemos!';
      $('calcUyu').textContent = p > 8 ? 'Para más de 8 profesionales' : 'Para más de 1.000 mensajes por mes';
      list.innerHTML = '<li>Profesionales ilimitados</li><li>Mensajes de WhatsApp ilimitados</li><li>Soporte de 7 a 21 h, todos los días</li>';
      note.textContent = '';
      cta.textContent = 'Escribinos por WhatsApp';
      cta.href = WA + encodeURIComponent('Hola! Quiero saber más del plan Business de calendi');
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
    if (plan.uyu) notes.push('Sin comisión por tus ventas: este es el precio final que le pagás a calendi.');
    note.textContent = notes.join(' ');

    cta.textContent = plan.uyu ? 'Probar gratis' : 'Crear cuenta gratis';
    cta.href = REGISTER;
  }

  [pros, turnos, wa, ia, max, mp].forEach(function (el) { el.addEventListener('input', render); });
  render();
})();
