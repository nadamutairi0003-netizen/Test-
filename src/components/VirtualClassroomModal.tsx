import React, { useEffect, useState } from 'react';
import {
  Calendar,
  ExternalLink,
  FileText,
  Mic,
  MicOff,
  Send,
  Video,
  VideoOff,
  X,
} from 'lucide-react';
import type { Booking } from '../types';
import { downloadCalendarInvite } from '../utils/pricing';

interface VirtualClassroomModalProps {
  booking: Booking;
  onClose: () => void;
}

export const VirtualClassroomModal: React.FC<VirtualClassroomModalProps> = ({
  booking,
  onClose,
}) => {
  const [elapsedSec, setElapsedSec] = useState(0);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [boardText, setBoardText] = useState(
    booking.sessionNotes ||
      `ملخص الحصة: ${booking.subject} (${booking.gradeLevel})\n• الأهداف: مراجعة المفاهيم الأساسية وحل تمارين تطبيقية.\n• المعادلة / القاعدة قيد الشرح: جاهز للكتابة التفاعلية.`
  );
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
          {/* Whiteboard & Controls */}
          <div className="lg:col-span-8 p-6 space-y-4 border-b lg:border-b-0 lg:border-l border-slate-200 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  السبورة التفاعلية وملاحظات الدرس
                </h3>
                <span className="text-xs text-slate-500">الطالب: {booking.studentName}</span>
              </div>

              <textarea
                value={boardText}
                onChange={(e) => setBoardText(e.target.value)}
                rows={10}
                className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-700 leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMicOn(!micOn)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg border flex items-center gap-1.5 cursor-pointer ${
                    micOn
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  <span>{micOn ? 'الميكروفون مفعل' : 'مكتوم'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCamOn(!camOn)}
                  className={`px-3.5 py-2 text-xs font-medium rounded-lg border flex items-center gap-1.5 cursor-pointer ${
                    camOn
                      ? 'bg-white border-slate-200 text-slate-800'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}
                >
                  {camOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  <span>{camOn ? 'الكاميرا مفعلة' : 'مغلقة'}</span>
                </button>
              </div>

              {booking.meetingPlatform === 'teams' && (
                <a
                  href={booking.meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg flex items-center gap-1.5"
                >
                  <span>فتح عبر Microsoft Teams</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          </div>

          {/* Chat & Shared Files */}
          <div className="lg:col-span-4 p-5 bg-slate-50 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">محادثة الحصة</h3>
                <FileText className="w-4 h-4 text-slate-400" />
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto">
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
                placeholder="اكتب سؤالاً أو ملاحظة..."
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
