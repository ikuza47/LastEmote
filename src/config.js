// Configuration file for LastEmote
window.LastEmoteConfig = {
  // General settings
  nickname: 'ikuza47',                    // Twitch channel name to monitor
  fadeTimeout: 10000,                      // Time (ms) before emote fades | 0 = never fade

  // Appearance settings
  borderRadius: 12,                       // Image corner radius in pixels
  fontFamily: 'Inter',        // Font family for combo text
  fontColor: '#ffffffff',                 // Combo text color (hex, rgb, or named color)

  // Combo settings
  showCombo: true,                        // Show combo counter | false = hide
  comboFontSize: 240,                     // Combo text size in pixels
  comboSave: true,                        // Whether sending same emote during decay saves combo

  // Positioning
  anchorX: 0,                             // Horizontal anchor | 0 = left | 1 = center | 2 = right
  anchorY: 0,                             // Vertical anchor | 0 = bottom | 1 = center | 2 = top

  // Fire effect settings
  fireShow: true,                         // Enable fire effect
  fireComboCount: 5,                      // Combo threshold to show fire effect
  fireEmoji: '🔥',                         // Emoji to show as fire effect
  maxFire: 8,                             // Maximum fire size

  // Animation settings
  comboPulseAnimation: true,              // Enable combo pulse animation when incremented
  fireAnimation: true,                    // Enable fire animation
  comboDecayAnimation: true,              // Enable combo decay animation (if false, combo immediately goes to 0 when timer expires),

  // Debug settings
  debug: false,                           // Enable debug logging
  debugurl: false                         // Enable debug URL - automatically populate all parameters in URL
};