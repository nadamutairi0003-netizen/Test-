import React, { useEffect, useRef, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Eraser,
  FileCheck2,
  GraduationCap,
  IdCard,
  PenTool,
  ShieldCheck,
  Upload,
  UserCheck,
  Users,
} from 'lucide-react';
import type { ActiveUserProfile, LearningTrack, RegisteredChild, UserRole } from '../types';

interface RegistrationPortalProps {
  activeUser?: ActiveUserProfile;
  onSuccessNavigate: (targetTab: 'search' | 'student' | 'tutor' | 'roadmap') => void;
  onRefresh: () => void;
}

const ALL_TRACKS: { key: LearningTrack; title: string; desc: string; icon: React.FC<{ className?: string }> }[] = [
  {
    key: 'المراحل الدراسية',
    title: 'المراحل الدراسية',
    desc: 'ابتدائي · متوسط · ثانوي',
    icon: BookOpen,
  },
  {
    key: 'قياس',
    title: 'اختبارات قياس',
    desc: 'القدرات · التحصيلي · STEP',
    icon: Award,
  },
  {
    key: 'المرحلة الجامعية',
    title: 'المرحلة الجامعية',
    desc: 'السنة التحضيرية والتخصصات',
    icon: GraduationCap,
  },
];

const CITIES = ['الرياض', 'جدة', 'الخبر', 'الدمام', 'مكة المكرمة', 'المدينة المنورة'];

export const RegistrationPortal: React.FC<RegistrationPortalProps> = ({
  activeUser,
  onSuccessNavigate,
  onRefresh,
}) => {
  const [role, setRole] = useState<UserRole>(activeUser?.role || 'student');

  // Student registration state
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentCity, setStudentCity] = useState('الرياض');
  const [studentGrade, setStudentGrade] = useState('المرحلة الثانوية');
  const [studentTrack, setStudentTrack] = useState<LearningTrack>(
    activeUser?.preferredTrack || 'المراحل الدراسية'
  );
  const [studentMsg, setStudentMsg] = useState<string | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  // Parent registration & National ID auto-discovery state
  const [parentId, setParentId] = useState('1045678901');
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentCity, setParentCity] = useState('الرياض');
  const [discoveredChildren, setDiscoveredChildren] = useState<RegisteredChild[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [parentSavedMsg, setParentSavedMsg] = useState<string | null>(null);
  const [parentSubmitting, setParentSubmitting] = useState(false);

  // Tutor registration, certificates upload & agreement signature state
  const [tutorName, setTutorName] = useState('');
  const [tutorGender, setTutorGender] = useState<'ذكر' | 'أنثى'>('ذكر');
  const [tutorNationality, setTutorNationality] = useState('سعودي');
  const [tutorCity, setTutorCity] = useState('الرياض');
  const [tutorUniversity, setTutorUniversity] = useState('');
  const [tutorDegree, setTutorDegree] = useState('');
  const [tutorLicense, setTutorLicense] = useState('');
  const [tutorSubject, setTutorSubject] = useState('الرياضيات');
  const [tutorCurriculum, setTutorCurriculum] = useState('المنهج السعودي');
  const [tutorTracks, setTutorTracks] = useState<LearningTrack[]>(['المراحل الدراسية']);
  const [tutorRate, setTutorRate] = useState(145);
  const [tutorCapacity, setTutorCapacity] = useState(5);
  const [tutorExp, setTutorExp] = useState(5);
  const [tutorIban, setTutorIban] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([
    'رخصة_ممارس_تعليمي.pdf',
    'الشهادة_الجامعية_الموثقة.pdf',
  ]);
  const [agreementAccepted, setAgreementAccepted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [tutorLoading, setTutorLoading] = useState(false);
  const [tutorError, setTutorError] = useState<string | null>(null);
  const [tutorSuccess, setTutorSuccess] = useState<string | null>(null);

  // Signature canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);

  const performFamilyLookup = async (idValue: string) => {
    const clean = idValue.replace(/\D/g, '');
    if (clean.length !== 10) {
      setDiscoveredChildren([]);
      setLookupError(clean.length > 0 ? 'أدخل رقم هوية من 10 أرقام ليتم جلب الأبناء تلقائياً' : null);
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch('/api/auth/lookup-family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nationalId: clean }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLookupError(data.error || 'تعذر التحقق من رقم الهوية');
      } else {
        setParentName(data.parentName);
        setParentCity(data.city);
        setDiscoveredChildren(data.children || []);
      }
    } catch {
      setLookupError('تعذر الاتصال بخدمة السجل العائلي');
    } finally {
      setLookupLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'parent' && parentId.replace(/\D/g, '').length === 10 && discoveredChildren.length === 0) {
      performFamilyLookup(parentId);
    }
  }, [role, parentId, discoveredChildren.length]);

  const handleParentIdChange = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 10);
    setParentId(digits);
    setParentSavedMsg(null);
    if (digits.length === 10) {
      performFamilyLookup(digits);
    } else {
      setDiscoveredChildren([]);
    }
  };

  const handleChildTrackUpdate = (index: number, nextTrack: LearningTrack) => {
    setDiscoveredChildren((prev) =>
      prev.map((c, idx) => (idx === index ? { ...c, track: nextTrack } : c))
    );
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentLoading(true);
    setStudentMsg(null);
    try {
      const res = await fetch('/api/auth/register-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: studentName,
          email: studentEmail,
          city: studentCity,
          gradeLevel: studentGrade,
          preferredTrack: studentTrack,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStudentMsg(
          `أهلاً بك يا ${studentName}! تم تسجيل دخولك وتعيين مسار «${studentTrack}» (ويمكنك تغييره بسهولة في أي وقت).`
        );
        onRefresh();
      } else {
        setStudentMsg(data.error || 'تعذر التسجيل');
      }
    } finally {
      setStudentLoading(false);
    }
  };

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (discoveredChildren.length === 0) {
      setLookupError('يرجى إدخال رقم هوية صحيح لجلب بيانات الأبناء تلقائياً.');
      return;
    }
    setParentSubmitting(true);
    setParentSavedMsg(null);
    try {
      const res = await fetch('/api/auth/register-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: parentName,
          email: parentEmail,
          nationalId: parentId,
          city: parentCity,
          children: discoveredChildren,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setParentSavedMsg(
          `تم تسجيل حساب ولي الأمر (${parentName}) وربط ${discoveredChildren.length} أبناء تلقائياً في بوابتك.`
        );
        onRefresh();
      } else {
        setLookupError(data.error || 'تعذر حفظ بيانات ولي الأمر');
      }
    } finally {
      setParentSubmitting(false);
    }
  };

  const toggleTutorTrack = (track: LearningTrack) => {
    setTutorTracks((prev) =>
      prev.includes(track) ? prev.filter((t) => t !== track) : [...prev, track]
    );
  };

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const names = Array.from(files).map((f) => `${f.name} (${Math.max(1, Math.round(f.size / 1024))} KB)`);
    setUploadedFiles((prev) => [...prev, ...names]);
  };

  // Signature pad pointer handlers
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  };

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    isDrawingRef.current = true;
    const pt = getCanvasPoint(e);
    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#047857';
    setHasSignature(true);
  };

  const drawMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const pt = getCanvasPoint(e);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  };

  const endDrawing = () => {
    isDrawingRef.current = false;
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const fillQuickStudentDemo = () => {
    setStudentName('سارة عبد الله المطيري');
    setStudentEmail('sara@mutamad.sa');
    setStudentCity('الرياض');
    setStudentGrade('المرحلة الثانوية');
    setStudentTrack('قياس');
  };

  const fillQuickTutorDemo = () => {
    setTutorName('أ. فيصل عبد العزيز الدوسري');
    setTutorNationality('سعودي');
    setTutorGender('ذكر');
    setTutorDegree('ماجستير الرياضيات التطبيقية');
    setTutorUniversity('جامعة الملك سعود');
    setTutorLicense('MOE-LIC-99412');
    setTutorSubject('الرياضيات');
    setTutorCurriculum('المنهج السعودي');
    setTutorCity('الرياض');
    setTutorTracks(['المراحل الدراسية', 'قياس']);
    setTutorRate(150);
    setTutorCapacity(5);
    setTutorExp(7);
    setTutorIban('SA4420000001234567891234');
    setAgreementAccepted(true);
    setHasSignature(true);
    setTutorError(null);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.moveTo(140, 95);
        ctx.bezierCurveTo(210, 40, 290, 120, 380, 70);
        ctx.bezierCurveTo(430, 45, 490, 95, 560, 65);
        ctx.lineWidth = 2.8;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#047857';
        ctx.stroke();
      }
    }
  };

  const handleTutorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTutorError(null);
    setTutorSuccess(null);

    if (tutorTracks.length === 0) {
      setTutorError('يرجى تحديد مسار تعليمي واحد على الأقل.');
      return;
    }
    if (uploadedFiles.length === 0) {
      setTutorError('يرجى إرفاق ملف الشهادات والاعتماد المهني.');
      return;
    }
    if (!agreementAccepted || !hasSignature) {
      setTutorError('يرجى الموافقة على الاتفاقية والتوقيع في المربع المخصص قبل الإرسال.');
      return;
    }

    setTutorLoading(true);
    try {
      const signatureDataUrl = canvasRef.current?.toDataURL('image/png') || '';
      const res = await fetch('/api/tutors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tutorName,
          gender: tutorGender,
          nationality: tutorNationality,
          city: tutorCity,
          university: tutorUniversity || 'جامعة سعودية معتمدة',
          universityDegree: tutorDegree,
          licenseNumber: tutorLicense,
          subject: tutorSubject,
          curriculum: tutorCurriculum,
          learningTracks: tutorTracks,
          hourlyRate: tutorRate,
          dailyCapacityHours: tutorCapacity,
          experienceYears: tutorExp,
          bankIban: tutorIban,
          certificateFileName: uploadedFiles[0],
          uploadedFiles,
          agreementSigned: agreementAccepted,
          signatureDataUrl,
          fromOnboarding: true,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setTutorSuccess(
          `تم تسجيلك وتوقيع الاتفاقية بنجاح! رقم طلب الاعتماد (${data.application.id}) قيد المراجعة ويمكنك اعتماده من لوحة الإدارة.`
        );
        onRefresh();
      } else {
        setTutorError(data.error || 'تعذر إرسال طلب التسجيل');
      }
    } finally {
      setTutorLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Creative Blue Onboarding Header + Role Switcher */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-800 text-white p-6 sm:p-10 shadow-sm">
        <div className="max-w-3xl space-y-3">
          <p className="text-xs font-semibold text-emerald-300">
            بوابة الدخول والتسجيل الموحدة · متوافقة مع الهوية والاعتمادات الرسمية
          </p>
          <h1 className="text-2xl sm:text-4xl font-bold leading-tight balance-text">
            اختر صفتك وابدأ تجربتك المخصصة في منصة مُعتمَد
          </h1>
          <p className="text-sm text-emerald-100/90 leading-relaxed">
            تجربة ذكية مخصصة لكل مستخدم: الطالب يحدد مساره مع حرية التعديل، ولي الأمر يستعلم برقم الهوية
            لجلب جميع أبنائه تلقائياً، والمدرس يرفع اعتماداتـه ويوقّع الاتفاقية إلكترونياً.
          </p>
        </div>

        {/* 3 Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
          {(
            [
              {
                key: 'student' as UserRole,
                title: 'حساب طالب',
                desc: 'اختر مسارك التعليمي (مدارس، قياس، جامعة) وعدّله في أي وقت',
                icon: GraduationCap,
              },
              {
                key: 'parent' as UserRole,
                title: 'حساب ولي أمر',
                desc: 'جلب تلقائي لجميع الأبناء المسجلين بمجرد إدخال رقم الهوية',
                icon: Users,
              },
              {
                key: 'tutor' as UserRole,
                title: 'تسجيل مدرس معتمد',
                desc: 'إدخال المؤهلات، رفع الشهادات، وتوقيع الاتفاقية المعتمدة',
                icon: ShieldCheck,
              },
            ] as const
          ).map(({ key, title, desc, icon: Icon }) => {
            const active = role === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setRole(key)}
                className={`p-5 rounded-2xl text-right border transition-all cursor-pointer flex items-start gap-3.5 ${
                  active
                    ? 'bg-white text-slate-900 border-white shadow-md'
                    : 'bg-white/10 text-white border-white/15 hover:bg-white/15'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    active ? 'bg-emerald-700 text-white' : 'bg-white/10 text-emerald-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold">{title}</p>
                  <p className={`text-xs leading-relaxed ${active ? 'text-slate-600' : 'text-emerald-100/85'}`}>
                    {desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Role 1: Student Onboarding */}
      {role === 'student' && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <UserCheck className="w-5 h-5 text-emerald-700" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">تسجيل ودخول الطالب</h2>
                <p className="text-xs text-slate-500">
                  حدّد بياناتك ومسارك الحالي، ويمكنك تعديل المسار لاحقاً بضغطة زر من بوابتك.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fillQuickStudentDemo}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer whitespace-nowrap"
            >
              تعبئة سريعة للتجربة
            </button>
          </div>

          <form onSubmit={handleStudentSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  اسم الطالب الكامل
                </label>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="مثال: سارة عبد الله المطيري"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  البريد الإلكتروني (لإرسال مواعيد الحصص)
                </label>
                <input
                  type="email"
                  required
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  placeholder="student@example.sa"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono-nums focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">المدينة</label>
                <select
                  aria-label="المدينة"
                  value={studentCity}
                  onChange={(e) => setStudentCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  الصف / المرحلة الحالية
                </label>
                <select
                  aria-label="المرحلة الحالية"
                  value={studentGrade}
                  onChange={(e) => setStudentGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="المرحلة الابتدائية">المرحلة الابتدائية</option>
                  <option value="المرحلة المتوسطة">المرحلة المتوسطة</option>
                  <option value="المرحلة الثانوية">المرحلة الثانوية</option>
                  <option value="المسار الجامعي">المسار الجامعي</option>
                </select>
              </div>
            </div>

            <div className="space-y-2.5">
              <label className="block text-xs font-semibold text-slate-700">
                اختر المسار التعليمي الذي ترغب بالبدء به (قابل للتعديل لاحقاً في أي وقت)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {ALL_TRACKS.map(({ key, title, desc, icon: Icon }) => {
                  const selected = studentTrack === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setStudentTrack(key)}
                      className={`p-4 rounded-xl border text-right transition-colors cursor-pointer space-y-1.5 ${
                        selected
                          ? 'bg-emerald-50 border-emerald-700 text-emerald-950'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <Icon className={`w-4 h-4 ${selected ? 'text-emerald-700' : 'text-slate-500'}`} />
                        {selected && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                      </div>
                      <p className="text-sm font-bold">{title}</p>
                      <p className="text-xs text-slate-500">{desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {studentMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs sm:text-sm font-semibold text-emerald-950">{studentMsg}</p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onSuccessNavigate('search')}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                  >
                    استعراض مدرسي المسار
                  </button>
                  <button
                    type="button"
                    onClick={() => onSuccessNavigate('student')}
                    className="px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-white border border-emerald-200 rounded-lg cursor-pointer"
                  >
                    دخول بوابة الطالب
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={studentLoading}
              className="w-full py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl cursor-pointer transition-colors"
            >
              {studentLoading ? 'جاري حفظ الحساب...' : 'تسجيل الدخول وتخصيص المسار'}
            </button>
          </form>
        </section>
      )}

      {/* Role 2: Parent Onboarding with Automatic National ID Child Discovery */}
      {role === 'parent' && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <IdCard className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                دخول ولي الأمر وجلب الأبناء تلقائياً من رقم الهوية
              </h2>
              <p className="text-xs text-slate-500">
                أدخل رقم الهوية الوطنية أو الإقامة (10 أرقام) ليتم إدراج جميع الأبناء المسجلين تلقائياً.
              </p>
            </div>
          </div>

          <form onSubmit={handleParentSubmit} className="space-y-5">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-emerald-950">
                  رقم هوية ولي الأمر (10 أرقام)
                </label>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className="text-slate-600">اختر عائلة للتجربة السريعة:</span>
                  {[
                    { id: '1045678901', label: '1045678901 · المطيري (3 أبناء)' },
                    { id: '1098765432', label: '1098765432 · القحطاني (ابنان)' },
                    { id: '1022334455', label: '1022334455 · الغامدي (ابنة)' },
                  ].map((sample) => (
                    <button
                      key={sample.id}
                      type="button"
                      onClick={() => handleParentIdChange(sample.id)}
                      className={`px-2.5 py-1 border rounded-md font-mono-nums cursor-pointer ${
                        parentId === sample.id
                          ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                          : 'bg-white border-emerald-200 hover:border-emerald-600 text-emerald-900'
                      }`}
                    >
                      {sample.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  required
                  value={parentId}
                  onChange={(e) => handleParentIdChange(e.target.value)}
                  placeholder="أدخل رقم الهوية (10 أرقام)..."
                  className="flex-1 px-4 py-2.5 text-sm bg-white border border-emerald-200 rounded-xl font-mono-nums focus:outline-none focus:border-emerald-700"
                />
                <button
                  type="button"
                  onClick={() => performFamilyLookup(parentId)}
                  disabled={lookupLoading}
                  className="px-5 py-2.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl cursor-pointer whitespace-nowrap"
                >
                  {lookupLoading ? 'جاري الاستعلام...' : 'جلب الأبناء تلقائياً'}
                </button>
              </div>

              {lookupError && <p className="text-xs text-red-700">{lookupError}</p>}
            </div>

            {discoveredChildren.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    الأبناء المسجلون المرتبطون بالهوية ({discoveredChildren.length})
                  </h3>
                  <span className="text-xs text-emerald-700 font-medium">
                    يمكنك تعديل مسار كل ابن مباشرة
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {discoveredChildren.map((child, idx) => (
                    <div
                      key={child.name}
                      className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-bold text-slate-900">{child.name}</p>
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                      </div>
                      <p className="text-xs text-slate-600">
                        {child.gradeLevel} · {child.schoolName || 'مدرسة معتمدة'}
                      </p>
                      <select
                        aria-label={`مسار ${child.name}`}
                        value={child.track}
                        onChange={(e) =>
                          handleChildTrackUpdate(idx, e.target.value as LearningTrack)
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg"
                      >
                        {ALL_TRACKS.map((tr) => (
                          <option key={tr.key} value={tr.key}>
                            المسار: {tr.key}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  اسم ولي الأمر
                </label>
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="اسم ولي الأمر"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  البريد الإلكتروني لتقارير الحصص
                </label>
                <input
                  type="email"
                  required
                  value={parentEmail}
                  onChange={(e) => setParentEmail(e.target.value)}
                  placeholder="parent@example.sa"
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">المدينة</label>
                <select
                  aria-label="المدينة"
                  value={parentCity}
                  onChange={(e) => setParentCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {parentSavedMsg && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs sm:text-sm font-semibold text-emerald-950">{parentSavedMsg}</p>
                <button
                  type="button"
                  onClick={() => onSuccessNavigate('student')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                >
                  فتح بوابة ولي الأمر والأبناء
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={parentSubmitting || discoveredChildren.length === 0}
              className="w-full py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl cursor-pointer transition-colors"
            >
              {parentSubmitting
                ? 'جاري ربط الأسرة...'
                : 'تأكيد التسجيل وإدراج جميع الأبناء تلقائياً'}
            </button>
          </form>
        </section>
      )}

      {/* Role 3: Tutor Registration + Certificates Upload + Electronic Agreement Signature */}
      {role === 'tutor' && (
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-5xl mx-auto space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <FileCheck2 className="w-5 h-5 text-emerald-700" />
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  تسجيل المدرس المعتمد، رفع الشهادات، وتوقيع الاتفاقية
                </h2>
                <p className="text-xs text-slate-500">
                  التسجيل مجاني في المرحلة الأولى · عمولة المنصة 10% فقط من الحصص المكتملة.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fillQuickTutorDemo}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer whitespace-nowrap"
            >
              تعبئة نموذج تجريبي سريع
            </button>
          </div>

          <form onSubmit={handleTutorSubmit} className="space-y-6">
            {/* Step 1: Personal & Academic Info */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900">
                1. البيانات الأساسية والمؤهل الأكاديمي
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  value={tutorName}
                  onChange={(e) => setTutorName(e.target.value)}
                  placeholder="الاسم الثلاثي"
                  className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  value={tutorNationality}
                  onChange={(e) => setTutorNationality(e.target.value)}
                  placeholder="الجنسية"
                  className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <select
                  aria-label="الجنس"
                  value={tutorGender}
                  onChange={(e) => setTutorGender(e.target.value as 'ذكر' | 'أنثى')}
                  className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
                <input
                  type="text"
                  required
                  value={tutorDegree}
                  onChange={(e) => setTutorDegree(e.target.value)}
                  placeholder="المؤهل والتخصص (مثال: ماجستير رياضيات)"
                  className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  value={tutorUniversity}
                  onChange={(e) => setTutorUniversity(e.target.value)}
                  placeholder="الجامعة المانحة للشهادة"
                  className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                />
                <input
                  type="text"
                  required
                  value={tutorLicense}
                  onChange={(e) => setTutorLicense(e.target.value)}
                  placeholder="رقم الرخصة المهنية / الاعتماد"
                  className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono-nums"
                />
              </div>
            </div>

            {/* Step 2: Teaching Tracks, Pricing & IBAN */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                2. المسارات التعليمية، السعة اليومية، والحساب البنكي
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {ALL_TRACKS.map((tr) => {
                  const active = tutorTracks.includes(tr.key);
                  return (
                    <button
                      key={tr.key}
                      type="button"
                      onClick={() => toggleTutorTrack(tr.key)}
                      className={`px-3 py-2.5 text-xs font-semibold rounded-xl border cursor-pointer text-center ${
                        active
                          ? 'bg-emerald-50 border-emerald-700 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}
                    >
                      {active ? `✓ ${tr.title}` : tr.title}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <select
                  aria-label="المادة"
                  value={tutorSubject}
                  onChange={(e) => setTutorSubject(e.target.value)}
                  className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="الرياضيات">الرياضيات</option>
                  <option value="الفيزياء">الفيزياء</option>
                  <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                  <option value="اللغة العربية">اللغة العربية</option>
                  <option value="الكيمياء والأحياء">الكيمياء والأحياء</option>
                  <option value="الحاسب والبرمجة">الحاسب والبرمجة</option>
                </select>
                <select
                  aria-label="المنهج"
                  value={tutorCurriculum}
                  onChange={(e) => setTutorCurriculum(e.target.value)}
                  className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="المنهج السعودي">المنهج السعودي</option>
                  <option value="المنهج الدولي (IGCSE / IB)">المنهج الدولي</option>
                  <option value="المنهج الأمريكي">المنهج الأمريكي</option>
                </select>
                <select
                  aria-label="المدينة"
                  value={tutorCity}
                  onChange={(e) => setTutorCity(e.target.value)}
                  className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={50}
                  max={500}
                  value={tutorRate}
                  onChange={(e) => setTutorRate(Number(e.target.value))}
                  placeholder="سعر الساعة (ر.س)"
                  className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl tabular-nums"
                />
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={tutorCapacity}
                  onChange={(e) => setTutorCapacity(Number(e.target.value))}
                  placeholder="السعة اليومية (ساعات)"
                  className="px-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl tabular-nums"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={tutorIban}
                  onChange={(e) => setTutorIban(e.target.value)}
                  placeholder="رقم الآيبان لتحويل الأرباح (SA...)"
                  className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono-nums"
                />
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={tutorExp}
                  onChange={(e) => setTutorExp(Number(e.target.value))}
                  placeholder="سنوات الخبرة"
                  className="px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl tabular-nums"
                />
              </div>
            </div>

            {/* Step 3: Upload Certifications & Licenses */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                3. رفع الشهادات والاعتمادات المهنية
              </h3>
              <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl cursor-pointer transition-colors">
                <Upload className="w-6 h-6 text-emerald-700 mb-2" />
                <span className="text-xs font-semibold text-slate-800">
                  اضغط لرفع الشهادة الجامعية والرخصة التعليمية (PDF أو صور)
                </span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFilePick}
                  className="hidden"
                />
              </label>

              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5 text-xs">
                  {uploadedFiles.map((file, idx) => (
                    <div
                      key={`${file}-${idx}`}
                      className="flex items-center justify-between px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                    >
                      <span className="font-mono-nums text-slate-700">{file}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="text-red-700 hover:underline cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Step 4: Agreement & Live Signature Pad */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                4. اتفاقية المدرس المعتمدة والتوقيع الإلكتروني
              </h3>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <p>
                  • يلتزم المدرس بتقديم حصص متوافقة مع ضوابط وزارة التعليم وصحة كافة الشهادات
                  المرفوعة.
                </p>
                <p>
                  • تحصل المنصة على عمولة تشغيلية ثابتة قدرها <strong>10%</strong> من كل حجز مكتمل،
                  ويستحق المدرس صافي <strong>90%</strong> في محفظته البنكية.
                </p>
                <p>
                  • يلتزم المدرس بالحضور في المواعيد المحجوزة وإسناد الواجبات وتقييم الطلاب بمهنية.
                </p>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreementAccepted}
                  onChange={(e) => setAgreementAccepted(e.target.checked)}
                  className="rounded accent-emerald-700"
                />
                <span>أوافق على جميع بنود اتفاقية الانضمام للمدرسين المعتمدين في منصة مُعتمَد</span>
              </label>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                    <span>التوقيع الإلكتروني (ارسم توقيعك بالماوس أو الإصبع)</span>
                  </span>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                  >
                    <Eraser className="w-3.5 h-3.5" />
                    <span>مسح التوقيع</span>
                  </button>
                </div>

                <canvas
                  ref={canvasRef}
                  width={700}
                  height={150}
                  onPointerDown={startDrawing}
                  onPointerMove={drawMove}
                  onPointerUp={endDrawing}
                  onPointerLeave={endDrawing}
                  className="w-full h-36 bg-slate-50 border border-slate-300 rounded-xl touch-none cursor-crosshair"
                />
              </div>
            </div>

            {tutorError && (
              <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                {tutorError}
              </p>
            )}

            {tutorSuccess && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                <p className="text-xs sm:text-sm font-semibold text-emerald-950">{tutorSuccess}</p>
                <button
                  type="button"
                  onClick={() => onSuccessNavigate('roadmap')}
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer"
                >
                  عرض طلب الاعتماد في الإدارة
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={tutorLoading}
              className="w-full py-3 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl cursor-pointer transition-colors"
            >
              {tutorLoading
                ? 'جاري رفع الملفات وتوثيق التوقيع...'
                : 'توقيع الاتفاقية وإرسال طلب الاعتماد المجاني'}
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
