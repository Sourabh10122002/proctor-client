// src/App.tsx
import { useEffect, useRef, useState } from "react";
import * as coco from "@tensorflow-models/coco-ssd";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-cpu";
import "@tensorflow/tfjs-backend-webgl";
import { saveAs } from "file-saver";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

import VideoFeed from "./components/VideoFeed";
import ControlPanel from "./components/ControlPanel";
import CandidateInfo from "./components/CandidateInfo";
import LiveEvents from "./components/LiveEvents";
import EventToast from "./components/EventToast";
import ReportModal from "./components/ReportModal";

export type EventType =
  | "focus_lost"
  | "absence"
  | "multi_face"
  | "phone_detected"
  | "notes_detected"
  | "extra_device_detected"
  | "not_looking_at_screen";

export type LogEvent = {
  type: EventType;
  atMs: number;
  durationMs?: number;
  confidence?: number;
  meta?: Record<string, any>;
  sessionId?: string;
  candidateName?: string;
};

export type LiveEvent = {
  id: number;
  type: EventType;
  message: string;
  timestamp: number;
  duration?: number;
  confidence?: number;
};

export type SessionReport = {
  candidateName: string;
  interviewDuration: number;
  focusLostCount: number;
  absenceCount: number;
  multiFaceCount: number;
  phoneDetectedCount: number;
  notesDetectedCount: number;
  extraDeviceCount: number;
  integrityScore: number;
  events: LogEvent[];
};

const ABSENCE_MS = 10000;
const MULTI_FACE_MS = 1000;
const RELOG_DEBOUNCE_MS = 3000;
const NOT_LOOKING_MS = 5000;
const API_BASE_URL = import.meta.env.VITE_APP_API_URL || "http://localhost:5000/api";

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<BlobPart[]>([]);
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string>("");
  const [candidateName, setCandidateName] = useState("John Doe");
  const [isModelsLoaded, setIsModelsLoaded] = useState(false);
  const [lookingAway, setLookingAway] = useState(false);
  const [lookingAwayDuration, setLookingAwayDuration] = useState(0);
  const [debugInfo, setDebugInfo] = useState("Initializing...");
  const [showReport, setShowReport] = useState(false);
  const [sessionReport, setSessionReport] = useState<SessionReport | null>(null);

  // detection state
  const cocoModelRef = useRef<coco.ObjectDetection | null>(null);
  const faceDetectorRef = useRef<FaceDetector | null>(null);
  const lastEventTimeRef = useRef<Record<EventType, number>>({} as any);
  const animationFrameRef = useRef<number>(0);
  const liveEventIdRef = useRef(0);

  // timers/state
  const lastFaceSeenRef = useRef<number>(0);
  const multiFaceStartRef = useRef<number | null>(null);
  const lookingAwayTimerRef = useRef<number | null>(null);
  const notLookingStartRef = useRef<number | null>(null);

  // Generate a unique session ID
  const generateSessionId = () => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Save session to backend
  const saveSessionToBackend = async () => {
    if (!sessionStart) return;

    const duration = Math.round((performance.now() - sessionStart) / 1000);
    const score = computeScore();

    // Count events by type
    const counts = {
      focus_lost: 0,
      absence: 0,
      multi_face: 0,
      phone_detected: 0,
      notes_detected: 0,
      extra_device_detected: 0,
      not_looking_at_screen: 0
    } as Record<EventType, number>;

    events.forEach(e => {
      counts[e.type] = (counts[e.type] || 0) + 1;
    });

    const sessionReport: SessionReport = {
      candidateName,
      interviewDuration: duration,
      focusLostCount: counts.focus_lost,
      absenceCount: counts.absence,
      multiFaceCount: counts.multi_face,
      phoneDetectedCount: counts.phone_detected,
      notesDetectedCount: counts.notes_detected,
      extraDeviceCount: counts.extra_device_detected,
      integrityScore: score,
      events: events
    };

    try {
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          candidateName,
          startTime: new Date(sessionStart),
          endTime: new Date(),
          duration,
          events: events,
          integrityScore: score,
          report: sessionReport
        }),
      });

      if (!response.ok) {
        console.error('Failed to save session to backend');
      } else {
        // Set the session report for display
        setSessionReport(sessionReport);
      }
    } catch (error) {
      console.error('Error saving session to backend:', error);
    }
  };

  // Fetch session report
  const fetchSessionReport = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/report`);
      if (response.ok) {
        const report = await response.json();
        setSessionReport(report);
        setShowReport(true);
      } else {
        // If we can't fetch from backend, generate it locally
        if (!sessionStart) return;

        const duration = Math.round((performance.now() - sessionStart) / 1000);
        const score = computeScore();

        // Count events by type
        const counts = {
          focus_lost: 0,
          absence: 0,
          multi_face: 0,
          phone_detected: 0,
          notes_detected: 0,
          extra_device_detected: 0,
          not_looking_at_screen: 0
        } as Record<EventType, number>;

        events.forEach(e => {
          counts[e.type] = (counts[e.type] || 0) + 1;
        });

        const localReport: SessionReport = {
          candidateName,
          interviewDuration: duration,
          focusLostCount: counts.focus_lost,
          absenceCount: counts.absence,
          multiFaceCount: counts.multi_face,
          phoneDetectedCount: counts.phone_detected,
          notesDetectedCount: counts.notes_detected,
          extraDeviceCount: counts.extra_device_detected,
          integrityScore: score,
          events: events
        };

        setSessionReport(localReport);
        setShowReport(true);
      }
    } catch (error) {
      console.error('Error fetching session report:', error);

      // Fallback to generating report locally
      if (!sessionStart) return;

      const duration = Math.round((performance.now() - sessionStart) / 1000);
      const score = computeScore();

      // Count events by type
      const counts = {
        focus_lost: 0,
        absence: 0,
        multi_face: 0,
        phone_detected: 0,
        notes_detected: 0,
        extra_device_detected: 0,
        not_looking_at_screen: 0
      } as Record<EventType, number>;

      events.forEach(e => {
        counts[e.type] = (counts[e.type] || 0) + 1;
      });

      const localReport: SessionReport = {
        candidateName,
        interviewDuration: duration,
        focusLostCount: counts.focus_lost,
        absenceCount: counts.absence,
        multiFaceCount: counts.multi_face,
        phoneDetectedCount: counts.phone_detected,
        notesDetectedCount: counts.notes_detected,
        extraDeviceCount: counts.extra_device_detected,
        integrityScore: score,
        events: events
      };

      setSessionReport(localReport);
      setShowReport(true);
    }
  };

  // Simple but reliable gaze detection using face position
  function isLookingAtScreen(face: any, canvasWidth: number, canvasHeight: number) {
    if (!face || !face.boundingBox) return true;

    try {
      const bb = face.boundingBox;
      const faceCenterX = bb.originX + bb.width / 2;
      const faceCenterY = bb.originY + bb.height / 2;

      // Calculate how centered the face is
      const normalizedCenterX = faceCenterX / canvasWidth;
      const normalizedCenterY = faceCenterY / canvasHeight;

      // Calculate distance from center (0.5, 0.5 is perfect center)
      const centerDistance = Math.sqrt(
        Math.pow(normalizedCenterX - 0.5, 2) +
        Math.pow(normalizedCenterY - 0.4, 2) // Slightly higher than center is typical
      );

      // Calculate face size ratio
      const faceSizeRatio = (bb.width * bb.height) / (canvasWidth * canvasHeight);

      // Update debug info
      setDebugInfo(`Face center: (${normalizedCenterX.toFixed(2)}, ${normalizedCenterY.toFixed(2)}), Distance: ${centerDistance.toFixed(2)}, Size: ${faceSizeRatio.toFixed(3)}`);

      // If face is reasonably centered and of reasonable size, assume looking at screen
      return centerDistance < 0.35 && faceSizeRatio > 0.05 && faceSizeRatio < 0.4;
    } catch (error) {
      console.error("Error in gaze detection:", error);
      return true; // Default to true to avoid false positives
    }
  }

  // Helpers
  const logEvent = async (e: LogEvent) => {
    const now = performance.now();
    const last = lastEventTimeRef.current[e.type] ?? 0;
    if (now - last < RELOG_DEBOUNCE_MS) return;
    lastEventTimeRef.current[e.type] = now;

    const newEvent = { ...e, sessionId, candidateName };
    setEvents((prev) => [...prev, newEvent]);

    // Also add to live events
    const eventMessages: Record<EventType, string> = {
      focus_lost: "Focus lost - not looking at screen",
      absence: "No face detected - candidate may be absent",
      multi_face: "Multiple faces detected",
      phone_detected: "Phone detected",
      notes_detected: "Notes or book detected",
      extra_device_detected: "Extra device detected",
      not_looking_at_screen: "Not looking at screen"
    };

    const newLiveEvent: LiveEvent = {
      id: liveEventIdRef.current++,
      type: e.type,
      message: eventMessages[e.type],
      timestamp: now,
      duration: e.durationMs,
      confidence: e.confidence
    };

    setLiveEvents(prev => [newLiveEvent, ...prev.slice(0, 9)]); // Keep only 10 latest events
  };

  const startRecording = async () => {
    if (!videoRef.current) return;
    recordedChunks.current = [];
    const stream = videoRef.current.srcObject as MediaStream;
    const mr = new MediaRecorder(stream, { mimeType: "video/webm;codecs=vp9" });
    mediaRecorderRef.current = mr;
    mr.ondataavailable = (e) => e.data.size && recordedChunks.current.push(e.data);
    mr.start(1000);
    setRecording(true);
    setSessionStart(performance.now());
    setSessionId(generateSessionId());
  };

  const stopRecording = async () => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
    cancelAnimationFrame(animationFrameRef.current);
    if (lookingAwayTimerRef.current) {
      clearInterval(lookingAwayTimerRef.current);
    }

    // Save session to backend
    await saveSessionToBackend();
  };

  const downloadRecording = () => {
    const blob = new Blob(recordedChunks.current, { type: "video/webm" });
    saveAs(blob, "interview-recording.webm");
  };

  const downloadCSV = () => {
    const rows = [["timestamp_ms", "type", "duration_ms", "confidence", "meta"]];
    events.forEach(e => {
      rows.push([
        String(Math.round(e.atMs)),
        e.type,
        e.durationMs ? String(Math.round(e.durationMs)) : "",
        e.confidence ? e.confidence.toFixed(2) : "",
        e.meta ? JSON.stringify(e.meta) : ""
      ]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "proctor-log.csv");
  };

  const computeScore = () => {
    let score = 100;
    const counts = {
      focus_lost: 0, absence: 0, multi_face: 0,
      phone_detected: 0, notes_detected: 0, extra_device_detected: 0,
      not_looking_at_screen: 0
    } as Record<EventType, number>;
    const firstSeen: Partial<Record<EventType, number>> = {};
    events.forEach(e => {
      counts[e.type] = (counts[e.type] ?? 0) + 1;
      if (!(e.type in firstSeen)) firstSeen[e.type] = e.atMs;
    });
    score -= Math.min(30, 2 * counts.focus_lost);
    score -= Math.min(35, 5 * counts.absence);
    score -= Math.min(20, 10 * counts.multi_face);
    score -= Math.min(15, 3 * counts.not_looking_at_screen);
    // object penalties
    ["phone_detected", "notes_detected", "extra_device_detected"].forEach((t) => {
      const c = counts[t as EventType] || 0;
      if (c > 0) score -= 10 + Math.max(0, c - 1) * 3;
    });
    return Math.max(0, Math.round(score));
  };

  // Check if candidate is not looking at screen
  const checkNotLookingAtScreen = (faces: any[], now: number, canvasWidth: number, canvasHeight: number) => {
    if (faces.length === 0) {
      setLookingAway(false);
      return;
    }

    // Use the first face detected
    const isLooking = isLookingAtScreen(faces[0], canvasWidth, canvasHeight);

    if (!isLooking) {
      if (!notLookingStartRef.current) {
        notLookingStartRef.current = now;
      } else if (now - notLookingStartRef.current > NOT_LOOKING_MS) {
        logEvent({
          type: "not_looking_at_screen",
          atMs: now,
          durationMs: now - notLookingStartRef.current
        });
        // Don't reset the timer here to continue tracking the duration
      }
    } else {
      notLookingStartRef.current = null;
    }

    setLookingAway(!isLooking);
  };

  // Init camera + models
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        await tf.setBackend('cpu');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: true
        });

        if (videoRef.current && isMounted) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        // Load COCO-SSD model
        cocoModelRef.current = await coco.load({ base: "lite_mobilenet_v2" });

        // Load MediaPipe Face Detector
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );

        faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite"
          },
          runningMode: "VIDEO",
          minDetectionConfidence: 0.5
        });

        if (isMounted) {
          setIsModelsLoaded(true);
          lastFaceSeenRef.current = performance.now();
          // Start the detection loop
          loop();

          // Start timer to update looking away duration
          lookingAwayTimerRef.current = window.setInterval(() => {
            if (lookingAway) {
              setLookingAwayDuration(prev => prev + 1);
            } else {
              setLookingAwayDuration(0);
            }
          }, 1000);
        }
      } catch (error) {
        console.error("Error initializing:", error);
        setDebugInfo("Error initializing camera or models");
      }
    })();

    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameRef.current);
      if (mediaRecorderRef.current && recording) {
        mediaRecorderRef.current.stop();
      }
      if (lookingAwayTimerRef.current) {
        clearInterval(lookingAwayTimerRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loop = async () => {
    if (!videoRef.current || !canvasRef.current || !faceDetectorRef.current) {
      animationFrameRef.current = requestAnimationFrame(loop);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(loop);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const now = performance.now();
    let faces: any[] = [];

    try {
      // Detect faces using MediaPipe
      const faceDetections = faceDetectorRef.current.detectForVideo(video, now);
      faces = faceDetections.detections || [];
    } catch (error) {
      console.error("Face detection error:", error);
      setDebugInfo("Face detection error");
    }

    // Draw face boxes
    faces.forEach((face: any) => {
      // Draw bounding box
      const bb = face.boundingBox;
      ctx.strokeStyle = lookingAway ? "red" : "lime";
      ctx.lineWidth = 2;
      ctx.strokeRect(bb.originX, bb.originY, bb.width, bb.height);

      // Draw face center point
      const faceCenterX = bb.originX + bb.width / 2;
      const faceCenterY = bb.originY + bb.height / 2;

      ctx.fillStyle = "blue";
      ctx.beginPath();
      ctx.arc(faceCenterX, faceCenterY, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw screen center point
      const screenCenterX = ctx.canvas.width / 2;
      const screenCenterY = ctx.canvas.height / 2;

      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(screenCenterX, screenCenterY, 4, 0, 2 * Math.PI);
      ctx.fill();

      // Draw line between face center and screen center
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(faceCenterX, faceCenterY);
      ctx.lineTo(screenCenterX, screenCenterY);
      ctx.stroke();
    });

    if (faces.length > 0) {
      lastFaceSeenRef.current = now;

      // Multiple faces logic
      if (faces.length >= 2) {
        if (!multiFaceStartRef.current) multiFaceStartRef.current = now;
        if (now - multiFaceStartRef.current > MULTI_FACE_MS) {
          logEvent({
            type: "multi_face",
            atMs: now,
            durationMs: now - multiFaceStartRef.current
          });
          multiFaceStartRef.current = null;
        }
      } else {
        multiFaceStartRef.current = null;
      }

      // Check if candidate is not looking at screen
      checkNotLookingAtScreen(faces, now, canvas.width, canvas.height);
    } else {
      // No faces detected - check for absence
      setLookingAway(false);
      if (now - lastFaceSeenRef.current > ABSENCE_MS) {
        logEvent({
          type: "absence",
          atMs: now,
          durationMs: now - lastFaceSeenRef.current
        });
        lastFaceSeenRef.current = now; // Reset to avoid spamming
      }
    }

    // Object detection with COCO-SSD
    if (cocoModelRef.current) {
      try {
        const preds = await cocoModelRef.current.detect(video);
        preds.forEach((p) => {
          const [x, y, w, h] = p.bbox;
          ctx.strokeStyle = "orange";
          ctx.lineWidth = 2;
          ctx.strokeRect(x, y, w, h);
          ctx.font = "12px monospace";
          ctx.fillStyle = "orange";
          ctx.fillText(`${p.class} ${(p.score * 100).toFixed(0)}%`, x + 2, y - 4);

          const now2 = performance.now();
          const cls = p.class.toLowerCase();

          if (cls.includes("cell phone") || cls.includes("phone")) {
            logEvent({
              type: "phone_detected",
              atMs: now2,
              confidence: p.score,
              meta: { bbox: p.bbox }
            });
          }

          if (cls.includes("book") || cls.includes("notebook")) {
            logEvent({
              type: "notes_detected",
              atMs: now2,
              confidence: p.score,
              meta: { bbox: p.bbox }
            });
          }

          if (["laptop", "keyboard", "tv", "monitor", "remote", "mouse"].some(k => cls.includes(k))) {
            logEvent({
              type: "extra_device_detected",
              atMs: now2,
              confidence: p.score,
              meta: { bbox: p.bbox }
            });
          }
        });
      } catch (error) {
        console.error("Object detection error:", error);
      }
    }

    animationFrameRef.current = requestAnimationFrame(loop);
  };

  const duration = sessionStart ? Math.round((performance.now() - sessionStart) / 1000) : 0;
  const score = computeScore();

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Focus & Object Detection – Interview Proctor</h1>

      {/* Debug Information */}
      <div className="fixed top-4 left-4 z-50 bg-black bg-opacity-70 text-white text-xs p-2 rounded">
        {debugInfo}
      </div>

      {/* Live Events Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 space-y-3">
        {liveEvents.map(event => (
          <EventToast key={event.id} event={event} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <VideoFeed
            videoRef={videoRef}
            canvasRef={canvasRef}
            lookingAway={lookingAway}
            lookingAwayDuration={lookingAwayDuration}
          />

          <ControlPanel
            recording={recording}
            isModelsLoaded={isModelsLoaded}
            recordedChunks={recordedChunks.current}
            events={events}
            startRecording={startRecording}
            stopRecording={stopRecording}
            downloadRecording={downloadRecording}
            downloadCSV={downloadCSV}
            onViewReport={fetchSessionReport}
          />
        </div>

        <div className="space-y-4">
          <CandidateInfo
            candidateName={candidateName}
            setCandidateName={setCandidateName}
            duration={duration}
            score={score}
            lookingAway={lookingAway}
            lookingAwayDuration={lookingAwayDuration}
          />

          <LiveEvents liveEvents={liveEvents} />
        </div>
      </div>

      {/* Report Modal */}
      {showReport && sessionReport && (
        <ReportModal
          report={sessionReport}
          onClose={() => setShowReport(false)}
        />
      )}

      <p className="mt-6 text-sm text-gray-500">
        Notes: Using face position for screen gaze detection.
        The system detects when you're not looking at the screen based on face position and size.
        Blue dot shows face center, yellow dot shows screen center.
      </p>
    </div>
  );
}

export default App;