// script.js
(() => {
  const cfg = window.LastEmoteConfig;

  const LOG_PREFIX = "[7TV Tracker]";
  const log = (...args) => console.log(LOG_PREFIX, ...args);
  const warn = (...args) => console.warn(LOG_PREFIX, ...args);
  const error = (...args) => console.error(LOG_PREFIX, ...args);

  let chatEmotes = new Map();
  let globalEmotes = new Map();
  let lastEmoteName = null;
  let comboCount = 0;
  let fadeTimer = null;

  const emoteContainer = document.getElementById("emote-container");
  const emoteImg = document.getElementById("emote");
  const comboEl = document.getElementById("combo");

  // === Применение настроек ===
  function applyConfig() {
    // Позиционирование
    let left = '0', right = 'auto', top = 'auto', bottom = '0';
    if (cfg.anchorX === 1) {
      left = '50%';
      emoteContainer.style.transform = 'translateX(-50%)';
    } else if (cfg.anchorX === 2) {
      right = '0';
      left = 'auto';
    }

    if (cfg.anchorY === 1) {
      top = '50%';
      bottom = 'auto';
      emoteContainer.style.transform += ' translateY(-50%)';
    } else if (cfg.anchorY === 2) {
      top = '0';
      bottom = 'auto';
    }

    emoteContainer.style.left = left;
    emoteContainer.style.right = right;
    emoteContainer.style.top = top;
    emoteContainer.style.bottom = bottom;

    // Размер контейнера
    emoteContainer.style.width = '100vh';
    emoteContainer.style.height = '100vh';
    emoteContainer.style.maxWidth = '100vw';
    emoteContainer.style.maxHeight = '100vh';

    // Скругление
    emoteImg.style.borderRadius = `${cfg.borderRadius}px`;

    // Размер комбо
    comboEl.style.fontSize = `${cfg.comboFontSize}px`;

    // Позиция комбо
    if (cfg.anchorX === 2) {
      comboEl.style.left = '10px';
      comboEl.style.right = 'auto';
    } else {
      comboEl.style.right = '10px';
      comboEl.style.left = 'auto';
    }
    comboEl.style.bottom = '10px';
    comboEl.style.top = 'auto';
  }

  // === Получение Twitch User ID ===
  async function getTwitchUserId(username) {
    try {
      const res = await fetch(`https://api.ivr.fi/v2/twitch/user?login=${encodeURIComponent(username)}`);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const data = await res.json();
      return Array.isArray(data) && data[0]?.id ? data[0].id : null;
    } catch (e) {
      error("Не удалось получить Twitch User ID:", e.message);
      return null;
    }
  }

  // === Построение URL эмодзи ===
  function buildEmoteUrl(emoteData) {
    if (!emoteData?.host?.files?.length) return null;
    const webpFiles = emoteData.host.files.filter(f => f.format === 'WEBP');
    if (webpFiles.length === 0) return null;
    webpFiles.sort((a, b) => a.width - b.width);
    const best = webpFiles[webpFiles.length - 1];
    const baseUrl = Array.isArray(emoteData.host.url)
      ? emoteData.host.url[0]
      : emoteData.host.url;
    return `https:${baseUrl}/${best.name}`;
  }

  // === Загрузка эмодзи ===
  async function load7TVEmotes(twitchUserId) {
    try {
      // Глобальные
      const globalRes = await fetch('https://7tv.io/v3/emote-sets/global');
      if (globalRes.ok) {
        const data = await globalRes.json();
        for (const emote of data.emotes || []) {
          const url = buildEmoteUrl(emote);
          if (url) globalEmotes.set(emote.name, url);
        }
        log(`✅ Загружено ${globalEmotes.size} глобальных эмодзи`);
      }

      // Канальные
      const channelRes = await fetch(`https://7tv.io/v3/users/twitch/${twitchUserId}`);
      if (channelRes.ok) {
        const data = await channelRes.json();
        const emotes = data?.emote_set?.emotes || [];
        for (const emote of emotes) {
          const url = buildEmoteUrl(emote.data);
          if (url) chatEmotes.set(emote.name, url);
        }
        log(`✅ Загружено ${chatEmotes.size} канальных эмодзи`);
      }
    } catch (e) {
      error("Ошибка при загрузке 7TV эмодзи:", e.message);
    }
  }

  // === Сброс таймера исчезновения ===
  function resetFadeTimer() {
    if (cfg.fadeTimeout <= 0) return;
    if (fadeTimer) clearTimeout(fadeTimer);
    fadeTimer = setTimeout(() => {
      emoteContainer.style.opacity = '0';
      setTimeout(() => {
        if (emoteContainer.style.display !== 'none') {
          emoteContainer.style.display = 'none';
        }
      }, 800);
    }, cfg.fadeTimeout);
  }

  // === Отображение эмодзи ===
  function showEmote(name, url) {
    if (!url) {
      emoteContainer.style.display = "none";
      return;
    }

    if (name === lastEmoteName) {
      comboCount++;
      if (cfg.showCombo && comboCount > 1) {
        comboEl.textContent = `x${comboCount}`;
        comboEl.style.display = "block";
        comboEl.style.animation = 'none';
        setTimeout(() => comboEl.style.animation = 'comboPulse 0.6s ease-out', 10);
      }
      resetFadeTimer();
      return;
    }

    lastEmoteName = name;
    comboCount = 1;

    emoteImg.onload = () => {
      emoteContainer.style.display = "flex";
      emoteContainer.style.opacity = "1";

      if (cfg.showCombo && comboCount > 1) {
        comboEl.textContent = `x${comboCount}`;
        comboEl.style.display = "block";
      } else {
        comboEl.style.display = "none";
      }
      resetFadeTimer();
      log(`🖼️ Показан эмодзи: ${name}`);
    };
    emoteImg.onerror = () => {
      error("Не удалось загрузить эмодзи:", url);
      emoteContainer.style.display = "none";
    };
    emoteImg.src = url;
  }

  // === Подключение к Twitch IRC ===
  function connectToTwitchChat(channel) {
    const ws = new WebSocket("wss://irc-ws.chat.twitch.tv:443");
    ws.onopen = () => {
      ws.send("CAP REQ :twitch.tv/tags twitch.tv/commands");
      ws.send("PASS SCHMOOPIIE");
      ws.send("NICK justinfan12345");
      ws.send(`JOIN #${channel}`);
      log(`📥 Подключено к чату #${channel}`);
    };
    ws.onmessage = (event) => {
      const raw = event.data;
      if (raw.startsWith("PING")) {
        ws.send("PONG :tmi.twitch.tv");
        return;
      }
      if (!raw.includes("PRIVMSG")) return;

      const match = raw.match(/@([^;]+).+PRIVMSG #[^ ]+ :(.+)/);
      if (!match) return;

      const tags = raw.split(' ')[0];
      const displayNameMatch = tags.match(/display-name=([^;]*)/);
      const username = displayNameMatch?.[1] || 'unknown';
      const message = match[2];
      log(`💬 [${username}]: ${message}`);

      const words = message.split(/\s+/);
      for (const word of words) {
        const clean = word.replace(/[.,;:!?)]+$/, "");
        log(`🔍 Проверка: "${clean}"`);

        if (chatEmotes.has(clean)) {
          showEmote(clean, chatEmotes.get(clean));
          return;
        }
        if (globalEmotes.has(clean)) {
          showEmote(clean, globalEmotes.get(clean));
          return;
        }
      }
    };
    ws.onerror = (e) => error("WebSocket ошибка:", e);
    ws.onclose = () => {
      warn("Соединение закрыто. Переподключение через 5 сек...");
      setTimeout(() => connectToTwitchChat(channel), 5000);
    };
  }

  // === Запуск ===
  (async () => {
    log("🚀 Запуск для:", cfg.nickname);
    applyConfig();

    const userId = await getTwitchUserId(cfg.nickname);
    if (!userId) {
      error("Остановка: не найден Twitch User ID");
      return;
    }

    await load7TVEmotes(userId);
    connectToTwitchChat(cfg.nickname);
  })();
})();