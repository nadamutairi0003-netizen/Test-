import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Heart,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
} from 'lucide-react';
import type {
  ActiveUserProfile,
  AiRecommendationItem,
  ClientTier,
  GroupClassSession,
  GroupFixedSlotTime,
  LearningTrack,
  Tutor,
} from '../types';
import { DAILY_GROUP_FIXED_TIMES } from '../utils/pricing';

interface HeroAndSearchProps {
  tutors: Tutor[];
  groupClasses: GroupClassSession[];
  favoriteTutorIds: string[];
  activeClientTier: ClientTier;
  activeUser?: ActiveUserProfile;
  onSelectTutor: (tutor: Tutor) => void;
  onSelectGroupClass: (groupClass: GroupClassSession) => void;
  onToggleFavorite: (tutorId: string) => void;
  onSwitchTier: (tier: ClientTier) => void;
  onOpenAuth: () => void;
  showAiMatcher: boolean;
  onToggleAiMatcher: (open: boolean) => void;
}

const TRACK_CONFIG: Record<
  LearningTrack,
  {
    title: string;
    subtitle: string;
    quickSubjects: string[];
    aiPlaceholder: string;
  }
> = {
  'المراحل الدراسية': {
    title: 'المراحل الدراسية',
    subtitle: 'الابتدائي والمتوسط والثانوي لجميع المناهج',
    quickSubjects: [
      'الكل',
      'الرياضيات',
      'الفيزياء',
      'اللغة الإنجليزية',
      'اللغة العربية',
      'الكيمياء والأحياء',
      'الحاسب والبرمجة',
    ],
    aiPlaceholder: 'مثال: تقوية في الرياضيات للثانوية المنهج السعودي',
  },
  قياس: {
    title: 'اختبارات قياس',
    subtitle: 'القدرات العامة، التحصيلي، وSTEP',
    quickSubjects: [
      'الكل',
      'القدرات العامة',
      'التحصيلي الكمي',
      'التحصيلي العلمي',
      'القدرات اللفظي',
      'STEP قياس',
    ],
    aiPlaceholder: 'مثال: رفع درجتي في القدرات الكمي أو التحصيلي العلمي',
  },
  'المرحلة الجامعية': {
    title: 'المرحلة الجامعية',
    subtitle: 'السنة التحضيرية ومواد التخصص الجامعي',
    quickSubjects: [
      'الكل',
      'التفاضل والتكامل الجامعي',
      'هياكل البيانات الجامعية',
      'البرمجة ببايثون',
      'الإنجليزية الأكاديمية',
      'IELTS',
    ],
    aiPlaceholder: 'مثال: شرح التفاضل والتكامل الجامعي أو البرمجة ببايثون',
  },
};

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

const CITIES = ['الكل', 'الرياض', 'جدة', 'الخبر', 'الدمام'];

export const HeroAndSearch: React.FC<HeroAndSearchProps> = ({
  tutors,
  groupClasses,
  favoriteTutorIds,
  activeClientTier,
  activeUser,
  onSelectTutor,
  onSelectGroupClass,
  onToggleFavorite,
  onSwitchTier,
  onOpenAuth,
  showAiMatcher,
  onToggleAiMatcher,
}) => {
  const [selectedTrack, setSelectedTrack] = useState<LearningTrack | 'الكل'>(
    activeUser?.preferredTrack || 'المراحل الدراسية'
  );
  const [browseMode, setBrowseMode] = useState<'all' | 'group' | 'private'>('all');
  const [selectedGroupSubject, setSelectedGroupSubject] = useState<string>('الكل');
  const [selectedGroupTime, setSelectedGroupTime] = useState<GroupFixedSlotTime | 'الكل'>('الكل');
  const [showAllGroupClasses, setShowAllGroupClasses] = useState(false);
  React.useEffect(() => {
    if (activeUser?.signedIn && activeUser.preferredTrack) {
      setSelectedTrack(activeUser.preferredTrack);
    }
  }, [activeUser?.signedIn, activeUser?.preferredTrack]);
  const [searchQuery, setSearchQuery] = useState('');
  const [subject, setSubject] = useState('الكل');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [grade, setGrade] = useState('الكل');
  const [curriculum, setCurriculum] = useState('الكل');
  const [city, setCity] = useState('الكل');
  const [gender, setGender] = useState('الكل');
  const [language, setLanguage] = useState('الكل');
  const [onlyFavorites, setOnlyFavorites] = useState(false);

  const [learningGoal, setLearningGoal] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AiRecommendationItem[]>([]);

  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const verifiedTutors = useMemo(
    () => tutors.filter((t) => t.verificationStatus === 'verified'),
    [tutors]
  );

  const trackCounts = useMemo(() => {
    const counts: Record<LearningTrack, number> = {
      'المراحل الدراسية': 0,
      قياس: 0,
      'المرحلة الجامعية': 0,
    };
    verifiedTutors.forEach((t) => {
      (t.learningTracks || []).forEach((tr) => {
        if (counts[tr] !== undefined) counts[tr] += 1;
      });
    });
    return counts;
  }, [verifiedTutors]);

  const handleSelectTrack = (track: LearningTrack | 'الكل') => {
    setSelectedTrack(track);
    setSubject('الكل');
    setGrade('الكل');
    if (track !== 'المراحل الدراسية') {
      setCurriculum('الكل');
    }
  };

  const filteredTutors = useMemo(() => {
    return verifiedTutors.filter((t) => {
      const matchesTrack =
        selectedTrack === 'الكل' || (t.learningTracks || []).includes(selectedTrack);
      const q = searchQuery.trim().toLowerCase();
      const matchesText =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.subjects.some((s) => s.toLowerCase().includes(q));
      const matchesSubject =
        subject === 'الكل' || t.subject === subject || t.subjects.includes(subject);
      const matchesGrade = grade === 'الكل' || t.gradeLevels.includes(grade);
      const matchesCurriculum = curriculum === 'الكل' || t.curriculum === curriculum;
      const matchesCity = city === 'الكل' || t.city === city;
      const matchesGender = gender === 'الكل' || t.gender === gender;
      const matchesLanguage = language === 'الكل' || t.languages.includes(language);
      const matchesFavorite = !onlyFavorites || favoriteTutorIds.includes(t.id);

      return (
        matchesTrack &&
        matchesText &&
        matchesSubject &&
        matchesGrade &&
        matchesCurriculum &&
        matchesCity &&
        matchesGender &&
        matchesLanguage &&
        matchesFavorite
      );
    });
  }, [
    verifiedTutors,
    selectedTrack,
    searchQuery,
    subject,
    grade,
    curriculum,
    city,
    gender,
    language,
    onlyFavorites,
    favoriteTutorIds,
  ]);

  const groupSubjectsList = useMemo(
    () => ['الكل', ...Array.from(new Set(groupClasses.map((gc) => gc.subject)))],
    [groupClasses]
  );

  const filteredGroupClasses = useMemo(() => {
    return groupClasses.filter((gc) => {
      const matchesSubject =
        selectedGroupSubject === 'الكل' || gc.subject === selectedGroupSubject;
      const matchesTime = selectedGroupTime === 'الكل' || gc.fixedTimeSlot === selectedGroupTime;
      return matchesSubject && matchesTime;
    });
  }, [groupClasses, selectedGroupSubject, selectedGroupTime]);

  const visibleGroupClasses = useMemo(() => {
    if (
      selectedGroupSubject === 'الكل' &&
      selectedGroupTime === 'الكل' &&
      !showAllGroupClasses &&
      filteredGroupClasses.length > 6
    ) {
      return filteredGroupClasses.slice(0, 6);
    }
    return filteredGroupClasses;
  }, [filteredGroupClasses, selectedGroupSubject, selectedGroupTime, showAllGroupClasses]);

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
          selectedTrack: selectedTrack === 'الكل' ? '' : selectedTrack,
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
    setSelectedTrack('الكل');
    setSearchQuery('');
    setSubject('الكل');
    setGrade('الكل');
    setCurriculum('الكل');
    setCity('الكل');
    setGender('الكل');
    setLanguage('الكل');
    setOnlyFavorites(false);
  };

  const activeTrackMeta = selectedTrack !== 'الكل' ? TRACK_CONFIG[selectedTrack] : null;
  const quickSubjects = activeTrackMeta
    ? activeTrackMeta.quickSubjects
    : [
        'الكل',
        'الرياضيات',
        'الفيزياء',
        'اللغة الإنجليزية',
        'اللغة العربية',
        'الكيمياء والأحياء',
        'الحاسب والبرمجة',
      ];

  const activeExtraFilterCount =
    [grade, curriculum, city, gender, language].filter((v) => v !== 'الكل').length +
    (onlyFavorites ? 1 : 0);

  return (
    <div className="space-y-8">
      {/* Creative Blue Architectural Hero */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-3xl p-6 sm:p-9 flex flex-col justify-between shadow-xs">
          <div className="space-y-4">
            <p className="text-xs font-semibold text-emerald-700">
              متوافقة مع وزارة التعليم · مدرسون موثقون · Teams وفصل افتراضي مدمج
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-950 leading-[1.25] balance-text">
              تعلّم مع <span className="text-emerald-700">مدرسين معتمدين</span> وفق مسارك وجدولك الذكي
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-xl">
              اختر المسار المناسب لك، ثم احجز في الكلاسات الجماعية اليومية المخفضة أو مع مدرس خصوصي
              فردي طوال الأسبوع بضغطة زر.
            </p>

            {/* 3-step micro architecture strip */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <p className="text-[11px] font-bold text-emerald-800">01. طوال الأسبوع</p>
                <p className="text-[11px] text-slate-600 mt-0.5">حصص من الأحد إلى السبت</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <p className="text-[11px] font-bold text-emerald-800">02. كلاسات جماعية</p>
                <p className="text-[11px] text-slate-600 mt-0.5">3 مواعيد يومياً · أوفر 70%</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <p className="text-[11px] font-bold text-emerald-800">03. تقارير ذكية</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Teams + ملخص ولي الأمر</p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenAuth}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                {activeUser?.signedIn ? `حسابي: ${activeUser.fullName}` : 'التسجيل والدخول'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setBrowseMode('group');
                  document.getElementById('group-classes')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-4 py-2.5 text-sm font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer"
              >
                الكلاسات الجماعية (من 39 ر.س)
              </button>
              <button
                type="button"
                onClick={() => onToggleAiMatcher(!showAiMatcher)}
                className="px-4 py-2.5 text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>مطابقة ذكية</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>فئة حسابك:</span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                {(['Regular', 'Premium', 'Elite'] as ClientTier[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => onSwitchTier(tier)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                      activeClientTier === tier
                        ? 'bg-white text-emerald-800 shadow-sm font-semibold'
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

        <div className="lg:col-span-5 relative rounded-3xl overflow-hidden border border-slate-200 bg-slate-950 min-h-[280px]">
          {!imgErrors['hero'] ? (
            <img
              src="/src/assets/images/hero_tutoring_session_1794940122863.jpg"
              alt="جلسة تدريس خصوصي معتمدة"
              referrerPolicy="no-referrer"
              onError={() => setImgErrors((prev) => ({ ...prev, hero: true }))}
              className="w-full h-full lg:h-full object-cover opacity-90"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-gradient-to-br from-slate-950 via-emerald-950 to-emerald-800 text-white">
              <ShieldCheck className="w-10 h-10 text-emerald-300 mb-2" />
              <p className="text-sm font-semibold">تعليم خصوصي موثق ومعتمد</p>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-emerald-950/30 to-transparent pointer-events-none" />
          <div className="absolute bottom-5 inset-x-5 text-white flex items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-emerald-300">جاهزية فورية للحصص الافتراضية</p>
              <p className="text-sm font-bold leading-snug">
                ربط مباشر مع Microsoft Teams ودعوات التقويم
              </p>
            </div>
            <div className="text-left shrink-0">
              <p className="text-xl font-bold tabular-nums text-emerald-300">{verifiedTutors.length}</p>
              <p className="text-[11px] text-slate-300">مدرس معتمد</p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Matcher */}
      {showAiMatcher && (
        <section className="bg-white border border-emerald-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                المساعد الذكي لاقتراح المدرس الأنسب
              </h2>
              <p className="text-xs text-slate-600">
                اكتب هدفك باختصار ليقترح لك الذكاء الاصطناعي أفضل المدرسين المتاحين في مسارك.
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

          <form onSubmit={handleRunAiRecommend} className="flex flex-col sm:flex-row gap-2.5">
            <input
              type="text"
              value={learningGoal}
              onChange={(e) => setLearningGoal(e.target.value)}
              placeholder={
                activeTrackMeta
                  ? activeTrackMeta.aiPlaceholder
                  : 'اكتب هدفك الدراسي (مثل: تقوية في الرياضيات أو قدرات)...'
              }
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
            />
            <button
              type="submit"
              disabled={aiLoading || !learningGoal.trim()}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg cursor-pointer whitespace-nowrap"
            >
              {aiLoading ? 'جاري الترشيح...' : 'اقترح الآن'}
            </button>
          </form>

          {aiError && (
            <p className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-800">
              {aiError}
            </p>
          )}

          {aiRecommendations.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {aiRecommendations.map((rec) => {
                const matchedTutor = tutors.find((t) => t.id === rec.tutorId);
                return (
                  <div
                    key={rec.tutorId}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold">
                        <span>توافق {rec.matchScore}%</span>
                        <span>{rec.suggestedSlot}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{rec.tutorName}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed">{rec.reason}</p>
                    </div>
                    {matchedTutor && (
                      <button
                        type="button"
                        onClick={() => onSelectTutor(matchedTutor)}
                        className="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-emerald-700 rounded-lg cursor-pointer"
                      >
                        عرض الباقات والحجز
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Step 1: Track Picker + Learning Mode Switcher */}
      <section id="track-step" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">1. اختر المسار ونوع التعلم</h2>
          <button
            type="button"
            onClick={() => handleSelectTrack('الكل')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
              selectedTrack === 'الكل'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            }`}
          >
            جميع المسارات ({verifiedTutors.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(
            [
              { key: 'المراحل الدراسية' as LearningTrack, icon: BookOpen },
              { key: 'قياس' as LearningTrack, icon: Award },
              { key: 'المرحلة الجامعية' as LearningTrack, icon: GraduationCap },
            ] as const
          ).map(({ key, icon: Icon }) => {
            const cfg = TRACK_CONFIG[key];
            const isActive = selectedTrack === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelectTrack(key)}
                className={`p-5 rounded-xl border text-right transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                  isActive
                    ? 'bg-emerald-50/60 border-emerald-700'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-emerald-700' : 'text-slate-600'
                      }`}
                    />
                    <span className="text-base font-bold text-slate-900">{cfg.title}</span>
                  </div>
                  <p className="text-xs text-slate-600">{cfg.subtitle}</p>
                </div>
                <span className="text-xs font-semibold text-emerald-800 tabular-nums shrink-0">
                  {trackCounts[key]} مدرس
                </span>
              </button>
            );
          })}
        </div>

        {/* Clean Mode Switcher so user can jump straight to Group Classes or Private Tutors */}
        <div className="bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap items-center gap-1.5">
          {(
            [
              { id: 'all', label: `عرض الكل (${groupClasses.length} كلاس + ${filteredTutors.length} مدرس)` },
              { id: 'group', label: 'كلاسات جماعية يومية (أوفر من الفردي)' },
              { id: 'private', label: 'دروس فردية خاصة 1-1' },
            ] as const
          ).map((mode) => (
            <button
              key={mode.id}
              type="button"
              onClick={() => setBrowseMode(mode.id)}
              className={`flex-1 min-w-[180px] px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                browseMode === mode.id
                  ? 'bg-emerald-700 text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </section>

      {/* Step 2: Daily Fixed-Time Group Classes (All Subjects · 3 Fixed Slots · 7 Days/Week · Lower Cost) */}
      {browseMode !== 'private' && (
        <section id="group-classes" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                الكلاسات الجماعية اليومية{' '}
                <span className="text-sm font-normal text-emerald-800">
                  (3 مواعيد ثابتة يومياً · طوال الأسبوع)
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                اختر المادة ثم اختر الوقت المناسب لك (4:00 م · 7:00 م · 9:30 م) من الأحد إلى السبت.
              </p>
            </div>

            {/* 3 Fixed Daily Time Slots */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedGroupTime('الكل')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedGroupTime === 'الكل'
                    ? 'bg-white text-emerald-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                كل الأوقات ({filteredGroupClasses.length})
              </button>
              {DAILY_GROUP_FIXED_TIMES.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  onClick={() => setSelectedGroupTime(slot.time)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedGroupTime === slot.time
                      ? 'bg-white text-emerald-900 shadow-sm font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {slot.periodLabel} · {slot.time}
                </button>
              ))}
            </div>
          </div>

          {/* Single Clear Subject Bar */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {groupSubjectsList.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  setSelectedGroupSubject(sub);
                  setShowAllGroupClasses(false);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  selectedGroupSubject === sub
                    ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {sub === 'الكل' ? `كل المواد (${groupClasses.length})` : sub}
              </button>
            ))}
          </div>

        {visibleGroupClasses.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
            لا توجد كلاسات جماعية مطابقة لاختيارك حالياً.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {visibleGroupClasses.map((gc) => {
                const seatsLeft = Math.max(0, gc.maxSeats - gc.enrolledCount);
                const savePct = Math.round(
                  ((gc.privateHourlyRate - gc.groupPricePerSession) /
                    Math.max(1, gc.privateHourlyRate)) *
                    100
                );

                return (
                  <article
                    key={gc.id}
                    className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-300 transition-colors"
                  >
                    <div className="space-y-2.5">
                      <p className="text-[11px] font-semibold text-emerald-800">
                        {gc.subject} · {gc.fixedTimeSlot} يومياً · {gc.learningTrack}
                      </p>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{gc.title}</h3>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {gc.description}
                      </p>
                      <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                        <p>
                          المدرس: <span className="font-semibold text-slate-800">{gc.tutorName}</span>
                        </p>
                        <p className="tabular-nums">
                          {gc.scheduleLabel} · متاح {seatsLeft} من {gc.maxSeats} مقعد
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold text-emerald-800 tabular-nums">
                            {gc.groupPricePerSession} ر.س
                          </span>
                          <span className="text-[11px] text-slate-400 line-through tabular-nums">
                            {gc.privateHourlyRate} ر.س
                          </span>
                          <span className="text-[11px] font-semibold text-emerald-700 tabular-nums">
                            وفر {savePct}%
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          أو 7 أيام متواصلة بـ {gc.weeklyPassPrice} ر.س
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={seatsLeft === 0}
                        onClick={() => onSelectGroupClass(gc)}
                        className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {seatsLeft === 0 ? 'مكتمل' : 'حجز مقعد'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {selectedGroupSubject === 'الكل' &&
              selectedGroupTime === 'الكل' &&
              filteredGroupClasses.length > 6 && (
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => setShowAllGroupClasses(!showAllGroupClasses)}
                    className="px-4 py-2 text-xs font-semibold text-emerald-900 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg cursor-pointer"
                  >
                    {showAllGroupClasses
                      ? 'عرض مختصر (6 كلاسات)'
                      : `عرض جميع الكلاسات اليومية لكل المواد (${filteredGroupClasses.length})`}
                  </button>
                </div>
              )}
          </div>
        )}
        </section>
      )}

      {/* Step 3: Search + Quick Subject Tabs + Collapsible Extra Filters */}
      {browseMode !== 'group' && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">
              الدروس الفردية مع المدرسين المعتمدين{' '}
              <span className="text-sm font-normal text-slate-500 tabular-nums">
                ({filteredTutors.length} مدرس معتمد · طوال الأسبوع الأحد - السبت)
              </span>
            </h2>
          {(searchQuery || subject !== 'الكل' || activeExtraFilterCount > 0) && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs font-medium text-emerald-800 hover:underline cursor-pointer"
            >
              مسح الفلاتر
            </button>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث باسم المدرس أو المادة..."
                className="w-full pr-10 pl-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>
                فلاتر إضافية{activeExtraFilterCount > 0 ? ` (${activeExtraFilterCount})` : ''}
              </span>
              {showMoreFilters ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {quickSubjects.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => setSubject(sub)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  subject === sub
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>

          {showMoreFilters && (
            <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
              <select
                aria-label="المدينة"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    المدينة: {c}
                  </option>
                ))}
              </select>

              <select
                aria-label="المرحلة"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                {GRADES.map((g) => (
                  <option key={g} value={g}>
                    المرحلة: {g}
                  </option>
                ))}
              </select>

              <select
                aria-label="المنهج"
                value={curriculum}
                onChange={(e) => setCurriculum(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                {CURRICULA.map((c) => (
                  <option key={c} value={c}>
                    المنهج: {c}
                  </option>
                ))}
              </select>

              <select
                aria-label="الجنس"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="الكل">الجنس: الكل</option>
                <option value="ذكر">ذكر</option>
                <option value="أنثى">أنثى</option>
              </select>

              <select
                aria-label="اللغة"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg"
              >
                <option value="الكل">اللغة: الكل</option>
                <option value="العربية">العربية</option>
                <option value="الإنجليزية">الإنجليزية</option>
              </select>

              <button
                type="button"
                onClick={() => setOnlyFavorites(!onlyFavorites)}
                className={`px-3 py-2 text-xs font-medium rounded-lg border cursor-pointer flex items-center justify-center gap-1.5 ${
                  onlyFavorites
                    ? 'bg-emerald-50 border-emerald-700 text-emerald-900'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${onlyFavorites ? 'fill-emerald-700' : ''}`} />
                <span>المفضلة فقط</span>
              </button>
            </div>
          )}
        </div>

        {/* Clean Tutor Cards */}
        {filteredTutors.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <p className="text-sm font-semibold text-slate-900">
              لا يوجد مدرسون مطابقون لبحثك الحالي
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg cursor-pointer"
            >
              عرض جميع المدرسين
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTutors.map((tutor) => {
              const showImage = tutor.avatar && !imgErrors[tutor.id];
              const initials = tutor.name
                .split(' ')
                .slice(0, 2)
                .map((p) => p[0])
                .join('');
              const isFav = favoriteTutorIds.includes(tutor.id);
              const isFullyBooked = tutor.availableSlots.length === 0;

              return (
                <article
                  key={tutor.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-300 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center">
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
                            <span className="text-sm font-bold text-slate-700">{initials}</span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              معتمد · {tutor.city} · {tutor.ministryLicenseId}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-slate-900 truncate mt-0.5">
                            {tutor.name}
                          </h3>
                          <p className="text-xs text-slate-500 truncate">
                            {tutor.subject} · {tutor.curriculum}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onToggleFavorite(tutor.id)}
                        aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 cursor-pointer shrink-0"
                      >
                        <Heart
                          className={`w-4 h-4 ${isFav ? 'text-emerald-700 fill-emerald-700' : ''}`}
                        />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{tutor.bio}</p>

                    <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                      <p className="truncate">
                        المسارات: {(tutor.learningTracks || []).join(' · ')}
                      </p>
                      <p className={isFullyBooked ? 'text-amber-700 font-semibold' : 'text-slate-600'}>
                        {isFullyBooked
                          ? 'الجدول: محجوز بالكامل حالياً (Fully Booked)'
                          : `الجدول: متاح ${tutor.availableSlots.length} أوقات (من ${tutor.dailyCapacityHours} س/يوم)`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-1 text-xs text-slate-700">
                        <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                        <span className="font-bold tabular-nums">{tutor.rating.toFixed(1)}</span>
                        <span className="text-slate-400 tabular-nums">({tutor.reviewCount})</span>
                      </div>
                      <p className="text-sm font-bold text-slate-900 tabular-nums mt-0.5">
                        {tutor.hourlyRate} ر.س / ساعة
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onSelectTutor(tutor)}
                      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                        isFullyBooked
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-slate-900 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {isFullyBooked ? 'عرض التفاصيل' : 'الباقات والحجز'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </section>
      )}
    </div>
  );
};
