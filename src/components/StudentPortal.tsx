import React, { useMemo, useState } from 'react';
import {
  Bell,
  Calendar,
  CheckCircle2,
  CreditCard,
  FileUp,
  Heart,
  Plus,
  Sparkles,
  UserPlus,
  Video,
} from 'lucide-react';
import type {
  ActiveUserProfile,
  AiPerformanceInsights,
  Assignment,
  Booking,
  ClientTier,
  LearningTrack,
  NotificationItem,
  PaymentTransaction,
  RegisteredChild,
  Tutor,
} from '../types';
import {
  CLIENT_TIER_DETAILS,
  PACKAGE_DETAILS,
  downloadCalendarInvite,
} from '../utils/pricing';

interface StudentPortalProps {
  studentName: string;
  childrenNames: string[];
  registeredChildrenDetails?: RegisteredChild[];
  activeUser?: ActiveUserProfile;
  activeClientTier: ClientTier;
  tutors: Tutor[];
  favoriteTutorIds: string[];
  bookings: Booking[];
  assignments: Assignment[];
  transactions: PaymentTransaction[];
  notifications: NotificationItem[];
  onSwitchTier: (tier: ClientTier) => void;
  onSelectTutor: (tutor: Tutor) => void;
  onEnterClassroom: (booking: Booking) => void;
  onNavigateToSearch: () => void;
  onRefresh: () => void;
}

type StudentSubTab = 'sessions' | 'homework' | 'payments';

const TRACKS_LIST: LearningTrack[] = ['المراحل الدراسية', 'قياس', 'المرحلة الجامعية'];

export const StudentPortal: React.FC<StudentPortalProps> = ({
  studentName,
  childrenNames,
  registeredChildrenDetails = [],
  activeUser,
  activeClientTier,
  tutors,
  favoriteTutorIds,
  bookings,
  assignments,
  transactions,
  notifications,
  onSwitchTier,
  onSelectTutor,
  onEnterClassroom,
  onNavigateToSearch,
  onRefresh,
}) => {
  const [subTab, setSubTab] = useState<StudentSubTab>('sessions');
  const [showAddChild, setShowAddChild] = useState(false);
  const [newChildName, setNewChildName] = useState('');

  const activeChildMeta = useMemo(
    () => registeredChildrenDetails.find((c) => c.name === studentName),
    [registeredChildrenDetails, studentName]
  );
  const currentTrack: LearningTrack =
    activeChildMeta?.track || activeUser?.preferredTrack || 'المراحل الدراسية';

  const handleUpdateTrack = async (track: LearningTrack) => {
    await fetch('/api/auth/student-track', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preferredTrack: track }),
    });
    onRefresh();
  };

  const [submittingAssignmentId, setSubmittingAssignmentId] = useState<string | null>(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [submissionFile, setSubmissionFile] = useState('homework_solution.pdf');

  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);
  const [insights, setInsights] = useState<AiPerformanceInsights | null>(null);

  const studentNotifications = notifications.filter((n) => n.targetRole === 'student');
  const unreadCount = studentNotifications.filter((n) => !n.read).length;
  const tierInfo = CLIENT_TIER_DETAILS[activeClientTier];

  const activeBookings = useMemo(
    () => bookings.filter((b) => b.studentName === studentName),
    [bookings, studentName]
  );

  const activeAssignments = useMemo(
    () => assignments.filter((a) => a.studentName === studentName),
    [assignments, studentName]
  );

  const favoriteTutors = useMemo(
    () => tutors.filter((t) => favoriteTutorIds.includes(t.id)),
    [tutors, favoriteTutorIds]
  );

  const handleSwitchChild = async (name: string) => {
    await fetch('/api/parent/active-student', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentName: name }),
    });
    onRefresh();
  };

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;
    await fetch('/api/parent/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childName: newChildName.trim() }),
    });
    setNewChildName('');
    setShowAddChild(false);
    onRefresh();
  };

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
    <div className="space-y-6">
      {/* Header with Parent Multi-Child Switcher + Editable Track + Tier */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-emerald-700">
              {activeUser?.role === 'parent'
                ? `ولي الأمر: ${activeUser.fullName}${
                    activeUser.nationalId ? ` (هوية ${activeUser.nationalId})` : ''
                  }`
                : 'بوابة الطالب وولي الأمر'}{' '}
              · {tierInfo.nameAr}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{studentName}</h1>
              {activeChildMeta && (
                <span className="text-xs text-slate-500">
                  {activeChildMeta.gradeLevel}
                  {activeChildMeta.schoolName ? ` · ${activeChildMeta.schoolName}` : ''}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-slate-500">الطالب:</span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {childrenNames.map((child) => (
                  <button
                    key={child}
                    type="button"
                    onClick={() => handleSwitchChild(child)}
                    className={`px-2.5 py-1 text-xs rounded-md cursor-pointer ${
                      studentName === child
                        ? 'bg-white text-emerald-800 font-semibold shadow-sm'
                        : 'text-slate-600'
                    }`}
                  >
                    {child}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAddChild(!showAddChild)}
                  title="إضافة طالب (وضع ولي الأمر)"
                  className="px-2 py-1 text-xs text-emerald-800 hover:bg-white rounded-md cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>ابن جديد</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500">المسار الحالي:</span>
                <select
                  aria-label="تعديل المسار التعليمي"
                  value={currentTrack}
                  onChange={(e) => handleUpdateTrack(e.target.value as LearningTrack)}
                  className="px-2.5 py-1 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg cursor-pointer"
                >
                  {TRACKS_LIST.map((tr) => (
                    <option key={tr} value={tr}>
                      {tr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onNavigateToSearch}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>حجز حصة أو كلاس جماعي</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">فئة الحساب:</span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(['Regular', 'Premium', 'Elite'] as ClientTier[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => onSwitchTier(tier)}
                    className={`px-3 py-1 text-xs font-medium rounded-md cursor-pointer ${
                      activeClientTier === tier
                        ? 'bg-white text-emerald-800 shadow-sm font-semibold'
                        : 'text-slate-600'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showAddChild && (
          <form
            onSubmit={handleAddChild}
            className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100"
          >
            <UserPlus className="w-4 h-4 text-emerald-700" />
            <input
              type="text"
              required
              value={newChildName}
              onChange={(e) => setNewChildName(e.target.value)}
              placeholder="اسم الطالب / الابن المراد إضافته..."
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg w-64"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-lg cursor-pointer"
            >
              إضافة
            </button>
          </form>
        )}

        {/* Clean Segmented Sub-navigation */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab('sessions')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'sessions'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            حصصي والتقارير ({activeBookings.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('homework')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'homework'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            الواجبات والملفات ({activeAssignments.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('payments')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              subTab === 'payments'
                ? 'bg-emerald-700 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            المدفوعات ومؤشرات الأداء
          </button>
        </div>
      </section>

      {/* Tab 1: Sessions, Post-Session AI Reports, Favorites & Notifications */}
      {subTab === 'sessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">الحصص المحجوزة وتقارير ما بعد الحصة</h2>

            {activeBookings.length === 0 ? (
              <div className="py-8 text-center space-y-3 bg-slate-50/70 border border-slate-200 rounded-xl p-6">
                <p className="text-sm font-semibold text-slate-800">
                  لا توجد حصص محجوزة باسم {studentName} حالياً.
                </p>
                <p className="text-xs text-slate-500">
                  يمكنك الانضمام إلى كلاس جماعي يومي بأسعار مخفضة أو حجز درس فردي مع مدرس معتمد.
                </p>
                <button
                  type="button"
                  onClick={onNavigateToSearch}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                >
                  استكشف الكلاسات الجماعية والمدرسين
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {activeBookings.map((b) => (
                  <div key={b.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-slate-500">
                          <span className="font-semibold text-emerald-800">
                            {b.status === 'confirmed' ? 'مؤكد' : 'مكتمل'}
                          </span>
                          {' · '}
                          {b.bookingMode === 'group'
                            ? 'كلاس جماعي يومي (مخفض)'
                            : PACKAGE_DETAILS[b.packageType]?.shortLabel || b.packageType}
                          {' · '}
                          {b.scheduledSlot}
                        </p>
                        <h3 className="text-base font-bold text-slate-900">
                          {b.subject} — {b.tutorName}
                        </h3>
                        <p className="text-xs text-slate-600">
                          {b.meetingPlatform === 'teams' ? 'Microsoft Teams' : 'فصل افتراضي مدمج'}
                          {b.sessionNotes ? ` · ${b.sessionNotes}` : ''}
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
                              studentEmail: b.studentEmail,
                              tutorEmail: b.tutorEmail,
                            })
                          }
                          className="px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>التقويم</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onEnterClassroom(b)}
                          className="px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-700 rounded-lg cursor-pointer flex items-center gap-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>دخول الحصة</span>
                        </button>
                      </div>
                    </div>

                    {b.aiReport && (
                      <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs space-y-1">
                        <p className="font-bold text-emerald-900">
                          تقرير ما بعد الحصة (للطالب وولي الأمر · {b.aiReport.generatedAt})
                        </p>
                        <p className="text-slate-700">
                          <strong>ملخص الشرح:</strong> {b.aiReport.summary}
                        </p>
                        <p className="text-slate-700">
                          <strong>نقاط تحتاج متابعة:</strong> {b.aiReport.weakPoints}
                        </p>
                        <p className="text-slate-700">
                          <strong>تقرير ولي الأمر:</strong> {b.aiReport.parentReport}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="lg:col-span-4 space-y-6">
            {/* Notifications */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-700" />
                  <h2 className="text-base font-bold text-slate-900">
                    التنبيهات {unreadCount > 0 ? `(${unreadCount})` : ''}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={handleMarkNotificationsRead}
                  className="text-xs text-emerald-800 hover:underline cursor-pointer"
                >
                  تحديد كمقروء
                </button>
              </div>

              <div className="space-y-2.5">
                {studentNotifications.slice(0, 4).map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl border ${
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

            {/* Favorite Tutors */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-emerald-700 fill-emerald-700" />
                <h2 className="text-base font-bold text-slate-900">المدرسون المفضلون</h2>
              </div>
              {favoriteTutors.length === 0 ? (
                <p className="text-xs text-slate-500">لم تقم بإضافة مدرسين للمفضلة بعد.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {favoriteTutors.map((t) => (
                    <div key={t.id} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{t.name}</p>
                        <p className="text-[11px] text-slate-500">{t.subject}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onSelectTutor(t)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-md cursor-pointer shrink-0"
                      >
                        حجز
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}

      {/* Tab 2: Homework */}
      {subTab === 'homework' && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">الواجبات والملفات ({studentName})</h2>

          {activeAssignments.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">لا توجد واجبات مسندة حالياً.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeAssignments.map((asg) => (
                <div
                  key={asg.id}
                  className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-emerald-800">
                        {asg.subject} · {asg.tutorName}
                      </span>
                      <span className="text-slate-500 tabular-nums">التسليم: {asg.dueDate}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{asg.title}</h3>
                    <p className="text-xs text-slate-600">{asg.description}</p>
                    <p className="text-xs text-slate-500 font-mono-nums">ملف: {asg.fileName}</p>
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
                          placeholder="اسم الملف"
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
                          {submittingAssignmentId === asg.id ? 'جاري الرفع...' : 'تسليم الواجب'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-slate-200 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {asg.status === 'graded'
                          ? `تم التقييم: ${asg.grade}`
                          : `تم التسليم (${asg.submittedFileName || 'solution.pdf'})`}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 3: Payments & AI Insights */}
      {subTab === 'payments' && (
        <div className="space-y-6">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">مؤشرات الأداء بالذكاء الاصطناعي</h2>
                <p className="text-xs text-slate-600">
                  ملخص الحضور والدرجات وتوصيات التطوير للطالب ({studentName}) والعائلة.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateInsights}
                disabled={insightsLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{insightsLoading ? 'جاري التحليل...' : 'توليد تقرير الأداء'}</span>
              </button>
            </div>

            {insightsError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {insightsError}
              </p>
            )}

            {insights && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                <div className="space-y-1.5">
                  <p className="text-xs font-semibold text-emerald-800">
                    {insights.attendanceRateLabel}
                  </p>
                  <p className="text-sm text-slate-700">{insights.overallSummary}</p>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-900">نقاط القوة</h3>
                  <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                    {insights.strengths.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xs font-bold text-slate-900">الخطوات القادمة</h3>
                  <ul className="space-y-1 text-xs text-slate-600 list-disc list-inside">
                    {insights.nextSteps.map((step, idx) => (
                      <li key={idx}>{step}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">سجل عمليات الدفع الآمن</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-3 font-medium">الوصف</th>
                    <th className="py-3 font-medium">الطالب</th>
                    <th className="py-3 font-medium">المدرس</th>
                    <th className="py-3 font-medium">الوسيلة</th>
                    <th className="py-3 font-medium">التاريخ</th>
                    <th className="py-3 font-medium">المبلغ</th>
                    <th className="py-3 font-medium">الحالة</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3 font-medium text-slate-900">{tx.description}</td>
                      <td className="py-3 text-slate-600">{tx.studentName}</td>
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
      )}
    </div>
  );
};
