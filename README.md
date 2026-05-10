# 🏏 Cricket Scoreboard for OBS

A broadcast-quality, Peer-to-Peer (P2P) cricket scoreboard overlay designed for OBS Studio. This tool allows you to manage match scores from a "Main PC" (Admin Panel) and synchronize them in real-time with an "OBS Overlay" and "Remote Scorer" devices (like smartphones) without requiring a central database server.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 18.x or higher is recommended.
- **npm**: Comes with Node.js.

### Installation

1. **Clone or Download** the repository to your local machine.
2. **Install Dependencies**:
   Open your terminal in the project folder and run:
   ```bash
   npm install
   ```
   *Note: This project uses `better-sqlite3`. If you encounter errors during installation, ensure you have build tools (like Python and C++ compiler) installed on your system.*

### Running the Application

1. **Start the server**:
   ```bash
   npm run dev
   ```
2. **Access the interface**:
   - **Main Panel**: [http://localhost:3000](http://localhost:3000)
   - **Admin Control**: [http://localhost:3000/admin](http://localhost:3000/admin)
   - **OBS Overlay**: [http://localhost:3000/overlay](http://localhost:3000/overlay)

---

## 🏗️ Architecture & Synchronization

This application uses a **Peer-to-Peer (P2P)** architecture via [PeerJS](https://peerjs.com/):

1. **Main PC (Host)**: When you open the Admin Panel, your browser generates a unique **Host ID**. All match data is stored in your browser's `localStorage`.
2. **Overlay & Remote (Clients)**: These devices connect directly to your Main PC using the Host ID.
3. **Data Flow**: Any changes made on a Remote Scorer phone are sent to the Main PC, which then broadcasts the update to the OBS Overlay.

> [!TIP]
> To connect a remote phone, go to the **LAN Remote** tab in the Admin Panel and scan the QR code. Both devices must have internet access to connect via the PeerJS signaling server, but data is sent directly between devices.

---

## 🛠️ Troubleshooting

### SQLite Errors
The project includes a `server.js` with SQLite support for potential future enhancements. If you see errors related to `better-sqlite3`:
- **macOS**: Ensure Xcode Command Line Tools are installed (`xcode-select --install`).
- **Windows**: Install `windows-build-tools` or Visual Studio Build Tools.

### Connection Issues
If the Overlay says "Offline":
- Ensure the **Admin Panel** tab is open on your Main PC.
- Check that the URL in OBS includes the correct `?host=ID` parameter.

---

## 📜 License
MIT

