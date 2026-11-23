export type PackageTier = 'hourly' | 'weekly' | 'monthly' | 'semester' | 'custom';
export type ClientTier = 'Regular' | 'Premium' | 'Elite';
export type MeetingPlatform = 'teams' | 'classroom';
export type LearningTrack = 'المراحل الدراسية' | 'قياس' | 'المرحلة الجامعية';
export type UserRole = 'student' | 'parent' | 'tutor';
export type GroupFixedSlotTime = '4:00 م' | '7:00 م' | '9:30 م';

export interface GroupClassSession {
  id: string;
  title: string;
  subject: string;
  learningTrack: LearningTrack;
  gradeLevel: string;
  tutorId: string;
  tutorName: string;
  tutorLicenseId: string;
  fixedTimeSlot: GroupFixedSlotTime;
  scheduleLabel: string;
  privateHourlyRate: number;
  groupPricePerSession: number;
  weeklyPassPrice: number;
  maxSeats: number;
  enrolledCount: number;
  enrolledStudents: string[];
  meetingPlatform: MeetingPlatform;
  meetingUrl: string;
  description: string;
}

export interface RegisteredChild {
  name: string;
  gradeLevel: string;
  track: LearningTrack;
  schoolName?: string;
}

export interface ActiveUserProfile {
  role: UserRole;
  fullName: string;
  email: string;
  nationalId?: string;
  city?: string;
  preferredTrack: LearningTrack;
  signedIn: boolean;
}

export interface PostSessionAiReport {
  summary: string;
  homework: string;
  weakPoints: string;
  nextPlan: string;
  parentReport: string;
  generatedAt: string;
}

export interface Tutor {
  id: string;
  name: string;
  avatar: string;
  gender: 'ذكر' | 'أنثى';
  city: string;
  nationality: string;
  university: string;
  subject: string;
  subjects: string[];
  learningTracks: LearningTrack[];
  gradeLevels: string[];
  curriculum: string;
  languages: string[];
  hourlyRate: number;
  dailyCapacityHours: number;
  bio: string;
  ministryLicenseId: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  certificates: string[];
  rating: number;
  reviewCount: number;
  availableSlots: string[];
  bookingsCount: number;
  experienceYears: number;
  exclusiveTier?: boolean;
  universityLevel?: boolean;
  walletWithdrawn?: number;
}

export interface Booking {
  id: string;
  tutorId: string;
  tutorName: string;
  studentName: string;
  studentEmail?: string;
  tutorEmail?: string;
  subject: string;
  learningTrack?: LearningTrack;
  gradeLevel: string;
  bookingMode?: 'private' | 'group';
  groupClassId?: string;
  packageType: PackageTier;
  sessionsPerWeek?: number;
  hoursCount: number;
  basePrice: number;
  discountAmount: number;
  finalPrice: number;
  platformCommission: number;
  tutorNetEarnings: number;
  scheduledSlot: string;
  meetingPlatform: MeetingPlatform;
  meetingUrl: string;
  calendarInviteSent: boolean;
  status: 'confirmed' | 'completed' | 'cancelled';
  attendanceStatus: 'pending' | 'present' | 'absent';
  studentRatingByTutor?: number;
  sessionNotes: string;
  aiReport?: PostSessionAiReport;
  createdAt: string;
}

export interface Assignment {
  id: string;
  bookingId: string;
  tutorId: string;
  tutorName: string;
  studentName: string;
  subject: string;
  title: string;
  description: string;
  fileName: string;
  dueDate: string;
  status: 'assigned' | 'submitted' | 'graded';
  grade?: string;
  studentSubmissionNote?: string;
  submittedFileName?: string;
}

export interface Review {
  id: string;
  tutorId: string;
  studentName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  tutorName: string;
  studentName: string;
  amount: number;
  commissionFee: number;
  netToTutor: number;
  method: string;
  status: 'مكتمل' | 'قيد المعالجة';
  date: string;
  description: string;
}

export interface NotificationItem {
  id: string;
  targetRole: 'student' | 'tutor';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface TutorApplication {
  id: string;
  name: string;
  gender: 'ذكر' | 'أنثى';
  city: string;
  nationality: string;
  university: string;
  subject: string;
  curriculum: string;
  learningTracks: LearningTrack[];
  gradeLevels: string[];
  languages: string[];
  hourlyRate: number;
  dailyCapacityHours: number;
  licenseNumber: string;
  universityDegree: string;
  bankIban: string;
  experienceYears: number;
  certificateFileName: string;
  uploadedFiles?: string[];
  agreementSigned?: boolean;
  agreementSignedAt?: string;
  signatureDataUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface AbuseReport {
  id: string;
  reporterName: string;
  targetName: string;
  reason: string;
  date: string;
  status: 'open' | 'resolved';
}

export interface PlatformState {
  tutors: Tutor[];
  groupClasses: GroupClassSession[];
  bookings: Booking[];
  assignments: Assignment[];
  reviews: Review[];
  transactions: PaymentTransaction[];
  notifications: NotificationItem[];
  applications: TutorApplication[];
  reports: AbuseReport[];
  activeClientTier: ClientTier;
  studentName: string;
  childrenNames: string[];
  registeredChildrenDetails?: RegisteredChild[];
  activeUser?: ActiveUserProfile;
  favoriteTutorIds: string[];
}

export interface AiRecommendationItem {
  tutorId: string;
  tutorName: string;
  matchScore: number;
  reason: string;
  recommendedPackage: PackageTier;
  suggestedSlot: string;
  studyFocus: string;
}

export interface AiScheduleOptimization {
  remainingCapacityHours: number;
  detectedGaps: string[];
  highDemandWindows: string[];
  demandForecastSummary: string;
  recommendedActions: string[];
}

export interface AiPerformanceInsights {
  overallSummary: string;
  attendanceRateLabel: string;
  strengths: string[];
  nextSteps: string[];
  familyReportNote?: string;
}
