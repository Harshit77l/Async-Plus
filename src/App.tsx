/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  HandoffBrief,
  ShiftWindow,
  PassiveEvent,
  WorkspaceConfig,
} from './types';
import { TimezoneRadar } from './components/TimezoneRadar';
import { HandoffBriefView } from './components/HandoffBriefView';
import { PassiveStreamFeed } from './components/PassiveStreamFeed';
import { ShiftBrainQA } from './components/ShiftBrainQA';
import { SimulateEventModal } from './components/SimulateEventModal';
import { WorkspaceModal } from './components/WorkspaceModal';
import { ExportModal } from './components/ExportModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import {
  FileText,
  Activity,
  Bot,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Clock,
  Layers,
  Radio,
} from 'lucide-react';

export default function App() {
  const [shiftWindows, setShiftWindows] = useState<ShiftWindow[]>([]);
  const [activeShift, setActiveShift] = useState<ShiftWindow | null>(null);
  const [currentBrief, setCurrentBrief] = useState<HandoffBrief | null>(null);
  const [passiveEvents, setPassiveEvents] = useState<PassiveEvent[]>([]);
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>({
    workspaceName: 'Acme Global Distributed Engineering',
    activeSeats: 48,
    pricePerSeat: 6,
    connectedRepositories: [
      'acme-corp/payment-orchestrator',
      'acme-corp/frontend-app',
      'acme-corp/infra-terraform',
    ],
    monitoredChannels: ['#eng-incidents', '#eng-architecture', '#deploy-alerts'],
    autoDigestCron: 'Every day at 18:00 PT',
    privacySetting: 'metadata_and_diffs_only',
  });

  const [activeTab, setActiveTab] = useState<'brief' | 'stream'>('brief');
  const [isLoading, setIsLoading] = useState(true);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Modals
  const [isShiftBrainOpen, setIsShiftBrainOpen] = useState(false);
  const [shiftBrainInitialQ, setShiftBrainInitialQ] = useState('');
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const notify = (title: string, description?: string, type?: 'success' | 'info' | 'warning') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, title, description, type }]);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Fetch
  const loadData = async () => {
    try {
      const [shiftsRes, streamRes, briefRes] = await Promise.all([
        fetch('/api/shifts'),
        fetch('/api/stream'),
        fetch('/api/handoff/latest'),
      ]);

      if (shiftsRes.ok) {
        const shiftsData = await shiftsRes.json();
        setShiftWindows(shiftsData.shiftWindows);
        if (!activeShift && shiftsData.shiftWindows.length > 0) {
          setActiveShift(shiftsData.shiftWindows[0]);
        }
        if (shiftsData.workspaces) {
          setWorkspaceConfig(shiftsData.workspaces);
        }
      }

      if (streamRes.ok) {
        const streamData = await streamRes.json();
        setPassiveEvents(streamData.events);
      }

      if (briefRes.ok) {
        const briefData = await briefRes.json();
        setCurrentBrief(briefData);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Shift Synthesis
  const handleSynthesize = async () => {
    if (!activeShift) return;
    setIsSynthesizing(true);
    try {
      const res = await fetch('/api/handoff/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shiftWindowId: activeShift.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentBrief(data.brief);
        notify('Brief Re-synthesized', `Updated digest for ${activeShift.name}`, 'success');
      }
    } catch (err) {
      console.error('Failed to synthesize handoff brief:', err);
      notify('Synthesis Failed', 'Could not refresh handoff brief', 'warning');
    } finally {
      setIsSynthesizing(false);
    }
  };

  // Checklist Item Toggle
  const handleToggleChecklist = async (id: string, completed: boolean) => {
    if (!currentBrief) return;
    // Optimistic update
    setCurrentBrief((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        oncomingActionChecklist: prev.oncomingActionChecklist.map((item) =>
          item.id === id ? { ...item, completed } : item
        ),
      };
    });

    try {
      await fetch(`/api/handoff/checklist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed }),
      });
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
    }
  };

  // Checklist Item Claim
  const handleClaimChecklist = async (id: string, claimedBy: string) => {
    if (!currentBrief) return;
    setCurrentBrief((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        oncomingActionChecklist: prev.oncomingActionChecklist.map((item) =>
          item.id === id ? { ...item, claimedBy } : item
        ),
      };
    });

    try {
      await fetch(`/api/handoff/checklist/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimedBy }),
      });
    } catch (err) {
      console.error('Failed to claim checklist item:', err);
    }
  };

  const handleOpenShiftBrain = (initialQ?: string) => {
    setShiftBrainInitialQ(initialQ || '');
    setIsShiftBrainOpen(true);
  };

  const handleWorkspaceUpdate = async (updated: Partial<WorkspaceConfig>) => {
    setWorkspaceConfig((prev) => ({ ...prev, ...updated }));
    try {
      await fetch('/api/workspaces', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error('Failed to update workspace:', err);
    }
  };

  if (isLoading || !activeShift) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-600 p-6 space-y-4">
        <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md animate-pulse">
          <Radio className="w-5 h-5 text-indigo-300" />
        </div>
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">AsyncPulse</h3>
          <p className="text-xs text-slate-400 font-medium">
            Connecting to cross-timezone telemetry pipelines...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white" id="async-pulse-app">
      {/* Live Timezone Radar & Global Actions Header */}
      <TimezoneRadar
        shiftWindows={shiftWindows}
        activeShift={activeShift}
        onSelectShift={(s) => {
          setActiveShift(s);
          notify('Corridor Switched', `Active handoff corridor: ${s.name}`, 'info');
          handleSynthesize();
        }}
        onSynthesize={handleSynthesize}
        isSynthesizing={isSynthesizing}
        onOpenSimulateModal={() => setIsSimulateOpen(true)}
        onOpenWorkspaceModal={() => setIsWorkspaceOpen(true)}
        onOpenExportModal={() => setIsExportOpen(true)}
      />

      {/* Modern Segmented Navigation Sub-bar */}
      <div className="border-b border-slate-200/90 bg-white/90 sticky top-0 z-30 backdrop-blur-md px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center justify-between py-2">
          <div className="flex items-center gap-1.5 bg-slate-100/90 p-1 rounded-xl border border-slate-200/80">
            <button
              type="button"
              id="tab-handoff-brief"
              onClick={() => setActiveTab('brief')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'brief'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Shift Handoff Brief</span>
              {currentBrief && currentBrief.immediateBlockers.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-mono font-bold">
                  {currentBrief.immediateBlockers.length}
                </span>
              )}
            </button>

            <button
              type="button"
              id="tab-passive-stream"
              onClick={() => setActiveTab('stream')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'stream'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Signal Stream</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200/80 text-slate-700 font-mono">
                {passiveEvents.length}
              </span>
            </button>
          </div>

          {/* Quick Floating Shift Brain Button */}
          <button
            type="button"
            id="btn-open-shift-brain"
            onClick={() => handleOpenShiftBrain()}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-indigo-200 transition shadow-2xs"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Ask Shift Brain</span>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-mono font-semibold">
              ⌘K
            </span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'brief' && currentBrief && (
          <HandoffBriefView
            brief={currentBrief}
            onToggleChecklist={handleToggleChecklist}
            onClaimChecklist={handleClaimChecklist}
            onOpenShiftBrain={handleOpenShiftBrain}
            onNotify={notify}
          />
        )}

        {activeTab === 'stream' && (
          <PassiveStreamFeed
            events={passiveEvents}
            onOpenSimulateModal={() => setIsSimulateOpen(true)}
          />
        )}
      </main>

      {/* Toast Notification Layer */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Modals & Drawers */}
      <ShiftBrainQA
        isOpen={isShiftBrainOpen}
        onClose={() => setIsShiftBrainOpen(false)}
        initialQuestion={shiftBrainInitialQ}
      />

      <SimulateEventModal
        isOpen={isSimulateOpen}
        onClose={() => setIsSimulateOpen(false)}
        onEventCreated={() => {
          loadData();
          handleSynthesize();
          notify('Signal Ingested', 'New telemetry event processed into shift brief', 'success');
        }}
      />

      <WorkspaceModal
        isOpen={isWorkspaceOpen}
        onClose={() => setIsWorkspaceOpen(false)}
        workspaceConfig={workspaceConfig}
        onUpdateConfig={(cfg) => {
          handleWorkspaceUpdate(cfg);
          notify('Workspace Saved', 'Autonomous ingest configuration updated', 'success');
        }}
      />

      {currentBrief && (
        <ExportModal
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          brief={currentBrief}
        />
      )}

      {/* Bottom Architectural Info Footer */}
      <footer className="border-t border-slate-200 py-4 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 bg-white/95">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 tracking-tight">AsyncPulse</span>
            <span>•</span>
            <span className="text-slate-500">Autonomous Cross-Timezone Engineering Synthesis</span>
            <span>•</span>
            <span className="text-emerald-700 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
              Live: GitHub, Slack, CI/CD
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Active Corridor: <strong className="text-slate-800 font-semibold">{activeShift.name}</strong></span>
            <span className="font-mono">Privacy: AST Diffs Only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
