import React from 'react';
import { Activity } from 'lucide-react';
import { ProcessingStats, FrameTelemetry, IMUTelemetry } from '../types';

interface TelemetryPanelProps {
  stats?: ProcessingStats;
  currentTelemetry?: IMUTelemetry | FrameTelemetry;
  totalPoints: number;
  currentFrame: number;
  totalFrames: number;
  isStreaming: boolean;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({
  stats,
  currentTelemetry,
  totalPoints,
  currentFrame,
  totalFrames,
  isStreaming
}) => {
  const gyro = currentTelemetry?.gyro || [0, 0, 0];
  const accel = currentTelemetry?.accel || [0, 0, 9.81];
  const euler = currentTelemetry?.euler_deg || [0, 0, 0];
  const pos = (currentTelemetry as any)?.position || [0, 0, 0];

  const rejectionRate = stats && stats.raw_count > 0 
    ? ((stats.removed_count / stats.raw_count) * 100).toFixed(1)
    : '0.0';

  return (
    <aside className="w-60 bg-white border-l border-cad-border flex flex-col h-full overflow-y-auto text-cad-text select-none z-20 shrink-0">
      {/* Title */}
      <div className="p-2 border-b border-cad-border flex items-center justify-between bg-slate-50">
        <div className="flex items-center space-x-1.5">
          <Activity className="h-3 w-3 text-blue-600" />
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">Telemetry</span>
        </div>
        {isStreaming && (
          <span className="flex h-1.5 w-1.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-600"></span>
          </span>
        )}
      </div>

      <div className="p-2 space-y-2 text-xs">
        {/* IMU Orientation (RPY) */}
        <div className="rounded border border-slate-200 p-2 space-y-1.5 bg-white">
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase">
            <span>Orientation</span>
            <span>DEG</span>
          </div>
          <div className="grid grid-cols-3 gap-1 text-center font-mono text-[10px]">
            <div className="p-1 rounded bg-slate-50 border border-slate-200">
              <div className="text-slate-400 text-[8px]">R</div>
              <div className="font-bold text-slate-900">{euler[0].toFixed(1)}°</div>
            </div>
            <div className="p-1 rounded bg-slate-50 border border-slate-200">
              <div className="text-slate-400 text-[8px]">P</div>
              <div className="font-bold text-slate-900">{euler[1].toFixed(1)}°</div>
            </div>
            <div className="p-1 rounded bg-slate-50 border border-slate-200">
              <div className="text-slate-400 text-[8px]">Y</div>
              <div className="font-bold text-slate-900">{euler[2].toFixed(1)}°</div>
            </div>
          </div>
        </div>

        {/* Gyro & Accel */}
        <div className="rounded border border-slate-200 p-2 space-y-1.5 bg-white">
          <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase">
            <span>Gyro (rad/s)</span>
          </div>
          <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-center">
            <div className="bg-slate-50 p-0.5 rounded border border-slate-200">
              <span className="text-slate-400 text-[8px]">X </span><span className="font-semibold text-slate-800">{gyro[0].toFixed(2)}</span>
            </div>
            <div className="bg-slate-50 p-0.5 rounded border border-slate-200">
              <span className="text-slate-400 text-[8px]">Y </span><span className="font-semibold text-slate-800">{gyro[1].toFixed(2)}</span>
            </div>
            <div className="bg-slate-50 p-0.5 rounded border border-slate-200">
              <span className="text-slate-400 text-[8px]">Z </span><span className="font-semibold text-slate-800">{gyro[2].toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase pt-1">
            <span>Accel (m/s²)</span>
          </div>
          <div className="grid grid-cols-3 gap-1 font-mono text-[10px] text-center">
            <div className="bg-slate-50 p-0.5 rounded border border-slate-200">
              <span className="text-slate-400 text-[8px]">X </span><span className="font-semibold text-slate-800">{accel[0].toFixed(1)}</span>
            </div>
            <div className="bg-slate-50 p-0.5 rounded border border-slate-200">
              <span className="text-slate-400 text-[8px]">Y </span><span className="font-semibold text-slate-800">{accel[1].toFixed(1)}</span>
            </div>
            <div className="bg-slate-50 p-0.5 rounded border border-slate-200">
              <span className="text-slate-400 text-[8px]">Z </span><span className="font-semibold text-slate-800">{accel[2].toFixed(1)}</span>
            </div>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-semibold uppercase pt-1">
            <span>Position (m)</span>
          </div>
          <div className="font-mono text-[10px] bg-slate-50 p-1 rounded border border-slate-200 text-slate-800 font-semibold text-center">
            [{pos[0].toFixed(2)}, {pos[1].toFixed(2)}, {pos[2].toFixed(2)}]
          </div>
        </div>

        {/* Reconstruction Metrics */}
        <div className="rounded border border-slate-200 p-2 space-y-1 bg-white font-mono text-[11px]">
          <div className="flex justify-between p-1 rounded bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-sans">Points:</span>
            <span className="font-bold text-blue-700">{totalPoints.toLocaleString()}</span>
          </div>
          {stats && (
            <>
              <div className="flex justify-between p-1 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-sans">Rejected:</span>
                <span className="font-bold text-rose-700">{rejectionRate}%</span>
              </div>
              <div className="flex justify-between p-1 rounded bg-slate-50 border border-slate-100">
                <span className="text-slate-500 font-sans">Latency:</span>
                <span className="font-bold text-slate-800">{stats.latency_ms} ms</span>
              </div>
            </>
          )}
          <div className="flex justify-between p-1 rounded bg-slate-50 border border-slate-100">
            <span className="text-slate-500 font-sans">Frame:</span>
            <span className="font-bold text-emerald-700">{currentFrame} / {totalFrames}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
