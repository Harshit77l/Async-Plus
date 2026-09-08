import React, { useState, useEffect, useRef } from 'react';
import { ShiftQueryResponse } from '../types';
import {
  Sparkles,
  Send,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Quote,
  Loader2,
  X,
  Bot,
  Terminal,
  Code2,
} from 'lucide-react';

interface ShiftBrainQAProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuestion?: string;
}

export const ShiftBrainQA: React.FC<ShiftBrainQAProps> = ({
  isOpen,
  onClose,
  initialQuestion = '',
}) => {
  const [question, setQuestion] = useState(initialQuestion);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<Array<{ q: string; a: ShiftQueryResponse }>>([
    {
      q: 'What is the top blocker I should address as soon as I log in?',
      a: {
        answer:
          'The main branch CI pipeline is halted due to a Redis idempotency test timeout in cluster shard ap-south-1b. Elena investigated before logging off. Downstream PR merges are blocked until this shard is restarted or failed over to replica ap-south-1a.',
        citations: [
          {
            source: 'CI/CD: acme-corp/payment-orchestrator',
            snippet: 'ConnectionTimeoutError: Redis connection dropped after 3 retries in cluster shard ap-south-1b',
            timestamp: '28m ago',
          },
        ],
        suggestedNextStep: 'Check AWS ElastiCache ap-south-1b health or execute replica failover.',
      },
    },
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialQuestion) {
      setQuestion(initialQuestion);
    }
  }, [initialQuestion]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent, customQ?: string) => {
    if (e) e.preventDefault();
    const queryToSubmit = customQ || question;
    if (!queryToSubmit.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await fetch('/api/handoff/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryToSubmit }),
      });
      const data: ShiftQueryResponse = await res.json();
      setHistory((prev) => [...prev, { q: queryToSubmit, a: data }]);
      if (!customQ) setQuestion('');
    } catch (err) {
      console.error('Failed to query shift brain:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const sampleQuestions = [
    'Why did the Payment Gateway integration tests break?',
    'What is the status of PR #418 Stripe webhook hotfix?',
    'Are there any architecture decisions made on GraphQL vs REST?',
    'What are the strict rules for waking Elena overnight?',
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shift-brain-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs"
      id="shift-brain-modal"
    >
      <div className="bg-white border border-slate-200/90 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-slate-900">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="shift-brain-title" className="text-sm font-bold text-slate-900">
                  Shift Brain Assistant
                </h3>
                <span className="px-2 py-0.2 rounded text-[10px] bg-slate-100 text-slate-700 border border-slate-200 font-mono font-medium">
                  Autonomous Context
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect cross-timezone commit diffs, CI logs, or offcoming handover notes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm bg-white">
          {history.map((item, idx) => (
            <div key={idx} className="space-y-2.5">
              {/* Question bubble */}
              <div className="flex justify-end">
                <div className="max-w-[85%] bg-slate-900 text-white px-4 py-2.5 rounded-xl rounded-tr-none shadow-xs font-medium text-xs leading-relaxed">
                  {item.q}
                </div>
              </div>

              {/* Answer bubble */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg bg-slate-100 text-indigo-600 flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 bg-slate-50 p-4 rounded-xl rounded-tl-none border border-slate-200/80 space-y-3">
                  <p className="text-slate-800 leading-relaxed text-xs sm:text-sm font-normal">
                    {item.a.answer}
                  </p>

                  {/* Citations */}
                  {item.a.citations && item.a.citations.length > 0 && (
                    <div className="space-y-1.5 pt-2.5 border-t border-slate-200/80">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Telemetry Citations &amp; Traces:
                      </span>
                      {item.a.citations.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="bg-white p-2.5 rounded-lg border border-slate-200/90 text-xs flex items-start gap-2 shadow-2xs"
                        >
                          <Terminal className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-900">{c.source}</span>
                              <span className="text-slate-400 font-mono text-[10px]">
                                {c.timestamp}
                              </span>
                            </div>
                            <p className="text-slate-600 font-mono text-[11px] bg-slate-50 p-1.5 rounded border border-slate-100 mt-1">
                              {c.snippet}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Suggested Next Step Callout */}
                  {item.a.suggestedNextStep && (
                    <div className="p-2.5 rounded-lg bg-emerald-50/90 border border-emerald-200/80 text-xs flex items-center gap-2 text-emerald-900">
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>
                        <strong className="font-semibold">Recommended Action:</strong> {item.a.suggestedNextStep}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3 items-center text-slate-500 text-xs py-3">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Analyzing cross-timezone telemetry stream...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-1.5">
          <span className="text-[11px] text-slate-400 self-center mr-1 font-medium">Quick asks:</span>
          {sampleQuestions.map((sq, sIdx) => (
            <button
              key={sIdx}
              type="button"
              onClick={() => handleSubmit(undefined, sq)}
              className="text-[11px] px-2 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition truncate max-w-xs"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Query Input Form */}
        <form onSubmit={handleSubmit} className="p-3 sm:p-4 bg-white border-t border-slate-200 flex gap-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ask about PRs, CI failures, thread consensus, or offcoming notes... (Press Enter to ask)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-hidden focus:border-indigo-500 focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={!question.trim() || isLoading}
            className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs flex items-center gap-1.5 transition shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Ask</span>
          </button>
        </form>
      </div>
    </div>
  );
};
