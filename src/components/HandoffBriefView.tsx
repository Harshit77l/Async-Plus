import React, { useState } from 'react';
import { HandoffBrief, ActionChecklistItem, BlockerItem } from '../types';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  GitPullRequest,
  GitFork,
  MessageSquare,
  Clock,
  UserCheck,
  Shield,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  Copy,
  Check,
  Filter,
  Layers,
  ArrowUpRight,
  User,
  ListTodo,
  Terminal,
  Activity,
} from 'lucide-react';

interface HandoffBriefViewProps {
  brief: HandoffBrief;
  onToggleChecklist: (id: string, completed: boolean) => void;
  onClaimChecklist: (id: string, name: string) => void;
  onOpenShiftBrain: (initialQuestion?: string) => void;
  onNotify?: (title: string, description?: string, type?: 'success' | 'info' | 'warning') => void;
}

export const HandoffBriefView: React.FC<HandoffBriefViewProps> = ({
  brief,
  onToggleChecklist,
  onClaimChecklist,
  onOpenShiftBrain,
  onNotify,
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'blockers' | 'checklist' | 'code' | 'decisions'>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'P0' | 'P1'>('all');
  const [checklistFilter, setChecklistFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    if (onNotify) {
      onNotify(`Copied to clipboard`, label, 'success');
    }
    setTimeout(() => setCopiedId(null), 2000);
  };

  const completedTasksCount = brief.oncomingActionChecklist.filter((i) => i.completed).length;
  const totalTasksCount = brief.oncomingActionChecklist.length;
  const checklistCompletionPct = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const totalEstMinutes = brief.oncomingActionChecklist.reduce((acc, curr) => acc + curr.estimatedMinutes, 0);

  const filteredBlockers = brief.immediateBlockers.filter((b) => {
    if (severityFilter !== 'all' && b.severity !== severityFilter) return false;
    return true;
  });

  const filteredChecklist = brief.oncomingActionChecklist.filter((t) => {
    if (checklistFilter === 'pending' && t.completed) return false;
    if (checklistFilter === 'completed' && !t.completed) return false;
    return true;
  });

  // Health Score status descriptor
  const getHealthMeta = (score: number) => {
    if (score < 60) {
      return {
        label: 'Critical Triage',
        badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
        barColor: 'bg-rose-500',
        ringColor: '#f43f5e',
        desc: 'P0 blocker requires resolution before continuing code deployments.',
      };
    }
    if (score < 85) {
      return {
        label: 'Action Required',
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        barColor: 'bg-amber-500',
        ringColor: '#f59e0b',
        desc: 'Minor pipeline timeouts and waiting reviews require oncoming attention.',
      };
    }
    return {
      label: 'Optimal Health',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      barColor: 'bg-emerald-500',
      ringColor: '#10b981',
      desc: 'All branches merged cleanly with zero downstream pipeline impediments.',
    };
  };

  const healthMeta = getHealthMeta(brief.healthScore);

  return (
    <div className="space-y-6" id="handoff-brief-container">
      {/* Top HUD: High-Density Executive Command Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Pulse Health Score */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-tight">Shift Health Index</span>
            <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${healthMeta.badgeBg}`}>
              {healthMeta.label}
            </span>
          </div>

          <div className="flex items-baseline gap-3 my-3">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {brief.healthScore}%
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {brief.totalSignalsAnalyzed} signals analyzed
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${healthMeta.barColor}`}
              style={{ width: `${brief.healthScore}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Active Blockers */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-tight">Immediate Blockers</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 font-mono">
              {brief.immediateBlockers.filter(b => b.severity === 'P0').length} P0 Active
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-3">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {brief.immediateBlockers.length}
            </span>
            <span className="text-xs text-slate-500">
              {brief.immediateBlockers.length === 1 ? 'blocker halts main' : 'blockers halt main'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setActiveSection(activeSection === 'blockers' ? 'all' : 'blockers')}
            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 flex items-center justify-between pt-1 border-t border-slate-100 transition"
          >
            <span>{activeSection === 'blockers' ? 'View all sections' : 'Filter to blockers'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* KPI 3: Action Checklist Progress */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-tight">First 2 Hours Action Plan</span>
            <span className="text-[11px] font-mono text-slate-500 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
              ~{totalEstMinutes}m work
            </span>
          </div>

          <div className="flex items-baseline gap-2 my-3">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {completedTasksCount}/{totalTasksCount}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Done ({checklistCompletionPct}%)
            </span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${checklistCompletionPct}%` }}
            />
          </div>
        </div>

        {/* KPI 4: Sleep Safeguard */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 tracking-tight">Sleep Safeguard</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Guarded
            </span>
          </div>

          <div className="my-3">
            <div className="text-sm font-bold text-slate-800 truncate">
              {brief.sleepSafeGuards.offcomingEmergencyLead}
            </div>
            <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>🌙 Deep Sleep</span>
              <span>•</span>
              <span className="font-mono font-medium text-slate-700">Wakes {brief.sleepSafeGuards.wakingTime}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>Escalation:</span>
            <span className="font-semibold text-rose-600">P0 Outage Only</span>
          </div>
        </div>
      </div>

      {/* Brief Header & Executive Transition Summary */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono text-indigo-600 font-semibold">SYNTHESIS BRIEF #{brief.id.slice(-6)}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(brief.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} UTC
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
              {brief.shiftTitle}
            </h2>
          </div>

          {/* Quick interactive Shift Brain query pill */}
          <button
            type="button"
            onClick={() => onOpenShiftBrain()}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50/80 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 transition shadow-xs self-start sm:self-auto"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Shift Brain AI</span>
          </button>
        </div>

        {/* Executive Summary Narrative */}
        <div className="mt-4">
          <p className="text-slate-700 text-sm leading-relaxed">
            {brief.executiveSummary}
          </p>
        </div>

        {/* Interactive Query Prompts Strip */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px]">
            <HelpCircle className="w-3.5 h-3.5 text-indigo-500" />
            Quick Queries:
          </span>
          <button
            type="button"
            onClick={() => onOpenShiftBrain('What caused the Redis CI failure and what is the fix?')}
            className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition text-[11px] font-medium"
          >
            "Why did Redis CI fail?"
          </button>
          <button
            type="button"
            onClick={() => onOpenShiftBrain('Can I merge PR #418 Stripe webhook hotfix?')}
            className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition text-[11px] font-medium"
          >
            "Can I merge PR #418 hotfix?"
          </button>
          <button
            type="button"
            onClick={() => onOpenShiftBrain('What are the strict criteria to wake Elena?')}
            className="px-2.5 py-1 rounded-md bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition text-[11px] font-medium"
          >
            "When can I page Elena?"
          </button>
        </div>
      </div>

      {/* Section View Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-100/70 p-1.5 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeSection === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Brief Sections
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('blockers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeSection === 'blockers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Immediate Blockers</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-rose-50 text-rose-700 border border-rose-200">
              {brief.immediateBlockers.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('checklist')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeSection === 'checklist'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Action Checklist</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-200 text-slate-700">
              {completedTasksCount}/{totalTasksCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('code')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeSection === 'code'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Code Velocity & PRs
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('decisions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
              activeSection === 'decisions'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Slack Decisions
          </button>
        </div>

        {/* Section-Specific Filter Toolbars */}
        {activeSection === 'blockers' && (
          <div className="flex items-center gap-1 self-end sm:self-auto text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Severity:</span>
            {(['all', 'P0', 'P1'] as const).map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  severityFilter === sev
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {sev === 'all' ? 'All' : sev}
              </button>
            ))}
          </div>
        )}

        {activeSection === 'checklist' && (
          <div className="flex items-center gap-1 self-end sm:self-auto text-xs">
            <span className="text-slate-400 text-[11px] font-medium mr-1">Filter:</span>
            {(['all', 'pending', 'completed'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setChecklistFilter(f)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize transition ${
                  checklistFilter === f
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SECTION: Immediate Blockers */}
      {(activeSection === 'all' || activeSection === 'blockers') && (
        <section aria-labelledby="heading-blockers" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
              <h3 id="heading-blockers" className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                Immediate Blockers for Oncoming Shift ({filteredBlockers.length})
              </h3>
            </div>
            <span className="text-xs font-mono text-rose-600 font-semibold">
              Resolve prior to branching new PRs
            </span>
          </div>

          {filteredBlockers.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-700">No active blockers match this filter.</p>
              <p className="text-xs text-slate-400 mt-0.5">All tracked downstream services are operational.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {filteredBlockers.map((blocker: BlockerItem) => (
                <div
                  key={blocker.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition hover:border-slate-300"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                            blocker.severity === 'P0'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {blocker.severity} Critical
                        </span>
                        <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {blocker.repoOrChannel}
                        </span>
                        <span className="text-xs text-slate-500">
                          Lead / Context: <strong className="text-slate-800 font-semibold">{blocker.culpritOrLead}</strong>
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 tracking-tight">
                        {blocker.title}
                      </h4>

                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                        {blocker.description}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-start">
                      <button
                        type="button"
                        onClick={() => onOpenShiftBrain(`How do I resolve blocker "${blocker.title}" in ${blocker.repoOrChannel}?`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200/80 transition shadow-xs"
                        title="Query Shift Brain about this issue"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Diagnose</span>
                      </button>

                      {blocker.ticketLink && (
                        <a
                          href={blocker.ticketLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition border border-slate-200 shadow-xs"
                          title="Open Build or Ticket Log"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* High-visibility Action Directive Grid */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50/80 p-3 rounded-lg border border-slate-100">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                        Downstream Impact
                      </span>
                      <p className="text-slate-700 font-medium leading-relaxed">{blocker.impact}</p>
                    </div>

                    <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100/70">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
                          Recommended Oncoming Action
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(blocker.recommendedAction, blocker.id, 'Action command')}
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium transition"
                        >
                          {copiedId === blocker.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-indigo-950 font-semibold leading-relaxed">{blocker.recommendedAction}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* SECTION: First 2 Hours Action Plan */}
      {(activeSection === 'all' || activeSection === 'checklist') && (
        <section aria-labelledby="heading-checklist" className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-600"></div>
              <h3 id="heading-checklist" className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                First 2 Hours Action Checklist
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {completedTasksCount} of {totalTasksCount} completed ({checklistCompletionPct}%)
            </span>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/90 divide-y divide-slate-100 shadow-xs overflow-hidden">
            {filteredChecklist.map((task: ActionChecklistItem) => (
              <div
                key={task.id}
                className={`p-4 transition-colors ${
                  task.completed ? 'bg-slate-50/50 opacity-70' : 'bg-white hover:bg-slate-50/40'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      onToggleChecklist(task.id, !task.completed);
                      if (onNotify) {
                        onNotify(
                          task.completed ? 'Task marked pending' : 'Task marked completed',
                          task.title,
                          'info'
                        );
                      }
                    }}
                    className="mt-0.5 shrink-0 text-slate-400 hover:text-indigo-600 transition"
                    title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
                  >
                    {task.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 border-slate-300 hover:border-indigo-600 flex items-center justify-center text-[10px] font-bold text-slate-500 bg-white shadow-2xs">
                        {task.priority}
                      </div>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <h4
                        className={`text-sm font-semibold tracking-tight ${
                          task.completed ? 'line-through text-slate-400' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </h4>

                      <div className="flex items-center gap-2 text-xs shrink-0">
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-mono text-[11px]">
                          ~{task.estimatedMinutes}m
                        </span>

                        {task.claimedBy ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" />
                            {task.claimedBy}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              onClaimChecklist(task.id, 'Arjun V. (You)');
                              if (onNotify) {
                                onNotify('Task Claimed', `You claimed "${task.title}"`, 'success');
                              }
                            }}
                            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200/60 transition"
                          >
                            + Claim
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {task.contextNotes}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Two-Column Grid: Code Velocity + Slack Decisions & Sleep */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Code Velocity & PR Status (6 cols) */}
        {(activeSection === 'all' || activeSection === 'code') && (
          <section className={`${activeSection === 'code' ? 'lg:col-span-12' : 'lg:col-span-6'} space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-sky-500"></div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                  Code Velocity & PR Radar
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {brief.codeVelocity.commitsCount} Commits Tracked
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
              {/* PRs Needing Review */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <GitFork className="w-3.5 h-3.5 text-amber-500" />
                  <span>Awaiting Oncoming Review ({brief.codeVelocity.prsNeedsReview.length})</span>
                </div>
                <div className="space-y-2">
                  {brief.codeVelocity.prsNeedsReview.map((pr) => (
                    <div
                      key={pr.number}
                      className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 text-xs space-y-1.5 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 truncate">
                          #{pr.number} {pr.title}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                          Review Needed
                        </span>
                      </div>
                      <div className="text-slate-500 flex items-center justify-between text-[11px]">
                        <span>Author: <strong className="text-slate-700 font-medium">{pr.author}</strong></span>
                        <button
                          type="button"
                          onClick={() => handleCopy(`git checkout pr-${pr.number}`, `pr-${pr.number}`, `git checkout pr-${pr.number}`)}
                          className="font-mono text-indigo-600 hover:text-indigo-800 flex items-center gap-1 text-[10px]"
                          title="Copy Git checkout command"
                        >
                          {copiedId === `pr-${pr.number}` ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="text-emerald-700">Copied</span>
                            </>
                          ) : (
                            <>
                              <Terminal className="w-3 h-3" />
                              <span>checkout pr-{pr.number}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Merged PRs */}
              <div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <GitMerge className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Merged While You Slept ({brief.codeVelocity.prsMerged.length})</span>
                </div>
                <div className="space-y-2">
                  {brief.codeVelocity.prsMerged.map((pr) => (
                    <div
                      key={pr.number}
                      className="p-3 rounded-lg bg-slate-50/50 border border-slate-100 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-800 truncate">
                          #{pr.number} {pr.title}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                          Merged
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{pr.impact}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stalled Branches */}
              {brief.codeVelocity.stalledBranches.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider mb-1.5">
                    Stalled Branches
                  </div>
                  {brief.codeVelocity.stalledBranches.map((stalled, idx) => (
                    <div key={idx} className="text-xs text-slate-600 flex items-center justify-between py-0.5">
                      <span className="font-mono text-slate-800 font-semibold">{stalled.branch}</span>
                      <span className="text-slate-400 text-[11px]">Owner: {stalled.owner}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* Right Column: Slack Decisions & Sleep Safeguards (6 cols) */}
        {(activeSection === 'all' || activeSection === 'decisions') && (
          <section className={`${activeSection === 'decisions' ? 'lg:col-span-12' : 'lg:col-span-6'} space-y-6`}>
            {/* Architectural Decisions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                    Slack Decisions & Architecture Debates
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Recorded Async</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                {brief.keyDecisionsAndDiscussions.map((decision, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-200/80 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900">{decision.topic}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          decision.consensusReached
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {decision.consensusReached ? 'Consensus Reached' : 'Debate Ongoing'}
                      </span>
                    </div>

                    <p className="text-slate-600 leading-relaxed">{decision.decisionSummary}</p>

                    {decision.unresolvedQuestions.length > 0 && (
                      <div className="bg-amber-50/60 p-2.5 rounded-md border border-amber-200/70">
                        <span className="text-amber-900 font-semibold block text-[11px] mb-1">
                          Open Questions for Next Shift:
                        </span>
                        <ul className="list-disc list-inside text-slate-700 space-y-0.5 text-[11px]">
                          {decision.unresolvedQuestions.map((q, qIdx) => (
                            <li key={qIdx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>Channel: <strong className="text-slate-600 font-medium">{decision.channel}</strong></span>
                      <span>By: {decision.participants.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sleep Safeguards Card */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight uppercase">
                    Sleep Safeguard & Escalation Policy
                  </h3>
                </div>
                <span className="text-xs text-emerald-700 font-semibold">Protected Hours</span>
              </div>

              <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-3 text-xs">
                <div className="flex items-center justify-between bg-slate-50/80 p-3 rounded-lg border border-slate-200/80">
                  <div>
                    <span className="text-slate-400 text-[11px] block">Offcoming Lead:</span>
                    <strong className="text-slate-900 text-sm font-semibold">{brief.sleepSafeGuards.offcomingEmergencyLead}</strong>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[11px] block">Expected Waking Time:</span>
                    <span className="font-mono text-amber-800 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-xs">
                      {brief.sleepSafeGuards.wakingTime}
                    </span>
                  </div>
                </div>

                <div className="bg-rose-50/40 p-3 rounded-lg border border-rose-100 space-y-1">
                  <span className="font-bold text-rose-700 uppercase tracking-wider text-[10px] block">
                    Escalation Threshold:
                  </span>
                  <p className="text-slate-700 leading-relaxed text-[11px]">
                    {brief.sleepSafeGuards.escalationCriteria}
                  </p>
                  <div className="pt-1.5 text-[11px] text-slate-500 border-t border-rose-100 flex items-center justify-between">
                    <span>Emergency Pager:</span>
                    <span className="font-mono text-slate-800 font-semibold">{brief.sleepSafeGuards.emergencyContact}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenShiftBrain('Is there any issue urgent enough to trigger the sleep escalation policy right now?')}
                  className="w-full py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium flex items-center justify-center gap-2 border border-slate-200 transition text-xs"
                >
                  <Shield className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Verify Escalation with Shift Brain AI</span>
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
