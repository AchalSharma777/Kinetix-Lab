import React, { useState, useEffect } from 'react';
import {
  EngineeringProject,
  ProjectCategory,
  SystemStatus,
  QualcommAIHubModel,
  HardwareBuildGuide,
} from '../types/engineering';

interface ProjectFormModalProps {
  isOpen: boolean;
  initialCategory: ProjectCategory;
  editingProject: EngineeringProject | null;
  aiHubModels: QualcommAIHubModel[];
  hardwareGuides: HardwareBuildGuide[];
  defaultImages: Record<ProjectCategory, string>;
  onClose: () => void;
  onSaveProject: (project: EngineeringProject) => void;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  initialCategory,
  editingProject,
  aiHubModels,
  hardwareGuides,
  defaultImages,
  onClose,
  onSaveProject,
}) => {
  const [name, setName] = useState('');
  const [codename, setCodename] = useState('');
  const [category, setCategory] = useState<ProjectCategory>(initialCategory);
  const [status, setStatus] = useState<SystemStatus>('NOMINAL');
  const [mcuPrimary, setMcuPrimary] = useState('STM32H743VIT6 (480 MHz)');
  const [companionCompute, setCompanionCompute] = useState(
    'Qualcomm Dragonwing RB3 Gen 2'
  );
  const [controlFrequencyHz, setControlFrequencyHz] = useState('1000');
  const [actuationTopology, setActuationTopology] = useState('');
  const [description, setDescription] = useState('');
  const [coreLogicArchitecture, setCoreLogicArchitecture] = useState('');
  const [linkedAiHubModelId, setLinkedAiHubModelId] = useState('');
  const [linkedHardwareGuideId, setLinkedHardwareGuideId] = useState('');

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setCodename(editingProject.codename);
      setCategory(editingProject.category);
      setStatus(editingProject.status);
      setMcuPrimary(editingProject.mcuPrimary);
      setCompanionCompute(editingProject.companionCompute);
      setControlFrequencyHz(String(editingProject.controlFrequencyHz));
      setActuationTopology(editingProject.actuationTopology);
      setDescription(editingProject.description);
      setCoreLogicArchitecture(editingProject.coreLogicArchitecture);
      setLinkedAiHubModelId(editingProject.linkedAiHubModelId || '');
      setLinkedHardwareGuideId(editingProject.linkedHardwareGuideId || '');
    } else {
      setName('');
      setCodename('');
      setCategory(initialCategory);
      setStatus('NOMINAL');
      setMcuPrimary(
        initialCategory === 'robotics'
          ? 'STM32H743VIT6 (480 MHz Cortex-M7)'
          : 'STM32H743 Flight Controller (Dual Gyro)'
      );
      setCompanionCompute(
        initialCategory === 'robotics'
          ? 'Qualcomm Dragonwing RB3 Gen 2 (Hexagon NPU)'
          : 'Snapdragon Flight Gen 2 (QRB5165)'
      );
      setControlFrequencyHz(initialCategory === 'robotics' ? '1000' : '4000');
      setActuationTopology(
        initialCategory === 'robotics'
          ? 'CAN-FD Quasi-Direct Drive Brushless Actuators'
          : '4x Brushless Motors + Bidirectional DShot600 ESCs'
      );
      setDescription('');
      setCoreLogicArchitecture('');
      setLinkedAiHubModelId(aiHubModels[0]?.id || '');
      setLinkedHardwareGuideId(hardwareGuides[0]?.id || '');
    }
  }, [editingProject, initialCategory, isOpen, aiHubModels, hardwareGuides]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const generatedCode =
      codename.trim() ||
      name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-')
        .substring(0, 14);

    const project: EngineeringProject = editingProject
      ? {
          ...editingProject,
          name: name.trim(),
          codename: generatedCode,
          category,
          status,
          mcuPrimary: mcuPrimary.trim(),
          companionCompute: companionCompute.trim(),
          controlFrequencyHz: parseInt(controlFrequencyHz, 10) || 1000,
          actuationTopology: actuationTopology.trim(),
          description: description.trim(),
          coreLogicArchitecture: coreLogicArchitecture.trim(),
          linkedAiHubModelId: linkedAiHubModelId || undefined,
          linkedHardwareGuideId: linkedHardwareGuideId || undefined,
          updatedAt: '2026-09-30',
        }
      : {
          id: `proj-custom-${Date.now()}`,
          name: name.trim(),
          codename: generatedCode,
          category,
          status,
          mcuPrimary: mcuPrimary.trim() || 'STM32H743VIT6',
          companionCompute: companionCompute.trim() || 'Qualcomm RB3 Gen 2',
          controlFrequencyHz: parseInt(controlFrequencyHz, 10) || 1000,
          actuationTopology: actuationTopology.trim() || 'Brushless FOC Actuators',
          updatedAt: '2026-09-30',
          imageUrl: defaultImages[category],
          description:
            description.trim() ||
            `Custom ${category} engineering platform with closed-loop telemetry and Git change tracking.`,
          coreLogicArchitecture:
            coreLogicArchitecture.trim() ||
            'Cascaded deterministic state-space feedback controller with real-time sensor fusion.',
          linkedAiHubModelId: linkedAiHubModelId || undefined,
          linkedHardwareGuideId: linkedHardwareGuideId || undefined,
          entries: [
            {
              id: `ent-init-${Date.now()}`,
              timestamp: '2026-09-30 09:00',
              entryType: 'git_commit',
              referenceCode: 'init001',
              changeDomain: 'Code',
              authorOrRig: 'Initial Architecture Baseline',
              title: 'Initialized Closed-Loop Control & Telemetry Baseline',
              summary: 'Configured hardware timers, sensor DMA readout, and initial control loop gains.',
              performanceScore: 76.0,
              deltaScore: 0,
              controlLoopLatencyMs: 0.95,
              powerDrawWatts: 110.0,
              trackingRmsError: 3.2,
              isFailure: false,
              codeOrConfigDiff: `// Initial baseline commit for ${name.trim()}\ncontroller.init(${parseInt(controlFrequencyHz, 10) || 1000});`,
            },
          ],
          codeFiles: [
            {
              id: `cf-init-${Date.now()}`,
              filename: 'main_control_loop.cpp',
              language: 'C++17',
              subsystem: 'Primary Real-Time Control Task',
              logicSummary: 'Deterministic timer interrupt control law implementation.',
              controlEquation: 'u(k) = Kp * e(k) + Kd * (e(k) - e(k-1)) / dt',
              content: `#include <cstdint>\n\nvoid runControlStep(float setpoint, float measurement, float dt) {\n  const float err = setpoint - measurement;\n  // Execute deterministic control law\n}`,
            },
          ],
        };

    onSaveProject(project);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-[#111118] p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            {editingProject ? `Edit Project — ${editingProject.name}` : 'Initialize New Engineering Project'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Hyperion Biped Ankle Actuator or Valkyrie VTOL"
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Codename
              </label>
              <input
                type="text"
                value={codename}
                onChange={(e) => setCodename(e.target.value)}
                placeholder="e.g. HYPERION-B1"
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Section Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectCategory)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              >
                <option value="robotics">Robotics</option>
                <option value="drones">Drones (UAV)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                System Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SystemStatus)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              >
                <option value="NOMINAL">NOMINAL</option>
                <option value="DRIFTING">DRIFTING</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Control Loop Rate (Hz)
              </label>
              <input
                type="number"
                value={controlFrequencyHz}
                onChange={(e) => setControlFrequencyHz(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Primary Microcontroller (MCU)
              </label>
              <input
                type="text"
                value={mcuPrimary}
                onChange={(e) => setMcuPrimary(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Companion NPU / SoC Compute
              </label>
              <input
                type="text"
                value={companionCompute}
                onChange={(e) => setCompanionCompute(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Project Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Overview of mechanical design, sensors, and mission profile..."
              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Core Control Logic & Estimation Architecture
            </label>
            <textarea
              rows={2}
              value={coreLogicArchitecture}
              onChange={(e) => setCoreLogicArchitecture(e.target.value)}
              placeholder="e.g. Whole-Body MPC + 15-State Error-State EKF + Hexagon NPU Depth Fusion"
              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-neutral-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded"
            >
              {editingProject ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
