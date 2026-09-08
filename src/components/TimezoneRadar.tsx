import React, { useState, useEffect } from 'react';
import { ShiftWindow } from '../types';
import {
  Clock,
  Sparkles,
  Send,
  Settings2,
  PlusCircle,
  Moon,
  Sun,
  ArrowRight,
  Radio,
  Globe2,
  Zap,
} from 'lucide-react';

interface TimezoneRadarProps {
  shiftWindows: ShiftWindow[];
  activeShift: ShiftWindow;
  onSelectShift: (shift: ShiftWindow) => void;
  onSynthesize: () => void;
  isSynthesizing: boolean;
  onOpenSimulateModal: () => void;
  onOpenWorkspaceModal: () => void;
  onOpenExportModal: () => void;
}

export const TimezoneRadar: React.FC<TimezoneRadarProps> = ({
  shiftWindows,
  activeShift,
  onSelectShift,
  onSynthesize,
  isSynthesizing,
  onOpenSimulateModal,
  onOpenWorkspaceModal,
  onOpenExportModal,
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimezone = (timeZone: string) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).format(currentTime);
    } catch {
      return '--:--:--';
    }
  };

  const ptTime = formatTimezone('America/Los_Angeles');
  const istTime = formatTimezone('Asia/Kolkata');
  const gmtTime = formatTimezone('Europe/London');

  return (
    <header className="bg-white/95 border-b border-slate-200 text-slate-900 backdrop-blur-md" id="timezone-radar-header">
      {/* Top Bar: Brand, Corridor Sync, & Global Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3.5">
        {/* Brand & Active Status */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs ring-2 ring-indigo-200/80">
            <Radio className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold tracking-tight text-slate-900">
                AsyncPulse
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Ingestion
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Autonomous Cross-Timezone Engineering Handoff
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            type="button"
            id="btn-simulate-event"
            onClick={onOpenSimulateModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Simulate Signal</span>
          </button>

          <button
            type="button"
            id="btn-export-brief"
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition"
          >
            <Send className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dispatch Brief</span>
          </button>

          <button
            type="button"
            id="btn-workspace-config"
            onClick={onOpenWorkspaceModal}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs transition"
          >
            <Settings2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Workspace</span>
          </button>

          <button
            type="button"
            id="btn-synthesize-ai"
            disabled={isSynthesizing}
            onClick={onSynthesize}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-indigo-700 text-white shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className={`w-3.5 h-3.5 text-indigo-200 ${isSynthesizing ? 'animate-spin' : ''}`} />
            <span>{isSynthesizing ? 'Synthesizing...' : 'Re-synthesize'}</span>
          </button>
        </div>
      </div>

      {/* Corridor & World Clock Ribbon */}
      <div className="bg-slate-50/90 border-t border-slate-200 px-4 sm:px-6 lg:px-8 py-2">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          {/* Shift Corridor Switcher */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Corridor:
            </span>
            <div className="flex gap-1 bg-slate-200/60 p-0.5 rounded-lg border border-slate-200">
              {shiftWindows.map((shift) => (
                <button
                  key={shift.id}
                  id={`shift-tab-${shift.id}`}
                  onClick={() => onSelectShift(shift)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                    activeShift.id === shift.id
                      ? 'bg-white text-slate-900 font-semibold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {shift.fromRegion.split(' ')[0]} → {shift.toRegion.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Timezone Clocks & Golden Overlap Window */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            {/* San Francisco Offcoming Clock */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200/90 shadow-2xs">
              <Moon className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-slate-500 font-medium text-[11px]">SF (PT):</span>
              <span className="font-mono text-slate-900 font-bold text-xs">{ptTime}</span>
              <span className="text-[10px] text-slate-400 font-medium ml-0.5">Offcoming</span>
            </div>

            <ArrowRight className="w-3 h-3 text-slate-300 hidden sm:block" />

            {/* Bengaluru Oncoming Clock */}
            <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200/90 shadow-2xs">
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-slate-500 font-medium text-[11px]">BLR (IST):</span>
              <span className="font-mono text-slate-900 font-bold text-xs">{istTime}</span>
              <span className="text-[10px] text-amber-700 font-medium ml-0.5">Oncoming</span>
            </div>

            {/* London Clock */}
            <div className="hidden xl:flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-md border border-slate-200/90 text-slate-600 shadow-2xs">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-slate-500 text-[11px]">LON:</span>
              <span className="font-mono text-slate-800 font-medium text-xs">{gmtTime}</span>
            </div>

            {/* Golden Overlap Countdown Pill */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50/90 border border-emerald-200 text-emerald-900 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-medium text-emerald-800 text-[11px]">Overlap:</span>
              <span className="font-mono font-bold text-emerald-700 text-xs">
                {activeShift.overlapMinutesRemaining}m left
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
