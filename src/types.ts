export interface DatasetInfo {
  id: string;
  name: string;
  source: string;
  source_badge: string;
  source_url?: string;
  category?: string;
  description: string;
  frame_count: number;
  fps: number;
  has_imu: boolean;
  has_rgb: boolean;
  has_depth: boolean;
  resolution: [number, number];
  intrinsics?: {
    fx: number;
    fy: number;
    cx: number;
    cy: number;
    depth_scale: number;
  };
}

export interface PipelineParams {
  dataset_id: string;
  frame_start: number;
  frame_end: number;
  voxel_size: number;
  enable_sor: boolean;
  sor_neighbors: number;
  sor_std_ratio: number;
  enable_ror: boolean;
  ror_points: number;
  ror_radius: number;
  enable_imu_fusion: boolean;
  color_mode: 'rgb' | 'height' | 'depth' | 'normals';
}

export interface IMUTelemetry {
  gyro: [number, number, number];
  accel: [number, number, number];
  euler_deg: [number, number, number];
  position?: [number, number, number];
  quaternion?: [number, number, number, number];
}

export interface FrameTelemetry {
  frame_idx: number;
  timestamp: number;
  gyro: [number, number, number];
  accel: [number, number, number];
  euler_deg: [number, number, number];
  position: [number, number, number];
  quaternion: [number, number, number, number];
}

export interface ProcessingStats {
  raw_count: number;
  filtered_count: number;
  removed_count: number;
  frames_processed: number;
  latency_ms: number;
}

export interface ProcessResult {
  status: string;
  points: number[][];
  colors: number[][];
  normals: number[][];
  stats: ProcessingStats;
  telemetry: FrameTelemetry[];
}

export interface StreamFramePacket {
  type: 'frame' | 'complete' | 'reset_ack' | 'error';
  frame_idx?: number;
  total_frames?: number;
  timestamp?: number;
  telemetry?: IMUTelemetry;
  points?: number[][];
  colors?: number[][];
  stats?: {
    raw_points: number;
    filtered_points: number;
    latency_ms: number;
  };
  message?: string;
}
