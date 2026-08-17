import React from 'react';
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  RotateCcw 
} from 'lucide-react';

interface PlaybackTimelineProps {
  currentFrame: number;
  totalFrames: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (frame: number) => void;
  onStepForward: () => void;
  onStepBackward: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export const PlaybackTimeline: React.FC<PlaybackTimelineProps> = ({
  currentFrame,
  totalFrames,
  isPlaying,
  onTogglePlay,
  onSeek,
  onStepForward,
  onStepBackward,
  onReset,
  disabled = false
}) => {
  return (
    <div className="h-9 bg-white border-t border-cad-border px-3 flex items-center justify-between text-cad-text select-none z-20 shrink-0">
      {/* Transport */}
      <div className="flex items-center space-x-1">
        <button
          onClick={onReset}
          disabled={disabled}
          className="p-1 rounded hover:bg-slate-100 text-slate-600 transition disabled:opacity-40 cursor-pointer"
          title="Reset"
        >
          <RotateCcw className="h-3 w-3" />
        </button>

        <button
          onClick={onStepBackward}
          disabled={disabled || currentFrame <= 0}
          className="p-1 rounded hover:bg-slate-100 text-slate-600 transition disabled:opacity-40 cursor-pointer"
          title="Prev"
        >
          <SkipBack className="h-3 w-3" />
        </button>

        <button
          onClick={onTogglePlay}
          disabled={disabled}
          className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-1 font-semibold text-xs transition disabled:opacity-40 cursor-pointer"
        >
          {isPlaying ? (
            <>
              <Pause className="h-3 w-3" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="h-3 w-3" />
              <span>Play</span>
            </>
          )}
        </button>

        <button
          onClick={onStepForward}
          disabled={disabled || currentFrame >= totalFrames - 1}
          className="p-1 rounded hover:bg-slate-100 text-slate-600 transition disabled:opacity-40 cursor-pointer"
          title="Next"
        >
          <SkipForward className="h-3 w-3" />
        </button>
      </div>

      {/* Scrubber */}
      <div className="flex-1 max-w-2xl mx-4 flex items-center space-x-2">
        <span className="text-[11px] font-mono text-blue-700 font-bold w-8 text-right">
          F{currentFrame.toString().padStart(2, '0')}
        </span>

        <input
          type="range"
          min="0"
          max={Math.max(0, totalFrames - 1)}
          value={currentFrame}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          disabled={disabled}
          className="flex-1 cursor-pointer accent-blue-600 h-1 bg-slate-200 rounded appearance-none"
        />

        <span className="text-[11px] font-mono text-slate-400 w-8">
          /{Math.max(0, totalFrames - 1).toString().padStart(2, '0')}
        </span>
      </div>

      <div className="w-16" />
    </div>
  );
};
