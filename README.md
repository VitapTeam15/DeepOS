# Deep OS

Deep OS is an intelligent, AI-powered desktop environment enhancer designed to boost productivity, minimize distractions, and predict your workflow needs.

## Architecture Overview

Deep OS is built on a modern, decoupled architecture:
- **Frontend**: React (Vite)
- **Backend**: Python (FastAPI)
- **Desktop Shell**: Electron

## Features

1. Intelligent application tracking
2. Real-time system monitoring (CPU, RAM, Disk)
3. Predictive app launching based on usage patterns
4. Focus Mode for notification suppression (blocks distracting alerts, but does not block app usage)
5. Smart notifications with cooldown periods
6. Ambient audio and TTS integration
7. Synthetic Demo Mode for presentations
8. Centralized dashboard
9. Automated background data retention/cleanup
10. System snapshotting
11. Rule-based recommendations
12. Process termination functionality (always requires explicit user confirmation)
13. Extensible REST API
14. Real-time WebSocket event streaming
15. Seamless Electron desktop integration
16. Packaged as a standalone application
17. Persistent local SQLite database (tracks Foreground Activations)

## Prerequisites

- **Python**: 3.10 or higher
- **Node.js**: 18.0 or higher

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/DeepOs.git
cd DeepOs

# Install backend dependencies
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install

# Install electron dependencies
cd ../electron
npm install
```

## Development Setup

To run the application in development mode, you need to start the backend, frontend, and electron shell separately.

### 1. Start the FastAPI Backend
```bash
cd backend
venv\Scripts\activate
uvicorn app.main:app --reload
```

### 2. Start the React Frontend
```bash
cd frontend
npm run dev
```

### 3. Start the Electron Shell
```bash
cd electron
npm start
```

## Project Structure

```text
DeepOs/
├── backend/            # Python FastAPI backend
│   ├── app/            # Main application code
│   ├── tests/          # Pytest test suite
│   └── deepos.spec     # PyInstaller spec
├── frontend/           # React frontend
│   ├── src/            # Source code
│   └── package.json
├── electron/           # Electron shell
│   ├── main.js
│   ├── preload.js
│   └── electron-builder.yml
└── README.md
```

## Technology Stack

- **Backend**: Python, FastAPI, aiosqlite, pytest, pyttsx3, psutil, PyInstaller
- **Frontend**: React, JavaScript, Vite, Recharts, Lucide React, Vanilla CSS
- **Desktop**: Electron, electron-builder
- **Database**: SQLite

## Configuration Options

Various configuration options are available via the `settings` database table, accessible through the `Settings` page in the dashboard or via the API.
- Focus mode thresholds
- Notification muting rules
- Data retention limits

## Screenshots

*(Placeholder for screenshots of the Deep OS dashboard, focus mode, and notifications)*

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Credits

Developed by the Deep OS Team.
