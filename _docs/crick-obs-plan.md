# Project: Broadcast-Quality Local Cricket Scoreboard for OBS

## Context & Goal
Act as an expert full-stack developer. I need to build a real-time, completely offline, broadcast-quality cricket scoreboard designed to be used as a Browser Source overlay in OBS Studio. 

This is a local network application. It requires a Master Admin panel running on my laptop, and it must allow other devices (smartphones) on the same WiFi/Hotspot to scan a QR code and access specific mobile-friendly control panels based on assigned roles (Scorer vs. Info Manager).

## Tech Stack
* **Framework:** Next.js (Pages or App router, whichever is cleaner for a custom server).
* **Backend/Real-time:** Custom Node.js server (`server.js`) integrating Express and Socket.io.
* **Database:** `better-sqlite3` (strictly local file `database.sqlite`, no cloud databases).
* **Styling & UI:** Tailwind CSS, `lucide-react` for icons.
* **Animations:** Framer Motion (crucial for TV-style number flipping and scoreboard sliding).
* **Utilities:** `qrcode.react` (for generating LAN access codes), `internal-ip` (or standard Node `os.networkInterfaces()` to grab the local IPv4 address).

## System Architecture & Networking
1.  **Custom Server Setup:** Create a custom `server.js` that initializes Next.js, Express, and Socket.io on the same port (e.g., 3000). 
2.  **Host Binding:** The server MUST listen on `0.0.0.0` to ensure it is accessible across the local network (LAN), not just `localhost`.
3.  **Real-time Sync:** All state changes must be saved to SQLite and immediately broadcasted via Socket.io to all connected clients.

## Database Schema Requirements
Create a `better-sqlite3` setup with three tables:
1.  `match_data`: Team names, runs, wickets, overs, striker (name/runs/balls), non-striker, bowler (name/overs/runs/wickets), and an array/string for the 'recent balls' timeline.
2.  `style_settings`: X-offset, Y-offset, primary_color, secondary_color, bg_opacity, show_timeline (boolean).
3.  `access_tokens`: token_string, role (either 'scorer' or 'manager'), active_status.

## Required Views / Routes

### 1. The OBS Overlay (`/overlay`)
* **UI:** A lower-third broadcast-style graphic with a completely transparent global background (`body { background: transparent; }`). Use a sleek glassmorphic style.
* **State:** Listens passively to Socket.io events to update the UI instantly.
* **Animations:** Use Framer Motion so that when the score increases, the numbers slide/flip smoothly instead of instantly snapping.
* **Dynamic Styling:** Bind the parent container's inline styles or CSS variables to the X/Y offsets and colors provided by the `style_settings` database state.

### 2. Master Admin Panel (`/admin`)
* This is the desktop control center.
* **Tab 1: Match Control:** Full access to update scores, swap players, edit names, and manually override data.
* **Tab 2: Style & Position:** Sliders for X/Y axis positioning on the OBS screen, color pickers (Hex/Tailwind classes) for team colors, and opacity sliders.
* **Tab 3: LAN Remote Access:** Fetches the host computer's IPv4 address. Generates two QR codes using `qrcode.react`:
    * **Scorer QR:** Encodes URL `http://[LOCAL_IP]:3000/remote?role=scorer&token=[GENERATE_TOKEN]`
    * **Manager QR:** Encodes URL `http://[LOCAL_IP]:3000/remote?role=manager&token=[GENERATE_TOKEN]`

### 3. Remote Mobile Views (`/remote`)
* Reads the URL query parameters (`role` and `token`), validates them via Socket.io or an API route, and renders a mobile-optimized UI.
* **If role === 'scorer':** Render massive, easy-to-tap buttons (+1, +2, +4, +6, Dot, Wide, No Ball, Wicket). No styling or player info controls.
* **If role === 'manager':** Render forms and dropdowns to update striker/non-striker names, select the next bowler, and update the match status string. No run-scoring buttons.

## Step-by-Step Execution Plan
Please execute this project in the following strict order. Pause after each step to confirm it works before moving on.

* **Phase 1:** Initialize the Next.js project, install all dependencies, and set up the custom `server.js` with Express, Socket.io, and `0.0.0.0` binding.
* **Phase 2:** Implement the local SQLite database initialization and write the helper functions for standard CRUD operations for the match state and styles.
* **Phase 3:** Build the `/overlay` page with hardcoded static data first. Apply Tailwind styling, Framer Motion animations, and ensure the transparent background works perfectly for OBS.
* **Phase 4:** Hook up Socket.io between the backend and the `/overlay` so it updates dynamically. 
* **Phase 5:** Build the `/admin` dashboard. Implement the scoring buttons, styling sliders, and ensure every click emits the correct Socket.io event and updates the database.
* **Phase 6:** Implement the network IP detection, QR code generation, and build the role-restricted `/remote` mobile views. 

Start with Phase 1. Show me the file structure and the code for `package.json` and `server.js`.