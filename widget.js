/**
 * Umeia webchat widget — floating chat bubble embeddable on any website.
 *
 * Embed with:
 *   <script src="https://widget.umeia.io/widget.js" data-tenant="infoumeiaio" async></script>
 *
 * Optional data-attributes on the same <script> tag:
 *   data-api-base    umeiacore base URL (default: https://umeia.space)
 *   data-color       accent color, any valid CSS color (default: #6c3ce0)
 *   data-position    "bottom-right" | "bottom-left" (default: bottom-right)
 *   data-title       header name (default: "Umeia")
 *   data-subtitle    small line under the header name (default: "En línea")
 *   data-greeting    bold greeting line in the header (default: "¡Hola! 👋")
 *   data-description line under the greeting (default: "¿En qué te puedo ayudar hoy?")
 *
 * Talks to umeiacore's webchat channel: POST {api-base}/webhook/webchat/message
 * (see core/webhook/webchat.py). No build step, no dependencies.
 */
(function () {
  "use strict";

  var scriptTag = document.currentScript;
  if (!scriptTag) return;

  var TENANT_ID = scriptTag.getAttribute("data-tenant");
  if (!TENANT_ID) {
    console.error("[umeia-widget] Missing required data-tenant attribute.");
    return;
  }

  var API_BASE = (scriptTag.getAttribute("data-api-base") || "https://umeia.space").replace(/\/$/, "");
  var ACCENT_COLOR = scriptTag.getAttribute("data-color") || "#6c3ce0";
  var POSITION = scriptTag.getAttribute("data-position") === "bottom-left" ? "left" : "right";
  var TITLE = scriptTag.getAttribute("data-title") || "Umeia";
  var SUBTITLE = scriptTag.getAttribute("data-subtitle") || "En línea";
  var GREETING = scriptTag.getAttribute("data-greeting") || "¡Hola! 👋";
  var DESCRIPTION = scriptTag.getAttribute("data-description") || "¿En qué te puedo ayudar hoy?";

  // Umeia "U" mark (from umeia-projects/umeia-client-insights public/umeia-icon.png),
  // inlined so the widget stays a single dependency-free file.
  var LOGO_SRC = "data:image/jpeg;base64,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";

  // Quick-reply shortcuts shown above the conversation — each just sends its
  // own label as if the visitor typed it, so it rides the same intent
  // classification as everything else (no separate code path to keep in sync).
  var QUICK_REPLIES = [
    { icon: "chat", label: "¿Qué es Umeia?" },
    { icon: "calendar", label: "Quiero agendar una reunión" },
    { icon: "price", label: "¿Cuánto cuesta?" }
  ];

  var QR_ICONS = {
    chat: '<path d="M4 4h16a1 1 0 011 1v11a1 1 0 01-1 1H8l-4 4V6a2 2 0 012-2z"/>',
    calendar: '<path d="M7 2v2H5a2 2 0 00-2 2v13a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2h-2V2h-2v2H9V2H7zm-2 6h14v11H5V8z"/>',
    price: '<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15.5v1h-2v-1.1c-1.4-.3-2.5-1.2-2.6-2.7h1.7c.1.8.7 1.4 1.9 1.4 1.3 0 2-.6 2-1.4 0-.8-.6-1.2-2.1-1.6-2-.5-3.3-1.2-3.3-2.9 0-1.4 1.1-2.4 2.5-2.7V6.5h2v1c1.3.3 2.2 1.2 2.3 2.5h-1.7c-.1-.7-.6-1.3-1.7-1.3-1.2 0-1.8.5-1.8 1.2 0 .7.6 1 2 1.4 2.1.5 3.4 1.3 3.4 3.1 0 1.5-1.2 2.5-2.6 2.8z"/>'
  };

  // Faint constellation/network texture behind the header, matching the
  // reference's "nucleus" look — decorative only, stretches to fill.
  var HEADER_PATTERN_SVG =
    '<svg viewBox="0 0 400 220" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">' +
    '<g fill="none" stroke="#ffffff" stroke-width="1" opacity="0.18">' +
    '<line x1="40" y1="30" x2="110" y2="70"/>' +
    '<line x1="110" y1="70" x2="90" y2="140"/>' +
    '<line x1="110" y1="70" x2="200" y2="50"/>' +
    '<line x1="200" y1="50" x2="270" y2="100"/>' +
    '<line x1="270" y1="100" x2="340" y2="60"/>' +
    '<line x1="270" y1="100" x2="230" y2="170"/>' +
    '<line x1="90" y1="140" x2="160" y2="190"/>' +
    "</g>" +
    '<g fill="#ffffff" opacity="0.35">' +
    '<circle cx="40" cy="30" r="2.5"/>' +
    '<circle cx="110" cy="70" r="3.5"/>' +
    '<circle cx="90" cy="140" r="2"/>' +
    '<circle cx="200" cy="50" r="2.5"/>' +
    '<circle cx="270" cy="100" r="3"/>' +
    '<circle cx="340" cy="60" r="2"/>' +
    '<circle cx="230" cy="170" r="2"/>' +
    '<circle cx="160" cy="190" r="2"/>' +
    "</g>" +
    "</svg>";

  var STORAGE_PREFIX = "umeia_widget_" + TENANT_ID + "_";
  var CONVERSATION_KEY = STORAGE_PREFIX + "conversation_id";
  var TRANSCRIPT_KEY = STORAGE_PREFIX + "transcript";

  function getConversationId() {
    var id = localStorage.getItem(CONVERSATION_KEY);
    if (!id) {
      id = (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));
      localStorage.setItem(CONVERSATION_KEY, id);
    }
    return id;
  }

  function loadTranscript() {
    try {
      var raw = localStorage.getItem(TRANSCRIPT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveTranscript(transcript) {
    try {
      // Keep it bounded — this is just for reload continuity, not an archive.
      localStorage.setItem(TRANSCRIPT_KEY, JSON.stringify(transcript.slice(-50)));
    } catch (e) {
      /* localStorage full or unavailable — degrade silently */
    }
  }

  function formatTime(ts) {
    try {
      return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  var css = [
    ":host, .umeia-root { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }",
    ".umeia-root * { box-sizing: border-box; }",

    // Floating button — the outer glow is a blurred, pulsing halo sitting
    // behind the button (negative z-index), plus a small "online" dot on
    // the button itself so the closed state still reads as active.
    ".umeia-bubble-wrap { position: fixed; bottom: 20px; " + POSITION + ": 20px; z-index: 2147483000; width: 60px; height: 60px; }",
    ".umeia-bubble-glow {",
    "  position: absolute; inset: -10px; border-radius: 50%; z-index: 0;",
    "  background: radial-gradient(circle, color-mix(in srgb, " + ACCENT_COLOR + " 60%, transparent) 0%, transparent 72%);",
    "  filter: blur(7px); animation: umeia-pulse 2.6s ease-in-out infinite;",
    "}",
    "@keyframes umeia-pulse { 0%, 100% { opacity: .55; transform: scale(1); } 50% { opacity: .95; transform: scale(1.12); } }",
    ".umeia-bubble {",
    "  position: absolute; inset: 0; z-index: 1; border-radius: 50%; border: none; cursor: pointer; padding: 0; overflow: hidden;",
    "  background: " + ACCENT_COLOR + "; box-shadow: 0 4px 16px rgba(0,0,0,0.3); transition: transform .15s ease;",
    "}",
    ".umeia-bubble:hover { transform: scale(1.06); }",
    ".umeia-bubble img { width: 100%; height: 100%; object-fit: cover; }",
    ".umeia-bubble-dot {",
    "  position: absolute; right: 1px; bottom: 1px; width: 15px; height: 15px; z-index: 2;",
    "  border-radius: 50%; background: #2ecc71; border: 3px solid #fff;",
    "}",

    ".umeia-panel {",
    "  position: fixed; bottom: 92px; " + POSITION + ": 20px; z-index: 2147483000;",
    "  width: 340px; max-width: calc(100vw - 40px); height: 540px; max-height: calc(100vh - 140px);",
    "  background: #fff; border-radius: 20px; box-shadow: 0 12px 40px rgba(20,10,50,0.25);",
    "  display: none; flex-direction: column; overflow: hidden;",
    "}",
    ".umeia-panel.umeia-open { display: flex; }",

    // Header — dark gradient, holds identity row + a persistent greeting.
    ".umeia-header {",
    "  position: relative; overflow: hidden;",
    "  background: linear-gradient(155deg, #140b28 0%, color-mix(in srgb, " + ACCENT_COLOR + " 55%, #140b28 45%) 130%);",
    "  color: #fff; padding: 14px 16px 46px; flex-shrink: 0;",
    "}",
    ".umeia-header-pattern { position: absolute; inset: 0; z-index: 0; pointer-events: none; }",
    ".umeia-header-pattern svg { width: 100%; height: 100%; display: block; }",
    ".umeia-header-top { position: relative; z-index: 1; display: flex; align-items: center; justify-content: space-between; gap: 8px; }",
    ".umeia-header-left { display: flex; align-items: center; gap: 10px; min-width: 0; }",
    ".umeia-header-right { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }",
    ".umeia-avatar-wrap { position: relative; width: 36px; height: 36px; flex-shrink: 0; }",
    ".umeia-avatar-wrap img { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; display: block; }",
    ".umeia-online-dot {",
    "  position: absolute; right: -1px; bottom: -1px; width: 10px; height: 10px;",
    "  border-radius: 50%; background: #2ecc71; border: 2px solid " + ACCENT_COLOR + ";",
    "}",
    ".umeia-header-name { font-weight: 700; font-size: 14.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }",
    ".umeia-header-subtitle { font-size: 12px; color: rgba(255,255,255,.75); margin-top: 1px; display: flex; align-items: center; gap: 5px; }",
    ".umeia-header-subtitle::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #2ecc71; display: inline-block; }",
    // Decorative "team is online" cluster — no real teammates behind this
    // single-bot setup, so it's just three tinted circles, matching the
    // reference's look without pretending there are staff accounts.
    ".umeia-team-cluster { display: flex; align-items: center; }",
    ".umeia-team-avatar {",
    "  width: 20px; height: 20px; border-radius: 50%; margin-left: -8px;",
    "  border: 2px solid color-mix(in srgb, " + ACCENT_COLOR + " 55%, #140b28 45%);",
    "}",
    ".umeia-team-avatar:first-child { margin-left: 0; }",
    ".umeia-team-avatar:nth-child(1) { background: #ffb86c; }",
    ".umeia-team-avatar:nth-child(2) { background: #6c3ce0; }",
    ".umeia-team-avatar:nth-child(3) { background: #38bdf8; }",
    ".umeia-kebab {",
    "  background: transparent; border: none; color: rgba(255,255,255,.85); font-size: 16px; cursor: default;",
    "  line-height: 1; width: 22px; height: 22px; border-radius: 50%; flex-shrink: 0; letter-spacing: 1px;",
    "}",
    ".umeia-close {",
    "  background: rgba(255,255,255,.12); border: none; color: #fff; font-size: 18px; cursor: pointer;",
    "  line-height: 1; width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;",
    "}",
    ".umeia-close:hover { background: rgba(255,255,255,.22); }",
    ".umeia-greeting { position: relative; z-index: 1; margin-top: 14px; }",
    ".umeia-greeting-title { font-size: 18px; font-weight: 700; }",
    ".umeia-greeting-sub { font-size: 13px; color: rgba(255,255,255,.8); margin-top: 3px; }",

    ".umeia-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px; background: #f7f6fb; }",

    // Quick-reply card — pulled up over the header's bottom edge so it
    // reads as a floating panel rather than just another list in the feed.
    // Its height is driven frame-by-frame from messages scrollTop (see
    // updateQrCollapse), not a CSS transition, so it scrubs with the drag
    // instead of animating on a delay.
    ".umeia-quickreplies {",
    "  background: #fff; border-radius: 18px; box-shadow: 0 10px 30px rgba(20,10,50,0.18);",
    "  flex-shrink: 0; position: relative; z-index: 1; margin: -34px 14px 0; overflow: hidden;",
    "}",
    ".umeia-qr-full { padding: 12px; }",
    ".umeia-qr-collapsed {",
    "  position: absolute; inset: 0; display: flex; align-items: center; gap: 10px; padding: 0 14px;",
    "  opacity: 0; cursor: pointer;",
    "}",
    ".umeia-qr-collapsed-icon {",
    "  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;",
    "  background: color-mix(in srgb, " + ACCENT_COLOR + " 14%, white); display: flex; align-items: center; justify-content: center;",
    "}",
    ".umeia-qr-collapsed-icon svg { width: 13px; height: 13px; fill: " + ACCENT_COLOR + "; }",
    ".umeia-qr-collapsed-label { flex: 1; font-size: 13px; font-weight: 600; color: #201f26; }",
    ".umeia-qr-title { font-size: 12px; font-weight: 700; color: #9a98a5; padding: 4px 6px 10px; }",
    ".umeia-qr-item {",
    "  width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px; border: none;",
    "  background: #f4f2fa; border-radius: 12px; cursor: pointer; text-align: left; font-family: inherit;",
    "  margin-bottom: 8px; transition: background .15s ease;",
    "}",
    ".umeia-qr-item:last-child { margin-bottom: 0; }",
    ".umeia-qr-item:hover { background: color-mix(in srgb, " + ACCENT_COLOR + " 10%, #f4f2fa); }",
    ".umeia-qr-icon {",
    "  width: 30px; height: 30px; border-radius: 50%; flex-shrink: 0;",
    "  background: #fff; display: flex; align-items: center; justify-content: center;",
    "}",
    ".umeia-qr-icon svg { width: 15px; height: 15px; fill: " + ACCENT_COLOR + "; }",
    ".umeia-qr-label { flex: 1; font-size: 13px; color: #201f26; }",
    ".umeia-qr-chevron { color: #c3c1cc; font-size: 16px; }",

    ".umeia-date-divider { text-align: center; font-size: 11.5px; color: #a9a7b3; flex-shrink: 0; }",

    ".umeia-row { display: flex; gap: 8px; align-items: flex-end; }",
    ".umeia-row-user { justify-content: flex-end; }",
    ".umeia-row-avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }",
    ".umeia-msg-col { display: flex; flex-direction: column; max-width: 78%; }",
    ".umeia-row-user .umeia-msg-col { align-items: flex-end; }",
    ".umeia-msg { padding: 9px 13px; border-radius: 16px; font-size: 14px; line-height: 1.45; white-space: pre-wrap; word-wrap: break-word; }",
    ".umeia-msg.umeia-bot { background: #fff; color: #201f26; border-bottom-left-radius: 4px; box-shadow: 0 1px 3px rgba(20,10,50,0.08); }",
    ".umeia-msg.umeia-user { background: " + ACCENT_COLOR + "; color: #fff; border-bottom-right-radius: 4px; }",
    ".umeia-caption { font-size: 11px; color: #a09eab; margin-top: 4px; padding: 0 4px; display: flex; align-items: center; gap: 3px; }",
    ".umeia-check { color: " + ACCENT_COLOR + "; }",
    ".umeia-error-row { align-self: center; }",
    ".umeia-msg.umeia-error { background: #fde8e8; color: #a41c1c; border-radius: 12px; }",
    ".umeia-typing { align-self: flex-start; font-size: 13px; color: #9a98a5; padding: 2px 8px 2px 32px; }",

    ".umeia-inputrow { display: flex; align-items: center; gap: 8px; padding: 10px 12px; background: #fff; border-top: 1px solid #efedf5; flex-shrink: 0; }",
    ".umeia-pill {",
    "  flex: 1; display: flex; align-items: center; background: #f4f2fa; border-radius: 999px;",
    "  padding: 2px 4px 2px 14px; border: 1px solid transparent; transition: border-color .15s ease;",
    "}",
    ".umeia-pill:focus-within { border-color: " + ACCENT_COLOR + "; }",
    ".umeia-pill input {",
    "  flex: 1; border: none; background: transparent; padding: 9px 4px; font-size: 14px; outline: none; min-width: 0;",
    "}",
    ".umeia-send {",
    "  width: 34px; height: 34px; border-radius: 50%; border: none; cursor: pointer; flex-shrink: 0;",
    "  background: " + ACCENT_COLOR + "; display: flex; align-items: center; justify-content: center;",
    "  transition: transform .1s ease, opacity .15s ease;",
    "}",
    ".umeia-send:hover:not(:disabled) { transform: scale(1.05); }",
    ".umeia-send:disabled { opacity: 0.5; cursor: default; }",
    ".umeia-send svg { width: 15px; height: 15px; fill: #fff; margin-left: -1px; }",

    ".umeia-footer { text-align: center; font-size: 11px; color: #b3b1bd; padding: 6px 0 10px; background: #fff; flex-shrink: 0; }",
    ".umeia-footer a { color: #b3b1bd; }"
  ].join("\n");

  var host = document.createElement("div");
  host.id = "umeia-widget-host";
  document.body.appendChild(host);
  var shadow = host.attachShadow({ mode: "open" });

  var style = document.createElement("style");
  style.textContent = css;
  shadow.appendChild(style);

  var root = document.createElement("div");
  root.className = "umeia-root";
  shadow.appendChild(root);

  var bubbleWrap = document.createElement("div");
  bubbleWrap.className = "umeia-bubble-wrap";
  bubbleWrap.innerHTML =
    '<div class="umeia-bubble-glow"></div>' +
    '<button class="umeia-bubble" aria-label="Abrir chat"><img src="' + LOGO_SRC + '" alt="" /></button>' +
    '<span class="umeia-bubble-dot"></span>';
  root.appendChild(bubbleWrap);
  var bubble = bubbleWrap.querySelector(".umeia-bubble");

  function quickReplyHtml() {
    return QUICK_REPLIES.map(function (qr, idx) {
      return (
        '<button class="umeia-qr-item" data-qr-index="' + idx + '">' +
        '  <span class="umeia-qr-icon"><svg viewBox="0 0 24 24">' + (QR_ICONS[qr.icon] || QR_ICONS.chat) + "</svg></span>" +
        '  <span class="umeia-qr-label">' + qr.label + "</span>" +
        '  <span class="umeia-qr-chevron">›</span>' +
        "</button>"
      );
    }).join("");
  }

  var panel = document.createElement("div");
  panel.className = "umeia-panel";
  panel.innerHTML =
    '<div class="umeia-header">' +
    '  <div class="umeia-header-pattern">' + HEADER_PATTERN_SVG + "</div>" +
    '  <div class="umeia-header-top">' +
    '    <div class="umeia-header-left">' +
    '      <div class="umeia-avatar-wrap">' +
    '        <img src="' + LOGO_SRC + '" alt="" />' +
    '        <span class="umeia-online-dot"></span>' +
    "      </div>" +
    '      <div class="umeia-header-text">' +
    '        <div class="umeia-header-name">' + TITLE + "</div>" +
    '        <div class="umeia-header-subtitle">' + SUBTITLE + "</div>" +
    "      </div>" +
    "    </div>" +
    '    <div class="umeia-header-right">' +
    '      <div class="umeia-team-cluster">' +
    '        <span class="umeia-team-avatar"></span>' +
    '        <span class="umeia-team-avatar"></span>' +
    '        <span class="umeia-team-avatar"></span>' +
    "      </div>" +
    '      <button class="umeia-kebab" aria-hidden="true" tabindex="-1">⋮</button>' +
    '      <button class="umeia-close" aria-label="Cerrar chat">×</button>' +
    "    </div>" +
    "  </div>" +
    '  <div class="umeia-greeting">' +
    '    <div class="umeia-greeting-title">' + GREETING + "</div>" +
    '    <div class="umeia-greeting-sub">' + DESCRIPTION + "</div>" +
    "  </div>" +
    "</div>" +
    '<div class="umeia-quickreplies">' +
    '  <div class="umeia-qr-full">' +
    '    <div class="umeia-qr-title">Preguntas frecuentes</div>' +
    quickReplyHtml() +
    "  </div>" +
    '  <div class="umeia-qr-collapsed">' +
    '    <span class="umeia-qr-collapsed-icon"><svg viewBox="0 0 24 24">' + QR_ICONS.chat + "</svg></span>" +
    '    <span class="umeia-qr-collapsed-label">Preguntas frecuentes</span>' +
    '    <span class="umeia-qr-chevron">›</span>' +
    "  </div>" +
    "</div>" +
    '<div class="umeia-messages">' +
    '  <div class="umeia-date-divider">Hoy</div>' +
    "</div>" +
    '<div class="umeia-inputrow">' +
    '  <div class="umeia-pill"><input type="text" placeholder="Escribí tu mensaje..." /></div>' +
    '  <button class="umeia-send" aria-label="Enviar">' +
    '    <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>' +
    "  </button>" +
    "</div>" +
    '<div class="umeia-footer">Powered by <a href="https://umeia.io" target="_blank" rel="noopener">Umeia</a></div>';
  root.appendChild(panel);

  var messagesEl = panel.querySelector(".umeia-messages");
  var inputEl = panel.querySelector("input");
  var sendBtn = panel.querySelector(".umeia-send");
  var closeBtn = panel.querySelector(".umeia-close");
  var qrCard = panel.querySelector(".umeia-quickreplies");
  var qrFull = panel.querySelector(".umeia-qr-full");
  var qrCollapsed = panel.querySelector(".umeia-qr-collapsed");

  var transcript = loadTranscript();
  var conversationId = getConversationId();
  var sending = false;

  // Collapses the FAQ card into a slim pill as the visitor scrolls the
  // conversation, so the suggestions don't keep eating vertical space once
  // there's an actual chat to read. Height/opacity are set directly from
  // scrollTop on every scroll event (no CSS transition) so the collapse
  // tracks the drag 1:1 instead of animating on a delay.
  var QR_COLLAPSE_RANGE = 70;
  var QR_COLLAPSED_HEIGHT = 52;
  var qrNaturalHeight = 0;

  function updateQrCollapse() {
    var progress = Math.max(0, Math.min(1, messagesEl.scrollTop / QR_COLLAPSE_RANGE));
    var height = qrNaturalHeight + (QR_COLLAPSED_HEIGHT - qrNaturalHeight) * progress;
    qrCard.style.height = height + "px";
    qrFull.style.opacity = String(1 - progress);
    qrCollapsed.style.opacity = String(progress);
    qrCollapsed.style.pointerEvents = progress > 0.5 ? "auto" : "none";
  }

  messagesEl.addEventListener("scroll", updateQrCollapse, { passive: true });
  qrCollapsed.addEventListener("click", function () {
    messagesEl.scrollTo({ top: 0, behavior: "smooth" });
  });

  function renderMessage(role, text, ts) {
    if (role === "error") {
      var errRow = document.createElement("div");
      errRow.className = "umeia-row umeia-error-row";
      var errBubble = document.createElement("div");
      errBubble.className = "umeia-msg umeia-error";
      errBubble.textContent = text;
      errRow.appendChild(errBubble);
      messagesEl.appendChild(errRow);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return errRow;
    }

    var row = document.createElement("div");
    row.className = "umeia-row" + (role === "user" ? " umeia-row-user" : "");

    if (role === "bot") {
      var avatar = document.createElement("img");
      avatar.className = "umeia-row-avatar";
      avatar.src = LOGO_SRC;
      avatar.alt = "";
      row.appendChild(avatar);
    }

    var col = document.createElement("div");
    col.className = "umeia-msg-col";

    var bubbleEl = document.createElement("div");
    bubbleEl.className = "umeia-msg umeia-" + role;
    bubbleEl.textContent = text;
    col.appendChild(bubbleEl);

    var caption = document.createElement("div");
    caption.className = "umeia-caption";
    if (role === "bot") {
      caption.textContent = TITLE + " · " + formatTime(ts || Date.now());
    } else {
      caption.innerHTML = formatTime(ts || Date.now()) + ' <span class="umeia-check">✓</span>';
    }
    col.appendChild(caption);

    row.appendChild(col);
    messagesEl.appendChild(row);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return row;
  }

  function renderAll() {
    // The date divider is a permanent fixture, not part of the replayed
    // transcript — everything else gets rebuilt.
    var children = Array.prototype.slice.call(messagesEl.children);
    children.forEach(function (child) {
      if (!child.classList.contains("umeia-date-divider")) {
        child.remove();
      }
    });
    transcript.forEach(function (m) {
      renderMessage(m.role, m.text, m.ts);
    });
  }

  function pushMessage(role, text) {
    var ts = Date.now();
    transcript.push({ role: role, text: text, ts: ts });
    saveTranscript(transcript);
    renderMessage(role, text, ts);
  }

  function setSending(value) {
    sending = value;
    sendBtn.disabled = value;
    inputEl.disabled = value;
  }

  function sendToServer(text) {
    setSending(true);
    var typingEl = document.createElement("div");
    typingEl.className = "umeia-typing";
    typingEl.textContent = "Escribiendo...";
    messagesEl.appendChild(typingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;

    var url = API_BASE + "/webhook/webchat/message?tenant_id=" + encodeURIComponent(TENANT_ID);

    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: TENANT_ID,
        conversation_id: conversationId,
        message: text
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then(function (data) {
        typingEl.remove();
        if (data.conversation_id) {
          conversationId = data.conversation_id;
          localStorage.setItem(CONVERSATION_KEY, conversationId);
        }
        if (data.reply) {
          pushMessage("bot", data.reply);
        }
      })
      .catch(function (err) {
        typingEl.remove();
        console.error("[umeia-widget] request failed:", err);
        renderMessage("error", "No pudimos enviar tu mensaje. Probá de nuevo en un momento.");
      })
      .finally(function () {
        setSending(false);
        inputEl.focus();
      });
  }

  function handleSend() {
    var text = inputEl.value.trim();
    if (!text || sending) return;
    inputEl.value = "";
    pushMessage("user", text);
    sendToServer(text);
  }

  sendBtn.addEventListener("click", handleSend);
  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") handleSend();
  });

  panel.querySelectorAll(".umeia-qr-item").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var idx = Number(btn.getAttribute("data-qr-index"));
      var qr = QUICK_REPLIES[idx];
      if (!qr) return;
      pushMessage("user", qr.label);
      sendToServer(qr.label);
    });
  });

  var opened = false;
  function openPanel() {
    panel.classList.add("umeia-open");
    opened = true;
    // offsetHeight only resolves once the panel is actually laid out
    // (display:none ancestors report 0), so measure on open, not at init.
    qrNaturalHeight = qrFull.offsetHeight;
    updateQrCollapse();
    inputEl.focus();
  }

  function closePanel() {
    panel.classList.remove("umeia-open");
    opened = false;
  }

  bubble.addEventListener("click", function () {
    if (opened) closePanel();
    else openPanel();
  });
  closeBtn.addEventListener("click", closePanel);

  renderAll();
})();
