import React, { useState } from 'react';
import { Download, X, FileSpreadsheet, FileText, Check } from 'lucide-react';

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const [downloaded, setDownloaded] = useState(false);
  const [format, setFormat] = useState<'csv' | 'pdf' | 'xlsx'>('csv');

  const handleExport = () => {
    setDownloaded(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 cursor-pointer"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 relative animate-in fade-in zoom-in-95 duration-200 text-xs cursor-default max-h-[90vh] overflow-y-auto"
      >
        <button onClick={onClose} className="absolute right-4 top-4 text-slate-400 hover:text-slate-600">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2.5 mb-4 border-b border-slate-100 pb-3">
          <div className="p-2 bg-teal-50 text-[#0B4F4C] rounded-xl">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">Export Clinical Data</h3>
            <p className="text-[11px] text-slate-500">Download report metrics for auditing.</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <label className="block text-slate-600 font-semibold mb-1">Select File Format</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
              { id: 'pdf', label: 'PDF Report', icon: FileText },
              { id: 'xlsx', label: 'Excel XLSX', icon: FileSpreadsheet },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFormat(f.id as any)}
                className={`p-3 rounded-xl border font-semibold flex flex-col items-center justify-center text-center transition-all ${
                  format === f.id
                    ? 'border-[#0B4F4C] bg-teal-50/80 text-[#0B4F4C]'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <f.icon className="w-4 h-4 mb-1" />
                <span>{f.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleExport}
          className="w-full py-2.5 bg-[#0B4F4C] hover:bg-[#083E3B] text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-2"
        >
          {downloaded ? (
            <>
              <Check className="w-4 h-4" />
              <span>Report Downloaded!</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Generate & Download</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
