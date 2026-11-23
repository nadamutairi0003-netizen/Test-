import fs from 'fs';
import path from 'path';
import type {
  Assignment,
  Booking,
  ClientTier,
  GroupClassSession,
  LearningTrack,
  MeetingPlatform,
  NotificationItem,
  PackageTier,
  PaymentTransaction,
  PlatformState,
  RegisteredChild,
  Review,
  Tutor,
  TutorApplication,
} from '../src/types';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'platform-db.json');

export const PACKAGE_CONFIG: Record<
  PackageTier,
  { label: string; hours: number; packageDiscountRate: number; defaultSessionsPerWeek: number }
> = {
  hourly: { label: 'حصة فردية (ساعة)', hours: 1, packageDiscountRate: 0, defaultSessionsPerWeek: 1 },
  weekly: {
    label: 'الباقة الأسبوعية (3 حصص)',
    hours: 3,
    packageDiscountRate: 0.05,
    defaultSessionsPerWeek: 3,
  },
  monthly: {
    label: 'الباقة الشهرية (12 حصة)',
    hours: 12,
    packageDiscountRate: 0.12,
    defaultSessionsPerWeek: 3,
  },
  semester: {
    label: 'باقة الفصل الدراسي / 3 أشهر (36 حصة)',
    hours: 36,
    packageDiscountRate: 0.2,
    defaultSessionsPerWeek: 3,
  },
  custom: {
    label: 'باقة مخصصة (5 حصص أسبوعياً)',
    hours: 5,
    packageDiscountRate: 0.08,
    defaultSessionsPerWeek: 5,
  },
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
      city: 'الرياض',
      nationality: 'سعودي',
      university: 'جامعة الملك سعود',
      subject: 'الرياضيات',
      subjects: ['الرياضيات', 'التحصيلي الكمي', 'القدرات العامة', 'التفاضل والتكامل الجامعي'],
      learningTracks: ['المراحل الدراسية', 'قياس', 'المرحلة الجامعية'],
      gradeLevels: ['المرحلة الثانوية', 'المرحلة المتوسطة', 'المسار الجامعي'],
      curriculum: 'المنهج السعودي',
      languages: ['العربية', 'الإنجليزية'],
      hourlyRate: 160,
      dailyCapacityHours: 5,
      bio: 'دكتوراه في مناهج وطرق تدريس الرياضيات، خبرة 12 عاماً في إعداد طلاب الثانوية لاختبارات القدرات والتحصيلي ومقررات الرياضيات الجامعية.',
      ministryLicenseId: 'MOE-SA-449821',
      verificationStatus: 'verified',
      certificates: ['رخصة ممارس تعليمي معتمد', 'دكتوراه في الرياضيات التطبيقية - جامعة الملك سعود'],
      rating: 4.9,
      reviewCount: 42,
      availableSlots: [
        'الأحد 4:00 م',
        'الإثنين 5:00 م',
        'الثلاثاء 7:00 م',
        'الأربعاء 4:30 م',
        'الخميس 6:00 م',
        'الجمعة 5:00 م',
        'السبت 4:00 م',
      ],
      bookingsCount: 128,
      experienceYears: 12,
      exclusiveTier: true,
      universityLevel: true,
      walletWithdrawn: 0,
    },
    {
      id: 't-102',
      name: 'أ. نورة بنت عبد الله السبيعي',
      avatar: '/src/assets/images/tutor_avatar_female_1_1794940122416.jpg',
      gender: 'أنثى',
      city: 'جدة',
      nationality: 'سعودية',
      university: 'جامعة الأميرة نورة',
      subject: 'الفيزياء',
      subjects: ['الفيزياء', 'العلوم', 'الكيمياء', 'التحصيلي العلمي'],
      learningTracks: ['المراحل الدراسية', 'قياس'],
      gradeLevels: ['المرحلة الثانوية', 'المرحلة المتوسطة'],
      curriculum: 'المنهج السعودي',
      languages: ['العربية', 'الإنجليزية'],
      hourlyRate: 145,
      dailyCapacityHours: 5,
      bio: 'ماجستير في الفيزياء النظرية ومعلمة معتمدة من وزارة التعليم، متخصصة في تبسيط الميكانيكا والكهرباء وتأهيل الطالبات لاختبار التحصيلي.',
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
        'الجمعة 4:00 م',
        'السبت 3:00 م',
      ],
      bookingsCount: 94,
      experienceYears: 9,
      exclusiveTier: true,
      walletWithdrawn: 0,
    },
    {
      id: 't-103',
      name: 'أ. طارق بن سامي القحطاني',
      avatar: '/src/assets/images/tutor_avatar_male_2_1794940123563.jpg',
      gender: 'ذكر',
      city: 'الخبر',
      nationality: 'سعودي',
      university: 'جامعة الملك فهد للبترول والمعادن',
      subject: 'اللغة الإنجليزية',
      subjects: ['اللغة الإنجليزية', 'IELTS', 'STEP قياس', 'الإنجليزية الأكاديمية'],
      learningTracks: ['المراحل الدراسية', 'قياس', 'المرحلة الجامعية'],
      gradeLevels: ['المرحلة الابتدائية', 'المرحلة المتوسطة', 'المرحلة الثانوية', 'المسار الجامعي'],
      curriculum: 'المنهج الدولي (IGCSE / IB)',
      languages: ['الإنجليزية', 'العربية'],
      hourlyRate: 135,
      dailyCapacityHours: 4,
      bio: 'مدرب لغة إنجليزية معتمد بشهادة CELTA وماجستير اللغويات التطبيقية، متخصص في المناهج الدولية، اختبار STEP من قياس، والسنة التحضيرية الجامعية.',
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
        'الجمعة 8:00 م',
        'السبت 6:00 م',
      ],
      bookingsCount: 77,
      experienceYears: 8,
      universityLevel: true,
      walletWithdrawn: 0,
    },
    {
      id: 't-104',
      name: 'أ. هند بنت سليمان العتيبي',
      avatar: '/src/assets/images/tutor_avatar_female_2_1794940123409.jpg',
      gender: 'أنثى',
      city: 'الرياض',
      nationality: 'سعودية',
      university: 'جامعة الإمام محمد بن سعود',
      subject: 'اللغة العربية',
      subjects: ['اللغة العربية', 'النحو والبلاغة', 'القدرات اللفظي'],
      learningTracks: ['المراحل الدراسية', 'قياس'],
      gradeLevels: ['المرحلة الابتدائية', 'المرحلة المتوسطة', 'المرحلة الثانوية'],
      curriculum: 'المنهج السعودي',
      languages: ['العربية'],
      hourlyRate: 120,
      dailyCapacityHours: 5,
      bio: 'معلمة خبيرة في النحو والبلاغة والقسم اللفظي لاختبار القدرات العامة وتأسيس مهارات القراءة والكتابة وفق معايير نافس.',
      ministryLicenseId: 'MOE-SA-290115',
      verificationStatus: 'verified',
      certificates: ['رخصة معلم خبير - هيئة تقويم التعليم', 'بكالوريوس اللغة العربية وآدابها'],
      rating: 5.0,
      reviewCount: 51,
      availableSlots: ['الأحد 3:30 م', 'الإثنين 4:30 م', 'الجمعة 4:30 م', 'السبت 5:00 م'],
      bookingsCount: 141,
      experienceYears: 14,
      exclusiveTier: true,
      walletWithdrawn: 0,
    },
    {
      id: 't-105',
      name: 'أ. ريم بنت ماجد الزهراني',
      avatar: '',
      gender: 'أنثى',
      city: 'الدمام',
      nationality: 'سعودية',
      university: 'جامعة الملك عبد العزيز',
      subject: 'الكيمياء والأحياء',
      subjects: ['الكيمياء', 'الأحياء', 'التحصيلي العلمي'],
      learningTracks: ['المراحل الدراسية', 'قياس'],
      gradeLevels: ['المرحلة الثانوية', 'المرحلة المتوسطة'],
      curriculum: 'المنهج الأمريكي',
      languages: ['العربية', 'الإنجليزية'],
      hourlyRate: 140,
      dailyCapacityHours: 4,
      bio: 'أخصائية تدريس الكيمياء العضوية والأحياء للمسارات الدولية والسعودية مع تدريب مكثف على أسئلة التحصيلي العلمي.',
      ministryLicenseId: 'MOE-SA-601442',
      verificationStatus: 'verified',
      certificates: ['اعتماد تدريس العلوم المتقدمة', 'بكالوريوس الكيمياء الحيوية مع مرتبة الشرف'],
      rating: 4.8,
      reviewCount: 19,
      availableSlots: [
        'الأحد 7:00 م',
        'الثلاثاء 6:00 م',
        'الخميس 4:00 م',
        'الجمعة 6:30 م',
        'السبت 4:00 م',
      ],
      bookingsCount: 48,
      experienceYears: 7,
      walletWithdrawn: 0,
    },
    {
      id: 't-106',
      name: 'م. عمر بن ياسر الحربي',
      avatar: '',
      gender: 'ذكر',
      city: 'الرياض',
      nationality: 'سعودي',
      university: 'جامعة الملك فهد للبترول والمعادن',
      subject: 'الحاسب والبرمجة',
      subjects: ['الحاسب الآلي', 'البرمجة ببايثون', 'هياكل البيانات الجامعية'],
      learningTracks: ['المراحل الدراسية', 'المرحلة الجامعية'],
      gradeLevels: ['المرحلة المتوسطة', 'المرحلة الثانوية', 'المسار الجامعي'],
      curriculum: 'المنهج السعودي',
      languages: ['العربية', 'الإنجليزية'],
      hourlyRate: 150,
      dailyCapacityHours: 5,
      bio: 'مهندس برمجيات ومدرب معتمد في علوم الحاسب وهياكل البيانات وتطبيقات بايثون لطلاب المدارس والجامعات.',
      ministryLicenseId: 'MOE-SA-774310',
      verificationStatus: 'verified',
      certificates: ['رخصة مدرب تقني معتمد', 'ماجستير علوم الحاسب'],
      rating: 4.7,
      reviewCount: 23,
      availableSlots: [], // Showcases "Fully Booked" smart indicator cleanly
      bookingsCount: 62,
      experienceYears: 6,
      universityLevel: true,
      walletWithdrawn: 0,
    },
  ];

  const bookings: Booking[] = [
    {
      id: 'bk-901',
      tutorId: 't-101',
      tutorName: 'د. خالد بن فهد الدوسري',
      studentName: 'سارة المطيري',
      studentEmail: 'sara.family@example.sa',
      tutorEmail: 'khalid.dosari@mutamad.sa',
      subject: 'الرياضيات',
      learningTrack: 'المراحل الدراسية',
      gradeLevel: 'الثالث الثانوي',
      packageType: 'weekly',
      sessionsPerWeek: 3,
      hoursCount: 3,
      basePrice: 480,
      discountAmount: 24,
      finalPrice: 456,
      platformCommission: 45.6,
      tutorNetEarnings: 410.4,
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
      studentEmail: 'sara.family@example.sa',
      tutorEmail: 'noura.subaei@mutamad.sa',
      subject: 'الفيزياء',
      learningTrack: 'المراحل الدراسية',
      gradeLevel: 'الثالث الثانوي',
      packageType: 'monthly',
      sessionsPerWeek: 3,
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
      studentRatingByTutor: 5,
      sessionNotes: 'أظهرت الطالبة فهماً ممتازاً لقوانين كيرشوف؛ نركز الأسبوع القادم على الحث الكهرومغناطيسي.',
      aiReport: {
        summary: 'تم شرح قوانين كيرشوف للجهد والتيار وحل 4 دوائر كهربائية مركبة.',
        homework: 'حل تقرير الدوائر الكهربائية المكون من 3 مسائل عملية.',
        weakPoints: 'تحديد اتجاه التيار الافتراضي في الحلقات المتعددة يحتاج تدريباً إضافياً.',
        nextPlan: 'مراجعة سريعة لقانون كيرشوف الثاني ثم البدء بالحث الكهرومغناطيسي.',
        parentReport: 'تقدم الطالبة سارة ممتاز (تفاعل 5/5)، وأكملت التمارين الأساسية بدقة.',
        generatedAt: '2026-11-10',
      },
      createdAt: '2026-11-10',
    },
    {
      id: 'bk-903',
      tutorId: 't-103',
      tutorName: 'أ. طارق بن سامي القحطاني',
      studentName: 'فيصل المطيري',
      studentEmail: 'sara.family@example.sa',
      tutorEmail: 'tariq.qahtani@mutamad.sa',
      subject: 'اللغة الإنجليزية',
      learningTrack: 'قياس',
      gradeLevel: 'الثاني الثانوي',
      packageType: 'hourly',
      sessionsPerWeek: 1,
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
      studentRatingByTutor: 5,
      sessionNotes: 'تدريب على استراتيجيات القراءة لاختبار STEP قياس.',
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
      studentName: 'فيصل المطيري',
      rating: 5,
      comment: 'التزام دقيق بالمواعيد وتحسن ملحوظ في مهارات القراءة والكتابة الأكاديمية.',
      date: '2026-11-13',
    },
  ];

  const transactions: PaymentTransaction[] = [
    {
      id: 'pay-501',
      bookingId: 'bk-901',
      tutorName: 'د. خالد بن فهد الدوسري',
      studentName: 'سارة المطيري',
      amount: 456,
      commissionFee: 45.6,
      netToTutor: 410.4,
      method: 'مدى / Apple Pay',
      status: 'مكتمل',
      date: '2026-11-15',
      description: 'حجز باقة أسبوعية (3 حصص) - الرياضيات',
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
      description: 'حجز باقة شهرية (12 حصة) - الفيزياء',
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
      title: 'تقرير ولي الأمر جاهز',
      message: 'تم توليد ملخص حصة الفيزياء وتقرير التقدم لإرسالها لولي الأمر.',
      time: 'منذ 3 ساعات',
      read: false,
    },
    {
      id: 'not-3',
      targetRole: 'tutor',
      title: 'حجز جديد وتحديث التقويم',
      message: 'تم تأكيد باقة أسبوعية مع الطالبة سارة المطيري (صافي الأرباح بعد عمولة 10%: 410.40 ر.س).',
      time: 'منذ ساعتين',
      read: false,
    },
  ];

  const applications: TutorApplication[] = [
    {
      id: 'app-301',
      name: 'أ. محمد بن راشد الشهري',
      gender: 'ذكر',
      city: 'الرياض',
      nationality: 'سعودي',
      university: 'جامعة الملك عبد العزيز',
      subject: 'الرياضيات',
      curriculum: 'المنهج السعودي',
      learningTracks: ['المراحل الدراسية', 'قياس'],
      gradeLevels: ['المرحلة المتوسطة', 'المرحلة الثانوية'],
      languages: ['العربية'],
      hourlyRate: 130,
      dailyCapacityHours: 5,
      licenseNumber: 'MOE-SA-882914',
      universityDegree: 'ماجستير الرياضيات البحتة - جامعة الملك عبد العزيز',
      bankIban: 'SA0380000000608010167519',
      experienceYears: 8,
      certificateFileName: 'mohammed_alshahri_moe_license.pdf',
      status: 'pending',
      submittedAt: '2026-11-16',
    },
    {
      id: 'app-302',
      name: 'أ. لطيفة بنت ناصر المنصور',
      gender: 'أنثى',
      city: 'جدة',
      nationality: 'سعودية',
      university: 'جامعة جدة',
      subject: 'اللغة الإنجليزية',
      curriculum: 'المنهج الدولي (IGCSE / IB)',
      learningTracks: ['المراحل الدراسية', 'المرحلة الجامعية'],
      gradeLevels: ['المرحلة الابتدائية', 'المرحلة المتوسطة', 'المسار الجامعي'],
      languages: ['العربية', 'الإنجليزية'],
      hourlyRate: 140,
      dailyCapacityHours: 4,
      licenseNumber: 'MOE-SA-793041',
      universityDegree: 'بكالوريوس الترجمة واللغويات + TESOL',
      bankIban: 'SA4420000001234567891234',
      experienceYears: 6,
      certificateFileName: 'latifa_tesol_verified_cert.pdf',
      status: 'pending',
      submittedAt: '2026-11-17',
    },
  ];

  const groupClasses: GroupClassSession[] = [
    // 1. الرياضيات (3 مواعيد ثابتة يومياً)
    {
      id: 'grp-math-1',
      title: 'الرياضيات — تأسيس المناهج وحل المسائل (الفترة الأولى)',
      subject: 'الرياضيات',
      learningTrack: 'المراحل الدراسية',
      gradeLevel: 'الابتدائي والمتوسط والثانوي',
      tutorId: 't-101',
      tutorName: 'د. خالد بن فهد الدوسري',
      tutorLicenseId: 'MOE-SA-449821',
      fixedTimeSlot: '4:00 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 160,
      groupPricePerSession: 49,
      weeklyPassPrice: 290,
      maxSeats: 15,
      enrolledCount: 9,
      enrolledStudents: ['تركي العجمي', 'سارة المطيري'],
      meetingPlatform: 'teams',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/mutamad-grp-math-1',
      description: 'حصة يومية الساعة 4:00 م لشرح الدروس الأساسية وحل التمارين لكل المراحل.',
    },
    {
      id: 'grp-math-2',
      title: 'الرياضيات — القدرات الكمي والتحصيلي (الفترة الثانية)',
      subject: 'الرياضيات',
      learningTrack: 'قياس',
      gradeLevel: 'تأهيل قياس والثانوي',
      tutorId: 't-101',
      tutorName: 'د. خالد بن فهد الدوسري',
      tutorLicenseId: 'MOE-SA-449821',
      fixedTimeSlot: '7:00 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 160,
      groupPricePerSession: 55,
      weeklyPassPrice: 320,
      maxSeats: 18,
      enrolledCount: 12,
      enrolledStudents: ['خالد القحطاني'],
      meetingPlatform: 'teams',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/mutamad-grp-math-2',
      description: 'تدريب يومي الساعة 7:00 م على استراتيجيات الحل السريع وتجميعات الكمي والتحصيلي.',
    },
    {
      id: 'grp-math-3',
      title: 'الرياضيات — التفاضل والتكامل والمراجعة الليلية (الفترة الثالثة)',
      subject: 'الرياضيات',
      learningTrack: 'المرحلة الجامعية',
      gradeLevel: 'الثالث الثانوي والمسار الجامعي',
      tutorId: 't-101',
      tutorName: 'د. خالد بن فهد الدوسري',
      tutorLicenseId: 'MOE-SA-449821',
      fixedTimeSlot: '9:30 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 160,
      groupPricePerSession: 55,
      weeklyPassPrice: 320,
      maxSeats: 15,
      enrolledCount: 7,
      enrolledStudents: ['سعود العتيبي'],
      meetingPlatform: 'classroom',
      meetingUrl: '/classroom/grp-math-3',
      description: 'ورشة مسائية يومية الساعة 9:30 م للتفاضل والتكامل ومراجعات الاختبارات.',
    },

    // 2. الفيزياء (3 مواعيد ثابتة يومياً)
    {
      id: 'grp-phys-1',
      title: 'الفيزياء — تبسيط القوانين والميكانيكا (الفترة الأولى)',
      subject: 'الفيزياء',
      learningTrack: 'المراحل الدراسية',
      gradeLevel: 'المتوسط والثانوي',
      tutorId: 't-102',
      tutorName: 'أ. نورة بنت عبد الله السبيعي',
      tutorLicenseId: 'MOE-SA-318704',
      fixedTimeSlot: '4:00 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 145,
      groupPricePerSession: 45,
      weeklyPassPrice: 265,
      maxSeats: 15,
      enrolledCount: 7,
      enrolledStudents: ['نورة العتيبي'],
      meetingPlatform: 'classroom',
      meetingUrl: '/classroom/grp-phys-1',
      description: 'شرح يومي الساعة 4:00 م لقوانين الحركة والطاقة والدوائر الكهربائية بأسلوب مبسط.',
    },
    {
      id: 'grp-phys-2',
      title: 'الفيزياء — الكهرباء والمغناطيسية والتحصيلي (الفترة الثانية)',
      subject: 'الفيزياء',
      learningTrack: 'قياس',
      gradeLevel: 'الثانوي وتأهيل التحصيلي',
      tutorId: 't-102',
      tutorName: 'أ. نورة بنت عبد الله السبيعي',
      tutorLicenseId: 'MOE-SA-318704',
      fixedTimeSlot: '7:00 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 145,
      groupPricePerSession: 49,
      weeklyPassPrice: 285,
      maxSeats: 15,
      enrolledCount: 8,
      enrolledStudents: ['سارة المطيري'],
      meetingPlatform: 'teams',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/mutamad-grp-phys-2',
      description: 'حل يومي الساعة 7:00 م لأهم مسائل الفيزياء في المنهج السعودي واختبار التحصيلي.',
    },
    {
      id: 'grp-phys-3',
      title: 'الفيزياء — حل المسائل والنماذج المتقدمة (الفترة الثالثة)',
      subject: 'الفيزياء',
      learningTrack: 'المراحل الدراسية',
      gradeLevel: 'المرحلة الثانوية',
      tutorId: 't-102',
      tutorName: 'أ. نورة بنت عبد الله السبيعي',
      tutorLicenseId: 'MOE-SA-318704',
      fixedTimeSlot: '9:30 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 145,
      groupPricePerSession: 45,
      weeklyPassPrice: 265,
      maxSeats: 15,
      enrolledCount: 5,
      enrolledStudents: [],
      meetingPlatform: 'classroom',
      meetingUrl: '/classroom/grp-phys-3',
      description: 'مراجعة مسائية يومية الساعة 9:30 م لحل الواجبات والاختبارات التجريبية.',
    },

    // 3. الكيمياء والأحياء (3 مواعيد ثابتة يومياً)
    {
      id: 'grp-chem-1',
      title: 'الكيمياء والأحياء — التفاعلات والمعادلات (الفترة الأولى)',
      subject: 'الكيمياء والأحياء',
      learningTrack: 'المراحل الدراسية',
      gradeLevel: 'المتوسط والثانوي',
      tutorId: 't-105',
      tutorName: 'أ. ريم بنت ماجد الزهراني',
      tutorLicenseId: 'MOE-SA-601442',
      fixedTimeSlot: '4:00 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 140,
      groupPricePerSession: 45,
      weeklyPassPrice: 260,
      maxSeats: 15,
      enrolledCount: 6,
      enrolledStudents: [],
      meetingPlatform: 'teams',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/mutamad-grp-chem-1',
      description: 'تأسيس يومي الساعة 4:00 م في المعادلات الكيميائية وأساسيات الأحياء.',
    },
    {
      id: 'grp-chem-2',
      title: 'الكيمياء والأحياء — التحصيلي العلمي المكثف (الفترة الثانية)',
      subject: 'الكيمياء والأحياء',
      learningTrack: 'قياس',
      gradeLevel: 'الثانوي وتأهيل التحصيلي',
      tutorId: 't-105',
      tutorName: 'أ. ريم بنت ماجد الزهراني',
      tutorLicenseId: 'MOE-SA-601442',
      fixedTimeSlot: '7:00 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 140,
      groupPricePerSession: 49,
      weeklyPassPrice: 280,
      maxSeats: 16,
      enrolledCount: 9,
      enrolledStudents: [],
      meetingPlatform: 'teams',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/mutamad-grp-chem-2',
      description: 'تدريب يومي الساعة 7:00 م على الكيمياء العضوية والوراثة واختبار التحصيلي.',
    },
    {
      id: 'grp-chem-3',
      title: 'الكيمياء والأحياء — المراجعة الليلية السريعة (الفترة الثالثة)',
      subject: 'الكيمياء والأحياء',
      learningTrack: 'المراحل الدراسية',
      gradeLevel: 'المرحلة الثانوية',
      tutorId: 't-105',
      tutorName: 'أ. ريم بنت ماجد الزهراني',
      tutorLicenseId: 'MOE-SA-601442',
      fixedTimeSlot: '9:30 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 140,
      groupPricePerSession: 45,
      weeklyPassPrice: 260,
      maxSeats: 15,
      enrolledCount: 4,
      enrolledStudents: [],
      meetingPlatform: 'classroom',
      meetingUrl: '/classroom/grp-chem-3',
      description: 'جلسة يومية الساعة 9:30 م لترسيخ المفاهيم وحل أسئلة الفصول الدراسية.',
    },

    // 4. اللغة الإنجليزية (3 مواعيد ثابتة يومياً)
    {
      id: 'grp-eng-1',
      title: 'اللغة الإنجليزية — التأسيس والمناهج الدولية (الفترة الأولى)',
      subject: 'اللغة الإنجليزية',
      learningTrack: 'المراحل الدراسية',
      gradeLevel: 'الابتدائي والمتوسط والثانوي',
      tutorId: 't-103',
      tutorName: 'أ. طارق بن سامي القحطاني',
      tutorLicenseId: 'MOE-SA-512093',
      fixedTimeSlot: '4:00 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 135,
      groupPricePerSession: 42,
      weeklyPassPrice: 245,
      maxSeats: 15,
      enrolledCount: 8,
      enrolledStudents: [],
      meetingPlatform: 'teams',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/mutamad-grp-eng-1',
      description: 'شرح يومي الساعة 4:00 م للقواعد والمفردات ومهارات القراءة للمناهج السعودية والدولية.',
    },
    {
      id: 'grp-eng-2',
      title: 'اللغة الإنجليزية — اختبار STEP و IELTS اليومي (الفترة الثانية)',
      subject: 'اللغة الإنجليزية',
      learningTrack: 'قياس',
      gradeLevel: 'الثانوي والجامعي',
      tutorId: 't-103',
      tutorName: 'أ. طارق بن سامي القحطاني',
      tutorLicenseId: 'MOE-SA-512093',
      fixedTimeSlot: '7:00 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 135,
      groupPricePerSession: 45,
      weeklyPassPrice: 260,
      maxSeats: 15,
      enrolledCount: 10,
      enrolledStudents: ['فيصل المطيري'],
      meetingPlatform: 'teams',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/mutamad-grp-eng-2',
      description: 'تدريب يومي الساعة 7:00 م على استراتيجيات الاستيعاب القرائي والاستماع لاختبار STEP.',
    },
    {
      id: 'grp-eng-3',
      title: 'اللغة الإنجليزية — المحادثة والإنجليزية الأكاديمية (الفترة الثالثة)',
      subject: 'اللغة الإنجليزية',
      learningTrack: 'المرحلة الجامعية',
      gradeLevel: 'السنة التحضيرية والجامعي',
      tutorId: 't-103',
      tutorName: 'أ. طارق بن سامي القحطاني',
      tutorLicenseId: 'MOE-SA-512093',
      fixedTimeSlot: '9:30 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 135,
      groupPricePerSession: 42,
      weeklyPassPrice: 245,
      maxSeats: 15,
      enrolledCount: 6,
      enrolledStudents: [],
      meetingPlatform: 'classroom',
      meetingUrl: '/classroom/grp-eng-3',
      description: 'ممارسة تفاعلية يومية الساعة 9:30 م للكتابة الأكاديمية والمحادثة بطلاقة.',
    },

    // 5. اللغة العربية (3 مواعيد ثابتة يومياً)
    {
      id: 'grp-arb-1',
      title: 'اللغة العربية — تأسيس القراءة والإملاء والنحو (الفترة الأولى)',
      subject: 'اللغة العربية',
      learningTrack: 'المراحل الدراسية',
      gradeLevel: 'الابتدائي والمتوسط',
      tutorId: 't-104',
      tutorName: 'أ. هند بنت سليمان العتيبي',
      tutorLicenseId: 'MOE-SA-290115',
      fixedTimeSlot: '4:00 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 120,
      groupPricePerSession: 39,
      weeklyPassPrice: 225,
      maxSeats: 15,
      enrolledCount: 7,
      enrolledStudents: ['لمى المطيري'],
      meetingPlatform: 'classroom',
      meetingUrl: '/classroom/grp-arb-1',
      description: 'حصة يومية الساعة 4:00 م لتقوية الإملاء والإعراب ومهارات الفهم القرائي وفق نافس.',
    },
    {
      id: 'grp-arb-2',
      title: 'اللغة العربية — القدرات اللفظي والبلاغة (الفترة الثانية)',
      subject: 'اللغة العربية',
      learningTrack: 'قياس',
      gradeLevel: 'الثانوي وتأهيل قياس',
      tutorId: 't-104',
      tutorName: 'أ. هند بنت سليمان العتيبي',
      tutorLicenseId: 'MOE-SA-290115',
      fixedTimeSlot: '7:00 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 120,
      groupPricePerSession: 39,
      weeklyPassPrice: 225,
      maxSeats: 15,
      enrolledCount: 9,
      enrolledStudents: [],
      meetingPlatform: 'teams',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/mutamad-grp-arb-2',
      description: 'تدريب يومي الساعة 7:00 م على التناظر اللفظي وإكمال الجمل والخطأ السياقي.',
    },
    {
      id: 'grp-arb-3',
      title: 'اللغة العربية — النحو الشامل والنصوص (الفترة الثالثة)',
      subject: 'اللغة العربية',
      learningTrack: 'المراحل الدراسية',
      gradeLevel: 'المتوسط والثانوي',
      tutorId: 't-104',
      tutorName: 'أ. هند بنت سليمان العتيبي',
      tutorLicenseId: 'MOE-SA-290115',
      fixedTimeSlot: '9:30 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 120,
      groupPricePerSession: 39,
      weeklyPassPrice: 225,
      maxSeats: 15,
      enrolledCount: 6,
      enrolledStudents: [],
      meetingPlatform: 'classroom',
      meetingUrl: '/classroom/grp-arb-3',
      description: 'مراجعة مسائية يومية الساعة 9:30 م لقواعد النحو والصرف والأدب.',
    },

    // 6. الحاسب والبرمجة (3 مواعيد ثابتة يومياً)
    {
      id: 'grp-cs-1',
      title: 'الحاسب والبرمجة — أساسيات بايثون للمدارس (الفترة الأولى)',
      subject: 'الحاسب والبرمجة',
      learningTrack: 'المراحل الدراسية',
      gradeLevel: 'المتوسط والثانوي',
      tutorId: 't-106',
      tutorName: 'م. عمر بن ياسر الحربي',
      tutorLicenseId: 'MOE-SA-774310',
      fixedTimeSlot: '4:00 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 150,
      groupPricePerSession: 49,
      weeklyPassPrice: 285,
      maxSeats: 14,
      enrolledCount: 8,
      enrolledStudents: [],
      meetingPlatform: 'teams',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/mutamad-grp-cs-1',
      description: 'تعلم البرمجة ببايثون وتطبيقات الحاسب المدرسية يومياً الساعة 4:00 م.',
    },
    {
      id: 'grp-cs-2',
      title: 'الحاسب والبرمجة — الخوارزميات وحل المشكلات (الفترة الثانية)',
      subject: 'الحاسب والبرمجة',
      learningTrack: 'المرحلة الجامعية',
      gradeLevel: 'الثانوي والجامعي',
      tutorId: 't-106',
      tutorName: 'م. عمر بن ياسر الحربي',
      tutorLicenseId: 'MOE-SA-774310',
      fixedTimeSlot: '7:00 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 150,
      groupPricePerSession: 49,
      weeklyPassPrice: 285,
      maxSeats: 14,
      enrolledCount: 7,
      enrolledStudents: [],
      meetingPlatform: 'classroom',
      meetingUrl: '/classroom/grp-cs-2',
      description: 'تطبيقات عملية في الخوارزميات والمنطق البرمجي يومياً الساعة 7:00 م.',
    },
    {
      id: 'grp-cs-3',
      title: 'الحاسب والبرمجة — هياكل البيانات الجامعية (الفترة الثالثة)',
      subject: 'الحاسب والبرمجة',
      learningTrack: 'المرحلة الجامعية',
      gradeLevel: 'المسار الجامعي',
      tutorId: 't-106',
      tutorName: 'م. عمر بن ياسر الحربي',
      tutorLicenseId: 'MOE-SA-774310',
      fixedTimeSlot: '9:30 م',
      scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
      privateHourlyRate: 150,
      groupPricePerSession: 49,
      weeklyPassPrice: 285,
      maxSeats: 14,
      enrolledCount: 10,
      enrolledStudents: ['سعود العتيبي'],
      meetingPlatform: 'teams',
      meetingUrl: 'https://teams.microsoft.com/l/meetup-join/mutamad-grp-cs-3',
      description: 'ورشة ليلية يومية الساعة 9:30 م لهياكل البيانات ومشاريع البرمجة الجامعية.',
    },
  ];

  return {
    tutors,
    groupClasses,
    bookings,
    assignments,
    reviews,
    transactions,
    notifications,
    applications,
    reports: [],
    activeClientTier: 'Regular',
    studentName: 'سارة المطيري',
    childrenNames: ['سارة المطيري', 'فيصل المطيري'],
    registeredChildrenDetails: [
      {
        name: 'سارة المطيري',
        gradeLevel: 'الثالث الثانوي',
        track: 'قياس',
        schoolName: 'ثانوية المعرفة الأهلية',
      },
      {
        name: 'فيصل المطيري',
        gradeLevel: 'الثاني المتوسط',
        track: 'المراحل الدراسية',
        schoolName: 'متوسطة الفيصل النموذجية',
      },
    ],
    activeUser: {
      role: 'parent',
      fullName: 'ندى المطيري',
      email: 'parent@mutamad.sa',
      nationalId: '1045678901',
      city: 'الرياض',
      preferredTrack: 'المراحل الدراسية',
      signedIn: false,
    },
    favoriteTutorIds: ['t-101', 't-102'],
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
    const parsed = JSON.parse(raw) as PlatformState;
    const seed = createSeedState();
    const seedTutorMap = new Map(seed.tutors.map((t) => [t.id, t]));

    const inferTutorTracks = (t: Tutor): LearningTrack[] => {
      if (Array.isArray(t.learningTracks) && t.learningTracks.length > 0) {
        return t.learningTracks;
      }
      return ['المراحل الدراسية'];
    };

    parsed.tutors = (parsed.tutors || []).map((t) => {
      const ref = seedTutorMap.get(t.id);
      return {
        ...t,
        city: t.city || ref?.city || 'الرياض',
        nationality: t.nationality || ref?.nationality || 'سعودي',
        university: t.university || ref?.university || 'جامعة الملك سعود',
        dailyCapacityHours: t.dailyCapacityHours || ref?.dailyCapacityHours || 5,
        learningTracks: inferTutorTracks(t),
        walletWithdrawn: t.walletWithdrawn ?? 0,
      };
    });

    parsed.applications = (parsed.applications || []).map((a) => ({
      ...a,
      city: a.city || 'الرياض',
      nationality: a.nationality || 'سعودي',
      university: a.university || 'جامعة معتمدة',
      dailyCapacityHours: a.dailyCapacityHours || 5,
      bankIban: a.bankIban || 'SA0000000000000000000000',
      learningTracks:
        Array.isArray(a.learningTracks) && a.learningTracks.length > 0
          ? a.learningTracks
          : ['المراحل الدراسية'],
    }));

    parsed.reports = parsed.reports || [];
    const existingGroupIds = new Set((parsed.groupClasses || []).map((g) => g.id));
    const missingSeedGroups = seed.groupClasses.filter((g) => !existingGroupIds.has(g.id));
    parsed.groupClasses = parsed.groupClasses?.length
      ? [...parsed.groupClasses, ...missingSeedGroups]
      : seed.groupClasses;
    parsed.childrenNames = parsed.childrenNames?.length
      ? parsed.childrenNames
      : ['سارة المطيري', 'فيصل المطيري'];
    parsed.registeredChildrenDetails = parsed.registeredChildrenDetails?.length
      ? parsed.registeredChildrenDetails
      : seed.registeredChildrenDetails;
    parsed.activeUser = parsed.activeUser || seed.activeUser;
    parsed.favoriteTutorIds = parsed.favoriteTutorIds || ['t-101'];

    return parsed;
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
  const pkg = PACKAGE_CONFIG[packageType] || PACKAGE_CONFIG.weekly;
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
    sessionsPerWeek: pkg.defaultSessionsPerWeek,
    basePrice,
    discountAmount: totalDiscount,
    finalPrice,
    platformCommission,
    tutorNetEarnings,
  };
}

export function calculateGroupPricing(baseGroupPrice: number, clientTier: ClientTier) {
  const tierDiscountRate = CLIENT_TIER_DISCOUNT[clientTier];
  const discountAmount = Number((baseGroupPrice * tierDiscountRate).toFixed(2));
  const finalPrice = Number((baseGroupPrice - discountAmount).toFixed(2));
  const platformCommission = Number((finalPrice * 0.1).toFixed(2));
  const tutorNetEarnings = Number((finalPrice - platformCommission).toFixed(2));

  return {
    basePrice: baseGroupPrice,
    discountAmount,
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

const PRESET_FAMILY_REGISTRY: Record<
  string,
  { parentName: string; city: string; children: RegisteredChild[] }
> = {
  '1045678901': {
    parentName: 'ندى عبد الله المطيري',
    city: 'الرياض',
    children: [
      {
        name: 'سارة المطيري',
        gradeLevel: 'الثالث الثانوي',
        track: 'قياس',
        schoolName: 'ثانوية المعرفة الأهلية',
      },
      {
        name: 'فيصل المطيري',
        gradeLevel: 'الثاني المتوسط',
        track: 'المراحل الدراسية',
        schoolName: 'متوسطة الفيصل النموذجية',
      },
      {
        name: 'لمى المطيري',
        gradeLevel: 'السادس الابتدائي',
        track: 'المراحل الدراسية',
        schoolName: 'ابتدائية الريادة',
      },
    ],
  },
  '1098765432': {
    parentName: 'سلمان فهد العتيبي',
    city: 'جدة',
    children: [
      {
        name: 'سعود العتيبي',
        gradeLevel: 'الأول الجامعي',
        track: 'المرحلة الجامعية',
        schoolName: 'جامعة الملك عبد العزيز',
      },
      {
        name: 'نورة العتيبي',
        gradeLevel: 'الأول الثانوي',
        track: 'المراحل الدراسية',
        schoolName: 'ثانوية دار الحكمة',
      },
    ],
  },
  '1022334455': {
    parentName: 'ريم ناصر القحطاني',
    city: 'الخبر',
    children: [
      {
        name: 'خالد القحطاني',
        gradeLevel: 'الثاني الثانوي',
        track: 'قياس',
        schoolName: 'ثانوية الظهران',
      },
      {
        name: 'جود القحطاني',
        gradeLevel: 'الخامس الابتدائي',
        track: 'المراحل الدراسية',
        schoolName: 'مدارس الساحل',
      },
    ],
  },
};

const FAMILY_SURNAMES = ['الدوسري', 'الشمري', 'الغامدي', 'الزهراني', 'السبيعي', 'الحربي'];
const FIRST_NAMES_M = ['عبد العزيز', 'تركي', 'سلطان', 'بدر', 'عمر', 'زياد'];
const FIRST_NAMES_F = ['ريم', 'ليان', 'جنى', 'غادة', 'شهد', 'مها'];
const CITIES_LIST = ['الرياض', 'جدة', 'الخبر', 'الدمام'];

export function lookupFamilyByNationalId(nationalId: string): {
  parentName: string;
  city: string;
  children: RegisteredChild[];
} {
  const cleanId = nationalId.replace(/\D/g, '');
  if (PRESET_FAMILY_REGISTRY[cleanId]) {
    return PRESET_FAMILY_REGISTRY[cleanId];
  }
  const seedNum = Number(cleanId.slice(-4) || '1234');
  const surname = FAMILY_SURNAMES[seedNum % FAMILY_SURNAMES.length];
  const city = CITIES_LIST[seedNum % CITIES_LIST.length];
  const child1 = FIRST_NAMES_F[seedNum % FIRST_NAMES_F.length];
  const child2 = FIRST_NAMES_M[(seedNum + 2) % FIRST_NAMES_M.length];
  const child3 = FIRST_NAMES_F[(seedNum + 3) % FIRST_NAMES_F.length];

  return {
    parentName: `ولي الأمر (${surname})`,
    city,
    children: [
      {
        name: `${child1} ${surname}`,
        gradeLevel: 'الثالث الثانوي',
        track: 'قياس',
        schoolName: 'ثانوية المستقبل المعتمدة',
      },
      {
        name: `${child2} ${surname}`,
        gradeLevel: 'الأول المتوسط',
        track: 'المراحل الدراسية',
        schoolName: 'متوسطة الرواد',
      },
      {
        name: `${child3} ${surname}`,
        gradeLevel: 'السادس الابتدائي',
        track: 'المراحل الدراسية',
        schoolName: 'ابتدائية النخبة',
      },
    ],
  };
}
