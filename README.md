# LastEmote

A 7TV emote tracker with combo counter for Twitch streams. Displays 7TV emotes from chat with combo tracking functionality.

## Features

- Real-time 7TV emote display from Twitch chat
- Combo counter for repeated emotes
- Customizable positioning and styling
- Automatic fade after inactivity
- Supports both global and channel-specific 7TV emotes

## Installation

### Automatic Installation

1. Clone or download this repository
2. Copy the `src/` folder contents to your desired location
3. Configure `config.js` with your settings

## Setup in OBS Studio

1. Open OBS Studio
2. Go to Sources > Add > Browser
3. Select `index.html`
4. Set width/height (recommended: resolution of your stream `[1920x1080 maybe]`)
5. Check "Shutdown source when not visible" and "Refresh browser when scene becomes active"

## Configuration

Edit `config.js` to customize:

- `nickname`: Your Twitch channel name
- `showCombo`: Enable/disable combo counter
- `comboFontSize`: Size of combo text (in pixels)
- `fadeTimeout`: Time before emote fades (in ms, 0 = never fade)
- `minComboToShow`: Minimum combo count to show (W.I.P)
- `anchorX`: Horizontal position (0 = left, 1 = center, 2 = right)
- `anchorY`: Vertical position (0 = bottom, 1 = center, 2 = top)
- `borderRadius`: Corner radius for emotes
- `fontFamily`/`fontColor`: Combo text styling

## Usage

Once installed and added to OBS, LastEmote will:
- Connect to your Twitch channel's chat
- Display 7TV emotes as they appear in chat
- Track and display combo counts for repeated emotes
- Automatically fade emotes after the timeout period

## License
[LICENSE](LICENSE)