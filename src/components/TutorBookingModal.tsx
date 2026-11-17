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
  CLIENT_TIER_DETAILS,
  PACKAGE_DETAILS,
  computePriceBreakdown,
} from '../utils/pricing';

interface TutorBookingModalProps {
  tutor: Tutor;
  reviews: Review[];
  activeClientTier: ClientTier;
  defaultStudentName: string;
  onClose: () => void;
  onBooked: () => void;
  onReviewAdded: () => void;
}

export const TutorBookingModal: React.FC<TutorBookingModalProps> = ({
  tutor,
  reviews,
  activeClientTier,
  defaultStudentName,
  onClose,
  onBooked,
  onReviewAdded,
}) => {
  const [selectedPackage, setSelectedPackage] = useState<PackageTier>('weekly');
  const [selectedSlot, setSelectedSlot] = useState<string>(tutor.availableSlots[0] || '');
  const [meetingPlatform, setMeetingPlatform] = useState<MeetingPlatform>('teams');
  const [gradeLevel, setGradeLevel] = useState<string>(tutor.gradeLevels[0] || 'المرحلة الثانوية');
  const [studentName, setStudentName] = useState<string>(defaultStudentName);
  const [paymentMethod, setPaymentMethod] = useState<string>('مدى / Apple Pay');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Review submission state
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

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      setErrorMsg('يرجى اختيار وقت متاح أولاً.');
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
          `تم تأكيد الحجز (${data.booking.id}) وإرسال دعوة التقويم وإنشاء رابط ${
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
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-xl">
        {/* Top Modal Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-emerald-800 font-medium">
              معلم معتمد · رقم الترخيص {tutor.ministryLicenseId}
            </p>
            <h2 id="tutor-modal-title" className="text-xl font-bold text-slate-900">
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

        <div className="p-6 space-y-8">
          {/* Credentials & Bio */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pb-6 border-b border-slate-200">
            <div className="md:col-span-7 space-y-3">
              <h3 className="text-sm font-bold text-slate-900">نبذة والاعتمادات الأكاديمية</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{tutor.bio}</p>
              <div className="space-y-1.5 pt-1">
                {tutor.certificates.map((cert) => (
                  <div key={cert} className="flex items-center gap-2 text-xs text-slate-700">
                    <Award className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{cert}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">المادة والتخصص</span>
                <span className="font-semibold text-slate-900">{tutor.subject}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">المنهج</span>
                <span className="font-semibold text-slate-900">{tutor.curriculum}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">التقييم العام</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {tutor.rating.toFixed(1)} / 5 ({tutor.reviewCount} مراجعة)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">سعر الساعة الأساسي</span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  {tutor.hourlyRate} ر.س
                </span>
              </div>
            </div>
          </div>

          {/* Package Comparison Matrix */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900">
                1. مقارنة الباقات والأسعار (شاملة خصم الفئة {activeClientTier})
              </h3>
              <span className="text-xs text-slate-500">
                توفير يصل إلى 20% على باقة الفصل الدراسي
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(['hourly', 'weekly', 'monthly', 'semester'] as PackageTier[]).map((pkgKey) => {
                const pkg = PACKAGE_DETAILS[pkgKey];
                const calc = computePriceBreakdown(tutor.hourlyRate, pkgKey, activeClientTier);
                const isSelected = selectedPackage === pkgKey;
                return (
                  <button
                    key={pkgKey}
                    type="button"
                    onClick={() => setSelectedPackage(pkgKey)}
                    className={`p-4 rounded-xl border text-right transition-colors cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-slate-900">{pkg.label}</span>
                        {pkg.discountPct > 0 && (
                          <span className="text-[11px] font-semibold text-emerald-800 tabular-nums">
                            -{pkg.discountPct}%
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 tabular-nums">{pkg.hours} ساعة دراسية</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-200/70">
                      <p className="text-lg font-bold text-slate-900 tabular-nums">
                        {calc.finalPrice.toFixed(0)} ر.س
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        {(calc.finalPrice / pkg.hours).toFixed(0)} ر.س / ساعة بعد الخصم
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Booking Form */}
          {successMsg ? (
            <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                <span>تم الحجز والدفع بنجاح</span>
              </div>
              <p className="text-sm text-emerald-900">{successMsg}</p>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
              >
                العودة إلى المنصة
              </button>
            </div>
          ) : (
            <form onSubmit={handleConfirmBooking} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Slot & Classroom Choice */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900">
                    2. اختيار الموعد ومنصة الحصة
                  </h3>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">
                      الأوقات المتاحة (منع تعارض الحجوزات تلقائياً)
                    </label>
                    {tutor.availableSlots.length === 0 ? (
                      <p className="text-xs text-red-700 bg-red-50 p-3 rounded-lg border border-red-200">
                        جميع المواعيد محجوزة حالياً. يمكن للمدرس فتح أوقات إضافية من لوحة التحكم.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {tutor.availableSlots.map((slot) => (
                          <button
                            key={slot}
                            type="button"
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                              selectedSlot === slot
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {slot}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">
                      بيئة الحصة الافتراضية
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setMeetingPlatform('teams')}
                        className={`p-3 rounded-lg border text-right text-xs transition-colors cursor-pointer ${
                          meetingPlatform === 'teams'
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Video className="w-3.5 h-3.5" />
                          <span>Microsoft Teams</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-normal">
                          رابط اجتماع ودعوة تقويم تلقائية
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMeetingPlatform('classroom')}
                        className={`p-3 rounded-lg border text-right text-xs transition-colors cursor-pointer ${
                          meetingPlatform === 'classroom'
                            ? 'border-emerald-700 bg-emerald-50 text-emerald-950 font-semibold'
                            : 'border-slate-200 bg-white text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <CalendarCheck className="w-3.5 h-3.5" />
                          <span>فصل افتراضي مدمج</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-normal">
                          سبورة تفاعلية ومشاركة واجبات
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        اسم الطالب
                      </label>
                      <input
                        type="text"
                        required
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        المرحلة / الصف
                      </label>
                      <select
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                      >
                        {tutor.gradeLevels.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Payment & 10% Commission Breakdown */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">
                        3. ملخص الدفع الآمن
                      </h3>
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    </div>

                    <div className="space-y-2 text-xs border-b border-slate-200 pb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-600">
                          السعر الأساسي ({breakdown.hours} ساعة)
                        </span>
                        <span className="font-medium tabular-nums">
                          {breakdown.basePrice.toFixed(2)} ر.س
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-800">
                        <span>
                          الخصومات ({breakdown.pkgDiscountPct}% باقة + {breakdown.tierDiscountPct}%{' '}
                          {CLIENT_TIER_DETAILS[activeClientTier].nameAr})
                        </span>
                        <span className="font-medium tabular-nums">
                          -{breakdown.totalDiscount.toFixed(2)} ر.س
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>منها عمولة المنصة (10%)</span>
                        <span className="tabular-nums">
                          {breakdown.platformCommission.toFixed(2)} ر.س
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>صافي مستحقات المدرس (90%)</span>
                        <span className="tabular-nums">{breakdown.tutorNet.toFixed(2)} ر.س</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-sm font-bold text-slate-900">الإجمالي المطلوب</span>
                      <span className="text-xl font-bold text-slate-900 tabular-nums">
                        {breakdown.finalPrice.toFixed(2)} ر.س
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1.5">
                        وسيلة الدفع الإلكتروني
                      </label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
                      >
                        <option value="مدى / Apple Pay">بطاقة مدى / Apple Pay</option>
                        <option value="بطاقة ائتمانية">بطاقة ائتمانية (Visa / Mastercard)</option>
                        <option value="تحويل بنكي فوري">تحويل بنكي فوري (سريع)</option>
                      </select>
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !selectedSlot}
                    className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {submitting
                        ? 'جاري تأكيد الحجز...'
                        : `تأكيد الحجز والدفع (${breakdown.finalPrice.toFixed(0)} ر.س)`}
                    </span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Student Ratings & Reviews */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              تقييمات ومراجعات الطلاب ({tutorReviews.length})
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tutorReviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">{rev.studentName}</span>
                    <span className="text-slate-400 tabular-nums">{rev.date}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-amber-600">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span className="tabular-nums font-semibold">{rev.rating}.0</span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleSubmitReview}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2"
            >
              <select
                aria-label="التقييم"
                value={reviewRating}
                onChange={(e) => setReviewRating(Number(e.target.value))}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
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
                placeholder="أضف تقييمك وتجربتك مع المدرس..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
              />
              <button
                type="submit"
                disabled={reviewSubmitting || !reviewComment.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 rounded-lg cursor-pointer whitespace-nowrap"
              >
                إرسال التقييم
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
