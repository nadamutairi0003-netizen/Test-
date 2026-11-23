import type { ClientTier, GroupFixedSlotTime, PackageTier } from '../types';

export const ALL_WEEK_DAYS = [
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
  'السبت',
] as const;

export const DAILY_GROUP_FIXED_TIMES: {
  time: GroupFixedSlotTime;
  periodLabel: string;
  hint: string;
}[] = [
  { time: '4:00 م', periodLabel: 'الفترة الأولى', hint: 'يومياً 4:00 عصراً (طوال الأسبوع)' },
  { time: '7:00 م', periodLabel: 'الفترة الثانية', hint: 'يومياً 7:00 مساءً (طوال الأسبوع)' },
  { time: '9:30 م', periodLabel: 'الفترة الثالثة', hint: 'يومياً 9:30 ليلاً (طوال الأسبوع)' },
];

export const PACKAGE_DETAILS: Record<
  PackageTier,
  {
    label: string;
    shortLabel: string;
    hours: number;
    sessionsPerWeek: number;
    discountPct: number;
  }
> = {
  hourly: {
    label: 'حصة واحدة',
    shortLabel: 'حصة واحدة (ساعة)',
    hours: 1,
    sessionsPerWeek: 1,
    discountPct: 0,
  },
  weekly: {
    label: 'باقة أسبوعية (3 حصص)',
    shortLabel: 'أسبوعية · 3 حصص',
    hours: 3,
    sessionsPerWeek: 3,
    discountPct: 5,
  },
  custom: {
    label: 'باقة مكثفة (5 حصص)',
    shortLabel: 'أسبوعية · 5 حصص',
    hours: 5,
    sessionsPerWeek: 5,
    discountPct: 8,
  },
  monthly: {
    label: 'باقة شهرية (12 حصة)',
    shortLabel: 'شهرية · 3 حصص/أسبوع',
    hours: 12,
    sessionsPerWeek: 3,
    discountPct: 12,
  },
  semester: {
    label: 'فصل دراسي / 3 أشهر (36 حصة)',
    shortLabel: 'فصل دراسي (3 أشهر)',
    hours: 36,
    sessionsPerWeek: 3,
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
    nameAr: 'Regular (مجاني)',
    audience: 'حساب مجاني مع دفع لكل حجز وعمولة 10%',
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
    familyDashboard: 'تقارير تقدم ذكية',
  },
  Elite: {
    nameAr: 'Elite (نخبة)',
    audience: 'للعائلات والطامحين لأعلى المعدلات والجامعات',
    priceLabel: '249 ر.س / شهر',
    discountPct: 15,
    priorityBooking: 'أولوية قصوى + مدرسون حصريون',
    savedPlans: 'خطط مخصصة متعددة المواد',
    advisor: 'مدير تعلم / مستشار تعليمي شخصي',
    familyDashboard: 'لوحة متابعة متكاملة للعائلة + تحليلات AI',
  },
};

export function computePriceBreakdown(
  hourlyRate: number,
  packageType: PackageTier,
  clientTier: ClientTier
) {
  const pkg = PACKAGE_DETAILS[packageType] || PACKAGE_DETAILS.weekly;
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
    sessionsPerWeek: pkg.sessionsPerWeek,
    basePrice,
    pkgDiscountPct: pkg.discountPct,
    tierDiscountPct: tierPct,
    totalDiscount,
    finalPrice,
    platformCommission,
    tutorNet,
  };
}

export function computeGroupPriceBreakdown(
  baseGroupPrice: number,
  clientTier: ClientTier,
  privateComparisonPrice: number
) {
  const tierPct = CLIENT_TIER_DETAILS[clientTier].discountPct;
  const tierDiscount = Number((baseGroupPrice * (tierPct / 100)).toFixed(2));
  const finalPrice = Number((baseGroupPrice - tierDiscount).toFixed(2));
  const platformCommission = Number((finalPrice * 0.1).toFixed(2));
  const tutorNet = Number((finalPrice - platformCommission).toFixed(2));
  const savingsVsPrivatePct = Math.max(
    0,
    Math.round(((privateComparisonPrice - finalPrice) / Math.max(1, privateComparisonPrice)) * 100)
  );

  return {
    basePrice: baseGroupPrice,
    tierDiscountPct: tierPct,
    tierDiscount,
    finalPrice,
    platformCommission,
    tutorNet,
    savingsVsPrivatePct,
  };
}

export function downloadCalendarInvite(params: {
  bookingId: string;
  subject: string;
  tutorName: string;
  scheduledSlot: string;
  meetingUrl: string;
  studentEmail?: string;
  tutorEmail?: string;
}) {
  const attendeeLines = [
    params.studentEmail ? `ATTENDEE;CN=Student:mailto:${params.studentEmail}` : '',
    params.tutorEmail ? `ATTENDEE;CN=Tutor:mailto:${params.tutorEmail}` : '',
  ]
    .filter(Boolean)
    .join('\r\n');

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
    attendeeLines,
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

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
