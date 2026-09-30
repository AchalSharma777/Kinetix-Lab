import React, { useState } from 'react';
import { MicrocontrollerLibrary, HardwareBuildGuide } from '../types/engineering';
import { Copy, Check, Plus, Search, Trash2, Edit3 } from 'lucide-react';

interface MicrocontrollerLibrariesViewProps {
  libraries: MicrocontrollerLibrary[];
  hardwareGuides: HardwareBuildGuide[];
  onSaveLibrary: (lib: MicrocontrollerLibrary) => void;
  onDeleteLibrary: (id: string) => void;
  onNavigateToHardware: (guideId?: string) => void;
}

export const MicrocontrollerLibrariesView: React.FC<MicrocontrollerLibrariesViewProps> = ({
  libraries,
  hardwareGuides,
  onSaveLibrary,
  onDeleteLibrary,
  onNavigateToHardware,
}) => {
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'robotics' | 'drones' | 'universal'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLibId, setSelectedLibId] = useState<string>(libraries[0]?.id || '');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Add/Edit Library Form State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [version, setVersion] = useState('v1.0.0');
  const [category, setCategory] = useState<'robotics' | 'drones' | 'universal'>('robotics');
  const [targetMcu, setTargetMcu] = useState('STM32H743 / Teensy 4.1');
  const [language, setLanguage] = useState('C++17 (Zero-Heap)');
  const [executionRateHz, setExecutionRateHz] = useState('1000');
  const [ramFootprintKb, setRamFootprintKb] = useState('2.0');
  const [flashFootprintKb, setFlashFootprintKb] = useState('6.4');
  const [summary, setSummary] = useState('');
  const [algorithmLogic, setAlgorithmLogic] = useState('');
  const [integrationText, setIntegrationText] = useState('');
  const [headerAndSourceCode, setHeaderAndSourceCode] = useState('');
  const [linkedHardwareGuideId, setLinkedHardwareGuideId] = useState<string>(
    hardwareGuides[0]?.id || ''
  );

  const filteredLibs = libraries.filter((lib) => {
    const matchesCat = categoryFilter === 'all' || lib.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      lib.name.toLowerCase().includes(q) ||
      lib.targetMcu.toLowerCase().includes(q) ||
      lib.summary.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const activeLib =
    filteredLibs.find((l) => l.id === selectedLibId) || filteredLibs[0] || libraries[0];

  const openCreateModal = () => {
    setEditingId(null);
    setName('');
    setVersion('v1.0.0');
    setCategory('robotics');
    setTargetMcu('STM32H743 / ESP32-S3 / Teensy 4.1');
    setLanguage('C++17 (Deterministic)');
    setExecutionRateHz('2000');
    setRamFootprintKb('1.8');
    setFlashFootprintKb('5.2');
    setSummary('');
    setAlgorithmLogic('');
    setIntegrationText(
      'Configure hardware timer interrupt at target loop rate.\nBind DMA sensor read completion callback.\nStep controller and write actuator PWM/CAN command.'
    );
    setHeaderAndSourceCode(
      `#pragma once\n#include <cstdint>\n\nnamespace kinetix::custom {\n\nclass CustomMcuModule {\npublic:\n  void init() noexcept {}\n  float update(float input_val, float dt) noexcept {\n    return input_val;\n  }\n};\n\n} // namespace kinetix::custom`
    );
    setShowModal(true);
  };

  const openEditModal = (lib: MicrocontrollerLibrary) => {
    setEditingId(lib.id);
    setName(lib.name);
    setVersion(lib.version);
    setCategory(lib.category);
    setTargetMcu(lib.targetMcu);
    setLanguage(lib.language);
    setExecutionRateHz(String(lib.executionRateHz));
    setRamFootprintKb(String(lib.ramFootprintKb));
    setFlashFootprintKb(String(lib.flashFootprintKb));
    setSummary(lib.summary);
    setAlgorithmLogic(lib.algorithmLogic);
    setIntegrationText(lib.integrationSteps.join('\n'));
    setHeaderAndSourceCode(lib.headerAndSourceCode);
    setLinkedHardwareGuideId(lib.linkedHardwareGuideId || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !headerAndSourceCode.trim()) return;

    const steps = integrationText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const saved: MicrocontrollerLibrary = {
      id: editingId || `lib-custom-${Date.now()}`,
      name: name.trim(),
      version: version.trim() || 'v1.0.0',
      category,
      targetMcu: targetMcu.trim() || 'STM32H7 / ARM Cortex-M7',
      language: language.trim() || 'C++17',
      executionRateHz: parseInt(executionRateHz, 10) || 1000,
      ramFootprintKb: parseFloat(ramFootprintKb) || 1.5,
      flashFootprintKb: parseFloat(flashFootprintKb) || 4.0,
      summary: summary.trim() || 'Custom embedded microcontroller driver and control law library.',
      algorithmLogic:
        algorithmLogic.trim() || 'Deterministic fixed-timestep execution without dynamic heap allocation.',
      headerAndSourceCode,
      integrationSteps: steps.length > 0 ? steps : ['Include header and invoke step() inside real-time timer ISR.'],
      linkedHardwareGuideId: linkedHardwareGuideId || undefined,
      updatedAt: '2026-09-30',
      isCustom: true,
    };

    onSaveLibrary(saved);
    setSelectedLibId(saved.id);
    setShowModal(false);
  };

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
        <div>
          <div className="text-xs font-mono text-purple-600 dark:text-purple-400 mb-1">
            04. Embedded Microcontroller Firmware Repository
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white text-balance">
            Pre-Built & Custom Microcontroller Code Libraries
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
            Zero-heap real-time C++17 drivers and control algorithms for STM32H7/F4, Teensy 4.1, ESP32-S3, RP2040, and Qualcomm companion bridges. Add your own custom libraries at any time.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded transition-colors whitespace-nowrap"
        >
          + Add Microcontroller Library
        </button>
      </div>

      {/* Create / Edit Library Form Drawer */}
      {showModal && (
        <form
          onSubmit={handleSubmit}
          className="border border-purple-500/60 bg-white dark:bg-[#111118] p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
              {editingId ? 'Edit Microcontroller Code Library' : 'Add Custom Microcontroller Code Library'}
            </h3>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Library Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. FocCurrentLoopDmaDriver or CpgHexapodGait"
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Version
              </label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Target Domain
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'robotics' | 'drones' | 'universal')}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              >
                <option value="robotics">Robotics (Actuators / Kinematics)</option>
                <option value="drones">Drones (Flight Control / ESC / VIO)</option>
                <option value="universal">Universal (Filters / Bus / Math)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Target Microcontrollers (MCU)
              </label>
              <input
                type="text"
                value={targetMcu}
                onChange={(e) => setTargetMcu(e.target.value)}
                placeholder="e.g. STM32H743 / ESP32-S3 / Teensy 4.1"
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Max Loop Rate (Hz)
              </label>
              <input
                type="number"
                value={executionRateHz}
                onChange={(e) => setExecutionRateHz(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                SRAM Footprint (KB)
              </label>
              <input
                type="number"
                step="0.1"
                value={ramFootprintKb}
                onChange={(e) => setRamFootprintKb(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Linked Hardware Guide
              </label>
              <select
                value={linkedHardwareGuideId}
                onChange={(e) => setLinkedHardwareGuideId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              >
                <option value="">None</option>
                {hardwareGuides.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Functional Summary
              </label>
              <textarea
                rows={2}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="What task does this microcontroller library perform?"
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                Mathematical & Timing Logic
              </label>
              <textarea
                rows={2}
                value={algorithmLogic}
                onChange={(e) => setAlgorithmLogic(e.target.value)}
                placeholder="Describe interrupt timing, DMA synchronization, or state-space math..."
                className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Hardware & Firmware Integration Steps (One per line)
            </label>
            <textarea
              rows={3}
              value={integrationText}
              onChange={(e) => setIntegrationText(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Microcontroller Header / Source Code *
            </label>
            <textarea
              rows={8}
              required
              value={headerAndSourceCode}
              onChange={(e) => setHeaderAndSourceCode(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-medium text-neutral-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded"
            >
              {editingId ? 'Save Library Updates' : 'Publish Library to Repository'}
            </button>
          </div>
        </form>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-[#111118] border border-neutral-200 dark:border-neutral-800 rounded">
          {(['all', 'robotics', 'drones', 'universal'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded capitalize transition-colors whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-purple-600 text-white'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              {cat === 'all' ? 'All Libraries' : cat}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by MCU (STM32, Teensy, ESP32) or protocol..."
            className="w-full pl-8 pr-3 py-2 text-xs bg-white dark:bg-[#111118] border border-neutral-200 dark:border-neutral-800 rounded text-neutral-900 dark:text-white"
          />
        </div>
      </div>

      {/* Split Layout: Left Library List (5 cols) + Right Code & Integration Inspector (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-3">
          {filteredLibs.map((lib) => {
            const isSelected = activeLib?.id === lib.id;
            return (
              <div
                key={lib.id}
                onClick={() => setSelectedLibId(lib.id)}
                className={`cursor-pointer border p-4 transition-colors ${
                  isSelected
                    ? 'border-purple-600 bg-white dark:bg-[#111118]'
                    : 'border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#0D0D14] hover:border-neutral-400 dark:hover:border-neutral-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    <span className="text-purple-600 dark:text-purple-400 font-semibold">
                      {lib.version}
                    </span>
                    <span className="mx-1.5">·</span>
                    <span className="capitalize">{lib.category}</span>
                    <span className="mx-1.5">·</span>
                    <span>{lib.executionRateHz} Hz</span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openEditModal(lib)}
                      className="p-1 text-neutral-400 hover:text-purple-500 transition-colors"
                      title="Edit library"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {libraries.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteLibrary(lib.id)}
                        className="p-1 text-neutral-400 hover:text-rose-500 transition-colors"
                        title="Delete library"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-bold text-neutral-900 dark:text-white mt-1">
                  {lib.name}
                </h3>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1.5 line-clamp-2">
                  {lib.summary}
                </p>

                <div className="pt-3 mt-3 border-t border-neutral-200 dark:border-neutral-800/80 flex items-center justify-between text-[11px] font-mono text-neutral-500 tabular-nums">
                  <span className="truncate max-w-[220px]">{lib.targetMcu}</span>
                  <span>
                    SRAM: {lib.ramFootprintKb}KB · Flash: {lib.flashFootprintKb}KB
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right 7 Cols: Active Library Source Code & Hardware Wiring Link */}
        {activeLib && (
          <div className="lg:col-span-7 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111118] p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  <span className="text-purple-600 dark:text-purple-400 font-semibold">
                    {activeLib.version}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{activeLib.language}</span>
                  <span aria-hidden="true">·</span>
                  <span>Updated {activeLib.updatedAt}</span>
                </div>
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mt-1">
                  {activeLib.name}
                </h2>
                <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-1">
                  Target MCU: <span className="text-neutral-900 dark:text-neutral-200">{activeLib.targetMcu}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeLib.linkedHardwareGuideId && (
                  <button
                    type="button"
                    onClick={() => onNavigateToHardware(activeLib.linkedHardwareGuideId)}
                    className="px-3 py-1.5 text-xs font-medium border border-purple-500/40 bg-purple-500/10 text-purple-700 dark:text-purple-300 hover:bg-purple-500/20 rounded transition-colors whitespace-nowrap"
                  >
                    View Mechatronics Build Guide
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleCopy(activeLib.id, activeLib.headerAndSourceCode)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border border-neutral-300 dark:border-neutral-700 rounded hover:border-purple-500 text-neutral-800 dark:text-neutral-200 transition-colors"
                >
                  {copiedId === activeLib.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Header</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Footprint & Loop Telemetry Strip */}
            <div className="grid grid-cols-3 gap-4 p-3.5 bg-neutral-50 dark:bg-[#09090D] border border-neutral-200 dark:border-neutral-800 font-mono text-xs tabular-nums">
              <div>
                <div className="text-[10px] text-neutral-500">MAX DETERMINISTIC RATE</div>
                <div className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                  {activeLib.executionRateHz} Hz
                </div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500">STATIC SRAM FOOTPRINT</div>
                <div className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                  {activeLib.ramFootprintKb.toFixed(1)} KB (0 B Heap)
                </div>
              </div>
              <div>
                <div className="text-[10px] text-neutral-500">FLASH FOOTPRINT</div>
                <div className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                  {activeLib.flashFootprintKb.toFixed(1)} KB
                </div>
              </div>
            </div>

            {/* Algorithm Logic & Integration Steps */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                  Control & Driver Architecture Logic
                </h4>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1 leading-relaxed">
                  {activeLib.algorithmLogic}
                </p>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-neutral-900 dark:text-white mb-1.5">
                  Microcontroller Integration Checklist
                </h4>
                <ol className="space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300 list-decimal list-inside">
                  {activeLib.integrationSteps.map((step, i) => (
                    <li key={i} className="leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Full Copyable Embedded C++ Source Code */}
            <div>
              <div className="text-xs font-mono text-neutral-500 mb-1.5">
                Embedded Source Implementation ({activeLib.language})
              </div>
              <pre className="p-4 bg-neutral-950 text-neutral-100 text-xs font-mono overflow-x-auto border border-neutral-800 leading-relaxed max-h-[420px]">
                <code>{activeLib.headerAndSourceCode}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
