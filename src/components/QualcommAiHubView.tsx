import React, { useState } from 'react';
import {
  QualcommAIHubModel,
  EngineeringProject,
  PerformanceEntry,
} from '../types/engineering';
import { Copy, Check, Cpu, Zap, ArrowUpRight } from 'lucide-react';

interface QualcommAiHubViewProps {
  models: QualcommAIHubModel[];
  projects: EngineeringProject[];
  initialSelectedModelId?: string;
  onAddAiHubModel: (
    model: QualcommAIHubModel,
    commitToProject?: { projectId: string; entry: PerformanceEntry }
  ) => void;
}

export const QualcommAiHubView: React.FC<QualcommAiHubViewProps> = ({
  models,
  projects,
  initialSelectedModelId,
  onAddAiHubModel,
}) => {
  const [selectedModelId, setSelectedModelId] = useState<string>(
    initialSelectedModelId || models[0]?.id || ''
  );
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [showCompileDrawer, setShowCompileDrawer] = useState(false);

  // Compile & Profile Job Form State
  const [modelName, setModelName] = useState('');
  const [taskCategory, setTaskCategory] =
    useState<QualcommAIHubModel['taskCategory']>('Obstacle Avoidance');
  const [linkedProjectId, setLinkedProjectId] = useState<string>(
    projects[0]?.id || ''
  );
  const [targetDevice, setTargetDevice] =
    useState<QualcommAIHubModel['targetDevice']>('Qualcomm Dragonwing RB3 Gen 2');
  const [computeUnit, setComputeUnit] =
    useState<QualcommAIHubModel['computeUnit']>('Hexagon NPU (HTP)');
  const [runtimeFormat, setRuntimeFormat] =
    useState<QualcommAIHubModel['runtimeFormat']>('Qualcomm QNN (.bin)');
  const [quantizationMode, setQuantizationMode] =
    useState<QualcommAIHubModel['quantizationMode']>('INT8 (W8A8)');
  const [fp32BaselineLatencyMs, setFp32BaselineLatencyMs] = useState('24.5');
  const [optimizedLatencyMs, setOptimizedLatencyMs] = useState('2.85');
  const [accuracyMetricName, setAccuracyMetricName] = useState('mAP@50 (%)');
  const [fp32Accuracy, setFp32Accuracy] = useState('95.4');
  const [quantizedAccuracy, setQuantizedAccuracy] = useState('95.1');
  const [pushCommitToProject, setPushCommitToProject] = useState(true);

  const activeModel =
    models.find((m) => m.id === (initialSelectedModelId || selectedModelId)) ||
    models.find((m) => m.id === selectedModelId) ||
    models[0];

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 1800);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelName.trim()) return;

    const fp32Lat = parseFloat(fp32BaselineLatencyMs) || 20.0;
    const optLat = parseFloat(optimizedLatencyMs) || 2.5;
    const speedup = Number((fp32Lat / Math.max(0.1, optLat)).toFixed(2));
    const jobId = `j${Math.random().toString(36).substring(2, 9)}`;

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newModel: QualcommAIHubModel = {
      id: `qai-custom-${Date.now()}`,
      modelName: modelName.trim(),
      taskCategory,
      linkedProjectId,
      targetDevice,
      computeUnit,
      runtimeFormat,
      quantizationMode,
      fp32BaselineLatencyMs: fp32Lat,
      optimizedLatencyMs: optLat,
      speedupFactor: speedup,
      npuComputeLoadPercent: computeUnit === 'Hexagon NPU (HTP)' ? 94.8 : 68.0,
      peakSramMb: 4.2,
      powerEfficiencyInfPerWatt: Math.round(900 / Math.max(0.5, optLat)),
      accuracyMetricName: accuracyMetricName.trim() || 'Validation Accuracy (%)',
      fp32Accuracy: parseFloat(fp32Accuracy) || 95.0,
      quantizedAccuracy: parseFloat(quantizedAccuracy) || 94.7,
      hubJobId: jobId,
      profiledAt: formattedDate,
      deploymentCommand: `qai-hub submit-compile-job --model ${modelName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')}.onnx --device "${targetDevice}" --options "--target_runtime qnn_context_binary --quantize_full_type int8"`,
    };

    let projectCommit: { projectId: string; entry: PerformanceEntry } | undefined;
    if (pushCommitToProject && linkedProjectId) {
      const targetProj = projects.find((p) => p.id === linkedProjectId);
      const lastEntry = targetProj?.entries[targetProj.entries.length - 1];
      const prevScore = lastEntry ? lastEntry.performanceScore : 82.0;
      const newScore = Math.min(99.4, Number((prevScore + 4.2).toFixed(1)));
      const delta = Number((newScore - prevScore).toFixed(1));

      projectCommit = {
        projectId: linkedProjectId,
        entry: {
          id: `ent-qai-${Date.now()}`,
          timestamp: formattedDate,
          entryType: 'git_commit',
          referenceCode: jobId,
          changeDomain: 'NPU Model',
          authorOrRig: `${targetDevice} (${computeUnit})`,
          title: `Qualcomm AI Hub ${quantizationMode} Deployment: ${modelName.trim()}`,
          summary: `Accelerated ${taskCategory} inference from ${fp32Lat.toFixed(2)}ms (FP32) to ${optLat.toFixed(2)}ms (${speedup}x speedup) on ${computeUnit}.`,
          performanceScore: newScore,
          deltaScore: delta,
          controlLoopLatencyMs: lastEntry
            ? Math.max(0.2, Number((lastEntry.controlLoopLatencyMs * 0.88).toFixed(2)))
            : 0.65,
          powerDrawWatts: lastEntry ? lastEntry.powerDrawWatts : 115.0,
          trackingRmsError: lastEntry
            ? Math.max(0.05, Number((lastEntry.trackingRmsError * 0.85).toFixed(2)))
            : 0.9,
          isFailure: false,
          codeOrConfigDiff: `// Qualcomm AI Hub Job ID: ${jobId}\n// Target: ${targetDevice} | Compute Unit: ${computeUnit}\n// Latency: ${fp32Lat}ms -> ${optLat}ms (${speedup}x speedup)`,
        },
      };
    }

    onAddAiHubModel(newModel, projectCommit);
    setSelectedModelId(newModel.id);
    setShowCompileDrawer(false);
    setModelName('');
  };

  const avgSpeedup =
    models.reduce((acc, m) => acc + m.speedupFactor, 0) / (models.length || 1);
  const avgNpuOffload =
    models.reduce((acc, m) => acc + m.npuComputeLoadPercent, 0) / (models.length || 1);

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="text-xs font-mono text-purple-600 dark:text-purple-400 mb-1">
            03. Qualcomm AI Hub — Edge NPU Quantization & Inference Telemetry
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white text-balance">
            Hardware-Accelerated Model Optimization & NPU Inference Tracker
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
            Compile, quantize (INT8 W8A8 / W4A16), and profile perception and proprioceptive control models across Qualcomm Dragonwing RB3 Gen 2, RB5 Robotics, and Snapdragon Flight Hexagon NPUs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCompileDrawer(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded transition-colors whitespace-nowrap"
        >
          + Submit AI Hub Compile & Profile Job
        </button>
      </div>

      {/* Top Summary Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111118] p-5">
        <div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Mean Hexagon NPU Speedup
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold tabular-nums text-purple-600 dark:text-purple-400">
              {avgSpeedup.toFixed(2)}x
            </span>
            <span className="text-xs font-mono text-neutral-400">vs FP32 CPU</span>
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Hexagon HTP Operator Offload
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
              {avgNpuOffload.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-neutral-400">% NPU graph</span>
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Active Deployed Edge Models
          </div>
          <div className="mt-1 flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold tabular-nums text-neutral-900 dark:text-white">
              {models.length}
            </span>
            <span className="text-xs font-mono text-neutral-400">QNN / ONNX / TFLite</span>
          </div>
        </div>

        <div>
          <div className="text-xs text-neutral-500 dark:text-neutral-400">
            Target Robotics / UAV SoCs
          </div>
          <div className="mt-1 text-xs font-mono text-neutral-800 dark:text-neutral-200">
            RB3 Gen 2 · RB5 · Snapdragon Flight
          </div>
        </div>
      </div>

      {/* Submit AI Hub Compile & Profile Job Drawer */}
      {showCompileDrawer && (
        <form
          onSubmit={handleCreateJob}
          className="border border-purple-500/60 bg-white dark:bg-[#111118] p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Submit Qualcomm AI Hub Model Quantization & Hardware Profiling Job
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Log a model compilation run and optionally commit the latency gain directly to a Robotics or Drone project trajectory.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowCompileDrawer(false)}
              className="text-xs text-neutral-500"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Model Identifier *
              </label>
              <input
                type="text"
                required
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="e.g. YOLOv8s-UAV-Obstacle-W8A8"
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Perception / Control Task
              </label>
              <select
                value={taskCategory}
                onChange={(e) =>
                  setTaskCategory(e.target.value as QualcommAIHubModel['taskCategory'])
                }
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              >
                <option value="Obstacle Avoidance">Obstacle Avoidance</option>
                <option value="Visual Odometry & Depth">Visual Odometry & Depth</option>
                <option value="Proprioceptive Gait">Proprioceptive Gait</option>
                <option value="6-DOF Pose Estimation">6-DOF Pose Estimation</option>
                <option value="Swarm Acoustic/RF Localization">Swarm Acoustic/RF Localization</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Linked Robotics / Drone Project
              </label>
              <select
                value={linkedProjectId}
                onChange={(e) => setLinkedProjectId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.category.toUpperCase()}] {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Target Qualcomm SoC
              </label>
              <select
                value={targetDevice}
                onChange={(e) =>
                  setTargetDevice(e.target.value as QualcommAIHubModel['targetDevice'])
                }
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              >
                <option value="Qualcomm Dragonwing RB3 Gen 2">Qualcomm Dragonwing RB3 Gen 2</option>
                <option value="Qualcomm RB5 Robotics (QRB5165)">Qualcomm RB5 Robotics (QRB5165)</option>
                <option value="Snapdragon Flight Gen 2">Snapdragon Flight Gen 2</option>
                <option value="Qualcomm IQ9 Series NPU">Qualcomm IQ9 Series NPU</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Hardware Compute Unit
              </label>
              <select
                value={computeUnit}
                onChange={(e) =>
                  setComputeUnit(e.target.value as QualcommAIHubModel['computeUnit'])
                }
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              >
                <option value="Hexagon NPU (HTP)">Hexagon NPU (HTP)</option>
                <option value="Adreno GPU (FP16)">Adreno GPU (FP16)</option>
                <option value="Kryo CPU Fallback">Kryo CPU Fallback</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Target Runtime Format
              </label>
              <select
                value={runtimeFormat}
                onChange={(e) =>
                  setRuntimeFormat(e.target.value as QualcommAIHubModel['runtimeFormat'])
                }
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              >
                <option value="Qualcomm QNN (.bin)">Qualcomm QNN (.bin)</option>
                <option value="ONNX Runtime QNN EP">ONNX Runtime QNN EP</option>
                <option value="TFLite QNN Delegate">TFLite QNN Delegate</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Quantization Precision
              </label>
              <select
                value={quantizationMode}
                onChange={(e) =>
                  setQuantizationMode(e.target.value as QualcommAIHubModel['quantizationMode'])
                }
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              >
                <option value="INT8 (W8A8)">INT8 (W8A8)</option>
                <option value="Mixed Precision (W4A16)">Mixed Precision (W4A16)</option>
                <option value="FP16">FP16</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                FP32 Baseline Latency (ms)
              </label>
              <input
                type="number"
                step="0.01"
                value={fp32BaselineLatencyMs}
                onChange={(e) => setFp32BaselineLatencyMs(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Quantized NPU Latency (ms)
              </label>
              <input
                type="number"
                step="0.01"
                value={optimizedLatencyMs}
                onChange={(e) => setOptimizedLatencyMs(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                FP32 Accuracy (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={fp32Accuracy}
                onChange={(e) => setFp32Accuracy(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Quantized NPU Accuracy (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={quantizedAccuracy}
                onChange={(e) => setQuantizedAccuracy(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-xs font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer">
            <input
              type="checkbox"
              checked={pushCommitToProject}
              onChange={(e) => setPushCommitToProject(e.target.checked)}
              className="accent-purple-600"
            />
            <span>
              Automatically commit this NPU optimization into the linked project&apos;s Performance Trajectory graph
            </span>
          </label>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowCompileDrawer(false)}
              className="px-4 py-2 text-xs text-neutral-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded"
            >
              Run Profile & Commit Telemetry
            </button>
          </div>
        </form>
      )}

      {/* Comparative Latency & Speedup Visualization + Active Model Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 7 Cols: Comparative Latency Bar Chart & Model Table */}
        <div className="lg:col-span-7 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111118] p-5 space-y-5">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
              FP32 Baseline vs. Qualcomm Hexagon NPU Quantized Inference Latency
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              On-device profiling across Dragonwing RB3 Gen 2, RB5, and Snapdragon Flight Gen 2
            </p>
          </div>

          {/* Horizontal Comparative Latency Bars */}
          <div className="space-y-4">
            {models.map((m) => {
              const isSelected = activeModel?.id === m.id;
              const maxScale = Math.max(...models.map((x) => x.fp32BaselineLatencyMs), 45);
              const fp32Pct = Math.min(100, (m.fp32BaselineLatencyMs / maxScale) * 100);
              const optPct = Math.max(3, Math.min(100, (m.optimizedLatencyMs / maxScale) * 100));

              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedModelId(m.id)}
                  className={`cursor-pointer p-3.5 border transition-colors ${
                    isSelected
                      ? 'border-purple-600 bg-purple-500/5'
                      : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-400 dark:hover:border-neutral-700'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs mb-2">
                    <div className="font-semibold text-neutral-900 dark:text-white">
                      {m.modelName}
                      <span className="ml-2 font-mono text-neutral-500 font-normal">
                        ({m.targetDevice})
                      </span>
                    </div>
                    <div className="font-mono tabular-nums text-purple-600 dark:text-purple-400 font-bold">
                      {m.speedupFactor.toFixed(2)}x Speedup ({m.quantizationMode})
                    </div>
                  </div>

                  {/* FP32 Bar */}
                  <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums mb-1.5">
                    <span className="w-24 text-neutral-500 shrink-0">FP32 CPU/GPU</span>
                    <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                      <div
                        className="h-full bg-neutral-400 dark:bg-neutral-600"
                        style={{ width: `${fp32Pct}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-neutral-600 dark:text-neutral-400">
                      {m.fp32BaselineLatencyMs.toFixed(2)} ms
                    </span>
                  </div>

                  {/* Hexagon NPU Bar */}
                  <div className="flex items-center gap-3 text-[11px] font-mono tabular-nums">
                    <span className="w-24 text-purple-600 dark:text-purple-400 font-semibold shrink-0">
                      Hexagon NPU
                    </span>
                    <div className="flex-1 h-2 bg-neutral-100 dark:bg-neutral-900 overflow-hidden">
                      <div
                        className="h-full bg-purple-600"
                        style={{ width: `${optPct}%` }}
                      />
                    </div>
                    <span className="w-16 text-right font-bold text-neutral-900 dark:text-white">
                      {m.optimizedLatencyMs.toFixed(2)} ms
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 5 Cols: Selected Qualcomm AI Hub Job Hardware Telemetry Inspector */}
        {activeModel && (
          <div className="lg:col-span-5 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111118] p-6 space-y-5">
            <div className="border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                <span className="text-purple-600 dark:text-purple-400 font-semibold">
                  JOB #{activeModel.hubJobId}
                </span>
                <span aria-hidden="true">·</span>
                <span>{activeModel.runtimeFormat}</span>
                <span aria-hidden="true">·</span>
                <span>{activeModel.profiledAt}</span>
              </div>
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white mt-1">
                {activeModel.modelName}
              </h2>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                Hardware Target: <span className="font-mono text-neutral-900 dark:text-white">{activeModel.targetDevice}</span>
              </div>
            </div>

            {/* 4-Cell NPU Profiling Matrix */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-neutral-50 dark:bg-[#09090D] border border-neutral-200 dark:border-neutral-800 font-mono text-xs tabular-nums">
              <div>
                <div className="text-[10px] text-neutral-500">ON-DEVICE NPU LATENCY</div>
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  {activeModel.optimizedLatencyMs.toFixed(2)} ms
                </div>
                <div className="text-[10px] text-neutral-500">
                  ({Math.round(1000 / activeModel.optimizedLatencyMs)} FPS sustained)
                </div>
              </div>

              <div>
                <div className="text-[10px] text-neutral-500">NPU GRAPH OFFLOAD</div>
                <div className="text-lg font-bold text-neutral-900 dark:text-white mt-0.5">
                  {activeModel.npuComputeLoadPercent.toFixed(1)}%
                </div>
                <div className="text-[10px] text-neutral-500">{activeModel.computeUnit}</div>
              </div>

              <div>
                <div className="text-[10px] text-neutral-500">ACCURACY RETENTION</div>
                <div className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                  {activeModel.quantizedAccuracy.toFixed(1)}% vs {activeModel.fp32Accuracy.toFixed(1)}%
                </div>
                <div className="text-[10px] text-neutral-500">{activeModel.accuracyMetricName}</div>
              </div>

              <div>
                <div className="text-[10px] text-neutral-500">PEAK SRAM / EFFICIENCY</div>
                <div className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                  {activeModel.peakSramMb.toFixed(1)} MB · {activeModel.powerEfficiencyInfPerWatt} Inf/W
                </div>
                <div className="text-[10px] text-neutral-500">{activeModel.quantizationMode}</div>
              </div>
            </div>

            {/* CLI Command Block */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-neutral-500 mb-1.5">
                <span>Qualcomm AI Hub CLI Reproduction Command</span>
                <button
                  type="button"
                  onClick={() => handleCopyCommand(activeModel.deploymentCommand)}
                  className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline"
                >
                  {copiedCmd ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Command</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 bg-neutral-950 text-neutral-100 text-xs font-mono overflow-x-auto border border-neutral-800 leading-relaxed">
                <code>{activeModel.deploymentCommand}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
