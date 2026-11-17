import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  calculatePackagePricing,
  generateMeetingUrl,
  loadState,
  saveState,
} from './server/store.ts';
import type {
  Assignment,
  Booking,
  ClientTier,
  MeetingPlatform,
  PackageTier,
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

// Create a booking with conflict check, 10% commission, calendar invite & Teams/classroom URL
app.post('/api/bookings', (req, res) => {
  const {
    tutorId,
    studentName,
    gradeLevel,
    packageType,
    scheduledSlot,
    meetingPlatform,
    paymentMethod,
  } = req.body as {
    tutorId: string;
    studentName: string;
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
  const newBooking: Booking = {
    id: bookingId,
    tutorId: tutor.id,
    tutorName: tutor.name,
    studentName: studentName?.trim() || state.studentName,
    subject: tutor.subject,
    gradeLevel: gradeLevel || tutor.gradeLevels[0],
    packageType,
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
    studentName: newBooking.studentName,
    amount: pricing.finalPrice,
    commissionFee: pricing.platformCommission,
    netToTutor: pricing.tutorNetEarnings,
    method: paymentMethod || 'مدى / Apple Pay',
    status: 'مكتمل',
    date: new Date().toISOString().slice(0, 10),
    description: `حجز ${pricing.hoursCount} ساعة - ${tutor.subject}`,
  });

  state.notifications.unshift(
    {
      id: `not-${Date.now()}-s`,
      targetRole: 'student',
      title: 'تم تأكيد الحجز وإرسال دعوة التقويم',
      message: `تم حجز موعد ${scheduledSlot} مع ${tutor.name} عبر ${
        meetingPlatform === 'teams' ? 'Microsoft Teams' : 'الفصل الافتراضي المدمج'
      }.`,
      time: 'الآن',
      read: false,
    },
    {
      id: `not-${Date.now()}-t`,
      targetRole: 'tutor',
      title: 'حجز جديد مؤكد',
      message: `حجز الطالب ${newBooking.studentName} موعد ${scheduledSlot}. صافي أرباحك بعد عمولة المنصة (10%): ${pricing.tutorNetEarnings.toFixed(
        2
      )} ر.س.`,
      time: 'الآن',
      read: false,
    }
  );

  saveState(state);
  res.status(201).json({ booking: newBooking, state });
});

// Update booking attendance, notes, or completion status
app.patch('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const { attendanceStatus, sessionNotes, status } = req.body as Partial<Booking>;
  const state = loadState();
  const booking = state.bookings.find((b) => b.id === id);
  if (!booking) {
    res.status(404).json({ error: 'الحجز غير موجود' });
    return;
  }

  if (attendanceStatus) booking.attendanceStatus = attendanceStatus;
  if (typeof sessionNotes === 'string') booking.sessionNotes = sessionNotes;
  if (status) booking.status = status;

  saveState(state);
  res.json({ booking, state });
});

// Tutor updates availability calendar slots
app.patch('/api/tutors/:id/availability', (req, res) => {
  const { id } = req.params;
  const { availableSlots } = req.body as { availableSlots: string[] };
  const state = loadState();
  const tutor = state.tutors.find((t) => t.id === id);
  if (!tutor) {
    res.status(404).json({ error: 'المدرس غير موجود' });
    return;
  }

  // Filter out any slot already booked to guarantee zero conflicts
  const bookedSlots = new Set(
    state.bookings
      .filter((b) => b.tutorId === id && b.status === 'confirmed')
      .map((b) => b.scheduledSlot)
  );
  tutor.availableSlots = (availableSlots || []).filter((slot) => !bookedSlots.has(slot));
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

// Free initial tutor registration & certification submission
app.post('/api/tutors/apply', (req, res) => {
  const {
    name,
    gender,
    subject,
    curriculum,
    gradeLevels,
    languages,
    hourlyRate,
    licenseNumber,
    universityDegree,
    experienceYears,
    certificateFileName,
  } = req.body as Partial<TutorApplication>;

  if (!name || !subject || !licenseNumber || !universityDegree) {
    res.status(400).json({ error: 'يرجى تعبئة الاسم، المادة، رقم الرخصة، والمؤهل الجامعي.' });
    return;
  }

  const state = loadState();
  const application: TutorApplication = {
    id: `app-${Date.now().toString().slice(-4)}`,
    name,
    gender: gender || 'ذكر',
    subject,
    curriculum: curriculum || 'المنهج السعودي',
    gradeLevels: gradeLevels?.length ? gradeLevels : ['المرحلة الثانوية'],
    languages: languages?.length ? languages : ['العربية'],
    hourlyRate: Number(hourlyRate) || 135,
    licenseNumber,
    universityDegree,
    experienceYears: Number(experienceYears) || 4,
    certificateFileName: certificateFileName || 'teaching_certificate.pdf',
    status: 'pending',
    submittedAt: new Date().toISOString().slice(0, 10),
  };

  state.applications.unshift(application);
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
      const newTutor: Tutor = {
        id: `t-${Date.now().toString().slice(-4)}`,
        name: appRecord.name,
        avatar: '',
        gender: appRecord.gender,
        subject: appRecord.subject,
        subjects: [appRecord.subject],
        gradeLevels: appRecord.gradeLevels,
        curriculum: appRecord.curriculum,
        languages: appRecord.languages,
        hourlyRate: appRecord.hourlyRate,
        bio: `مدرس معتمد متخصص في ${appRecord.subject} (${appRecord.curriculum})، حاصل على ${appRecord.universityDegree}.`,
        ministryLicenseId: appRecord.licenseNumber,
        verificationStatus: 'verified',
        certificates: [appRecord.universityDegree, `اعتماد وزارة التعليم (${appRecord.licenseNumber})`],
        rating: 5.0,
        reviewCount: 1,
        availableSlots: ['الأحد 5:00 م', 'الإثنين 6:00 م', 'الأربعاء 5:30 م', 'الخميس 4:30 م'],
        bookingsCount: 0,
        experienceYears: appRecord.experienceYears,
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
  const { learningGoal, gradeLevel, curriculum, preferredGender, preferredLanguage } = req.body as {
    learningGoal: string;
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
    .filter((t) => t.verificationStatus === 'verified')
    .map((t) => ({
      id: t.id,
      name: t.name,
      gender: t.gender,
      subject: t.subject,
      subjects: t.subjects,
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
                  recommendedPackage: {
                    type: Type.STRING,
                    description: 'One of: hourly, weekly, monthly, semester',
                  },
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
      contents: `أنشئ تحليلاً تعليمياً موجزاً ودقيقاً باللغة العربية لأداء الطالبة "${state.studentName}" (فئة الحساب: ${state.activeClientTier}):
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
