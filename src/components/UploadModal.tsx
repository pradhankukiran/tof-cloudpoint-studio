import React, { useState, useRef } from 'react';
import { X, Upload, FileCode, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { PipelineParams } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  backendUrl: string;
  onUploadSuccess: (data: {
    points: number[][];
    colors: number[][];
    normals?: number[][];
    stats?: any;
    filename: string;
  }) => void;
  params: PipelineParams;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  backendUrl,
  onUploadSuccess,
  params
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [rgbFile, setRgbFile] = useState<File | null>(null);
  const [fx, setFx] = useState<number>(525.0);
  const [fy, setFy] = useState<number>(525.0);
  const [depthScale, setDepthScale] = useState<number>(1000.0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const rgbInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setErrorMsg(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMsg('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('file', file);
    if (rgbFile) {
      formData.append('rgb_file', rgbFile);
    }
    formData.append('fx', fx.toString());
    formData.append('fy', fy.toString());
    formData.append('depth_scale', depthScale.toString());
    formData.append('voxel_size', params.voxel_size.toString());
    formData.append('enable_sor', params.enable_sor.toString());
    formData.append('sor_neighbors', params.sor_neighbors.toString());
    formData.append('sor_std_ratio', params.sor_std_ratio.toString());
    formData.append('color_mode', params.color_mode);

    try {
      const response = await fetch(`${backendUrl}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => null);
        throw new Error(errJson?.detail || errJson?.message || `Server responded with ${response.status}`);
      }

      const result = await response.json();
      onUploadSuccess({
        points: result.points,
        colors: result.colors,
        normals: result.normals,
        stats: result.stats,
        filename: file.name
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Upload processing failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const is3DFile = file && (
    file.name.endsWith('.ply') || file.name.endsWith('.pcd') || file.name.endsWith('.xyz')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-300 rounded-lg w-full max-w-sm p-4 shadow-lg space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center space-x-1.5 font-bold text-xs text-slate-900">
            <Upload className="h-3.5 w-3.5 text-blue-600" />
            <span>Upload Real Depth or 3D File</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition ${
            file
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.tiff,.tif,.npy,.ply,.pcd,.xyz"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setFile(e.target.files[0]);
                setErrorMsg(null);
              }
            }}
            className="hidden"
          />

          {file ? (
            <div className="flex items-center justify-center space-x-2 text-xs font-mono text-blue-900">
              <FileCode className="h-4 w-4 text-blue-600" />
              <span className="font-semibold truncate max-w-[200px]">{file.name}</span>
            </div>
          ) : (
            <div className="space-y-1">
              <Upload className="h-5 w-5 text-slate-400 mx-auto" />
              <div className="text-xs text-slate-700 font-medium">Click or drag raw file here</div>
              <div className="text-[10px] text-slate-400 font-mono">.PNG (16-bit) · .NPY · .PLY · .PCD · .XYZ</div>
            </div>
          )}
        </div>

        {/* Optional RGB Image for 2D Depth Maps */}
        {!is3DFile && file && (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between items-center text-[11px] text-slate-600">
              <span>Optional RGB Texture:</span>
              {rgbFile && <span className="font-mono text-blue-700 text-[10px] truncate max-w-[120px]">{rgbFile.name}</span>}
            </div>
            <input
              ref={rgbInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setRgbFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs text-slate-600 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
            />
          </div>
        )}

        {/* Intrinsics Config for Depth Maps */}
        {!is3DFile && (
          <div className="p-2 bg-slate-50 border border-slate-200 rounded space-y-2 text-[11px]">
            <div className="font-semibold text-slate-700 text-[10px] uppercase tracking-wide">Camera Intrinsics</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-500">Focal Length (fx, fy):</span>
                <input
                  type="number"
                  value={fx}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 525.0;
                    setFx(val);
                    setFy(val);
                  }}
                  className="w-full border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono bg-white mt-0.5"
                />
              </div>
              <div>
                <span className="text-slate-500">Depth Scale (mm/m):</span>
                <select
                  value={depthScale}
                  onChange={(e) => setDepthScale(parseFloat(e.target.value))}
                  className="w-full border border-slate-300 rounded px-1.5 py-0.5 text-xs font-mono bg-white mt-0.5"
                >
                  <option value={1000}>1000 (Standard mm)</option>
                  <option value={5000}>5000 (TUM Benchmark)</option>
                  <option value={1}>1 (Meters Float)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2 bg-rose-50 border border-rose-200 rounded flex items-center space-x-1.5 text-rose-700 text-xs">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{errorMsg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-3 py-1 text-xs text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded text-xs font-semibold flex items-center space-x-1 transition cursor-pointer"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3" />
                <span>Process & Render</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
