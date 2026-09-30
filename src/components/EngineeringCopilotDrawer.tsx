import React, { useState, useRef, useEffect } from 'react';
import {
  EngineeringProject,
  MicrocontrollerLibrary,
  QualcommAIHubModel,
} from '../types/engineering';
import {
  MessageSquare,
  X,
  Send,
  Globe,
  Zap,
  ExternalLink,
  Trash2,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelUsed?: string;
  sources?: { uri: string; title: string }[];
  timestamp: string;
}

interface EngineeringCopilotDrawerProps {
  projects: EngineeringProject[];
  libraries: MicrocontrollerLibrary[];
  aiHubModels: QualcommAIHubModel[];
}

export const EngineeringCopilotDrawer: React.FC<EngineeringCopilotDrawerProps> = ({
  projects,
  libraries,
  aiHubModels,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'balanced' | 'fast'>('balanced');
  const [useSearchGrounding, setUseSearchGrounding] = useState(true);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'model',
      text: 'Kinetix Lab Control & Firmware Assistant ready. Ask me to diagnose actuator or UAV control loop regressions, generate STM32H7/Teensy C++ drivers, look up real-time component datasheets via Google Search Grounding, or optimize Qualcomm AI Hub QNN models.',
      modelUsed: 'gemini-3.8-flash',
      timestamp: 'Ready',
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const buildContextSummary = () => {
    const projText = projects
      .map((p) => {
        const last = p.entries[p.entries.length - 1];
        const fails = p.entries.filter((e) => e.isFailure).length;
        return `- [${p.category.toUpperCase()}] ${p.name} (${p.mcuPrimary}, ${p.companionCompute}, ${p.controlFrequencyHz}Hz): Latest Score ${last?.performanceScore ?? 0}% (Delta ${last?.deltaScore ?? 0}%), Failures Logged: ${fails}`;
      })
      .join('\n');

    const libText = libraries
      .map((l) => `- ${l.name} (${l.targetMcu}, ${l.executionRateHz}Hz)`)
      .join('\n');

    const qaiText = aiHubModels
      .map(
        (m) =>
          `- ${m.modelName} on ${m.targetDevice} (${m.quantizationMode}): ${m.optimizedLatencyMs}ms (${m.speedupFactor}x speedup)`
      )
      .join('\n');

    return `Projects:\n${projText}\n\nMCU Libraries:\n${libText}\n\nQualcomm AI Hub Models:\n${qaiText}`;
  };

  const handleSend = async (promptOverride?: string) => {
    const textToSend = (promptOverride ?? input).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    if (!promptOverride) setInput('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const apiMessages = updatedHistory
        .filter((m) => m.id !== 'welcome-msg')
        .map((m) => ({ role: m.role, text: m.text }));

      const response = await fetch('/api/engineering-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          mode,
          useSearchGrounding,
          projectContext: buildContextSummary(),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reach Gemini engineering endpoint');
      }

      const modelMsg: ChatMessage = {
        id: `mdl-${Date.now()}`,
        role: 'model',
        text: data.text,
        modelUsed: data.modelUsed,
        sources: data.sources,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Error communicating with engineering assistant.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Analyze why switching to 7042 carbon tri-blade props caused D-term thermal desync on Aether-X4',
    'Search latest Bosch BMI088 vs ICM-42688-P gyro noise density specs and SPI DMA wiring',
    'How to quantize a PyTorch SuperPoint VIO model to W8A8 on Qualcomm Dragonwing RB3 Gen 2?',
  ];

  return (
    <>
      {/* Floating Trigger Button (Bottom Right) */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 border border-purple-400/30 shadow-lg rounded transition-transform active:scale-95"
      >
        <MessageSquare className="w-4 h-4" />
        <span>Lab Copilot &amp; Search</span>
      </button>

      {/* Slide-Over Chat Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[1px]">
          <div className="w-full max-w-lg h-full flex flex-col bg-white dark:bg-[#111118] border-l border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white">
            {/* Drawer Header */}
            <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  Kinetix Engineering Copilot
                </h3>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                  Multi-Turn Control Theory · MCU Code · Google Search Grounded
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMessages([messages[0]])}
                  title="Clear conversation history"
                  className="p-1.5 text-neutral-500 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close copilot drawer"
                  className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode & Google Search Grounding Controls */}
            <div className="px-4 py-2.5 bg-neutral-50 dark:bg-[#09090D] border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1 p-0.5 bg-neutral-200/70 dark:bg-[#111118] border border-neutral-300 dark:border-neutral-800 rounded">
                <button
                  type="button"
                  onClick={() => setMode('balanced')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors ${
                    mode === 'balanced'
                      ? 'bg-purple-600 text-white'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  Deep + Search (Flash)
                </button>
                <button
                  type="button"
                  onClick={() => setMode('fast')}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded transition-colors inline-flex items-center gap-1 ${
                    mode === 'fast'
                      ? 'bg-purple-600 text-white'
                      : 'text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Zap className="w-3 h-3" />
                  <span>Fast (Flash-Lite)</span>
                </button>
              </div>

              {mode === 'balanced' && (
                <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useSearchGrounding}
                    onChange={(e) => setUseSearchGrounding(e.target.checked)}
                    className="accent-purple-600"
                  />
                  <Globe className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Google Search Grounding</span>
                </label>
              )}
            </div>

            {/* Scrollable Conversation Thread */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.role === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div className="text-[10px] font-mono text-neutral-400 mb-1">
                    {m.role === 'user' ? 'Engineer' : `Copilot (${m.modelUsed || 'gemini'})`} · {m.timestamp}
                  </div>
                  <div
                    className={`max-w-[92%] p-3.5 text-xs leading-relaxed whitespace-pre-wrap border ${
                      m.role === 'user'
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-neutral-50 dark:bg-[#09090D] text-neutral-900 dark:text-neutral-100 border-neutral-200 dark:border-neutral-800'
                    }`}
                  >
                    {m.text}

                    {/* Grounding Web Sources if returned */}
                    {m.sources && m.sources.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
                        <div className="text-[10px] font-mono text-purple-600 dark:text-purple-400 font-semibold">
                          Google Search Grounded Sources:
                        </div>
                        <div className="flex flex-col gap-1">
                          {m.sources.map((src, idx) => (
                            <a
                              key={idx}
                              href={src.uri}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-purple-600 dark:text-purple-400 hover:underline truncate"
                            >
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              <span className="truncate">{src.title}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="p-3 text-xs font-mono text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-[#09090D]">
                  Computing control law &amp; querying grounded engineering sources...
                </div>
              )}

              {errorMsg && (
                <div className="p-3 text-xs text-rose-600 dark:text-rose-400 border border-rose-500/40 bg-rose-500/10">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Quick Engineering Prompts */}
            <div className="px-4 py-2 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-[#09090D] flex items-center gap-2 overflow-x-auto">
              {quickPrompts.map((qp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(qp)}
                  className="px-2.5 py-1 text-[11px] border border-neutral-300 dark:border-neutral-800 bg-white dark:bg-[#111118] text-neutral-700 dark:text-neutral-300 hover:border-purple-500 rounded whitespace-nowrap shrink-0 transition-colors"
                >
                  {qp.length > 48 ? `${qp.slice(0, 48)}...` : qp}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center gap-2 bg-white dark:bg-[#111118]"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about failures, STM32 code, datasheets, or Qualcomm NPU..."
                className="flex-1 px-3 py-2 text-xs bg-neutral-50 dark:bg-[#09090D] border border-neutral-300 dark:border-neutral-800 rounded text-neutral-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded transition-colors inline-flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
