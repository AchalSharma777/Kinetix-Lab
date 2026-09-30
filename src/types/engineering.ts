export type ProjectCategory = 'robotics' | 'drones';

export type EntryType = 'git_commit' | 'manual_experiment';

export type ChangeDomain = 'Code' | 'Hardware' | 'Simulation' | 'NPU Model';

export type SystemStatus = 'NOMINAL' | 'DRIFTING' | 'CRITICAL';

export interface PerformanceEntry {
  id: string;
  timestamp: string;
  entryType: EntryType;
  referenceCode: string; // e.g. git hash "e91b304" or experiment ID "EXP-204"
  changeDomain: ChangeDomain;
  authorOrRig: string;
  title: string;
  summary: string;
  performanceScore: number; // 0 to 100 composite index
  deltaScore: number; // positive or negative change vs previous entry
  controlLoopLatencyMs: number;
  powerDrawWatts: number;
  trackingRmsError: number; // mm or deg
  isFailure: boolean;
  failureRootCause?: string;
  remediationLogic?: string;
  codeOrConfigDiff: string;
}

export interface ProjectCodeFile {
  id: string;
  filename: string;
  language: string;
  subsystem: string;
  logicSummary: string;
  controlEquation: string;
  content: string;
}

export interface EngineeringProject {
  id: string;
  name: string;
  codename: string;
  category: ProjectCategory;
  status: SystemStatus;
  mcuPrimary: string;
  companionCompute: string;
  controlFrequencyHz: number;
  actuationTopology: string;
  updatedAt: string;
  imageUrl: string;
  description: string;
  coreLogicArchitecture: string;
  linkedAiHubModelId?: string;
  linkedHardwareGuideId?: string;
  entries: PerformanceEntry[];
  codeFiles: ProjectCodeFile[];
}

export interface MicrocontrollerLibrary {
  id: string;
  name: string;
  version: string;
  category: 'robotics' | 'drones' | 'universal';
  targetMcu: string;
  language: string;
  executionRateHz: number;
  ramFootprintKb: number;
  flashFootprintKb: number;
  summary: string;
  algorithmLogic: string;
  headerAndSourceCode: string;
  integrationSteps: string[];
  linkedHardwareGuideId?: string;
  updatedAt: string;
  isCustom?: boolean;
}

export interface BomComponent {
  partNumber: string;
  componentName: string;
  specification: string;
  quantity: number;
  subsystem: string;
  unitCostUsd: number;
}

export interface PinoutMapping {
  mcuPin: string;
  signalName: string;
  peripheralDevice: string;
  protocolOrBus: string;
  voltageLevel: string;
  electricalNotes: string;
}

export interface AssemblyStep {
  stepNumber: number;
  title: string;
  mechanicalAndWiringDetails: string;
  criticalToleranceOrWarning: string;
}

export interface HardwareBuildGuide {
  id: string;
  title: string;
  subtitle: string;
  category: ProjectCategory;
  difficulty: 'Intermediate' | 'Advanced' | 'Research-Grade';
  estimatedBuildHours: number;
  targetMcuBoard: string;
  powerBusSpec: string;
  imageUrl: string;
  overview: string;
  bom: BomComponent[];
  pinoutMatrix: PinoutMapping[];
  assemblySteps: AssemblyStep[];
  calibrationChecklist: string[];
  isCustom?: boolean;
}

export interface QualcommAIHubModel {
  id: string;
  modelName: string;
  taskCategory: 'Visual Odometry & Depth' | 'Obstacle Avoidance' | 'Proprioceptive Gait' | '6-DOF Pose Estimation' | 'Swarm Acoustic/RF Localization';
  linkedProjectId: string;
  targetDevice: 'Qualcomm Dragonwing RB3 Gen 2' | 'Qualcomm RB5 Robotics (QRB5165)' | 'Snapdragon Flight Gen 2' | 'Qualcomm IQ9 Series NPU';
  computeUnit: 'Hexagon NPU (HTP)' | 'Adreno GPU (FP16)' | 'Kryo CPU Fallback';
  runtimeFormat: 'Qualcomm QNN (.bin)' | 'TFLite QNN Delegate' | 'ONNX Runtime QNN EP';
  quantizationMode: 'INT8 (W8A8)' | 'Mixed Precision (W4A16)' | 'FP16' | 'FP32 Baseline';
  fp32BaselineLatencyMs: number;
  optimizedLatencyMs: number;
  speedupFactor: number;
  npuComputeLoadPercent: number;
  peakSramMb: number;
  powerEfficiencyInfPerWatt: number;
  accuracyMetricName: string;
  fp32Accuracy: number;
  quantizedAccuracy: number;
  hubJobId: string;
  profiledAt: string;
  deploymentCommand: string;
}
