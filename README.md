# ToF PointCloud Studio

High-density WebGL engineering workstation for real-time 3D Time-of-Flight (ToF) point cloud visualization, 6-DOF IMU sensor telemetry inspection, and spatial filter parameterization.

Built with React 18, TypeScript, Three.js, Vite, and Tailwind CSS. Deployed on Vercel.

---

## Architectural Overview

ToF PointCloud Studio provides an industrial-grade CAD interface for depth camera sensor fusion systems.

```
[REST / WebSocket / File Upload]
              |
              v
     [App State Engine]
     /        |        \
    v         v         v
[Controls] [3D Viewport] [Telemetry]
              |
              v
[Three.js GPU Buffer Geometry]
              |
              v
[60 FPS Interactive Orbit Canvas]
```

---

## Key Capabilities

* **High-Performance 3D Viewport:** Interactive Three.js WebGL rendering engine with GPU `BufferGeometry`, hardware coordinate axes, metric ground grid, and dynamic point sizing.
* **Trajectory Path & Sensor Frustum:** Live 3D visualization of camera position path ($X, Y, Z$) and orientation frustum derived from fused IMU quaternions.
* **6-DOF IMU Telemetry Readout:** Real-time monitoring of orientation (Roll, Pitch, Yaw), angular velocity ($\boldsymbol{\omega}$ in rad/s), linear acceleration ($\mathbf{a}$ in $\text{m/s}^2$), and integrated position.
* **Spatial Filter Configuration:** Parameterize voxel grid downsampling ($0.5\,\text{cm} - 8.0\,\text{cm}$), Statistical Outlier Removal ($k$, $\sigma$), and Radius Outlier Removal ($r$) with live visual feedback.
* **Colormap Engine:** Instant switching between True RGB sensor textures, Elevation ($Z$-height ramp), Turbo Depth maps, and Normal vector orientations.
* **Direct Hardware Ingestion:** Drag-and-drop file upload for real 16-bit PNG, TIFF, or NPY depth maps and raw 3D point cloud files (`.PLY`, `.PCD`, `.XYZ`).
* **Multi-Format Export:** Export processed point clouds into industry-standard `.PLY`, `.PCD`, and `.XYZ` files.

---

## Component Hierarchy

```
src/
├── App.tsx                     # Master state machine, WebSocket lifecycle, and REST coordinator
├── types.ts                    # TypeScript data models for telemetry, intrinsics, and packets
├── main.tsx                    # React application root
├── index.css                   # CAD theme style definitions and slider styling
└── components/
    ├── Header.tsx              # Dataset selector, pipeline triggers, stream controls, and engine status
    ├── Viewport3D.tsx          # Three.js WebGL canvas, orbit camera, grid, axes, and trajectory frustum
    ├── ControlPanel.tsx        # Voxel, SOR, ROR, Colormap, and frame range controls
    ├── TelemetryPanel.tsx      # Real-time IMU orientation, gyro, accel, position, and metrics
    ├── PlaybackTimeline.tsx    # Multi-frame transport scrubber and frame-stepping controls
    ├── UploadModal.tsx         # Drag-and-drop raw depth map and 3D point cloud ingestion
    └── ExportModal.tsx         # Point cloud download modal (.PLY, .PCD, .XYZ)
```

---

## 3D Coordinate System Convention

The viewer uses the standard right-handed Cartesian coordinate system:
* **+X:** Right (Horizontal lateral span)
* **+Y:** Up (Elevation / Height)
* **+Z:** Outward / Depth (Forward optical depth)

---

## Local Development

### Requirements
* Node.js 18+
* npm or yarn

### Installation
```bash
git clone https://github.com/pradhankukiran/tof-cloudpoint-studio.git
cd tof-cloudpoint-studio

npm install
```

### Environment Configuration
Create a `.env` file in the root directory:
```env
VITE_BACKEND_URL=https://tof-pointcloud-engine-production.up.railway.app
```

### Development Server
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

---

## Deployment

The studio is configured for automated continuous deployment with Vercel:
```bash
vercel --prod
```

Production URL: `https://tof-cloudpoint-studio.vercel.app`

---

## License
MIT License.
