import React, { useState, useEffect } from 'react';
import { WorkspaceConfig } from '../types';
import {
  X,
  Building2,
  Users,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  GitBranch,
  MessageSquare,
  Sparkles,
  Lock,
} from 'lucide-react';

interface WorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceConfig: WorkspaceConfig;
  onUpdateConfig: (updated: Partial<WorkspaceConfig>) => void;
}

export const WorkspaceModal: React.FC<WorkspaceModalProps> = ({
  isOpen,
  onClose,
  workspaceConfig,
  onUpdateConfig,
}) => {
  const [seats, setSeats] = useState(workspaceConfig.activeSeats);
  const [privacy, setPrivacy] = useState(workspaceConfig.privacySetting);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setSeats(workspaceConfig.activeSeats);
    setPrivacy(workspaceConfig.privacySetting);
  }, [isOpen, workspaceConfig.activeSeats, workspaceConfig.privacySetting]);

  if (!isOpen) return null;

  const monthlyPrice = seats * workspaceConfig.pricePerSeat;
  // ROI Math: Each engineer saves ~45 mins per day of context switching & standup typing
  // 45 mins * 20 working days = 15 hours saved per engineer/month. At $65/hr dev cost = $975 value/dev.
  const hoursSavedPerMonth = seats * 15;
  const estimatedSavings = hoursSavedPerMonth * 65;

  const handleSave = async () => {
    onUpdateConfig({
      activeSeats: seats,
      privacySetting: privacy,
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs" id="workspace-config-modal">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl flex flex-col shadow-2xl overflow-hidden text-slate-900">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/90">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                Workspace & B2B Seat Orchestration
              </h3>
              <p className="text-xs text-slate-500">
                {workspaceConfig.workspaceName}
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

        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[80vh] text-xs sm:text-sm">
          {/* B2B Pricing & Seat Tier Calculator */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-xl border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-mono uppercase text-indigo-600 font-bold">
                  B2B Subscription Model ($6 / seat / mo)
                </span>
                <h4 className="text-base font-bold text-slate-800 mt-0.5">
                  Seat Scaling & ROI Estimator
                </h4>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black font-mono text-emerald-600">
                  ${monthlyPrice}
                  <span className="text-xs text-slate-500 font-normal"> / month</span>
                </div>
                <span className="text-[11px] text-slate-500">
                  {seats} active distributed developers
                </span>
              </div>
            </div>

            {/* Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-600 font-medium">
                <span>Active Seats: <strong className="text-slate-900 font-mono">{seats} seats</strong></span>
                <span>$6 per seat</span>
              </div>
              <input
                type="range"
                min={5}
                max={250}
                step={1}
                value={seats}
                onChange={(e) => setSeats(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>5 seats (Small agency)</span>
                <span>50 seats (Mid-market)</span>
                <span>250 seats (Enterprise)</span>
              </div>
            </div>

            {/* Blue Ocean ROI Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">
                  Engineering Hours Reclaimed
                </span>
                <div className="text-lg font-bold text-slate-800 font-mono mt-0.5">
                  ~{hoursSavedPerMonth.toLocaleString()} hrs / mo
                </div>
                <span className="text-[11px] text-slate-400">
                  Eliminates manual standup typing & handoff lag
                </span>
              </div>
              <div>
                <span className="text-[11px] text-emerald-600 uppercase font-bold tracking-wider">
                  Net Monthly Velocity Value
                </span>
                <div className="text-lg font-bold text-emerald-600 font-mono mt-0.5">
                  +${estimatedSavings.toLocaleString()} / mo
                </div>
                <span className="text-[11px] text-slate-400">
                  {(estimatedSavings / (monthlyPrice || 1)).toFixed(0)}x ROI on subscription
                </span>
              </div>
            </div>
          </div>

          {/* Connected Integrations & Privacy Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Repositories */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <GitBranch className="w-4 h-4 text-sky-600" />
                <span>Connected Git Repositories</span>
              </div>
              <div className="space-y-1.5">
                {workspaceConfig.connectedRepositories.map((repo, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-xs font-mono text-slate-700"
                  >
                    <span>{repo}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-sans">Active</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Monitored Channels */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                <MessageSquare className="w-4 h-4 text-amber-600" />
                <span>Monitored Slack Channels</span>
              </div>
              <div className="space-y-1.5">
                {workspaceConfig.monitoredChannels.map((ch, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs bg-white px-3 py-2 rounded-lg border border-slate-200 shadow-xs font-mono text-slate-700"
                  >
                    <span>{ch}</span>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-sans">Listening</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Privacy Architecture */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>Enterprise Privacy & Zero-Code-Storage Guarantee</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              AsyncPulse processes only commit metadata, AST diff summaries, and PR comments. Raw proprietary codebase contents are never written to disk or used for public foundation model training.
            </p>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="privacy"
                  checked={privacy === 'metadata_and_diffs_only'}
                  onChange={() => setPrivacy('metadata_and_diffs_only')}
                  className="accent-indigo-600"
                />
                <span>Metadata & Diff Summaries (Recommended)</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer font-medium">
                <input
                  type="radio"
                  name="privacy"
                  checked={privacy === 'full_text_redacted'}
                  onChange={() => setPrivacy('full_text_redacted')}
                  className="accent-indigo-600"
                />
                <span>Strict PII Redacted Mode</span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="text-xs text-emerald-700 font-medium">
            {isSaved && <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Workspace updated</span>}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200 shadow-xs transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition"
            >
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
