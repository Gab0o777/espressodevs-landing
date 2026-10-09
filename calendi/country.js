// Selector de país de la navbar (todas las páginas de calendi).
// Guarda el país elegido, actualiza los textos con [data-country-name] y avisa
// con el evento "calendi:country" para que cada página (ej. precios) cambie moneda e info.
(function () {
  var STORAGE_KEY = 'calendi-country';
  var COUNTRIES = {
    UY: { name: 'Uruguay', currency: 'UYU' },
    AR: { name: 'Argentina', currency: 'ARS' },
    CL: { name: 'Chile', currency: 'CLP' },
    PE: { name: 'Perú', currency: 'PEN' }
  };

  // banderas en SVG (los emojis de bandera no se ven en Windows)
  var FLAGS = {
    UY: '<svg viewBox="0 0 27 18" aria-hidden="true"><rect width="27" height="18" fill="#fff"/><g fill="#0038A8"><rect y="2" width="27" height="2"/><rect y="6" width="27" height="2"/><rect y="10" width="27" height="2"/><rect y="14" width="27" height="2"/></g><rect width="10" height="10" fill="#fff"/><circle cx="5" cy="5" r="2.6" fill="#FCD116"/></svg>',
    AR: '<svg viewBox="0 0 27 18" aria-hidden="true"><rect width="27" height="18" fill="#74ACDF"/><rect y="6" width="27" height="6" fill="#fff"/><circle cx="13.5" cy="9" r="1.9" fill="#F6B40E"/></svg>',
    CL: '<svg viewBox="0 0 27 18" aria-hidden="true"><rect width="27" height="18" fill="#fff"/><rect y="9" width="27" height="9" fill="#D52B1E"/><rect width="9" height="9" fill="#0039A6"/><polygon points="4.5,2.3 5.3,4.4 7.5,4.4 5.7,5.7 6.4,7.8 4.5,6.5 2.6,7.8 3.3,5.7 1.5,4.4 3.7,4.4" fill="#fff"/></svg>',
    PE: '<svg viewBox="0 0 27 18" aria-hidden="true"><rect width="27" height="18" fill="#fff"/><rect width="9" height="18" fill="#D91023"/><rect x="18" width="9" height="18" fill="#D91023"/></svg>'
  };

  var pickers = document.querySelectorAll('[data-country-picker]');

  function read() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved && COUNTRIES[saved]) return saved;
    } catch (e) {}
    var langs = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < langs.length; i++) {
      var region = (langs[i].split('-')[1] || '').toUpperCase();
      if (COUNTRIES[region]) return region;
    }
    return 'UY';
  }

  function flagOf(code) { return FLAGS[code] || code; }

  function apply(code, persist) {
    var country = COUNTRIES[code];
    document.documentElement.setAttribute('data-country', code);
    document.querySelectorAll('[data-country-name]').forEach(function (el) { el.textContent = country.name; });
    pickers.forEach(function (picker) {
      var current = picker.querySelector('[data-country-current]');
      if (current) current.innerHTML = flagOf(code);
      picker.querySelector('.country-trigger').setAttribute('aria-label', 'País: ' + country.name + '. Cambiar país');
      picker.querySelectorAll('[data-country-option]').forEach(function (opt) {
        var on = opt.getAttribute('data-country-option') === code;
        opt.classList.toggle('is-active', on);
        opt.setAttribute('aria-checked', on ? 'true' : 'false');
      });
    });
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, code); } catch (e) {}
    }
    window.calendiCountry = { code: code, name: country.name, currency: country.currency };
    window.dispatchEvent(new CustomEvent('calendi:country', { detail: window.calendiCountry }));
  }

  function closeAll() {
    pickers.forEach(function (p) {
      p.classList.remove('is-open');
      p.querySelector('.country-trigger').setAttribute('aria-expanded', 'false');
    });
  }

  pickers.forEach(function (picker) {
    var trigger = picker.querySelector('.country-trigger');
    picker.querySelectorAll('[data-country-option]').forEach(function (opt) {
      var code = opt.getAttribute('data-country-option');
      opt.querySelector('.country-flag').innerHTML = flagOf(code);
      opt.addEventListener('click', function () {
        apply(code, true);
        closeAll();
        trigger.focus();
      });
    });
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !picker.classList.contains('is-open');
      closeAll();
      picker.classList.toggle('is-open', open);
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('[data-country-picker]')) closeAll();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeAll();
  });

  apply(read(), false);
})();
