// src/components/LiveEvents.tsx
import React from "react";
import type { LiveEvent } from "../App";

interface LiveEventsProps {
    liveEvents: LiveEvent[];
}

const LiveEvents: React.FC<LiveEventsProps> = ({ liveEvents }) => {
    return (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm h-96 overflow-hidden flex flex-col">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Live Events</h2>
            <div className="flex-1 overflow-y-auto pr-2">
                {liveEvents.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500">
                        No events detected yet
                    </div>
                ) : (
                    <ul className="space-y-2">
                        {liveEvents.map((event) => (
                            <li key={event.id} className="text-sm p-2 rounded-lg odd:bg-gray-50">
                                <span className="font-mono text-xs text-gray-500 mr-2">
                                    {Math.round(performance.now() - event.timestamp)}ms ago
                                </span>
                                <span className={`font-medium ${event.type === 'absence' || event.type === 'focus_lost' || event.type === 'not_looking_at_screen'
                                        ? 'text-red-600'
                                        : event.type === 'multi_face'
                                            ? 'text-yellow-600'
                                            : 'text-purple-600'
                                    }`}>
                                    {event.message}
                                </span>
                                {event.duration && (
                                    <span className="text-gray-600 ml-1">
                                        ({Math.round(event.duration)}ms)
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
    );
};

export default LiveEvents;