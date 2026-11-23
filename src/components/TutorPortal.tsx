import React, { useMemo, useState } from 'react';
import { Sparkles, Star, Users, Video, Wallet } from 'lucide-react';
import type {
  AiScheduleOptimization,
  Booking,
  GroupClassSession,
  GroupFixedSlotTime,
  MeetingPlatform,
  Tutor,
} from '../types';
import { ALL_WEEK_DAYS, DAILY_GROUP_FIXED_TIMES } from '../utils/pricing';

interface TutorPortalProps {
  tutors: Tutor[];
  groupClasses: GroupClassSession[];
  bookings: Booking[];
  onRefresh: () => void;
  onEnterClassroom: (booking: Booking) => void;
}

type TutorSubTab = 'schedule' | 'group' | 'students' | 'assignments';

const WEEKLY_SLOT_CANDIDATES = [
  'الأحد 4:00 م',
  'الأحد 6:00 م',
  'الإثنين 4:30 م',
  'الإثنين 7:00 م',
  'الثلاثاء 4:30 م',
  'الثلاثاء 7:00 م',
  'الأربعاء 4:30 م',
  'الأربعاء 6:30 م',
  'الخميس 4:00 م',
  'الخميس 6:00 م',
  'الجمعة 4:00 م',
  'الجمعة 6:30 م',
  'الجمعة 8:00 م',
  'السبت 3:00 م',
  'السبت 5:00 م',
  'السبت 7:30 م',
];

export const TutorPortal: React.FC<TutorPortalProps> = ({
  tutors,
  groupClasses,
  bookings,
  onRefresh,
  onEnterClassroom,
}) => {
  const verifiedTutors = useMemo(
    () => tutors.filter((t) => t.verificationStatus === 'verified'),
    [tutors]
  );
  const [selectedTutorId, setSelectedTutorId] = useState<string>(
    verifiedTutors[0]?.id || 't-101'
  );
  const [subTab, setSubTab] = useState<TutorSubTab>('schedule');
  const [slotDayFilter, setSlotDayFilter] = useState<string>('الكل');
  const [withdrawMsg, setWithdrawMsg] = useState<string | null>(null);

  const activeTutor = useMemo(
    () => verifiedTutors.find((t) => t.id === selectedTutorId) || verifiedTutors[0],
    [verifiedTutors, selectedTutorId]
  );

  const tutorBookings = useMemo(
    () => bookings.filter((b) => b.tutorId === activeTutor?.id),
    [bookings, activeTutor]
  );

  const tutorGroupClasses = useMemo(
    () => groupClasses.filter((g) => g.tutorId === activeTutor?.id),
    [groupClasses, activeTutor]
  );

  const earningsStats = useMemo(() => {
    const gross = tutorBookings.reduce((sum, b) => sum + b.finalPrice, 0);
    const commission = tutorBookings.reduce((sum, b) => sum + b.platformCommission, 0);
    const net = tutorBookings.reduce((sum, b) => sum + b.tutorNetEarnings, 0);
    const withdrawn = activeTutor?.walletWithdrawn ?? 0;
    const availableWallet = Math.max(0, Number((net - withdrawn).toFixed(2)));
    const totalHours = tutorBookings.reduce((sum, b) => sum + b.hoursCount, 0);
    return { gross, commission, net, availableWallet, totalHours };
  }, [tutorBookings, activeTutor]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiSchedule, setAiSchedule] = useState<AiScheduleOptimization | null>(null);

  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [asgBookingId, setAsgBookingId] = useState<string>('');
  const [asgTitle, setAsgTitle] = useState('');
  const [asgDesc, setAsgDesc] = useState('');
  const [asgFile, setAsgFile] = useState('practice_sheet.pdf');
  const [asgStatusMsg, setAsgStatusMsg] = useState<string | null>(null);

  const [grpTitle, setGrpTitle] = useState('');
  const [grpSubject, setGrpSubject] = useState('');
  const [grpFixedTime, setGrpFixedTime] = useState<GroupFixedSlotTime>('4:00 م');
  const [grpPrice, setGrpPrice] = useState(45);
  const [grpMaxSeats, setGrpMaxSeats] = useState(15);
  const [grpPlatform, setGrpPlatform] = useState<MeetingPlatform>('teams');
  const [grpMsg, setGrpMsg] = useState<string | null>(null);

  if (!activeTutor) return null;

  const bookedSlots = new Set(
    tutorBookings.filter((b) => b.status === 'confirmed').map((b) => b.scheduledSlot)
  );

  const handleToggleSlot = async (slot: string) => {
    if (bookedSlots.has(slot)) return;
    const exists = activeTutor.availableSlots.includes(slot);
    const nextSlots = exists
      ? activeTutor.availableSlots.filter((s) => s !== slot)
      : [...activeTutor.availableSlots, slot];

    await fetch(`/api/tutors/${activeTutor.id}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availableSlots: nextSlots }),
    });
    onRefresh();
  };

  const handleDailyCapacityChange = async (hours: number) => {
    await fetch(`/api/tutors/${activeTutor.id}/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        availableSlots: activeTutor.availableSlots,
        dailyCapacityHours: hours,
      }),
    });
    onRefresh();
  };

  const handleWithdraw = async () => {
    setWithdrawMsg(null);
    const res = await fetch(`/api/tutors/${activeTutor.id}/withdraw`, {
      method: 'POST',
    });
    const data = await res.json();
    if (res.ok) {
      setWithdrawMsg(`تم تحويل ${data.withdrawnAmount.toFixed(2)} ر.س إلى حسابك البنكي المسجل.`);
      onRefresh();
    } else {
      setWithdrawMsg(data.error || 'لا يوجد رصيد متاح');
    }
  };

  const handleOptimizeSchedule = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/optimize-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId: activeTutor.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || 'تعذر تحسين الجدول بالذكاء الاصطناعي');
      } else {
        setAiSchedule(data);
      }
    } catch {
      setAiError('تعذر الاتصال بالخادم.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUpdateBooking = async (
    bookingId: string,
    updates: Partial<Booking>
  ) => {
    await fetch(`/api/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    onRefresh();
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetBookingId = asgBookingId || tutorBookings[0]?.id;
    if (!targetBookingId || !asgTitle.trim()) return;

    const res = await fetch('/api/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookingId: targetBookingId,
        title: asgTitle,
        description: asgDesc || 'يرجى حل التمارين المرفقة قبل الحصة القادمة.',
        fileName: asgFile,
        dueDate: '2026-11-26',
      }),
    });

    if (res.ok) {
      setAsgTitle('');
      setAsgDesc('');
      setAsgStatusMsg('تم إسناد الواجب للطالب وإرسال إشعار تلقائي.');
      onRefresh();
    }
  };

  const handleCreateGroupClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!grpTitle.trim()) return;
    setGrpMsg(null);
    const res = await fetch('/api/group-classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tutorId: activeTutor.id,
        title: grpTitle.trim(),
        subject: grpSubject || activeTutor.subject,
        learningTrack: activeTutor.learningTracks[0],
        gradeLevel: activeTutor.gradeLevels[0],
        fixedTimeSlot: grpFixedTime,
        groupPricePerSession: grpPrice,
        maxSeats: grpMaxSeats,
        meetingPlatform: grpPlatform,
      }),
    });
    if (res.ok) {
      setGrpTitle('');
      setGrpMsg(`تم إطلاق الكلاس الجماعي اليومي الساعة ${grpFixedTime} طوال الأسبوع بنجاح.`);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Compact Header + Wallet + Sub-tabs */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-emerald-800">
              معلم معتمد · {activeTutor.ministryLicenseId} · التسجيل مجاني
            </p>
            <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{activeTutor.name}</h1>
          </div>

          <select
            aria-label="اختيار حساب المدرس"
            value={activeTutor.id}
            onChange={(e) => {
              setSelectedTutorId(e.target.value);
              setAiSchedule(null);
              setWithdrawMsg(null);
            }}
            className="px-3 py-2 text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg"
          >
            {verifiedTutors.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.subject})
              </option>
            ))}
          </select>
        </div>

        {/* Wallet & Commission Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100 items-center">
          <div>
            <p className="text-xs text-slate-500">محفظة المدرس (جاهز للسحب)</p>
            <p className="text-xl font-bold text-emerald-800 tabular-nums">
              {earningsStats.availableWallet.toFixed(2)} ر.س
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">إجمالي الحجوزات</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {earningsStats.gross.toFixed(2)} ر.س
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">عمولة المنصة (10%)</p>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {earningsStats.commission.toFixed(2)} ر.س
            </p>
          </div>
          <div className="flex sm:justify-end">
            <button
              type="button"
              disabled={earningsStats.availableWallet <= 0}
              onClick={handleWithdraw}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-700 disabled:opacity-40 rounded-lg cursor-pointer flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>سحب الأرباح للحساب البنكي</span>
            </button>
          </div>
        </div>

        {withdrawMsg && (
          <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
            {withdrawMsg}
          </p>
        )}

        {/* Clean Sub-tabs */}
        <div className="flex items-center gap-2 pt-4 border-t border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab('schedule')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
              subTab === 'schedule'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            الجدول طوال الأسبوع والذكاء الاصطناعي
          </button>
          <button
            type="button"
            onClick={() => setSubTab('group')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
              subTab === 'group'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            الكلاسات الجماعية اليومية ({tutorGroupClasses.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('students')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
              subTab === 'students'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            الطلاب والحضور والتقييم ({tutorBookings.length})
          </button>
          <button
            type="button"
            onClick={() => setSubTab('assignments')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
              subTab === 'assignments'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            إسناد واجب جديد
          </button>
        </div>
      </section>

      {/* Sub-tab 1: 7-Day Availability + Daily Capacity + AI Schedule Optimizer */}
      {subTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  تقويم الأوقات طوال الأسبوع (الأحد - السبت)
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  تغطية جميع أيام الأسبوع بما فيها الجمعة والسبت مع منع تعارض المواعيد.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-500">السعة اليومية:</span>
                <select
                  aria-label="السعة اليومية"
                  value={activeTutor.dailyCapacityHours}
                  onChange={(e) => handleDailyCapacityChange(Number(e.target.value))}
                  className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg font-semibold tabular-nums"
                >
                  {[3, 4, 5, 6, 8].map((h) => (
                    <option key={h} value={h}>
                      {h} ساعات/يوم
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {(['الكل', ...ALL_WEEK_DAYS] as const).map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSlotDayFilter(day)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md border cursor-pointer whitespace-nowrap shrink-0 ${
                    slotDayFilter === day
                      ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {WEEKLY_SLOT_CANDIDATES.filter(
                (slot) => slotDayFilter === 'الكل' || slot.startsWith(slotDayFilter)
              ).map((slot) => {
                const isBooked = bookedSlots.has(slot);
                const isOpen = activeTutor.availableSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={isBooked}
                    onClick={() => handleToggleSlot(slot)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-center transition-colors ${
                      isBooked
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : isOpen
                        ? 'bg-emerald-50 border-emerald-700 text-emerald-900 cursor-pointer font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 cursor-pointer'
                    }`}
                  >
                    {slot} {isBooked ? '(محجوز)' : isOpen ? '· متاح' : ''}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">محسن الجدول بالذكاء الاصطناعي</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  اكتشاف الساعات المتبقية والتنبؤ بأوقات الذروة.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOptimizeSchedule}
                disabled={aiLoading}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiLoading ? 'جاري التحليل...' : 'تحسين الجدول'}</span>
              </button>
            </div>

            {aiError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                {aiError}
              </p>
            )}

            {aiSchedule ? (
              <div className="space-y-3 pt-2 border-t border-slate-200 text-xs">
                <p className="font-semibold text-emerald-800 tabular-nums">
                  السعة المتاحة: {aiSchedule.remainingCapacityHours} ساعة
                </p>
                <p className="text-slate-700 leading-relaxed">{aiSchedule.demandForecastSummary}</p>
                <ul className="space-y-1 text-slate-600 list-disc list-inside">
                  {aiSchedule.recommendedActions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-8 text-center border border-dashed border-slate-200 rounded-xl">
                اضغط على «تحسين الجدول» لتحليل أوقاتك المتاحة.
              </p>
            )}
          </section>
        </div>
      )}

      {/* Sub-tab 2: Daily Fixed-Time Group Classes */}
      {subTab === 'group' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">
                كلاساتك الجماعية اليومية (الأحد - السبت)
              </h2>
            </div>

            {tutorGroupClasses.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                لا توجد كلاسات جماعية نشطة لهذا المدرس بعد. يمكنك إطلاق كلاس جديد من النموذج المجاور.
              </p>
            ) : (
              <div className="divide-y divide-slate-200">
                {tutorGroupClasses.map((gc) => (
                  <div key={gc.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-slate-900">{gc.title}</h3>
                      <span className="text-xs font-semibold text-emerald-800 tabular-nums">
                        {gc.groupPricePerSession} ر.س / طالب (بدلاً من {gc.privateHourlyRate} ر.س)
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      الموعد الثابت: {gc.fixedTimeSlot} · {gc.scheduleLabel} ·{' '}
                      {gc.meetingPlatform === 'teams' ? 'Microsoft Teams' : 'فصل مدمج'}
                    </p>
                    <p className="text-xs text-slate-500 tabular-nums">
                      المقاعد المسجلة: {gc.enrolledCount} / {gc.maxSeats} طالب
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">إطلاق كلاس جماعي يومي جديد</h2>
            <p className="text-xs text-slate-600">
              تُعقد الكلاسات يومياً طوال الأسبوع في أحد المواعيد الثلاثة الثابتة بسعر اقتصادي يجذب عدداً
              أكبر من الطلاب.
            </p>
            <form onSubmit={handleCreateGroupClass} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  المادة الدراسية
                </label>
                <select
                  value={grpSubject || activeTutor.subject}
                  onChange={(e) => setGrpSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  {Array.from(new Set([activeTutor.subject, ...activeTutor.subjects])).map(
                    (sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  عنوان الكلاس الجماعي
                </label>
                <input
                  type="text"
                  required
                  value={grpTitle}
                  onChange={(e) => setGrpTitle(e.target.value)}
                  placeholder={`مثال: مراجعة ${grpSubject || activeTutor.subject} اليومية`}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  الموعد اليومي الثابت (3 فترات)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {DAILY_GROUP_FIXED_TIMES.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      onClick={() => setGrpFixedTime(slot.time)}
                      className={`py-2 px-2 text-xs rounded-lg border cursor-pointer ${
                        grpFixedTime === slot.time
                          ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    سعر المقعد المخفض (ر.س)
                  </label>
                  <input
                    type="number"
                    min={25}
                    max={Math.max(30, activeTutor.hourlyRate - 10)}
                    value={grpPrice}
                    onChange={(e) => setGrpPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    الحد الأقصى للطلاب
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={30}
                    value={grpMaxSeats}
                    onChange={(e) => setGrpMaxSeats(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">المنصة</label>
                <select
                  value={grpPlatform}
                  onChange={(e) => setGrpPlatform(e.target.value as MeetingPlatform)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="teams">Microsoft Teams</option>
                  <option value="classroom">الفصل الافتراضي المدمج</option>
                </select>
              </div>

              {grpMsg && (
                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                  {grpMsg}
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
              >
                نشر الكلاس الجماعي اليومي
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Sub-tab 2: Students, Attendance, Student Rating by Tutor & Notes */}
      {subTab === 'students' && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">الطلاب والحضور وملاحظات الحصص</h2>

          {tutorBookings.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">
              لا توجد حصص مسجلة لهذا المدرس حالياً.
            </p>
          ) : (
            <div className="divide-y divide-slate-200">
              {tutorBookings.map((b) => (
                <div key={b.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {b.studentName} · {b.gradeLevel}
                      </p>
                      <p className="text-xs text-slate-500">
                        {b.scheduledSlot} · صافي الربح: {b.tutorNetEarnings.toFixed(2)} ر.س
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <select
                        aria-label="تقييم الطالب"
                        value={b.studentRatingByTutor || 5}
                        onChange={(e) =>
                          handleUpdateBooking(b.id, {
                            studentRatingByTutor: Number(e.target.value),
                          })
                        }
                        className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md"
                      >
                        {[5, 4, 3, 2, 1].map((r) => (
                          <option key={r} value={r}>
                            تقييم الطالب: {r}/5
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateBooking(b.id, {
                            attendanceStatus: 'present',
                            status: 'completed',
                          })
                        }
                        className={`px-2.5 py-1 text-xs rounded-md border cursor-pointer ${
                          b.attendanceStatus === 'present'
                            ? 'bg-emerald-700 text-white border-emerald-700'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        حاضر
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateBooking(b.id, {
                            attendanceStatus: 'absent',
                            status: 'completed',
                          })
                        }
                        className={`px-2.5 py-1 text-xs rounded-md border cursor-pointer ${
                          b.attendanceStatus === 'absent'
                            ? 'bg-red-700 text-white border-red-700'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        غائب
                      </button>
                      <button
                        type="button"
                        onClick={() => onEnterClassroom(b)}
                        className="px-2.5 py-1 text-xs rounded-md bg-slate-900 text-white cursor-pointer flex items-center gap-1"
                      >
                        <Video className="w-3 h-3" />
                        <span>الفصل</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={noteDrafts[b.id] ?? b.sessionNotes}
                      onChange={(e) =>
                        setNoteDrafts((prev) => ({ ...prev, [b.id]: e.target.value }))
                      }
                      placeholder="دوّن ملاحظات الحصة..."
                      className="flex-1 px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdateBooking(b.id, {
                          sessionNotes: noteDrafts[b.id] ?? b.sessionNotes,
                          status: 'completed',
                        })
                      }
                      className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg cursor-pointer"
                    >
                      حفظ
                    </button>
                  </div>

                  {b.studentRatingByTutor && (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>تقييم المدرس للطالب: {b.studentRatingByTutor} / 5</span>
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Sub-tab 3: Create Assignment */}
      {subTab === 'assignments' && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl space-y-4">
          <h2 className="text-lg font-bold text-slate-900">إسناد واجب جديد للطالب</h2>
          <form onSubmit={handleCreateAssignment} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">الطالب والحصة</label>
              <select
                value={asgBookingId || tutorBookings[0]?.id || ''}
                onChange={(e) => setAsgBookingId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                {tutorBookings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.studentName} — {b.subject} ({b.scheduledSlot})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">عنوان الواجب</label>
              <input
                type="text"
                required
                value={asgTitle}
                onChange={(e) => setAsgTitle(e.target.value)}
                placeholder="مثال: تمارين تطبيقية على النهايات"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                التعليمات واسم الملف
              </label>
              <textarea
                rows={3}
                value={asgDesc}
                onChange={(e) => setAsgDesc(e.target.value)}
                placeholder="تفاصيل الواجب..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg mb-2"
              />
              <input
                type="text"
                value={asgFile}
                onChange={(e) => setAsgFile(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-nums"
              />
            </div>
            {asgStatusMsg && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                {asgStatusMsg}
              </p>
            )}
            <button
              type="submit"
              disabled={tutorBookings.length === 0}
              className="w-full py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-700 disabled:opacity-50 rounded-lg cursor-pointer"
            >
              إرسال الواجب للطالب
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
