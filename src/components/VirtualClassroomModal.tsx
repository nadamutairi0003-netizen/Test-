import React, { useEffect, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  Mic,
  MicOff,
  Send,
  Sparkles,
  Video,
  VideoOff,
  X,
} from 'lucide-react';
import type { Booking, PostSessionAiReport } from '../types';
import { downloadCalendarInvite } from '../utils/pricing';

interface VirtualClassroomModalProps {
  booking: Booking;
  onClose: () => void;
  onReportGenerated: () => void;
}

export const VirtualClassroomModal: React.FC<VirtualClassroomModalProps> = ({
  booking,
  onClose,
  onReportGenerated,
}) => {
  const [elapsedSec, setElapsedSec] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [boardText, setBoardText] = useState(
    booking.sessionNotes ||
      `ملخص الحصة: ${booking.subject} (${booking.gradeLevel})\n• تم شرح المفاهيم الأساسية وحل تمارين تطبيقية.\n• نقاط تحتاج مراجعة: تطبيقات المسائل اللفظية.`
  );
  const [consentChecked, setConsentChecked] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<PostSessionAiReport | undefined>(booking.aiReport);

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([
    {
      sender: booking.tutorName,
      text: `أهلاً بك يا ${booking.studentName}، جاهزون لبدء حصة ${booking.subject}.`,
      time: 'الآن',
    },
  ]);

  useEffect(() => {
    const timer = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const mm = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const ss = String(elapsedSec % 60).padStart(2, '0');

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    setMessages((prev) => [
      ...prev,
      { sender: booking.studentName, text: chatInput.trim(), time: `${mm}:${ss}` },
    ]);
    setChatInput('');
  };

  const handleGenerateSessionReport = async () => {
    if (!consentChecked) {
      setReportError('يرجى تأكيد موافقة الطالب والمدرس على تلخيص الحصة.');
      return;
    }
    setReportLoading(true);
    setReportError(null);
    try {
      const res = await fetch('/api/ai/session-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          lessonTranscriptOrNotes: boardText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReportError(data.error || 'تعذر توليد ملخص الحصة');
      } else {
        setAiReport(data.aiReport);
        onReportGenerated();
      }
    } catch {
      setReportError('تعذر الاتصال بالخادم.');
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="classroom-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Classroom Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-emerald-300">
              {booking.meetingPlatform === 'teams'
                ? 'جلسة مربوطة مع Microsoft Teams'
                : 'الفصل الافتراضي المدمج'}
              {' · '}
              {booking.scheduledSlot}
            </p>
            <h2 id="classroom-title" className="text-lg font-bold">
              {booking.subject} — {booking.tutorName}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono-nums bg-slate-800 px-3 py-1.5 rounded-lg text-emerald-300">
              {mm}:{ss}
            </span>
            <button
              type="button"
              onClick={() =>
                downloadCalendarInvite({
                  bookingId: booking.id,
                  subject: booking.subject,
                  tutorName: booking.tutorName,
                  scheduledSlot: booking.scheduledSlot,
                  meetingUrl: booking.meetingUrl,
                  studentEmail: booking.studentEmail,
                  tutorEmail: booking.tutorEmail,
                })
              }
              className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>دعوة التقويم</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="مغادرة الفصل"
              className="p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Classroom Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-y-auto">
          <div className="lg:col-span-8 p-6 space-y-5 border-b lg:border-b-0 lg:border-l border-slate-200">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">السبورة التفاعلية ومحتوى الحصة</h3>
                <span className="text-xs text-slate-500">الطالب: {booking.studentName}</span>
              </div>

              <textarea
                value={boardText}
                onChange={(e) => setBoardText(e.target.value)}
                rows={6}
                className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-700 leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMicOn(!micOn)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border flex items-center gap-1.5 cursor-pointer ${
                    micOn
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
                  <span>{micOn ? 'الصوت مفعل' : 'مكتوم'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCamOn(!camOn)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border flex items-center gap-1.5 cursor-pointer ${
                    camOn
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {camOn ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                  <span>{camOn ? 'الكاميرا مفعلة' : 'مغلقة'}</span>
                </button>
              </div>

              {booking.meetingPlatform === 'teams' && (
                <a
                  href={booking.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5"
                >
                  <span>فتح رابط Microsoft Teams</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Post-Session AI Lesson Summary & Parent Report */}
            <div className="pt-4 border-t border-slate-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="rounded accent-emerald-700"
                  />
                  <span>موافقة الأطراف على تسجيل وتلخيص الحصة بالذكاء الاصطناعي</span>
                </label>

                <button
                  type="button"
                  onClick={handleGenerateSessionReport}
                  disabled={reportLoading}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {reportLoading
                      ? 'جاري توليد التقرير...'
                      : 'توليد ملخص الحصة وتقرير ولي الأمر'}
                  </span>
                </button>
              </div>

              {reportError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                  {reportError}
                </p>
              )}

              {aiReport && (
                <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>تقرير ما بعد الحصة التلقائي</span>
                  </div>
                  <p>
                    <strong className="text-slate-900">ملخص الشرح:</strong> {aiReport.summary}
                  </p>
                  <p>
                    <strong className="text-slate-900">الواجب المقترح:</strong> {aiReport.homework}
                  </p>
                  <p>
                    <strong className="text-slate-900">نقاط تحتاج مراجعة:</strong>{' '}
                    {aiReport.weakPoints}
                  </p>
                  <p>
                    <strong className="text-slate-900">خطة الحصة القادمة:</strong>{' '}
                    {aiReport.nextPlan}
                  </p>
                  <p>
                    <strong className="text-slate-900">تقرير ولي الأمر:</strong>{' '}
                    {aiReport.parentReport}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-4 p-5 bg-slate-50 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">محادثة الحصة</h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {messages.map((m, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-800">{m.sender}</span>
                      <span className="tabular-nums">{m.time}</span>
                    </div>
                    <p className="text-xs text-slate-700">{m.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendChat} className="flex items-center gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="اكتب سؤالاً..."
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
              />
              <button
                type="submit"
                aria-label="إرسال"
                className="p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
