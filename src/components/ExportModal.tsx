import React, { useState } from 'react';
import { X, Download, CheckCircle2, Loader2 } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (format: 'ply' | 'pcd' | 'xyz') => Promise<void>;
  pointCount: number;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  pointCount
}) => {
  const [format, setFormat] = useState<'ply' | 'pcd' | 'xyz'>('ply');
  const [isExporting, setIsExporting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      await onExport(format);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-xs select-none">
      <div className="bg-white border border-slate-300 rounded-lg w-full max-w-xs p-3 shadow-lg space-y-2.5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
          <span className="text-xs font-bold text-slate-800">Export Point Cloud</span>
          <button
            onClick={onClose}
            className="p-0.5 text-slate-400 hover:text-slate-700 rounded transition cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Info & Format */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-[11px] font-mono bg-slate-50 p-1.5 rounded border border-slate-200">
            <span className="text-slate-500 font-sans">Points:</span>
            <span className="font-bold text-blue-700">{pointCount.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(['ply', 'pcd', 'xyz'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setFormat(fmt)}
                className={`py-1.5 px-2 rounded border text-center font-mono text-xs font-bold transition cursor-pointer ${
                  format === fmt
                    ? 'bg-blue-50 border-blue-600 text-blue-900'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                .{fmt.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end space-x-1.5 pt-1.5 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs text-slate-600 hover:text-slate-900 rounded hover:bg-slate-100 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDownload}
            disabled={isExporting}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold flex items-center space-x-1 transition cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : success ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            <span>{isExporting ? 'Saving' : success ? 'Saved' : 'Download'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
