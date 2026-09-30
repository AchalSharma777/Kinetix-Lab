import React, { useState } from 'react';
import {
  EngineeringProject,
  PerformanceEntry,
  ProjectCategory,
  EntryType,
  ChangeDomain,
  ProjectCodeFile,
  QualcommAIHubModel,
  HardwareBuildGuide,
} from '../types/engineering';
import { PerformanceTrajectoryChart } from './PerformanceTrajectoryChart';
import {
  Plus,
  GitCommit,
  FlaskConical,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Check,
  Code2,
  Cpu,
  Wrench,
  Sliders,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit3,
} from 'lucide-react';

interface ProjectWorkspaceProps {
  category: ProjectCategory;
  projects: EngineeringProject[];
  aiHubModels: QualcommAIHubModel[];
  hardwareGuides: HardwareBuildGuide[];
  onAddEntry: (projectId: string, entry: PerformanceEntry) => void;
  onAddCodeFile: (projectId: string, codeFile: ProjectCodeFile) => void;
  onDeleteProject: (projectId: string) => void;
  onOpenNewProjectModal: (category: ProjectCategory) => void;
  onEditProject: (project: EngineeringProject) => void;
  onNavigateToAiHub: (modelId?: string) => void;
  onNavigateToHardware: (guideId?: string) => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({
  category,
  projects,
  aiHubModels,
  hardwareGuides,
  onAddEntry,
  onAddCodeFile,
  onDeleteProject,
  onOpenNewProjectModal,
  onEditProject,
  onNavigateToAiHub,
  onNavigateToHardware,
}) => {
  const categoryProjects = projects.filter((p) => p.category === category);
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    categoryProjects[0]?.id || ''
  );

  // Ensure valid project selection when switching between Robotics and Drones
  const activeProject =
    categoryProjects.find((p) => p.id === selectedProjectId) || categoryProjects[0];

  const [selectedEntryId, setSelectedEntryId] = useState<string>(
    activeProject?.entries[activeProject.entries.length - 1]?.id || ''
  );

  const [activeSubTab, setActiveSubTab] = useState<'telemetry' | 'code_logic' | 'failures'>('telemetry');
  const [domainFilter, setDomainFilter] = useState<'ALL' | ChangeDomain | 'FAILURES_ONLY'>('ALL');
  const [selectedCodeFileId, setSelectedCodeFileId] = useState<string>(
    activeProject?.codeFiles[0]?.id || ''
  );
  const [copiedCode, setCopiedCode] = useState(false);

  // Modal state for logging new Git Commit / Manual Experiment
  const [showLogEntryForm, setShowLogEntryForm] = useState(false);
  const [entryType, setEntryType] = useState<EntryType>('git_commit');
  const [referenceCode, setReferenceCode] = useState('');
  const [changeDomain, setChangeDomain] = useState<ChangeDomain>('Code');
  const [authorOrRig, setAuthorOrRig] = useState('');
  const [entryTitle, setEntryTitle] = useState('');
  const [entrySummary, setEntrySummary] = useState('');
  const [performanceScore, setPerformanceScore] = useState('88.5');
  const [controlLoopLatencyMs, setControlLoopLatencyMs] = useState('0.85');
  const [powerDrawWatts, setPowerDrawWatts] = useState('115.0');
  const [trackingRmsError, setTrackingRmsError] = useState('2.1');
  const [isFailure, setIsFailure] = useState(false);
  const [failureRootCause, setFailureRootCause] = useState('');
  const [remediationLogic, setRemediationLogic] = useState('');
  const [codeOrConfigDiff, setCodeOrConfigDiff] = useState('');

  // Modal state for adding a new Code & Control Logic file
  const [showAddCodeModal, setShowAddCodeModal] = useState(false);
  const [newFilename, setNewFilename] = useState('');
  const [newLanguage, setNewLanguage] = useState('C++17');
  const [newSubsystem, setNewSubsystem] = useState('');
  const [newLogicSummary, setNewLogicSummary] = useState('');
  const [newControlEquation, setNewControlEquation] = useState('');
  const [newCodeContent, setNewCodeContent] = useState('');

  if (!activeProject) {
    return (
      <div className="p-12 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111118] text-center">
        <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">
          No {category === 'robotics' ? 'Robotics' : 'Drone'} Projects Registered
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-md mx-auto mb-6">
          Initialize your first {category === 'robotics' ? 'robotic actuator or manipulator' : 'autonomous UAV flight'} project to track Git commits, hardware changes, failure root causes, and control loop telemetry.
        </p>
        <button
          type="button"
          onClick={() => onOpenNewProjectModal(category)}
          className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded transition-colors"
        >
          + Initialize {category === 'robotics' ? 'Robotics' : 'Drone'} Project
        </button>
      </div>
    );
  }

  const entries = activeProject.entries;
  const latestEntry = entries[entries.length - 1];
  const selectedEntry =
    entries.find((e) => e.id === selectedEntryId) || latestEntry;

  const failureCount = entries.filter((e) => e.isFailure || e.deltaScore < 0).length;

  const filteredEntries = entries.filter((e) => {
    if (domainFilter === 'ALL') return true;
    if (domainFilter === 'FAILURES_ONLY') return e.isFailure || e.deltaScore < 0;
    return e.changeDomain === domainFilter;
  });

  const activeCodeFile =
    activeProject.codeFiles.find((cf) => cf.id === selectedCodeFileId) ||
    activeProject.codeFiles[0];

  const linkedAiModel = aiHubModels.find((m) => m.id === activeProject.linkedAiHubModelId);
  const linkedHwGuide = hardwareGuides.find((g) => g.id === activeProject.linkedHardwareGuideId);

  const handleProjectSelect = (proj: EngineeringProject) => {
    setSelectedProjectId(proj.id);
    const last = proj.entries[proj.entries.length - 1];
    if (last) setSelectedEntryId(last.id);
    if (proj.codeFiles[0]) setSelectedCodeFileId(proj.codeFiles[0].id);
  };

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryTitle.trim()) return;

    const scoreNum = Math.min(100, Math.max(0, parseFloat(performanceScore) || 75));
    const prevScore = latestEntry ? latestEntry.performanceScore : scoreNum;
    const computedDelta = Number((scoreNum - prevScore).toFixed(1));
    const autoFailure = isFailure || computedDelta < -5;

    const defaultRef =
      entryType === 'git_commit'
        ? Math.random().toString(16).substring(2, 9)
        : `EXP-2026-${Math.floor(100 + Math.random() * 899)}`;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newEntry: PerformanceEntry = {
      id: `ent-${Date.now()}`,
      timestamp: formattedDate,
      entryType,
      referenceCode: referenceCode.trim() || defaultRef,
      changeDomain,
      authorOrRig: authorOrRig.trim() || (entryType === 'git_commit' ? 'main / firmware' : 'Test Bench A'),
      title: entryTitle.trim(),
      summary: entrySummary.trim() || 'Logged engineering change and evaluated closed-loop telemetry.',
      performanceScore: scoreNum,
      deltaScore: computedDelta,
      controlLoopLatencyMs: parseFloat(controlLoopLatencyMs) || 1.0,
      powerDrawWatts: parseFloat(powerDrawWatts) || 120.0,
      trackingRmsError: parseFloat(trackingRmsError) || 2.0,
      isFailure: autoFailure,
      failureRootCause: autoFailure
        ? failureRootCause.trim() || 'Performance regression observed following parameter or hardware modification.'
        : undefined,
      remediationLogic: autoFailure
        ? remediationLogic.trim() || 'Revert parameter gain or recalibrate filter phase margin.'
        : undefined,
      codeOrConfigDiff:
        codeOrConfigDiff.trim() ||
        `// ${entryType === 'git_commit' ? 'Commit' : 'Experiment'} ${referenceCode || defaultRef}\n// Score: ${scoreNum}% (Delta: ${computedDelta >= 0 ? '+' : ''}${computedDelta}%)`,
    };

    onAddEntry(activeProject.id, newEntry);
    setSelectedEntryId(newEntry.id);
    setShowLogEntryForm(false);
    setReferenceCode('');
    setEntryTitle('');
    setEntrySummary('');
    setFailureRootCause('');
    setRemediationLogic('');
    setCodeOrConfigDiff('');
  };

  const handleCreateCodeFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFilename.trim() || !newCodeContent.trim()) return;
    const cf: ProjectCodeFile = {
      id: `cf-${Date.now()}`,
      filename: newFilename.trim(),
      language: newLanguage.trim() || 'C++17',
      subsystem: newSubsystem.trim() || 'Core Control Loop',
      logicSummary: newLogicSummary.trim() || 'Custom control logic module.',
      controlEquation: newControlEquation.trim() || 'u(t) = K · e(t)',
      content: newCodeContent,
    };
    onAddCodeFile(activeProject.id, cf);
    setSelectedCodeFileId(cf.id);
    setShowAddCodeModal(false);
    setNewFilename('');
    setNewSubsystem('');
    setNewLogicSummary('');
    setNewControlEquation('');
    setNewCodeContent('');
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="text-xs font-mono text-purple-600 dark:text-purple-400 mb-1">
            {category === 'robotics'
              ? '01. Robotics & Legged / Manipulator Systems'
              : '02. Autonomous Drones & Aerial Flight Systems'}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white text-balance">
            {category === 'robotics'
              ? 'Robotics Control, Actuation & Failure Telemetry'
              : 'Autonomous UAV Flight Stack & VIO Telemetry'}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowLogEntryForm(true)}
            className="px-4 py-2 text-xs font-semibold text-neutral-900 dark:text-white bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 hover:border-purple-500 rounded transition-colors whitespace-nowrap"
          >
            + Log Commit / Experiment
          </button>
          <button
            type="button"
            onClick={() => onOpenNewProjectModal(category)}
            className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded transition-colors whitespace-nowrap"
          >
            + New {category === 'robotics' ? 'Robotics' : 'Drone'} Project
          </button>
        </div>
      </div>

      {/* Project Selector Cards Grid (Single-Elevation Depth, Zero-Pill Metadata) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {categoryProjects.map((proj) => {
          const isSelected = proj.id === activeProject.id;
          const last = proj.entries[proj.entries.length - 1];
          const score = last ? last.performanceScore : 0;
          const delta = last ? last.deltaScore : 0;

          return (
            <div
              key={proj.id}
              onClick={() => handleProjectSelect(proj)}
              className={`cursor-pointer border transition-colors p-5 flex flex-col justify-between ${
                isSelected
                  ? 'border-purple-600 bg-white dark:bg-[#111118]'
                  : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-[#0D0D14] hover:border-neutral-400 dark:hover:border-neutral-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-16 shrink-0 bg-neutral-900 overflow-hidden border border-neutral-200 dark:border-neutral-800">
                      <img
                        src={proj.imageUrl}
                        alt={proj.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                        <span>{proj.codename}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              proj.status === 'NOMINAL'
                                ? 'bg-emerald-500'
                                : proj.status === 'DRIFTING'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                          <span className="text-neutral-700 dark:text-neutral-300 font-semibold">
                            {proj.status}
                          </span>
                        </span>
                      </div>
                      <h2 className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                        {proj.name}
                      </h2>
                    </div>
                  </div>

                  {/* Right Metric Readout */}
                  <div className="text-right shrink-0">
                    <div className="text-xl font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
                      {score.toFixed(1)}
                      <span className="text-xs font-normal text-neutral-400 ml-0.5">%</span>
                    </div>
                    <div
                      className={`text-xs font-mono tabular-nums ${
                        delta >= 0
                          ? 'text-purple-600 dark:text-purple-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {delta >= 0 ? `+${delta.toFixed(1)}%` : `${delta.toFixed(1)}%`} last
                    </div>
                  </div>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-3 line-clamp-2 leading-relaxed">
                  {proj.description}
                </p>
              </div>

              {/* Clean Unboxed Metadata Line with Typographic Separators */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-4 border-t border-neutral-200 dark:border-neutral-800/80 text-xs text-neutral-500 dark:text-neutral-400">
                <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums">
                  <span>{proj.mcuPrimary.split(' ')[0]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{proj.controlFrequencyHz} Hz Loop</span>
                  <span aria-hidden="true">·</span>
                  <span>{proj.entries.length} Logs</span>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    onClick={() => onEditProject(proj)}
                    className="p-1 text-neutral-500 hover:text-purple-500 transition-colors"
                    title="Edit project specs"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  {categoryProjects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDeleteProject(proj.id)}
                      className="p-1 text-neutral-500 hover:text-rose-500 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Log New Git Commit or Manual Experiment Inline Drawer */}
      {showLogEntryForm && (
        <form
          onSubmit={handleCreateEntry}
          className="border border-purple-500/60 bg-white dark:bg-[#111118] p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Commit Change or Log Empirical Experiment — {activeProject.name}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Record a Git commit or manual bench/flight trial to plot performance gains or root-cause regressions.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowLogEntryForm(false)}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Entry Mechanism
              </label>
              <select
                value={entryType}
                onChange={(e) => setEntryType(e.target.value as EntryType)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded"
              >
                <option value="git_commit">Git-Style Commit (Code / Sim / NPU)</option>
                <option value="manual_experiment">Manual Rig / Flight Experiment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Change Domain
              </label>
              <select
                value={changeDomain}
                onChange={(e) => setChangeDomain(e.target.value as ChangeDomain)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded"
              >
                <option value="Code">Code (Firmware / Control Law)</option>
                <option value="Hardware">Hardware (Actuators / Frame / Wiring)</option>
                <option value="Simulation">Simulation (URDF / MuJoCo / Gazebo)</option>
                <option value="NPU Model">NPU Model (Qualcomm AI Hub Quantization)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                {entryType === 'git_commit' ? 'Commit Hash (e.g. a84f21c)' : 'Experiment ID (e.g. EXP-2026-112)'}
              </label>
              <input
                type="text"
                value={referenceCode}
                onChange={(e) => setReferenceCode(e.target.value)}
                placeholder={entryType === 'git_commit' ? 'Auto-generate 7-char SHA' : 'Auto-generate EXP ID'}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Branch or Test Rig
              </label>
              <input
                type="text"
                value={authorOrRig}
                onChange={(e) => setAuthorOrRig(e.target.value)}
                placeholder="e.g. feat/rpm-notch or Wind Tunnel B"
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Change Title *
              </label>
              <input
                type="text"
                required
                value={entryTitle}
                onChange={(e) => setEntryTitle(e.target.value)}
                placeholder="e.g. Tuned Cascaded Notch Filter & Reduced D-Term Cutoff"
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Engineering Summary
              </label>
              <input
                type="text"
                value={entrySummary}
                onChange={(e) => setEntrySummary(e.target.value)}
                placeholder="Describe what changed in code, hardware, or simulation..."
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Performance Score (0–100%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={performanceScore}
                onChange={(e) => setPerformanceScore(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Loop Latency (ms)
              </label>
              <input
                type="number"
                step="0.01"
                value={controlLoopLatencyMs}
                onChange={(e) => setControlLoopLatencyMs(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Power Draw (Watts)
              </label>
              <input
                type="number"
                step="0.1"
                value={powerDrawWatts}
                onChange={(e) => setPowerDrawWatts(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                RMS Tracking Error (mm/deg)
              </label>
              <input
                type="number"
                step="0.01"
                value={trackingRmsError}
                onChange={(e) => setTrackingRmsError(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded"
              />
            </div>
          </div>

          <div className="pt-1">
            <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isFailure}
                onChange={(e) => setIsFailure(e.target.checked)}
                className="accent-purple-600"
              />
              <span>Flag this change as a Failure / Performance Regression Event</span>
            </label>
          </div>

          {isFailure && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-rose-500/40 bg-rose-950/10">
              <div>
                <label className="block text-xs font-medium text-rose-600 dark:text-rose-400 mb-1">
                  Failure Root-Cause Forensics
                </label>
                <textarea
                  rows={2}
                  value={failureRootCause}
                  onChange={(e) => setFailureRootCause(e.target.value)}
                  placeholder="What physical, electrical, or algorithmic mechanism caused performance to drop?"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">
                  Planned Remediation Logic
                </label>
                <textarea
                  rows={2}
                  value={remediationLogic}
                  onChange={(e) => setRemediationLogic(e.target.value)}
                  placeholder="How will the next commit or hardware revision resolve this failure?"
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Code Diff / Config Snapshot / Blackbox Log
            </label>
            <textarea
              rows={3}
              value={codeOrConfigDiff}
              onChange={(e) => setCodeOrConfigDiff(e.target.value)}
              placeholder="Paste C++ control loop diff, PID gains, or blackbox failure snippet..."
              className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-white rounded"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowLogEntryForm(false)}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded transition-colors"
            >
              Commit Entry to Trajectory
            </button>
          </div>
        </form>
      )}

      {/* Active Project Telemetry Workbench */}
      <div className="space-y-6">
        {/* Workbench Banner & Architecture Specs */}
        <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111118] p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-5 border-b border-neutral-200 dark:border-neutral-800">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                <span>ACTIVE WORKBENCH</span>
                <span aria-hidden="true">·</span>
                <span className="text-purple-600 dark:text-purple-400 font-semibold">
                  {activeProject.codename}
                </span>
                <span aria-hidden="true">·</span>
                <span>Updated {activeProject.updatedAt}</span>
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                {activeProject.name}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1.5 max-w-3xl">
                {activeProject.coreLogicArchitecture}
              </p>
            </div>

            {/* Linked Hardware & Qualcomm AI Hub Cross-Navigation */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              {linkedAiModel && (
                <button
                  type="button"
                  onClick={() => onNavigateToAiHub(linkedAiModel.id)}
                  className="px-3.5 py-2 text-xs font-medium border border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 rounded transition-colors whitespace-nowrap"
                >
                  Qualcomm NPU: {linkedAiModel.optimizedLatencyMs} ms ({linkedAiModel.quantizationMode})
                </button>
              )}
              {linkedHwGuide && (
                <button
                  type="button"
                  onClick={() => onNavigateToHardware(linkedHwGuide.id)}
                  className="px-3.5 py-2 text-xs font-medium border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:border-purple-500 rounded transition-colors whitespace-nowrap"
                >
                  Mechatronics Build Guide
                </button>
              )}
            </div>
          </div>

          {/* 5-Column Precision Telemetry Readout */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pt-5">
            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Current Performance Index
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
                  {latestEntry ? latestEntry.performanceScore.toFixed(1) : '0.0'}
                </span>
                <span className="text-xs font-mono text-neutral-400">%</span>
                {latestEntry && (
                  <span
                    className={`text-xs font-mono tabular-nums ${
                      latestEntry.deltaScore >= 0
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {latestEntry.deltaScore >= 0
                      ? `+${latestEntry.deltaScore.toFixed(1)}%`
                      : `${latestEntry.deltaScore.toFixed(1)}%`}
                  </span>
                )}
              </div>
            </div>

            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Control Loop Latency
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
                  {latestEntry ? latestEntry.controlLoopLatencyMs.toFixed(2) : '0.00'}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  ms @ {activeProject.controlFrequencyHz}Hz
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Tracking RMS Error
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
                  {latestEntry ? latestEntry.trackingRmsError.toFixed(2) : '0.00'}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {category === 'robotics' ? 'mm / mrad' : 'deg / cm'}
                </span>
              </div>
            </div>

            <div>
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Logged Failure Drops
              </div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-2xl font-mono font-bold tabular-nums text-rose-600 dark:text-rose-400">
                  {failureCount}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  / {entries.length} entries
                </span>
              </div>
            </div>

            <div className="col-span-2 md:col-span-1">
              <div className="text-xs text-neutral-500 dark:text-neutral-400">
                Compute Topology
              </div>
              <div className="mt-1 text-xs font-mono text-neutral-800 dark:text-neutral-200 truncate">
                {activeProject.mcuPrimary}
              </div>
              <div className="text-xs font-mono text-purple-600 dark:text-purple-400 truncate mt-0.5">
                {activeProject.companionCompute}
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Navigation Tabs inside Active Project */}
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveSubTab('telemetry')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeSubTab === 'telemetry'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Performance Trajectory & Change Log ({entries.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('failures')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeSubTab === 'failures'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Failure Root-Cause Forensics ({failureCount})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('code_logic')}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeSubTab === 'code_logic'
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Project Source Code & Control Logic ({activeProject.codeFiles.length})
            </button>
          </div>
        </div>

        {/* TAB 1: PERFORMANCE TRAJECTORY & GIT / EXPERIMENT CHANGE LOG */}
        {activeSubTab === 'telemetry' && (
          <div className="space-y-6">
            <PerformanceTrajectoryChart
              entries={entries}
              selectedEntryId={selectedEntry?.id || ''}
              onSelectEntry={(id) => setSelectedEntryId(id)}
            />

            {/* Selected Node Deep-Dive Inspector + Historical Commit/Experiment Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 Cols: Filterable Commit & Experiment Timeline Table */}
              <div className="lg:col-span-7 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111118] p-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Git Commits & Empirical Rig Trials
                  </h3>

                  <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-[#09090D] border border-neutral-200 dark:border-neutral-800 rounded">
                    {(['ALL', 'Code', 'Hardware', 'Simulation', 'NPU Model', 'FAILURES_ONLY'] as const).map(
                      (f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setDomainFilter(f)}
                          className={`px-2 py-1 text-[11px] font-medium rounded transition-colors whitespace-nowrap ${
                            domainFilter === f
                              ? 'bg-purple-600 text-white'
                              : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                          }`}
                        >
                          {f === 'FAILURES_ONLY' ? 'Failures' : f}
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-200 dark:border-neutral-800 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                        <th className="py-2 pr-3">Ref / Type</th>
                        <th className="py-2 px-3">Domain</th>
                        <th className="py-2 px-3">Modification & Outcome</th>
                        <th className="py-2 pl-3 text-right">Score / Delta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800/70 text-xs">
                      {filteredEntries.map((ent) => {
                        const isSelected = selectedEntry?.id === ent.id;
                        const isReg = ent.isFailure || ent.deltaScore < 0;

                        return (
                          <tr
                            key={ent.id}
                            onClick={() => setSelectedEntryId(ent.id)}
                            className={`cursor-pointer transition-colors ${
                              isSelected
                                ? 'bg-purple-500/10 dark:bg-purple-500/15'
                                : 'hover:bg-neutral-50 dark:hover:bg-neutral-900/60'
                            }`}
                          >
                            <td className="py-3 pr-3 font-mono tabular-nums whitespace-nowrap">
                              <div className="font-semibold text-neutral-900 dark:text-white">
                                {ent.referenceCode}
                              </div>
                              <div className="text-[10px] text-neutral-500">
                                {ent.entryType === 'git_commit' ? 'Git Commit' : 'Rig Trial'}
                              </div>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="font-mono text-neutral-700 dark:text-neutral-300">
                                {ent.changeDomain}
                              </span>
                              <div className="text-[10px] text-neutral-500 font-mono">
                                {ent.timestamp}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-medium text-neutral-900 dark:text-white">
                                {ent.title}
                              </div>
                              <div className="text-neutral-500 dark:text-neutral-400 line-clamp-1 mt-0.5">
                                {ent.summary}
                              </div>
                            </td>
                            <td className="py-3 pl-3 text-right font-mono tabular-nums whitespace-nowrap">
                              <div className="font-bold text-neutral-900 dark:text-white">
                                {ent.performanceScore.toFixed(1)}%
                              </div>
                              <div
                                className={`text-[11px] inline-flex items-center gap-0.5 ${
                                  isReg
                                    ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                    : 'text-purple-600 dark:text-purple-400'
                                }`}
                              >
                                {ent.deltaScore > 0 ? (
                                  <ArrowUpRight className="w-3 h-3" />
                                ) : ent.deltaScore < 0 ? (
                                  <ArrowDownRight className="w-3 h-3" />
                                ) : null}
                                {ent.deltaScore > 0
                                  ? `+${ent.deltaScore.toFixed(1)}%`
                                  : `${ent.deltaScore.toFixed(1)}%`}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right 5 Cols: Selected Commit / Experiment Inspector */}
              {selectedEntry && (
                <div className="lg:col-span-5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111118] p-5 flex flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                          <span className="text-purple-600 dark:text-purple-400 font-semibold">
                            {selectedEntry.referenceCode}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>{selectedEntry.changeDomain}</span>
                          <span aria-hidden="true">·</span>
                          <span>{selectedEntry.timestamp}</span>
                        </div>
                        <h4 className="text-base font-bold text-neutral-900 dark:text-white mt-1">
                          {selectedEntry.title}
                        </h4>
                      </div>

                      <span
                        className={`text-xs font-mono font-semibold px-2 py-1 rounded shrink-0 ${
                          selectedEntry.isFailure || selectedEntry.deltaScore < 0
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : 'bg-purple-500/15 text-purple-600 dark:text-purple-300'
                        }`}
                      >
                        {selectedEntry.isFailure || selectedEntry.deltaScore < 0
                          ? `REGRESSION (${selectedEntry.deltaScore.toFixed(1)}%)`
                          : `GAIN (+${selectedEntry.deltaScore.toFixed(1)}%)`}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                      {selectedEntry.summary}
                    </p>

                    {/* Telemetry Snapshot Strip */}
                    <div className="grid grid-cols-3 gap-3 py-2.5 px-3 bg-neutral-50 dark:bg-[#09090D] border border-neutral-200 dark:border-neutral-800 font-mono text-xs tabular-nums">
                      <div>
                        <div className="text-[10px] text-neutral-500">LOOP LATENCY</div>
                        <div className="font-semibold text-neutral-900 dark:text-white mt-0.5">
                          {selectedEntry.controlLoopLatencyMs.toFixed(2)} ms
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-500">POWER DRAW</div>
                        <div className="font-semibold text-neutral-900 dark:text-white mt-0.5">
                          {selectedEntry.powerDrawWatts.toFixed(1)} W
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-neutral-500">RMS ERROR</div>
                        <div className="font-semibold text-neutral-900 dark:text-white mt-0.5">
                          {selectedEntry.trackingRmsError.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Failure Root-Cause Box if this commit/experiment failed */}
                    {selectedEntry.isFailure && (
                      <div className="p-3.5 border border-rose-500/40 bg-rose-950/10 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>Root-Cause Failure Diagnosis</span>
                        </div>
                        <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {selectedEntry.failureRootCause}
                        </p>
                        {selectedEntry.remediationLogic && (
                          <div className="pt-2 border-t border-rose-500/20">
                            <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                              Engineering Remediation Logic:
                            </div>
                            <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-0.5 leading-relaxed">
                              {selectedEntry.remediationLogic}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Code Diff / Telemetry Snippet */}
                    <div>
                      <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-1.5">
                        Committed Diff / Telemetry Snapshot ({selectedEntry.authorOrRig})
                      </div>
                      <pre className="p-3.5 bg-neutral-950 text-neutral-100 text-xs font-mono overflow-x-auto border border-neutral-800 leading-relaxed">
                        <code>{selectedEntry.codeOrConfigDiff}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: DEDICATED FAILURE ROOT-CAUSE FORENSICS LEDGER */}
        {activeSubTab === 'failures' && (
          <div className="space-y-4">
            {entries.filter((e) => e.isFailure || e.deltaScore < 0).length === 0 ? (
              <div className="p-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111118] text-center">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Zero failure events logged for this project.
                </p>
              </div>
            ) : (
              entries
                .filter((e) => e.isFailure || e.deltaScore < 0)
                .map((fail) => (
                  <div
                    key={fail.id}
                    className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111118] p-6 space-y-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-mono text-rose-600 dark:text-rose-400">
                          <span>{fail.referenceCode}</span>
                          <span aria-hidden="true">·</span>
                          <span>{fail.changeDomain} Regression</span>
                          <span aria-hidden="true">·</span>
                          <span>{fail.timestamp}</span>
                          <span aria-hidden="true">·</span>
                          <span>{fail.authorOrRig}</span>
                        </div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white mt-1">
                          {fail.title}
                        </h3>
                      </div>

                      <div className="text-right font-mono tabular-nums">
                        <div className="text-base font-bold text-rose-600 dark:text-rose-400">
                          {fail.deltaScore.toFixed(1)}% Performance Drop
                        </div>
                        <div className="text-xs text-neutral-500">
                          Index fell to {fail.performanceScore.toFixed(1)}% · RMS Error: {fail.trackingRmsError}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-1.5">
                          Physical & Algorithmic Root Cause
                        </h4>
                        <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {fail.failureRootCause || fail.summary}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-1.5">
                          Verified Remediation & Recovery Logic
                        </h4>
                        <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed">
                          {fail.remediationLogic || 'Recalibrated loop parameters in subsequent commit.'}
                        </p>
                      </div>
                    </div>

                    <pre className="p-3.5 bg-neutral-950 text-neutral-200 text-xs font-mono overflow-x-auto border border-neutral-800">
                      <code>{fail.codeOrConfigDiff}</code>
                    </pre>
                  </div>
                ))
            )}
          </div>
        )}

        {/* TAB 3: PROJECT SOURCE CODE & CONTROL LOGIC REPOSITORY */}
        {activeSubTab === 'code_logic' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {activeProject.codeFiles.map((cf) => (
                  <button
                    key={cf.id}
                    type="button"
                    onClick={() => setSelectedCodeFileId(cf.id)}
                    className={`px-3.5 py-2 text-xs font-mono rounded border transition-colors ${
                      activeCodeFile?.id === cf.id
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-white dark:bg-[#111118] text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-800 hover:border-purple-500'
                    }`}
                  >
                    {cf.filename}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowAddCodeModal(true)}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded transition-colors"
              >
                + Add Code / Control Module
              </button>
            </div>

            {showAddCodeModal && (
              <form
                onSubmit={handleCreateCodeFile}
                className="border border-purple-500/60 bg-white dark:bg-[#111118] p-5 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                    Add Source File & Control Logic to {activeProject.name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddCodeModal(false)}
                    className="text-xs text-neutral-500"
                  >
                    Close
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <input
                    type="text"
                    required
                    value={newFilename}
                    onChange={(e) => setNewFilename(e.target.value)}
                    placeholder="Filename (e.g. kalman_attitude.cpp)"
                    className="px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newLanguage}
                    onChange={(e) => setNewLanguage(e.target.value)}
                    placeholder="Language (e.g. C++17 / Python / Rust)"
                    className="px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newSubsystem}
                    onChange={(e) => setNewSubsystem(e.target.value)}
                    placeholder="Subsystem (e.g. Attitude Control Loop)"
                    className="px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    value={newLogicSummary}
                    onChange={(e) => setNewLogicSummary(e.target.value)}
                    placeholder="Algorithmic logic explanation..."
                    className="px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newControlEquation}
                    onChange={(e) => setNewControlEquation(e.target.value)}
                    placeholder="Control equation (e.g. tau = J^T * F_grf)"
                    className="px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
                  />
                </div>
                <textarea
                  rows={6}
                  required
                  value={newCodeContent}
                  onChange={(e) => setNewCodeContent(e.target.value)}
                  placeholder="Paste full C++ / Python / ROS2 source code..."
                  className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded"
                  >
                    Save Source File
                  </button>
                </div>
              </form>
            )}

            {activeCodeFile && (
              <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111118] p-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                      <span className="text-purple-600 dark:text-purple-400 font-semibold">
                        {activeCodeFile.filename}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{activeCodeFile.language}</span>
                      <span aria-hidden="true">·</span>
                      <span>{activeCodeFile.subsystem}</span>
                    </div>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1.5">
                      {activeCodeFile.logicSummary}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyCode(activeCodeFile.content)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded hover:border-purple-500 text-neutral-800 dark:text-neutral-200 transition-colors"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Source</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-3 bg-neutral-50 dark:bg-[#09090D] border border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    Governing Control Law:
                  </span>
                  <code className="text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold">
                    {activeCodeFile.controlEquation}
                  </code>
                </div>

                <pre className="p-4 bg-neutral-950 text-neutral-100 text-xs font-mono overflow-x-auto border border-neutral-800 leading-relaxed">
                  <code>{activeCodeFile.content}</code>
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
