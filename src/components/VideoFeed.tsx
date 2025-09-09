// src/components/VideoFeed.tsx
import React from "react";

interface VideoFeedProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    lookingAway: boolean;
    lookingAwayDuration: number;
}

const VideoFeed: React.FC<VideoFeedProps> = ({
    videoRef,
    canvasRef,
    lookingAway,
    lookingAwayDuration
}) => {
    return (
        <>
            <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                <video
                    ref={videoRef}
                    playsInline
                    muted
                    autoPlay
                    className="w-full h-auto scale-x-[-1]"
                />
                {lookingAway && (
                    <div className="absolute inset-0 bg-red-500 bg-opacity-20 flex items-center justify-center">
                        <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold">
                            Not looking at screen ({lookingAwayDuration}s)
                        </div>
                    </div>
                )}
            </div>
            <div className="relative rounded-xl overflow-hidden border border-gray-200 border-dashed shadow-sm">
                <canvas
                    ref={canvasRef}
                    className="w-full h-auto scale-x-[-1]"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs p-1 rounded">
                    Blue dot: Face center, Yellow dot: Screen center
                </div>
            </div>
        </>
    );
};

export default VideoFeed;