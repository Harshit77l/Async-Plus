import React, { useState } from 'react';
import { HandoffBrief } from '../types';
import { X, Send, Copy, Check, MessageSquare, ExternalLink, Sparkles } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  brief: HandoffBrief;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  brief,
}) => {
  const [copied, setCopied] = useState(false);
  const [dispatched, setDispatched] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState('#eng-handoffs-apac');
  const [isDispatching, setIsDispatching] = useState(false);

  if (!isOpen) return null;

  const generateMarkdown = () => {
    return `### ⚡ AsyncPulse: Cross-Timezone Handoff Brief
**Corridor:** ${brief.shiftTitle}
**Generated:** ${new Date(brief.generatedAt).toLocaleString()} | **Shift Health:** ${brief.healthScore}/100 (${brief.healthStatus})

---
#### 📋 Executive Summary
${brief.executiveSummary}

---
#### 🚨 Immediate Blockers (${brief.immediateBlockers.length})
${
  brief.immediateBlockers.length === 0
    ? '* ✅ No active blockers - all systems operating smoothly.'
    : brief.immediateBlockers
        .map(
          (b) => `* **[${b.severity}] ${b.title}** (${b.repoOrChannel})
  * Culprit/Context: ${b.culpritOrLead}
  * Root cause: ${b.description}
  * **Oncoming Action:** ${b.recommendedAction}`
        )
        .join('\n\n')
}

---
#### 🎯 Oncoming First 2 Hours Checklist
${
  brief.oncomingActionChecklist.length === 0
    ? '* ✅ Checklist clear.'
    : brief.oncomingActionChecklist
        .map(
          (t) =>
            `- [${t.completed ? 'x' : ' '}] (P${t.priority}) **${t.title}** (~${t.estimatedMinutes}m) - Assigned: ${
              t.claimedBy || t.assignedTo || 'Unassigned'
            }`
        )
        .join('\n')
}

---
#### 🔀 Code Velocity & PR Status
* **Commits Ingested:** ${brief.codeVelocity.commitsCount}
* **Merged Today:** ${brief.codeVelocity.prsMerged.length > 0 ? brief.codeVelocity.prsMerged.map((p) => `#${p.number} (${p.title})`).join(', ') : 'None'}
* **Needs Review:** ${
  brief.codeVelocity.prsNeedsReview.length > 0
    ? '\n  * ' + brief.codeVelocity.prsNeedsReview.map((p) => `#${p.number} (${p.title}) - waiting on ${p.waitingOn}`).join('\n  * ')
    : 'None'
}

---
#### 🛡️ Sleep Safeguard
* **Offcoming Lead:** ${brief.sleepSafeGuards.offcomingEmergencyLead}
* **Expected Awake:** ${brief.sleepSafeGuards.wakingTime}
* **Escalation Threshold:** ${brief.sleepSafeGuards.escalationCriteria}
`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDispatchSlack = async () => {
    setIsDispatching(true);
    try {
      await fetch('/api/handoff/export-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: selectedChannel,
          message: generateMarkdown(),
        }),
      });
      setDispatched(true);
      setTimeout(() => setDispatched(false), 3000);
    } catch (err) {
      console.error('Failed to dispatch webhook:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" id="export-modal">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Export & Dispatch Handoff Brief
              </h3>
              <p className="text-xs text-slate-500">
                Broadcast synthesized brief to Slack channels or copy Markdown
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] text-xs">
          {/* Dispatch Channel Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="font-bold text-slate-800 block">Slack Broadcast Target</span>
                <span className="text-slate-500 text-[11px]">Direct automated webhook integration</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 text-xs focus:outline-hidden focus:border-indigo-500 shadow-xs"
              >
                <option value="#eng-handoffs-apac">#eng-handoffs-apac</option>
                <option value="#eng-general">#eng-general</option>
                <option value="#dev-alerts">#dev-alerts</option>
                <option value="#incident-war-room">#incident-war-room</option>
              </select>

              <button
                type="button"
                onClick={handleDispatchSlack}
                disabled={isDispatching}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                {dispatched ? <Check className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
                <span>{dispatched ? 'Dispatched!' : 'Broadcast Now'}</span>
              </button>
            </div>
          </div>

          {/* Markdown Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">
                Formatted Markdown Preview
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard' : 'Copy Raw Markdown'}</span>
              </button>
            </div>
            <pre className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 font-mono text-[11px] leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-80 select-all shadow-2xs">
              {generateMarkdown()}
            </pre>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-medium border border-slate-200 shadow-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
