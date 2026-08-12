import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Eye, 
  Grid, 
  Compass, 
  Sparkles,
  Sun,
  Moon
} from 'lucide-react';
import { FrameTelemetry } from '../types';

interface Viewport3DProps {
  points: number[][];
  colors: number[][];
  telemetryHistory?: FrameTelemetry[];
  currentFrameIdx?: number;
  pointSize?: number;
  onPointSizeChange?: (size: number) => void;
  isStreaming?: boolean;
}

export const Viewport3D: React.FC<Viewport3DProps> = ({
  points,
  colors,
  telemetryHistory = [],
  pointSize = 0.015,
  onPointSizeChange,
  isStreaming = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const pointsObjRef = useRef<THREE.Points | null>(null);
  const trajectoryLineRef = useRef<THREE.Line | null>(null);
  const frustumHelperRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const axesHelperRef = useRef<THREE.AxesHelper | null>(null);

  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(true);
  const [showTrajectory, setShowTrajectory] = useState(true);
  const [viewportBg, setViewportBg] = useState<'cad_light' | 'cad_slate'>('cad_light');
  const [fps, setFps] = useState(60);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf1f5f9);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.05, 100);
    camera.position.set(0, 1.8, 3.5);
    camera.lookAt(0, 0, 1.2);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const grid = new THREE.GridHelper(10, 20, 0x2563eb, 0x94a3b8);
    grid.position.y = -0.5;
    scene.add(grid);
    gridHelperRef.current = grid;

    const axes = new THREE.AxesHelper(0.5);
    axes.position.set(-2, -0.49, -2);
    scene.add(axes);
    axesHelperRef.current = axes;

    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
      size: pointSize,
      vertexColors: true,
      sizeAttenuation: true,
      transparent: false
    });
    const pointsMesh = new THREE.Points(geometry, material);
    scene.add(pointsMesh);
    pointsObjRef.current = pointsMesh;

    const lineGeo = new THREE.BufferGeometry();
    const lineMat = new THREE.LineBasicMaterial({ color: 0x0284c7, linewidth: 2 });
    const trajectoryLine = new THREE.Line(lineGeo, lineMat);
    scene.add(trajectoryLine);
    trajectoryLineRef.current = trajectoryLine;

    const frustumGroup = new THREE.Group();
    const coneGeo = new THREE.ConeGeometry(0.12, 0.25, 4);
    coneGeo.rotateX(Math.PI / 2);
    const coneMat = new THREE.MeshBasicMaterial({ color: 0xd97706, wireframe: true });
    const coneMesh = new THREE.Mesh(coneGeo, coneMat);
    frustumGroup.add(coneMesh);
    scene.add(frustumGroup);
    frustumHelperRef.current = frustumGroup;

    let isDragging = false;
    let isRightDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let target = new THREE.Vector3(0, 0, 1.2);
    let spherical = new THREE.Spherical().setFromVector3(camera.position.clone().sub(target));

    const handlePointerDown = (e: MouseEvent) => {
      if (e.button === 0) isDragging = true;
      if (e.button === 2) isRightDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handlePointerMove = (e: MouseEvent) => {
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      if (isDragging) {
        spherical.theta -= dx * 0.006;
        spherical.phi = Math.max(0.05, Math.min(Math.PI - 0.05, spherical.phi - dy * 0.006));
        camera.position.setFromSpherical(spherical).add(target);
        camera.lookAt(target);
      } else if (isRightDragging) {
        const panSpeed = 0.003;
        const forward = new THREE.Vector3().subVectors(target, camera.position).normalize();
        const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
        const up = camera.up;

        target.addScaledVector(right, -dx * panSpeed);
        target.addScaledVector(up, dy * panSpeed);
        camera.position.setFromSpherical(spherical).add(target);
        camera.lookAt(target);
      }
    };

    const handlePointerUp = () => {
      isDragging = false;
      isRightDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(0.3, Math.min(30, spherical.radius + e.deltaY * 0.003));
      camera.position.setFromSpherical(spherical).add(target);
      camera.lookAt(target);
    };

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();

    const domElement = renderer.domElement;
    domElement.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    domElement.addEventListener('wheel', handleWheel, { passive: false });
    domElement.addEventListener('contextmenu', handleContextMenu);

    let animationId: number;
    let lastTime = performance.now();
    let frameCounter = 0;

    const animate = (currentTime: number) => {
      animationId = requestAnimationFrame(animate);
      renderer.render(scene, camera);

      frameCounter++;
      if (currentTime - lastTime >= 1000) {
        setFps(Math.round((frameCounter * 1000) / (currentTime - lastTime)));
        frameCounter = 0;
        lastTime = currentTime;
      }
    };
    animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      domElement.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      domElement.removeEventListener('wheel', handleWheel);
      domElement.removeEventListener('contextmenu', handleContextMenu);
      renderer.dispose();
      if (containerRef.current?.contains(domElement)) {
        containerRef.current.removeChild(domElement);
      }
    };
  }, []);

  // Update background color
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(viewportBg === 'cad_light' ? 0xf1f5f9 : 0x1e293b);
    }
  }, [viewportBg]);

  // Update Points Geometry
  useEffect(() => {
    if (!pointsObjRef.current) return;

    const geometry = pointsObjRef.current.geometry;
    const count = points.length;

    if (count === 0) {
      geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(0), 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(0), 3));
      return;
    }

    const posArray = new Float32Array(count * 3);
    const colArray = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      posArray[i * 3] = points[i][0];
      posArray[i * 3 + 1] = points[i][1];
      posArray[i * 3 + 2] = points[i][2];

      if (colors && colors[i]) {
        colArray[i * 3] = colors[i][0];
        colArray[i * 3 + 1] = colors[i][1];
        colArray[i * 3 + 2] = colors[i][2];
      } else {
        colArray[i * 3] = 0.15;
        colArray[i * 3 + 1] = 0.4;
        colArray[i * 3 + 2] = 0.9;
      }
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colArray, 3));
    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.color.needsUpdate = true;
    geometry.computeBoundingSphere();
  }, [points, colors]);

  // Update Point Size
  useEffect(() => {
    if (pointsObjRef.current) {
      (pointsObjRef.current.material as THREE.PointsMaterial).size = pointSize;
    }
  }, [pointSize]);

  // Update Trajectory
  useEffect(() => {
    if (!trajectoryLineRef.current || !frustumHelperRef.current) return;

    if (telemetryHistory.length > 0 && showTrajectory) {
      const positions: number[] = [];
      telemetryHistory.forEach((t) => {
        if (t.position) {
          positions.push(t.position[0], t.position[1], t.position[2]);
        }
      });

      const lineGeo = trajectoryLineRef.current.geometry;
      lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      lineGeo.attributes.position.needsUpdate = true;

      const last = telemetryHistory[telemetryHistory.length - 1];
      if (last && last.position && last.quaternion) {
        frustumHelperRef.current.position.set(last.position[0], last.position[1], last.position[2]);
        const q = last.quaternion;
        frustumHelperRef.current.quaternion.set(q[1], q[2], q[3], q[0]);
        frustumHelperRef.current.visible = true;
      }
    } else {
      frustumHelperRef.current.visible = false;
    }
  }, [telemetryHistory, showTrajectory]);

  // Toggle Helpers
  useEffect(() => {
    if (gridHelperRef.current) gridHelperRef.current.visible = showGrid;
    if (axesHelperRef.current) axesHelperRef.current.visible = showAxes;
    if (trajectoryLineRef.current) trajectoryLineRef.current.visible = showTrajectory;
  }, [showGrid, showAxes, showTrajectory]);

  const resetCamera = () => {
    if (!cameraRef.current) return;
    cameraRef.current.position.set(0, 1.8, 3.5);
    cameraRef.current.lookAt(0, 0, 1.2);
  };

  return (
    <div className="relative w-full h-full bg-slate-100 overflow-hidden select-none border-x border-cad-border">
      {/* 3D Canvas */}
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Top Left HUD */}
      <div className="absolute top-2 left-2 flex items-center space-x-2 bg-white/90 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-mono text-slate-700 pointer-events-none">
        <span>{points.length.toLocaleString()} pts</span>
        <span>·</span>
        <span>{fps} fps</span>
        {isStreaming && (
          <>
            <span>·</span>
            <span className="text-amber-700 font-semibold">Live</span>
          </>
        )}
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-2 right-2 flex items-center space-x-1 bg-white border border-slate-200 p-0.5 rounded">
        <button
          onClick={() => setShowGrid(!showGrid)}
          className={`p-1 rounded text-xs transition cursor-pointer ${
            showGrid ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Grid"
        >
          <Grid className="h-3 w-3" />
        </button>

        <button
          onClick={() => setShowAxes(!showAxes)}
          className={`p-1 rounded text-xs transition cursor-pointer ${
            showAxes ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Axes"
        >
          <Compass className="h-3 w-3" />
        </button>

        <button
          onClick={() => setShowTrajectory(!showTrajectory)}
          className={`p-1 rounded text-xs transition cursor-pointer ${
            showTrajectory ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="Trajectory"
        >
          <Sparkles className="h-3 w-3" />
        </button>

        <button
          onClick={() => setViewportBg(viewportBg === 'cad_light' ? 'cad_slate' : 'cad_light')}
          className="p-1 rounded text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          title="Background"
        >
          {viewportBg === 'cad_light' ? <Moon className="h-3 w-3" /> : <Sun className="h-3 w-3" />}
        </button>

        <div className="h-3.5 w-px bg-slate-200 mx-0.5" />

        <button
          onClick={resetCamera}
          className="p-1 rounded text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          title="Reset View"
        >
          <Eye className="h-3 w-3" />
        </button>
      </div>

      {/* Point Size */}
      {onPointSizeChange && (
        <div className="absolute bottom-2 left-2 bg-white/90 border border-slate-200 px-2 py-1 rounded flex items-center space-x-1.5 text-[10px] text-slate-600 font-mono">
          <span>Size:</span>
          <input
            type="range"
            min="0.005"
            max="0.05"
            step="0.002"
            value={pointSize}
            onChange={(e) => onPointSizeChange(parseFloat(e.target.value))}
            className="w-16 cursor-pointer h-1 bg-slate-200 rounded appearance-none"
          />
        </div>
      )}
    </div>
  );
};
