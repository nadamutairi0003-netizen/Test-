export type PackageTier = 'hourly' | 'weekly' | 'monthly' | 'semester';
export type ClientTier = 'Regular' | 'Premium' | 'Elite';
export type MeetingPlatform = 'teams' | 'classroom';

export interface Tutor {
  id: string;
  name: string;
  avatar: string;
  gender: 'ذكر' | 'أنثى';
  subject: string;
  subjects: string[];
  gradeLevels: string[];
  curriculum: string;
  languages: string[];
  hourlyRate: number;
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
}

export interface Booking {
  id: string;
  tutorId: string;
  tutorName: string;
  studentName: string;
  subject: string;
  gradeLevel: string;
  packageType: PackageTier;
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
  sessionNotes: string;
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
  subject: string;
  curriculum: string;
  gradeLevels: string[];
  languages: string[];
  hourlyRate: number;
  licenseNumber: string;
  universityDegree: string;
  experienceYears: number;
  certificateFileName: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export interface PlatformState {
  tutors: Tutor[];
  bookings: Booking[];
  assignments: Assignment[];
  reviews: Review[];
  transactions: PaymentTransaction[];
  notifications: NotificationItem[];
  applications: TutorApplication[];
  activeClientTier: ClientTier;
  studentName: string;
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
