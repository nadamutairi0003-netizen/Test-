import React, { useMemo, useState } from 'react';
import {
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  ShieldCheck,
  Users,
  Video,
  X,
} from 'lucide-react';
import type { ClientTier, GroupClassSession } from '../types';
import {
  ALL_WEEK_DAYS,
  CLIENT_TIER_DETAILS,
  computeGroupPriceBreakdown,
} from '../utils/pricing';

interface GroupClassEnrollModalProps {
  groupClass: GroupClassSession;
  activeClientTier: ClientTier;
  defaultStudentName: string;
  childrenNames: string[];
  onClose: () => void;
  onEnrolled: () => void;
  onGoToPortal?: () => void;
}

export const GroupClassEnrollModal: React.FC<GroupClassEnrollModalProps> = ({
  groupClass,
  activeClientTier,
  defaultStudentName,
  childrenNames,
  onClose,
  onEnrolled,
  onGoToPortal,
}) => {
  const [planType, setPlanType] = useState<'single_day' | 'weekly_7days'>('single_day');
  const [selectedDay, setSelectedDay] = useState<string>('الجمعة');
  const [studentName, setStudentName] = useState<string>(defaultStudentName);
  const [studentEmail, setStudentEmail] = useState<string>('parent@mutamad.sa');
  const [paymentMethod, setPaymentMethod] = useState<string>('مدى / Apple Pay');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const seatsLeft = Math.max(0, groupClass.maxSeats - groupClass.enrolledCount);
  const isFull = seatsLeft === 0;

  const baseSelectedPrice =
    planType === 'weekly_7days' ? groupClass.weeklyPassPrice : groupClass.groupPricePerSession;
  const privateEquivalent =
    planType === 'weekly_7days' ? groupClass.privateHourlyRate * 7 : groupClass.privateHourlyRate;

  const breakdown = useMemo(
    () => computeGroupPriceBreakdown(baseSelectedPrice, activeClientTier, privateEquivalent),
    [baseSelectedPrice, activeClientTier, privateEquivalent]
  );

  const handleConfirmEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isFull) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/group-classes/${groupClass.id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName,
          studentEmail,
          planType,
          selectedDay,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'تعذر إتمام التسجيل في الكلاس الجماعي.');
      } else {
        setSuccessMsg(
          `تم حجز مقعد ${studentName} في "${groupClass.title}" (${
            planType === 'weekly_7days'
              ? `اشتراك 7 أيام طوال الأسبوع · ${groupClass.fixedTimeSlot}`
              : `${selectedDay} · ${groupClass.fixedTimeSlot}`
          }) بمبلغ ${data.booking.finalPrice.toFixed(0)} ر.س، وأضيفت الحصة لبوابة الطالب.`
        );
        onEnrolled();
      }
    } catch {
      setErrorMsg('تعذر الاتصال بالخادم، يرجى المحاولة مجدداً.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="group-enroll-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-emerald-800">
              كلاس جماعي يومي · موعد ثابت {groupClass.fixedTimeSlot} · {groupClass.scheduleLabel}
            </p>
            <h2 id="group-enroll-title" className="text-lg font-bold text-slate-900 mt-0.5">
              {groupClass.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Summary strip */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900">
                {groupClass.tutorName} · {groupClass.tutorLicenseId}
              </p>
              <p className="text-slate-600">
                {groupClass.subject} · {groupClass.gradeLevel}
              </p>
            </div>
            <div className="flex items-center gap-4 text-emerald-900 font-semibold tabular-nums">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {groupClass.fixedTimeSlot} يومياً
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                متاح {seatsLeft} / {groupClass.maxSeats} مقعد
              </span>
            </div>
          </div>

          {successMsg ? (
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>تم تأكيد المقعد الجماعي بنجاح</span>
              </div>
              <p className="text-sm text-emerald-900 leading-relaxed">{successMsg}</p>
              <div className="flex flex-wrap items-center gap-2">
                {onGoToPortal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onGoToPortal();
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                  >
                    الانتقال لبوابة الطالب والدخول للحصة
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-emerald-900 bg-white border border-emerald-200 hover:bg-emerald-100 rounded-lg cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleConfirmEnroll} className="space-y-5">
              {/* Step 1: Plan type (Single day out of 7 days OR Full 7-day weekly pass) */}
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">1. اختر خطة الحضور (أوفر من الفردي)</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPlanType('single_day')}
                    className={`p-3.5 rounded-xl border text-right cursor-pointer transition-colors ${
                      planType === 'single_day'
                        ? 'border-emerald-700 bg-emerald-50/60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">مقعد حصة ليوم واحد</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      اختر أي يوم من الأحد إلى السبت الساعة {groupClass.fixedTimeSlot}
                    </p>
                    <p className="text-sm font-bold text-emerald-800 tabular-nums mt-2">
                      {groupClass.groupPricePerSession} ر.س{' '}
                      <span className="text-[11px] font-normal text-slate-400 line-through">
                        {groupClass.privateHourlyRate} ر.س فردي
                      </span>
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlanType('weekly_7days')}
                    className={`p-3.5 rounded-xl border text-right cursor-pointer transition-colors ${
                      planType === 'weekly_7days'
                        ? 'border-emerald-700 bg-emerald-50/60'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">
                      باقة الأسبوع الكامل (7 أيام متواصلة)
                    </p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      حضور يومي من الأحد إلى السبت الساعة {groupClass.fixedTimeSlot}
                    </p>
                    <p className="text-sm font-bold text-emerald-800 tabular-nums mt-2">
                      {groupClass.weeklyPassPrice} ر.س{' '}
                      <span className="text-[11px] font-normal text-slate-500">
                        (7 حصص · وفر أكبر)
                      </span>
                    </p>
                  </button>
                </div>
              </div>

              {/* Day picker across ALL 7 DAYS (Sunday -> Saturday) */}
              {planType === 'single_day' && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900">
                    2. اختر اليوم (الحصص متاحة طوال الأسبوع)
                  </h3>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                    {ALL_WEEK_DAYS.map((day) => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => setSelectedDay(day)}
                        className={`py-2 px-1 text-xs font-medium rounded-lg border cursor-pointer text-center ${
                          selectedDay === day
                            ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Student & Payment details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">اسم الطالب</label>
                    <select
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {childrenNames.map((child) => (
                        <option key={child} value={child}>
                          {child}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      البريد الإلكتروني لدعوة التقويم
                    </label>
                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono-nums"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                    {groupClass.meetingPlatform === 'teams' ? (
                      <Video className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <CalendarCheck className="w-4 h-4 text-emerald-700" />
                    )}
                    <span>
                      المنصة:{' '}
                      {groupClass.meetingPlatform === 'teams'
                        ? 'Microsoft Teams'
                        : 'الفصل الافتراضي المدمج'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 pb-2 border-b border-slate-200">
                    <span>ملخص التكلفة المخفضة</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">سعر المقعد الجماعي</span>
                    <span className="tabular-nums">{breakdown.basePrice.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between text-emerald-800">
                    <span>توفير مقارنة بالدرس الفردي</span>
                    <span className="font-semibold tabular-nums">
                      -{breakdown.savingsVsPrivatePct}%
                    </span>
                  </div>
                  {breakdown.tierDiscount > 0 && (
                    <div className="flex justify-between text-emerald-800">
                      <span>خصم {CLIENT_TIER_DETAILS[activeClientTier].nameAr}</span>
                      <span className="tabular-nums">-{breakdown.tierDiscount.toFixed(2)} ر.س</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-500">
                    <span>عمولة المنصة (10%)</span>
                    <span className="tabular-nums">{breakdown.platformCommission.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                    <span>الإجمالي</span>
                    <span className="tabular-nums">{breakdown.finalPrice.toFixed(2)} ر.س</span>
                  </div>
                  <select
                    aria-label="وسيلة الدفع"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg"
                  >
                    <option value="مدى / Apple Pay">بطاقة مدى / Apple Pay</option>
                    <option value="STC Pay">STC Pay</option>
                    <option value="بطاقة ائتمانية">بطاقة ائتمانية (Visa / Mastercard)</option>
                  </select>
                </div>
              </div>

              {errorMsg && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-2.5 rounded-lg">
                  {errorMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || isFull}
                className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg cursor-pointer flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {isFull
                    ? 'اكتملت المقاعد في هذا الكلاس'
                    : submitting
                    ? 'جاري تأكيد المقعد...'
                    : `تأكيد التسجيل المخفض (${breakdown.finalPrice.toFixed(0)} ر.س)`}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
