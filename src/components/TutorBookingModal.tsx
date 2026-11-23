import React, { useMemo, useState } from 'react';
import {
  Award,
  CalendarCheck,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Star,
  Video,
  X,
} from 'lucide-react';
import type { ClientTier, MeetingPlatform, PackageTier, Review, Tutor } from '../types';
import {
  ALL_WEEK_DAYS,
  CLIENT_TIER_DETAILS,
  PACKAGE_DETAILS,
  computePriceBreakdown,
} from '../utils/pricing';

interface TutorBookingModalProps {
  tutor: Tutor;
  reviews: Review[];
  activeClientTier: ClientTier;
  defaultStudentName: string;
  childrenNames: string[];
  onClose: () => void;
  onBooked: () => void;
  onReviewAdded: () => void;
  onGoToPortal?: () => void;
}

export const TutorBookingModal: React.FC<TutorBookingModalProps> = ({
  tutor,
  reviews,
  activeClientTier,
  defaultStudentName,
  childrenNames,
  onClose,
  onBooked,
  onReviewAdded,
  onGoToPortal,
}) => {
  const [modalTab, setModalTab] = useState<'book' | 'reviews'>('book');
  const [selectedPackage, setSelectedPackage] = useState<PackageTier>('weekly');
  const [dayFilter, setDayFilter] = useState<string>('الكل');
  const [selectedSlot, setSelectedSlot] = useState<string>(tutor.availableSlots[0] || '');
  const [meetingPlatform, setMeetingPlatform] = useState<MeetingPlatform>('teams');
  const [gradeLevel, setGradeLevel] = useState<string>(tutor.gradeLevels[0] || 'المرحلة الثانوية');
  const [studentName, setStudentName] = useState<string>(defaultStudentName);
  const [studentEmail, setStudentEmail] = useState<string>('parent@mutamad.sa');
  const [paymentMethod, setPaymentMethod] = useState<string>('مدى / Apple Pay');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const tutorReviews = useMemo(
    () => reviews.filter((r) => r.tutorId === tutor.id),
    [reviews, tutor.id]
  );

  const breakdown = useMemo(
    () => computePriceBreakdown(tutor.hourlyRate, selectedPackage, activeClientTier),
    [tutor.hourlyRate, selectedPackage, activeClientTier]
  );

  const isFullyBooked = tutor.availableSlots.length === 0;

  // Smart availability fit message based on remaining open slots
  const packageFitMessage = (pkgKey: PackageTier) => {
    const slotsCount = tutor.availableSlots.length;
    if (slotsCount === 0) return 'غير متاح (محجوز بالكامل)';
    const neededPerWeek = PACKAGE_DETAILS[pkgKey].sessionsPerWeek;
    if (slotsCount < neededPerWeek) {
      return `متاح جزئياً (${slotsCount} موعد متبقٍ فقط)`;
    }
    return `متاح (${neededPerWeek} حصص/أسبوع · 60 د)`;
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMsg('هذا المدرس محجوز بالكامل حالياً.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: tutor.id,
          studentName,
          studentEmail,
          gradeLevel,
          packageType: selectedPackage,
          scheduledSlot: selectedSlot,
          meetingPlatform,
          paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'تعذر إتمام الحجز.');
      } else {
        setSuccessMsg(
          `تم تأكيد الحجز (${data.booking.id}) وإرسال دعوة التقويم إلى ${studentEmail} مع رابط ${
            meetingPlatform === 'teams' ? 'Microsoft Teams' : 'الفصل الافتراضي المدمج'
          }.`
        );
        onBooked();
      }
    } catch {
      setErrorMsg('تعذر الاتصال بالخادم لإتمام الدفع.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;
    setReviewSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tutorId: tutor.id,
          studentName,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });
      if (res.ok) {
        setReviewComment('');
        onReviewAdded();
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutor-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-xl">
        {/* Clean Header + 2 Tabs */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 pt-4 pb-3 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-emerald-800 font-medium">
                معتمد · {tutor.city} · {tutor.ministryLicenseId} · {(tutor.learningTracks || []).join(' · ')}
              </p>
              <h2 id="tutor-modal-title" className="text-lg font-bold text-slate-900">
                {tutor.name}
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

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setModalTab('book')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                modalTab === 'book'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الباقات والحجز
            </button>
            <button
              type="button"
              onClick={() => setModalTab('reviews')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg cursor-pointer ${
                modalTab === 'reviews'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              الشهادات والتقييمات ({tutorReviews.length})
            </button>
          </div>
        </div>

        <div className="p-6">
          {modalTab === 'book' ? (
            <div className="space-y-6">
              {isFullyBooked && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-bold">هذا المدرس محجوز بالكامل حالياً (Fully Booked)</p>
                  <p>
                    استنفد جدول المدرس ({tutor.dailyCapacityHours} ساعات يومياً) لهذا الأسبوع. يمكنك
                    إضافته للمفضلة أو العودة لاختيار مدرس آخر متاح.
                  </p>
                </div>
              )}

              {/* Step 1: Packages (including 3/wk, 5/wk, monthly, 3-month term) */}
              <div className="space-y-2.5">
                <h3 className="text-sm font-bold text-slate-900">1. اختر الباقة وخطة التدريس</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                  {(['hourly', 'weekly', 'custom', 'monthly', 'semester'] as PackageTier[]).map(
                    (pkgKey) => {
                      const pkg = PACKAGE_DETAILS[pkgKey];
                      const calc = computePriceBreakdown(
                        tutor.hourlyRate,
                        pkgKey,
                        activeClientTier
                      );
                      const isSelected = selectedPackage === pkgKey;
                      return (
                        <button
                          key={pkgKey}
                          type="button"
                          onClick={() => setSelectedPackage(pkgKey)}
                          className={`p-3 rounded-xl border text-right transition-colors cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-emerald-700 bg-emerald-50/50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{pkg.shortLabel}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {packageFitMessage(pkgKey)}
                            </p>
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-100">
                            <p className="text-sm font-bold text-slate-900 tabular-nums">
                              {calc.finalPrice.toFixed(0)} ر.س
                            </p>
                            {pkg.discountPct > 0 && (
                              <p className="text-[10px] text-emerald-800">وفر {pkg.discountPct}%</p>
                            )}
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {successMsg ? (
                <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <span>تم الحجز والدفع بنجاح</span>
                  </div>
                  <p className="text-sm text-emerald-900">{successMsg}</p>
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
                <form
                  onSubmit={handleConfirmBooking}
                  className="grid grid-cols-1 md:grid-cols-2 gap-5"
                >
                  <div className="space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h3 className="text-sm font-bold text-slate-900">
                          2. الموعد المتاح ومنصة الحصة
                        </h3>
                        <span className="text-[11px] text-emerald-800 font-medium">
                          متاح طوال الأسبوع (الأحد - السبت)
                        </span>
                      </div>
                      {isFullyBooked ? (
                        <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-200">
                          لا توجد مواعيد شاغرة حالياً.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 overflow-x-auto pb-1">
                            {(['الكل', ...ALL_WEEK_DAYS] as const).map((day) => (
                              <button
                                key={day}
                                type="button"
                                onClick={() => {
                                  setDayFilter(day);
                                  const matching = tutor.availableSlots.filter(
                                    (s) => day === 'الكل' || s.startsWith(day)
                                  );
                                  if (matching.length > 0 && !matching.includes(selectedSlot)) {
                                    setSelectedSlot(matching[0]);
                                  } else if (matching.length === 0) {
                                    setSelectedSlot('');
                                  }
                                }}
                                className={`px-2 py-1 text-[11px] rounded-md border cursor-pointer whitespace-nowrap shrink-0 ${
                                  dayFilter === day
                                    ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                {day}
                              </button>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {tutor.availableSlots
                              .filter((s) => dayFilter === 'الكل' || s.startsWith(dayFilter))
                              .map((slot) => (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setSelectedSlot(slot)}
                                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                                    selectedSlot === slot
                                      ? 'bg-slate-900 text-white border-slate-900'
                                      : 'bg-white text-slate-700 border-slate-200'
                                  }`}
                                >
                                  {slot}
                                </button>
                              ))}
                            {tutor.availableSlots.filter(
                              (s) => dayFilter === 'الكل' || s.startsWith(dayFilter)
                            ).length === 0 && (
                              <p className="text-[11px] text-slate-500">
                                لا توجد أوقات مفتوحة لهذا المدرس يوم {dayFilter}، جرب يوماً آخر.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMeetingPlatform('teams')}
                        className={`p-2.5 rounded-lg border text-right text-xs cursor-pointer ${
                          meetingPlatform === 'teams'
                            ? 'border-emerald-700 bg-emerald-50 font-semibold'
                            : 'border-slate-200'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <Video className="w-3.5 h-3.5" />
                          Microsoft Teams
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMeetingPlatform('classroom')}
                        className={`p-2.5 rounded-lg border text-right text-xs cursor-pointer ${
                          meetingPlatform === 'classroom'
                            ? 'border-emerald-700 bg-emerald-50 font-semibold'
                            : 'border-slate-200'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          فصل مدمج
                        </span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <select
                        aria-label="اسم الطالب"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        {childrenNames.map((child) => (
                          <option key={child} value={child}>
                            {child}
                          </option>
                        ))}
                      </select>

                      <select
                        aria-label="المرحلة"
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        className="px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white"
                      >
                        {tutor.gradeLevels.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      type="email"
                      required
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      placeholder="البريد الإلكتروني لإرسال دعوة التقويم"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg font-mono-nums"
                    />
                  </div>

                  {/* Checkout Summary */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between space-y-4">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-slate-900 pb-2 border-b border-slate-200">
                        <span>3. ملخص الدفع الآمن</span>
                        <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">السعر الأساسي ({breakdown.hours} س)</span>
                        <span className="tabular-nums">{breakdown.basePrice.toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex justify-between text-emerald-800">
                        <span>الخصم ({CLIENT_TIER_DETAILS[activeClientTier].nameAr})</span>
                        <span className="tabular-nums">-{breakdown.totalDiscount.toFixed(2)} ر.س</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>عمولة المنصة (10%)</span>
                        <span className="tabular-nums">
                          {breakdown.platformCommission.toFixed(2)} ر.س
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
                        <span>الإجمالي</span>
                        <span className="tabular-nums">{breakdown.finalPrice.toFixed(2)} ر.س</span>
                      </div>
                      <select
                        aria-label="وسيلة الدفع"
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg mt-1"
                      >
                        <option value="مدى / Apple Pay">بطاقة مدى / Apple Pay</option>
                        <option value="STC Pay">STC Pay</option>
                        <option value="بطاقة ائتمانية">بطاقة ائتمانية (Visa / Mastercard)</option>
                      </select>
                    </div>

                    {errorMsg && (
                      <p className="text-xs text-red-700 bg-red-50 p-2 rounded-lg">{errorMsg}</p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !selectedSlot || isFullyBooked}
                      className="w-full py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg cursor-pointer flex items-center justify-center gap-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>
                        {isFullyBooked
                          ? 'المدرس محجوز بالكامل'
                          : submitting
                          ? 'جاري التأكيد...'
                          : `تأكيد الدفع (${breakdown.finalPrice.toFixed(0)} ر.س)`}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-900">الاعتمادات والخبرة</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{tutor.bio}</p>
                <p className="text-xs text-slate-500">
                  الجامعة: {tutor.university} · الجنسية: {tutor.nationality} · السعة اليومية:{' '}
                  {tutor.dailyCapacityHours} ساعات
                </p>
                <div className="space-y-1 pt-1">
                  {tutor.certificates.map((cert) => (
                    <div key={cert} className="flex items-center gap-2 text-xs text-slate-700">
                      <Award className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">آراء الطلاب</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {tutorReviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">{rev.studentName}</span>
                        <span className="flex items-center gap-0.5 text-amber-600 font-semibold tabular-nums">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {rev.rating}.0
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">{rev.comment}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSubmitReview} className="flex gap-2 pt-2">
                  <select
                    aria-label="التقييم"
                    value={reviewRating}
                    onChange={(e) => setReviewRating(Number(e.target.value))}
                    className="px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>
                        {n} نجوم
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="اكتب تقييمك..."
                    className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                  />
                  <button
                    type="submit"
                    disabled={reviewSubmitting || !reviewComment.trim()}
                    className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg cursor-pointer"
                  >
                    إرسال
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
