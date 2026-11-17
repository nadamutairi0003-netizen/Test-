import type { ClientTier, PackageTier } from '../types';

export const PACKAGE_DETAILS: Record<
  PackageTier,
  { label: string; shortLabel: string; hours: number; discountPct: number }
> = {
  hourly: { label: 'باقة الساعة الواحدة', shortLabel: 'بالساعة', hours: 1, discountPct: 0 },
  weekly: { label: 'الباقة الأسبوعية', shortLabel: 'أسبوعية (4 ساعات)', hours: 4, discountPct: 5 },
  monthly: { label: 'الباقة الشهرية', shortLabel: 'شهرية (12 ساعة)', hours: 12, discountPct: 12 },
  semester: {
    label: 'باقة الفصل الدراسي',
    shortLabel: 'فصل دراسي (36 ساعة)',
    hours: 36,
    discountPct: 20,
  },
};

export const CLIENT_TIER_DETAILS: Record<
  ClientTier,
  {
    nameAr: string;
    audience: string;
    priceLabel: string;
    discountPct: number;
    priorityBooking: string;
    savedPlans: string;
    advisor: string;
    familyDashboard: string;
  }
> = {
  Regular: {
    nameAr: 'Regular (أساسي)',
    audience: 'للطلاب وأولياء الأمور الباحثين عن دروس مرنة',
    priceLabel: 'مجاني',
    discountPct: 0,
    priorityBooking: 'حجز قياسي حسب التوفر',
    savedPlans: 'حفظ خطة حالية واحدة',
    advisor: 'دعم عبر المنصة',
    familyDashboard: 'تقرير جلسة أساسي',
  },
  Premium: {
    nameAr: 'Premium (متقدم)',
    audience: 'للطلبة المنتظمين في المسارات الدراسية',
    priceLabel: '99 ر.س / شهر',
    discountPct: 10,
    priorityBooking: 'أولوية الحجز قبل 48 ساعة',
    savedPlans: 'خطط تعليمية محفوظة غير محدودة',
    advisor: 'ترشيح آلي ذكي أسبوعي',
    familyDashboard: 'ملخصات تقدم شهرية',
  },
  Elite: {
    nameAr: 'Elite (نخبة)',
    audience: 'للعائلات والطامحين لأعلى المعدلات والجامعات',
    priceLabel: '249 ر.س / شهر',
    discountPct: 15,
    priorityBooking: 'أولوية قصوى + مدرسون حصريون',
    savedPlans: 'خطط مخصصة متعددة المواد',
    advisor: 'مستشار تعليمي مخصص',
    familyDashboard: 'لوحة متابعة متكاملة للعائلة + تحليلات AI',
  },
};

export function computePriceBreakdown(
  hourlyRate: number,
  packageType: PackageTier,
  clientTier: ClientTier
) {
  const pkg = PACKAGE_DETAILS[packageType];
  const basePrice = Number((hourlyRate * pkg.hours).toFixed(2));
  const pkgDiscount = basePrice * (pkg.discountPct / 100);
  const afterPkg = basePrice - pkgDiscount;
  const tierPct = CLIENT_TIER_DETAILS[clientTier].discountPct;
  const tierDiscount = afterPkg * (tierPct / 100);
  const totalDiscount = Number((pkgDiscount + tierDiscount).toFixed(2));
  const finalPrice = Number((basePrice - totalDiscount).toFixed(2));
  const platformCommission = Number((finalPrice * 0.1).toFixed(2));
  const tutorNet = Number((finalPrice - platformCommission).toFixed(2));

  return {
    hours: pkg.hours,
    basePrice,
    pkgDiscountPct: pkg.discountPct,
    tierDiscountPct: tierPct,
    totalDiscount,
    finalPrice,
    platformCommission,
    tutorNet,
  };
}

export function downloadCalendarInvite(params: {
  bookingId: string;
  subject: string;
  tutorName: string;
  scheduledSlot: string;
  meetingUrl: string;
}) {
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Mutamad Certified Tutors//AR',
    'BEGIN:VEVENT',
    `UID:${params.bookingId}@mutamad.edu.sa`,
    `DTSTAMP:20261117T100000Z`,
    `DTSTART:20261122T140000Z`,
    `DTEND:20261122T150000Z`,
    `SUMMARY:حصة ${params.subject} مع ${params.tutorName}`,
    `DESCRIPTION:الموعد المجدول: ${params.scheduledSlot}\\nرابط الحصة: ${params.meetingUrl}`,
    `LOCATION:${params.meetingUrl}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mutamad-${params.bookingId}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
