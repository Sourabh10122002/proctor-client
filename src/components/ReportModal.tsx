// src/components/ReportModal.tsx
import React from "react";
import type { SessionReport } from "../App";

interface ReportModalProps {
    report: SessionReport;
    onClose: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({ report, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">Proctoring Report</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Candidate Name</p>
                        <p className="text-lg font-semibold text-gray-900">{report.candidateName}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-700">Interview Duration</p>
                        <p className="text-lg font-semibold text-gray-900">{report.interviewDuration} seconds</p>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Suspicious Events</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                            <p className="text-sm font-medium text-red-700">Focus Lost</p>
                            <p className="text-2xl font-bold text-red-800">{report.focusLostCount}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                            <p className="text-sm font-medium text-red-700">Absence</p>
                            <p className="text-2xl font-bold text-red-800">{report.absenceCount}</p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <p className="text-sm font-medium text-yellow-700">Multiple Faces</p>
                            <p className="text-2xl font-bold text-yellow-800">{report.multiFaceCount}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <p className="text-sm font-medium text-purple-700">Phone Detected</p>
                            <p className="text-2xl font-bold text-purple-800">{report.phoneDetectedCount}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <p className="text-sm font-medium text-purple-700">Notes Detected</p>
                            <p className="text-2xl font-bold text-purple-800">{report.notesDetectedCount}</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <p className="text-sm font-medium text-purple-700">Extra Devices</p>
                            <p className="text-2xl font-bold text-purple-800">{report.extraDeviceCount}</p>
                        </div>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Integrity Score</h3>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg text-center">
                        <p className="text-sm font-medium text-gray-700 mb-2">Final Score</p>
                        <div className={`text-5xl font-bold ${report.integrityScore >= 80 ? 'text-green-600' :
                                report.integrityScore >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                            {report.integrityScore}/100
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                            Calculated as 100 minus deductions for suspicious events
                        </p>
                    </div>
                </div>

                <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Event Log</h3>
                    <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                        {report.events.length === 0 ? (
                            <p className="text-gray-500 text-center">No events recorded</p>
                        ) : (
                            <ul className="space-y-2">
                                {report.events.map((event, index) => (
                                    <li key={index} className="text-sm p-2 rounded-lg odd:bg-white">
                                        <span className="font-mono text-xs text-gray-500 mr-2">
                                            {Math.round(event.atMs)}ms
                                        </span>
                                        <span className={`font-medium ${event.type === 'absence' || event.type === 'focus_lost' || event.type === 'not_looking_at_screen'
                                                ? 'text-red-600'
                                                : event.type === 'multi_face'
                                                    ? 'text-yellow-600'
                                                    : 'text-purple-600'
                                            }`}>
                                            {event.type}
                                        </span>
                                        {event.durationMs && (
                                            <span className="text-gray-600 ml-1">
                                                ({Math.round(event.durationMs)}ms)
                                            </span>
                                        )}
                                        {event.confidence && (
                                            <span className="text-gray-500 ml-1">
                                                conf: {event.confidence.toFixed(2)}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReportModal;