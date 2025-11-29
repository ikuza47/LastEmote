// config.js
window.LastEmoteConfig = {
  // General settings
  nickname: 'ikuza47',                    // Twitch channel name to monitor

  // Combo settings
  showCombo: true,                        // Show combo counter | false = hide
  comboFontSize: 240,                     // Combo text size in pixels
  fadeTimeout: 30000,                     // Time (ms) before emote fades | 0 = never fade
  minComboToShow: 5,                      // Minimum combo count to show emote | 0 = always show !! W.I.P
  comboText: 'x${comboCount}',            // Combo text format | default: 'x${comboCount}'

  // Appearance
  borderRadius: 12,                       // Image corner radius in pixels
  fontFamily: 'Inter, sans-serif',        // Font family for combo text
  fontColor: '#ffffff',                   // Combo text color (hex, rgb, or named color)

  // Positioning
  anchorX: 0,                             // Horizontal anchor | 0 = left | 1 = center | 2 = right
  anchorY: 0                              // Vertical anchor | 0 = bottom | 1 = center | 2 = top
};