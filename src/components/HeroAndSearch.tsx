import React, { useMemo, useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Sparkles,
  UserCheck,
  Video,
} from 'lucide-react';
import type { AiRecommendationItem, ClientTier, Tutor } from '../types';
import { CLIENT_TIER_DETAILS } from '../utils/pricing';

interface HeroAndSearchProps {
  tutors: Tutor[];
  activeClientTier: ClientTier;
  onSelectTutor: (tutor: Tutor) => void;
  onSwitchTier: (tier: ClientTier) => void;
  showAiMatcher: boolean;
  onToggleAiMatcher: (open: boolean) => void;
}

const SUBJECTS = [
  'الكل',
  'الرياضيات',
  'الفيزياء',
  'اللغة الإنجليزية',
  'اللغة العربية',
  'الكيمياء والأحياء',
  'الحاسب والبرمجة',
];

const GRADES = [
  'الكل',
  'المرحلة الابتدائية',
  'المرحلة المتوسطة',
  'المرحلة الثانوية',
  'المسار الجامعي',
];

const CURRICULA = [
  'الكل',
  'المنهج السعودي',
  'المنهج الدولي (IGCSE / IB)',
  'المنهج الأمريكي',
];

export const HeroAndSearch: React.FC<HeroAndSearchProps> = ({
  tutors,
  activeClientTier,
  onSelectTutor,
  onSwitchTier,
  showAiMatcher,
  onToggleAiMatcher,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('الكل');
  const [grade, setGrade] = useState('الكل');
  const [curriculum, setCurriculum] = useState('الكل');
  const [gender, setGender] = useState('الكل');
  const [language, setLanguage] = useState('الكل');
  const [dayFilter, setDayFilter] = useState('الكل');

  // AI Learning Goal Matcher state
  const [learningGoal, setLearningGoal] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendationItem[]>([]);

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const verifiedTutors = useMemo(
    () => tutors.filter((t) => t.verificationStatus === 'verified'),
    [tutors]
  );

  const filteredTutors = useMemo(() => {
    return verifiedTutors.filter((t) => {
      const q = searchQuery.trim().toLowerCase();
      const matchesText =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.toLowerCase().includes(q)) ||
        t.bio.toLowerCase().includes(q);
      const matchesSubject =
        subject === 'الكل' || t.subject === subject || t.subjects.includes(subject);
      const matchesGrade = grade === 'الكل' || t.gradeLevels.includes(grade);
      const matchesCurriculum = curriculum === 'الكل' || t.curriculum === curriculum;
      const matchesGender = gender === 'الكل' || t.gender === gender;
      const matchesLanguage = language === 'الكل' || t.languages.includes(language);
      const matchesDay =
        dayFilter === 'الكل' || t.availableSlots.some((slot) => slot.includes(dayFilter));

      return (
        matchesText &&
        matchesSubject &&
        matchesGrade &&
        matchesCurriculum &&
        matchesGender &&
        matchesLanguage &&
        matchesDay
      );
    });
  }, [verifiedTutors, searchQuery, subject, grade, curriculum, gender, language, dayFilter]);

  const handleRunAiRecommend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learningGoal.trim()) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/recommend-tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learningGoal,
          gradeLevel: grade === 'الكل' ? '' : grade,
          curriculum: curriculum === 'الكل' ? '' : curriculum,
          preferredGender: gender === 'الكل' ? '' : gender,
          preferredLanguage: language === 'الكل' ? '' : language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAiError(data.error || 'تعذر تشغيل المطابقة الذكية');
      } else {
        setAiRecommendations(data.recommendations || []);
      }
    } catch {
      setAiError('تعذر الاتصال بالخادم، يرجى المحاولة مجدداً.');
    } finally {
      setAiLoading(false);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSubject('الكل');
    setGrade('الكل');
    setCurriculum('الكل');
    setGender('الكل');
    setLanguage('الكل');
    setDayFilter('الكل');
  };

  return (
    <div className="space-y-10">
      {/* Hero Split Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-emerald-800">
              <span>متوافقة مع متطلبات وزارة التعليم</span>
              <span aria-hidden="true">·</span>
              <span>مدرسون موثقو الشهادات فقط</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold tracking-tight text-slate-900 leading-[1.22] balance-text">
              ابحث عن مدرس خصوصي معتمد، واحجز حصتك في بيئة تعليمية موثوقة
            </h1>

            <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
              منصة موحّدة تربط الطلاب وأولياء الأمور بنخبة من المعلمين المجازين، مع جدولة ذكية
              تمنع تعارض المواعيد، ودفع آمن، وحضور مباشر عبر Microsoft Teams أو الفصل الافتراضي
              المدمج.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <a
                href="#smart-search"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0"
              >
                استعرض المدرسين المعتمدين
              </a>
              <button
                type="button"
                onClick={() => onToggleAiMatcher(!showAiMatcher)}
                className="px-5 py-2.5 text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>ترشيح مدرس حسب هدفك</span>
              </button>
            </div>

            {/* Active Client Tier Quick Selector */}
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span className="whitespace-nowrap">فئة الحساب:</span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(['Regular', 'Premium', 'Elite'] as ClientTier[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => onSwitchTier(tier)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeClientTier === tier
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hero Image Column */}
        <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 min-h-[280px]">
          {!imgErrors['hero'] ? (
            <img
              src="/src/assets/images/hero_tutoring_session_1794940122863.jpg"
              alt="جلسة تدريس خصوصي معتمدة بين معلمة وطالبة باستخدام الكتاب الرقمي"
              referrerPolicy="no-referrer"
              onError={() => setImgErrors((prev) => ({ ...prev, hero: true }))}
              className="w-full h-full lg:h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-100 to-emerald-50">
              <ShieldCheck className="w-12 h-12 text-emerald-700 mb-3" />
              <p className="text-sm font-semibold text-slate-800">تعليم خصوصي موثق ومعتمد</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/85 via-slate-950/45 to-transparent p-6 text-white">
            <p className="text-xs font-medium text-emerald-300 mb-1">
              اعتماد الشهادات · دعوات تقويم تلقائية
            </p>
            <p className="text-sm font-semibold leading-snug">
              باقات بالساعة، الأسبوع، الشهر، والفصل الدراسي الكامل مع خصم{' '}
              <span className="tabular-nums">
                {CLIENT_TIER_DETAILS[activeClientTier].discountPct}%
              </span>{' '}
              لحسابك ({activeClientTier})
            </p>
          </div>
        </div>
      </section>

      {/* 4-Column Proof & Mechanism Strip directly below Hero */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">التحقق من الاعتمادات</span>
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">100%</p>
          <p className="text-xs text-slate-600 mt-1">
            مراجعة الشهادات ورخص وزارة التعليم قبل تفعيل أي مدرس
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">شفافية العمولة والتسجيل</span>
            <UserCheck className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">10%</p>
          <p className="text-xs text-slate-600 mt-1">
            عمولة المنصة لكل حجز مكتمل · التسجيل الأولي للمدرسين مجاني
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">الفصول الافتراضية</span>
            <Video className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900">Teams أو مدمج</p>
          <p className="text-xs text-slate-600 mt-1">
            إنشاء روابط الاجتماعات وإرسال دعوات التقويم تلقائياً
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">جدولة ذكية بلا تعارض</span>
            <Calendar className="w-4 h-4 text-emerald-700" />
          </div>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {verifiedTutors.reduce((acc, t) => acc + t.availableSlots.length, 0)} موعد
          </p>
          <p className="text-xs text-slate-600 mt-1">
            مواعيد مفتوحة محدثة لحظياً ومنع تلقائي لتعارض الحجوزات
          </p>
        </div>
      </section>

      {/* AI Tutor Recommender Panel (Expandable) */}
      {showAiMatcher && (
        <section className="bg-white border border-emerald-200 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                المساعد الذكي لترشيح المدرس والباقة الأنسب
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                اكتب هدفك الدراسي (مثل: رفع درجة التحصيلي في الرياضيات والفيزياء قبل نهاية الفصل)
                وسيقترح المحرك أنسب المدرسين المعتمدين وأوقاتهم المتاحة.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleAiMatcher(false)}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
            >
              إغلاق
            </button>
          </div>

          <form onSubmit={handleRunAiRecommend} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              placeholder="مثال: أحتاج تقوية مكثفة في التفاضل والتكامل للصف الثالث الثانوي خلال 4 أسابيع"
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
            />
            <button
              type="submit"
              disabled={aiLoading || !learningGoal.trim()}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {aiLoading ? 'جاري التحليل...' : 'اقترح المدرسين الآن'}
            </button>
          </form>

          {aiError && (
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">
              {aiError}
            </div>
          )}

          {aiRecommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {aiRecommendations.map((rec) => {
                const matchedTutor = tutors.find((t) => t.id === rec.tutorId);
                return (
                  <div
                    key={rec.tutorId}
                    className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-xs text-emerald-800 font-semibold">
                        <span>توافق {rec.matchScore}%</span>
                        <span>{rec.suggestedSlot}</span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">{rec.tutorName}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{rec.reason}</p>
                      <p className="text-xs text-slate-700 font-medium pt-1">
                        التركيز المقترح: {rec.studyFocus}
                      </p>
                    </div>
                    {matchedTutor && (
                      <button
                        type="button"
                        onClick={() => onSelectTutor(matchedTutor)}
                        className="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      >
                        مقارنة الباقات وحجز {rec.suggestedSlot}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Smart Tutor Search & Filters */}
      <section id="smart-search" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">البحث الذكي عن المدرسين المعتمدين</h2>
            <p className="text-sm text-slate-600 mt-1">
              صفّ النتائج حسب المادة، المرحلة الدراسية، المنهج، الجنس، اللغة، والأوقات المتاحة.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="tabular-nums">عرض {filteredTutors.length} من {verifiedTutors.length} مدرس معتمد</span>
            <button
              type="button"
              onClick={resetFilters}
              className="text-emerald-800 hover:underline font-medium cursor-pointer"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-4 relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث بالاسم، المادة، القدرات، IELTS..."
                className="w-full pr-10 pl-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="المادة الدراسية"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
              >
                {SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    المادة: {s}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="المرحلة الدراسية"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    المرحلة: {g}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="المنهج"
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
              >
                {CURRICULA.map((c) => (
                  <option key={c} value={c}>
                    المنهج: {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                aria-label="الأوقات المتاحة"
                value={dayFilter}
                onChange={(e) => setDayFilter(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
              >
                {['الكل', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'السبت'].map((d) => (
                  <option key={d} value={d}>
                    اليوم: {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-600 font-medium">الجنس:</span>
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                  {['الكل', 'ذكر', 'أنثى'].map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        gender === g ? 'bg-white text-slate-900 font-semibold shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-600 font-medium">لغة التدريس:</span>
                <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg">
                  {['الكل', 'العربية', 'الإنجليزية'].map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                        language === lang
                          ? 'bg-white text-slate-900 font-semibold shadow-sm'
                          : 'text-slate-600'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <span className="text-slate-500">
              تطبق خصومات الفئة الحالية ({activeClientTier}) تلقائياً عند الحجز
            </span>
          </div>
        </div>

        {/* Tutors Catalog Grid */}
        {filteredTutors.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
            <p className="text-base font-semibold text-slate-900">
              لا يوجد مدرسون مطابقون لمعايير البحث الحالية
            </p>
            <p className="text-sm text-slate-600">
              جرّب توسيع خيارات المنهج أو اليوم المتاح، أو استخدم المطابقة الذكية بالذكاء الاصطناعي.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg cursor-pointer"
            >
              عرض جميع المدرسين المعتمدين
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutors.map((tutor) => {
              const showImage = tutor.avatar && !imgErrors[tutor.id];
              const initials = tutor.name
                .split(' ')
                .slice(0, 2)
                .map((p) => p[0])
                .join('');

              return (
                <article
                  key={tutor.id}
                  className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-4">
                    {/* Header row with portrait and clean unboxed metadata */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
                        {showImage ? (
                          <img
                            src={tutor.avatar}
                            alt={tutor.name}
                            referrerPolicy="no-referrer"
                            onError={() =>
                              setImgErrors((prev) => ({ ...prev, [tutor.id]: true }))
                            }
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-base font-bold text-slate-700">{initials}</span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">موثق · {tutor.ministryLicenseId}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 truncate">
                          {tutor.name}
                        </h3>
                        <p className="text-xs text-slate-500 truncate">
                          {tutor.subject} · {tutor.curriculum}
                        </p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600 leading-relaxed line-clamp-3">{tutor.bio}</p>

                    {/* Clean unboxed metadata separators */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <p className="truncate">
                        <span className="text-slate-400">المراحل:</span>{' '}
                        {tutor.gradeLevels.join(' · ')}
                      </p>
                      <p className="truncate">
                        <span className="text-slate-400">اللغات:</span>{' '}
                        {tutor.languages.join(' · ')} · {tutor.experienceYears} سنوات خبرة
                      </p>
                      <p className="truncate">
                        <span className="text-slate-400">الأوقات المتاحة:</span>{' '}
                        {tutor.availableSlots.length > 0
                          ? tutor.availableSlots.slice(0, 2).join(' · ') +
                            (tutor.availableSlots.length > 2
                              ? ` (+${tutor.availableSlots.length - 2})`
                              : '')
                          : 'محجوز بالكامل حالياً'}
                      </p>
                    </div>
                  </div>

                  {/* Footer pricing & action */}
                  <div className="mt-6 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-slate-700 font-medium">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="tabular-nums font-bold">{tutor.rating.toFixed(1)}</span>
                        <span className="text-slate-400 tabular-nums">({tutor.reviewCount})</span>
                      </div>
                      <p className="text-base font-bold text-slate-900 tabular-nums mt-0.5">
                        {tutor.hourlyRate} <span className="text-xs font-normal text-slate-500">ر.س / ساعة</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectTutor(tutor)}
                      className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      عرض الباقات والحجز
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
