import React, { useMemo, useState } from 'react';
import { Award, CheckCircle2, FileCheck2, ShieldAlert, ShieldCheck, XCircle } from 'lucide-react';
import type {
  AbuseReport,
  Booking,
  ClientTier,
  LearningTrack,
  Tutor,
  TutorApplication,
} from '../types';
import { CLIENT_TIER_DETAILS } from '../utils/pricing';

const ALL_TRACKS: LearningTrack[] = ['المراحل الدراسية', 'قياس', 'المرحلة الجامعية'];

type CertSubTab = 'verification' | 'admin' | 'tiers' | 'roadmap';

interface CertificationAndRoadmapProps {
  tutors: Tutor[];
  bookings: Booking[];
  applications: TutorApplication[];
  reports: AbuseReport[];
  activeClientTier: ClientTier;
  onSwitchTier: (tier: ClientTier) => void;
  onRefresh: () => void;
}

const ROADMAP_PHASES = [
  {
    target: '1,000',
    unit: 'مدرس معتمد',
    phase: 'المرحلة الأولى: السنة الأولى (MVP)',
    revenueModel: 'تسجيل المدرسين مجاني · عمولة المنصة 10% فقط من كل حصة',
    focus: 'الإطلاق داخل السعودية، التواصل مع وزارة التعليم، تغطية الابتدائي والمتوسط والثانوي، وبناء الثقة.',
  },
  {
    target: '10,000',
    unit: 'مدرس معتمد',
    phase: 'المرحلة الثانية: السنة الثانية',
    revenueModel: 'استمرار عمولة 10% + إطلاق اشتراكات اختيارية للمدرسين',
    focus: 'التوسع لجميع دول الخليج، إضافة التعليم الجامعي للمدرسين المعتمدين جامعياً، والدروس الجماعية.',
  },
  {
    target: '50,000',
    unit: 'عميل نشط',
    phase: 'المرحلة الثالثة: السنة الثالثة',
    revenueModel: 'أكثر من 50,000 عميل نشط و10,000+ مدرس معتمد',
    focus: 'الريادة الإقليمية، تقارير AI التلقائية بعد الحصص، متجر الكتب والملخصات، وشهادات إلكترونية.',
  },
];

const FUTURE_INTEGRATIONS = [
  'Microsoft Teams',
  'Zoom',
  'Google Meet',
  'Google Calendar & Outlook & Apple Calendar',
  'HyperPay / mada / Apple Pay / STC Pay',
  'واجهات التحقق الأكاديمي ووزارة التعليم',
  'تفريغ الحصص وتقارير أولياء الأمور بالذكاء الاصطناعي',
  'إصدار الشهادات الإلكترونية',
];

export const CertificationAndRoadmap: React.FC<CertificationAndRoadmapProps> = ({
  tutors,
  bookings,
  applications,
  reports,
  activeClientTier,
  onSwitchTier,
  onRefresh,
}) => {
  const [subTab, setSubTab] = useState<CertSubTab>('verification');
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'ذكر' | 'أنثى'>('ذكر');
  const [city, setCity] = useState('الرياض');
  const [nationality, setNationality] = useState('سعودي');
  const [university, setUniversity] = useState('');
  const [subject, setSubject] = useState('الرياضيات');
  const [curriculum, setCurriculum] = useState('المنهج السعودي');
  const [learningTracks, setLearningTracks] = useState<LearningTrack[]>(['المراحل الدراسية']);
  const [hourlyRate, setHourlyRate] = useState(140);
  const [dailyCapacityHours, setDailyCapacityHours] = useState(5);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [universityDegree, setUniversityDegree] = useState('');
  const [bankIban, setBankIban] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [certificateFileName, setCertificateFileName] = useState('moe_license_document.pdf');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  // Admin quick abuse report form
  const [reportTarget, setReportTarget] = useState('');
  const [reportReason, setReportReason] = useState('');

  const adminMetrics = useMemo(() => {
    const activeTutorsCount = tutors.filter((t) => t.verificationStatus === 'verified').length;
    const pendingAppsCount = applications.filter((a) => a.status === 'pending').length;
    const totalRevenue = bookings.reduce((s, b) => s + b.finalPrice, 0);
    const totalCommission = bookings.reduce((s, b) => s + b.platformCommission, 0);
    const citiesCount = new Set(tutors.map((t) => t.city)).size;
    return { activeTutorsCount, pendingAppsCount, totalRevenue, totalCommission, citiesCount };
  }, [tutors, applications, bookings]);

  const toggleTrack = (track: LearningTrack) => {
    setLearningTracks((prev) =>
      prev.includes(track) ? prev.filter((t) => t !== track) : [...prev, track]
    );
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (learningTracks.length === 0) {
      setSubmitMsg('يرجى تحديد مسار تعليمي واحد على الأقل.');
      return;
    }
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await fetch('/api/tutors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          gender,
          city,
          nationality,
          university: university || 'جامعة معتمدة',
          subject,
          curriculum,
          learningTracks,
          hourlyRate,
          dailyCapacityHours,
          licenseNumber,
          universityDegree,
          bankIban,
          experienceYears,
          certificateFileName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setName('');
        setLicenseNumber('');
        setUniversityDegree('');
        setUniversity('');
        setBankIban('');
        setLearningTracks(['المراحل الدراسية']);
        setSubmitMsg('تم إرسال طلبك المجاني بنجاح للمراجعة والاعتماد.');
        onRefresh();
      } else {
        setSubmitMsg(data.error || 'تعذر إرسال الطلب.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (id: string, status: 'approved' | 'rejected') => {
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    onRefresh();
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTarget.trim() || !reportReason.trim()) return;
    await fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reporterName: 'الإدارة / مستخدم',
        targetName: reportTarget,
        reason: reportReason,
      }),
    });
    setReportTarget('');
    setReportReason('');
    onRefresh();
  };

  const handleResolveReport = async (id: string) => {
    await fetch(`/api/reports/${id}`, { method: 'PATCH' });
    onRefresh();
  };

  return (
    <div className="space-y-6">
      {/* Header + Sub-tabs */}
      <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">الاعتماد، الإدارة، والخطط</h1>
          <p className="text-xs text-slate-600 mt-1">
            تسجيل واعتماد المدرسين، لوحة الإدارة، فئات العملاء، وخارطة النمو الاستراتيجية.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-3 border-t border-slate-100 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSubTab('verification')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
              subTab === 'verification'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            تسجيل واعتماد المدرسين
          </button>
          <button
            type="button"
            onClick={() => setSubTab('admin')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
              subTab === 'admin'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            لوحة الإدارة (Admin)
          </button>
          <button
            type="button"
            onClick={() => setSubTab('tiers')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
              subTab === 'tiers'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            فئات العملاء (Regular / Premium / Elite)
          </button>
          <button
            type="button"
            onClick={() => setSubTab('roadmap')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap ${
              subTab === 'roadmap'
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            خارطة الطريق والتكاملات
          </button>
        </div>
      </section>

      {/* Sub-tab 1: Tutor Registration & Verification Queue */}
      {subTab === 'verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">طلبات الاعتماد (Pending → Verified)</h2>
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
            </div>

            <div className="divide-y divide-slate-200">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-mono-nums">{app.licenseNumber}</span>
                      <span aria-hidden="true">·</span>
                      <span>{app.city}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-800 font-medium">
                        {(app.learningTracks || ['المراحل الدراسية']).join(' · ')}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900">{app.name}</h3>
                    <p className="text-xs text-slate-600">
                      {app.universityDegree} · السعة: {app.dailyCapacityHours} س/يوم
                      {app.agreementSigned ? ' · الاتفاقية موقّعة إلكترونياً' : ''}
                    </p>
                    {app.signatureDataUrl && (
                      <div className="pt-1 flex items-center gap-2">
                        <span className="text-[11px] text-slate-500">التوقيع المرفق:</span>
                        <img
                          src={app.signatureDataUrl}
                          alt={`توقيع ${app.name}`}
                          className="h-7 bg-slate-50 border border-slate-200 rounded px-1.5"
                        />
                      </div>
                    )}
                  </div>

                  {app.status === 'pending' ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDecision(app.id, 'approved')}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>اعتماد</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(app.id, 'rejected')}
                        className="px-3.5 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>رفض</span>
                      </button>
                    </div>
                  ) : (
                    <span
                      className={`text-xs font-semibold shrink-0 ${
                        app.status === 'approved' ? 'text-emerald-800' : 'text-red-700'
                      }`}
                    >
                      {app.status === 'approved' ? 'Active / معتمد' : 'مرفوض'}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-bold text-slate-900">تسجيل مدرس جديد (مجاني)</h2>
            </div>

            <form onSubmit={handleApply} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="الاسم الكامل"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  placeholder="الجنسية"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
                <select
                  aria-label="الجنس"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'ذكر' | 'أنثى')}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  الفئات التي ستشرح لها (يمكن اختيار أكثر من فئة)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ALL_TRACKS.map((track) => {
                    const active = learningTracks.includes(track);
                    return (
                      <button
                        key={track}
                        type="button"
                        onClick={() => toggleTrack(track)}
                        className={`px-2 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer text-center ${
                          active
                            ? 'bg-emerald-50 border-emerald-700 text-emerald-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        {active ? `✓ ${track}` : track}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <select
                  aria-label="المادة"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
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
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="المنهج السعودي">المنهج السعودي</option>
                  <option value="المنهج الدولي (IGCSE / IB)">المنهج الدولي</option>
                  <option value="المنهج الأمريكي">المنهج الأمريكي</option>
                </select>

                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="المدينة"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  required
                  value={universityDegree}
                  onChange={(e) => setUniversityDegree(e.target.value)}
                  placeholder="المؤهل والتخصص (مثال: ماجستير رياضيات)"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
                <input
                  type="text"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="الجامعة"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="رقم الرخصة"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-nums"
                />
                <input
                  type="number"
                  min={50}
                  max={500}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  placeholder="سعر الساعة"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg tabular-nums"
                />
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={dailyCapacityHours}
                  onChange={(e) => setDailyCapacityHours(Number(e.target.value))}
                  placeholder="ساعات يومياً"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg tabular-nums"
                />
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  placeholder="الخبرة"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg tabular-nums"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <input
                  type="text"
                  value={bankIban}
                  onChange={(e) => setBankIban(e.target.value)}
                  placeholder="رقم الآيبان (SA...)"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-nums"
                />
                <input
                  type="text"
                  value={certificateFileName}
                  onChange={(e) => setCertificateFileName(e.target.value)}
                  placeholder="ملف الشهادة والهوية"
                  className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-nums"
                />
              </div>

              {submitMsg && (
                <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                  {submitMsg}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-700 disabled:opacity-50 rounded-lg cursor-pointer"
              >
                {submitting ? 'جاري الإرسال...' : 'إرسال طلب الاعتماد المجاني'}
              </button>
            </form>
          </section>
        </div>
      )}

      {/* Sub-tab 2: Admin Dashboard */}
      {subTab === 'admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500">المدرسون المعتمدون</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                {adminMetrics.activeTutorsCount}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500">طلبات قيد الاعتماد</p>
              <p className="text-2xl font-bold text-amber-700 tabular-nums mt-1">
                {adminMetrics.pendingAppsCount}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500">إجمالي الحجوزات</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                {bookings.length}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500">إجمالي المبيعات</p>
              <p className="text-2xl font-bold text-slate-900 tabular-nums mt-1">
                {adminMetrics.totalRevenue.toFixed(0)} ر.س
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <p className="text-xs text-slate-500">عمولة المنصة (10%)</p>
              <p className="text-2xl font-bold text-emerald-800 tabular-nums mt-1">
                {adminMetrics.totalCommission.toFixed(2)} ر.س
              </p>
            </div>
          </div>

          <section className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-slate-700" />
              <h2 className="text-base font-bold text-slate-900">مراجعة البلاغات والشكاوى</h2>
            </div>

            <form onSubmit={handleCreateReport} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={reportTarget}
                onChange={(e) => setReportTarget(e.target.value)}
                placeholder="اسم الحساب أو رقم الحجز..."
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg sm:w-56"
              />
              <input
                type="text"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="وصف البلاغ أو الملاحظة..."
                className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg cursor-pointer"
              >
                تسجيل بلاغ
              </button>
            </form>

            {reports.length === 0 ? (
              <p className="text-xs text-slate-500">لا توجد بلاغات مفتوحة حالياً.</p>
            ) : (
              <div className="divide-y divide-slate-200">
                {reports.map((rep) => (
                  <div key={rep.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{rep.targetName}</p>
                      <p className="text-slate-600">{rep.reason} · {rep.date}</p>
                    </div>
                    {rep.status === 'open' ? (
                      <button
                        type="button"
                        onClick={() => handleResolveReport(rep.id)}
                        className="px-3 py-1 bg-emerald-700 text-white rounded-md cursor-pointer"
                      >
                        إغلاق البلاغ
                      </button>
                    ) : (
                      <span className="text-emerald-800 font-semibold">تمت المعالجة</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Sub-tab 3: Client Tiers */}
      {subTab === 'tiers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['Regular', 'Premium', 'Elite'] as ClientTier[]).map((tier) => {
            const info = CLIENT_TIER_DETAILS[tier];
            const isActive = activeClientTier === tier;
            return (
              <div
                key={tier}
                className={`bg-white rounded-2xl p-6 border flex flex-col justify-between space-y-5 ${
                  isActive ? 'border-emerald-700' : 'border-slate-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-slate-900">{info.nameAr}</h2>
                    <span className="text-sm font-bold text-emerald-800 tabular-nums">
                      {info.priceLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{info.audience}</p>
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">الخصم</span>
                      <span className="font-semibold tabular-nums">{info.discountPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">الأولوية</span>
                      <span>{info.priorityBooking}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">المتابعة</span>
                      <span>{info.familyDashboard}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSwitchTier(tier)}
                  className={`w-full py-2.5 text-xs font-semibold rounded-lg cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-900 text-white hover:bg-emerald-700'
                  }`}
                >
                  {isActive ? 'مفعلة حالياً' : `تفعيل ${tier}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub-tab 4: Roadmap & Integrations */}
      {subTab === 'roadmap' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {ROADMAP_PHASES.map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2.5">
                <p className="text-xs font-semibold text-emerald-800">{item.phase}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-slate-900 tabular-nums">
                    {item.target}
                  </span>
                  <span className="text-sm font-medium text-slate-600">{item.unit}</span>
                </div>
                <p className="text-xs font-semibold text-slate-800">{item.revenueModel}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{item.focus}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <h2 className="text-base font-bold text-slate-900">التكاملات المستقبلية والبنية المقترحة</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              {FUTURE_INTEGRATIONS.join(' · ')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
