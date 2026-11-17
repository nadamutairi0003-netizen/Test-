import React, { useState } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileUp,
  Sparkles,
  Video,
} from 'lucide-react';
import type {
  AiPerformanceInsights,
  Assignment,
  Booking,
  ClientTier,
  NotificationItem,
  PaymentTransaction,
} from '../types';
import {
  CLIENT_TIER_DETAILS,
  PACKAGE_DETAILS,
  downloadCalendarInvite,
} from '../utils/pricing';

interface StudentPortalProps {
  studentName: string;
  activeClientTier: ClientTier;
  bookings: Booking[];
  assignments: Assignment[];
  transactions: PaymentTransaction[];
  notifications: NotificationItem[];
  onSwitchTier: (tier: ClientTier) => void;
  onEnterClassroom: (booking: Booking) => void;
  onRefresh: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  studentName,
  activeClientTier,
  bookings,
  assignments,
  transactions,
  notifications,
  onSwitchTier,
  onEnterClassroom,
  onRefresh,
}) => {
  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [submissionFile, setSubmissionFile] = useState('homework_solution.pdf');

  // AI Performance Insights state
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AiPerformanceInsights | null>(null);

  const studentNotifications = notifications.filter((n) => n.targetRole === 'student');
  const tierInfo = CLIENT_TIER_DETAILS[activeClientTier];

  const handleSubmitAssignment = async (id: string) => {
    setSubmittingAssignmentId(id);
    try {
      const res = await fetch(`/api/assignments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'submitted',
          studentSubmissionNote: submissionNote || 'تم تسليم الحل الكامل للمراجعة.',
          submittedFileName: submissionFile || 'solution.pdf',
        }),
      });
      if (res.ok) {
        setSubmissionNote('');
        onRefresh();
      }
    } finally {
      setSubmittingAssignmentId(null);
    }
  };

  const handleMarkNotificationsRead = async () => {
    await fetch('/api/notifications/read', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'student' }),
    });
    onRefresh();
  };

  const handleGenerateInsights = async () => {
    setInsightsLoading(true);
    setInsightsError(null);
    try {
      const res = await fetch('/api/ai/performance-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        setInsightsError(data.error || 'تعذر توليد التحليلات');
      } else {
        setInsights(data);
      }
    } catch {
      setInsightsError('تعذر الاتصال بالخادم.');
    } finally {
      setInsightsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Client Tier Selector */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-emerald-800">
            حساب الطالب · {tierInfo.nameAr}
          </p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">
            مرحباً {studentName} — لوحة المتابعة التعليمية
          </h1>
          <p className="text-xs text-slate-600 mt-1">
            {tierInfo.priorityBooking} · {tierInfo.advisor} · {tierInfo.familyDashboard}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">ترقية أو تبديل الفئة:</span>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            {(['Regular', 'Premium', 'Elite'] as ClientTier[]).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => onSwitchTier(tier)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  activeClientTier === tier
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tier}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* AI Performance Insights & Family Analytics */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              مؤشرات وتحليلات الأداء بالذكاء الاصطناعي
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              تحليل ذكي لسجل الحضور، درجات الواجبات، وملاحظات المدرسين لمتابعة الطالب والعائلة.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerateInsights}
            disabled={insightsLoading}
            className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{insightsLoading ? 'جاري التحليل...' : 'توليد تقرير الأداء الذكي'}</span>
          </button>
        </div>

        {insightsError && (
          <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
            {insightsError}
          </p>
        )}

        {insights && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-200">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-emerald-800">{insights.attendanceRateLabel}</p>
              <p className="text-sm text-slate-700 leading-relaxed">{insights.overallSummary}</p>
              {insights.familyReportNote && (
                <p className="text-xs text-slate-500 pt-1">
                  ملاحظة لوحة العائلة: {insights.familyReportNote}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900">نقاط القوة المرصودة</h3>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                {insights.strengths.map((s, idx) => (
                  <li key={idx}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900">الخطوات التعليمية القادمة</h3>
              <ul className="space-y-1.5 text-xs text-slate-600 list-disc list-inside">
                {insights.nextSteps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Main Two-Column Grid: Bookings + Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bookings & Virtual Classroom Access */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">
              الحصص المحجوزة والفصول الافتراضية ({bookings.length})
            </h2>
            <span className="text-xs text-slate-500">دعوات تقويم تلقائية</span>
          </div>

          {bookings.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">
              لا توجد حصص محجوزة حتى الآن.
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {bookings.map((b) => (
                <div
                  key={b.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-semibold text-emerald-800">
                        {b.status === 'confirmed' ? 'مؤكد' : 'مكتمل'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{PACKAGE_DETAILS[b.packageType].shortLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{b.scheduledSlot}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">
                      {b.subject} — {b.tutorName}
                    </h3>
                    <p className="text-xs text-slate-600">
                      {b.sessionNotes ||
                        `المنصة: ${
                          b.meetingPlatform === 'teams'
                            ? 'Microsoft Teams'
                            : 'فصل افتراضي مدمج'
                        } · الحضور: ${
                          b.attendanceStatus === 'present'
                            ? 'حاضر'
                            : b.attendanceStatus === 'absent'
                            ? 'غائب'
                            : 'بانتظار الحصة'
                        }`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        downloadCalendarInvite({
                          bookingId: b.id,
                          subject: b.subject,
                          tutorName: b.tutorName,
                          scheduledSlot: b.scheduledSlot,
                          meetingUrl: b.meetingUrl,
                        })
                      }
                      className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>التقويم</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEnterClassroom(b)}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-700 rounded-lg cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>دخول الحصة</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Notifications & Automatic Reminders */}
        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">الإشعارات والتذكيرات</h2>
            </div>
            <button
              type="button"
              onClick={handleMarkNotificationsRead}
              className="text-xs text-emerald-800 hover:underline cursor-pointer"
            >
              تحديد كمقروء
            </button>
          </div>

          <div className="space-y-3">
            {studentNotifications.map((n) => (
              <div
                key={n.id}
                className={`p-3.5 rounded-xl border ${
                  n.read ? 'border-slate-200 bg-white' : 'border-emerald-200 bg-emerald-50/40'
                } space-y-1`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">{n.title}</span>
                  <span className="text-slate-400">{n.time}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Homework & File Sharing */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">مشاركة الواجبات والملفات</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              استعرض الواجبات المسندة من المدرسين وارفع حلولك مع المرفقات.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assignments.map((asg) => (
            <div
              key={asg.id}
              className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-emerald-800">
                    {asg.subject} · {asg.tutorName}
                  </span>
                  <span className="text-slate-500 tabular-nums">التسليم: {asg.dueDate}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{asg.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{asg.description}</p>
                <p className="text-xs text-slate-500 font-mono-nums">
                  ملف المدرس: {asg.fileName}
                </p>
              </div>

              {asg.status === 'assigned' ? (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={submissionNote}
                      onChange={(e) => setSubmissionNote(e.target.value)}
                      placeholder="ملاحظة التسليم..."
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                    />
                    <input
                      type="text"
                      value={submissionFile}
                      onChange={(e) => setSubmissionFile(e.target.value)}
                      placeholder="اسم الملف المرفق"
                      className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg font-mono-nums"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={submittingAssignmentId === asg.id}
                    onClick={() => handleSubmitAssignment(asg.id)}
                    className="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-700 rounded-lg cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>
                      {submittingAssignmentId === asg.id ? 'جاري الرفع...' : 'تسليم الواجب الآن'}
                    </span>
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {asg.status === 'graded'
                        ? `تم التقييم: ${asg.grade}`
                        : `تم التسليم (${asg.submittedFileName || 'solution.pdf'})`}
                    </span>
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Secure Payment History Table */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">سجل عمليات الدفع الآمن</h2>
          </div>
          <span className="text-xs text-slate-500">عمولة المنصة 10% مشمولة وموضحة</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-3 font-medium">رقم العملية</th>
                <th className="py-3 font-medium">الوصف</th>
                <th className="py-3 font-medium">المدرس</th>
                <th className="py-3 font-medium">وسيلة الدفع</th>
                <th className="py-3 font-medium">التاريخ</th>
                <th className="py-3 font-medium">المبلغ المدفوع</th>
                <th className="py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50">
                  <td className="py-3 font-mono-nums text-slate-700">{tx.id}</td>
                  <td className="py-3 font-medium text-slate-900">{tx.description}</td>
                  <td className="py-3 text-slate-600">{tx.tutorName}</td>
                  <td className="py-3 text-slate-600">{tx.method}</td>
                  <td className="py-3 tabular-nums text-slate-500">{tx.date}</td>
                  <td className="py-3 tabular-nums font-bold text-slate-900">
                    {tx.amount.toFixed(2)} ر.س
                  </td>
                  <td className="py-3 font-semibold text-emerald-800">{tx.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
