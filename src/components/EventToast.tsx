// src/components/EventToast.tsx
import React from "react";
import type { LiveEvent } from "../App";

interface EventToastProps {
    event: LiveEvent;
}

const EventToast: React.FC<EventToastProps> = ({ event }) => {
    const getToastStyles = (type: string) => {
        switch (type) {
            case 'absence':
            case 'focus_lost':
            case 'not_looking_at_screen':
                return 'bg-red-100 border-red-500 text-red-800';
            case 'multi_face':
                return 'bg-yellow-100 border-yellow-500 text-yellow-800';
            default:
                return 'bg-purple-100 border-purple-500 text-purple-800';
        }
    };

    return (
        <div
            className={`p-3 rounded-lg shadow-lg border-l-4 max-w-xs transition-all duration-300 ${getToastStyles(event.type)}`}
        >
            <div className="font-medium">{event.message}</div>
            {event.duration && (
                <div className="text-xs mt-1">Duration: {Math.round(event.duration)}ms</div>
            )}
            {event.confidence && (
                <div className="text-xs">Confidence: {(event.confidence * 100).toFixed(0)}%</div>
            )}
        </div>
    );
};

export default EventToast;