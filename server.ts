import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import {
  GoogleGenAI,
  Type,
  ThinkingLevel,
  type Content,
  type FunctionDeclaration,
  type Part,
} from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  CLIENT_TIER_DISCOUNT,
  PACKAGE_CONFIG,
  calculateGroupPricing,
  calculatePackagePricing,
  generateMeetingUrl,
  loadState,
  lookupFamilyByNationalId,
  saveState,
} from './server/store.ts';
import { buildStudyPptxBuffer } from './server/exportStudyPptx.ts';
import type {
  Assignment,
  Booking,
  ClientTier,
  GroupClassSession,
  GroupFixedSlotTime,
  LearningTrack,
  MeetingPlatform,
  PackageTier,
  RegisteredChild,
  Review,
  Tutor,
  TutorApplication,
} from './src/types.ts';

dotenv.config();

const app = express();
app.use(express.json({ limit: '2mb' }));

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Bootstrap all platform data
app.get('/api/bootstrap', (_req, res) => {
  const state = loadState();
  res.json(state);
});

// Switch active client tier (Regular / Premium / Elite)
app.patch('/api/client-tier', (req, res) => {
  const { tier } = req.body as { tier?: ClientTier };
  if (!tier || !['Regular', 'Premium', 'Elite'].includes(tier)) {
    res.status(400).json({ error: 'فئة العميل غير صالحة' });
    return;
  }
  const state = loadState();
  state.activeClientTier = tier;
  saveState(state);
  res.json({ activeClientTier: state.activeClientTier });
});

// Toggle favorite tutor for Student / Parent
app.post('/api/favorites/toggle', (req, res) => {
  const { tutorId } = req.body as { tutorId: string };
  const state = loadState();
  const exists = state.favoriteTutorIds.includes(tutorId);
  state.favoriteTutorIds = exists
    ? state.favoriteTutorIds.filter((id) => id !== tutorId)
    : [...state.favoriteTutorIds, tutorId];
  saveState(state);
  res.json({ favoriteTutorIds: state.favoriteTutorIds });
});

// Parent adds a child student profile
app.post('/api/parent/children', (req, res) => {
  const { childName } = req.body as { childName: string };
  if (!childName?.trim()) {
    res.status(400).json({ error: 'يرجى إدخال اسم الطالب' });
    return;
  }
  const state = loadState();
  if (!state.childrenNames.includes(childName.trim())) {
    state.childrenNames.push(childName.trim());
  }
  state.studentName = childName.trim();
  saveState(state);
  res.status(201).json({ childrenNames: state.childrenNames, studentName: state.studentName });
});

// Switch active student (for Parent managing multiple children)
app.patch('/api/parent/active-student', (req, res) => {
  const { studentName } = req.body as { studentName: string };
  const state = loadState();
  state.studentName = studentName;
  const matchedChild = state.registeredChildrenDetails?.find((c) => c.name === studentName);
  if (matchedChild && state.activeUser) {
    state.activeUser.preferredTrack = matchedChild.track;
  }
  saveState(state);
  res.json({ studentName: state.studentName, state });
});

// Lookup registered children automatically from Parent National ID
app.post('/api/auth/lookup-family', (req, res) => {
  const { nationalId } = req.body as { nationalId?: string };
  const cleanId = (nationalId || '').replace(/\D/g, '');
  if (cleanId.length !== 10) {
    res.status(400).json({ error: 'يرجى إدخال رقم هوية وطنية أو إقامة مكوّن من 10 أرقام.' });
    return;
  }
  const family = lookupFamilyByNationalId(cleanId);
  res.json(family);
});

// Student sign-in / registration with preferred learning track
app.post('/api/auth/register-student', (req, res) => {
  const { fullName, email, city, gradeLevel, preferredTrack } = req.body as {
    fullName?: string;
    email?: string;
    city?: string;
    gradeLevel?: string;
    preferredTrack?: LearningTrack;
  };
  if (!fullName?.trim()) {
    res.status(400).json({ error: 'يرجى إدخال اسم الطالب الكامل.' });
    return;
  }
  const cleanName = fullName.trim();
  const track: LearningTrack = preferredTrack || 'المراحل الدراسية';
  const state = loadState();

  state.studentName = cleanName;
  if (!state.childrenNames.includes(cleanName)) {
    state.childrenNames = [cleanName, ...state.childrenNames];
  }
  const existingDetails = state.registeredChildrenDetails || [];
  const filtered = existingDetails.filter((c) => c.name !== cleanName);
  state.registeredChildrenDetails = [
    {
      name: cleanName,
      gradeLevel: gradeLevel || 'المرحلة الثانوية',
      track,
      schoolName: 'حساب طالب مسجل',
    },
    ...filtered,
  ];
  state.activeUser = {
    role: 'student',
    fullName: cleanName,
    email: email?.trim() || 'student@mutamad.sa',
    city: city || 'الرياض',
    preferredTrack: track,
    signedIn: true,
  };
  saveState(state);
  res.status(201).json({ state });
});

// Parent sign-in / registration with automatic children import from National ID
app.post('/api/auth/register-parent', (req, res) => {
  const { fullName, email, nationalId, city, children } = req.body as {
    fullName?: string;
    email?: string;
    nationalId?: string;
    city?: string;
    children?: RegisteredChild[];
  };
  const cleanId = (nationalId || '').replace(/\D/g, '');
  if (cleanId.length !== 10) {
    res.status(400).json({ error: 'يرجى إدخال رقم هوية ولي الأمر الصحيح (10 أرقام).' });
    return;
  }
  const registry = lookupFamilyByNationalId(cleanId);
  const resolvedChildren = children?.length ? children : registry.children;
  const resolvedParentName = fullName?.trim() || registry.parentName;
  const state = loadState();

  state.registeredChildrenDetails = resolvedChildren;
  state.childrenNames = resolvedChildren.map((c) => c.name);
  state.studentName = resolvedChildren[0]?.name || state.studentName;
  state.activeUser = {
    role: 'parent',
    fullName: resolvedParentName,
    email: email?.trim() || 'parent@mutamad.sa',
    nationalId: cleanId,
    city: city || registry.city,
    preferredTrack: resolvedChildren[0]?.track || 'المراحل الدراسية',
    signedIn: true,
  };
  state.notifications.unshift({
    id: `not-${Date.now()}-parent`,
    targetRole: 'student',
    title: 'تم ربط ملف الأسرة من الهوية الوطنية',
    message: `تم جلب ${resolvedChildren.length} أبناء تلقائياً لحساب ${resolvedParentName}.`,
    time: 'الآن',
    read: false,
  });
  saveState(state);
  res.status(201).json({ state });
});

// Student updates their learning track easily anytime
app.patch('/api/auth/student-track', (req, res) => {
  const { preferredTrack } = req.body as { preferredTrack?: LearningTrack };
  if (!preferredTrack) {
    res.status(400).json({ error: 'يرجى تحديد المسار التعليمي.' });
    return;
  }
  const state = loadState();
  if (state.activeUser) {
    state.activeUser.preferredTrack = preferredTrack;
  }
  state.registeredChildrenDetails = (state.registeredChildrenDetails || []).map((c) =>
    c.name === state.studentName ? { ...c, track: preferredTrack } : c
  );
  saveState(state);
  res.json({ state });
});

// Create a booking with conflict check, 10% commission, calendar invite & Teams/classroom URL
app.post('/api/bookings', (req, res) => {
  const {
    tutorId,
    studentName,
    studentEmail,
    gradeLevel,
    packageType,
    scheduledSlot,
    meetingPlatform,
    paymentMethod,
  } = req.body as {
    tutorId: string;
    studentName: string;
    studentEmail?: string;
    gradeLevel: string;
    packageType: PackageTier;
    scheduledSlot: string;
    meetingPlatform: MeetingPlatform;
    paymentMethod: string;
  };

  const state = loadState();
  const tutor = state.tutors.find((t) => t.id === tutorId);
  if (!tutor) {
    res.status(404).json({ error: 'لم يتم العثور على المدرس' });
    return;
  }
  if (tutor.verificationStatus !== 'verified') {
    res.status(400).json({ error: 'لا يمكن الحجز إلا مع المدرسين المعتمدين من المنصة' });
    return;
  }
  if (tutor.availableSlots.length === 0) {
    res.status(409).json({
      error: 'هذا المدرس محجوز بالكامل حالياً (Fully Booked).',
    });
    return;
  }

  // Prevent scheduling conflict
  const conflict = state.bookings.find(
    (b) => b.tutorId === tutorId && b.scheduledSlot === scheduledSlot && b.status === 'confirmed'
  );
  if (conflict) {
    res.status(409).json({
      error: `الوقت (${scheduledSlot}) محجوز مسبقاً لتفادي تعارض المواعيد، يرجى اختيار موعد آخر متاح.`,
    });
    return;
  }

  const pricing = calculatePackagePricing(tutor.hourlyRate, packageType, state.activeClientTier);
  const bookingId = `bk-${Date.now().toString().slice(-4)}`;
  const targetStudent = studentName?.trim() || state.studentName;
  const resolvedStudentEmail = studentEmail?.trim() || 'client@mutamad.sa';
  const resolvedTutorEmail = `${tutor.id}@mutamad.sa`;

  const newBooking: Booking = {
    id: bookingId,
    tutorId: tutor.id,
    tutorName: tutor.name,
    studentName: targetStudent,
    studentEmail: resolvedStudentEmail,
    tutorEmail: resolvedTutorEmail,
    subject: tutor.subject,
    learningTrack: tutor.learningTracks?.[0],
    gradeLevel: gradeLevel || tutor.gradeLevels[0],
    packageType,
    sessionsPerWeek: pricing.sessionsPerWeek,
    hoursCount: pricing.hoursCount,
    basePrice: pricing.basePrice,
    discountAmount: pricing.discountAmount,
    finalPrice: pricing.finalPrice,
    platformCommission: pricing.platformCommission,
    tutorNetEarnings: pricing.tutorNetEarnings,
    scheduledSlot,
    meetingPlatform,
    meetingUrl: generateMeetingUrl(meetingPlatform, bookingId),
    calendarInviteSent: true,
    status: 'confirmed',
    attendanceStatus: 'pending',
    sessionNotes: '',
    createdAt: new Date().toISOString().slice(0, 10),
  };

  // Remove booked slot from tutor's open availability to enforce conflict prevention
  tutor.availableSlots = tutor.availableSlots.filter((s) => s !== scheduledSlot);
  tutor.bookingsCount += 1;

  state.bookings.unshift(newBooking);
  state.transactions.unshift({
    id: `pay-${Date.now().toString().slice(-4)}`,
    bookingId,
    tutorName: tutor.name,
    studentName: targetStudent,
    amount: pricing.finalPrice,
    commissionFee: pricing.platformCommission,
    netToTutor: pricing.tutorNetEarnings,
    method: paymentMethod || 'مدى / Apple Pay',
    status: 'مكتمل',
    date: new Date().toISOString().slice(0, 10),
    description: `حجز ${pricing.hoursCount} ساعة (${pricing.sessionsPerWeek} حصص/أسبوع) - ${tutor.subject}`,
  });

  state.notifications.unshift(
    {
      id: `not-${Date.now()}-s`,
      targetRole: 'student',
      title: 'تم تأكيد الحجز وإرسال دعوة التقويم',
      message: `تم حجز موعد ${scheduledSlot} مع ${tutor.name} وإرسال الدعوة إلى ${resolvedStudentEmail}.`,
      time: 'الآن',
      read: false,
    },
    {
      id: `not-${Date.now()}-t`,
      targetRole: 'tutor',
      title: 'حجز جديد مؤكد',
      message: `حجز الطالب ${targetStudent} موعد ${scheduledSlot}. صافي أرباحك بعد عمولة المنصة (10%): ${pricing.tutorNetEarnings.toFixed(
        2
      )} ر.س.`,
      time: 'الآن',
      read: false,
    }
  );

  saveState(state);
  res.status(201).json({ booking: newBooking, state });
});

// Enroll a student in a fixed-time daily group class (3 daily slots, 7 days/week, cheaper rate)
app.post('/api/group-classes/:id/enroll', (req, res) => {
  const { id } = req.params;
  const { studentName, studentEmail, planType, selectedDay, paymentMethod } = req.body as {
    studentName?: string;
    studentEmail?: string;
    planType?: 'single_day' | 'weekly_7days';
    selectedDay?: string;
    paymentMethod?: string;
  };

  const state = loadState();
  const groupClass = state.groupClasses.find((g) => g.id === id);
  if (!groupClass) {
    res.status(404).json({ error: 'الكلاس الجماعي غير موجود' });
    return;
  }
  if (groupClass.enrolledCount >= groupClass.maxSeats) {
    res.status(409).json({ error: 'اكتمل عدد المقاعد في هذا الكلاس الجماعي حالياً.' });
    return;
  }

  const resolvedPlan = planType === 'weekly_7days' ? 'weekly_7days' : 'single_day';
  const rawPrice =
    resolvedPlan === 'weekly_7days' ? groupClass.weeklyPassPrice : groupClass.groupPricePerSession;
  const pricing = calculateGroupPricing(rawPrice, state.activeClientTier);

  const targetStudent = studentName?.trim() || state.studentName;
  const resolvedStudentEmail = studentEmail?.trim() || 'client@mutamad.sa';
  const resolvedTutorEmail = `${groupClass.tutorId}@mutamad.sa`;
  const bookingId = `bk-grp-${Date.now().toString().slice(-4)}`;
  const slotLabel =
    resolvedPlan === 'weekly_7days'
      ? `يومياً طوال الأسبوع (الأحد - السبت) · ${groupClass.fixedTimeSlot}`
      : `${selectedDay || 'الجمعة'} · ${groupClass.fixedTimeSlot}`;

  const newBooking: Booking = {
    id: bookingId,
    tutorId: groupClass.tutorId,
    tutorName: groupClass.tutorName,
    studentName: targetStudent,
    studentEmail: resolvedStudentEmail,
    tutorEmail: resolvedTutorEmail,
    subject: groupClass.subject,
    learningTrack: groupClass.learningTrack,
    gradeLevel: groupClass.gradeLevel,
    bookingMode: 'group',
    groupClassId: groupClass.id,
    packageType: resolvedPlan === 'weekly_7days' ? 'weekly' : 'hourly',
    sessionsPerWeek: resolvedPlan === 'weekly_7days' ? 7 : 1,
    hoursCount: resolvedPlan === 'weekly_7days' ? 7 : 1,
    basePrice: pricing.basePrice,
    discountAmount: pricing.discountAmount,
    finalPrice: pricing.finalPrice,
    platformCommission: pricing.platformCommission,
    tutorNetEarnings: pricing.tutorNetEarnings,
    scheduledSlot: slotLabel,
    meetingPlatform: groupClass.meetingPlatform,
    meetingUrl: groupClass.meetingUrl,
    calendarInviteSent: true,
    status: 'confirmed',
    attendanceStatus: 'pending',
    sessionNotes: `حجز كلاس جماعي (${groupClass.title}) في الموعد الثابت ${groupClass.fixedTimeSlot}`,
    createdAt: new Date().toISOString().slice(0, 10),
  };

  groupClass.enrolledCount += 1;
  if (!groupClass.enrolledStudents.includes(targetStudent)) {
    groupClass.enrolledStudents.push(targetStudent);
  }

  const tutor = state.tutors.find((t) => t.id === groupClass.tutorId);
  if (tutor) {
    tutor.bookingsCount += 1;
  }

  state.bookings.unshift(newBooking);
  state.transactions.unshift({
    id: `pay-${Date.now().toString().slice(-4)}`,
    bookingId,
    tutorName: groupClass.tutorName,
    studentName: targetStudent,
    amount: pricing.finalPrice,
    commissionFee: pricing.platformCommission,
    netToTutor: pricing.tutorNetEarnings,
    method: paymentMethod || 'مدى / Apple Pay',
    status: 'مكتمل',
    date: new Date().toISOString().slice(0, 10),
    description:
      resolvedPlan === 'weekly_7days'
        ? `اشتراك كلاس جماعي طوال الأسبوع (7 أيام · ${groupClass.fixedTimeSlot}) - ${groupClass.subject}`
        : `مقعد كلاس جماعي (${selectedDay || 'الجمعة'} · ${groupClass.fixedTimeSlot}) - ${groupClass.subject}`,
  });

  state.notifications.unshift(
    {
      id: `not-${Date.now()}-gs`,
      targetRole: 'student',
      title: 'تم حجز مقعدك في الكلاس الجماعي',
      message: `تم تسجيل ${targetStudent} في "${groupClass.title}" (${slotLabel}) بتكلفة مخفّضة ${pricing.finalPrice.toFixed(
        0
      )} ر.س.`,
      time: 'الآن',
      read: false,
    },
    {
      id: `not-${Date.now()}-gt`,
      targetRole: 'tutor',
      title: 'طالب جديد في الكلاس الجماعي',
      message: `انضم ${targetStudent} إلى كلاس "${groupClass.title}" (${groupClass.enrolledCount}/${groupClass.maxSeats} مقعد).`,
      time: 'الآن',
      read: false,
    }
  );

  saveState(state);
  res.status(201).json({ booking: newBooking, groupClass, state });
});

// Tutor creates a new daily group class at one of the 3 fixed daily times
app.post('/api/group-classes', (req, res) => {
  const {
    tutorId,
    title,
    subject,
    learningTrack,
    gradeLevel,
    fixedTimeSlot,
    groupPricePerSession,
    maxSeats,
    meetingPlatform,
    description,
  } = req.body as {
    tutorId: string;
    title: string;
    subject?: string;
    learningTrack?: LearningTrack;
    gradeLevel?: string;
    fixedTimeSlot: GroupFixedSlotTime;
    groupPricePerSession: number;
    maxSeats?: number;
    meetingPlatform?: MeetingPlatform;
    description?: string;
  };

  if (!tutorId || !title?.trim() || !['4:00 م', '7:00 م', '9:30 م'].includes(fixedTimeSlot)) {
    res.status(400).json({ error: 'يرجى تحديد المدرس وعنوان الكلاس وأحد المواعيد الثابتة الثلاثة.' });
    return;
  }

  const state = loadState();
  const tutor = state.tutors.find((t) => t.id === tutorId && t.verificationStatus === 'verified');
  if (!tutor) {
    res.status(404).json({ error: 'المدرس غير موجود أو غير معتمد' });
    return;
  }

  const price = Math.max(25, Math.min(tutor.hourlyRate - 10, Number(groupPricePerSession) || 49));
  const seats = Math.max(5, Math.min(30, Number(maxSeats) || 15));
  const platform: MeetingPlatform = meetingPlatform === 'classroom' ? 'classroom' : 'teams';
  const id = `grp-${Date.now().toString().slice(-4)}`;

  const newGroupClass: GroupClassSession = {
    id,
    title: title.trim(),
    subject: subject?.trim() || tutor.subject,
    learningTrack: learningTrack || tutor.learningTracks[0] || 'المراحل الدراسية',
    gradeLevel: gradeLevel || tutor.gradeLevels[0] || 'المرحلة الثانوية',
    tutorId: tutor.id,
    tutorName: tutor.name,
    tutorLicenseId: tutor.ministryLicenseId,
    fixedTimeSlot,
    scheduleLabel: 'يومياً طوال الأسبوع (الأحد - السبت)',
    privateHourlyRate: tutor.hourlyRate,
    groupPricePerSession: price,
    weeklyPassPrice: Number((price * 6).toFixed(0)),
    maxSeats: seats,
    enrolledCount: 0,
    enrolledStudents: [],
    meetingPlatform: platform,
    meetingUrl: generateMeetingUrl(platform, id),
    description:
      description?.trim() ||
      `كلاس جماعي يومي بسعر اقتصادي (${price} ر.س) في الموعد الثابت ${fixedTimeSlot} طوال أيام الأسبوع.`,
  };

  state.groupClasses.unshift(newGroupClass);
  saveState(state);
  res.status(201).json({ groupClass: newGroupClass, state });
});

// Update booking attendance, notes, student rating by tutor, or status
app.patch('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const { attendanceStatus, sessionNotes, status, studentRatingByTutor } =
    req.body as Partial<Booking>;
  const state = loadState();
  const booking = state.bookings.find((b) => b.id === id);
  if (!booking) {
    res.status(404).json({ error: 'الحجز غير موجود' });
    return;
  }

  if (attendanceStatus) booking.attendanceStatus = attendanceStatus;
  if (typeof sessionNotes === 'string') booking.sessionNotes = sessionNotes;
  if (status) booking.status = status;
  if (typeof studentRatingByTutor === 'number') {
    booking.studentRatingByTutor = studentRatingByTutor;
  }

  saveState(state);
  res.json({ booking, state });
});

// Tutor withdraws available wallet balance
app.post('/api/tutors/:id/withdraw', (req, res) => {
  const { id } = req.params;
  const state = loadState();
  const tutor = state.tutors.find((t) => t.id === id);
  if (!tutor) {
    res.status(404).json({ error: 'المدرس غير موجود' });
    return;
  }
  const totalNet = state.bookings
    .filter((b) => b.tutorId === id)
    .reduce((sum, b) => sum + b.tutorNetEarnings, 0);
  const withdrawn = tutor.walletWithdrawn ?? 0;
  const available = Number(Math.max(0, totalNet - withdrawn).toFixed(2));
  if (available <= 0) {
    res.status(400).json({ error: 'لا يوجد رصيد متاح للسحب حالياً' });
    return;
  }
  tutor.walletWithdrawn = Number((withdrawn + available).toFixed(2));
  saveState(state);
  res.json({ withdrawnAmount: available, state });
});

// Tutor updates availability calendar slots & daily capacity
app.patch('/api/tutors/:id/availability', (req, res) => {
  const { id } = req.params;
  const { availableSlots, dailyCapacityHours } = req.body as {
    availableSlots: string[];
    dailyCapacityHours?: number;
  };
  const state = loadState();
  const tutor = state.tutors.find((t) => t.id === id);
  if (!tutor) {
    res.status(404).json({ error: 'المدرس غير موجود' });
    return;
  }

  const bookedSlots = new Set(
    state.bookings
      .filter((b) => b.tutorId === id && b.status === 'confirmed')
      .map((b) => b.scheduledSlot)
  );
  tutor.availableSlots = (availableSlots || []).filter((slot) => !bookedSlots.has(slot));
  if (typeof dailyCapacityHours === 'number' && dailyCapacityHours > 0) {
    tutor.dailyCapacityHours = dailyCapacityHours;
  }
  saveState(state);
  res.json({ tutor, state });
});

// Create homework / assignment
app.post('/api/assignments', (req, res) => {
  const { bookingId, title, description, fileName, dueDate } = req.body as {
    bookingId: string;
    title: string;
    description: string;
    fileName: string;
    dueDate: string;
  };
  const state = loadState();
  const booking = state.bookings.find((b) => b.id === bookingId);
  if (!booking) {
    res.status(404).json({ error: 'الجلسة غير موجودة' });
    return;
  }

  const assignment: Assignment = {
    id: `asg-${Date.now().toString().slice(-4)}`,
    bookingId: booking.id,
    tutorId: booking.tutorId,
    tutorName: booking.tutorName,
    studentName: booking.studentName,
    subject: booking.subject,
    title,
    description,
    fileName: fileName || 'worksheet_attachment.pdf',
    dueDate: dueDate || '2026-11-25',
    status: 'assigned',
  };

  state.assignments.unshift(assignment);
  state.notifications.unshift({
    id: `not-${Date.now()}-asg`,
    targetRole: 'student',
    title: 'تم إسناد واجب جديد',
    message: `أضاف ${booking.tutorName} واجباً جديداً: ${title}`,
    time: 'الآن',
    read: false,
  });

  saveState(state);
  res.status(201).json({ assignment, state });
});

// Submit or grade assignment
app.patch('/api/assignments/:id', (req, res) => {
  const { id } = req.params;
  const { status, grade, studentSubmissionNote, submittedFileName } = req.body as Partial<Assignment>;
  const state = loadState();
  const assignment = state.assignments.find((a) => a.id === id);
  if (!assignment) {
    res.status(404).json({ error: 'الواجب غير موجود' });
    return;
  }

  if (status) assignment.status = status;
  if (grade) assignment.grade = grade;
  if (studentSubmissionNote) assignment.studentSubmissionNote = studentSubmissionNote;
  if (submittedFileName) assignment.submittedFileName = submittedFileName;

  saveState(state);
  res.json({ assignment, state });
});

// Post a student review & recalculate tutor rating
app.post('/api/reviews', (req, res) => {
  const { tutorId, studentName, rating, comment } = req.body as {
    tutorId: string;
    studentName: string;
    rating: number;
    comment: string;
  };
  const state = loadState();
  const tutor = state.tutors.find((t) => t.id === tutorId);
  if (!tutor) {
    res.status(404).json({ error: 'المدرس غير موجود' });
    return;
  }

  const newReview: Review = {
    id: `rev-${Date.now().toString().slice(-4)}`,
    tutorId,
    studentName: studentName || state.studentName,
    rating: Math.max(1, Math.min(5, Number(rating) || 5)),
    comment,
    date: new Date().toISOString().slice(0, 10),
  };

  state.reviews.unshift(newReview);
  const tutorReviews = state.reviews.filter((r) => r.tutorId === tutorId);
  const avg = tutorReviews.reduce((acc, r) => acc + r.rating, 0) / Math.max(1, tutorReviews.length);
  tutor.rating = Number(avg.toFixed(1));
  tutor.reviewCount += 1;

  saveState(state);
  res.status(201).json({ review: newReview, state });
});

// Report abuse (Admin review)
app.post('/api/reports', (req, res) => {
  const { reporterName, targetName, reason } = req.body as {
    reporterName: string;
    targetName: string;
    reason: string;
  };
  if (!targetName || !reason?.trim()) {
    res.status(400).json({ error: 'يرجى تحديد المدرس وسبب البلاغ' });
    return;
  }
  const state = loadState();
  state.reports.unshift({
    id: `rep-${Date.now().toString().slice(-4)}`,
    reporterName: reporterName || state.studentName,
    targetName,
    reason: reason.trim(),
    date: new Date().toISOString().slice(0, 10),
    status: 'open',
  });
  saveState(state);
  res.status(201).json({ state });
});

app.patch('/api/reports/:id', (req, res) => {
  const { id } = req.params;
  const state = loadState();
  const rep = state.reports.find((r) => r.id === id);
  if (rep) {
    rep.status = 'resolved';
    saveState(state);
  }
  res.json({ state });
});

// Free initial tutor registration & certification submission
app.post('/api/tutors/apply', (req, res) => {
  const {
    name,
    gender,
    city,
    nationality,
    university,
    subject,
    curriculum,
    learningTracks,
    gradeLevels,
    languages,
    hourlyRate,
    dailyCapacityHours,
    licenseNumber,
    universityDegree,
    bankIban,
    experienceYears,
    certificateFileName,
    uploadedFiles,
    agreementSigned,
    signatureDataUrl,
    fromOnboarding,
  } = req.body as Partial<TutorApplication> & { fromOnboarding?: boolean };

  if (!name || !subject || !licenseNumber || !universityDegree) {
    res.status(400).json({ error: 'يرجى تعبئة الاسم، المادة، رقم الرخصة، والمؤهل الجامعي.' });
    return;
  }
  if (fromOnboarding && !agreementSigned) {
    res.status(400).json({ error: 'يرجى قراءة وتوقيع اتفاقية المدرس المعتمدة للمتابعة.' });
    return;
  }

  const validTracks: LearningTrack[] =
    Array.isArray(learningTracks) && learningTracks.length > 0
      ? learningTracks
      : ['المراحل الدراسية'];

  const derivedGrades = gradeLevels?.length
    ? gradeLevels
    : [
        ...(validTracks.includes('المراحل الدراسية')
          ? ['المرحلة الثانوية', 'المرحلة المتوسطة']
          : []),
        ...(validTracks.includes('المرحلة الجامعية') ? ['المسار الجامعي'] : []),
        ...(validTracks.includes('قياس') ? ['تأهيل قياس'] : []),
      ];

  const state = loadState();
  const application: TutorApplication = {
    id: `app-${Date.now().toString().slice(-4)}`,
    name,
    gender: gender || 'ذكر',
    city: city || 'الرياض',
    nationality: nationality || 'سعودي',
    university: university || 'جامعة سعودية معتمدة',
    subject,
    curriculum: curriculum || 'المنهج السعودي',
    learningTracks: validTracks,
    gradeLevels: derivedGrades,
    languages: languages?.length ? languages : ['العربية'],
    hourlyRate: Number(hourlyRate) || 135,
    dailyCapacityHours: Number(dailyCapacityHours) || 5,
    licenseNumber,
    universityDegree,
    bankIban: bankIban || 'SA0000000000000000000000',
    experienceYears: Number(experienceYears) || 4,
    certificateFileName:
      certificateFileName || uploadedFiles?.[0] || 'teaching_certificate.pdf',
    uploadedFiles: uploadedFiles?.length
      ? uploadedFiles
      : [certificateFileName || 'teaching_certificate.pdf'],
    agreementSigned: Boolean(agreementSigned ?? true),
    agreementSignedAt: new Date().toISOString().slice(0, 10),
    signatureDataUrl,
    status: 'pending',
    submittedAt: new Date().toISOString().slice(0, 10),
  };

  state.applications.unshift(application);
  if (fromOnboarding) {
    state.activeUser = {
      role: 'tutor',
      fullName: name,
      email: `${application.id}@mutamad.sa`,
      city: city || 'الرياض',
      preferredTrack: validTracks[0],
      signedIn: true,
    };
  }
  saveState(state);
  res.status(201).json({ application, state });
});

// Verify or reject a tutor certification application
app.patch('/api/applications/:id', (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: 'approved' | 'rejected' };
  const state = loadState();
  const appRecord = state.applications.find((a) => a.id === id);
  if (!appRecord) {
    res.status(404).json({ error: 'الطلب غير موجود' });
    return;
  }

  appRecord.status = status;
  if (status === 'approved') {
    const exists = state.tutors.some((t) => t.ministryLicenseId === appRecord.licenseNumber);
    if (!exists) {
      const tracks: LearningTrack[] =
        appRecord.learningTracks?.length ? appRecord.learningTracks : ['المراحل الدراسية'];
      const newTutor: Tutor = {
        id: `t-${Date.now().toString().slice(-4)}`,
        name: appRecord.name,
        avatar: '',
        gender: appRecord.gender,
        city: appRecord.city || 'الرياض',
        nationality: appRecord.nationality || 'سعودي',
        university: appRecord.university || 'جامعة معتمدة',
        subject: appRecord.subject,
        subjects: [appRecord.subject],
        learningTracks: tracks,
        gradeLevels: appRecord.gradeLevels,
        curriculum: appRecord.curriculum,
        languages: appRecord.languages,
        hourlyRate: appRecord.hourlyRate,
        dailyCapacityHours: appRecord.dailyCapacityHours || 5,
        bio: `مدرس معتمد متخصص في ${appRecord.subject} (${tracks.join('، ')})، حاصل على ${appRecord.universityDegree}.`,
        ministryLicenseId: appRecord.licenseNumber,
        verificationStatus: 'verified',
        certificates: [appRecord.universityDegree, `اعتماد وزارة التعليم (${appRecord.licenseNumber})`],
        rating: 5.0,
        reviewCount: 1,
        availableSlots: [
          'الأحد 5:00 م',
          'الإثنين 6:00 م',
          'الأربعاء 5:30 م',
          'الخميس 4:30 م',
          'الجمعة 5:00 م',
          'السبت 4:00 م',
        ],
        bookingsCount: 0,
        experienceYears: appRecord.experienceYears,
        universityLevel: tracks.includes('المرحلة الجامعية'),
        walletWithdrawn: 0,
      };
      state.tutors.unshift(newTutor);
    }
  }

  saveState(state);
  res.json({ application: appRecord, state });
});

// Mark notifications read
app.patch('/api/notifications/read', (req, res) => {
  const { role } = req.body as { role?: 'student' | 'tutor' };
  const state = loadState();
  state.notifications = state.notifications.map((n) =>
    !role || n.targetRole === role ? { ...n, read: true } : n
  );
  saveState(state);
  res.json({ notifications: state.notifications });
});

// AI Endpoint 1: Recommend Tutors Based on Learning Goals
app.post('/api/ai/recommend-tutors', async (req, res) => {
  const {
    learningGoal,
    selectedTrack,
    gradeLevel,
    curriculum,
    preferredGender,
    preferredLanguage,
  } = req.body as {
    learningGoal: string;
    selectedTrack?: string;
    gradeLevel?: string;
    curriculum?: string;
    preferredGender?: string;
    preferredLanguage?: string;
  };

  if (!learningGoal?.trim()) {
    res.status(400).json({ error: 'يرجى كتابة الهدف التعليمي للحصول على توصية ذكية.' });
    return;
  }

  const ai = getAiClient();
  if (!ai) {
    res.status(503).json({
      error: 'مفتاح GEMINI_API_KEY غير مهيأ على الخادم. يرجى التحقق من إعدادات Secrets.',
    });
    return;
  }

  const state = loadState();
  const catalogSummary = state.tutors
    .filter((t) => t.verificationStatus === 'verified' && t.availableSlots.length > 0)
    .map((t) => ({
      id: t.id,
      name: t.name,
      gender: t.gender,
      city: t.city,
      subject: t.subject,
      subjects: t.subjects,
      learningTracks: t.learningTracks,
      gradeLevels: t.gradeLevels,
      curriculum: t.curriculum,
      languages: t.languages,
      hourlyRate: t.hourlyRate,
      rating: t.rating,
      availableSlots: t.availableSlots,
    }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `أنت مستشار تعليمي ذكي في منصة "مُعتمَد" للدروس الخصوصية.
المسار التعليمي المختار: "${selectedTrack || 'الكل'}"
هدف الطالب التعليمي: "${learningGoal}"
المرحلة: "${gradeLevel || 'غير محدد'}"
المنهج: "${curriculum || 'غير محدد'}"
الجنس المفضل للمدرس: "${preferredGender || 'الكل'}"
اللغة المفضلة: "${preferredLanguage || 'الكل'}"

قائمة المدرسين المعتمدين المتاحين حالياً:
${JSON.stringify(catalogSummary, null, 2)}

اختر أفضل 2 إلى 3 مدرسين من القائمة أعلاه يتناسبون مع هدف الطالب وأوقاتهم المتاحة، واقترح الباقة الأنسب (hourly, weekly, monthly, semester) وأحد المواعيد المتاحة فعلياً في availableSlots الخاصة بالمدرس.`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tutorId: { type: Type.STRING },
                  tutorName: { type: Type.STRING },
                  matchScore: { type: Type.NUMBER },
                  reason: { type: Type.STRING },
                  recommendedPackage: { type: Type.STRING },
                  suggestedSlot: { type: Type.STRING },
                  studyFocus: { type: Type.STRING },
                },
                required: [
                  'tutorId',
                  'tutorName',
                  'matchScore',
                  'reason',
                  'recommendedPackage',
                  'suggestedSlot',
                  'studyFocus',
                ],
              },
            },
          },
          required: ['recommendations'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'تعذر الاتصال بمحرك الذكاء الاصطناعي';
    res.status(500).json({ error: message });
  }
});

// AI Endpoint 2: Auto Schedule Optimization, Remaining Availability & Demand Prediction
app.post('/api/ai/optimize-schedule', async (req, res) => {
  const { tutorId } = req.body as { tutorId: string };
  const ai = getAiClient();
  if (!ai) {
    res.status(503).json({
      error: 'مفتاح GEMINI_API_KEY غير مهيأ على الخادم. يرجى التحقق من إعدادات Secrets.',
    });
    return;
  }

  const state = loadState();
  const tutor = state.tutors.find((t) => t.id === tutorId);
  if (!tutor) {
    res.status(404).json({ error: 'المدرس غير موجود' });
    return;
  }

  const tutorBookings = state.bookings.filter((b) => b.tutorId === tutorId);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `حلل جدول المدرس التالي في منصة دروس خصوصية سعودية وخليجية واقترح تحسين الجدول، اكتشاف الأوقات المتبقية، والتنبؤ بالطلب:
المدرس: ${tutor.name} (${tutor.subject} - ${tutor.curriculum})
الحد اليومي المستهدف للمدرس: ${tutor.dailyCapacityHours} ساعات يومياً
الأوقات المتاحة المفتوحة حالياً: ${JSON.stringify(tutor.availableSlots)}
الحجوزات الحالية: ${JSON.stringify(
        tutorBookings.map((b) => ({
          slot: b.scheduledSlot,
          status: b.status,
          packageType: b.packageType,
          hoursCount: b.hoursCount,
        }))
      )}
إجمالي الحجوزات السابقة: ${tutor.bookingsCount}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            remainingCapacityHours: { type: Type.NUMBER },
            detectedGaps: { type: Type.ARRAY, items: { type: Type.STRING } },
            highDemandWindows: { type: Type.ARRAY, items: { type: Type.STRING } },
            demandForecastSummary: { type: Type.STRING },
            recommendedActions: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: [
            'remainingCapacityHours',
            'detectedGaps',
            'highDemandWindows',
            'demandForecastSummary',
            'recommendedActions',
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'تعذر تحليل الجدول بالذكاء الاصطناعي';
    res.status(500).json({ error: message });
  }
});

// AI Endpoint 3: Student & Family Performance Insights
app.post('/api/ai/performance-insights', async (_req, res) => {
  const ai = getAiClient();
  if (!ai) {
    res.status(503).json({
      error: 'مفتاح GEMINI_API_KEY غير مهيأ على الخادم. يرجى التحقق من إعدادات Secrets.',
    });
    return;
  }

  const state = loadState();
  const studentBookings = state.bookings.filter((b) => b.studentName === state.studentName);
  const studentAssignments = state.assignments.filter((a) => a.studentName === state.studentName);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `أنشئ تحليلاً تعليمياً موجزاً ودقيقاً باللغة العربية لأداء الطالب "${state.studentName}" (فئة الحساب: ${state.activeClientTier}):
الحصص والملاحظات: ${JSON.stringify(
        studentBookings.map((b) => ({
          subject: b.subject,
          status: b.status,
          attendance: b.attendanceStatus,
          notes: b.sessionNotes,
        }))
      )}
الواجبات والدرجات: ${JSON.stringify(
        studentAssignments.map((a) => ({
          subject: a.subject,
          title: a.title,
          status: a.status,
          grade: a.grade,
        }))
      )}`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallSummary: { type: Type.STRING },
            attendanceRateLabel: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            familyReportNote: { type: Type.STRING },
          },
          required: ['overallSummary', 'attendanceRateLabel', 'strengths', 'nextSteps', 'familyReportNote'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    res.json(parsed);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'تعذر توليد مؤشرات الأداء';
    res.status(500).json({ error: message });
  }
});

// AI Endpoint 4: Post-Session Lesson Summary, Homework, Weak Points, Next Plan & Parent Report
app.post('/api/ai/session-report', async (req, res) => {
  const { bookingId, lessonTranscriptOrNotes } = req.body as {
    bookingId: string;
    lessonTranscriptOrNotes: string;
  };
  const ai = getAiClient();
  if (!ai) {
    res.status(503).json({
      error: 'مفتاح GEMINI_API_KEY غير مهيأ على الخادم. يرجى التحقق من إعدادات Secrets.',
    });
    return;
  }

  const state = loadState();
  const booking = state.bookings.find((b) => b.id === bookingId);
  if (!booking) {
    res.status(404).json({ error: 'الحصة غير موجودة' });
    return;
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: `بناءً على موافقة الطالب والمدرس على تلخيص الحصة، ولّد تقريراً تعليمياً متكاملاً بعد نهاية الحصة:
المادة: ${booking.subject}
المرحلة: ${booking.gradeLevel}
الطالب: ${booking.studentName}
المدرس: ${booking.tutorName}
محتوى الشرح والسبورة: "${lessonTranscriptOrNotes || booking.sessionNotes || 'شرح المفاهيم الأساسية وحل تمارين تطبيقية'}"`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            homework: { type: Type.STRING },
            weakPoints: { type: Type.STRING },
            nextPlan: { type: Type.STRING },
            parentReport: { type: Type.STRING },
          },
          required: ['summary', 'homework', 'weakPoints', 'nextPlan', 'parentReport'],
        },
      },
    });

    const parsed = JSON.parse((response.text ?? '{}').trim());
    booking.aiReport = {
      ...parsed,
      generatedAt: new Date().toISOString().slice(0, 10),
    };
    booking.status = 'completed';
    if (booking.attendanceStatus === 'pending') {
      booking.attendanceStatus = 'present';
    }
    state.notifications.unshift({
      id: `not-${Date.now()}-rep`,
      targetRole: 'student',
      title: 'ملخص الحصة وتقرير ولي الأمر جاهز',
      message: `تم توليد ملخص حصة ${booking.subject} مع خطة الحصة القادمة وتقرير ولي الأمر.`,
      time: 'الآن',
      read: false,
    });

    saveState(state);
    res.json({ aiReport: booking.aiReport, state });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'تعذر توليد ملخص الحصة';
    res.status(500).json({ error: message });
  }
});

// AI Endpoint 5: Persistent Floating Assistant with Real Gemini Function Calling
app.post('/api/ai/assistant', async (req, res) => {
  const { messages, currentPage } = req.body as {
    messages?: { role: 'user' | 'model'; text: string }[];
    currentPage?: string;
  };

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'يرجى كتابة سؤالك أو طلبك أولاً.' });
    return;
  }

  const ai = getAiClient();
  if (!ai) {
    res.status(503).json({
      error: 'مفتاح GEMINI_API_KEY غير مهيأ على الخادم. يرجى التحقق من إعدادات Secrets.',
    });
    return;
  }

  const assistantTools: FunctionDeclaration[] = [
    {
      name: 'get_platform_catalog_and_pricing',
      description:
        'جلب البيانات الحية للمدرسين المعتمدين، الكلاسات الجماعية اليومية (18 كلاساً لكل المواد في 3 مواعيد ثابتة طوال الأسبوع)، الباقات والخصومات، وبيانات الطالب/الأسرة الحالية.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          subjectFilter: {
            type: Type.STRING,
            description: 'اختياري: تصفية باسم المادة مثل الرياضيات أو الفيزياء أو اللغة الإنجليزية',
          },
        },
      },
    },
    {
      name: 'calculate_cost_estimate',
      description:
        'حساب التكلفة الدقيقة بالريال السعودي شاملة خصم الباقة وخصم فئة الحساب (Regular/Premium/Elite) وعمولة المنصة 10% ومقدار التوفير.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          mode: {
            type: Type.STRING,
            description: 'إما private للدرس الفردي أو group للكلاس الجماعي',
          },
          tutorId: {
            type: Type.STRING,
            description: 'معرف المدرس في حال mode=private مثل t-101',
          },
          packageType: {
            type: Type.STRING,
            description: 'hourly | weekly | custom | monthly | semester',
          },
          groupClassId: {
            type: Type.STRING,
            description: 'معرف الكلاس الجماعي في حال mode=group مثل grp-math-1',
          },
          groupPlanType: {
            type: Type.STRING,
            description: 'single_day (يوم واحد) أو weekly_7days (7 أيام متواصلة)',
          },
        },
        required: ['mode'],
      },
    },
    {
      name: 'book_private_session',
      description:
        'تنفيذ حجز حقيقي لدرس فردي مع مدرس معتمد بعد التأكد من توفر الموعد وعدم التعارض، وإنشاء سجل الحجز والدفع والتنبيهات.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          tutorId: { type: Type.STRING, description: 'معرف المدرس مثل t-101' },
          scheduledSlot: {
            type: Type.STRING,
            description: 'الموعد المختار من availableSlots للمدرس مثل الجمعة 5:00 م',
          },
          packageType: {
            type: Type.STRING,
            description: 'hourly | weekly | custom | monthly | semester (الافتراضي hourly)',
          },
          studentName: {
            type: Type.STRING,
            description: 'اختياري: اسم الطالب (الافتراضي الطالب النشط حالياً)',
          },
          meetingPlatform: {
            type: Type.STRING,
            description: 'teams أو classroom (الافتراضي teams)',
          },
          paymentMethod: {
            type: Type.STRING,
            description: 'مدى / Apple Pay أو STC Pay أو بطاقة ائتمانية',
          },
        },
        required: ['tutorId', 'scheduledSlot'],
      },
    },
    {
      name: 'enroll_group_class',
      description:
        'تنفيذ تسجيل وحجز مقعد حقيقي في أحد الكلاسات الجماعية اليومية (الأوفر سعراً، 3 أوقات ثابتة 4:00 م أو 7:00 م أو 9:30 م طوال أيام الأسبوع).',
      parameters: {
        type: Type.OBJECT,
        properties: {
          groupClassId: {
            type: Type.STRING,
            description: 'معرف الكلاس الجماعي مثل grp-math-1 أو grp-eng-2',
          },
          planType: {
            type: Type.STRING,
            description: 'single_day لحجز يوم واحد، أو weekly_7days لاشتراك 7 أيام متواصلة',
          },
          selectedDay: {
            type: Type.STRING,
            description: 'اليوم في حال single_day مثل الأحد، الإثنين، الثلاثاء، الأربعاء، الخميس، الجمعة، السبت',
          },
          studentName: {
            type: Type.STRING,
            description: 'اختياري: اسم الطالب (الافتراضي الطالب النشط حالياً)',
          },
          paymentMethod: {
            type: Type.STRING,
            description: 'مدى / Apple Pay أو STC Pay أو بطاقة ائتمانية',
          },
        },
        required: ['groupClassId', 'planType'],
      },
    },
    {
      name: 'switch_student_or_tier',
      description:
        'تغيير الطالب النشط من أبناء الأسرة أو تغيير فئة الحساب (Regular/Premium/Elite) أو تغيير المسار التعليمي.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          studentName: { type: Type.STRING, description: 'اسم الطالب أو الابن المراد التبديل إليه' },
          clientTier: { type: Type.STRING, description: 'Regular | Premium | Elite' },
          preferredTrack: {
            type: Type.STRING,
            description: 'المراحل الدراسية | قياس | المرحلة الجامعية',
          },
        },
      },
    },
    {
      name: 'navigate_to_page',
      description:
        'الانتقال بواجهة المستخدم إلى إحدى صفحات المنصة الخمس عند طلب المستخدم فتح صفحة معينة.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          targetTab: {
            type: Type.STRING,
            description: 'search | auth | student | tutor | roadmap',
          },
        },
        required: ['targetTab'],
      },
    },
  ];

  type ExecutedAction = {
    type: 'booked_private' | 'enrolled_group' | 'switched_profile' | 'calculated_cost' | 'navigated';
    title: string;
    detail: string;
    bookingId?: string;
    finalPrice?: number;
    targetTab?: 'search' | 'auth' | 'student' | 'tutor' | 'roadmap';
  };

  const executedActions: ExecutedAction[] = [];
  let stateMutated = false;
  let navigateTo: 'search' | 'auth' | 'student' | 'tutor' | 'roadmap' | undefined;

  const runToolCall = (name: string, args: Record<string, unknown>) => {
    const state = loadState();

    if (name === 'get_platform_catalog_and_pricing') {
      const filter = typeof args.subjectFilter === 'string' ? args.subjectFilter.trim() : '';
      const tutorsList = state.tutors
        .filter((t) => t.verificationStatus === 'verified')
        .filter((t) => !filter || t.subject.includes(filter) || t.subjects.some((s) => s.includes(filter)))
        .map((t) => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          subjects: t.subjects,
          learningTracks: t.learningTracks,
          city: t.city,
          hourlyRate: t.hourlyRate,
          rating: t.rating,
          availableSlots: t.availableSlots,
        }));

      const groupsList = state.groupClasses
        .filter((g) => !filter || g.subject.includes(filter) || g.title.includes(filter))
        .map((g) => ({
          id: g.id,
          title: g.title,
          subject: g.subject,
          learningTrack: g.learningTrack,
          fixedTimeSlot: g.fixedTimeSlot,
          scheduleLabel: g.scheduleLabel,
          tutorName: g.tutorName,
          groupPricePerSession: g.groupPricePerSession,
          weeklyPassPrice: g.weeklyPassPrice,
          privateHourlyRate: g.privateHourlyRate,
          seatsLeft: Math.max(0, g.maxSeats - g.enrolledCount),
        }));

      return {
        activeStudent: state.studentName,
        childrenNames: state.childrenNames,
        activeClientTier: state.activeClientTier,
        currentBookingsCount: state.bookings.filter((b) => b.studentName === state.studentName).length,
        clientTierDiscounts: CLIENT_TIER_DISCOUNT,
        packageTiers: PACKAGE_CONFIG,
        verifiedTutors: tutorsList,
        dailyGroupClasses: groupsList,
      };
    }

    if (name === 'calculate_cost_estimate') {
      const mode = String(args.mode || 'group');
      if (mode === 'group') {
        const gc = state.groupClasses.find((g) => g.id === args.groupClassId);
        if (!gc) return { error: 'الكلاس الجماعي غير موجود' };
        const plan = args.groupPlanType === 'weekly_7days' ? 'weekly_7days' : 'single_day';
        const raw = plan === 'weekly_7days' ? gc.weeklyPassPrice : gc.groupPricePerSession;
        const pricing = calculateGroupPricing(raw, state.activeClientTier);
        const privateEq = plan === 'weekly_7days' ? gc.privateHourlyRate * 7 : gc.privateHourlyRate;
        const savingsPct = Math.round(((privateEq - pricing.finalPrice) / Math.max(1, privateEq)) * 100);
        executedActions.push({
          type: 'calculated_cost',
          title: `حساب تكلفة: ${gc.subject}`,
          detail: `${plan === 'weekly_7days' ? 'اشتراك 7 أيام' : 'حصة يوم واحد'} · ${pricing.finalPrice.toFixed(0)} ر.س (توفير ${savingsPct}%)`,
          finalPrice: pricing.finalPrice,
        });
        return {
          mode: 'group',
          groupClassTitle: gc.title,
          planType: plan,
          clientTier: state.activeClientTier,
          ...pricing,
          privateEquivalent: privateEq,
          savingsVsPrivatePct: savingsPct,
        };
      }

      const tutor = state.tutors.find((t) => t.id === args.tutorId);
      if (!tutor) return { error: 'المدرس غير موجود' };
      const pkg = (['hourly', 'weekly', 'custom', 'monthly', 'semester'].includes(String(args.packageType))
        ? args.packageType
        : 'hourly') as PackageTier;
      const pricing = calculatePackagePricing(tutor.hourlyRate, pkg, state.activeClientTier);
      executedActions.push({
        type: 'calculated_cost',
        title: `حساب تكلفة: ${tutor.name}`,
        detail: `${PACKAGE_CONFIG[pkg].label} · ${pricing.finalPrice.toFixed(0)} ر.س`,
        finalPrice: pricing.finalPrice,
      });
      return {
        mode: 'private',
        tutorName: tutor.name,
        hourlyRate: tutor.hourlyRate,
        packageType: pkg,
        packageLabel: PACKAGE_CONFIG[pkg].label,
        clientTier: state.activeClientTier,
        ...pricing,
      };
    }

    if (name === 'book_private_session') {
      const tutorId = String(args.tutorId || '');
      const scheduledSlot = String(args.scheduledSlot || '');
      const tutor = state.tutors.find((t) => t.id === tutorId);
      if (!tutor) return { error: 'لم يتم العثور على المدرس المطلوب.' };
      if (tutor.verificationStatus !== 'verified') {
        return { error: 'هذا المدرس غير معتمد حالياً.' };
      }
      if (tutor.availableSlots.length === 0) {
        return { error: 'هذا المدرس محجوز بالكامل حالياً (Fully Booked).' };
      }
      const matchedSlot = tutor.availableSlots.find((s) => s === scheduledSlot) || tutor.availableSlots[0];
      const conflict = state.bookings.find(
        (b) => b.tutorId === tutor.id && b.scheduledSlot === matchedSlot && b.status === 'confirmed'
      );
      if (conflict) {
        return { error: `الموعد (${matchedSlot}) محجوز مسبقاً. الأوقات المتاحة: ${tutor.availableSlots.join('، ')}` };
      }

      const pkg = (['hourly', 'weekly', 'custom', 'monthly', 'semester'].includes(String(args.packageType))
        ? args.packageType
        : 'hourly') as PackageTier;
      const platform: MeetingPlatform = args.meetingPlatform === 'classroom' ? 'classroom' : 'teams';
      const targetStudent =
        typeof args.studentName === 'string' && args.studentName.trim()
          ? args.studentName.trim()
          : state.studentName;
      const pricing = calculatePackagePricing(tutor.hourlyRate, pkg, state.activeClientTier);
      const bookingId = `bk-${Date.now().toString().slice(-4)}`;

      const newBooking: Booking = {
        id: bookingId,
        tutorId: tutor.id,
        tutorName: tutor.name,
        studentName: targetStudent,
        studentEmail: state.activeUser?.email || 'client@mutamad.sa',
        tutorEmail: `${tutor.id}@mutamad.sa`,
        subject: tutor.subject,
        learningTrack: tutor.learningTracks?.[0],
        gradeLevel: tutor.gradeLevels[0] || 'المرحلة الثانوية',
        bookingMode: 'private',
        packageType: pkg,
        sessionsPerWeek: pricing.sessionsPerWeek,
        hoursCount: pricing.hoursCount,
        basePrice: pricing.basePrice,
        discountAmount: pricing.discountAmount,
        finalPrice: pricing.finalPrice,
        platformCommission: pricing.platformCommission,
        tutorNetEarnings: pricing.tutorNetEarnings,
        scheduledSlot: matchedSlot,
        meetingPlatform: platform,
        meetingUrl: generateMeetingUrl(platform, bookingId),
        calendarInviteSent: true,
        status: 'confirmed',
        attendanceStatus: 'pending',
        sessionNotes: 'تم الحجز عبر المساعد الذكي مُعتمَد',
        createdAt: new Date().toISOString().slice(0, 10),
      };

      tutor.availableSlots = tutor.availableSlots.filter((s) => s !== matchedSlot);
      tutor.bookingsCount += 1;
      state.bookings.unshift(newBooking);
      state.transactions.unshift({
        id: `pay-${Date.now().toString().slice(-4)}`,
        bookingId,
        tutorName: tutor.name,
        studentName: targetStudent,
        amount: pricing.finalPrice,
        commissionFee: pricing.platformCommission,
        netToTutor: pricing.tutorNetEarnings,
        method: String(args.paymentMethod || 'مدى / Apple Pay'),
        status: 'مكتمل',
        date: new Date().toISOString().slice(0, 10),
        description: `حجز ${pricing.hoursCount} ساعة عبر المساعد الذكي - ${tutor.subject}`,
      });
      state.notifications.unshift({
        id: `not-${Date.now()}-ai-p`,
        targetRole: 'student',
        title: 'تم تأكيد حجزك عبر المساعد الذكي',
        message: `حجز ${targetStudent} مع ${tutor.name} (${matchedSlot}) بتكلفة ${pricing.finalPrice.toFixed(0)} ر.س.`,
        time: 'الآن',
        read: false,
      });
      saveState(state);
      stateMutated = true;
      executedActions.push({
        type: 'booked_private',
        title: `تم حجز درس فردي (${bookingId})`,
        detail: `${tutor.name} · ${matchedSlot} · ${pricing.finalPrice.toFixed(0)} ر.س`,
        bookingId,
        finalPrice: pricing.finalPrice,
        targetTab: 'student',
      });
      return { success: true, booking: newBooking };
    }

    if (name === 'enroll_group_class') {
      const groupClassId = String(args.groupClassId || '');
      const gc = state.groupClasses.find((g) => g.id === groupClassId);
      if (!gc) return { error: 'الكلاس الجماعي غير موجود.' };
      if (gc.enrolledCount >= gc.maxSeats) {
        return { error: 'عذراً، اكتملت مقاعد هذا الكلاس الجماعي حالياً.' };
      }

      const planType = args.planType === 'weekly_7days' ? 'weekly_7days' : 'single_day';
      const selectedDay = String(args.selectedDay || 'الجمعة');
      const rawPrice = planType === 'weekly_7days' ? gc.weeklyPassPrice : gc.groupPricePerSession;
      const pricing = calculateGroupPricing(rawPrice, state.activeClientTier);
      const targetStudent =
        typeof args.studentName === 'string' && args.studentName.trim()
          ? args.studentName.trim()
          : state.studentName;
      const bookingId = `bk-grp-${Date.now().toString().slice(-4)}`;
      const slotLabel =
        planType === 'weekly_7days'
          ? `يومياً طوال الأسبوع (الأحد - السبت) · ${gc.fixedTimeSlot}`
          : `${selectedDay} · ${gc.fixedTimeSlot}`;

      const newBooking: Booking = {
        id: bookingId,
        tutorId: gc.tutorId,
        tutorName: gc.tutorName,
        studentName: targetStudent,
        studentEmail: state.activeUser?.email || 'client@mutamad.sa',
        tutorEmail: `${gc.tutorId}@mutamad.sa`,
        subject: gc.subject,
        learningTrack: gc.learningTrack,
        gradeLevel: gc.gradeLevel,
        bookingMode: 'group',
        groupClassId: gc.id,
        packageType: planType === 'weekly_7days' ? 'weekly' : 'hourly',
        sessionsPerWeek: planType === 'weekly_7days' ? 7 : 1,
        hoursCount: planType === 'weekly_7days' ? 7 : 1,
        basePrice: pricing.basePrice,
        discountAmount: pricing.discountAmount,
        finalPrice: pricing.finalPrice,
        platformCommission: pricing.platformCommission,
        tutorNetEarnings: pricing.tutorNetEarnings,
        scheduledSlot: slotLabel,
        meetingPlatform: gc.meetingPlatform,
        meetingUrl: gc.meetingUrl,
        calendarInviteSent: true,
        status: 'confirmed',
        attendanceStatus: 'pending',
        sessionNotes: `تسجيل كلاس جماعي عبر المساعد الذكي (${gc.title})`,
        createdAt: new Date().toISOString().slice(0, 10),
      };

      gc.enrolledCount += 1;
      if (!gc.enrolledStudents.includes(targetStudent)) {
        gc.enrolledStudents.push(targetStudent);
      }
      const tutor = state.tutors.find((t) => t.id === gc.tutorId);
      if (tutor) tutor.bookingsCount += 1;

      state.bookings.unshift(newBooking);
      state.transactions.unshift({
        id: `pay-${Date.now().toString().slice(-4)}`,
        bookingId,
        tutorName: gc.tutorName,
        studentName: targetStudent,
        amount: pricing.finalPrice,
        commissionFee: pricing.platformCommission,
        netToTutor: pricing.tutorNetEarnings,
        method: String(args.paymentMethod || 'مدى / Apple Pay'),
        status: 'مكتمل',
        date: new Date().toISOString().slice(0, 10),
        description: `كلاس جماعي (${slotLabel}) - ${gc.subject}`,
      });
      state.notifications.unshift({
        id: `not-${Date.now()}-ai-g`,
        targetRole: 'student',
        title: 'تم حجز مقعدك في الكلاس الجماعي',
        message: `تم تسجيل ${targetStudent} في "${gc.title}" (${slotLabel}) بـ ${pricing.finalPrice.toFixed(0)} ر.س.`,
        time: 'الآن',
        read: false,
      });

      saveState(state);
      stateMutated = true;
      executedActions.push({
        type: 'enrolled_group',
        title: `تم حجز كلاس جماعي (${bookingId})`,
        detail: `${gc.subject} · ${slotLabel} · ${pricing.finalPrice.toFixed(0)} ر.س`,
        bookingId,
        finalPrice: pricing.finalPrice,
        targetTab: 'student',
      });
      return { success: true, booking: newBooking, seatsLeft: Math.max(0, gc.maxSeats - gc.enrolledCount) };
    }

    if (name === 'switch_student_or_tier') {
      const changes: string[] = [];
      if (typeof args.studentName === 'string' && args.studentName.trim()) {
        const nextChild = args.studentName.trim();
        state.studentName = nextChild;
        if (!state.childrenNames.includes(nextChild)) {
          state.childrenNames.push(nextChild);
        }
        changes.push(`الطالب: ${nextChild}`);
      }
      if (
        typeof args.clientTier === 'string' &&
        ['Regular', 'Premium', 'Elite'].includes(args.clientTier)
      ) {
        state.activeClientTier = args.clientTier as ClientTier;
        changes.push(`الفئة: ${args.clientTier}`);
      }
      if (
        typeof args.preferredTrack === 'string' &&
        ['المراحل الدراسية', 'قياس', 'المرحلة الجامعية'].includes(args.preferredTrack)
      ) {
        if (state.activeUser) {
          state.activeUser.preferredTrack = args.preferredTrack as LearningTrack;
        }
        changes.push(`المسار: ${args.preferredTrack}`);
      }
      saveState(state);
      stateMutated = true;
      executedActions.push({
        type: 'switched_profile',
        title: 'تم تحديث إعدادات الحساب',
        detail: changes.join(' · '),
      });
      return { success: true, studentName: state.studentName, activeClientTier: state.activeClientTier };
    }

    if (name === 'navigate_to_page') {
      const target = String(args.targetTab || 'search');
      if (['search', 'auth', 'student', 'tutor', 'roadmap'].includes(target)) {
        navigateTo = target as 'search' | 'auth' | 'student' | 'tutor' | 'roadmap';
        const labels: Record<string, string> = {
          search: 'صفحة البحث والكلاسات',
          auth: 'التسجيل والدخول',
          student: 'بوابة الطالب وولي الأمر',
          tutor: 'بوابة المدرس',
          roadmap: 'الاعتماد والخطط',
        };
        executedActions.push({
          type: 'navigated',
          title: `الانتقال إلى ${labels[target]}`,
          detail: 'تم فتح الصفحة المطلوبة',
          targetTab: navigateTo,
        });
        return { success: true, targetTab: navigateTo };
      }
      return { error: 'الصفحة غير معروفة' };
    }

    return { error: `أداة غير معروفة: ${name}` };
  };

  const stateSnapshot = loadState();
  const systemInstruction = `أنت المساعد الذكي الرسمي لمنصة "مُعتمَد" للتعليم الخصوصي والكلاسات الجماعية في السعودية والخليج.
مهمتك مساعدة الطلاب وأولياء الأمور والمدرسين بسرعة ووضوح ولطف باللغة العربية، والإجابة عن الأسئلة فوراً، وتنفيذ الأوامر الحقيقية (مثل حجز حصة فردية، التسجيل في كلاس جماعي، حساب التكاليف الدقيقة بالريال، تبديل الطالب أو فئة الخصم، أو فتح صفحة في المنصة) عبر الأدوات المتوفرة لك.

قواعد مهمة:
1. قبل أي إجابة عن أسعار أو مقاعد أو مدرسين أو تنفيذ حجز، استخدم أداة get_platform_catalog_and_pricing أو calculate_cost_estimate لتعطي أرقاماً حقيقية 100% من النظام.
2. الكلاسات الجماعية اليومية متاحة لكل المواد في 3 مواعيد ثابتة يومياً (4:00 م، 7:00 م، 9:30 م) طوال أيام الأسبوع السبعة (من الأحد إلى السبت شاملة الجمعة والسبت) وبسعر اقتصادي يبدأ من 39 ر.س للحصة (أو باقة 7 أيام متواصلة من 225 ر.س).
3. الحصص الفردية متاحة طوال الأسبوع أيضاً، بباقات: حصة فردية (hourly)، أسبوعية 3 حصص خصم 5% (weekly)، مخصصة 5 حصص خصم 8% (custom)، شهرية 12 حصة خصم 12% (monthly)، وفصلية 36 حصة خصم 20% (semester). فئات الحساب: Regular (0%)، Premium (10%)، Elite (15%). عمولة المنصة 10% وصافي المدرس 90%.
4. إذا طلب المستخدم حجز حصة أو كلاس بشكل واضح (مثلاً حدد المادة أو الموعد أو المدرس)، نفّذ الحجز فوراً عبر book_private_session أو enroll_group_class واذكر له رقم الحجز والموعد والتكلفة النهائية. أما إذا لم يحدد المادة أو النوع (جماعي أم فردي)، فاسأله باختصار مع عرض أقرب الخيارات وأسعارها.
5. اجعل ردودك مختصرة، منظمة، وعملية باللغة العربية. الصفحة المفتوحة حالياً للمستخدم: "${currentPage || 'search'}"، الطالب النشط: "${stateSnapshot.studentName}"، الفئة: "${stateSnapshot.activeClientTier}".`;

  const contents: Content[] = messages
    .filter((m) => m.text && m.text.trim().length > 0)
    .slice(-12)
    .map((m) => ({
      role: m.role === 'model' ? 'model' : 'user',
      parts: [{ text: m.text.trim() }],
    }));

  if (contents.length === 0 || contents[0].role !== 'user') {
    res.status(400).json({ error: 'يجب أن تبدأ المحادثة برسالة من المستخدم.' });
    return;
  }

  const generateWithRetry = async () => {
    const attempts: { model: string; useThinkingLow: boolean }[] = [
      { model: 'gemini-4-hydrogen', useThinkingLow: true },
      { model: 'gemini-4-hydrogen', useThinkingLow: true },
      { model: 'gemini-3.1-flash-lite', useThinkingLow: false },
    ];
    let lastErr: unknown;
    for (let i = 0; i < attempts.length; i++) {
      const { model, useThinkingLow } = attempts[i];
      try {
        return await ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            ...(useThinkingLow ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } : {}),
            tools: [{ functionDeclarations: assistantTools }],
          },
        });
      } catch (err: unknown) {
        lastErr = err;
        const msg = err instanceof Error ? err.message : String(err);
        const isTransient = msg.includes('503') || msg.includes('UNAVAILABLE') || msg.includes('429');
        if (!isTransient || i === attempts.length - 1) {
          throw err;
        }
        await new Promise((r) => setTimeout(r, 600 * (i + 1)));
      }
    }
    throw lastErr;
  };

  try {
    let finalReply = '';
    for (let step = 0; step < 5; step++) {
      const response = await generateWithRetry();

      const functionCalls = response.functionCalls;
      if (!functionCalls || functionCalls.length === 0) {
        finalReply = (response.text ?? '').trim();
        break;
      }

      const modelContent = response.candidates?.[0]?.content;
      if (modelContent) {
        contents.push(modelContent);
      }

      const responseParts: Part[] = functionCalls.map((call) => {
        const result = runToolCall(call.name || '', (call.args || {}) as Record<string, unknown>);
        return {
          functionResponse: {
            id: call.id,
            name: call.name,
            response: { result },
          },
        };
      });

      contents.push({
        role: 'user',
        parts: responseParts,
      });
    }

    if (!finalReply) {
      finalReply = executedActions.length
        ? 'تم تنفيذ طلبك بنجاح. يمكنك متابعة التفاصيل أدناه.'
        : 'كيف يمكنني مساعدتك اليوم في منصة مُعتمَد؟';
    }

    res.json({
      reply: finalReply,
      executedActions,
      stateMutated,
      navigateTo,
    });
  } catch (err: unknown) {
    const rawMsg = err instanceof Error ? err.message : 'تعذر الاتصال بالمساعد الذكي حالياً.';
    const isBusy = rawMsg.includes('503') || rawMsg.includes('UNAVAILABLE');
    const isQuota = rawMsg.includes('429') || rawMsg.includes('RESOURCE_EXHAUSTED');
    const status = isBusy ? 503 : isQuota ? 429 : 500;
    const friendlyMsg = isBusy
      ? 'خادم الذكاء الاصطناعي يشهد ضغطاً مؤقتاً الآن، يرجى إعادة الإرسال بعد ثوانٍ.'
      : isQuota
      ? 'تم تجاوز حد الطلبات المؤقت لمحرك الذكاء الاصطناعي، يرجى المحاولة بعد قليل أو مراجعة Settings > Secrets.'
      : rawMsg;
    res.status(status).json({ error: friendlyMsg });
  }
});

// Export Full Project Feasibility Study as PowerPoint (.pptx)
app.get('/api/export/study-pptx', async (_req, res) => {
  try {
    const buffer = await buildStudyPptxBuffer();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Mutamad_Feasibility_Study.pptx"'
    );
    res.setHeader('Content-Length', String(buffer.length));
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.send(buffer);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'تعذر إنشاء ملف البوربوينت';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  const PORT = Number(process.env.PORT) || 3000;

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
