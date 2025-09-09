// src/components/ControlPanel.tsx
import React from "react";
import jsPDF from "jspdf";
import type { LogEvent } from "../App";

interface ControlPanelProps {
    recording: boolean;
    isModelsLoaded: boolean;
    recordedChunks: BlobPart[];
    events: LogEvent[];
    startRecording: () => void;
    stopRecording: () => void;
    downloadRecording: () => void;
    downloadCSV: () => void;
    onViewReport: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
    recording,
    isModelsLoaded,
    recordedChunks,
    events,
    startRecording,
    stopRecording,
    downloadRecording,
    downloadCSV,
    onViewReport
}) => {
    const downloadPDF = () => {
        const doc = new jsPDF();
        const durationSec = 0; // This would need to be passed as a prop
        const score = 100; // This would need to be passed as a prop

        doc.setFontSize(16);
        doc.text("Proctoring Report", 14, 20);
        doc.setFontSize(11);
        doc.text(`Candidate: John Doe`, 14, 30); // This would need candidate name
        doc.text(`Interview Duration: ${durationSec}s`, 14, 38);
        doc.text(`Integrity Score: ${score}/100`, 14, 46);
        doc.text("Suspicious / Focus Events:", 14, 58);

        let y = 66;
        events.slice(-30).forEach((e) => {
            const line = `${Math.round(e.atMs)} ms – ${e.type}${e.durationMs ? ` (${Math.round(e.durationMs)} ms)` : ""}${e.confidence ? ` [conf ${e.confidence.toFixed(2)}]` : ""}`;
            doc.text(line, 14, y);
            y += 8;
            if (y > 280) { doc.addPage(); y = 20; }
        });

        doc.save("proctor-report.pdf");
    };

    return (
        <div className="flex flex-wrap gap-3">
            {!recording ? (
                <button
                    onClick={startRecording}
                    disabled={!isModelsLoaded}
                    className={`px-4 py-2 rounded-lg font-medium text-white transition-colors ${isModelsLoaded
                            ? 'bg-green-500 hover:bg-green-600 focus:ring-2 focus:ring-green-300'
                            : 'bg-gray-400 cursor-not-allowed'
                        }`}
                >
                    {isModelsLoaded ? 'Start Recording' : 'Loading Models...'}
                </button>
            ) : (
                <button
                    onClick={stopRecording}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors focus:ring-2 focus:ring-red-300"
                >
                    Stop Recording
                </button>
            )}
            <button
                onClick={downloadRecording}
                disabled={recording || recordedChunks.length === 0}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors focus:ring-2 focus:ring-blue-300 ${(recording || recordedChunks.length === 0)
                        ? 'bg-blue-400 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600'
                    }`}
            >
                Download Video
            </button>
            <button
                onClick={downloadCSV}
                disabled={events.length === 0}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors focus:ring-2 focus:ring-orange-300 ${events.length === 0
                        ? 'bg-orange-400 cursor-not-allowed'
                        : 'bg-orange-500 hover:bg-orange-600'
                    }`}
            >
                Export CSV
            </button>
            <button
                onClick={downloadPDF}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors focus:ring-2 focus:ring-purple-300"
            >
                Export PDF
            </button>
            <button
                onClick={onViewReport}
                disabled={events.length === 0}
                className={`px-4 py-2 rounded-lg font-medium text-white transition-colors focus:ring-2 focus:ring-indigo-300 ${events.length === 0
                        ? 'bg-indigo-400 cursor-not-allowed'
                        : 'bg-indigo-500 hover:bg-indigo-600'
                    }`}
            >
                View Report
            </button>
        </div>
    );
};

export default ControlPanel;