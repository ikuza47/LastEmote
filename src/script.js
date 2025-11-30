// script.js
(() => {
  // Function to get URL parameters
  function getUrlParams() {
    const params = {};
    const urlParams = new URLSearchParams(window.location.search);

    for (const [key, value] of urlParams) {
      // Try to parse as number first, then boolean, otherwise keep as string
      let processedValue = value;

      // Check if it's a numeric value
      if (!isNaN(value) && value.trim() !== '') {
        processedValue = Number(value);
      }
      // Check if it's a boolean value
      else if (value.toLowerCase() === 'true') {
        processedValue = true;
      }
      else if (value.toLowerCase() === 'false') {
        processedValue = false;
      }

      params[key] = processedValue;
    }

    return params;
  }

  // Function to merge URL parameters with default config
  function mergeConfigWithUrlParams(defaultConfig) {
    const urlParams = getUrlParams();
    const mergedConfig = { ...defaultConfig };

    // Only merge parameters that exist in the default config
    for (const [key, value] of Object.entries(urlParams)) {
      if (key !== 'debugurl' && key in defaultConfig) { // Don't merge debugurl parameter
        mergedConfig[key] = value;
      }
    }

    return mergedConfig;
  }

  // Function to build URL with all config parameters for debugurl functionality
  function buildFullUrlWithParams(config) {
    const url = new URL(window.location.href);
    const existingParams = new URLSearchParams(url.search);

    // Update URL with all config parameters (except debugurl)
    for (const [key, value] of Object.entries(config)) {
      if (key !== 'debugurl') { // Don't add debugurl to the URL
        // Convert boolean and number values to string for URL
        existingParams.set(key, String(value));
      }
    }

    url.search = existingParams.toString();
    return url.toString();
  }

  // Get the initial config merged with URL parameters
  const cfg = mergeConfigWithUrlParams(window.LastEmoteConfig);

  // If debugurl is enabled and current URL doesn't have all parameters, redirect to full URL
  if (cfg.debugurl) {
    const currentUrlParams = getUrlParams();
    let needsRedirect = false;

    // Check if all default config keys (except debugurl) are present in URL
    for (const [key] of Object.entries(window.LastEmoteConfig)) {
      if (key !== 'debugurl' && !(key in currentUrlParams)) {
        needsRedirect = true;
        break;
      }
    }

    if (needsRedirect) {
      const fullUrl = buildFullUrlWithParams(window.LastEmoteConfig);
      window.location.replace(fullUrl);
      return; // Return early, page will reload with the new URL
    }
  }

  const LOG_PREFIX = "[7TV Tracker]";
  const log = (...args) => {
    console.log(LOG_PREFIX, ...args);
    if (cfg.debug) {
      addDebugLog(...args);
    }
  };
  const warn = (...args) => {
    console.warn(LOG_PREFIX, ...args);
    if (cfg.debug) {
      addDebugLog('WARN:', ...args);
    }
  };
  const error = (...args) => {
    console.error(LOG_PREFIX, ...args);
    if (cfg.debug) {
      addDebugLog('ERROR:', ...args);
    }
  };

  let chatEmotes = new Map();
  let globalEmotes = new Map();
  let twitchGlobalEmotes = new Map();
  let twitchSubscriberEmotes = new Map();
  let lastEmoteName = null;
  let comboCount = 0;
  let fadeTimer = null;
  let comboInterval = null;
  let isComboDecaying = false; // Track if combo is currently decreasing

  // === Добавление отладочного лога ===
  function addDebugLog(...args) {
    if (!cfg.debug) return;

    // Create debug container if it doesn't exist
    if (!debugLogContainer) {
      debugLogContainer = document.createElement('div');
      debugLogContainer.id = 'debug-log-container';
      debugLogContainer.className = 'debug-log-container';
      document.body.appendChild(debugLogContainer);
    }

    // Create log element
    const logElement = document.createElement('div');
    logElement.className = 'debug-log';

    // Convert args to string
    const logText = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    logElement.textContent = logText;

    // Clear previous log and add new one (so they appear in the same place)
    debugLogContainer.innerHTML = '';
    debugLogContainer.appendChild(logElement);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (debugLogContainer.contains(logElement)) {
        debugLogContainer.innerHTML = ''; // Clear the container when removing
      }
    }, 5000);
  }

  const emoteContainer = document.getElementById("emote-container");
  const emoteImg = document.getElementById("emote");
  const comboEl = document.getElementById("combo");

  // Debug logging container
  let debugLogContainer = null;

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

    // Цвет шрифта комбо
    comboEl.style.color = cfg.fontColor;

    // Семейство шрифтов комбо
    comboEl.style.fontFamily = cfg.fontFamily;

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

    // Z-index чтобы комбо было поверх всех элементов
    comboEl.style.zIndex = '9999';
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
    // Prefer webp files for better quality, but also check for animated formats
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
    if (!cfg.enable7tv) {
      log("❌ 7TV эмодзи отключены в конфигурации");
      return;
    }

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

  // === Загрузка Twitch эмодзи ===
  async function loadTwitchEmotes(twitchUserId, channelName) {
    try {
      // Загрузка глобальных Twitch эмодзи
      await loadTwitchGlobalEmotes();

      // Загрузка BTTV эмодзи - если включены
      if (cfg.enableBTTV) {
        await loadBTTVEmotes(channelName);
      }

      // Загрузка FFZ эмодзи - если включены
      if (cfg.enableFFZ) {
        await loadFFZEmotes(channelName);
      }
    } catch (e) {
      error("Ошибка при загрузке Twitch эмодзи:", e.message);
    }
  }

  // === Загрузка глобальных Twitch эмодзи ===
  async function loadTwitchGlobalEmotes() {
    try {
      // Загружаем BTTV глобальные эмодзи - если включены
      if (cfg.enableBTTV) {
        const globalRes = await fetch('https://api.betterttv.net/3/cached/emotes/global');
        if (globalRes.ok) {
          const data = await globalRes.json();
          for (const emote of data || []) {
            const url = `https://cdn.betterttv.net/emote/${emote.id}/3x`;
            // Используем отдельную коллекцию для BTTV глобальных эмодзи
            if (!twitchGlobalEmotes.has(emote.code)) {
              twitchGlobalEmotes.set(emote.code, url);
            }
          }
          log(`✅ Загружено ${data?.length || 0} BTTV глобальных эмодзи`);
        }
      }

      // Загружаем FFZ глобальные эмодзи - если включены
      if (cfg.enableFFZ) {
        const ffzGlobalRes = await fetch('https://api.frankerfacez.com/v1/set/global');
        if (ffzGlobalRes.ok) {
          const data = await ffzGlobalRes.json();
          for (const [setId, set] of Object.entries(data.sets || {})) {
            for (const emote of set.emoticons || []) {
              const url = emote.urls['4'] || emote.urls['2'] || emote.urls['1'];
              if (url) {
                const fullUrl = url.startsWith('http') ? url : `https:${url}`;
                if (!twitchGlobalEmotes.has(emote.name)) {
                  twitchGlobalEmotes.set(emote.name, fullUrl);
                }
              }
            }
          }
          log(`✅ Загружено FFZ глобальных эмодзи`);
        }
      }
    } catch (e) {
      error("Ошибка при загрузке глобальных эмодзи:", e.message);
    }
  }

  // === Загрузка BTTV эмодзи ===
  async function loadBTTVEmotes(channelName) {
    try {
      // Получаем ID пользователя Twitch
      const userId = await getTwitchUserId(channelName);
      if (!userId) {
        error("Не удалось получить ID пользователя Twitch для канала:", channelName);
        return;
      }

      // Загружаем эмодзи для канала
      const channelRes = await fetch(`https://api.betterttv.net/3/cached/users/twitch/${userId}`);
      if (channelRes.ok) {
        const data = await channelRes.json();
        const emotes = [...(data.channelEmotes || []), ...(data.sharedEmotes || [])];
        for (const emote of emotes) {
          // Use the proper BTTV URL format that supports animation
          const url = `https://cdn.betterttv.net/emote/${emote.id}/3x`;
          // Also store the original emote data to check for animated property if available
          twitchSubscriberEmotes.set(emote.code, url);
        }
        log(`✅ Загружено ${emotes.length} BTTV эмодзи канала ${channelName}`);
      }
    } catch (e) {
      error("Ошибка при загрузке BTTV эмодзи:", e.message);
    }
  }

  // === Загрузка FFZ эмодзи ===
  async function loadFFZEmotes(channelName) {
    try {
      // Загрузка FFZ эмодзи для канала
      const channelRes = await fetch(`https://api.frankerfacez.com/v1/room/${channelName}`);
      if (channelRes.ok) {
        const data = await channelRes.json();
        const sets = data.sets || {};
        for (const [setId, set] of Object.entries(sets)) {
          for (const emote of set.emoticons || []) {
            const url = emote.urls['4'] || emote.urls['2'] || emote.urls['1'];
            if (url) {
              const fullUrl = url.startsWith('http') ? url : `https:${url}`;
              twitchSubscriberEmotes.set(emote.name, fullUrl);
            }
          }
        }
        log(`✅ Загружено FFZ эмодзи канала ${channelName}`);
      }
    } catch (e) {
      error("Ошибка при загрузке FFZ эмодзи:", e.message);
    }
  }

  // === Сброс таймера исчезновения ===
  function resetFadeTimer() {
    if (cfg.fadeTimeout <= 0) return;
    if (fadeTimer) clearTimeout(fadeTimer);

    // Ensure emote container is visible when timer is reset
    if (emoteContainer.style.display === 'none') {
      emoteContainer.style.display = 'flex';
    }
    emoteContainer.style.opacity = '1';

    fadeTimer = setTimeout(() => {
      // If combo decay animation is disabled, immediately set combo to 0 and start fade
      if (!cfg.comboDecayAnimation) {
        comboCount = 0;
        comboEl.textContent = '';
        comboEl.style.display = 'none';

        // Remove any fire effect if present
        const fireEl = document.getElementById("fire");
        if (fireEl) {
          fireEl.remove();
        }

        // Apply fade out animation
        emoteContainer.style.opacity = '0';
        setTimeout(() => {
          if (emoteContainer.style.display !== 'none') {
            emoteContainer.style.display = 'none';
          }
          lastEmoteName = null;
        }, 800);
      } else {
        // Start combo decay first, then fade out when combo reaches 0
        resetCombo();
      }
    }, cfg.fadeTimeout);
  }

  // === Анимация уменьшения комбо ===
  function startComboDecay() {
    // Set flag to indicate combo is decaying
    isComboDecaying = true;

    if (comboInterval) {
      clearTimeout(comboInterval);
      comboInterval = null;
    }

    const decayStep = () => {
      if (comboCount > 0) {
        comboCount--;

        if (comboCount > 0) {
          // Update combo display
          comboEl.textContent = `x${comboCount}`;

          // Update fire effect if applicable
          updateFireEffect();

          // Schedule next decay step with updated interval
          const nextInterval = getComboDecayInterval();
          comboInterval = setTimeout(decayStep, nextInterval);
        } else {
          // Combo reached 0, hide the combo and apply fade effect to emote
          comboEl.textContent = '';
          comboEl.style.display = 'none';

          // Fade out the emote
          emoteContainer.style.opacity = '0';
          setTimeout(() => {
            if (emoteContainer.style.display !== 'none') {
              emoteContainer.style.display = 'none';
            }

            // Now reset lastEmoteName since the emote has completely faded
            lastEmoteName = null;
            // Also reset the decaying flag
            isComboDecaying = false;
          }, 800);

          // Remove any fire effect if present
          const fireEl = document.getElementById("fire");
          if (fireEl) {
            fireEl.remove();
          }

          comboInterval = null;
        }
      } else {
        comboInterval = null;
        // Reset the decaying flag
        isComboDecaying = false;
      }
    };

    const initialInterval = getComboDecayInterval();
    comboInterval = setTimeout(decayStep, initialInterval);
  }

  // === Получение интервала уменьшения комбо ===
  function getComboDecayInterval(currentCombo = comboCount) {
    // Calculate decay interval based on current combo (minimum 0.1s, maximum 0.5s)
    if (currentCombo <= 1) return 500; // Maximum delay when combo is small
    const decayInterval = 500 - (Math.min(currentCombo - 1, 40) * 10); // The higher the combo, the faster decay
    return Math.max(100, Math.min(500, decayInterval)); // Clamp between 100ms and 500ms (0.1s to 0.5s)
  }

  // === Обновление огненного эффекта ===
  function updateFireEffect() {
    const fireEl = document.getElementById("fire");

    // Check if fire should be shown based on the new parameter
    // Also check that combo display is enabled (if showCombo is false, don't show fire)
    if (!cfg.fireShow || !cfg.showCombo || comboCount < cfg.fireComboCount) {
      // Fire is disabled, combo display is disabled, or combo is below threshold, remove fire if it exists
      if (fireEl) {
        fireEl.remove();
      }
      return;
    }

    // Calculate fire size with enhanced scaling: at combo 16, it should be 2x the size of combo at fireComboCount threshold (5)
    // The size increases linearly from 1 (at threshold) to potentially 2 (at combo 16), but clamped to maxFire
    // When comboCount = fireComboCount (5), fireSize = 1
    // When comboCount = 16, fireSize = 2 (if maxFire >= 2)
    const fireSizeUnclamped = 1 + ((comboCount - cfg.fireComboCount) / 11);
    const fireSize = Math.min(cfg.maxFire, Math.max(1, fireSizeUnclamped));

    if (!fireEl) {
      // Create fire element if it doesn't exist
      createFireEffect(fireSize);
    } else {
      // Update existing fire element
      const baseSize = 50;
      const baseFontSize = 24;
      fireEl.style.width = `${fireSize * baseSize}px`;
      fireEl.style.height = `${fireSize * baseSize}px`;
      fireEl.style.fontSize = `${fireSize * baseFontSize}px`;
      fireEl.style.color = cfg.fontColor; // Apply font color to fire

      // Apply animation based on settings and combo state
      if (isComboDecaying || !cfg.fireAnimation) {
        fireEl.style.animation = 'none';
      } else {
        fireEl.style.animation = 'fireFlicker 0.8s infinite alternate';
      }
    }
  }

  // === Создание огненного эффекта ===
  function createFireEffect(size) {
    const fireEl = document.getElementById("fire");
    if (fireEl) fireEl.remove(); // Remove any existing fire element

    const fireElement = document.createElement('div');
    fireElement.id = 'fire';
    fireElement.textContent = cfg.fireEmoji; // Use custom fire emoji from config
    fireElement.style.position = 'absolute';
    fireElement.style.zIndex = '1';  // Put it behind both emote and combo
    fireElement.style.pointerEvents = 'none';
    fireElement.style.color = cfg.fontColor; // Apply font color to fire

    // Position the fire behind the combo, matching its alignment
    if (cfg.anchorX === 2) {
      fireElement.style.right = '10px';
      fireElement.style.left = 'auto';
    } else {
      fireElement.style.right = '10px';
      fireElement.style.left = 'auto';
    }

    // Position vertically based on anchorY setting
    if (cfg.anchorY === 2) { // top
      fireElement.style.top = '10px';
      fireElement.style.bottom = 'auto';
    } else if (cfg.anchorY === 1) { // center
      fireElement.style.top = '50%';
      fireElement.style.transform = 'translateY(-50%)';
    } else { // bottom (0)
      fireElement.style.bottom = '10px';
      fireElement.style.top = 'auto';
    }

    // Set size based on combo with enhanced scaling
    const fireSize = size || 1;
    const baseSize = 50; // Base size
    const baseFontSize = 24; // Base font size

    fireElement.style.width = `${fireSize * baseSize}px`;
    fireElement.style.height = `${fireSize * baseSize}px`;
    fireElement.style.fontSize = `${fireSize * baseFontSize}px`;

    // Add animation to make it look like fire (without rotation) if enabled
    if (cfg.fireAnimation) {
      fireElement.style.animation = 'fireFlicker 0.8s infinite alternate';
    } else {
      fireElement.style.animation = 'none';
    }

    emoteContainer.appendChild(fireElement);
  }

  // === Сброс комбо ===
  function resetCombo() {
    // If we have an active combo, start the decay animation
    if (comboCount > 0) {
      startComboDecay();
    } else {
      // Otherwise, just reset immediately
      comboCount = 0;
      comboEl.textContent = '';
      comboEl.style.display = 'none';
      // Don't reset lastEmoteName here so the same emote can still be detected

      // Remove any fire effect if present
      const fireEl = document.getElementById("fire");
      if (fireEl) {
        fireEl.remove();
      }
    }
  }

  // === Отображение эмодзи ===
  function showEmote(name, url) {
    if (!url) {
      emoteContainer.style.display = "none";
      return;
    }

    if (name === lastEmoteName) {
      // Check if combo is decaying and comboSave is enabled
      if (isComboDecaying && cfg.comboSave) {
        // If comboSave is true, sending the same emote during decay saves the combo
        // Don't increment, but reset the timer and stop decay
        if (comboInterval) {
          clearTimeout(comboInterval);
          comboInterval = null;
          isComboDecaying = false; // Reset the decaying flag
        }

        if (cfg.showCombo && comboCount > 1) {
          comboEl.textContent = `x${comboCount}`;
          comboEl.style.display = "block";
          if (cfg.comboPulseAnimation) {
            comboEl.style.animation = 'none';
            setTimeout(() => comboEl.style.animation = 'comboPulse 0.6s ease-out', 10);
          }
        }

        // Update fire effect if applicable
        updateFireEffect();

        // Make sure the emote container is visible
        emoteContainer.style.display = "flex";
        emoteContainer.style.opacity = "1";

        resetFadeTimer();
        return;
      } else if (isComboDecaying && !cfg.comboSave) {
        // If comboSave is false, same emote doesn't add to combo, but resets timer and doesn't disappear
        if (cfg.showCombo && comboCount > 1) {
          comboEl.textContent = `x${comboCount}`;
          comboEl.style.display = "block";
          if (cfg.comboPulseAnimation) {
            comboEl.style.animation = 'none';
            setTimeout(() => comboEl.style.animation = 'comboPulse 0.6s ease-out', 10);
          }
        }

        // Update fire effect if applicable
        updateFireEffect();

        // Make sure the emote container is visible
        emoteContainer.style.display = "flex";
        emoteContainer.style.opacity = "1";

        resetFadeTimer();
        return;
      } else {
        // Regular combo increment behavior
        comboCount++;
        if (cfg.showCombo && comboCount > 1) {
          comboEl.textContent = `x${comboCount}`;
          comboEl.style.display = "block";
          if (cfg.comboPulseAnimation) {
            comboEl.style.animation = 'none';
            setTimeout(() => comboEl.style.animation = 'comboPulse 0.6s ease-out', 10);
          }
        }

        // Update fire effect if applicable
        updateFireEffect();

        // Make sure the emote container is visible
        emoteContainer.style.display = "flex";
        emoteContainer.style.opacity = "1";

        resetFadeTimer();
        return;
      }
    }

    // If we're currently in a decay state, stop it when a new emote comes in
    if (isComboDecaying && comboInterval) {
      clearTimeout(comboInterval);
      comboInterval = null;
      isComboDecaying = false;
    }

    lastEmoteName = name;
    comboCount = 1;

    emoteImg.onload = () => {
      // Make sure the container is visible when we show a new emote
      emoteContainer.style.display = "flex";
      emoteContainer.style.opacity = "1";

      if (cfg.showCombo && comboCount > 1) {
        comboEl.textContent = `x${comboCount}`;
        comboEl.style.display = "block";
      } else {
        comboEl.style.display = "none";
      }

      // Update fire effect if applicable
      updateFireEffect();

      resetFadeTimer();
      log(`🖼️ Показан эмодзи: ${name}`);
    };
    emoteImg.onerror = () => {
      error("Не удалось загрузить эмодзи:", url);
      emoteContainer.style.display = "none";
    };

    // Force image reload to ensure animated emotes restart their animation
    // Add cache busting for animated emotes by adding a timestamp
    const timestamp = Date.now();
    const cacheBustedUrl = url + (url.includes('?') ? '&' : '?') + '_=' + timestamp;
    emoteImg.src = cacheBustedUrl;
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

      const ircTags = raw.split(' ')[0];
      const displayNameMatch = ircTags.match(/display-name=([^;]*)/);
      const rawTags = raw.split(' ')[0]; // Get the tags part from the raw message
      const tags = {};
      rawTags.substring(1).split(';').forEach(tag => {
        const [key, value] = tag.split('=');
        tags[key] = value || true;
      });

      const username = displayNameMatch?.[1] || 'unknown';
      const message = match[2];
      log(`💬 [${username}]: ${message}`);

      // Handle Twitch emotes from tags - they come in format like: emote_id:start-end,start2-end2
      let hasTwitchEmote = false;
      if (cfg.enableTwitch && tags['emotes']) {
        if (typeof(tags['emotes']) === 'string') {
          const emoteDataArray = tags['emotes'].split('/');
          for (const emoteData of emoteDataArray) {
            if (!emoteData) continue; // Skip empty strings
            const [emoteId, positions] = emoteData.split(':');
            if (!emoteId || !positions) continue;

            const positionPairs = positions.split(',');
            for (const pos of positionPairs) {
              const [start, end] = pos.split('-');
              if (start !== undefined && end !== undefined) {
                const startIdx = parseInt(start);
                const endIdx = parseInt(end);
                if (!isNaN(startIdx) && !isNaN(endIdx) && startIdx <= message.length && endIdx < message.length) {
                  // Get the emote code from the message at these positions
                  let emoteCode = message.substring(startIdx, endIdx + 1);

                  // Handle special case where there might be non-text characters
                  const emojis = new RegExp('[\u1000-\uFFFF]+', 'g');
                  let aux = message.replace(emojis, ' ');
                  emoteCode = aux.substring(startIdx, endIdx + 1).trim();

                  if (emoteCode) {
                    // Determine the correct URL format based on emote ID format
                    let emoteUrl;
                    // Check if emoteId is numeric (legacy Twitch) or UUID (newer format)
                    if (/^\d+$/.test(emoteId)) {
                      // Numeric ID format - old style
                      emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v1/${emoteId}/3.0`;
                    } else {
                      // UUID format - newer Twitch format (emotesv2_...)
                      emoteUrl = `https://static-cdn.jtvnw.net/emoticons/v2/${emoteId}/default/dark/3.0`;
                    }

                    log(`🖼️ Найден Twitch эмодзи: ${emoteCode} (ID: ${emoteId})`);
                    showEmote(emoteCode, emoteUrl);
                    hasTwitchEmote = true;
                    break; // Exit inner loops after showing first emote
                  }
                }
                if (hasTwitchEmote) break;
              }
              if (hasTwitchEmote) break;
            }
            if (hasTwitchEmote) break;
          }
        }
      }

      // If no Twitch emote was found in tags, fall back to other emote sources
      if (!hasTwitchEmote) {
        const words = message.split(/\s+/);
        for (const word of words) {
          const clean = word.replace(/[.,;:!?)]+$/, "");
          log(`🔍 Проверка: "${clean}"`);

          // Проверяем 7TV эмодзи (канальные) - если включены
          if (cfg.enable7tv && chatEmotes.has(clean)) {
            showEmote(clean, chatEmotes.get(clean));
            return;
          }
          // Проверяем 7TV эмодзи (глобальные) - если включены
          if (cfg.enable7tv && globalEmotes.has(clean)) {
            showEmote(clean, globalEmotes.get(clean));
            return;
          }
          // Проверяем BTTV/FFZ глобальные эмодзи - если включены
          if (cfg.enableBTTV && twitchGlobalEmotes.has(clean)) {
            showEmote(clean, twitchGlobalEmotes.get(clean));
            return;
          }
          // Проверяем BTTV/FFZ канал эмодзи - если включены
          if (cfg.enableBTTV && twitchSubscriberEmotes.has(clean)) {
            showEmote(clean, twitchSubscriberEmotes.get(clean));
            return;
          }
          // Also check FFZ emotes if enabled
          if (cfg.enableFFZ && twitchGlobalEmotes.has(clean)) {
            showEmote(clean, twitchGlobalEmotes.get(clean));
            return;
          }
          if (cfg.enableFFZ && twitchSubscriberEmotes.has(clean)) {
            showEmote(clean, twitchSubscriberEmotes.get(clean));
            return;
          }
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
    await loadTwitchEmotes(userId, cfg.nickname);
    connectToTwitchChat(cfg.nickname);
  })();
})();