# Binkterm Echo Area Button Mod

# I merged these changes into BinkTermPHP so you no longer need this, it was fun while it lasted, but because changes are being accepted somewhat liberally, I think it helps the community more if I submit direct to the BBS

A zero-touch, client-side plugin for [BinktermPHP](https://github.com/awehttam/binkterm-php) that adds sleek **Quick Network Filters**, **Quick Sub-Area Filters**, and **Quick Actions** toolbars to both the Echo List page (`/echolist`) and the Echomail Message reader (`/echomail`).

It allows users to filter echo areas by FTN network, drill down into specific sub-areas with one click, search message content from the top of the page, and seamlessly toggle back and forth between the Area List view and Message reader while preserving the active network and area filters.

---

## Features

- **Zero-Touch & Upgrade-Proof**: Never alters any core BinktermPHP templates or backend routes. Future `git pull upstream` updates merge cleanly without conflicts.
- **Dual-View Support (`/echolist` & `/echomail`)**:
  - Full support on both the `/echolist` forum area overview and the `/echomail` message reader.
  - Effortless 1-click **View Toggle** (`Area List` ↔ `Messages`) in both the card header and quick actions toolbar that preserves your selected network and sub-area parameters.
- **Dynamic Network Filter Pills**:
  - Automatically discovers all connected networks from the active echo area list (e.g. `ALL`, `LOCAL`, `DOVENET`, `FSXNET`, `LOVLYNET`, `FIDONET`, `SYSOPNET`, `TQWNET`, `ZERONET`).
  - Displays live area count badges on each button.
  - One-click instant filtering without page reloads.
- **Interactive Quick Sub-Area Filters**:
  - Dynamically populates all sub-areas belonging to the currently selected network (or all areas).
  - Shows live unread and message count badges per sub-area.
  - Includes a quick real-time sub-area search/filter input.
  - On `/echolist`: Instantly filters the list view down to the selected sub-area.
  - On `/echomail`: Instantly switches the active message reader to that sub-area's messages.
- **Top Message Search on `/echomail`**:
  - Directly exposes message content search at the top of `/echomail`.
- **Quick Action Buttons**:
  - **Subscribed Only**: Quick toggle to show only your subscribed echo areas.
  - **Unread Only**: Quick toggle to show only areas with unread messages.
  - **Area List / Messages**: 1-click toggle between list view and message view.
  - **New Post**: Launches the native compose modal immediately.
  - **Manage**: Direct shortcut to `/subscriptions`.
- **Theme-Integrated & Flash-Free**:
  - Automatically inherits button styling and colors from your active BBS theme (e.g., Adventure BBS, Bootswatch themes).
  - Transitions disabled to prevent Bootstrap default blue background/focus rings.

---

## Quick Install (1-Line Command)

Clone this repository and run the installer pointing to your Binkterm installation:

```bash
git clone https://github.com/thewebexpert/binkterm-php-echoButtonMod.git
cd binkterm-php-echoButtonMod
./install.sh /path/to/binkterm
```

*(If you are running the command from a directory adjacent to `binkterm`, `./install.sh` will auto-detect the `binkterm` directory).*

---

## Manual Installation

1. **Copy the JavaScript and CSS assets:**
   ```bash
   cp public_html/js/echo-filter.js /path/to/binkterm/public_html/js/
   cp public_html/css/echo-filter.css /path/to/binkterm/public_html/css/
   ```

2. **Add the assets to `templates/custom/header.insert.twig`:**
   Append the following to `/path/to/binkterm/templates/custom/header.insert.twig`:
   ```twig
   {# Binkterm Echo Area Button Mod #}
   <link rel="stylesheet" href="/css/echo-filter.css?v=1.0">
   <script src="/js/echo-filter.js?v=1.0" defer></script>
   ```

---

## Docker Compose Setup

If you run BinktermPHP in Docker, mount the plugin files into your container:

```yaml
services:
  binkterm-app:
    volumes:
      - ./plugins/binkterm-php-echoButtonMod/public_html/js/echo-filter.js:/var/www/html/public_html/js/echo-filter.js:ro
      - ./plugins/binkterm-php-echoButtonMod/public_html/css/echo-filter.css:/var/www/html/public_html/css/echo-filter.css:ro
```

---

## Uninstallation

To remove the plugin:

```bash
cd binkterm-php-echoButtonMod
./uninstall.sh /path/to/binkterm
```

---

## License

MIT License. See [LICENSE](LICENSE) for details.
