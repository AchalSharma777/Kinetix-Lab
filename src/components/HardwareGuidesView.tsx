import React, { useState } from 'react';
import {
  HardwareBuildGuide,
  ProjectCategory,
  BomComponent,
  PinoutMapping,
  AssemblyStep,
} from '../types/engineering';
import { CheckSquare, Square, AlertTriangle, Plus, Wrench } from 'lucide-react';

interface HardwareGuidesViewProps {
  guides: HardwareBuildGuide[];
  initialSelectedGuideId?: string;
  onAddGuide: (guide: HardwareBuildGuide) => void;
}

export const HardwareGuidesView: React.FC<HardwareGuidesViewProps> = ({
  guides,
  initialSelectedGuideId,
  onAddGuide,
}) => {
  const [selectedId, setSelectedId] = useState<string>(
    initialSelectedGuideId || guides[0]?.id || ''
  );
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states for adding a new custom Mechatronics Hardware Build Guide
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState<ProjectCategory>('robotics');
  const [difficulty, setDifficulty] = useState<'Intermediate' | 'Advanced' | 'Research-Grade'>('Advanced');
  const [estimatedBuildHours, setEstimatedBuildHours] = useState('8');
  const [targetMcuBoard, setTargetMcuBoard] = useState('');
  const [powerBusSpec, setPowerBusSpec] = useState('');
  const [overview, setOverview] = useState('');
  const [pinoutLine, setPinoutLine] = useState('PA8 / PA9 | TIM1_CH1..2 | Brushless FOC Driver | PWM 24kHz | 3.3V | Keep away from buck inductor');
  const [stepTitle, setStepTitle] = useState('');
  const [stepDetails, setStepDetails] = useState('');
  const [stepWarning, setStepWarning] = useState('');

  const activeGuide =
    guides.find((g) => g.id === (initialSelectedGuideId || selectedId)) ||
    guides.find((g) => g.id === selectedId) ||
    guides[0];

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCreateGuide = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parts = pinoutLine.split('|').map((s) => s.trim());
    const pinout: PinoutMapping = {
      mcuPin: parts[0] || 'PD0 / PD1',
      signalName: parts[1] || 'CAN_RX / CAN_TX',
      peripheralDevice: parts[2] || 'Actuator Transceiver',
      protocolOrBus: parts[3] || 'CAN-FD 5Mbps',
      voltageLevel: parts[4] || '3.3V Logic',
      electricalNotes: parts[5] || '120-Ohm termination resistor required at bus ends.',
    };

    const step: AssemblyStep = {
      stepNumber: 1,
      title: stepTitle.trim() || 'Mechanical Sub-Assembly & Bus Harnessing',
      mechanicalAndWiringDetails:
        stepDetails.trim() ||
        'Mount actuator housings with Loctite 243 and route twisted-pair bus away from switching phases.',
      criticalToleranceOrWarning:
        stepWarning.trim() || 'Verify continuity and ground isolation before energizing main DC bus.',
    };

    const newGuide: HardwareBuildGuide = {
      id: `hw-custom-${Date.now()}`,
      title: title.trim(),
      subtitle: subtitle.trim() || `${targetMcuBoard} + ${powerBusSpec}`,
      category,
      difficulty,
      estimatedBuildHours: parseInt(estimatedBuildHours, 10) || 8,
      targetMcuBoard: targetMcuBoard.trim() || 'STM32H743 + Companion Compute',
      powerBusSpec: powerBusSpec.trim() || '24V–48V DC Regulated Bus',
      imageUrl: guides[0]?.imageUrl || '',
      overview:
        overview.trim() ||
        'Custom mechatronics assembly, pinout wiring matrix, and smoke-test calibration specification.',
      bom: [
        {
          partNumber: 'CUSTOM-01',
          componentName: targetMcuBoard.trim() || 'Primary Real-Time Microcontroller Carrier',
          specification: 'High-rate hardware timers, SPI/CAN-FD DMA',
          quantity: 1,
          subsystem: 'Control Electronics',
          unitCostUsd: 75,
        },
      ],
      pinoutMatrix: [pinout],
      assemblySteps: [step],
      calibrationChecklist: [
        'Verify power rail continuity and zero short-circuit between V+ and chassis ground.',
        'Confirm sensor SPI/CAN packet CRC integrity at full control loop frequency.',
      ],
      isCustom: true,
    };

    onAddGuide(newGuide);
    setSelectedId(newGuide.id);
    setShowAddModal(false);
    setTitle('');
    setSubtitle('');
    setOverview('');
  };

  if (!activeGuide) return null;

  const totalBomCost = activeGuide.bom.reduce(
    (acc, item) => acc + item.quantity * item.unitCostUsd,
    0
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="text-xs font-mono text-purple-600 dark:text-purple-400 mb-1">
            05. Mechatronics Hardware Assembly & Pinout Schematics
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white text-balance">
            Mechatronics Build Instructions & MCU Wiring Matrices
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
            Step-by-step mechanical tolerances, microcontroller pinout tables, Bill of Materials (BOM), and pre-power calibration checklists for robotics and UAV hardware.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded transition-colors whitespace-nowrap"
        >
          + Add Hardware Build Guide
        </button>
      </div>

      {/* Add Custom Hardware Guide Drawer */}
      {showAddModal && (
        <form
          onSubmit={handleCreateGuide}
          className="border border-purple-500/60 bg-white dark:bg-[#111118] p-6 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              Create Custom Mechatronics Hardware Build Guide
            </h3>
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="text-xs text-neutral-500"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Hardware Guide Title *"
              className="px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
            />
            <input
              type="text"
              value={targetMcuBoard}
              onChange={(e) => setTargetMcuBoard(e.target.value)}
              placeholder="Target MCU Board (e.g. STM32H743 + CAN Bus)"
              className="px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
            />
            <input
              type="text"
              value={powerBusSpec}
              onChange={(e) => setPowerBusSpec(e.target.value)}
              placeholder="Power Bus (e.g. 6S–12S LiPo / 48V DC)"
              className="px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ProjectCategory)}
              className="px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
            >
              <option value="robotics">Robotics Mechatronics</option>
              <option value="drones">Drone / UAV Airframe & Avionics</option>
            </select>
            <select
              value={difficulty}
              onChange={(e) =>
                setDifficulty(e.target.value as 'Intermediate' | 'Advanced' | 'Research-Grade')
              }
              className="px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
            >
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
              <option value="Research-Grade">Research-Grade</option>
            </select>
            <input
              type="number"
              value={estimatedBuildHours}
              onChange={(e) => setEstimatedBuildHours(e.target.value)}
              placeholder="Build Hours"
              className="px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
            />
          </div>

          <textarea
            rows={2}
            value={overview}
            onChange={(e) => setOverview(e.target.value)}
            placeholder="Architectural overview of the mechanical & electrical assembly..."
            className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
          />

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Primary Pinout Mapping (Format: Pin | Signal | Peripheral | Bus | Voltage | Notes)
            </label>
            <input
              type="text"
              value={pinoutLine}
              onChange={(e) => setPinoutLine(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              value={stepTitle}
              onChange={(e) => setStepTitle(e.target.value)}
              placeholder="Step 1 Title (e.g. Stator Press Fit & Encoder Gap)"
              className="px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
            />
            <input
              type="text"
              value={stepDetails}
              onChange={(e) => setStepDetails(e.target.value)}
              placeholder="Mechanical & wiring procedure..."
              className="px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
            />
            <input
              type="text"
              value={stepWarning}
              onChange={(e) => setStepWarning(e.target.value)}
              placeholder="Critical tolerance / safety warning..."
              className="px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded"
            >
              Save Hardware Build Guide
            </button>
          </div>
        </form>
      )}

      {/* Guide Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {guides.map((g) => {
          const isSelected = g.id === activeGuide.id;
          return (
            <div
              key={g.id}
              onClick={() => setSelectedId(g.id)}
              className={`cursor-pointer border p-4 transition-colors ${
                isSelected
                  ? 'border-purple-600 bg-white dark:bg-[#111118]'
                  : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#0D0D14] hover:border-neutral-400 dark:hover:border-neutral-700'
              }`}
            >
              <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                <span className="text-purple-600 dark:text-purple-400 font-semibold capitalize">
                  {g.category}
                </span>
                <span className="mx-1.5">·</span>
                <span>{g.difficulty}</span>
                <span className="mx-1.5">·</span>
                <span>{g.estimatedBuildHours} hrs</span>
              </div>
              <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-1">
                {g.title}
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-mono truncate">
                {g.targetMcuBoard}
              </p>
            </div>
          );
        })}
      </div>

      {/* Active Hardware Guide Detail Workbench */}
      <div className="border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111118] p-6 space-y-8">
        {/* Top Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-6 border-b border-neutral-200 dark:border-neutral-800">
          <div className="lg:col-span-4 bg-neutral-950 border border-neutral-800 overflow-hidden h-52">
            <img
              src={activeGuide.imageUrl}
              alt={activeGuide.title}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="lg:col-span-8 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono text-purple-600 dark:text-purple-400">
                {activeGuide.subtitle}
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mt-1">
                {activeGuide.title}
              </h2>
              <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-2 leading-relaxed">
                {activeGuide.overview}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 mt-4 border-t border-neutral-200 dark:border-neutral-800 font-mono text-xs tabular-nums">
              <div>
                <div className="text-[10px] text-neutral-500">PRIMARY MCU</div>
                <div className="font-semibold text-neutral-900 dark:text-white mt-0.5 truncate">
                  {activeGuide.targetMcuBoard.split('+')[0]}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500">POWER BUS ARCHITECTURE</div>
                <div className="font-semibold text-neutral-900 dark:text-white mt-0.5 truncate">
                  {activeGuide.powerBusSpec.split('+')[0]}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500">EST. ASSEMBLY TIME</div>
                <div className="font-semibold text-neutral-900 dark:text-white mt-0.5">
                  {activeGuide.estimatedBuildHours} Hours
                </div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500">SUBSYSTEM BOM COST</div>
                <div className="font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                  ${totalBomCost.toFixed(2)} USD
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 1. Microcontroller Pinout & Bus Wiring Matrix */}
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-3">
            01. Microcontroller Pinout & Bus Wiring Matrix
          </h3>
          <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-50 dark:bg-[#09090D] border-b border-neutral-200 dark:border-neutral-800 font-mono text-[11px] text-neutral-500">
                  <th className="py-2.5 px-3">MCU Pin(s)</th>
                  <th className="py-2.5 px-3">Signal Name</th>
                  <th className="py-2.5 px-3">Target Peripheral</th>
                  <th className="py-2.5 px-3">Bus / Protocol</th>
                  <th className="py-2.5 px-3">Logic Level</th>
                  <th className="py-2.5 px-3">Electrical & Layout Rule</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {activeGuide.pinoutMatrix.map((pin, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 px-3 font-mono font-semibold text-purple-600 dark:text-purple-400 whitespace-nowrap">
                      {pin.mcuPin}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-900 dark:text-white whitespace-nowrap">
                      {pin.signalName}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-800 dark:text-neutral-200">
                      {pin.peripheralDevice}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {pin.protocolOrBus}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                      {pin.voltageLevel}
                    </td>
                    <td className="py-2.5 px-3 text-neutral-600 dark:text-neutral-400">
                      {pin.electricalNotes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Step-by-Step Mechanical & Electrical Assembly Instructions */}
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-3">
            02. Mechanical & Electrical Assembly Procedure
          </h3>
          <div className="space-y-4">
            {activeGuide.assemblySteps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-4 border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#09090D]"
              >
                <div className="text-xs font-mono text-purple-600 dark:text-purple-400 font-semibold">
                  STEP 0{step.stepNumber}
                </div>
                <h4 className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                  {step.title}
                </h4>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 mt-1.5 leading-relaxed">
                  {step.mechanicalAndWiringDetails}
                </p>
                <div className="mt-3 p-2.5 border-l-2 border-purple-500 bg-purple-500/5 text-xs text-neutral-700 dark:text-neutral-300 font-mono">
                  Tolerance / Caution: {step.criticalToleranceOrWarning}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Bill of Materials (BOM) & Pre-Power Calibration Checklist */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-3">
              03. Bill of Materials (BOM)
            </h3>
            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-neutral-50 dark:bg-[#09090D] border-b border-neutral-200 dark:border-neutral-800 font-mono text-[11px] text-neutral-500">
                    <th className="py-2 px-3">Part #</th>
                    <th className="py-2 px-3">Component & Specification</th>
                    <th className="py-2 px-3 text-right">Qty</th>
                    <th className="py-2 px-3 text-right">Unit USD</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {activeGuide.bom.map((item, i) => (
                    <tr key={i}>
                      <td className="py-2.5 px-3 font-mono text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                        {item.partNumber}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-neutral-900 dark:text-white">
                          {item.componentName}
                        </div>
                        <div className="text-neutral-500 dark:text-neutral-400 text-[11px]">
                          {item.specification}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-neutral-900 dark:text-white">
                        ${item.unitCostUsd.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Smoke-Test & Calibration Verification Checklist */}
          <div className="lg:col-span-5">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-3">
              04. Pre-Power Smoke-Test & Calibration Checklist
            </h3>
            <div className="border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#09090D] p-4 space-y-3">
              {activeGuide.calibrationChecklist.map((item, idx) => {
                const key = `${activeGuide.id}-chk-${idx}`;
                const isDone = !!checkedItems[key];
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleCheck(key)}
                    className="w-full flex items-start gap-3 text-left text-xs group"
                  >
                    {isDone ? (
                      <CheckSquare className="w-4 h-4 text-purple-500 shrink-0 mt-0.5" />
                    ) : (
                      <Square className="w-4 h-4 text-neutral-400 group-hover:text-purple-400 shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`leading-relaxed ${
                        isDone
                          ? 'line-through text-neutral-400 dark:text-neutral-500'
                          : 'text-neutral-800 dark:text-neutral-200'
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
