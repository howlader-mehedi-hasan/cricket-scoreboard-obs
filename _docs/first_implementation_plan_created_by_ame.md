# Broadcast-Quality Local Cricket Scoreboard for OBS

## Context
Build a real-time, fully offline, broadcast-quality cricket scoreboard overlay for OBS Studio. The app runs on a local network with a master admin panel on the laptop, and role-based mobile controls accessible via QR code scanning on the same WiFi/Hotspot.

## Tech Stack
- **Framework:** Next.js (Pages Router — cleaner for custom server integration)
- **Backend:** Custom `server.js` with Express + Socket.io
- **Database:** `better-sqlite3` (local `database.sqlite`)
- **Styling:** Tailwind CSS + `lucide-react` icons
- **Animations:** Framer Motion (flip/slide transitions)
- **Utilities:** `qrcode.react`, Node `os.networkInterfaces()` for LAN IP

---

## Proposed Changes

### Phase 1: Project Initialization & Custom Server

#### [NEW] package.json
- Next.js, React 18, Express, Socket.io, better-sqlite3, Tailwind CSS, Framer Motion, lucide-react, qrcode.react
- Custom `dev` script: `node server.js`

#### [NEW] server.js
- Creates Express app, attaches Next.js request handler
- Initializes Socket.io on the same HTTP server
- Listens on `0.0.0.0:3000`
- Socket.io event handlers for all match/style/token operations

#### [NEW] next.config.js
- Standard Next.js config

#### [NEW] tailwind.config.js / postcss.config.js
- Tailwind setup scanning `pages/` and `components/`

---

### Phase 2: Database Layer

#### [NEW] lib/database.js
- Initializes SQLite with WAL mode
- Creates 3 tables: `match_data`, `style_settings`, `access_tokens`
- CRUD helper functions:
  - `getMatchData()`, `updateMatchData(field, value)`
  - `getStyleSettings()`, `updateStyleSettings(field, value)`
  - `createToken(role)`, `validateToken(token)`, `listTokens()`, `revokeToken(token)`

**Schema:**
| Table | Columns |
|-------|---------|
| `match_data` | team1_name, team2_name, runs, wickets, overs, balls, target, striker_name, striker_runs, striker_balls, non_striker_name, non_striker_runs, non_striker_balls, bowler_name, bowler_overs, bowler_runs, bowler_wickets, bowler_maidens, recent_balls (JSON string), match_status, innings |
| `style_settings` | x_offset, y_offset, primary_color, secondary_color, bg_opacity, show_timeline |
| `access_tokens` | id, token_string, role, active |

---

### Phase 3: OBS Overlay (`/overlay`)

#### [NEW] pages/overlay.js
- Transparent background (`body { background: transparent }`)
- Lower-third glassmorphic broadcast graphic
- Framer Motion animated number transitions (flip/slide on score changes)
- Dynamic CSS variables bound to `style_settings` (position, colors, opacity)
- Displays: team names, score (runs/wickets), overs, striker info, bowler info, recent balls timeline

#### [NEW] components/AnimatedNumber.js
- Framer Motion `AnimatePresence` with sliding number transitions

#### [NEW] components/BallTimeline.js
- Visual timeline of recent deliveries (dots, runs, wickets, extras)

---

### Phase 4: Real-time Socket.io Integration

#### [NEW] lib/socket.js
- Client-side Socket.io connection helper
- Custom React hook `useSocket()` for subscribing to events

#### Updates to overlay.js
- Listen to `match:update` and `style:update` Socket.io events
- Re-render UI on every broadcast

---

### Phase 5: Admin Dashboard (`/admin`)

#### [NEW] pages/admin.js
- Tabbed layout with 3 tabs

#### [NEW] components/admin/MatchControl.js
- **Tab 1:** Full scoring controls (+1, +2, +4, +6, Dot, Wide, No Ball, Wicket)
- Player name editing (striker, non-striker, bowler)
- Swap striker/non-striker, new over, end innings
- Manual override for all fields

#### [NEW] components/admin/StyleControl.js
- **Tab 2:** X/Y offset sliders (0–100%)
- Color pickers for primary/secondary colors
- Opacity slider (0–1)
- Show/hide timeline toggle

#### [NEW] components/admin/RemoteAccess.js
- **Tab 3:** Detects LAN IPv4 address via API route
- Generates two QR codes (Scorer & Manager)
- Token management (create/revoke)

#### [NEW] pages/api/network-info.js
- API route returning host machine's LAN IPv4 address

---

### Phase 6: Remote Mobile Views (`/remote`)

#### [NEW] pages/remote.js
- Reads `role` and `token` from URL query params
- Validates token via Socket.io handshake
- Renders role-specific UI:
  - **Scorer:** Large tap buttons for runs, extras, wickets
  - **Manager:** Forms for player names, bowler selection, match status

#### [NEW] components/remote/ScorerPanel.js
- Mobile-optimized, large-button scoring interface

#### [NEW] components/remote/ManagerPanel.js
- Mobile-optimized forms for team/player management

---

### Global Styles

#### [NEW] styles/globals.css
- Tailwind imports
- Custom animations and transitions
- Overlay-specific transparent background rules

---

## User Review Required

> [!IMPORTANT]
> The plan uses **Tailwind CSS** as explicitly requested in your spec. Confirming this is acceptable.

> [!IMPORTANT]  
> The plan uses **Pages Router** (not App Router) for Next.js, as it integrates more cleanly with the custom `server.js`. This means file-based routing under `pages/`.

> [!NOTE]
> The database is a single local SQLite file (`database.sqlite`). No cloud database is used. The file will be created automatically on first server start.

## Open Questions

> [!IMPORTANT]
> **Match format:** Should the scoreboard support multi-innings (Test-style) or primarily limited-overs (T20/ODI)? The plan currently assumes a single-innings-at-a-time display with an innings toggle.

> [!NOTE]
> **OBS overlay dimensions:** The overlay is designed as a lower-third (roughly 1920×200 area at the bottom of a 1080p screen). Should I target a specific resolution or keep it fully responsive?

## Verification Plan

### Automated Tests
- Start the server with `node server.js` and verify it binds to `0.0.0.0:3000`
- Verify SQLite database creates tables on first run
- Test Socket.io event flow: admin emits score change → overlay receives update
- Verify QR code generation with valid LAN URL

### Manual Verification
- Open `/overlay` in OBS as Browser Source — confirm transparent background
- Open `/admin` on desktop — test all scoring/styling controls
- Scan QR code from phone — verify role-based remote panels work
- Test Framer Motion animations on score changes
