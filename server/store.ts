import fs from 'fs';
import path from 'path';
import type {
  Assignment,
  Booking,
  ClientTier,
  MeetingPlatform,
  NotificationItem,
  PackageTier,
  PaymentTransaction,
  PlatformState,
  Review,
  Tutor,
  TutorApplication,
} from '../src/types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'platform-db.json');

export const PACKAGE_CONFIG: Record<
  PackageTier,
  { label: string; hours: number; packageDiscountRate: number }
> = {
  hourly: { label: 'باقة الساعة الواحدة', hours: 1, packageDiscountRate: 0 },
  weekly: { label: 'الباقة الأسبوعية (4 ساعات)', hours: 4, packageDiscountRate: 0.05 },
  monthly: { label: 'الباقة الشهرية (12 ساعة)', hours: 12, packageDiscountRate: 0.12 },
  semester: { label: 'باقة الفصل الدراسي (36 ساعة)', hours: 36, packageDiscountRate: 0.2 },
};

export const CLIENT_TIER_DISCOUNT: Record<ClientTier, number> = {
  Regular: 0,
  Premium: 0.1,
  Elite: 0.15,
};

function createSeedState(): PlatformState {
  const tutors: Tutor[] = [
    {
      id: 't-101',
      name: 'د. خالد بن فهد الدوسري',
      avatar: '/src/assets/images/tutor_avatar_male_1_1794940122591.jpg',
      gender: 'ذكر',
      subject: 'الرياضيات',
      subjects: ['الرياضيات', 'التحصيلي الكمي', 'القدرات العامة'],
      gradeLevels: ['المرحلة الثانوية', 'المرحلة المتوسطة', 'المسار الجامعي'],
      curriculum: 'المنهج السعودي',
      languages: ['العربية', 'الإنجليزية'],
      hourlyRate: 160,
      bio: 'دكتوراه في مناهج وطرق تدريس الرياضيات، خبرة 12 عاماً في إعداد طلاب الثانوية لاختبارات القدرات والتحصيلي والتفوق الأكاديمي.',
      ministryLicenseId: 'MOE-SA-449821',
      verificationStatus: 'verified',
      certificates: ['رخصة ممارس تعليمي معتمد', 'دكتوراه في الرياضيات التطبيقية - جامعة الملك سعود'],
      rating: 4.9,
      reviewCount: 42,
      availableSlots: [
        'الأحد 4:00 م',
        'الأحد 6:00 م',
        'الإثنين 5:00 م',
        'الثلاثاء 7:00 م',
        'الأربعاء 4:30 م',
        'الخميس 6:00 م',
      ],
      bookingsCount: 128,
      experienceYears: 12,
      exclusiveTier: true,
      universityLevel: true,
    },
    {
      id: 't-102',
      name: 'أ. نورة بنت عبد الله السبيعي',
      avatar: '/src/assets/images/tutor_avatar_female_1_1794940122416.jpg',
      gender: 'أنثى',
      subject: 'الفيزياء',
      subjects: ['الفيزياء', 'العلوم', 'الكيمياء'],
      gradeLevels: ['المرحلة الثانوية', 'المرحلة المتوسطة'],
      curriculum: 'المنهج السعودي',
      languages: ['العربية', 'الإنجليزية'],
      hourlyRate: 145,
      bio: 'ماجستير في الفيزياء النظرية ومعلمة معتمدة من وزارة التعليم، متخصصة في تبسيط الميكانيكا والكهرباء بالتجارب التفاعلية.',
      ministryLicenseId: 'MOE-SA-318704',
      verificationStatus: 'verified',
      certificates: ['اعتماد وزارة التعليم للعلوم والفيزياء', 'ماجستير الفيزياء - جامعة الأميرة نورة'],
      rating: 4.9,
      reviewCount: 36,
      availableSlots: [
        'الأحد 5:00 م',
        'الإثنين 4:00 م',
        'الثلاثاء 5:30 م',
        'الأربعاء 7:00 م',
        'السبت 3:00 م',
      ],
      bookingsCount: 94,
      experienceYears: 9,
      exclusiveTier: true,
    },
    {
      id: 't-103',
      name: 'أ. طارق بن سامي القحطاني',
      avatar: '/src/assets/images/tutor_avatar_male_2_1794940123563.jpg',
      gender: 'ذكر',
      subject: 'اللغة الإنجليزية',
      subjects: ['اللغة الإنجليزية', 'IELTS', 'SAT English'],
      gradeLevels: ['المرحلة الابتدائية', 'المرحلة المتوسطة', 'المرحلة الثانوية', 'المسار الجامعي'],
      curriculum: 'المنهج الدولي (IGCSE / IB)',
      languages: ['الإنجليزية', 'العربية'],
      hourlyRate: 135,
      bio: 'مدرب لغة إنجليزية معتمد بشهادة CELTA وماجستير اللغويات التطبيقية، متخصص في المناهج الدولية وبناء الطلاقة الأكاديمية.',
      ministryLicenseId: 'MOE-SA-512093',
      verificationStatus: 'verified',
      certificates: ['شهادة CELTA الدولية', 'تصريح تدريس معتمد - وزارة التعليم'],
      rating: 4.8,
      reviewCount: 29,
      availableSlots: [
        'الإثنين 6:30 م',
        'الثلاثاء 4:00 م',
        'الأربعاء 5:00 م',
        'الخميس 7:30 م',
        'السبت 5:00 م',
      ],
      bookingsCount: 77,
      experienceYears: 8,
      universityLevel: true,
    },
    {
      id: 't-104',
      name: 'أ. هند بنت سليمان العتيبي',
      avatar: '/src/assets/images/tutor_avatar_female_2_1794940123409.jpg',
      gender: 'أنثى',
      subject: 'اللغة العربية',
      subjects: ['اللغة العربية', 'النحو والبلاغة', 'التأسيس اللغوي'],
      gradeLevels: ['المرحلة الابتدائية', 'المرحلة المتوسطة', 'المرحلة الثانوية'],
      curriculum: 'المنهج السعودي',
      languages: ['العربية'],
      hourlyRate: 120,
      bio: 'معلمة خبيرة في النحو والصرف والبلاغة وتأسيس مهارات القراءة والكتابة للمرحلتين الابتدائية والمتوسطة وفق معايير نافس.',
      ministryLicenseId: 'MOE-SA-290115',
      verificationStatus: 'verified',
      certificates: ['رخصة معلم خبير - هيئة تقويم التعليم', 'بكالوريوس اللغة العربية وآدابها'],
      rating: 5.0,
      reviewCount: 51,
      availableSlots: [
        'الأحد 3:30 م',
        'الإثنين 4:30 م',
        'الأربعاء 4:00 م',
        'الخميس 5:00 م',
      ],
      bookingsCount: 141,
      experienceYears: 14,
      exclusiveTier: true,
    },
    {
      id: 't-105',
      name: 'أ. ريم بنت ماجد الزهراني',
      avatar: '',
      gender: 'أنثى',
      subject: 'الكيمياء والأحياء',
      subjects: ['الكيمياء', 'الأحياء', 'التحصيلي العلمي'],
      gradeLevels: ['المرحلة الثانوية', 'المرحلة المتوسطة'],
      curriculum: 'المنهج الأمريكي',
      languages: ['العربية', 'الإنجليزية'],
      hourlyRate: 140,
      bio: 'أخصائية تدريس الكيمياء العضوية والأحياء للمسارات الدولية والسعودية مع خرائط ذهنية وتدريب مكثف على الاختبارات المعيارية.',
      ministryLicenseId: 'MOE-SA-601442',
      verificationStatus: 'verified',
      certificates: ['اعتماد تدريس العلوم المتقدمة', 'بكالوريوس الكيمياء الحيوية مع مرتبة الشرف'],
      rating: 4.8,
      reviewCount: 19,
      availableSlots: ['الأحد 7:00 م', 'الثلاثاء 6:00 م', 'الخميس 4:00 م', 'السبت 4:00 م'],
      bookingsCount: 48,
      experienceYears: 7,
    },
    {
      id: 't-106',
      name: 'م. عمر بن ياسر الحربي',
      avatar: '',
      gender: 'ذكر',
      subject: 'الحاسب والبرمجة',
      subjects: ['الحاسب الآلي', 'البرمجة ببايثون', 'الرياضيات'],
      gradeLevels: ['المرحلة المتوسطة', 'المرحلة الثانوية', 'المسار الجامعي'],
      curriculum: 'المنهج السعودي',
      languages: ['العربية', 'الإنجليزية'],
      hourlyRate: 150,
      bio: 'مهندس برمجيات ومدرب معتمد في علوم الحاسب والذكاء الاصطناعي وتطبيقات بايثون لطلاب المدارس والجامعات.',
      ministryLicenseId: 'MOE-SA-774310',
      verificationStatus: 'verified',
      certificates: ['رخصة مدرب تقني معتمد', 'ماجستير علوم الحاسب'],
      rating: 4.7,
      reviewCount: 23,
      availableSlots: ['الإثنين 7:00 م', 'الأربعاء 6:30 م', 'الخميس 8:00 م', 'السبت 6:00 م'],
      bookingsCount: 62,
      experienceYears: 6,
      universityLevel: true,
    },
  ];

  const bookings: Booking[] = [
    {
      id: 'bk-901',
      tutorId: 't-101',
      tutorName: 'د. خالد بن فهد الدوسري',
      studentName: 'سارة المطيري',
      subject: 'الرياضيات',
      gradeLevel: 'الثالث الثانوي',
      packageType: 'weekly',
      hoursCount: 4,
      basePrice: 640,
      discountAmount: 32,
      finalPrice: 608,
      platformCommission: 60.8,
      tutorNetEarnings: 547.2,
      scheduledSlot: 'الأحد 7:30 م',
      meetingPlatform: 'teams',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/mutamad-bk-901',
      calendarInviteSent: true,
      status: 'confirmed',
      attendanceStatus: 'pending',
      sessionNotes: 'مراجعة التفاضل والتكامل وتطبيقات القيم العظمى والصغرى.',
      createdAt: '2026-11-15',
    },
    {
      id: 'bk-902',
      tutorId: 't-102',
      tutorName: 'أ. نورة بنت عبد الله السبيعي',
      studentName: 'سارة المطيري',
      subject: 'الفيزياء',
      gradeLevel: 'الثالث الثانوي',
      packageType: 'monthly',
      hoursCount: 12,
      basePrice: 1740,
      discountAmount: 208.8,
      finalPrice: 1531.2,
      platformCommission: 153.12,
      tutorNetEarnings: 1378.08,
      scheduledSlot: 'الثلاثاء 4:00 م',
      meetingPlatform: 'classroom',
      meetingUrl: '/classroom/bk-902',
      calendarInviteSent: true,
      status: 'completed',
      attendanceStatus: 'present',
      sessionNotes: 'أظهرت الطالبة فهماً ممتازاً لقوانين كيرشوف؛ نركز الأسبوع القادم على الحث الكهرومغناطيسي.',
      createdAt: '2026-11-10',
    },
    {
      id: 'bk-903',
      tutorId: 't-103',
      tutorName: 'أ. طارق بن سامي القحطاني',
      studentName: 'فيصل الشمري',
      subject: 'اللغة الإنجليزية',
      gradeLevel: 'الثاني الثانوي',
      packageType: 'hourly',
      hoursCount: 1,
      basePrice: 135,
      discountAmount: 0,
      finalPrice: 135,
      platformCommission: 13.5,
      tutorNetEarnings: 121.5,
      scheduledSlot: 'الأربعاء 7:00 م',
      meetingPlatform: 'teams',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/mutamad-bk-903',
      calendarInviteSent: true,
      status: 'completed',
      attendanceStatus: 'present',
      sessionNotes: 'تدريب على كتابة المقال الأكاديمي واستخدام الروابط المنطقية.',
      createdAt: '2026-11-12',
    },
  ];

  const assignments: Assignment[] = [
    {
      id: 'asg-1',
      bookingId: 'bk-901',
      tutorId: 't-101',
      tutorName: 'د. خالد بن فهد الدوسري',
      studentName: 'سارة المطيري',
      subject: 'الرياضيات',
      title: 'ورقة عمل: تطبيقات الاشتقاق والتكامل المحدود',
      description: 'حل التمارين من 1 إلى 8 في الملف المرفق مع توضيح خطوات الحل قبل الحصة القادمة.',
      fileName: 'calculus_worksheet_week3.pdf',
      dueDate: '2026-11-20',
      status: 'assigned',
    },
    {
      id: 'asg-2',
      bookingId: 'bk-902',
      tutorId: 't-102',
      tutorName: 'أ. نورة بنت عبد الله السبيعي',
      studentName: 'سارة المطيري',
      subject: 'الفيزياء',
      title: 'تقرير الدوائر الكهربائية وقانون أوم',
      description: 'تحليل النتائج الحسابية لثلاث دوائر موصلة على التوالي والتوازي.',
      fileName: 'physics_circuits_lab.pdf',
      dueDate: '2026-11-14',
      status: 'graded',
      grade: '96 / 100',
      studentSubmissionNote: 'تم رفع الحلول مع الرسوم البيانية للتيار والجهد.',
      submittedFileName: 'sara_circuits_solution.pdf',
    },
  ];

  const reviews: Review[] = [
    {
      id: 'rev-1',
      tutorId: 't-101',
      studentName: 'والد الطالب تركي العجمي',
      rating: 5,
      comment: 'شرح منظم جداً واهتمام واضح بمتابعة الواجبات، ارتفع مستوى ابني في الرياضيات خلال شهر واحد.',
      date: '2026-11-08',
    },
    {
      id: 'rev-2',
      tutorId: 't-102',
      studentName: 'سارة المطيري',
      rating: 5,
      comment: 'الأستاذة نورة تشرح الفيزياء بطريقة عملية سلسة وترسل ملخصات ممتازة بعد كل حصة.',
      date: '2026-11-11',
    },
    {
      id: 'rev-3',
      tutorId: 't-103',
      studentName: 'فيصل الشمري',
      rating: 5,
      comment: 'التزام دقيق بالمواعيد وتحسن ملحوظ في مهارات الكتابة والمحادثة الأكاديمية.',
      date: '2026-11-13',
    },
  ];

  const transactions: PaymentTransaction[] = [
    {
      id: 'pay-501',
      bookingId: 'bk-901',
      tutorName: 'د. خالد بن فهد الدوسري',
      studentName: 'سارة المطيري',
      amount: 608,
      commissionFee: 60.8,
      netToTutor: 547.2,
      method: 'مدى / Apple Pay',
      status: 'مكتمل',
      date: '2026-11-15',
      description: 'حجز باقة أسبوعية (4 ساعات) - الرياضيات',
    },
    {
      id: 'pay-502',
      bookingId: 'bk-902',
      tutorName: 'أ. نورة بنت عبد الله السبيعي',
      studentName: 'سارة المطيري',
      amount: 1531.2,
      commissionFee: 153.12,
      netToTutor: 1378.08,
      method: 'بطاقة ائتمانية',
      status: 'مكتمل',
      date: '2026-11-10',
      description: 'حجز باقة شهرية (12 ساعة) - الفيزياء',
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'not-1',
      targetRole: 'student',
      title: 'تذكير تلقائي بالموعد القادم',
      message: 'لديك حصة رياضيات مع د. خالد الدوسري يوم الأحد 7:30 م عبر Microsoft Teams وتم إرسال دعوة التقويم.',
      time: 'منذ ساعة',
      read: false,
    },
    {
      id: 'not-2',
      targetRole: 'student',
      title: 'تم رصد درجة واجب الفيزياء',
      message: 'رصدت أ. نورة السبيعي درجة 96 / 100 في تقرير الدوائر الكهربائية.',
      time: 'منذ 3 ساعات',
      read: false,
    },
    {
      id: 'not-3',
      targetRole: 'tutor',
      title: 'حجز جديد وتحديث التقويم',
      message: 'تم تأكيد باقة أسبوعية مع الطالبة سارة المطيري (صافي الأرباح بعد عمولة 10%: 547.20 ر.س).',
      time: 'منذ ساعتين',
      read: false,
    },
  ];

  const applications: TutorApplication[] = [
    {
      id: 'app-301',
      name: 'أ. محمد بن راشد الشهري',
      gender: 'ذكر',
      subject: 'الرياضيات',
      curriculum: 'المنهج السعودي',
      gradeLevels: ['المرحلة المتوسطة', 'المرحلة الثانوية'],
      languages: ['العربية'],
      hourlyRate: 130,
      licenseNumber: 'MOE-SA-882914',
      universityDegree: 'ماجستير الرياضيات البحتة - جامعة الملك عبد العزيز',
      experienceYears: 8,
      certificateFileName: 'mohammed_alshahri_moe_license.pdf',
      status: 'pending',
      submittedAt: '2026-11-16',
    },
    {
      id: 'app-302',
      name: 'أ. لطيفة بنت ناصر المنصور',
      gender: 'أنثى',
      subject: 'اللغة الإنجليزية',
      curriculum: 'المنهج الدولي (IGCSE / IB)',
      gradeLevels: ['المرحلة الابتدائية', 'المرحلة المتوسطة'],
      languages: ['العربية', 'الإنجليزية'],
      hourlyRate: 140,
      licenseNumber: 'MOE-SA-793041',
      universityDegree: 'بكالوريوس الترجمة واللغويات + TESOL',
      experienceYears: 6,
      certificateFileName: 'latifa_tesol_verified_cert.pdf',
      status: 'pending',
      submittedAt: '2026-11-17',
    },
  ];

  return {
    tutors,
    bookings,
    assignments,
    reviews,
    transactions,
    notifications,
    applications,
    activeClientTier: 'Regular',
    studentName: 'سارة المطيري',
  };
}

export function loadState(): PlatformState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    const seed = createSeedState();
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(raw) as PlatformState;
  } catch {
    const seed = createSeedState();
    fs.writeFileSync(DB_PATH, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

export function saveState(state: PlatformState): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

export function calculatePackagePricing(
  hourlyRate: number,
  packageType: PackageTier,
  clientTier: ClientTier
) {
  const pkg = PACKAGE_CONFIG[packageType];
  const basePrice = Number((hourlyRate * pkg.hours).toFixed(2));
  const pkgDiscount = basePrice * pkg.packageDiscountRate;
  const afterPkgPrice = basePrice - pkgDiscount;
  const tierDiscountRate = CLIENT_TIER_DISCOUNT[clientTier];
  const tierDiscount = afterPkgPrice * tierDiscountRate;
  const totalDiscount = Number((pkgDiscount + tierDiscount).toFixed(2));
  const finalPrice = Number((basePrice - totalDiscount).toFixed(2));
  const platformCommission = Number((finalPrice * 0.1).toFixed(2));
  const tutorNetEarnings = Number((finalPrice - platformCommission).toFixed(2));

  return {
    hoursCount: pkg.hours,
    basePrice,
    discountAmount: totalDiscount,
    finalPrice,
    platformCommission,
    tutorNetEarnings,
  };
}

export function generateMeetingUrl(platform: MeetingPlatform, bookingId: string): string {
  if (platform === 'teams') {
    return `https://teams.microsoft.com/l/meetup-join/mutamad-${bookingId}`;
  }
  return `/classroom/${bookingId}`;
}
