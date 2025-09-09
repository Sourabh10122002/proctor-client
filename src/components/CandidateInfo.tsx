// src/components/CandidateInfo.tsx
import React from "react";

interface CandidateInfoProps {
    candidateName: string;
    setCandidateName: (name: string) => void;
    duration: number;
    score: number;
    lookingAway: boolean;
    lookingAwayDuration: number;
}

const CandidateInfo: React.FC<CandidateInfoProps> = ({
    candidateName,
    setCandidateName,
    duration,
    score,
    lookingAway,
    lookingAwayDuration
}) => {
    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Candidate Name:</label>
                <input
                    value={candidateName}
                    onChange={e => setCandidateName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <p className="text-sm font-medium text-gray-700">Duration</p>
                    <p className="text-lg font-semibold text-gray-900">{duration}s</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-gray-700">Integrity Score</p>
                    <p className={`text-lg font-semibold ${score >= 80 ? 'text-green-600' :
                            score >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                        {score}/100
                    </p>
                </div>
            </div>
            {lookingAway && (
                <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                    <p className="text-red-700 font-medium">Candidate not looking at screen for {lookingAwayDuration} seconds</p>
                </div>
            )}
        </div>
    );
};

export default CandidateInfo;