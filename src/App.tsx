/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { CertificationAndRoadmap } from './components/CertificationAndRoadmap';
import { HeroAndSearch } from './components/HeroAndSearch';
import { StudentPortal } from './components/StudentPortal';
import { TopBar, type ActiveTab } from './components/TopBar';
import { TutorBookingModal } from './components/TutorBookingModal';
import { TutorPortal } from './components/TutorPortal';
import { VirtualClassroomModal } from './components/VirtualClassroomModal';
import type { Booking, ClientTier, PlatformState, Tutor } from './types';

export default function App() {
  const [state, setState] = useState<PlatformState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('search');
  const [showAiMatcher, setShowAiMatcher] = useState(false);
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [classroomBooking, setClassroomBooking] = useState<Booking | null>(null);

  const fetchBootstrap = useCallback(async () => {
    try {
      const res = await fetch('/api/bootstrap');
      if (!res.ok) {
        throw new Error('تعذر تحميل بيانات المنصة');
      }
      const data = (await res.json()) as PlatformState;
      setState(data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBootstrap();
  }, [fetchBootstrap]);

  const handleSwitchTier = async (tier: ClientTier) => {
    const res = await fetch('/api/client-tier', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    });
    if (res.ok) {
      setState((prev) => (prev ? { ...prev, activeClientTier: tier } : prev));
    }
  };

  const handleOpenAiMatcher = () => {
    setActiveTab('search');
    setShowAiMatcher(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Keep selectedTutor synced when reviews or slots update
  const currentSelectedTutor = selectedTutor
    ? state?.tutors.find((t) => t.id === selectedTutor.id) || selectedTutor
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A]">
      <TopBar
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenAiMatcher={handleOpenAiMatcher}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {loading ? (
          <div className="space-y-6">
            <div className="h-72 bg-white border border-slate-200 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  className="h-28 bg-white border border-slate-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>
        ) : error || !state ? (
          <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-3">
            <p className="text-base font-bold text-red-800">{error || 'تعذر تحميل المنصة'}</p>
            <button
              type="button"
              onClick={fetchBootstrap}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg cursor-pointer"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'search' && (
              <HeroAndSearch
                tutors={state.tutors}
                activeClientTier={state.activeClientTier}
                onSelectTutor={(tutor) => setSelectedTutor(tutor)}
                onSwitchTier={handleSwitchTier}
                showAiMatcher={showAiMatcher}
                onToggleAiMatcher={setShowAiMatcher}
              />
            )}

            {activeTab === 'student' && (
              <StudentPortal
                studentName={state.studentName}
                activeClientTier={state.activeClientTier}
                bookings={state.bookings}
                assignments={state.assignments}
                transactions={state.transactions}
                notifications={state.notifications}
                onSwitchTier={handleSwitchTier}
                onEnterClassroom={(booking) => setClassroomBooking(booking)}
                onRefresh={fetchBootstrap}
              />
            )}

            {activeTab === 'tutor' && (
              <TutorPortal
                tutors={state.tutors}
                bookings={state.bookings}
                onRefresh={fetchBootstrap}
                onEnterClassroom={(booking) => setClassroomBooking(booking)}
              />
            )}

            {activeTab === 'roadmap' && (
              <CertificationAndRoadmap
                applications={state.applications}
                activeClientTier={state.activeClientTier}
                onSwitchTier={handleSwitchTier}
                onRefresh={fetchBootstrap}
              />
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <span className="font-bold text-slate-900">مُعتمَد</span>
            <span aria-hidden="true">·</span>
            <span>منصة الدروس الخصوصية المعتمدة والمتوافقة مع متطلبات وزارة التعليم</span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setActiveTab('search')}
              className="hover:text-slate-900 cursor-pointer"
            >
              المدرسون المعتمدون
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('student')}
              className="hover:text-slate-900 cursor-pointer"
            >
              بوابة الطالب
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tutor')}
              className="hover:text-slate-900 cursor-pointer"
            >
              بوابة المدرس
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('roadmap')}
              className="hover:text-slate-900 cursor-pointer"
            >
              التحقق وخارطة الطريق
            </button>
          </div>
        </div>
      </footer>

      {currentSelectedTutor && state && (
        <TutorBookingModal
          tutor={currentSelectedTutor}
          reviews={state.reviews}
          activeClientTier={state.activeClientTier}
          defaultStudentName={state.studentName}
          onClose={() => setSelectedTutor(null)}
          onBooked={fetchBootstrap}
          onReviewAdded={fetchBootstrap}
        />
      )}

      {classroomBooking && (
        <VirtualClassroomModal
          booking={classroomBooking}
          onClose={() => setClassroomBooking(null)}
        />
      )}
    </div>
  );
}
