import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Viewport3D } from './components/Viewport3D';
import { ControlPanel } from './components/ControlPanel';
import { TelemetryPanel } from './components/TelemetryPanel';
import { PlaybackTimeline } from './components/PlaybackTimeline';
import { ExportModal } from './components/ExportModal';
import { UploadModal } from './components/UploadModal';
import { 
  DatasetInfo, 
  PipelineParams, 
  ProcessingStats, 
  FrameTelemetry, 
  StreamFramePacket 
} from './types';

const API_BASE = import.meta.env.VITE_BACKEND_URL || 'https://tof-pointcloud-engine-production.up.railway.app';
const WS_BASE = API_BASE.replace(/^http/, 'ws');

export function App() {
  const [backendConnected, setBackendConnected] = useState(false);
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<string>('open3d_redwood_livingroom');

  const [params, setParams] = useState<PipelineParams>({
    dataset_id: 'open3d_redwood_livingroom',
    frame_start: 0,
    frame_end: 25,
    voxel_size: 0.02,
    enable_sor: true,
    sor_neighbors: 18,
    sor_std_ratio: 2.0,
    enable_ror: false,
    ror_points: 16,
    ror_radius: 0.05,
    enable_imu_fusion: true,
    color_mode: 'rgb'
  });

  const [points, setPoints] = useState<number[][]>([]);
  const [colors, setColors] = useState<number[][]>([]);
  const [telemetryHistory, setTelemetryHistory] = useState<FrameTelemetry[]>([]);
  const [stats, setStats] = useState<ProcessingStats | undefined>();
  const [currentFrame, setCurrentFrame] = useState(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [pointSize, setPointSize] = useState(0.015);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const playTimerRef = useRef<number | null>(null);

  // Check Backend Connection & Fetch Datasets
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/datasets`);
        if (res.ok) {
          const data = await res.json();
          setDatasets(data.datasets || []);
          setBackendConnected(true);
        } else {
          setBackendConnected(false);
        }
      } catch (err) {
        console.error('Error connecting to backend:', err);
        setBackendConnected(false);
      }
    };

    fetchDatasets();
    const interval = setInterval(fetchDatasets, 10000);
    return () => clearInterval(interval);
  }, []);

  // Update params when dataset changes
  const handleSelectDataset = (id: string) => {
    setSelectedDataset(id);
    const ds = datasets.find(d => d.id === id);
    const maxF = ds?.frame_count || 30;
    setParams(prev => ({
      ...prev,
      dataset_id: id,
      frame_start: 0,
      frame_end: Math.min(25, maxF)
    }));
    handleReset();
  };

  // Run One-Shot Full Reconstruction Pipeline
  const handleRunPipeline = async () => {
    if (isProcessing || isStreaming) return;
    setIsProcessing(true);

    try {
      const res = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, dataset_id: selectedDataset })
      });

      if (!res.ok) throw new Error('Pipeline execution failed');

      const data = await res.json();
      setPoints(data.points || []);
      setColors(data.colors || []);
      setStats(data.stats);
      setTelemetryHistory(data.telemetry || []);
      setCurrentFrame(params.frame_end - 1);
    } catch (err) {
      console.error('Pipeline error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Live WebSocket Stream
  const handleToggleStreaming = () => {
    if (isStreaming) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsStreaming(false);
    } else {
      handleReset();
      setIsStreaming(true);

      const ws = new WebSocket(`${WS_BASE}/ws/stream`);
      wsRef.current = ws;

      const accumulatedPoints: number[][] = [];
      const accumulatedColors: number[][] = [];
      const telemetryList: FrameTelemetry[] = [];

      ws.onopen = () => {
        const ds = datasets.find(d => d.id === selectedDataset);
        ws.send(JSON.stringify({
          action: 'start',
          dataset_id: selectedDataset,
          voxel_size: params.voxel_size,
          enable_imu_fusion: params.enable_imu_fusion,
          color_mode: params.color_mode,
          total_frames: ds?.frame_count || 30
        }));
      };

      ws.onmessage = (event) => {
        try {
          const packet: StreamFramePacket = JSON.parse(event.data);
          if (packet.type === 'frame' && packet.points && packet.telemetry) {
            accumulatedPoints.push(...packet.points);
            if (packet.colors) accumulatedColors.push(...packet.colors);

            const frameTelem: FrameTelemetry = {
              frame_idx: packet.frame_idx || 0,
              timestamp: packet.timestamp || 0,
              gyro: packet.telemetry.gyro,
              accel: packet.telemetry.accel,
              euler_deg: packet.telemetry.euler_deg,
              position: packet.telemetry.position || [0, 0, 0],
              quaternion: packet.telemetry.quaternion || [1, 0, 0, 0]
            };
            telemetryList.push(frameTelem);

            setPoints([...accumulatedPoints]);
            setColors([...accumulatedColors]);
            setTelemetryHistory([...telemetryList]);
            setCurrentFrame(packet.frame_idx || 0);

            if (packet.stats) {
              setStats({
                raw_count: accumulatedPoints.length + packet.stats.raw_points,
                filtered_count: accumulatedPoints.length,
                removed_count: Math.round(accumulatedPoints.length * 0.15),
                frames_processed: (packet.frame_idx || 0) + 1,
                latency_ms: packet.stats.latency_ms
              });
            }
          } else if (packet.type === 'complete') {
            setIsStreaming(false);
            ws.close();
          }
        } catch (e) {
          console.error('Error parsing WS frame:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('WS Error:', e);
        setIsStreaming(false);
      };

      ws.onclose = () => {
        setIsStreaming(false);
      };
    }
  };

  // Reset Scene
  const handleReset = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsStreaming(false);
    setIsPlaying(false);
    setPoints([]);
    setColors([]);
    setTelemetryHistory([]);
    setStats(undefined);
    setCurrentFrame(0);
  };

  // Direct Upload Success Handler
  const handleUploadSuccess = (data: {
    points: number[][];
    colors: number[][];
    normals?: number[][];
    stats?: any;
    filename: string;
  }) => {
    handleReset();
    setPoints(data.points || []);
    setColors(data.colors || []);
    if (data.stats) {
      setStats({
        raw_count: data.stats.raw_count || data.points.length,
        filtered_count: data.stats.filtered_count || data.points.length,
        removed_count: data.stats.removed_count || 0,
        frames_processed: 1,
        latency_ms: data.stats.latency_ms || 10
      });
    }
  };

  // Export File Handler
  const handleExport = async (format: 'ply' | 'pcd' | 'xyz') => {
    if (points.length === 0) return;

    const res = await fetch(`${API_BASE}/api/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        points,
        colors,
        file_format: format
      })
    });

    if (!res.ok) throw new Error('Export failed');

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pointcloud_${Date.now()}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Timeline Step Forward / Backward
  const handleStepForward = () => {
    const maxF = (datasets.find(d => d.id === selectedDataset)?.frame_count || 30) - 1;
    setCurrentFrame(prev => Math.min(maxF, prev + 1));
  };

  const handleStepBackward = () => {
    setCurrentFrame(prev => Math.max(0, prev - 1));
  };

  const handleTogglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  // Playback Loop
  useEffect(() => {
    if (isPlaying) {
      const maxF = (datasets.find(d => d.id === selectedDataset)?.frame_count || 30) - 1;
      playTimerRef.current = window.setInterval(() => {
        setCurrentFrame(prev => {
          if (prev >= maxF) {
            return 0;
          }
          return prev + 1;
        });
      }, 100);
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [isPlaying, selectedDataset, datasets]);

  const selectedDatasetInfo = datasets.find(d => d.id === selectedDataset);
  const currentTelemetry = telemetryHistory[currentFrame] || telemetryHistory[telemetryHistory.length - 1];

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-100 overflow-hidden select-none font-sans">
      {/* Top Header Bar */}
      <Header
        backendConnected={backendConnected}
        backendUrl={API_BASE}
        datasets={datasets}
        selectedDataset={selectedDataset}
        onSelectDataset={handleSelectDataset}
        isProcessing={isProcessing}
        isStreaming={isStreaming}
        onRunPipeline={handleRunPipeline}
        onToggleStreaming={handleToggleStreaming}
        onReset={handleReset}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        pointCount={points.length}
      />

      {/* Main Studio Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left: Engineering Control Panel */}
        <ControlPanel
          params={params}
          onChange={setParams}
          selectedDatasetInfo={selectedDatasetInfo}
          disabled={isProcessing || isStreaming}
        />

        {/* Center: 3D Three.js Viewport */}
        <main className="flex-1 relative h-full">
          <Viewport3D
            points={points}
            colors={colors}
            telemetryHistory={telemetryHistory}
            currentFrameIdx={currentFrame}
            pointSize={pointSize}
            onPointSizeChange={setPointSize}
            isStreaming={isStreaming}
          />
        </main>

        {/* Right: Live IMU Telemetry & Statistics */}
        <TelemetryPanel
          stats={stats}
          currentTelemetry={currentTelemetry}
          totalPoints={points.length}
          currentFrame={currentFrame}
          totalFrames={selectedDatasetInfo?.frame_count || 30}
          isStreaming={isStreaming}
        />
      </div>

      {/* Bottom: Playback & Scrubbing Timeline */}
      <PlaybackTimeline
        currentFrame={currentFrame}
        totalFrames={selectedDatasetInfo?.frame_count || 30}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onSeek={setCurrentFrame}
        onStepForward={handleStepForward}
        onStepBackward={handleStepBackward}
        onReset={handleReset}
        disabled={isProcessing || isStreaming}
      />

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        onExport={handleExport}
        pointCount={points.length}
      />

      {/* Real File Upload Modal */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        backendUrl={API_BASE}
        onUploadSuccess={handleUploadSuccess}
        params={params}
      />
    </div>
  );
}

export default App;
