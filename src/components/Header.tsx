import React from 'react';
import { 
  RotateCcw, 
  Download, 
  Upload,
  Activity, 
  Radio, 
  Play, 
  Square, 
  ExternalLink 
} from 'lucide-react';
import { DatasetInfo } from '../types';

interface HeaderProps {
  backendConnected: boolean;
  backendUrl: string;
  datasets: DatasetInfo[];
  selectedDataset: string;
  onSelectDataset: (id: string) => void;
  isProcessing: boolean;
  isStreaming: boolean;
  onRunPipeline: () => void;
  onToggleStreaming: () => void;
  onReset: () => void;
  onOpenExport: () => void;
  onOpenUpload: () => void;
  pointCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  backendConnected,
  datasets,
  selectedDataset,
  onSelectDataset,
  isProcessing,
  isStreaming,
  onRunPipeline,
  onToggleStreaming,
  onReset,
  onOpenExport,
  onOpenUpload,
  pointCount
}) => {
  const currentDataset = datasets.find(d => d.id === selectedDataset);

  return (
    <header className="h-10 bg-white border-b border-cad-border px-3 flex items-center justify-between z-30 shrink-0 select-none">
      {/* Brand */}
      <span className="font-bold text-slate-900 text-xs tracking-tight">ToF Studio</span>

      {/* Dataset Selector */}
      <div className="flex items-center space-x-1.5">
        <select
          value={selectedDataset}
          onChange={(e) => onSelectDataset(e.target.value)}
          disabled={isProcessing || isStreaming}
          className="bg-white border border-slate-300 text-slate-800 text-xs rounded px-2 py-0.5 focus:outline-none focus:border-blue-600 cursor-pointer disabled:opacity-50 font-medium"
        >
          <optgroup label="Open3D Data">
            {datasets.filter(d => d.id.startsWith('open3d_')).map(ds => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </optgroup>
          <optgroup label="Hugging Face">
            {datasets.filter(d => d.id.startsWith('hf_')).map(ds => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </optgroup>
          <optgroup label="TUM Benchmark">
            {datasets.filter(d => d.id.startsWith('tum_')).map(ds => (
              <option key={ds.id} value={ds.id}>{ds.name}</option>
            ))}
          </optgroup>
        </select>

        {currentDataset?.source_url && (
          <a
            href={currentDataset.source_url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 border border-slate-300 text-[10px] text-slate-700 font-mono"
            title={currentDataset.source}
          >
            <span>{currentDataset.source_badge}</span>
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-1.5">
        {/* Upload Button */}
        <button
          onClick={onOpenUpload}
          disabled={isProcessing || isStreaming || !backendConnected}
          className="flex items-center space-x-1 px-2 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 text-blue-700 rounded text-xs font-semibold border border-blue-200 transition cursor-pointer"
          title="Upload real depth map or 3D point cloud"
        >
          <Upload className="h-3 w-3" />
          <span>Upload</span>
        </button>

        {/* Run Pipeline */}
        <button
          onClick={onRunPipeline}
          disabled={isProcessing || isStreaming || !backendConnected}
          className="flex items-center space-x-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded text-xs font-semibold transition cursor-pointer"
        >
          {isProcessing ? <Activity className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          <span>{isProcessing ? 'Processing' : 'Run'}</span>
        </button>

        {/* Stream Sweep */}
        <button
          onClick={onToggleStreaming}
          disabled={isProcessing || !backendConnected}
          className={`flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-semibold border transition cursor-pointer ${
            isStreaming
              ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-700'
              : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
          }`}
        >
          {isStreaming ? (
            <>
              <Square className="h-3 w-3" />
              <span>Stop</span>
            </>
          ) : (
            <>
              <Radio className="h-3 w-3 text-blue-600" />
              <span>Stream</span>
            </>
          )}
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          disabled={isProcessing}
          className="p-1 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded border border-slate-300 transition cursor-pointer"
          title="Reset"
        >
          <RotateCcw className="h-3 w-3" />
        </button>

        {/* Export */}
        <button
          onClick={onOpenExport}
          disabled={pointCount === 0}
          className="flex items-center space-x-1 px-2 py-1 bg-white hover:bg-slate-100 disabled:opacity-40 text-slate-700 rounded text-xs font-medium border border-slate-300 transition cursor-pointer"
        >
          <Download className="h-3 w-3 text-emerald-600" />
          <span>Export</span>
        </button>

        <div className="h-4 w-px bg-slate-300 mx-0.5" />
        <div className="flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10px] font-mono">
          <span className={`h-1.5 w-1.5 rounded-full ${backendConnected ? 'bg-emerald-600' : 'bg-rose-600'}`} />
          <span className={backendConnected ? 'text-emerald-800 font-medium' : 'text-rose-800 font-medium'}>
            {backendConnected ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>
    </header>
  );
};
