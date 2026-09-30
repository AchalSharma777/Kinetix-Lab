import React, { useState } from 'react';
import { PerformanceEntry } from '../types/engineering';
import { AlertTriangle, TrendingUp, TrendingDown, GitCommit, FlaskConical } from 'lucide-react';

interface PerformanceTrajectoryChartProps {
  entries: PerformanceEntry[];
  selectedEntryId: string;
  onSelectEntry: (id: string) => void;
}

type MetricChannel = 'performanceScore' | 'controlLoopLatencyMs' | 'trackingRmsError' | 'powerDrawWatts';

export const PerformanceTrajectoryChart: React.FC<PerformanceTrajectoryChartProps> = ({
  entries,
  selectedEntryId,
  onSelectEntry,
}) => {
  const [activeChannel, setActiveChannel] = useState<MetricChannel>('performanceScore');

  if (entries.length === 0) {
    return (
      <div className="p-8 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#111118] text-center">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          No commit or experiment telemetry logged yet. Commit a change to plot performance trajectory.
        </p>
      </div>
    );
  }

  const channelMeta: Record<
    MetricChannel,
    { label: string; unit: string; higherIsBetter: boolean }
  > = {
    performanceScore: {
      label: 'Composite Performance Index',
      unit: '%',
      higherIsBetter: true,
    },
    controlLoopLatencyMs: {
      label: 'Control Loop Latency',
      unit: 'ms',
      higherIsBetter: false,
    },
    trackingRmsError: {
      label: 'Trajectory RMS Error',
      unit: 'mm / deg',
      higherIsBetter: false,
    },
    powerDrawWatts: {
      label: 'Peak Power Draw',
      unit: 'W',
      higherIsBetter: false,
    },
  };

  const width = 860;
  const height = 270;
  const padLeft = 52;
  const padRight = 34;
  const padTop = 28;
  const padBottom = 48;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const values = entries.map((e) => e[activeChannel]);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const margin = (rawMax - rawMin) * 0.18 || 10;
  const yMin = activeChannel === 'performanceScore' ? Math.max(0, Math.floor(rawMin - 8)) : Math.max(0, rawMin - margin);
  const yMax = activeChannel === 'performanceScore' ? 100 : rawMax + margin;

  const getX = (idx: number) => {
    if (entries.length === 1) return padLeft + plotW / 2;
    return padLeft + (idx / (entries.length - 1)) * plotW;
  };

  const getY = (val: number) => {
    const norm = (val - yMin) / (yMax - yMin || 1);
    return padTop + plotH - norm * plotH;
  };

  const points = entries.map((entry, idx) => ({
    entry,
    x: getX(idx),
    y: getY(entry[activeChannel]),
    val: entry[activeChannel],
  }));

  const areaPath =
    points.length > 1
      ? `M ${points[0].x} ${padTop + plotH} ` +
        points.map((p) => `L ${p.x} ${p.y}`).join(' ') +
        ` L ${points[points.length - 1].x} ${padTop + plotH} Z`
      : '';

  const gridSteps = 4;
  const yTicks = Array.from({ length: gridSteps + 1 }, (_, i) => {
    const val = yMin + ((yMax - yMin) / gridSteps) * i;
    return { val, y: getY(val) };
  });

  const currentMeta = channelMeta[activeChannel];

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111118] p-5">
      {/* Header & Channel Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <h3 className="text-base font-semibold text-neutral-900 dark:text-white tracking-tight">
            Commit & Empirical Experiment Performance Trajectory
          </h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Click any commit or experiment node to inspect code changes, hardware modifications, and failure forensics
          </p>
        </div>

        {/* Interactive Channel Selector */}
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-[#09090D] border border-neutral-200 dark:border-neutral-800 rounded-md overflow-x-auto">
          {(Object.keys(channelMeta) as MetricChannel[]).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setActiveChannel(ch)}
              className={`px-2.5 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 ${
                activeChannel === ch
                  ? 'bg-purple-600 text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {channelMeta[ch].label}
            </button>
          ))}
        </div>
      </div>

      {/* SVG Telemetry Plot */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[640px] select-none cursor-crosshair"
          role="img"
          aria-label="Project performance trajectory across commits and experiments"
        >
          <defs>
            <linearGradient id="purpleTrajectoryGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Calibration Grid Lines */}
          {yTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={padLeft}
                y1={t.y}
                x2={width - padRight}
                y2={t.y}
                className="stroke-neutral-200 dark:stroke-neutral-800/90"
                strokeDasharray={idx === 0 ? undefined : '3 3'}
                strokeWidth="1"
              />
              <text
                x={padLeft - 8}
                y={t.y + 4}
                textAnchor="end"
                className="fill-neutral-500 dark:fill-neutral-400 text-[10px] font-mono tabular-nums"
              >
                {t.val.toFixed(activeChannel === 'controlLoopLatencyMs' ? 2 : 1)}
              </text>
            </g>
          ))}

          {/* Shaded Area under curve */}
          {areaPath && <path d={areaPath} fill="url(#purpleTrajectoryGrad)" />}

          {/* Segment Lines Colored by Performance Improvement vs Regression */}
          {points.map((pt, idx) => {
            if (idx === 0) return null;
            const prev = points[idx - 1];
            const isRegression = pt.entry.isFailure || pt.entry.deltaScore < 0;
            return (
              <g key={`seg-${pt.entry.id}`}>
                <line
                  x1={prev.x}
                  y1={prev.y}
                  x2={pt.x}
                  y2={pt.y}
                  stroke={isRegression ? '#F43F5E' : '#8B5CF6'}
                  strokeWidth={isRegression ? '2.75' : '2.5'}
                  strokeDasharray={pt.entry.entryType === 'manual_experiment' ? '5 3' : undefined}
                />
              </g>
            );
          })}

          {/* Vertical Crosshair on Selected Node */}
          {points.map((pt) => {
            const isSelected = pt.entry.id === selectedEntryId;
            if (!isSelected) return null;
            return (
              <line
                key={`cross-${pt.entry.id}`}
                x1={pt.x}
                y1={padTop}
                x2={pt.x}
                y2={padTop + plotH}
                stroke="#A855F7"
                strokeWidth="1.25"
                strokeDasharray="2 2"
              />
            );
          })}

          {/* Interactive Data Nodes */}
          {points.map((pt) => {
            const isSelected = pt.entry.id === selectedEntryId;
            const isFail = pt.entry.isFailure;
            const delta = pt.entry.deltaScore;

            return (
              <g
                key={pt.entry.id}
                onClick={() => onSelectEntry(pt.entry.id)}
                className="cursor-pointer group"
              >
                {/* Outer Selection Halo */}
                {isSelected && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={11}
                    fill="none"
                    stroke={isFail ? '#F43F5E' : '#A855F7'}
                    strokeWidth="1.75"
                    opacity="0.7"
                  />
                )}

                {/* Node Marker (Circle for Git Commit, Diamond/Square for Manual Experiment) */}
                {pt.entry.entryType === 'git_commit' ? (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 6.5 : 5}
                    fill={isFail ? '#F43F5E' : '#8B5CF6'}
                    stroke="#09090D"
                    strokeWidth="2"
                  />
                ) : (
                  <rect
                    x={pt.x - (isSelected ? 6 : 4.5)}
                    y={pt.y - (isSelected ? 6 : 4.5)}
                    width={isSelected ? 12 : 9}
                    height={isSelected ? 12 : 9}
                    transform={`rotate(45 ${pt.x} ${pt.y})`}
                    fill={isFail ? '#F43F5E' : '#A855F7'}
                    stroke="#09090D"
                    strokeWidth="2"
                  />
                )}

                {/* Value & Delta Label Above/Below Node */}
                <text
                  x={pt.x}
                  y={pt.y - 12}
                  textAnchor="middle"
                  className={`text-[10px] font-mono tabular-nums font-semibold ${
                    isFail
                      ? 'fill-rose-600 dark:fill-rose-400'
                      : 'fill-neutral-900 dark:fill-neutral-200'
                  }`}
                >
                  {pt.val.toFixed(activeChannel === 'controlLoopLatencyMs' ? 2 : 1)}
                  {activeChannel === 'performanceScore' && delta !== 0
                    ? ` (${delta > 0 ? '+' : ''}${delta.toFixed(1)}%)`
                    : ''}
                </text>

                {/* X-Axis Reference Code & Domain Label */}
                <text
                  x={pt.x}
                  y={padTop + plotH + 18}
                  textAnchor="middle"
                  className={`text-[10px] font-mono tabular-nums ${
                    isSelected
                      ? 'fill-purple-600 dark:fill-purple-400 font-semibold'
                      : 'fill-neutral-600 dark:fill-neutral-400'
                  }`}
                >
                  {pt.entry.referenceCode}
                </text>
                <text
                  x={pt.x}
                  y={padTop + plotH + 32}
                  textAnchor="middle"
                  className="text-[9px] fill-neutral-400 dark:fill-neutral-500"
                >
                  {pt.entry.changeDomain}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend & Summary Footer */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 mt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="flex flex-wrap items-center gap-5">
          <span className="inline-flex items-center gap-1.5">
            <GitCommit className="w-3.5 h-3.5 text-purple-500" />
            <span>Solid Line / Circle: Git Commit</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
            <span>Dashed Line / Diamond: Empirical Rig Experiment</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-purple-500" />
            <span>Violet Segment: Performance Gain</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            <span>Crimson Segment: Failure / Regression Drop</span>
          </span>
        </div>

        <div className="font-mono tabular-nums">
          <span>Active Channel: {currentMeta.label} ({currentMeta.unit})</span>
        </div>
      </div>
    </div>
  );
};
