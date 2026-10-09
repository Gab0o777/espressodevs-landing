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

