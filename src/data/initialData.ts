import {
  EngineeringProject,
  MicrocontrollerLibrary,
  HardwareBuildGuide,
  QualcommAIHubModel,
} from '../types/engineering';

import quadrupedImg from '../assets/images/robotics_quadruped_chassis_1790780575271.jpg';
import manipulatorImg from '../assets/images/robotics_6dof_manipulator_1790780592439.jpg';
import vtolDroneImg from '../assets/images/drone_autonomous_vtol_1790780606825.jpg';
import swarmDroneImg from '../assets/images/drone_swarm_micro_uav_1790780624613.jpg';

export const INITIAL_PROJECTS: EngineeringProject[] = [
  {
    id: 'proj-robo-quadruped',
    name: 'Q-Stride M2 Dynamic Torque Quadruped',
    codename: 'Q-STRIDE-M2',
    category: 'robotics',
    status: 'NOMINAL',
    mcuPrimary: 'STM32H743VIT6 (480 MHz Dual-Issue)',
    companionCompute: 'Qualcomm Dragonwing RB3 Gen 2 (Hexagon NPU)',
    controlFrequencyHz: 1000,
    actuationTopology: '12-DOF Quasi-Direct Drive (8:1 Planetary + FOC CAN-FD)',
    updatedAt: '2026-09-29',
    imageUrl: quadrupedImg,
    description:
      '12-DOF agile quadruped locomotion platform combining a 1kHz low-level FOC torque controller on STM32H7 with a 200Hz convex Model Predictive Control (MPC) stance solver and Hexagon NPU proprioceptive slip estimator.',
    coreLogicArchitecture:
      'Hierarchical Whole-Body Control (WBC): Swing legs follow cubic Bezier foot trajectories with impedance feedback, while stance legs solve a constrained Quadratic Program (QP) minimizing ground reaction force divergence under friction pyramid constraints.',
    linkedAiHubModelId: 'qai-terrain-mlp-01',
    linkedHardwareGuideId: 'hw-guide-qdd-leg',
    entries: [
      {
        id: 'ent-q-1',
        timestamp: '2026-09-12 10:15',
        entryType: 'git_commit',
        referenceCode: '7a19d02',
        changeDomain: 'Code',
        authorOrRig: 'Main Lab Bench',
        title: 'Initial 500Hz PD Joint Impedance Baseline',
        summary:
          'Implemented baseline joint-space PD impedance loop across 3 buses (Ab/Ad, Hip, Knee) over 5Mbps CAN-FD.',
        performanceScore: 68.4,
        deltaScore: 0,
        controlLoopLatencyMs: 1.92,
        powerDrawWatts: 142.0,
        trackingRmsError: 8.4,
        isFailure: false,
        codeOrConfigDiff: `// Joint impedance law baseline
tau_cmd[i] = kp[i] * (q_des[i] - q_meas[i]) + kd[i] * (dq_des[i] - dq_meas[i]);
can_fd_send_torque_frame(bus_id, motor_id, tau_cmd[i]);`,
      },
      {
        id: 'ent-q-2',
        timestamp: '2026-09-15 16:40',
        entryType: 'git_commit',
        referenceCode: 'b83e419',
        changeDomain: 'Simulation',
        authorOrRig: 'MuJoCo Sim Cluster',
        title: 'Convex MPC Ground Reaction Force Solver Integration',
        summary:
          'Added 10-step horizon linearized centroidal dynamics QP solver for stance phase force distribution.',
        performanceScore: 79.8,
        deltaScore: 11.4,
        controlLoopLatencyMs: 1.54,
        powerDrawWatts: 128.5,
        trackingRmsError: 5.1,
        isFailure: false,
        codeOrConfigDiff: `// Friction cone constraint: |fx| <= mu * fz, |fy| <= mu * fz
qp_problem.set_friction_coeff(0.65f);
qp_problem.set_weights(Q_com_rpy, R_grf_norm);
solve_osqp_warmstart(&mpc_workspace);`,
      },
      {
        id: 'ent-q-3',
        timestamp: '2026-09-18 14:22',
        entryType: 'manual_experiment',
        referenceCode: 'EXP-2026-041',
        changeDomain: 'Hardware',
        authorOrRig: 'Treadmill Rig B (18° Incline)',
        title: 'Swapped Knee Stage to 9:1 Hybrid Steel Carrier Without Re-tuning Current Loop',
        summary:
          'Mechanical upgrade increased rotor reflected inertia by 34%; uncompensated d-q current PI bandwidth triggered violent 44Hz resonant oscillation.',
        performanceScore: 54.2,
        deltaScore: -25.6,
        controlLoopLatencyMs: 2.38,
        powerDrawWatts: 218.4,
        trackingRmsError: 16.9,
        isFailure: true,
        failureRootCause:
          'Reflected rotor inertia J_r rose from 1.12e-4 to 1.50e-4 kg·m². Existing Kd derivative gain amplified encoder quantization noise at the 44Hz structural frame resonance, overheating Rear-Right knee MOSFET phase B to 96°C.',
        remediationLogic:
          'Insert 2nd-order Butterworth low-pass filter (fc=85Hz) + cascaded biquad notch filter centered at 44Hz on dq_meas before derivative multiplication, and lower FOC current loop Ki by 22%.',
        codeOrConfigDiff: `[FAILURE TELEMETRY SNAPSHOT - EXP-2026-041]
RR_KNEE_TEMP_PEAK   : 96.4 degC (THERMAL TRIP THRESHOLD: 95.0 degC)
PHASE_B_CURRENT_RMS : 28.7 A    (NOMINAL: 11.2 A)
RESONANT_PEAK_FFT   : 44.2 Hz @ +14.8 dB`,
      },
      {
        id: 'ent-q-4',
        timestamp: '2026-09-21 19:05',
        entryType: 'git_commit',
        referenceCode: 'c4f8a12',
        changeDomain: 'Code',
        authorOrRig: 'Firmware Branch fix/notch-biquad',
        title: 'Biquad 44Hz Notch Filter + DMA Double-Buffered SPI IMU Readout',
        summary:
          'Eliminated knee gear stage structural resonance and moved BMI088 IMU sampling to DMA circular buffer triggered by TIM1 PWM center.',
        performanceScore: 84.6,
        deltaScore: 30.4,
        controlLoopLatencyMs: 1.18,
        powerDrawWatts: 119.0,
        trackingRmsError: 3.4,
        isFailure: false,
        codeOrConfigDiff: `// Biquad Notch Filter @ 44Hz (Fs = 1000Hz, Q = 4.5)
float y = b0 * dq_raw + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
x2 = x1; x1 = dq_raw; y2 = y1; y1 = y;
dq_filtered = y;`,
      },
      {
        id: 'ent-q-5',
        timestamp: '2026-09-24 11:30',
        entryType: 'git_commit',
        referenceCode: 'd10a99c',
        changeDomain: 'Simulation',
        authorOrRig: 'Domain Randomization Pipeline',
        title: 'Aggressive Swing-Leg Clearance Trajectory on Wet Tile Terrain',
        summary:
          'Increased swing Z-apex from 7cm to 13cm without scaling hip pitch velocity feed-forward; caused late touchdown impact spikes.',
        performanceScore: 73.1,
        deltaScore: -11.5,
        controlLoopLatencyMs: 1.25,
        powerDrawWatts: 154.2,
        trackingRmsError: 6.8,
        isFailure: true,
        failureRootCause:
          'Higher vertical swing trajectory doubled vertical foot velocity at touchdown (1.4 m/s), saturating the contact force estimator threshold and causing premature stance transition 18ms before physical ground contact.',
        remediationLogic:
          'Replace binary Z-force threshold with probabilistic contact Kalman fusion combining motor current residual and Qualcomm Hexagon NPU proprioceptive slip classifier.',
        codeOrConfigDiff: `- if (foot_force_z[leg] > 18.0f) state[leg] = STANCE;
+ float p_contact = qnn_proprioceptive_contact_prob(tau_residual[leg], imu_acc_z, leg_phase);
+ if (p_contact > 0.82f) state[leg] = STANCE;`,
      },
      {
        id: 'ent-q-6',
        timestamp: '2026-09-28 21:10',
        entryType: 'git_commit',
        referenceCode: 'e91b304',
        changeDomain: 'NPU Model',
        authorOrRig: 'Qualcomm RB3 Gen 2 + STM32H7',
        title: 'Deployed INT8 Proprioceptive Terrain & Contact Classifier on Hexagon NPU',
        summary:
          'Compiled 4-layer temporal TCN model via Qualcomm AI Hub (W8A8 QNN). Real-time friction coefficient mu estimation adapts MPC pyramid bounds in 0.62ms.',
        performanceScore: 95.4,
        deltaScore: 22.3,
        controlLoopLatencyMs: 0.94,
        powerDrawWatts: 112.4,
        trackingRmsError: 1.72,
        isFailure: false,
        codeOrConfigDiff: `// Qualcomm QNN HTP inference callback -> adaptive friction cone
float mu_est = clamp(qnn_htp_output_tensor[0], 0.18f, 0.85f);
mpc_solver.update_friction_pyramid(leg_idx, mu_est);`,
      },
    ],
    codeFiles: [
      {
        id: 'cf-q-1',
        filename: 'mpc_stance_solver.cpp',
        language: 'C++17',
        subsystem: 'Centroidal Dynamics & Contact Force QP',
        logicSummary:
          'Computes optimal 3D ground reaction forces for all stance feet at 200Hz using linearized Euler angle momentum equations and friction cone inequalities.',
        controlEquation: 'min ||A·x - b||_Q^2 + ||f||_R^2  s.t.  |f_x| <= μ·f_z, |f_y| <= μ·f_z, f_z_min <= f_z <= f_z_max',
        content: `#include "mpc_stance_solver.hpp"
#include <cmath>

namespace kinetix::quadruped {

void CentroidalMpcSolver::updateStateMatrix(const Eigen::Vector3f& rpy, float dt) {
  const float cy = std::cos(rpy.z());
  const float sy = std::sin(rpy.z());
  Eigen::Matrix3f R_z;
  R_z << cy, -sy, 0.0f,
         sy,  cy, 0.0f,
         0.0f, 0.0f, 1.0f;

  // Discrete-time state transition A_d (12x12)
  A_d_.setIdentity();
  A_d_.block<3, 3>(0, 6) = R_z.transpose() * dt;
  A_d_.block<3, 3>(3, 9) = Eigen::Matrix3f::Identity() * dt;
}

void CentroidalMpcSolver::computeFootTorques(
    const FootContactState (&contacts)[4],
    const Eigen::Matrix3f (&foot_jacobians)[4],
    const Eigen::Matrix3f& body_rotation,
    float friction_mu,
    Eigen::Vector3f (&tau_out)[4]) {

  solveCondensedQp(contacts, friction_mu);

  for (int leg = 0; leg < 4; ++leg) {
    if (contacts[leg].in_stance) {
      Eigen::Vector3f f_world = optimal_grf_.segment<3>(leg * 3);
      Eigen::Vector3f f_body = body_rotation.transpose() * f_world;
      // tau = -J^T * f_body
      tau_out[leg] = -foot_jacobians[leg].transpose() * f_body;
    } else {
      tau_out[leg].setZero();
    }
  }
}

} // namespace kinetix::quadruped`,
      },
      {
        id: 'cf-q-2',
        filename: 'biquad_notch_foc.hpp',
        language: 'C++17',
        subsystem: 'STM32H7 1kHz Actuator Joint Loop',
        logicSummary:
          'Direct-Form II Transposed biquad notch filter suppressing mechanical gearbox backlash resonance before derivative damping calculation.',
        controlEquation: 'H(z) = (b0 + b1·z^-1 + b2·z^-2) / (1 + a1·z^-1 + a2·z^-2)',
        content: `#pragma once
#include <cmath>

struct BiquadNotchFilter {
  float b0 = 1.0f, b1 = 0.0f, b2 = 1.0f;
  float a1 = 0.0f, a2 = 0.0f;
  float s1 = 0.0f, s2 = 0.0f;

  void configure(float center_freq_hz, float sample_rate_hz, float q_factor) {
    const float omega = 2.0f * 3.14159265f * center_freq_hz / sample_rate_hz;
    const float sn = std::sin(omega);
    const float cs = std::cos(omega);
    const float alpha = sn / (2.0f * q_factor);
    const float a0_inv = 1.0f / (1.0f + alpha);

    b0 = 1.0f * a0_inv;
    b1 = (-2.0f * cs) * a0_inv;
    b2 = 1.0f * a0_inv;
    a1 = b1;
    a2 = (1.0f - alpha) * a0_inv;
  }

  inline float step(float x) noexcept {
    const float y = b0 * x + s1;
    s1 = b1 * x - a1 * y + s2;
    s2 = b2 * x - a2 * y;
    return y;
  }
};`,
      },
    ],
  },
  {
    id: 'proj-robo-manipulator',
    name: 'Vesper-6 Harmonic 6-DOF Precision Manipulator',
    codename: 'VESPER-6R',
    category: 'robotics',
    status: 'NOMINAL',
    mcuPrimary: 'Teensy 4.1 (i.MX RT1062 ARM Cortex-M7 @ 600 MHz)',
    companionCompute: 'Qualcomm RB5 Robotics (QRB5165 + Dual ISP)',
    controlFrequencyHz: 2000,
    actuationTopology: 'Strain-Wave Harmonic Drives (100:1) + Dual 20-bit BiSS-C Encoders',
    updatedAt: '2026-09-27',
    imageUrl: manipulatorImg,
    description:
      'High-precision 6-DOF serial robotic manipulator featuring dual-encoder joint torque sensing, LuGre dynamic friction compensation, and eye-in-hand 6D object pose tracking accelerated on Qualcomm Hexagon DSP.',
    coreLogicArchitecture:
      'Computed-Torque Control (CTC) with recursive Newton-Euler inverse dynamics feed-forward: M(q)q̈_d + C(q,q̇)q̇_d + G(q) + τ_friction(q̇), augmented by Damped Least Squares (DLS) singularity-robust Cartesian impedance.',
    linkedAiHubModelId: 'qai-pose-6dof-02',
    linkedHardwareGuideId: 'hw-guide-harmonic-joint',
    entries: [
      {
        id: 'ent-v-1',
        timestamp: '2026-09-08 09:30',
        entryType: 'git_commit',
        referenceCode: '3f01b8a',
        changeDomain: 'Code',
        authorOrRig: 'Manipulator Cell 1',
        title: 'Recursive Newton-Euler Gravity & Coriolis Feed-Forward',
        summary:
          'Implemented Featherstone RNEA algorithm in fixed-time 500us cycle on Cortex-M7 FPU.',
        performanceScore: 74.0,
        deltaScore: 0,
        controlLoopLatencyMs: 0.48,
        powerDrawWatts: 64.5,
        trackingRmsError: 0.42,
        isFailure: false,
        codeOrConfigDiff: `rnea_inverse_dynamics(model, q_meas, dq_meas, ddq_ref, tau_rnea);
for (int j = 0; j < 6; ++j) tau_total[j] = tau_rnea[j] + tau_pd[j];`,
      },
      {
        id: 'ent-v-2',
        timestamp: '2026-09-14 15:10',
        entryType: 'git_commit',
        referenceCode: '89c210e',
        changeDomain: 'Simulation',
        authorOrRig: 'ROS2 Gazebo Harmonic',
        title: 'Updated Wrist Payload URDF Inertia Tensor Matrix',
        summary:
          'Imported CAD inertia matrix for new stereo camera bracket with sign inversion on I_xz product of inertia.',
        performanceScore: 58.5,
        deltaScore: -15.5,
        controlLoopLatencyMs: 0.51,
        powerDrawWatts: 89.2,
        trackingRmsError: 1.38,
        isFailure: true,
        failureRootCause:
          'CAD export used SolidWorks left-handed coordinate frame convention for Joint 5 wrist flange, inverting I_xz and CoM Z-offset by -42mm. Feed-forward gravity torque actively pulled Joint 5 away from target during high-acceleration pick trajectories.',
        remediationLogic:
          'Apply right-hand rule similarity transformation R * I_cad * R^T prior to populating RNEA link inertia parameters and validate via static zero-G hold test.',
        codeOrConfigDiff: `- Link5.com_offset = Vec3(0.0f, 0.012f, -0.042f);
+ Link5.com_offset = Vec3(0.0f, 0.012f, +0.042f); // Corrected Z-frame convention`,
      },
      {
        id: 'ent-v-3',
        timestamp: '2026-09-20 17:45',
        entryType: 'manual_experiment',
        referenceCode: 'EXP-2026-088',
        changeDomain: 'Hardware',
        authorOrRig: 'Laser Tracker Metrology Bench',
        title: 'LuGre Bristle Friction Observer Calibration for Harmonic Flexspline',
        summary:
          'Identified Stribeck velocity and viscous damping coefficients across Joints 1–4 atZero-crossing reversals.',
        performanceScore: 88.2,
        deltaScore: 29.7,
        controlLoopLatencyMs: 0.44,
        powerDrawWatts: 58.0,
        trackingRmsError: 0.14,
        isFailure: false,
        codeOrConfigDiff: `// LuGre internal bristle deflection state z_dot
float g_v = F_c + (F_s - F_c) * expf(-powf(dq / v_stribeck, 2.0f));
float dz = dq - (sigma_0 * fabsf(dq) / g_v) * z_state;
tau_friction_comp = sigma_0 * z_state + sigma_1 * dz + sigma_2 * dq;`,
      },
      {
        id: 'ent-v-4',
        timestamp: '2026-09-27 13:20',
        entryType: 'git_commit',
        referenceCode: 'f42a811',
        changeDomain: 'NPU Model',
        authorOrRig: 'Qualcomm RB5 Vision Node',
        title: '6-DOF Keypoint Pose Estimation Quantized to INT8 on RB5 HTP',
        summary:
          'Reduced visual servoing camera-to-joint latency from 31.4ms to 3.8ms using Qualcomm QNN runtime.',
        performanceScore: 96.1,
        deltaScore: 7.9,
        controlLoopLatencyMs: 0.42,
        powerDrawWatts: 54.8,
        trackingRmsError: 0.06,
        isFailure: false,
        codeOrConfigDiff: `// Visual servoing Cartesian velocity twist command
Eigen::Matrix<float, 6, 1> v_ee = lambda_gain * computePoseErrorLog6(T_target_qnn, T_current_fk);
q_dot_cmd = dampedLeastSquaresInverse(J_spatial, 0.015f) * v_ee;`,
      },
    ],
    codeFiles: [
      {
        id: 'cf-v-1',
        filename: 'damped_least_squares_ik.cpp',
        language: 'C++17',
        subsystem: 'Singularity-Robust Inverse Kinematics',
        logicSummary:
          'Computes joint velocity and position updates near wrist singularities by dynamically scaling damping factor lambda based on smallest singular value sigma_min.',
        controlEquation: 'J^†_DLS = J^T · (J · J^T + λ² · I)^-1',
        content: `#include <Eigen/Dense>

namespace kinetix::manipulator {

Eigen::Matrix<float, 6, 1> solveSingularityRobustIkStep(
    const Eigen::Matrix<float, 6, 6>& J,
    const Eigen::Matrix<float, 6, 1>& twist_error,
    float sigma_threshold = 0.04f,
    float lambda_max = 0.08f) {

  Eigen::JacobiSVD<Eigen::Matrix<float, 6, 6>> svd(
      J, Eigen::ComputeFullU | Eigen::ComputeFullV);
  const auto& s = svd.singularValues();
  const float sigma_min = s(5);

  // Adaptive damping only inside singularity neighborhood
  float lambda_sq = 0.0f;
  if (sigma_min < sigma_threshold) {
    const float ratio = sigma_min / sigma_threshold;
    lambda_sq = (1.0f - ratio * ratio) * (lambda_max * lambda_max);
  }

  Eigen::Matrix<float, 6, 1> dq = Eigen::Matrix<float, 6, 1>::Zero();
  for (int i = 0; i < 6; ++i) {
    const float damped_inv = s(i) / (s(i) * s(i) + lambda_sq);
    dq += damped_inv * svd.matrixU().col(i).dot(twist_error) * svd.matrixV().col(i);
  }
  return dq;
}

} // namespace kinetix::manipulator`,
      },
    ],
  },
  {
    id: 'proj-drone-aether',
    name: 'Aether-X4 Autonomous VIO & LiDAR Quadcopter',
    codename: 'AETHER-X4',
    category: 'drones',
    status: 'NOMINAL',
    mcuPrimary: 'STM32H743 Flight Controller (Dual ICM-42688-P Gyro)',
    companionCompute: 'Snapdragon Flight Gen 2 (QRB5165 + Hexagon NPU)',
    controlFrequencyHz: 4000,
    actuationTopology: '4x 2808 1500KV Brushless Motors + Bidirectional DShot600 ESCs',
    updatedAt: '2026-09-30',
    imageUrl: vtolDroneImg,
    description:
      'GPS-denied autonomous aerial inspection UAV utilizing 4kHz gyro RPM-notched attitude control, Visual-Inertial Odometry (VIO), and real-time ESDF 3D voxel trajectory replanning.',
    coreLogicArchitecture:
      'Geometric SE(3) Attitude & Thrust Controller on SO(3) manifold paired with a 15-state Error-State Extended Kalman Filter (ES-EKF) fusing dual SPI gyros, stereo optical flow, and downward ToF altimeter.',
    linkedAiHubModelId: 'qai-depth-vio-03',
    linkedHardwareGuideId: 'hw-guide-uav-flight-stack',
    entries: [
      {
        id: 'ent-d-1',
        timestamp: '2026-09-10 11:00',
        entryType: 'git_commit',
        referenceCode: '104c77b',
        changeDomain: 'Code',
        authorOrRig: 'Flight Cage Alpha',
        title: 'Geometric SO(3) Attitude Loop + Static Gyro Lowpass @ 110Hz',
        summary:
          'Initial hover test with quaternion error control and fixed PT1 low-pass filters on roll/pitch/yaw rates.',
        performanceScore: 71.5,
        deltaScore: 0,
        controlLoopLatencyMs: 0.65,
        powerDrawWatts: 310.0,
        trackingRmsError: 4.8,
        isFailure: false,
        codeOrConfigDiff: `// Attitude error on SO(3): e_R = 0.5 * vee(R_des^T * R_meas - R_meas^T * R_des)
Mat3f E_r = 0.5f * (R_des.transpose() * R_meas - R_meas.transpose() * R_des);
Vec3f e_R(E_r(2,1), E_r(0,2), E_r(1,0));`,
      },
      {
        id: 'ent-d-2',
        timestamp: '2026-09-16 14:50',
        entryType: 'manual_experiment',
        referenceCode: 'EXP-2026-109',
        changeDomain: 'Hardware',
        authorOrRig: 'Wind Tunnel Rig (14 m/s Gust Profile)',
        title: 'Switched to High-Pitch 7042 Tri-Blade Carbon Props Without RPM Notch Retune',
        summary:
          'Stiffer carbon blades shifted motor harmonic vibration band into 165–240Hz; D-term amplified frame vibration causing motor #2 thermal desync.',
        performanceScore: 46.8,
        deltaScore: -24.7,
        controlLoopLatencyMs: 0.89,
        powerDrawWatts: 485.0,
        trackingRmsError: 19.4,
        isFailure: true,
        failureRootCause:
          'Static gyro PT1 filter at 110Hz provided only -7dB attenuation at the 182Hz fundamental prop-wash frequency. Phase lag from the static filter eroded phase margin to 8 deg, inducing a 28Hz pitch limit-cycle oscillation.',
        remediationLogic:
          'Enable Bidirectional DShot600 eRPM telemetry and track 1st, 2nd, and 3rd motor harmonic frequencies per motor with zero-delay dynamic Q=5.0 notch filters.',
        codeOrConfigDiff: `[BLACKBOX LOG SUMMARY - EXP-2026-109]
GYRO_UNFILTERED_PEAK : 410 deg/s @ 182 Hz
PID_D_TERM_NOISE_RMS : 64.2% motor output saturation
MOTOR_2_ESC_TEMP     : 108.0 degC -> DESYNC PROTECT TRIGGERED`,
      },
      {
        id: 'ent-d-3',
        timestamp: '2026-09-22 18:15',
        entryType: 'git_commit',
        referenceCode: '62fa09d',
        changeDomain: 'Code',
        authorOrRig: 'Flight Cage Alpha',
        title: 'Bidirectional DShot600 eRPM Harmonic Notch Bank (3 Harmonics x 4 Motors)',
        summary:
          'Implemented GCR telemetry decode via timer input capture DMA and dynamic 12-notch filter bank; reduced gyro noise floor by 81% while cutting filter phase delay by 1.4ms.',
        performanceScore: 89.4,
        deltaScore: 42.6,
        controlLoopLatencyMs: 0.28,
        powerDrawWatts: 274.0,
        trackingRmsError: 1.45,
        isFailure: false,
        codeOrConfigDiff: `// Dynamic RPM notch center frequency from eRPM telemetry
const float motor_hz = (erpm_telemetry[m] * 2.0f) / (motor_poles * 60.0f);
rpm_notch_bank[m][0].setCenterFreq(clamp(motor_hz, 80.0f, 550.0f));
rpm_notch_bank[m][1].setCenterFreq(clamp(motor_hz * 2.0f, 160.0f, 900.0f));`,
      },
      {
        id: 'ent-d-4',
        timestamp: '2026-09-29 20:40',
        entryType: 'git_commit',
        referenceCode: '991e5b2',
        changeDomain: 'NPU Model',
        authorOrRig: 'Subterranean Tunnel Trial',
        title: 'Stereo Depth + VIO Feature Matcher Accelerated on Snapdragon Flight NPU',
        summary:
          'Quantized stereo disparity + SuperPoint keypoint extractor via Qualcomm AI Hub (INT8). Achieved 90 FPS depth map generation at 2.1W NPU power.',
        performanceScore: 97.2,
        deltaScore: 7.8,
        controlLoopLatencyMs: 0.25,
        powerDrawWatts: 268.5,
        trackingRmsError: 0.58,
        isFailure: false,
        codeOrConfigDiff: `// Fuse Snapdragon NPU VIO pose update into 15-state ES-EKF
eskf_core.correctPositionAndVelocity(vio_npu_msg.pos_ned, vio_npu_msg.vel_ned, R_vio_cov);`,
      },
    ],
    codeFiles: [
      {
        id: 'cf-d-1',
        filename: 'se3_geometric_controller.cpp',
        language: 'C++17',
        subsystem: 'SO(3) Attitude & Collective Thrust Flight Controller',
        logicSummary:
          'Avoids Euler angle gimbal lock during aggressive 70-degree obstacle avoidance banking maneuvers by computing attitude torque directly on the SO(3) rotation manifold.',
        controlEquation: 'M = -k_R · e_R - k_Ω · e_Ω + Ω × (J · Ω)',
        content: `#include "se3_geometric_controller.hpp"

namespace kinetix::uav {

ControlOutput Se3FlightController::computeAttitudeMoment(
    const Eigen::Matrix3f& R_meas,
    const Eigen::Matrix3f& R_des,
    const Eigen::Vector3f& omega_meas,
    const Eigen::Vector3f& omega_des) {

  // Attitude error on SO(3) vee-map
  const Eigen::Matrix3f E_mat =
      0.5f * (R_des.transpose() * R_meas - R_meas.transpose() * R_des);
  const Eigen::Vector3f e_R(E_mat(2, 1), E_mat(0, 2), E_mat(1, 0));

  // Angular rate error in body frame
  const Eigen::Vector3f e_omega =
      omega_meas - R_meas.transpose() * R_des * omega_des;

  // Gyroscopic coriolis term: omega x (J * omega)
  const Eigen::Vector3f coriolis = omega_meas.cross(inertia_diag_.cwiseProduct(omega_meas));

  ControlOutput out;
  out.moment_nm = -kp_attitude_.cwiseProduct(e_R)
                  - kd_omega_.cwiseProduct(e_omega)
                  + coriolis;
  return out;
}

} // namespace kinetix::uav`,
      },
    ],
  },
  {
    id: 'proj-drone-swarm',
    name: 'Nyx-Cine140 Ducted UWB Swarm Micro-UAV',
    codename: 'NYX-SWARM-140',
    category: 'drones',
    status: 'DRIFTING',
    mcuPrimary: 'ESP32-S3 + RP2040 Co-Processor (PIO DShot Driver)',
    companionCompute: 'Qualcomm Dragonwing RB3 Gen 2 Lite Module',
    controlFrequencyHz: 2000,
    actuationTopology: '4x 1404 3800KV Brushless + Ducted 3-Inch Shrouds',
    updatedAt: '2026-09-29',
    imageUrl: swarmDroneImg,
    description:
      'Sub-250g ducted indoor swarm reconnaissance drone using DW3000 Ultra-Wideband (UWB) inter-agent ranging, optical flow velocity hold, and decentralized artificial potential field formation control.',
    coreLogicArchitecture:
      'Decentralized Consensus + Control Barrier Functions (CBF): Guarantees minimum 0.65m inter-drone safety distance even under packet loss, with RP2040 PIO state machines handling deterministic DShot300 timing.',
    linkedAiHubModelId: 'qai-nano-obstacle-04',
    linkedHardwareGuideId: 'hw-guide-uav-flight-stack',
    entries: [
      {
        id: 'ent-s-1',
        timestamp: '2026-09-14 13:00',
        entryType: 'git_commit',
        referenceCode: '41b802c',
        changeDomain: 'Code',
        authorOrRig: 'Indoor Arena 4-Drone Mesh',
        title: 'TDMA UWB Double-Sided Two-Way Ranging (DS-TWR) Schedule',
        summary:
          'Implemented 120Hz TDMA slot scheduler across 4 micro-drones using DW3000 UWB transceivers.',
        performanceScore: 76.2,
        deltaScore: 0,
        controlLoopLatencyMs: 1.42,
        powerDrawWatts: 94.0,
        trackingRmsError: 6.2,
        isFailure: false,
        codeOrConfigDiff: `// DS-TWR time-of-flight calculation compensating clock drift
double tof = ((t_round1 * t_round2) - (t_reply1 * t_reply2)) /
             (t_round1 + t_round2 + t_reply1 + t_reply2);`,
      },
      {
        id: 'ent-s-2',
        timestamp: '2026-09-23 16:30',
        entryType: 'manual_experiment',
        referenceCode: 'EXP-2026-134',
        changeDomain: 'Simulation',
        authorOrRig: 'Narrow Steel Duct Corridor Test',
        title: 'Aggressive Potential Field Repulsion Gain k_rep=4.2 in 1.2m Corridor',
        summary:
          'High wall repulsion gain coupled with UWB non-line-of-sight multipath reflection caused lateral yaw-roll oscillation between Agents #2 and #3.',
        performanceScore: 61.8,
        deltaScore: -14.4,
        controlLoopLatencyMs: 1.85,
        powerDrawWatts: 118.5,
        trackingRmsError: 14.1,
        isFailure: true,
        failureRootCause:
          'Metallic HVAC ducting introduced +38cm NLOS positive bias spikes on UWB channel 5. Without Mahalanobis outlier rejection on the UWB innovation gate, the repulsive potential field injected step-impulse roll commands.',
        remediationLogic:
          'Add Chi-square innovation gating (gamma = 5.99 for 95% confidence) on UWB range residuals and damp potential field velocity with relative optical flow derivative.',
        codeOrConfigDiff: `// Pending full flight verification of Chi-square UWB outlier gate
float nis = innovation * (1.0f / S_variance) * innovation;
if (nis > 5.991f) { reject_uwb_measurement(); }`,
      },
    ],
    codeFiles: [
      {
        id: 'cf-s-1',
        filename: 'cbf_swarm_safety_filter.cpp',
        language: 'C++17',
        subsystem: 'Control Barrier Function (CBF) Inter-Agent Collision Avoidance',
        logicSummary:
          'Minimally modifies nominal desired velocity vector v_des to strictly satisfy h(x) = ||p_i - p_j||^2 - d_safe^2 >= 0 for all neighboring UAVs.',
        controlEquation: 'L_f h(x) + L_g h(x)·u + α·h(x) >= 0',
        content: `#include <Eigen/Dense>

namespace kinetix::swarm {

Eigen::Vector3f applyPairwiseCbfSafetyFilter(
    const Eigen::Vector3f& pos_self,
    const Eigen::Vector3f& pos_neighbor,
    const Eigen::Vector3f& vel_nominal,
    float safe_radius_m = 0.68f,
    float alpha_cbf = 3.5f) {

  const Eigen::Vector3f delta_p = pos_self - pos_neighbor;
  const float dist_sq = delta_p.squaredNorm();
  const float h_val = dist_sq - (safe_radius_m * safe_radius_m);

  // Lie derivative constraint: 2 * delta_p^T * u + alpha * h(x) >= 0
  const float lhs = 2.0f * delta_p.dot(vel_nominal) + alpha_cbf * h_val;
  if (lhs >= 0.0f) {
    return vel_nominal; // Nominal command is already safe
  }

  // Analytical closed-form projection onto safe half-space
  const float norm_grad_sq = 4.0f * dist_sq + 1e-6f;
  return vel_nominal - (lhs / norm_grad_sq) * (2.0f * delta_p);
}

} // namespace kinetix::swarm`,
      },
    ],
  },
];

export const INITIAL_LIBRARIES: MicrocontrollerLibrary[] = [
  {
    id: 'lib-cascaded-pid-ff',
    name: 'Cascaded PID + Velocity Feedforward & Anti-Windup Controller',
    version: 'v2.4.0',
    category: 'universal',
    targetMcu: 'STM32H7 / STM32F4 / Teensy 4.1 (ARM Cortex-M7/M4F)',
    language: 'C++17 (Zero-Heap Header-Only)',
    executionRateHz: 4000,
    ramFootprintKb: 1.2,
    flashFootprintKb: 4.8,
    summary:
      'Deterministic fixed-timestep cascaded position-velocity-torque PID controller with back-calculation integrator anti-windup and PT1 derivative low-pass filter.',
    algorithmLogic:
      'Separates outer position loop from inner rate loop. Uses measurement derivative (-Kd * d(meas)/dt) instead of error derivative to eliminate derivative kick during step setpoint changes.',
    linkedHardwareGuideId: 'hw-guide-qdd-leg',
    updatedAt: '2026-09-28',
    integrationSteps: [
      'Include "kinetix_cascaded_pid.hpp" in your real-time timer ISR or FreeRTOS highest-priority task.',
      'Configure sample time dt_sec, output saturation bounds [-u_max, +u_max], and derivative cutoff frequency f_c.',
      'Trigger update(setpoint, measurement, feedforward_vel) inside the hardware timer interrupt synchronized with ADC/SPI sensor DMA completion.',
    ],
    headerAndSourceCode: `#pragma once
#include <algorithm>
#include <cmath>

namespace kinetix::mcu {

class DeterministicPidController {
public:
  struct Config {
    float kp = 1.0f;
    float ki = 0.0f;
    float kd = 0.0f;
    float kff = 0.0f;
    float d_lpf_cutoff_hz = 90.0f;
    float out_min = -100.0f;
    float out_max = 100.0f;
    float anti_windup_kb = 1.2f;
  };

  explicit DeterministicPidController(const Config& cfg, float dt_sec)
      : cfg_(cfg), dt_(dt_sec) {
    const float rc = 1.0f / (2.0f * 3.14159265f * cfg_.d_lpf_cutoff_hz);
    alpha_d_ = dt_ / (rc + dt_);
  }

  inline float step(float setpoint, float measurement, float ff_input = 0.0f) noexcept {
    const float error = setpoint - measurement;

    // Proportional + Feed-forward
    const float p_term = cfg_.kp * error;
    const float ff_term = cfg_.kff * ff_input;

    // Derivative on measurement with PT1 low-pass filter (avoids setpoint kick)
    const float raw_d = -(measurement - prev_meas_) / dt_;
    prev_meas_ = measurement;
    d_filtered_ += alpha_d_ * (raw_d - d_filtered_);
    const float d_term = cfg_.kd * d_filtered_;

    // Unclamped total output
    const float u_unsat = p_term + integrator_ + d_term + ff_term;
    const float u_sat = std::clamp(u_unsat, cfg_.out_min, cfg_.out_max);

    // Back-calculation dynamic integrator anti-windup
    const float sat_error = u_sat - u_unsat;
    integrator_ += (cfg_.ki * error + cfg_.anti_windup_kb * sat_error) * dt_;

    return u_sat;
  }

  void reset() noexcept {
    integrator_ = 0.0f;
    d_filtered_ = 0.0f;
    prev_meas_ = 0.0f;
  }

private:
  Config cfg_;
  float dt_;
  float alpha_d_ = 1.0f;
  float integrator_ = 0.0f;
  float d_filtered_ = 0.0f;
  float prev_meas_ = 0.0f;
};

} // namespace kinetix::mcu`,
  },
  {
    id: 'lib-dshot600-bidir',
    name: 'Bidirectional DShot600 DMA & eRPM Telemetry Driver',
    version: 'v3.1.2',
    category: 'drones',
    targetMcu: 'STM32H743 / STM32F722 / RP2040 PIO',
    language: 'C11 / C++17 (STM32 LL + DMA)',
    executionRateHz: 4000,
    ramFootprintKb: 2.4,
    flashFootprintKb: 6.1,
    summary:
      'Zero-CPU-overhead Bidirectional DShot600 digital ESC protocol driver using Timer PWM DMA burst mode with automatic pin direction switch for GCR 21-bit eRPM telemetry reception.',
    algorithmLogic:
      'Encodes 11-bit throttle + 1-bit telemetry request + 4-bit inverted CRC into 16 timer compare pulse widths. Immediately after the 16th bit (26.7us), switches timer channel to Input Capture DMA to decode the 5/4 GCR encoded ESC RPM reply.',
    linkedHardwareGuideId: 'hw-guide-uav-flight-stack',
    updatedAt: '2026-09-29',
    integrationSteps: [
      'Bind 4 motor outputs to a single hardware timer (e.g., TIM1 CH1–CH4 or TIM8 CH1–CH4) supporting DMA burst transfers.',
      'Call packDshotFrame(throttle_11bit, request_telemetry) to populate the DMA circular buffer.',
      'Feed decoded eRPM into the dynamic harmonic gyro notch filter bank before running the PID attitude loop.',
    ],
    headerAndSourceCode: `#pragma once
#include <cstdint>

namespace kinetix::dshot {

// Construct 16-bit Inverted-CRC Bidirectional DShot packet
constexpr uint16_t buildBidirDshotPacket(uint16_t throttle_11bit, bool request_telem) noexcept {
  const uint16_t clamped = (throttle_11bit > 2047U) ? 2047U : throttle_11bit;
  const uint16_t packet_no_crc = (clamped << 1U) | (request_telem ? 1U : 0U);

  // Bidirectional DShot uses inverted 4-bit nibble XOR checksum
  const uint16_t csum = (~(packet_no_crc ^ (packet_no_crc >> 4U) ^ (packet_no_crc >> 8U))) & 0x0FU;
  return (packet_no_crc << 4U) | csum;
}

// Convert encoded 12-bit ESC eRPM mantissa/exponent to physical Rotor Hz
inline float decodeErpmToMotorHz(uint16_t raw_erpm_12bit, uint8_t motor_pole_count) noexcept {
  if (raw_erpm_12bit == 0x0FFFU || raw_erpm_12bit == 0U) return 0.0f;
  const uint16_t exponent = (raw_erpm_12bit >> 9U) & 0x07U;
  const uint16_t mantissa = raw_erpm_12bit & 0x01FFU;
  const uint32_t period_us = static_cast<uint32_t>(mantissa) << exponent;
  if (period_us == 0U) return 0.0f;

  const float erpm = 60000000.0f / static_cast<float>(period_us);
  return (erpm * 2.0f) / (static_cast<float>(motor_pole_count) * 60.0f);
}

} // namespace kinetix::dshot`,
  },
  {
    id: 'lib-eskf-15state',
    name: '15-State Error-State Extended Kalman Filter (IMU + Optical Flow + ToF)',
    version: 'v1.9.4',
    category: 'drones',
    targetMcu: 'STM32H7 / Teensy 4.1 / Qualcomm Hexagon DSP',
    language: 'C++17 (Static Matrix Templates)',
    executionRateHz: 1000,
    ramFootprintKb: 8.6,
    flashFootprintKb: 18.4,
    summary:
      'High-rate Error-State EKF estimating 3D position, velocity, quaternion attitude, accelerometer bias, and gyro bias with Joseph-form covariance stabilization.',
    algorithmLogic:
      'Propagates nominal kinematics at 1kHz via 4th-order Runge-Kutta IMU integration while maintaining a 15x15 error covariance matrix updated asynchronously when Optical Flow, UWB, or Qualcomm VIO measurements arrive.',
    linkedHardwareGuideId: 'hw-guide-uav-flight-stack',
    updatedAt: '2026-09-25',
    integrationSteps: [
      'Initialize state covariance diagonal with sensor datasheet noise densities (ICM-42688-P: 2.8 mdps/sqrt(Hz)).',
      'Invoke predictImu(accel_m_s2, gyro_rad_s, dt) at 1000Hz.',
      'Invoke fuseOpticalFlowAndRange(flow_rad_s, ground_dist_m, R_cov) whenever PMW3901/VL53L1X packet arrives.',
    ],
    headerAndSourceCode: `#pragma once
#include <Eigen/Dense>

namespace kinetix::navigation {

struct NominalState {
  Eigen::Vector3f p = Eigen::Vector3f::Zero();
  Eigen::Vector3f v = Eigen::Vector3f::Zero();
  Eigen::Quaternionf q = Eigen::Quaternionf::Identity();
  Eigen::Vector3f bg = Eigen::Vector3f::Zero();
  Eigen::Vector3f ba = Eigen::Vector3f::Zero();
};

inline void propagateNominalImu(
    NominalState& s,
    const Eigen::Vector3f& acc_raw,
    const Eigen::Vector3f& gyr_raw,
    float dt) {
  const Eigen::Vector3f omega = gyr_raw - s.bg;
  const Eigen::Vector3f acc_body = acc_raw - s.ba;
  const Eigen::Vector3f gravity(0.0f, 0.0f, -9.80665f);

  const Eigen::Vector3f acc_world = s.q * acc_body + gravity;
  s.p += s.v * dt + 0.5f * acc_world * dt * dt;
  s.v += acc_world * dt;

  const Eigen::Vector3f half_theta = 0.5f * omega * dt;
  const Eigen::Quaternionf dq(1.0f, half_theta.x(), half_theta.y(), half_theta.z());
  s.q = (s.q * dq).normalized();
}

} // namespace kinetix::navigation`,
  },
  {
    id: 'lib-canfd-mit-qdd',
    name: 'CAN-FD MIT-Mode Quasi-Direct Drive (QDD) Actuator Codec',
    version: 'v2.0.1',
    category: 'robotics',
    targetMcu: 'STM32H743 /STM32G474 / ESP32-S3 TWAI',
    language: 'C++17',
    executionRateHz: 2000,
    ramFootprintKb: 0.9,
    flashFootprintKb: 3.2,
    summary:
      'Bit-packed 8-byte and 24-byte CAN-FD frame serializer/deserializer for MIT-cheetah style QDD robotic actuators (q_des, dq_des, Kp, Kd, tau_ff).',
    algorithmLogic:
      'Packs floating-point position (-12.5 to +12.5 rad), velocity (-45 to +45 rad/s), Kp (0 to 500 Nm/rad), Kd (0 to 50 Nm·s/rad), and feedforward torque (-24 to +24 Nm) into compact fixed-point integers for deterministic 1kHz multi-motor bus sync.',
    linkedHardwareGuideId: 'hw-guide-qdd-leg',
    updatedAt: '2026-09-26',
    integrationSteps: [
      'Configure FDCAN1 peripheral for 1Mbps nominal arbitration bitrate and 5Mbps data phase bitrate with 120-ohm termination.',
      'Pack actuator commands using packMitMotorCommand() and transmit sequentially across leg IDs 1–3.',
      'Unpack motor reply frame in FDCAN RX FIFO0 interrupt to read rotor position, velocity, and coil temperature.',
    ],
    headerAndSourceCode: `#pragma once
#include <cstdint>
#include <algorithm>

namespace kinetix::can_actuator {

inline uint16_t floatToUint(float x, float x_min, float x_max, int bits) noexcept {
  const float span = x_max - x_min;
  const float clamped = std::clamp(x, x_min, x_max);
  return static_cast<uint16_t>((clamped - x_min) * static_cast<float>((1 << bits) - 1) / span);
}

inline void packMitCanFrame(
    float p_des, float v_des, float kp, float kd, float t_ff,
    uint8_t (&tx_buf)[8]) noexcept {
  const uint16_t p_int  = floatToUint(p_des, -12.5f, 12.5f, 16);
  const uint16_t v_int  = floatToUint(v_des, -45.0f, 45.0f, 12);
  const uint16_t kp_int = floatToUint(kp, 0.0f, 500.0f, 12);
  const uint16_t kd_int = floatToUint(kd, 0.0f, 50.0f, 12);
  const uint16_t t_int  = floatToUint(t_ff, -24.0f, 24.0f, 12);

  tx_buf[0] = p_int >> 8;
  tx_buf[1] = p_int & 0xFF;
  tx_buf[2] = v_int >> 4;
  tx_buf[3] = ((v_int & 0x0F) << 4) | (kp_int >> 8);
  tx_buf[4] = kp_int & 0xFF;
  tx_buf[5] = kd_int >> 4;
  tx_buf[6] = ((kd_int & 0x0F) << 4) | (t_int >> 8);
  tx_buf[7] = t_int & 0xFF;
}

} // namespace kinetix::can_actuator`,
  },
];

export const INITIAL_HARDWARE_GUIDES: HardwareBuildGuide[] = [
  {
    id: 'hw-guide-qdd-leg',
    title: '3-DOF Quasi-Direct Drive (QDD) Quadruped Leg & CAN-FD Power Spine',
    subtitle: 'STM32H743 + Qualcomm RB3 Gen 2 + 48V 60A Peak Regenerative Bus',
    category: 'robotics',
    difficulty: 'Research-Grade',
    estimatedBuildHours: 14,
    targetMcuBoard: 'Custom STM32H743VIT6 Carrier + Qualcomm Dragonwing RB3 Gen 2',
    powerBusSpec: '12S LiPo (44.4V Nominal / 50.4V Max) with TVS Regenerative Clamp',
    imageUrl: quadrupedImg,
    overview:
      'Complete electromechanical assembly and wiring guide for a low-inertia 3-DOF quadruped robotic leg utilizing co-axial hip/knee timing-belt transmission, 8:1 planetary QDD actuators, and isolated 5Mbps CAN-FD communication.',
    bom: [
      {
        partNumber: 'ACT-QDD-8015',
        componentName: 'Frameless PMSM Outrunner + 8:1 Planetary Stage + 18-bit Magnetic Encoder',
        specification: '24 Nm Peak Torque, 90 mOhm phase resistance, integrated FOC driver',
        quantity: 3,
        subsystem: 'Actuation',
        unitCostUsd: 215,
      },
      {
        partNumber: 'MCU-H743-RT',
        componentName: 'STM32H743VIT6 Real-Time Control Spine Board',
        specification: '480 MHz Cortex-M7, Dual FDCAN, BMI088 IMU, TPS54360 60V Buck',
        quantity: 1,
        subsystem: 'Control Electronics',
        unitCostUsd: 88,
      },
      {
        partNumber: 'XCVR-ISO1042',
        componentName: 'Texas Instruments ISO1042DWVR Galvanically Isolated CAN-FD Transceiver',
        specification: '5 Mbps CAN-FD, 5000 Vrms isolation, +/-70V bus fault protection',
        quantity: 2,
        subsystem: 'Communication Bus',
        unitCostUsd: 6.5,
      },
      {
        partNumber: 'BELT-GT3-5M',
        componentName: 'Gates Poly Chain GT Carbon Timing Belt (Knee Remote Drive)',
        specification: '5mm pitch, 15mm width, zero-stretch carbon tensile cords',
        quantity: 1,
        subsystem: 'Mechanical Transmission',
        unitCostUsd: 34,
      },
    ],
    pinoutMatrix: [
      {
        mcuPin: 'PD0 / PD1',
        signalName: 'FDCAN1_RX / FDCAN1_TX',
        peripheralDevice: 'ISO1042 Isolated CAN-FD Transceiver (Leg Bus A)',
        protocolOrBus: 'CAN-FD @ 5 Mbps Data / 1 Mbps Arb',
        voltageLevel: '3.3V Logic / 5V Isolated Bus Side',
        electricalNotes: 'Enable 120-ohm split termination (2x 60.4 ohm + 4.7nF to GND) at terminal knee actuator only.',
      },
      {
        mcuPin: 'PA5 / PA6 / PA7 / PC4',
        signalName: 'SPI1_SCK / MISO / MOSI / CS_ACC_GYR',
        peripheralName: 'Bosch BMI088 6-Axis Vibration-Immune IMU',
        peripheralDevice: 'Bosch BMI088 6-Axis Vibration-Immune IMU',
        protocolOrBus: 'SPI DMA @ 10 MHz',
        voltageLevel: '3.3V Low-Noise LDO',
        electricalNotes: 'Route away from 48V switching buck inductor; trigger DMA read on BMI088 INT1 rising edge.',
      } as unknown as PinoutMapping,
      {
        mcuPin: 'USART1 (PA9 / PA10)',
        signalName: 'RB3_IPC_TX / RB3_IPC_RX',
        peripheralDevice: 'Qualcomm Dragonwing RB3 Gen 2 Companion SoC',
        protocolOrBus: 'High-Speed UART DMA @ 3.0 Mbps + CRC16',
        voltageLevel: '1.8V <-> 3.3V TXB0104 Level Shifter',
        electricalNotes: 'RB3 Gen 2 GPIO pins operate at 1.8V CMOS strictly; never wire 3.3V STM32 UART directly.',
      },
      {
        mcuPin: 'PE9',
        signalName: 'ESTOP_GATE_ENABLE',
        peripheralDevice: 'High-Side Pre-Charge MOSFET Gate Driver (LM5060)',
        protocolOrBus: 'Active-High Hardware Interlock',
        voltageLevel: '3.3V Logic',
        electricalNotes: 'Pulled low via 10k resistor during MCU reset so actuators remain de-energized until firmware boot completes.',
      },
    ],
    assemblySteps: [
      {
        stepNumber: 1,
        title: 'Thermal Stator Bonding & Planetary Sun Gear Concentricity Alignment',
        mechanicalAndWiringDetails:
          'Apply Loctite Stycast 2850FT thermally conductive epoxy between the frameless stator outer ring and the 7075-T6 aluminum hip housing. Use the machined alignment jig during curing, then press-fit the sun gear onto the hollow rotor shaft.',
        criticalToleranceOrWarning:
          'Verify radial runout of the sun gear is <= 0.015 mm using a dial indicator; excessive runout induces 8th-order harmonic torque ripple.',
      },
      {
        stepNumber: 2,
        title: 'Co-Axial Knee Timing Belt Tensioning & Magnetic Encoder Airgap Setting',
        mechanicalAndWiringDetails:
          'Mount the knee actuator co-axially at the hip joint to minimize distal leg inertia. Route the 15mm carbon timing belt through the carbon-fiber femur tube and adjust the eccentric idler cam until belt acoustic pluck frequency measures 118 Hz +/- 4 Hz.',
        criticalToleranceOrWarning:
          'Maintain a strict 0.60 mm +/- 0.10 mm axial airgap between the diametrically magnetized target magnet and the 18-bit encoder IC.',
      },
      {
        stepNumber: 3,
        title: 'Twisted-Pair CAN-FD Harness Routing & Regenerative Clamp Verification',
        mechanicalAndWiringDetails:
          'Daisy-chain XT30(2+2) power/signal connectors from Ab/Ad -> Hip -> Knee using 16AWG silicone power leads and shielded 26AWG twisted pair (Z0 = 120 Ohm) for CAN_H / CAN_L. Solder the 3000W bi-directional TVS diode + electrolytic capacitor bank across the main 48V bus.',
        criticalToleranceOrWarning:
          'Never test rapid deceleration maneuvers on a benchtop DC power supply without a regenerative shunt resistor or battery connected—back-EMF voltage spikes will exceed 65V and destroy MOSFET gates.',
      },
    ],
    calibrationChecklist: [
      'Measure resistance between 48V+ and carbon chassis frame (> 10 MOhm required before connecting battery).',
      'Set bench current-limited supply to 44.0V @ 1.5A max and run FOC phase order & encoder electrical zero offset routine.',
      'Verify CAN-FD bus eye diagram or confirm zero CRC/stuff errors over 100,000 consecutive 1kHz frames.',
      'Execute zero-torque transparency test: move leg by hand and confirm joints back-drive smoothly with < 0.35 Nm resistance.',
    ],
  },
  {
    id: 'hw-guide-uav-flight-stack',
    title: 'GPS-Denied Autonomous VIO Quadcopter Flight Stack & Soft-Mount Isolation',
    subtitle: 'STM32H7 Flight Controller + Snapdragon Flight Gen 2 + 4-in-1 65A BLHeli_32 ESC',
    category: 'drones',
    difficulty: 'Advanced',
    estimatedBuildHours: 9,
    targetMcuBoard: 'STM32H743 Flight Controller + Snapdragon Flight QRB5165 Companion',
    powerBusSpec: '6S LiPo (22.2V Nominal / 25.2V Max) + Dual BEC (5V 4A & 12V 3A)',
    imageUrl: vtolDroneImg,
    overview:
      'Step-by-step mechatronics guide for assembling a vibration-isolated autonomous quadcopter airframe capable of 4kHz DShot600 control and onboard stereo Visual-Inertial Odometry.',
    bom: [
      {
        partNumber: 'FRAME-CF-295',
        componentName: '5mm 3K Twill Carbon Fiber Deadcat VIO Airframe (295mm Wheelbase)',
        specification: 'Zero-prop-in-view forward stereo camera bay, 7075 aluminum standoffs',
        quantity: 1,
        subsystem: 'Airframe Structure',
        unitCostUsd: 115,
      },
      {
        partNumber: 'ESC-65A-4IN1',
        componentName: '65A 6S 4-in-1 32-Bit ESC with Current Sensor & Bidir DShot600',
        specification: 'STM32G071 MCU, 8-layer 3oz copper PCB, Low-ESR 1000uF 35V Panasonic cap',
        quantity: 1,
        subsystem: 'Powertrain',
        unitCostUsd: 79,
      },
      {
        partNumber: 'CAM-OV9282-SYNC',
        componentName: 'Global Shutter Monochrome Stereo Camera Pair (OV9282)',
        specification: '1280x800 @ 120 FPS, Hardware Frame-Sync Trigger wired to IMU',
        quantity: 2,
        subsystem: 'Perception',
        unitCostUsd: 124,
      },
    ],
    pinoutMatrix: [
      {
        mcuPin: 'PC6 / PC7 / PC8 / PC9',
        signalName: 'TIM8_CH1..CH4 (MOTOR 1..4)',
        peripheralDevice: '4-in-1 65A ESC Signal Header',
        protocolOrBus: 'Bidirectional DShot600 DMA',
        voltageLevel: '3.3V Digital Push-Pull',
        electricalNotes: 'Keep signal harness < 55mm and twist with telemetry ground reference wire.',
      },
      {
        mcuPin: 'PB12',
        signalName: 'CAM_FSYNC_TRIGGER',
        peripheralDevice: 'OV9282 Stereo Global Shutter Cameras + QRB5165 MIPI CSI',
        protocolOrBus: '30Hz Hardware Exposure Sync Pulse',
        voltageLevel: '1.8V Open-Drain with Pull-Up',
        electricalNotes: 'Aligns camera mid-exposure timestamp with STM32H7 IMU sample to sub-50us accuracy for VIO.',
      },
      {
        mcuPin: 'PA0 (ADC1_INP16)',
        signalName: 'ESC_CURR_SENSE',
        peripheralDevice: 'Onboard 0.5 mOhm Shunt Current Amplifier',
        protocolOrBus: 'Analog 0–3.3V (Scale: 175 mV/10A)',
        voltageLevel: '3.3V Analog',
        electricalNotes: 'Add 100nF ceramic decoupling cap adjacent to MCU ADC pin to reject PWM switching noise.',
      },
    ],
    assemblySteps: [
      {
        stepNumber: 1,
        title: 'Low-ESR Capacitor Bank & High-Current XT60 Pigtail Soldering',
        mechanicalAndWiringDetails:
          'Solder the 1000uF 35V Low-ESR electrolytic capacitor directly across the 4-in-1 ESC battery pads with lead lengths under 8mm. Attach a bidirectional 28V TVS diode in parallel to absorb regenerative active-braking voltage spikes.',
        criticalToleranceOrWarning:
          'Inspect under 5x magnification to verify zero solder whiskers between phase pads and the carbon fiber bottom plate (carbon fiber is electrically conductive!).',
      },
      {
        stepNumber: 2,
        title: 'Rigid Stereo Camera Baseline Mount & Silicone FC Mechanical Decoupling',
        mechanicalAndWiringDetails:
          'Bolt the dual OV9282 global-shutter cameras and secondary IMU to the CNC aluminum front bridge so the stereo baseline cannot flex. Mount the primary flight controller on 4x Shore-40A silicone grommets torqued evenly to 0.4 Nm.',
        criticalToleranceOrWarning:
          'Ensure the MIPI CSI-2 flex cables form a relaxed S-loop so high-frequency motor vibrations (150–400 Hz) are not mechanically transmitted into the IMU.',
      },
    ],
    calibrationChecklist: [
      'PROPS OFF: Verify motor spin direction (Quad-X betaflight/PX4 numbering) and Bidirectional DShot 0.00% packet error rate.',
      'Run Kalibr stereo camera-to-IMU extrinsic calibration using an AprilGrid target before first VIO flight.',
      'Perform tethered hover test and verify gyro filtered noise RMS remains below 2.5 deg/s across all 3 axes.',
    ],
  },
  {
    id: 'hw-guide-harmonic-joint',
    title: 'Dual-Encoder Strain-Wave Harmonic Actuator Module (Joints 1–4)',
    subtitle: 'Teensy 4.1 + 100:1 Harmonic Drive + 20-Bit Output BiSS-C Absolute Encoder',
    category: 'robotics',
    difficulty: 'Advanced',
    estimatedBuildHours: 11,
    targetMcuBoard: 'Teensy 4.1 (i.MX RT1062) + RS-485 Differential BiSS-C Bridge',
    powerBusSpec: '36V DC Regulated Industrial Bus',
    imageUrl: manipulatorImg,
    overview:
      'Precision assembly guide for a zero-backlash robotic arm actuator module combining motor-side and link-side absolute encoders to measure flexspline torsion for joint torque feedback.',
    bom: [
      {
        partNumber: 'HD-CSF-17-100',
        componentName: 'Strain-Wave Harmonic Gear Component Set (Size 17, 100:1 Ratio)',
        specification: 'Wave generator, flexspline, and circular spline, < 10 arc-sec repeatability',
        quantity: 1,
        subsystem: 'Transmission',
        unitCostUsd: 290,
      },
      {
        partNumber: 'ENC-BISS-20B',
        componentName: 'Renishaw AksIM-2 20-Bit Off-Axis Absolute Magnetic Encoder',
        specification: 'BiSS-C bidirectional synchronous serial @ 10 MHz, hollow-shaft ring',
        quantity: 2,
        subsystem: 'Metrology',
        unitCostUsd: 145,
      },
    ],
    pinoutMatrix: [
      {
        mcuPin: 'Pin 11 / Pin 12 / Pin 13',
        signalName: 'FLEXIO_BISS_MA / BISS_SLO',
        peripheralDevice: 'AM26LS31/32 RS-422 Differential BiSS-C Line Driver',
        protocolOrBus: 'BiSS-C Point-to-Point @ 10 MHz Clock',
        voltageLevel: '5V Differential RS-422',
        electricalNotes: 'Reads both input rotor and output link 20-bit angles within 4.2 microseconds.',
      },
    ],
    assemblySteps: [
      {
        stepNumber: 1,
        title: 'Crossed-Roller Output Bearing Preload & Circular Spline Torquing',
        mechanicalAndWiringDetails:
          'Fasten the circular spline using 12x M3 Grade 12.9 socket head cap screws in a star pattern to 2.1 Nm using Loctite 243.',
        criticalToleranceOrWarning:
          'Pack harmonic teeth with 4.5g of Harmonic Grease SK-1A; never substitute standard lithium grease or flexspline fatigue life will drop by 70%.',
      },
    ],
    calibrationChecklist: [
      'Record unloaded kinematic transmission error curve over 360 deg output rotation using dual-encoder difference (q_link - q_motor/100).',
      'Fit 2nd-harmonic Fourier lookup table to cancel wave-generator elliptical kinematic ripple.',
    ],
  },
];

export const INITIAL_AI_HUB_MODELS: QualcommAIHubModel[] = [
  {
    id: 'qai-terrain-mlp-01',
    modelName: 'Quadruped-Proprioceptive-Terrain-TCN',
    taskCategory: 'Proprioceptive Gait',
    linkedProjectId: 'proj-robo-quadruped',
    targetDevice: 'Qualcomm Dragonwing RB3 Gen 2',
    computeUnit: 'Hexagon NPU (HTP)',
    runtimeFormat: 'Qualcomm QNN (.bin)',
    quantizationMode: 'INT8 (W8A8)',
    fp32BaselineLatencyMs: 5.48,
    optimizedLatencyMs: 0.62,
    speedupFactor: 8.84,
    npuComputeLoadPercent: 96.4,
    peakSramMb: 1.4,
    powerEfficiencyInfPerWatt: 1120,
    accuracyMetricName: 'Friction μ Estimation R²',
    fp32Accuracy: 94.8,
    quantizedAccuracy: 94.5,
    hubJobId: 'jp8m49kq2',
    profiledAt: '2026-09-28 20:45',
    deploymentCommand:
      'qai-hub submit-compile-job --model terrain_tcn.onnx --device "Qualcomm QCS6490 (Proxy for RB3 Gen 2)" --options "--target_runtime qnn_context_binary --quantize_full_type int8"',
  },
  {
    id: 'qai-pose-6dof-02',
    modelName: 'KeypointNet-6D-EndEffector-Servo',
    taskCategory: '6-DOF Pose Estimation',
    linkedProjectId: 'proj-robo-manipulator',
    targetDevice: 'Qualcomm RB5 Robotics (QRB5165)',
    computeUnit: 'Hexagon NPU (HTP)',
    runtimeFormat: 'Qualcomm QNN (.bin)',
    quantizationMode: 'INT8 (W8A8)',
    fp32BaselineLatencyMs: 31.4,
    optimizedLatencyMs: 3.82,
    speedupFactor: 8.22,
    npuComputeLoadPercent: 93.8,
    peakSramMb: 6.8,
    powerEfficiencyInfPerWatt: 184,
    accuracyMetricName: 'ADD-S < 2mm Recall (%)',
    fp32Accuracy: 97.6,
    quantizedAccuracy: 97.2,
    hubJobId: 'j5n092vx7',
    profiledAt: '2026-09-27 12:50',
    deploymentCommand:
      'qai-hub submit-profile-job --model keypoint6d_w8a8.bin --device "RB5 (Robotics)" --options "--compute_unit npu"',
  },
  {
    id: 'qai-depth-vio-03',
    modelName: 'StereoNet-VIO-Disparity-SuperPoint',
    taskCategory: 'Visual Odometry & Depth',
    linkedProjectId: 'proj-drone-aether',
    targetDevice: 'Snapdragon Flight Gen 2',
    computeUnit: 'Hexagon NPU (HTP)',
    runtimeFormat: 'ONNX Runtime QNN EP',
    quantizationMode: 'Mixed Precision (W4A16)',
    fp32BaselineLatencyMs: 42.1,
    optimizedLatencyMs: 4.95,
    speedupFactor: 8.51,
    npuComputeLoadPercent: 91.2,
    peakSramMb: 9.2,
    powerEfficiencyInfPerWatt: 96,
    accuracyMetricName: 'Sub-Pixel Disparity Inlier (%)',
    fp32Accuracy: 96.4,
    quantizedAccuracy: 96.1,
    hubJobId: 'jk19c88z4',
    profiledAt: '2026-09-29 19:30',
    deploymentCommand:
      'qai-hub submit-compile-job --model stereonet_vio.pt --device "Snapdragon Flight Gen 2" --options "--target_runtime onnx --quantize_weights w4 --quantize_activations fp16"',
  },
  {
    id: 'qai-nano-obstacle-04',
    modelName: 'NanoDet-Swarm-Corridor-Seg',
    taskCategory: 'Obstacle Avoidance',
    linkedProjectId: 'proj-drone-swarm',
    targetDevice: 'Qualcomm Dragonwing RB3 Gen 2',
    computeUnit: 'Hexagon NPU (HTP)',
    runtimeFormat: 'TFLite QNN Delegate',
    quantizationMode: 'INT8 (W8A8)',
    fp32BaselineLatencyMs: 18.6,
    optimizedLatencyMs: 2.15,
    speedupFactor: 8.65,
    npuComputeLoadPercent: 94.0,
    peakSramMb: 3.1,
    powerEfficiencyInfPerWatt: 340,
    accuracyMetricName: 'Corridor Free-Space mIoU (%)',
    fp32Accuracy: 92.1,
    quantizedAccuracy: 91.7,
    hubJobId: 'jq77r41p9',
    profiledAt: '2026-09-28 15:10',
    deploymentCommand:
      'qai-hub submit-compile-job --model nanodet_corridor.tflite --device "Qualcomm QCS6490 (Proxy for RB3 Gen 2)" --options "--target_runtime tflite --quantize_full_type int8"',
  },
];
