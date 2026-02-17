# Proctor Client - AI-Powered Interview Proctoring System

An intelligent real-time interview proctoring application that uses computer vision and AI to monitor candidates during online interviews. This client-side application detects and logs various events that might indicate examination misconduct.

## 🎯 Features

### Real-time Detection
- **Face Detection**: Monitors candidate presence using MediaPipe Face Detection
- **Multiple Face Detection**: Alerts when more than one person is visible
- **Absence Detection**: Tracks when the candidate leaves the frame
- **Gaze Tracking**: Detects when the candidate is not looking at the screen
- **Object Detection**: Identifies prohibited items using TensorFlow COCO-SSD:
  - Cell phones
  - Books and notebooks
  - Extra devices (laptops, keyboards, monitors)

### Recording & Reporting
- **Video Recording**: Records the entire interview session
- **Event Logging**: Timestamps all detected events with confidence scores
- **Integrity Score**: Calculates a score (0-100) based on detected events
- **Session Reports**: Generates comprehensive reports with event summaries
- **Export Options**: 
  - Download session recordings (WebM format)
  - Export event logs as CSV

### Live Monitoring
- **Real-time Video Feed**: Live camera feed with visual overlays
- **Event Toast Notifications**: Instant alerts for detected events
- **Live Events Panel**: Running log of recent events
- **Debug Information**: Real-time gaze tracking metrics

## 🛠️ Technology Stack

- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **UI Styling**: Tailwind CSS
- **Computer Vision**:
  - MediaPipe Tasks Vision (Face Detection)
  - TensorFlow.js with COCO-SSD (Object Detection)
- **Video Processing**: MediaRecorder API
- **File Export**: FileSaver.js, jsPDF

## 📋 Prerequisites

- Node.js (v18 or higher)
- Modern web browser with:
  - WebRTC support
  - Camera and microphone access
  - WebGL support

## 🚀 Getting Started

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Sourabh10122002/proctor-client.git
cd proctor-client
```

2. Install dependencies (using npm - the recommended package manager):
```bash
npm install
```

> **Note**: This project uses npm. While other package managers like yarn or pnpm may work, npm is recommended for consistency.

3. Set up environment variables (optional):
Create a `.env` file in the root directory:
```env
VITE_APP_API_URL=http://localhost:5000/api
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Build

Create a production build:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## 📖 Usage

1. **Grant Permissions**: Allow camera and microphone access when prompted by your browser
2. **Enter Candidate Name**: Input the candidate's name in the "Candidate Information" panel on the right side
3. **Start Recording**: Click the "Start Recording" button in the control panel to begin the proctoring session
4. **Monitor Events**: Watch the "Live Events" panel for real-time alerts of any detected activities
5. **Stop Recording**: Click "Stop Recording" when the interview is complete
6. **View Report**: Click "View Report" to see the detailed session summary with integrity score
7. **Export Data**: Download the recording (as WebM video) or export event logs as CSV for further analysis

## 🔍 Detection Thresholds

- **Absence**: 10 seconds without face detection
- **Multiple Faces**: 1 second with 2+ faces detected
- **Not Looking at Screen**: 5 seconds of face not centered
- **Event Debounce**: 3 seconds between re-logging same event

## 📊 Integrity Score Calculation

The integrity score starts at 100 and is reduced based on detected events:
- Focus Lost: -2 points per event (max -30)
- Absence: -5 points per event (max -35)
- Multiple Faces: -10 points per event (max -20)
- Not Looking at Screen: -3 points per event (max -15)
- Prohibited Objects: -10 points for first detection, -3 for each additional

## 🔧 Configuration

### Backend Integration

The application can integrate with a backend API for session persistence. Configure the API endpoint using the `VITE_APP_API_URL` environment variable. The client will fallback to local storage if the backend is unavailable.

### Detection Sensitivity

Adjust detection parameters in `src/App.tsx`:
- `ABSENCE_MS`: Time before absence is logged
- `MULTI_FACE_MS`: Time before multiple faces are logged
- `NOT_LOOKING_MS`: Time before gaze deviation is logged
- `RELOG_DEBOUNCE_MS`: Minimum time between duplicate events

## 🧪 Linting

Run ESLint:
```bash
npm run lint
```

## 📝 License

This project is available for educational and personal use.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## 📧 Contact

For questions or support, please open an issue on GitHub.
