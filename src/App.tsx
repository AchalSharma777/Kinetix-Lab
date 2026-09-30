import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  EngineeringProject,
  MicrocontrollerLibrary,
  HardwareBuildGuide,
  QualcommAIHubModel,
  ProjectCategory,
  PerformanceEntry,
  ProjectCodeFile,
} from './types/engineering';
import {
  INITIAL_PROJECTS,
  INITIAL_LIBRARIES,
  INITIAL_HARDWARE_GUIDES,
  INITIAL_AI_HUB_MODELS,
} from './data/initialData';
import { ProjectWorkspace } from './components/ProjectWorkspace';
import { MicrocontrollerLibrariesView } from './components/MicrocontrollerLibrariesView';
import { HardwareGuidesView } from './components/HardwareGuidesView';
import { QualcommAiHubView } from './components/QualcommAiHubView';
import { ProjectFormModal } from './components/ProjectFormModal';
import { EngineeringCopilotDrawer } from './components/EngineeringCopilotDrawer';
import { Sun, Moon, Menu, X } from 'lucide-react';

import quadrupedImg from './assets/images/robotics_quadruped_chassis_1790780575271.jpg';
import vtolDroneImg from './assets/images/drone_autonomous_vtol_1790780606825.jpg';

type NavSection = 'robotics' | 'drones' | 'ai_hub' | 'libraries' | 'hardware';

const STORAGE_KEYS = {
  PROJECTS: 'kinetix_lab_projects_v1',
  LIBRARIES: 'kinetix_lab_libraries_v1',
  GUIDES: 'kinetix_lab_guides_v1',
  AI_HUB: 'kinetix_lab_ai_hub_v1',
  THEME: 'kinetix_lab_theme_v1',
};

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('robotics');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return saved ? saved === 'dark' : true;
  });

  const [projects, setProjects] = useState<EngineeringProject[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      return raw ? JSON.parse(raw) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [libraries, setLibraries] = useState<MicrocontrollerLibrary[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.LIBRARIES);
      return raw ? JSON.parse(raw) : INITIAL_LIBRARIES;
    } catch {
      return INITIAL_LIBRARIES;
    }
  });

  const [hardwareGuides, setHardwareGuides] = useState<HardwareBuildGuide[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GUIDES);
      return raw ? JSON.parse(raw) : INITIAL_HARDWARE_GUIDES;
    } catch {
      return INITIAL_HARDWARE_GUIDES;
    }
  });

  const [aiHubModels, setAiHubModels] = useState<QualcommAIHubModel[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.AI_HUB);
      return raw ? JSON.parse(raw) : INITIAL_AI_HUB_MODELS;
    } catch {
      return INITIAL_AI_HUB_MODELS;
    }
  });

  // Cross-section deep link state
  const [focusedAiModelId, setFocusedAiModelId] = useState<string | undefined>(undefined);
  const [focusedGuideId, setFocusedGuideId] = useState<string | undefined>(undefined);

  // New / Edit Project Modal state
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState<ProjectCategory>('robotics');
  const [editingProject, setEditingProject] = useState<EngineeringProject | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LIBRARIES, JSON.stringify(libraries));
  }, [libraries]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GUIDES, JSON.stringify(hardwareGuides));
  }, [hardwareGuides]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AI_HUB, JSON.stringify(aiHubModels));
  }, [aiHubModels]);

  // Handlers for projects
  const handleAddEntry = (projectId: string, entry: PerformanceEntry) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const newStatus =
          entry.isFailure || entry.deltaScore < -5
            ? 'DRIFTING'
            : entry.performanceScore >= 80
            ? 'NOMINAL'
            : p.status;
        return {
          ...p,
          status: newStatus,
          updatedAt: entry.timestamp.split(' ')[0],
          entries: [...p.entries, entry],
        };
      })
    );
  };

  const handleAddCodeFile = (projectId: string, codeFile: ProjectCodeFile) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, codeFiles: [...p.codeFiles, codeFile] } : p
      )
    );
  };

  const handleSaveProject = (saved: EngineeringProject) => {
    setProjects((prev) => {
      const exists = prev.some((p) => p.id === saved.id);
      if (exists) {
        return prev.map((p) => (p.id === saved.id ? saved : p));
      }
      return [...prev, saved];
    });
    setActiveSection(saved.category);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  };

  // Handlers for Microcontroller Libraries
  const handleSaveLibrary = (lib: MicrocontrollerLibrary) => {
    setLibraries((prev) => {
      const exists = prev.some((l) => l.id === lib.id);
      if (exists) {
        return prev.map((l) => (l.id === lib.id ? lib : l));
      }
      return [lib, ...prev];
    });
  };

  const handleDeleteLibrary = (id: string) => {
    setLibraries((prev) => prev.filter((l) => l.id !== id));
  };

  // Handler for Hardware Guides
  const handleAddGuide = (guide: HardwareBuildGuide) => {
    setHardwareGuides((prev) => [guide, ...prev]);
  };

  // Handler for Qualcomm AI Hub Models
  const handleAddAiHubModel = (
    model: QualcommAIHubModel,
    commitToProject?: { projectId: string; entry: PerformanceEntry }
  ) => {
    setAiHubModels((prev) => [model, ...prev]);
    if (commitToProject) {
      handleAddEntry(commitToProject.projectId, commitToProject.entry);
    }
  };

  const handleResetDemoData = () => {
    setProjects(INITIAL_PROJECTS);
    setLibraries(INITIAL_LIBRARIES);
    setHardwareGuides(INITIAL_HARDWARE_GUIDES);
    setAiHubModels(INITIAL_AI_HUB_MODELS);
  };

  const navLinks: { id: NavSection; label: string }[] = [
    { id: 'robotics', label: 'Robotics' },
    { id: 'drones', label: 'Drones' },
    { id: 'ai_hub', label: 'AI Hub' },
    { id: 'libraries', label: 'Libraries' },
    { id: 'hardware', label: 'Hardware' },
  ];

  return (
    <div
      className={`${
        darkMode ? 'dark' : ''
      } min-h-screen flex flex-col bg-white dark:bg-[#09090D] text-neutral-900 dark:text-white transition-colors duration-150`}
    >
      {/* Top Bar Contract: Strictly 3 zones (Single Brand element, 5 clean text nav links, 2 actions) */}
      <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 lg:px-10 border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-[#09090D]/95 backdrop-blur-sm">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#robotics"
          onClick={(e) => {
            e.preventDefault();
            setActiveSection('robotics');
          }}
          className="font-display text-lg font-extrabold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap shrink-0"
        >
          Kinetix Lab
        </a>

        {/* Zone 2: 5 single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`py-1 border-b-2 transition-colors whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'border-purple-600 text-neutral-900 dark:text-white font-semibold'
                    : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: 2 primary actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label="Toggle dark or light color theme"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-[#111118] text-neutral-800 dark:text-neutral-200 hover:border-purple-500 transition-colors whitespace-nowrap shrink-0"
          >
            {darkMode ? (
              <>
                <Sun className="w-3.5 h-3.5 text-purple-400" />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-purple-600" />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingProject(null);
              setModalCategory(activeSection === 'drones' ? 'drones' : 'robotics');
              setProjectModalOpen(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded transition-colors whitespace-nowrap shrink-0"
          >
            + New Project
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 text-neutral-700 dark:text-neutral-300"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#111118] px-6 py-3 flex flex-wrap gap-4">
          {navLinks.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActiveSection(item.id);
                setMobileMenuOpen(false);
              }}
              className={`text-xs font-semibold py-1 border-b-2 ${
                activeSection === item.id
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-neutral-600 dark:text-neutral-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Content Stage with Smooth Animated Section Transitions */}
      <main className="flex-1 w-full max-w-[1380px] mx-auto px-6 lg:px-10 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeSection === 'robotics' && (
              <ProjectWorkspace
                category="robotics"
                projects={projects}
                aiHubModels={aiHubModels}
                hardwareGuides={hardwareGuides}
                onAddEntry={handleAddEntry}
                onAddCodeFile={handleAddCodeFile}
                onDeleteProject={handleDeleteProject}
                onOpenNewProjectModal={(cat) => {
                  setEditingProject(null);
                  setModalCategory(cat);
                  setProjectModalOpen(true);
                }}
                onEditProject={(proj) => {
                  setEditingProject(proj);
                  setModalCategory(proj.category);
                  setProjectModalOpen(true);
                }}
                onNavigateToAiHub={(modelId) => {
                  setFocusedAiModelId(modelId);
                  setActiveSection('ai_hub');
                }}
                onNavigateToHardware={(guideId) => {
                  setFocusedGuideId(guideId);
                  setActiveSection('hardware');
                }}
              />
            )}

            {activeSection === 'drones' && (
              <ProjectWorkspace
                category="drones"
                projects={projects}
                aiHubModels={aiHubModels}
                hardwareGuides={hardwareGuides}
                onAddEntry={handleAddEntry}
                onAddCodeFile={handleAddCodeFile}
                onDeleteProject={handleDeleteProject}
                onOpenNewProjectModal={(cat) => {
                  setEditingProject(null);
                  setModalCategory(cat);
                  setProjectModalOpen(true);
                }}
                onEditProject={(proj) => {
                  setEditingProject(proj);
                  setModalCategory(proj.category);
                  setProjectModalOpen(true);
                }}
                onNavigateToAiHub={(modelId) => {
                  setFocusedAiModelId(modelId);
                  setActiveSection('ai_hub');
                }}
                onNavigateToHardware={(guideId) => {
                  setFocusedGuideId(guideId);
                  setActiveSection('hardware');
                }}
              />
            )}

            {activeSection === 'ai_hub' && (
              <QualcommAiHubView
                models={aiHubModels}
                projects={projects}
                initialSelectedModelId={focusedAiModelId}
                onAddAiHubModel={handleAddAiHubModel}
              />
            )}

            {activeSection === 'libraries' && (
              <MicrocontrollerLibrariesView
                libraries={libraries}
                hardwareGuides={hardwareGuides}
                onSaveLibrary={handleSaveLibrary}
                onDeleteLibrary={handleDeleteLibrary}
                onNavigateToHardware={(guideId) => {
                  setFocusedGuideId(guideId);
                  setActiveSection('hardware');
                }}
              />
            )}

            {activeSection === 'hardware' && (
              <HardwareGuidesView
                guides={hardwareGuides}
                initialSelectedGuideId={focusedGuideId}
                onAddGuide={handleAddGuide}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Quiet Functional Footer */}
      <footer className="border-t border-neutral-200 dark:border-neutral-800 px-6 lg:px-10 py-5 text-xs text-neutral-500 dark:text-neutral-400">
        <div className="max-w-[1380px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            Kinetix Lab — Robotics, Autonomous UAV &amp; Qualcomm Edge NPU Workbench
          </div>
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={handleResetDemoData}
              className="hover:text-purple-500 transition-colors"
            >
              Reset Default Sample Data
            </button>
          </div>
        </div>
      </footer>

      {/* Project Creation & Editing Modal */}
      <ProjectFormModal
        isOpen={projectModalOpen}
        initialCategory={modalCategory}
        editingProject={editingProject}
        aiHubModels={aiHubModels}
        hardwareGuides={hardwareGuides}
        defaultImages={{
          robotics: quadrupedImg,
          drones: vtolDroneImg,
        }}
        onClose={() => setProjectModalOpen(false)}
        onSaveProject={handleSaveProject}
      />

      {/* Multi-Turn Gemini Engineering Copilot with Google Search Grounding */}
      <EngineeringCopilotDrawer
        projects={projects}
        libraries={libraries}
        aiHubModels={aiHubModels}
      />
    </div>
  );
}
