import React, { useState } from 'react';
import { PassiveEvent, UrgencyLevel } from '../types';
import {
  Activity,
  GitCommit,
  GitPullRequest,
  MessageSquare,
  Cpu,
  Filter,
  Clock,
  Search,
  CheckCircle2,
  ExternalLink,
  Plus,
  Terminal,
  X,
} from 'lucide-react';

interface PassiveStreamFeedProps {
  events: PassiveEvent[];
  onOpenSimulateModal: () => void;
}

export const PassiveStreamFeed: React.FC<PassiveStreamFeedProps> = ({
  events,
  onOpenSimulateModal,
}) => {
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEvents = events.filter((e) => {
    if (sourceFilter !== 'all' && e.source !== sourceFilter) return false;
    if (urgencyFilter !== 'all' && e.urgency !== urgencyFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchSummary = e.summary.toLowerCase().includes(q);
      const matchDetails = e.details?.toLowerCase().includes(q) || false;
      const matchChannel = e.channelOrRepo.toLowerCase().includes(q);
      const matchAuthor = e.author.name.toLowerCase().includes(q);
      if (!matchSummary && !matchDetails && !matchChannel && !matchAuthor) return false;
    }
    return true;
  });

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'github_commit':
        return <GitCommit className="w-3.5 h-3.5 text-emerald-600" />;
      case 'github_pr':
        return <GitPullRequest className="w-3.5 h-3.5 text-sky-600" />;
      case 'slack':
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />;
      case 'discord':
        return <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />;
      case 'ci_cd':
        return <Cpu className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Activity className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getUrgencyBadge = (urgency: UrgencyLevel) => {
    switch (urgency) {
      case 'critical':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'warning':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'normal':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'low':
        return 'bg-slate-50 text-slate-500 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4" id="passive-stream-card">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Passive Signal Stream ("The Listening Radar")
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Zero-friction event listeners capturing PRs, CI failures, and architectural threads in real-time
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenSimulateModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-indigo-600" />
          <span>Ingest Test Signal</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Filter by summary, repo, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 focus:bg-white text-xs transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Source Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'All' },
            { id: 'ci_cd', label: 'CI/CD' },
            { id: 'github_pr', label: 'PRs' },
            { id: 'github_commit', label: 'Commits' },
            { id: 'slack', label: 'Slack' },
          ].map((src) => (
            <button
              key={src.id}
              type="button"
              onClick={() => setSourceFilter(src.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition ${
                sourceFilter === src.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/70'
              }`}
            >
              {src.label}
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>

          {/* Urgency Filter */}
          {[
            { id: 'all', label: 'All Urgencies' },
            { id: 'critical', label: 'Critical' },
            { id: 'warning', label: 'Warning' },
          ].map((urg) => (
            <button
              key={urg.id}
              type="button"
              onClick={() => setUrgencyFilter(urg.id)}
              className={`px-2 py-1 rounded-md text-xs font-medium transition ${
                urgencyFilter === urg.id
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              {urg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Signal Count Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
        <span>Showing {filteredEvents.length} of {events.length} ingested signals</span>
        <span className="font-mono">Real-time Kafka/Webhook sync</span>
      </div>

      {/* Stream List */}
      <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
        {filteredEvents.map((evt) => (
          <div
            key={evt.id}
            className="p-4 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-2xs transition text-xs space-y-2"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="p-1 rounded bg-slate-50 border border-slate-200">
                  {getSourceIcon(evt.source)}
                </div>
                <span className="font-mono text-slate-900 font-semibold text-xs">
                  {evt.channelOrRepo}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <img
                    src={evt.author.avatar}
                    alt={evt.author.name}
                    className="w-4 h-4 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {evt.author.name}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border capitalize font-mono ${getUrgencyBadge(
                    evt.urgency
                  )}`}
                >
                  {evt.urgency}
                </span>
                <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(evt.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <p className="font-semibold text-slate-900 text-sm">
                {evt.summary}
              </p>
              {evt.details && (
                <p className="text-slate-600 text-xs leading-relaxed font-mono bg-slate-50/80 p-3 rounded-lg border border-slate-200/70">
                  {evt.details}
                </p>
              )}
            </div>

            {/* Tags & Metadata Badges */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {evt.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-medium"
                >
                  #{tag}
                </span>
              ))}
              {evt.metadata?.commitHash && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-800 border border-slate-200">
                  git:{evt.metadata.commitHash}
                </span>
              )}
              {evt.metadata?.prNumber && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-50 text-sky-800 border border-sky-200">
                  PR #{evt.metadata.prNumber}
                </span>
              )}
              {evt.metadata?.threadReplies && (
                <span className="px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-200">
                  {evt.metadata.threadReplies} replies
                </span>
              )}
            </div>
          </div>
        ))}

        {filteredEvents.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">
            No signals matched the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};
