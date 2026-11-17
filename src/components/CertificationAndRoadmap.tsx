import React, { useState } from 'react';
import { Award, CheckCircle2, FileCheck2, ShieldCheck, XCircle } from 'lucide-react';
import type { ClientTier, TutorApplication } from '../types';
import { CLIENT_TIER_DETAILS } from '../utils/pricing';

interface CertificationAndRoadmapProps {
  applications: TutorApplication[];
  activeClientTier: ClientTier;
  onSwitchTier: (tier: ClientTier) => void;
  onRefresh: () => void;
}

const ROADMAP_PHASES = [
  {
    target: '1,000',
    unit: 'مدرس معتمد',
    phase: 'المرحلة الأولى: السنة الأولى',
    revenueModel: 'الإيرادات من عمولة الحجوزات بنسبة 10% فقط',
    focus: 'التنسيق مع وزارة التعليم، إطلاق النسخة الأولية MVP، المدارس السعودية، وبناء الثقة في المنصة.',
  },
  {
    target: '10,000',
    unit: 'مدرس',
    phase: 'المرحلة الثانية: السنة الأولى إلى الثانية',
    revenueModel: 'إطلاق اشتراكات للمدرسين مع استمرار عمولة الحجوزات بنسبة 10%',
    focus: 'التوسع إلى دول مجلس التعاون الخليجي وإضافة الدروس الجامعية لمدرسين جامعيين موثقين ومعتمدين.',
  },
  {
    target: '50,000',
    unit: 'عميل نشط',
    phase: 'المرحلة الثالثة: بحلول السنة الثالثة',
    revenueModel: 'استهداف 50,000 عميل نشط وما لا يقل عن 10,000 مدرس',
    focus: 'الريادة الإقليمية، شراكات المؤسسات، التخصيص بالذكاء الاصطناعي، دعم لغات متعددة، منح دراسية، وبرامج للمؤسسات التعليمية.',
  },
];

const FUTURE_INTEGRATIONS = [
  'Microsoft Teams',
  'Zoom',
  'تطبيقات التقويم (Calendars)',
  'بوابات الدفع الإلكتروني',
  'واجهات التحقق التابعة لوزارة التعليم',
  'أنظمة إدارة التعلم (LMS)',
  'تفريغ الحصص صوتياً بالذكاء الاصطناعي',
  'تحليلات الحضور المتقدمة',
  'إصدار الشهادات',
];

export const CertificationAndRoadmap: React.FC<CertificationAndRoadmapProps> = ({
  applications,
  activeClientTier,
  onSwitchTier,
  onRefresh,
}) => {
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'ذكر' | 'أنثى'>('ذكر');
  const [subject, setSubject] = useState('الرياضيات');
  const [curriculum, setCurriculum] = useState('المنهج السعودي');
  const [hourlyRate, setHourlyRate] = useState(140);
  const [licenseNumber, setLicenseNumber] = useState('');
  const [universityDegree, setUniversityDegree] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [certificateFileName, setCertificateFileName] = useState('moe_license_document.pdf');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState<string | null>(null);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      const res = await fetch('/api/tutors/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          gender,
          subject,
          curriculum,
          hourlyRate,
          licenseNumber,
          universityDegree,
          experienceYears,
          certificateFileName,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setName('');
        setLicenseNumber('');
        setUniversityDegree('');
        setSubmitMsg(
          'تم استلام طلب التسجيل المجاني وإحالة الشهادات لقائمة التحقق والاعتماد.'
        );
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

  return (
    <div className="space-y-10">
      {/* Certification Verification Queue + Free Tutor Application */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                آلية التحقق من الشهادات والاعتمادات
              </h1>
              <p className="text-xs text-slate-600 mt-1">
                لا يُقبل في المنصة إلا المدرسون المعتمدون بعد التحقق من الرخصة والشهادات الأكاديمية.
              </p>
            </div>
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
          </div>

          <div className="divide-y divide-slate-200">
            {applications.map((app) => (
              <div
                key={app.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono-nums">{app.licenseNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>{app.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span>{app.curriculum}</span>
                  </div>
                  <h2 className="text-base font-bold text-slate-900">{app.name}</h2>
                  <p className="text-xs text-slate-600">
                    {app.universityDegree} · خبرة {app.experienceYears} سنوات · مرفق:{' '}
                    <span className="font-mono-nums">{app.certificateFileName}</span>
                  </p>
                </div>

                {app.status === 'pending' ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDecision(app.id, 'approved')}
                      className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>اعتماد وتفعيل</span>
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
                    {app.status === 'approved'
                      ? 'تم الاعتماد وإضافته للمنصة'
                      : 'مرفوض لعدم استيفاء الاعتماد'}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Free Tutor Registration Form */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-bold text-slate-900">
              التسجيل الأولي المجاني للمدرسين
            </h2>
          </div>

          <form onSubmit={handleApply} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  الاسم الكامل
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="أ. عبد العزيز ..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">الجنس</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as 'ذكر' | 'أنثى')}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="ذكر">ذكر</option>
                  <option value="أنثى">أنثى</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">المادة</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="الرياضيات">الرياضيات</option>
                  <option value="الفيزياء">الفيزياء</option>
                  <option value="اللغة الإنجليزية">اللغة الإنجليزية</option>
                  <option value="اللغة العربية">اللغة العربية</option>
                  <option value="الكيمياء والأحياء">الكيمياء والأحياء</option>
                  <option value="الحاسب والبرمجة">الحاسب والبرمجة</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">المنهج</label>
                <select
                  value={curriculum}
                  onChange={(e) => setCurriculum(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option value="المنهج السعودي">المنهج السعودي</option>
                  <option value="المنهج الدولي (IGCSE / IB)">المنهج الدولي (IGCSE / IB)</option>
                  <option value="المنهج الأمريكي">المنهج الأمريكي</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  رقم الرخصة / الاعتماد
                </label>
                <input
                  type="text"
                  required
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="MOE-SA-901220"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  سعر الساعة (ر.س)
                </label>
                <input
                  type="number"
                  min={50}
                  max={500}
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                المؤهل العلمي والجامعة
              </label>
              <input
                type="text"
                required
                value={universityDegree}
                onChange={(e) => setUniversityDegree(e.target.value)}
                placeholder="بكالوريوس أو ماجستير في التخصص..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  سنوات الخبرة
                </label>
                <input
                  type="number"
                  min={1}
                  max={40}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  ملف الشهادة الموثق
                </label>
                <input
                  type="text"
                  value={certificateFileName}
                  onChange={(e) => setCertificateFileName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono-nums"
                />
              </div>
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
              {submitting ? 'جاري الإرسال...' : 'تقديم طلب اعتماد مجاني'}
            </button>
          </form>
        </section>
      </div>

      {/* Client Tiers Matrix (Regular / Premium / Elite) */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">فئات العملاء والباقات المميزة</h2>
          <p className="text-sm text-slate-600 mt-1">
            اختر الفئة المناسبة لاحتياج الطالب أو العائلة — وتنعكس خصومات الفئة مباشرة على أسعار
            الحجز في المنصة.
          </p>
        </div>

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
                    <h3 className="text-lg font-bold text-slate-900">{info.nameAr}</h3>
                    <span className="text-sm font-bold text-emerald-800 tabular-nums">
                      {info.priceLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">{info.audience}</p>

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700">
                    <div className="flex justify-between">
                      <span className="text-slate-500">الخصم على الحجوزات</span>
                      <span className="font-semibold tabular-nums">{info.discountPct}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">أولوية الحجز</span>
                      <span className="font-medium">{info.priorityBooking}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">الخطط التعليمية</span>
                      <span className="font-medium">{info.savedPlans}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">الإرشاد والتحليلات</span>
                      <span className="font-medium">{info.familyDashboard}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSwitchTier(tier)}
                  className={`w-full py-2.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white'
                      : 'bg-slate-900 text-white hover:bg-emerald-700'
                  }`}
                >
                  {isActive ? 'الفئة النشطة حالياً' : `تفعيل فئة ${tier}`}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Strategic Roadmap & Future Integrations */}
      <section className="space-y-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">خارطة الطريق والنمو الاستراتيجي</h2>
          <p className="text-sm text-slate-600 mt-1">
            التدرج من الإطلاق الوطني السعودي بعمولة 10% إلى التوسع الخليجي والريادة الإقليمية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROADMAP_PHASES.map((item, idx) => (
            <div key={idx} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
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

        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-700" />
            <h3 className="text-base font-bold text-slate-900">التكاملات المستقبلية المخطط لها</h3>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            {FUTURE_INTEGRATIONS.join(' · ')}
          </p>
        </div>
      </section>
    </div>
  );
};
