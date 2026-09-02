import React, { useState, useEffect } from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ErrorBoundary: React.FC<ErrorBoundaryProps> = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState<{ name: string; message: string; stack?: string } | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setHasError(true);
      setErrorDetails({
        name: event.error?.name || 'Error',
        message: event.message || event.error?.message || 'Unknown runtime error',
        stack: event.error?.stack,
      });
      console.error('Unhandled runtime error captured:', event.error || event.message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setHasError(true);
      setErrorDetails({
        name: 'UnhandledPromiseRejection',
        message: String(event.reason?.message || event.reason || 'Unhandled promise rejection'),
        stack: event.reason?.stack,
      });
      console.error('Unhandled promise rejection captured:', event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  const handleReload = () => {
    window.location.reload();
  };

  const handleReset = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // ignore
    }
    window.location.reload();
  };

  if (hasError) {
    if (fallback) return <>{fallback}</>;

    return (
      <div className="min-h-screen w-screen bg-[#0d1322] text-slate-100 flex items-center justify-center p-4 font-['Noto_Sans_Thai',sans-serif]">
        <div className="max-w-lg w-full bg-[#162035] border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4 border border-rose-500/30">
            <span className="material-symbols-outlined text-[32px]">warning</span>
          </div>

          <h2 className="text-xl font-bold text-white mb-2">
            เกิดข้อผิดพลาดในการแสดงผลระบบ (Application Error)
          </h2>
          <p className="text-sm text-slate-300 mb-4 leading-relaxed">
            ระบบตรวจพบข้อผิดพลาดที่ไม่คาดคิด คุณสามารถลองโหลดหน้าเว็บใหม่อีกครั้ง หรือรีเซ็ตข้อมูลแคชเพื่อกลับสู่การทำงานปกติ
          </p>

          {errorDetails && (
            <div className="p-3.5 bg-black/40 rounded-xl border border-rose-500/20 font-mono text-xs text-rose-300/90 mb-6 overflow-x-auto max-h-36">
              <div className="font-bold text-rose-400 mb-1">
                {errorDetails.name}: {errorDetails.message}
              </div>
              {errorDetails.stack && (
                <pre className="text-[10px] text-slate-400 whitespace-pre-wrap">
                  {errorDetails.stack.split('\n').slice(0, 4).join('\n')}
                </pre>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleReload}
              className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span>โหลดหน้าเว็บใหม่ (Reload)</span>
            </button>
            <button
              onClick={handleReset}
              className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-600 transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              <span>ล้างแคช & รีเซ็ต</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
