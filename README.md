# LastEmote

A Twitch emote tracker that displays the last used emote from chat with combo counter and animations.

## Features

- **7TV Emotes Support**: Displays both global and channel-specific 7TV emotes
- **Twitch Native Emotes**: Supports Twitch native emotes from IRC tags
- **BTTV & FFZ Support**: Additional support for BetterTTV and FrankerFaceZ emotes (configurable)
- **Combo Counter**: Tracks consecutive emote usage with visual counter
- **Fire Effect**: Special fire animation when combo reaches threshold
- **Configurable Settings**: Customizable appearance, positioning, and animation options
- **Emote Platform Selection**: Toggle individual emote platforms (7TV, Twitch, BTTV, FFZ)
- **Local Config via URL**: All parameters can be overridden through URL parameters


## Installation

1. Download the latest release from the releases page
2. Extract the files to your desired location
3. Open `index.html` in your browser or load as a browser source in OBS

## Configuration

Edit `config.js` to customize the application:

```javascript
window.LastEmoteConfig = {
  // General settings
  nickname: 'your_channel_name',           // Twitch channel name to monitor
  fadeTimeout: 10000,                      // Time (ms) before emote fades | 0 = never fade

  // Emote platform settings
  enable7tv: true,                         // Enable 7TV emotes (default: true)
  enableTwitch: true,                      // Enable Twitch native emotes (default: true)
  enableBTTV: false,                       // Enable BTTV emotes (default: false)
  enableFFZ: false,                        // Enable FFZ emotes (default: false)

  // Appearance settings
  borderRadius: 12,                        // Image corner radius in pixels
  fontFamily: 'Inter',                     // Font family for combo text
  fontColor: '#ffffffff',                  // Combo text color (hex, rgb, or named color)

  // Combo settings
  showCombo: true,                         // Show combo counter | false = hide
  comboFontSize: 240,                      // Combo text size in pixels
  comboSave: true,                         // Whether sending same emote during decay saves combo

  // Positioning
  anchorX: 0,                              // Horizontal anchor | 0 = left | 1 = center | 2 = right
  anchorY: 0,                              // Vertical anchor | 0 = bottom | 1 = center | 2 = top

  // Fire effect settings
  fireShow: true,                          // Enable fire effect
  fireComboCount: 5,                       // Combo threshold to show fire effect
  fireEmoji: '🔥',                          // Emoji to show as fire effect
  maxFire: 8,                              // Maximum fire size

  // Animation settings
  comboPulseAnimation: true,               // Enable combo pulse animation when incremented
  fireAnimation: true,                     // Enable fire animation
  comboDecayAnimation: true,               // Enable combo decay animation (if false, combo immediately goes to 0 when timer expires)

  // Debug settings
  debug: false,                            // Enable debug logging
  debugurl: false                          // Enable debug URL - automatically populate all parameters in URL
};
```

## URL Parameters

You can override configuration values using URL parameters. For example:
`index.html?nickname=hellcake47&fadeTimeout=10000&showCombo=false`

## Supported Emote Platforms

- **Twitch** emotes
- **7TV** emotes
- **BTTV** emotes
- **FFZ** emotes
## Known Issues

- Animated emotes may show only first frame if not properly cached (fixed with cache busting)

## License

This project is licensed under the terms specified in the LICENSE file.