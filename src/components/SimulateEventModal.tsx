import React, { useState } from 'react';
import { X, Sparkles, AlertTriangle, GitCommit, GitPullRequest, MessageSquare, Cpu } from 'lucide-react';

interface SimulateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: () => void;
}

export const SimulateEventModal: React.FC<SimulateEventModalProps> = ({
  isOpen,
  onClose,
  onEventCreated,
}) => {
  const [source, setSource] = useState<'ci_cd' | 'github_pr' | 'github_commit' | 'slack'>('ci_cd');
  const [channelOrRepo, setChannelOrRepo] = useState('acme-corp/identity-service');
  const [authorName, setAuthorName] = useState('DevOps Sentinel');
  const [authorRole, setAuthorRole] = useState('Automated Security Scanner');
  const [summary, setSummary] = useState(
    '🚨 OAuth Token Revocation test suite failed in identity-service CI'
  );
  const [details, setDetails] = useState(
    'Redis cluster key expiry mock timed out after 30s. 8 downstream security assertions failed. PR #512 cannot merge.'
  );
  const [urgency, setUrgency] = useState<'critical' | 'warning' | 'normal'>('critical');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const presets = [
    {
      name: 'CI Build Crash (P0)',
      source: 'ci_cd' as const,
      channelOrRepo: 'acme-corp/identity-service',
      authorName: 'github-actions[bot]',
      authorRole: 'CI/CD Pipeline',
      summary: '🚨 Main branch build failure: Database migration lock in identity-service',
      details: 'Alembic migration failed with DeadlockDetectedError on table user_sessions. Staging deploys halted.',
      urgency: 'critical' as const,
    },
    {
      name: 'PR Blocked on Review (P1)',
      source: 'github_pr' as const,
      channelOrRepo: 'acme-corp/payment-orchestrator',
      authorName: 'Alex Mercer',
      authorRole: 'Staff Security Engineer',
      summary: 'PR #421 blocked: Requires APAC lead confirmation on raw card tokenization cipher',
      details: 'Left 4 inline comments requesting AES-256-GCM verification before merging to main.',
      urgency: 'warning' as const,
    },
    {
      name: 'Slack Urgent Incident (P0)',
      source: 'slack' as const,
      channelOrRepo: '#eng-incidents',
      authorName: 'David Chen',
      authorRole: 'SRE On-Call',
      summary: 'Kafka consumer lag spike > 45,000 unhandled events on checkout topic',
      details: 'Consumer pods hitting OOMKilled in cluster us-west-2. Replicas increased to 8, but need APAC morning team to monitor.',
      urgency: 'critical' as const,
    },
  ];

  const applyPreset = (p: typeof presets[0]) => {
    setSource(p.source);
    setChannelOrRepo(p.channelOrRepo);
    setAuthorName(p.authorName);
    setAuthorRole(p.authorRole);
    setSummary(p.summary);
    setDetails(p.details);
    setUrgency(p.urgency);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetch('/api/stream/simulate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source,
          sourceName:
            source === 'ci_cd'
              ? 'GitHub Actions'
              : source === 'github_pr'
              ? 'GitHub PR'
              : source === 'github_commit'
              ? 'Git Commit'
              : 'Slack Thread',
          channelOrRepo,
          authorName,
          authorRole,
          summary,
          details,
          urgency,
          tags: ['simulated-signal', urgency],
        }),
      });
      onEventCreated();
      onClose();
    } catch (err) {
      console.error('Failed to simulate event:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" id="simulate-event-modal">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl flex flex-col shadow-2xl overflow-hidden text-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div>
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <span>Simulate Passive Shift Telemetry</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-sky-50 text-sky-700 border border-sky-200 font-semibold">
                Passive Radar
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Inject a simulated Git commit, PR blocker, or Slack alert to watch AsyncPulse auto-synthesize it
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500 font-semibold">Quick Presets:</span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => applyPreset(preset)}
              className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs transition font-medium"
            >
              {preset.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Signal Source</label>
              <select
                value={source}
                onChange={(e: any) => setSource(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs transition"
              >
                <option value="ci_cd">CI / CD Pipeline (GitHub Actions)</option>
                <option value="github_pr">GitHub Pull Request Review</option>
                <option value="github_commit">Git Commit Push</option>
                <option value="slack">Slack / Discord Channel</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Urgency / Severity</label>
              <select
                value={urgency}
                onChange={(e: any) => setUrgency(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs transition"
              >
                <option value="critical">🚨 Critical (P0 Immediate Blocker)</option>
                <option value="warning">⚠️ Warning (P1 Required Action)</option>
                <option value="normal">Normal (Velocity Signal)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Channel or Repository</label>
              <input
                type="text"
                value={channelOrRepo}
                onChange={(e) => setChannelOrRepo(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs transition"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Author Name & Role</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Event Summary</label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-xs transition"
              required
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Detailed Technical Context</label>
            <textarea
              rows={3}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono text-xs shadow-xs transition"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium border border-slate-200 shadow-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs transition disabled:opacity-50"
            >
              {isSubmitting ? 'Ingesting...' : 'Ingest Signal & Re-evaluate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
