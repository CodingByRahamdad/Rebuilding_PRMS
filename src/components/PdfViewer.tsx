import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Loader2,
  AlertCircle,
  FileText,
  Maximize,
  Minimize,
  RefreshCw,
} from 'lucide-react';

// Set up PDF.js worker
if (typeof window !== 'undefined') {
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn('Could not set workerSrc:', e);
  }
}

interface PdfViewerProps {
  url: string;
  fileName?: string;
  onDownload?: () => void;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ url, fileName = 'Document.pdf', onDownload }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pageRendering, setPageRendering] = useState<boolean>(false);
  const renderTaskRef = useRef<any>(null);

  // Scroll to top whenever page or document changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentPage, url]);

  // Load PDF Document
  useEffect(() => {
    let isCancelled = false;
    setLoading(true);
    setError(null);
    setCurrentPage(1);

    const loadPdf = async () => {
      try {
        let loadingTask: any;

        if (url.startsWith('data:')) {
          // Convert base64 data URL to Uint8Array for direct in-memory loading
          const base64Index = url.indexOf(';base64,');
          let base64 = url;
          if (base64Index !== -1) {
            base64 = url.substring(base64Index + 8);
          } else if (url.includes(',')) {
            base64 = url.split(',')[1];
          }
          
          const raw = window.atob(base64);
          const rawLength = raw.length;
          const array = new Uint8Array(new ArrayBuffer(rawLength));
          for (let i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
          }

          loadingTask = pdfjsLib.getDocument({ data: array });
        } else if (url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
          loadingTask = pdfjsLib.getDocument(url);
        } else {
          // If it's a mock or invalid URL, throw to trigger fallback
          throw new Error('Document preview not available in binary format. Showing formatted document view.');
        }

        const doc = await loadingTask.promise;
        if (!isCancelled) {
          setPdfDoc(doc);
          setNumPages(doc.numPages);
          setLoading(false);
        }
      } catch (err: any) {
        console.warn('Notice from PDF viewer engine:', err);
        if (!isCancelled) {
          setError(err?.message || 'Could not load binary PDF stream');
          setLoading(false);
        }
      }
    };

    if (url) {
      loadPdf();
    } else {
      setError('No PDF URL or data provided');
      setLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [url]);

  // Render Current Page
  useEffect(() => {
    if (!pdfDoc || currentPage < 1 || currentPage > numPages || !canvasRef.current) {
      return;
    }

    let isCancelled = false;
    setPageRendering(true);

    const renderPage = async () => {
      try {
        // Cancel any ongoing rendering task before starting a new one
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch (e) {
            // ignore cancel errors
          }
        }

        const page = await pdfDoc.getPage(currentPage);
        if (isCancelled || !canvasRef.current) return;

        const viewport = page.getViewport({ scale, rotation });
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { alpha: false });

        if (!ctx) return;

        // Support High-DPI screens
        const outputScale = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined;

        const renderContext = {
          canvasContext: ctx,
          transform,
          viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        if (!isCancelled) {
          setPageRendering(false);
        }
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
        if (!isCancelled) {
          setPageRendering(false);
        }
      }
    };

    renderPage();

    return () => {
      isCancelled = true;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [pdfDoc, currentPage, scale, rotation, numPages]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, Math.round((prev + 0.2) * 10) / 10));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.6, Math.round((prev - 0.2) * 10) / 10));
  };

  const handleResetZoom = () => {
    setScale(1.2);
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownloadFile = () => {
    if (onDownload) {
      onDownload();
      return;
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900/95 rounded-2xl overflow-hidden border border-slate-800 shadow-xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-slate-200 text-xs shrink-0 select-none">
        {/* Left: Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 transition cursor-pointer text-slate-300 hover:text-white"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-1 font-mono text-xs px-2 py-1 bg-slate-800/80 rounded-lg border border-slate-700">
            <span className="font-bold text-teal-400">{currentPage}</span>
            <span className="text-slate-500">/</span>
            <span>{numPages || 1}</span>
          </div>

          <button
            onClick={handleNextPage}
            disabled={currentPage >= numPages || loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 transition cursor-pointer text-slate-300 hover:text-white"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Zoom and Rotation Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleZoomOut}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer text-slate-300 hover:text-white"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="font-mono text-xs w-12 text-center text-slate-300 font-semibold">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer text-slate-300 hover:text-white"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetZoom}
            disabled={loading}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-teal-400 hover:text-teal-300 transition cursor-pointer"
            title="Fit / Reset"
          >
            Reset
          </button>

          <button
            onClick={handleRotate}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition cursor-pointer text-slate-300 hover:text-white ml-1"
            title="Rotate 90°"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        {/* Right: File name & Download Button */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400 max-w-[120px] sm:max-w-[180px] truncate hidden md:inline" title={fileName}>
            {fileName}
          </span>
          <button
            onClick={handleDownloadFile}
            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-xs transition cursor-pointer text-xs"
            title="Download PDF Document"
          >
            <Download className="w-3.5 h-3.5" /> Download
          </button>
        </div>
      </div>

      {/* Main Canvas Scroll Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto overflow-x-auto p-4 sm:p-6 bg-slate-950/95 relative min-h-[400px] w-full flex flex-col items-center justify-start"
      >
        {loading && (
          <div className="flex flex-col items-center justify-center my-auto gap-3 text-slate-400 py-12">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
            <span className="text-xs font-semibold">Rendering PDF pages...</span>
          </div>
        )}

        {error && !loading && (
          <div className="max-w-md p-6 my-auto bg-slate-900 border border-slate-800 rounded-2xl text-center space-y-3">
            <AlertCircle className="w-12 h-12 text-amber-400 mx-auto" />
            <h4 className="text-sm font-bold text-white">PDF Viewer Notice</h4>
            <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
            <button
              onClick={handleDownloadFile}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download PDF to View
            </button>
          </div>
        )}

        {/* The High-Resolution Canvas where the PDF page is painted */}
        <div className={`transition-opacity duration-150 ${loading || error ? 'hidden' : 'flex'} flex-col items-center justify-start w-full py-2`}>
          <div className="bg-white shadow-2xl rounded-sm border border-slate-700/50 relative overflow-hidden shrink-0">
            <canvas ref={canvasRef} className="block max-w-full" />
            {pageRendering && (
              <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-2xs flex items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              </div>
            )}
          </div>
          <div className="mt-4 mb-2 text-[11px] text-slate-400 font-mono select-none">
            Page {currentPage} of {numPages}
          </div>
        </div>
      </div>
    </div>
  );
};
