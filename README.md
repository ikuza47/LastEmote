# LastEmote

A Twitch overlay that displays the last 7TV emote used in chat with combo counter and visual effects.

## Features

- **7TV Emote Tracking**: Automatically detects and displays 7TV emotes from Twitch chat
- **Combo Counter**: Shows consecutive use count of the same emote
- **Visual Effects**: Includes fire effects when combo reaches a threshold
- **Customizable Configuration**: Supports various appearance and behavior settings
- **Debug Mode**: Optional logging for troubleshooting
- **Local Config via URL**: All parameters can be overridden through URL parameters

## Installation

1. Clone or download this repository
2. Open `index.html` in your browser or OBS browser sourse

## Configuration

### Config File

Default configuration is stored in `config.js`. All parameters include comments explaining their function.

### URL Parameters

All configuration parameters can be overridden using URL parameters. For example:
```
index.html?nickname=hellcake47&fadeTimeout=10000&showCombo=false
```

### Configuration Parameters

#### General Settings
- `nickname`: Twitch channel name to monitor (default: 'ikuza47')
- `fadeTimeout`: Time (ms) before emote fades, 0 = never fade (default: 5000)

#### Appearance Settings
- `borderRadius`: Image corner radius in pixels (default: 12)
- `fontFamily`: Font family for combo text (default: 'Inter, sans-serif')
- `fontColor`: Combo text color (default: '#ffffffff')

#### Combo Settings
- `showCombo`: Show combo counter, false = hide (default: true)
- `comboFontSize`: Combo text size in pixels (default: 240)
- `comboSave`: Whether sending same emote during decay saves combo (default: true)

#### Positioning
- `anchorX`: Horizontal anchor (0 = left, 1 = center, 2 = right) (default: 0)
- `anchorY`: Vertical anchor (0 = bottom, 1 = center, 2 = top) (default: 0)

#### Fire Effect Settings
- `fireShow`: Enable fire effect (default: true)
- `fireComboCount`: Combo threshold to show fire effect (default: 5)
- `fireEmoji`: Emoji to show as fire effect (default: '🔥')
- `maxFire`: Maximum fire size (default: 8)

#### Animation Settings
- `comboPulseAnimation`: Enable combo pulse animation when incremented (default: true)
- `fireAnimation`: Enable fire animation (default: true)
- `comboDecayAnimation`: Enable combo decay animation, if false combo immediately goes to 0 when timer expires (default: true)

#### Debug Settings
- `debug`: Enable debug logging (default: false)
- `debugurl`: Enable debug URL - automatically populate all parameters in URL (default: false)


## Local Config Example

To use a different channel with custom settings:
```
index.html?nickname=hellcake47&comboFontSize=300&fireComboCount=3&debug=true
```

When `debugurl=true`, the URL will automatically be updated to include all configuration parameters.

## License

This project is licensed under the MIT License - see the LICENSE file for details.