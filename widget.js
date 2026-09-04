/**
 * Umeia webchat widget — floating chat bubble embeddable on any website.
 *
 * Embed with:
 *   <script src="https://widget.umeia.io/widget.js" data-tenant="infoumeiaio" async></script>
 *
 * Optional data-attributes on the same <script> tag:
 *   data-api-base   umeiacore base URL (default: https://umeia.space)
 *   data-color      accent color, any valid CSS color (default: #6c3ce0)
 *   data-position   "bottom-right" | "bottom-left" (default: bottom-right)
 *   data-title      header title (default: "Umeia")
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

  var css = [
    ":host, .umeia-root { all: initial; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }",
    ".umeia-root * { box-sizing: border-box; }",
    ".umeia-bubble {",
    "  position: fixed; bottom: 20px; " + POSITION + ": 20px; z-index: 2147483000;",
    "  width: 60px; height: 60px; border-radius: 50%; border: none; cursor: pointer;",
    "  background: " + ACCENT_COLOR + "; box-shadow: 0 4px 14px rgba(0,0,0,0.25);",
    "  display: flex; align-items: center; justify-content: center; transition: transform .15s ease;",
    "}",
    ".umeia-bubble:hover { transform: scale(1.06); }",
    ".umeia-bubble svg { width: 28px; height: 28px; fill: #fff; }",
    ".umeia-panel {",
    "  position: fixed; bottom: 92px; " + POSITION + ": 20px; z-index: 2147483000;",
    "  width: 340px; max-width: calc(100vw - 40px); height: 480px; max-height: calc(100vh - 140px);",
    "  background: #fff; border-radius: 14px; box-shadow: 0 8px 30px rgba(0,0,0,0.25);",
    "  display: none; flex-direction: column; overflow: hidden;",
    "}",
    ".umeia-panel.umeia-open { display: flex; }",
    ".umeia-header {",
    "  background: " + ACCENT_COLOR + "; color: #fff; padding: 14px 16px;",
    "  display: flex; align-items: center; justify-content: space-between; font-weight: 600; font-size: 15px;",
    "}",
    ".umeia-header button { background: transparent; border: none; color: #fff; font-size: 20px; cursor: pointer; line-height: 1; padding: 0 4px; }",
    ".umeia-messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 8px; background: #f7f7f9; }",
    ".umeia-msg { max-width: 82%; padding: 9px 12px; border-radius: 12px; font-size: 14px; line-height: 1.4; white-space: pre-wrap; word-wrap: break-word; }",
    ".umeia-msg.umeia-bot { align-self: flex-start; background: #fff; color: #222; border-bottom-left-radius: 3px; box-shadow: 0 1px 2px rgba(0,0,0,0.08); }",
    ".umeia-msg.umeia-user { align-self: flex-end; background: " + ACCENT_COLOR + "; color: #fff; border-bottom-right-radius: 3px; }",
    ".umeia-msg.umeia-error { align-self: flex-start; background: #fde8e8; color: #a41c1c; }",
    ".umeia-typing { align-self: flex-start; font-size: 13px; color: #888; padding: 2px 4px; }",
    ".umeia-inputrow { display: flex; border-top: 1px solid #eee; padding: 8px; gap: 8px; background: #fff; }",
    ".umeia-inputrow input {",
    "  flex: 1; border: 1px solid #ddd; border-radius: 20px; padding: 9px 14px; font-size: 14px; outline: none;",
    "}",
    ".umeia-inputrow input:focus { border-color: " + ACCENT_COLOR + "; }",
    ".umeia-inputrow button {",
    "  background: " + ACCENT_COLOR + "; color: #fff; border: none; border-radius: 20px; padding: 0 16px; font-size: 14px; cursor: pointer;",
    "}",
    ".umeia-inputrow button:disabled { opacity: 0.5; cursor: default; }",
    ".umeia-footer { text-align: center; font-size: 11px; color: #999; padding: 4px 0 8px; background: #fff; }",
    ".umeia-footer a { color: #999; }"
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

  var bubble = document.createElement("button");
  bubble.className = "umeia-bubble";
  bubble.setAttribute("aria-label", "Abrir chat");
  bubble.innerHTML =
    '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
  root.appendChild(bubble);

  var panel = document.createElement("div");
  panel.className = "umeia-panel";
  panel.innerHTML =
    '<div class="umeia-header">' +
    "  <span>" + TITLE + "</span>" +
    '  <button class="umeia-close" aria-label="Cerrar chat">×</button>' +
    "</div>" +
    '<div class="umeia-messages"></div>' +
    '<div class="umeia-inputrow">' +
    '  <input type="text" placeholder="Escribí tu mensaje..." />' +
    "  <button>Enviar</button>" +
    "</div>" +
    '<div class="umeia-footer">Powered by <a href="https://umeia.io" target="_blank" rel="noopener">Umeia</a></div>';
  root.appendChild(panel);

  var messagesEl = panel.querySelector(".umeia-messages");
  var inputEl = panel.querySelector("input");
  var sendBtn = panel.querySelector(".umeia-inputrow button");
  var closeBtn = panel.querySelector(".umeia-close");

  var transcript = loadTranscript();
  var conversationId = getConversationId();
  var sending = false;

  function renderMessage(role, text) {
    var el = document.createElement("div");
    el.className = "umeia-msg umeia-" + role;
    el.textContent = text;
    messagesEl.appendChild(el);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return el;
  }

  function renderAll() {
    messagesEl.innerHTML = "";
    transcript.forEach(function (m) {
      renderMessage(m.role, m.text);
    });
  }

  function pushMessage(role, text) {
    transcript.push({ role: role, text: text });
    saveTranscript(transcript);
    renderMessage(role, text);
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

  var opened = false;
  function openPanel() {
    panel.classList.add("umeia-open");
    opened = true;
    if (transcript.length === 0) {
      // First time this visitor opens the widget — trigger the bot's own
      // greeting instead of showing an empty panel.
      sendToServer("hola");
    }
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
