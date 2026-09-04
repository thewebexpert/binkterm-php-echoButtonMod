# Binkterm Echo Area Button Mod

A zero-touch, client-side plugin for [BinktermPHP](https://github.com/awehttam/binkterm-php) that adds a sleek **Quick Network Filters** and **Quick Actions** button bar to the Echo List page (`/echolist`).

It populates the empty space directly beneath the "Search Messages" box, allowing users to filter echo areas by FTN network with one click and quickly access frequent echomail actions.

---

## Features

- **Zero-Touch & Upgrade-Proof**: Never alters any core BinktermPHP templates or backend routes. Future `git pull upstream` updates merge cleanly without conflicts.
- **Dynamic Network Filter Pills**:
  - Automatically discovers all connected networks from the active echo area list (e.g. `ALL`, `LOCAL`, `DOVENET`, `FSXNET`, `LOVLYNET`, `FIDONET`).
  - Displays live area count badges on each button.
  - One-click instant filtering without page reloads.
- **Quick Action Buttons**:
  - **Subscribed Only**: Quick toggle to show only your subscribed echo areas.
  - **Unread Only**: Quick toggle to show only areas with unread messages.
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
