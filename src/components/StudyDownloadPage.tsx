import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle2, Download, FileText, Loader2 } from 'lucide-react';

interface StudyDownloadPageProps {
  onBackToApp: () => void;
}

export function StudyDownloadPage({ onBackToApp }: StudyDownloadPageProps) {
  const [status, setStatus] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleDownload = useCallback(async () => {
    setStatus('downloading');
    setErrorMsg(null);
    try {
      const res = await fetch('/api/export/study-pptx', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error('تعذر تحميل ملف البوربوينت من الخادم');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'Mutamad_Feasibility_Study.pptx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      setStatus('done');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء تجهيز الملف للتحميل');
    }
  }, []);

  useEffect(() => {
    handleDownload();
  }, [handleDownload]);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-900"
    >
      <div className="max-w-lg w-full bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 text-emerald-700">
            <FileText className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              عرض دراسة الجدوى — مشروع «مُعتمَد»
            </h1>
            <p className="text-sm text-slate-600">
              ملف PowerPoint جاهز للعرض والإرسال (10 شرائح باللغة العربية RTL)
            </p>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs sm:text-sm text-slate-700 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">اسم الملف:</span>
            <span className="font-mono font-semibold text-slate-900" dir="ltr">
              Mutamad_Feasibility_Study.pptx
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">المحتوى:</span>
            <span className="font-medium">
              التكاليف الرأسمالية والتشغيلية، نقطة التعادل، الفريق، وخطة الـ 14 أسبوعاً
            </span>
          </div>
        </div>

        {status === 'downloading' && (
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
            <span>جاري تجهيز وتنزيل ملف البوربوينت تلقائياً...</span>
          </div>
        )}

        {status === 'done' && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">تم بدء تنزيل الملف على جهازك!</p>
              <p className="text-xs text-emerald-800">
                ستجده في مجلد التنزيلات (Downloads) باسم{' '}
                <span className="font-mono font-semibold" dir="ltr">
                  Mutamad_Feasibility_Study.pptx
                </span>
                . إذا لم يبدأ التنزيل، اضغط الزر أدناه.
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={status === 'downloading'}
            className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تحميل ملف البوربوينت (.pptx)</span>
          </button>

          <a
            href="/api/export/study-pptx"
            download="Mutamad_Feasibility_Study.pptx"
            className="w-full py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <span>رابط بديل مباشر للتحميل</span>
          </a>
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onBackToApp}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة إلى منصة مُعتمَد</span>
          </button>
        </div>
      </div>
    </div>
  );
}
