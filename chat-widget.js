/**
 * Merchant AI Group — AI Receptionist Widget
 * Embeddable chat widget. Drop this on any site:
 *
 *   <script src="https://your-domain.com/chat-widget.js"
 *           data-api-url="https://your-backend.com/api/chat"
 *           data-lang="auto"></script>
 *
 * No dependencies. Self-contained via Shadow DOM so it never collides
 * with the host site's CSS.
 */
(function () {
  "use strict";

  const scriptTag = document.currentScript;
  const API_URL = scriptTag?.dataset.apiUrl || "/api/chat";
  const DEFAULT_LANG = scriptTag?.dataset.lang || "auto";
  const AUTO_OPEN = scriptTag?.dataset.autoOpen === "true";
  const AUTO_OPEN_DELAY = parseInt(scriptTag?.dataset.autoOpenDelay || "3000", 10);
  const LOGO_URL = scriptTag?.dataset.logoUrl || "";

  const COPY = {
    en: {
      greeting: "Hi, I'm an AI — the receptionist for Merchant AI Group. What can I help you automate?",
      placeholder: "Type a message…",
      title: "Merchant AI Group",
      subtitle: "AI Receptionist · Online now",
      send: "Send",
    },
    es: {
      greeting: "Hola, soy una IA — la recepcionista de Merchant AI Group. ¿Qué te gustaría automatizar?",
      placeholder: "Escribe un mensaje…",
      title: "Merchant AI Group",
      subtitle: "Recepcionista IA · En línea",
      send: "Enviar",
    },
    fr: {
      greeting: "Bonjour, je suis une IA — la réceptionniste de Merchant AI Group. Que souhaitez-vous automatiser ?",
      placeholder: "Écrivez un message…",
      title: "Merchant AI Group",
      subtitle: "Réceptionniste IA · En ligne",
      send: "Envoyer",
    },
    de: {
      greeting: "Hallo, ich bin eine KI — die Rezeption von Merchant AI Group. Was möchten Sie automatisieren?",
      placeholder: "Nachricht schreiben…",
      title: "Merchant AI Group",
      subtitle: "KI-Rezeption · Online",
      send: "Senden",
    },
    nl: {
      greeting: "Hoi, ik ben een AI — de receptioniste van Merchant AI Group. Wat wil je automatiseren?",
      placeholder: "Typ een bericht…",
      title: "Merchant AI Group",
      subtitle: "AI-receptioniste · Online",
      send: "Verzenden",
    },
  };

  function detectLang() {
    if (DEFAULT_LANG !== "auto") return DEFAULT_LANG;
    const nav = (navigator.language || "en").slice(0, 2).toLowerCase();
    return COPY[nav] ? nav : "en";
  }

  const lang = detectLang();
  const t = COPY[lang];

  // ---- Host + Shadow root -------------------------------------------------
  const host = document.createElement("div");
  host.id = "mag-ai-receptionist-root";
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: "open" });

  const style = document.createElement("style");
  style.textContent = `
    :host, * { box-sizing: border-box; }
    .mag-fab {
      position: fixed; bottom: 24px; right: 24px; width: 62px; height: 62px;
      border-radius: 50%; background: radial-gradient(circle at 35% 30%, #3ddcff, #0e8fae 70%);
      box-shadow: 0 6px 24px rgba(61,220,255,0.45), 0 0 0 1px rgba(255,255,255,0.08) inset;
      border: none; cursor: pointer; z-index: 999999; display: flex;
      align-items: center; justify-content: center; transition: transform .2s ease;
    }
    .mag-fab:hover { transform: scale(1.06); }
    .mag-fab svg { width: 28px; height: 28px; }
    .mag-fab img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
    .mag-header-logo { width: 30px; height: 30px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
    .mag-panel {
      position: fixed; bottom: 100px; right: 24px; width: 370px; max-width: calc(100vw - 32px);
      height: 540px; max-height: calc(100vh - 140px);
      background: #0a0e17; border-radius: 16px; overflow: hidden;
      box-shadow: 0 20px 60px rgba(0,0,0,0.55), 0 0 0 1px rgba(61,220,255,0.15);
      display: flex; flex-direction: column; z-index: 999999;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      opacity: 0; transform: translateY(16px); pointer-events: none;
      transition: opacity .22s ease, transform .22s ease;
    }
    .mag-panel.open { opacity: 1; transform: translateY(0); pointer-events: all; }
    .mag-header {
      background: linear-gradient(135deg, #0d1220, #0a0e17);
      border-bottom: 1px solid rgba(61,220,255,0.18);
      padding: 16px 18px; display: flex; align-items: center; gap: 10px;
    }
    .mag-dot { width: 9px; height: 9px; border-radius: 50%; background: #3ddcff; box-shadow: 0 0 8px #3ddcff; }
    .mag-title { color: #fff; font-size: 14px; font-weight: 600; letter-spacing: 0.3px; }
    .mag-subtitle { color: #7d8aa3; font-size: 11px; margin-top: 1px; }
    .mag-close {
      margin-left: auto; background: none; border: none; color: #7d8aa3;
      cursor: pointer; font-size: 18px; line-height: 1; padding: 4px;
    }
    .mag-close:hover { color: #fff; }
    .mag-messages {
      flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px;
      background: #0a0e17;
    }
    .mag-messages::-webkit-scrollbar { width: 6px; }
    .mag-messages::-webkit-scrollbar-thumb { background: #1c2436; border-radius: 3px; }
    .mag-msg { max-width: 82%; padding: 10px 13px; border-radius: 13px; font-size: 13.5px; line-height: 1.45; }
    .mag-msg.bot {
      background: #131a29; color: #e7ecf5; align-self: flex-start; border-bottom-left-radius: 4px;
    }
    .mag-msg.user {
      background: linear-gradient(135deg, #2fb8d6, #1a7f9c); color: #fff; align-self: flex-end; border-bottom-right-radius: 4px;
    }
    .mag-typing { align-self: flex-start; display: flex; gap: 4px; padding: 10px 13px; }
    .mag-typing span { width: 6px; height: 6px; border-radius: 50%; background: #4a5875; animation: mag-bounce 1.2s infinite ease-in-out; }
    .mag-typing span:nth-child(2) { animation-delay: .15s; }
    .mag-typing span:nth-child(3) { animation-delay: .3s; }
    @keyframes mag-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-4px); opacity: 1; } }
    .mag-inputrow {
      display: flex; gap: 8px; padding: 12px; border-top: 1px solid rgba(61,220,255,0.12);
      background: #0d1220;
    }
    .mag-input {
      flex: 1; background: #131a29; border: 1px solid #1c2436; border-radius: 10px;
      color: #fff; padding: 10px 12px; font-size: 13.5px; outline: none; font-family: inherit;
    }
    .mag-input:focus { border-color: #3ddcff; }
    .mag-send {
      background: #3ddcff; border: none; border-radius: 10px; width: 40px; height: 40px;
      cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .mag-send:hover { background: #5ee4ff; }
    .mag-send svg { width: 17px; height: 17px; }
    .mag-footer { text-align: center; font-size: 10px; color: #4a5875; padding: 6px 0 10px; background: #0d1220; }
  `;
  shadow.appendChild(style);

  // ---- Markup ---------------------------------------------------------------
  const fab = document.createElement("button");
  fab.className = "mag-fab";
  fab.setAttribute("aria-label", "Open chat");
  fab.innerHTML = LOGO_URL
    ? `<img src="${LOGO_URL}" alt="Merchant AI Group" />`
    : `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.03 2 11c0 2.6 1.23 4.94 3.2 6.6L4 22l4.72-1.53C9.77 20.8 10.87 21 12 21c5.52 0 10-4.03 10-9S17.52 2 12 2z" fill="#06121a"/>
  </svg>`;

  const panel = document.createElement("div");
  panel.className = "mag-panel";
  panel.innerHTML = `
    <div class="mag-header">
      ${LOGO_URL ? `<img src="${LOGO_URL}" alt="Merchant AI Group" class="mag-header-logo" />` : `<span class="mag-dot"></span>`}
      <div>
        <div class="mag-title">${t.title}</div>
        <div class="mag-subtitle">${t.subtitle}</div>
      </div>
      <button class="mag-close" aria-label="Close">✕</button>
    </div>
    <div class="mag-messages"></div>
    <div class="mag-inputrow">
      <input class="mag-input" type="text" placeholder="${t.placeholder}" />
      <button class="mag-send" aria-label="${t.send}">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 20l18-8L3 4v6l12 2-12 2v6z" fill="#06121a"/>
        </svg>
      </button>
    </div>
    <div class="mag-footer">Powered by Merchant AI Group</div>
  `;

  shadow.appendChild(panel);
  shadow.appendChild(fab);

  const messagesEl = panel.querySelector(".mag-messages");
  const inputEl = panel.querySelector(".mag-input");
  const sendBtn = panel.querySelector(".mag-send");
  const closeBtn = panel.querySelector(".mag-close");

  let open = false;
  let history = []; // { role: 'user'|'assistant', content: string }
  let sessionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
  const shownBookingUrls = new Set();

  function toggle() {
    open = !open;
    panel.classList.toggle("open", open);
    if (open && messagesEl.children.length === 0) {
      addMessage("bot", t.greeting);
      inputEl.focus();
    }
  }

  fab.addEventListener("click", toggle);
  closeBtn.addEventListener("click", toggle);

  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = `mag-msg ${role}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showTyping() {
    const div = document.createElement("div");
    div.className = "mag-typing";
    div.innerHTML = "<span></span><span></span><span></span>";
    div.id = "mag-typing-indicator";
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
  function hideTyping() {
    const el = shadow.getElementById
      ? shadow.getElementById("mag-typing-indicator")
      : messagesEl.querySelector("#mag-typing-indicator");
    if (el) el.remove();
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    addMessage("user", text);
    history.push({ role: "user", content: text });
    showTyping();

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, lang, message: text, history }),
      });
      const data = await res.json();
      hideTyping();
      const reply = data.reply || "Sorry, something went wrong. Please try again.";
      addMessage("bot", reply);
      history.push({ role: "assistant", content: reply });

      // Backend can signal booking confirmation to show a link/button —
      // only show it the first time we see this specific booking URL.
      if (data.bookingUrl && !shownBookingUrls.has(data.bookingUrl)) {
        shownBookingUrls.add(data.bookingUrl);
        const link = document.createElement("a");
        link.href = data.bookingUrl;
        link.target = "_blank";
        link.textContent = "📅 Confirm your booking";
        link.style.cssText =
          "display:inline-block;margin-top:4px;color:#3ddcff;font-size:13px;text-decoration:underline;align-self:flex-start;";
        messagesEl.appendChild(link);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    } catch (err) {
      hideTyping();
      addMessage("bot", "Connection issue — please try again in a moment.");
      console.error("MAG widget error:", err);
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  if (AUTO_OPEN) {
    setTimeout(() => {
      if (!open) toggle();
    }, AUTO_OPEN_DELAY);
  }
})();
