import React, { useState } from 'react';
import { 
  Sliders, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import { PipelineParams, DatasetInfo } from '../types';

interface ControlPanelProps {
  params: PipelineParams;
  onChange: (params: PipelineParams) => void;
  selectedDatasetInfo?: DatasetInfo;
  disabled?: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onChange,
  selectedDatasetInfo,
  disabled = false
}) => {
  const [open, setOpen] = useState({
    source: true,
    fusion: true,
    filters: true,
    color: true,
    frames: true
  });

  const toggle = (key: keyof typeof open) => {
    setOpen(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const updateParam = <K extends keyof PipelineParams>(key: K, value: PipelineParams[K]) => {
    onChange({ ...params, [key]: value });
  };

  const maxFrames = selectedDatasetInfo?.frame_count || 40;

  return (
    <aside className="w-64 bg-white border-r border-cad-border flex flex-col h-full overflow-y-auto text-cad-text select-none z-20 shrink-0">
      {/* Title */}
      <div className="p-2 border-b border-cad-border flex items-center justify-between bg-slate-50">
        <div className="flex items-center space-x-1.5">
          <Sliders className="h-3 w-3 text-blue-600" />
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-700">Controls</span>
        </div>
      </div>

      <div className="p-2 space-y-2 text-xs">
        {/* Section: Source Info */}
        <div className="rounded border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggle('source')}
            className="w-full px-2 py-1.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-left text-[11px] font-semibold text-slate-800"
          >
            <span>Source</span>
            {open.source ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
          </button>
          {open.source && selectedDatasetInfo && (
            <div className="p-2 space-y-1 bg-white text-[11px] font-mono border-t border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Provider:</span>
                <span className="font-semibold text-slate-800">{selectedDatasetInfo.source_badge}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Resolution:</span>
                <span>{selectedDatasetInfo.resolution[0]}×{selectedDatasetInfo.resolution[1]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Depth Scale:</span>
                <span>{selectedDatasetInfo.intrinsics?.depth_scale || 1000}</span>
              </div>
            </div>
          )}
        </div>

        {/* Section: IMU Fusion */}
        <div className="rounded border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggle('fusion')}
            className="w-full px-2 py-1.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-left text-[11px] font-semibold text-slate-800"
          >
            <span>IMU Fusion</span>
            {open.fusion ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
          </button>
          {open.fusion && (
            <div className="p-2 bg-white border-t border-slate-200 flex items-center justify-between text-[11px]">
              <span className="text-slate-700">6-DOF Integration</span>
              <input
                type="checkbox"
                checked={params.enable_imu_fusion}
                onChange={(e) => updateParam('enable_imu_fusion', e.target.checked)}
                disabled={disabled}
                className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer h-3.5 w-3.5"
              />
            </div>
          )}
        </div>

        {/* Section: Filters */}
        <div className="rounded border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggle('filters')}
            className="w-full px-2 py-1.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-left text-[11px] font-semibold text-slate-800"
          >
            <span>Filters</span>
            {open.filters ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
          </button>
          {open.filters && (
            <div className="p-2 space-y-2.5 bg-white border-t border-slate-200 text-[11px]">
              {/* Voxel Size */}
              <div>
                <div className="flex justify-between mb-0.5">
                  <span className="text-slate-600">Voxel Grid</span>
                  <span className="font-mono font-bold text-slate-900">{(params.voxel_size * 100).toFixed(1)} cm</span>
                </div>
                <input
                  type="range"
                  min="0.005"
                  max="0.08"
                  step="0.005"
                  value={params.voxel_size}
                  onChange={(e) => updateParam('voxel_size', parseFloat(e.target.value))}
                  disabled={disabled}
                  className="w-full cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                />
              </div>

              {/* Statistical Outlier */}
              <div className="pt-1.5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-700 font-medium">SOR Filter</span>
                  <input
                    type="checkbox"
                    checked={params.enable_sor}
                    onChange={(e) => updateParam('enable_sor', e.target.checked)}
                    disabled={disabled}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                  />
                </div>
                {params.enable_sor && (
                  <div className="space-y-1.5 pl-1">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Neighbors (k)</span>
                        <span className="font-mono font-bold text-slate-800">{params.sor_neighbors}</span>
                      </div>
                      <input
                        type="range"
                        min="5"
                        max="40"
                        step="1"
                        value={params.sor_neighbors}
                        onChange={(e) => updateParam('sor_neighbors', parseInt(e.target.value))}
                        disabled={disabled}
                        className="w-full cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Std Ratio (σ)</span>
                        <span className="font-mono font-bold text-slate-800">{params.sor_std_ratio.toFixed(1)}</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="3.0"
                        step="0.1"
                        value={params.sor_std_ratio}
                        onChange={(e) => updateParam('sor_std_ratio', parseFloat(e.target.value))}
                        disabled={disabled}
                        className="w-full cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Radius Outlier */}
              <div className="pt-1.5 border-t border-slate-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-700 font-medium">ROR Filter</span>
                  <input
                    type="checkbox"
                    checked={params.enable_ror}
                    onChange={(e) => updateParam('enable_ror', e.target.checked)}
                    disabled={disabled}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer h-3.5 w-3.5"
                  />
                </div>
                {params.enable_ror && (
                  <div className="pl-1">
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>Radius</span>
                      <span className="font-mono font-bold text-slate-800">{(params.ror_radius * 100).toFixed(1)} cm</span>
                    </div>
                    <input
                      type="range"
                      min="0.02"
                      max="0.15"
                      step="0.01"
                      value={params.ror_radius}
                      onChange={(e) => updateParam('ror_radius', parseFloat(e.target.value))}
                      disabled={disabled}
                      className="w-full cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Section: Colormaps */}
        <div className="rounded border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggle('color')}
            className="w-full px-2 py-1.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-left text-[11px] font-semibold text-slate-800"
          >
            <span>Colormap</span>
            {open.color ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
          </button>
          {open.color && (
            <div className="p-2 grid grid-cols-2 gap-1 bg-white border-t border-slate-200">
              {[
                { id: 'rgb', label: 'RGB' },
                { id: 'height', label: 'Height' },
                { id: 'depth', label: 'Depth' },
                { id: 'normals', label: 'Normals' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => updateParam('color_mode', m.id as any)}
                  disabled={disabled}
                  className={`py-1 px-1.5 rounded border text-center text-[10px] font-medium transition cursor-pointer ${
                    params.color_mode === m.id
                      ? 'bg-blue-50 border-blue-600 text-blue-900 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section: Frames */}
        <div className="rounded border border-slate-200 overflow-hidden">
          <button
            onClick={() => toggle('frames')}
            className="w-full px-2 py-1.5 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition cursor-pointer text-left text-[11px] font-semibold text-slate-800"
          >
            <span>Frames</span>
            {open.frames ? <ChevronUp className="h-3 w-3 text-slate-500" /> : <ChevronDown className="h-3 w-3 text-slate-500" />}
          </button>
          {open.frames && (
            <div className="p-2 space-y-1 bg-white border-t border-slate-200 text-[11px]">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Range:</span>
                <span className="font-mono font-bold text-slate-800">
                  {params.frame_start} → {params.frame_end} ({params.frame_end - params.frame_start}f)
                </span>
              </div>
              <input
                type="range"
                min="5"
                max={maxFrames}
                step="1"
                value={params.frame_end}
                onChange={(e) => updateParam('frame_end', parseInt(e.target.value))}
                disabled={disabled}
                className="w-full cursor-pointer h-1 bg-slate-200 rounded-lg appearance-none"
              />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
