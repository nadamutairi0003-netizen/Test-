import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  MessageSquareText,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import type { ClientTier } from '../types';
import type { ActiveTab } from './TopBar';

interface ExecutedActionItem {
  type: 'booked_private' | 'enrolled_group' | 'switched_profile' | 'calculated_cost' | 'navigated';
  title: string;
  detail: string;
  bookingId?: string;
  finalPrice?: number;
  targetTab?: ActiveTab;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  actions?: ExecutedActionItem[];
  isError?: boolean;
}

interface FloatingAiAssistantProps {
  activeTab: ActiveTab;
  studentName: string;
  displayName?: string;
  activeClientTier: ClientTier;
  onNavigate: (tab: ActiveTab) => void;
  onRefresh: () => void;
}

const STARTER_PROMPTS = [
  'كم أسعار الكلاسات الجماعية والباقات الفردية؟',
  'احجز لي كلاس رياضيات جماعي الساعة 4 العصر يوم الجمعة',
  'احسب تكلفة الباقة الشهرية مع د. خالد الدوسري',
  'احجز لي درس فيزياء فردي مع أ. نورة السبيعي',
];

const buildWelcomeMessage = (personName: string): ChatMessage => ({
  id: 'welcome',
  role: 'model',
  text: `أهلاً بك يا ${personName}! أنا هنا للإجابة عن أي سؤال فوراً، حساب التكاليف بدقة، أو تنفيذ حجز حصتك الفردية أو الكلاس الجماعي مباشرة.`,
});

export const FloatingAiAssistant: React.FC<FloatingAiAssistantProps> = ({
  activeTab,
  studentName,
  displayName,
  activeClientTier,
  onNavigate,
  onRefresh,
}) => {
  const greetingName = (displayName || studentName).trim() || 'ضيفنا الكريم';
  const [isOpen, setIsOpen] = useState(false);
  const [dockSide, setDockSide] = useState<'left' | 'right'>('left');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [buildWelcomeMessage(greetingName)]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) => (m.id === 'welcome' ? buildWelcomeMessage(greetingName) : m))
    );
  }, [greetingName]);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  const sendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInputText('');
    setLoading(true);

    try {
      const apiMessages = nextHistory
        .filter((m) => m.id !== 'welcome' && !m.isError)
        .map((m) => ({ role: m.role, text: m.text }));

      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          currentPage: activeTab,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: 'model',
            text: data.error || 'تعذر تنفيذ الطلب عبر المساعد الذكي حالياً.',
            isError: true,
          },
        ]);
        return;
      }

      if (data.stateMutated) {
        onRefresh();
      }
      if (data.navigateTo) {
        onNavigate(data.navigateTo as ActiveTab);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `m-${Date.now()}`,
          role: 'model',
          text: data.reply,
          actions: data.executedActions || [],
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'model',
          text: 'تعذر الاتصال بالخادم، يرجى المحاولة مرة أخرى.',
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setMessages([buildWelcomeMessage(greetingName)]);
  };

  const positionClass = dockSide === 'left' ? 'left-4 sm:left-6' : 'right-4 sm:right-6';

  return (
    <div className={`fixed bottom-4 sm:bottom-6 ${positionClass} z-40`}>
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="فتح المساعد الذكي"
          className="flex items-center gap-2.5 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl shadow-lg border border-emerald-600 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <div className="text-right">
            <p className="text-xs font-bold leading-tight whitespace-nowrap">المساعد الذكي مُعتمَد</p>
            <p className="text-[10px] text-emerald-100 leading-tight whitespace-nowrap">
              اسأل · احسب التكلفة · احجز فوراً
            </p>
          </div>
        </button>
      ) : (
        <section
          aria-label="المساعد الذكي مُعتمَد"
          className="w-[360px] sm:w-[400px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-5rem)] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-emerald-900 text-white px-4 py-3 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center shrink-0">
                <MessageSquareText className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xs font-bold truncate">المساعد الذكي مُعتمَد</h2>
                <p className="text-[10px] text-emerald-200 truncate">
                  {studentName} · فئة {activeClientTier}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setDockSide(dockSide === 'left' ? 'right' : 'left')}
                title={dockSide === 'left' ? 'نقل النافذة لليمين' : 'نقل النافذة لليسار'}
                aria-label="تبديل جهة النافذة"
                className="p-1.5 rounded-lg text-emerald-100 hover:bg-emerald-800 hover:text-white cursor-pointer"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleReset}
                title="بدء محادثة جديدة"
                aria-label="محادثة جديدة"
                className="p-1.5 rounded-lg text-emerald-100 hover:bg-emerald-800 hover:text-white cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="تصغير المساعد"
                className="p-1.5 rounded-lg text-emerald-100 hover:bg-emerald-800 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-[#F6FAF8]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-start' : 'items-end'
                } space-y-1.5`}
              >
                <div
                  className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-emerald-700 text-white rounded-tr-sm'
                      : msg.isError
                      ? 'bg-red-50 border border-red-200 text-red-800 rounded-tl-sm'
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>

                {msg.actions && msg.actions.length > 0 && (
                  <div className="w-[88%] space-y-1.5">
                    {msg.actions.map((act, idx) => (
                      <div
                        key={`${msg.id}-act-${idx}`}
                        className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-start gap-2 min-w-0">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="font-bold text-emerald-950 truncate">{act.title}</p>
                            <p className="text-emerald-800 tabular-nums">{act.detail}</p>
                          </div>
                        </div>
                        {act.targetTab && (
                          <button
                            type="button"
                            onClick={() => onNavigate(act.targetTab!)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            عرض
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {messages.length === 1 && (
              <div className="pt-1 space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-500">أوامر وأسئلة سريعة:</p>
                <div className="flex flex-col gap-1.5">
                  {STARTER_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="text-right px-3 py-2 text-[11px] font-medium text-emerald-950 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl transition-colors cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loading && (
              <div className="flex justify-end">
                <div className="px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500">
                  جاري التفكير وتنفيذ طلبك...
                </div>
              </div>
            )}

            <div ref={endRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(inputText);
            }}
            className="p-2.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="اسأل عن الأسعار، المواعيد، أو اطلب الحجز..."
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-emerald-700"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              aria-label="إرسال"
              className="p-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-xl cursor-pointer shrink-0 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </section>
      )}
    </div>
  );
};
