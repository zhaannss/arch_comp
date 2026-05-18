import { useState, useEffect, useRef, useCallback } from "react";
import { SAMPLE_PROGRAMS, STAGE_COLORS } from "./constants.js";
import { parseInstruction, createInitialPipelineState, stepPipeline } from "./engine.js";
import { GlowBadge, HazardIndicator, PipelineDiagram, PipelineRegistersDetail, InstructionGrid, RegisterFile, MemoryViewer, EducationalPanel } from "./components.jsx";

export default function App() {
  const [code, setCode] = useState(
    `addi x1, x0, 10\naddi x2, x0, 20\nadd x3, x1, x2\nsub x4, x3, x1\nand x5, x3, x4`
  );
  const [pipelineState, setPipelineState] = useState(null);
  const [prevRegisters, setPrevRegisters] = useState(null);
  const [prevMemory, setPrevMemory] = useState(null);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState(600);
  const [parseError, setParseError] = useState("");
  const [activeTab, setActiveTab] = useState("pipeline");
  const intervalRef = useRef(null);

  const parseAndInit = useCallback(() => {
    const lines = code.split("\n");
    const instructions = [];
    let error = "";
    lines.forEach((line, i) => {
      const instr = parseInstruction(line, i);
      if (instr) instructions.push(instr);
      else if (line.trim() && !line.trim().startsWith("#")) {
        // silently skip unknown lines
      }
    });
    if (instructions.length === 0) {
      error = "No valid instructions found.";
      setParseError(error);
      return null;
    }
    setParseError("");
    return createInitialPipelineState(instructions);
  }, [code]);

  const handleReset = useCallback(() => {
    setRunning(false);
    clearInterval(intervalRef.current);
    const state = parseAndInit();
    if (state) {
      setPipelineState(state);
      setPrevRegisters(null);
      setPrevMemory(null);
    }
  }, [parseAndInit]);

  const handleStep = useCallback(() => {
    if (!pipelineState || pipelineState.done) return;
    setPrevRegisters(pipelineState.registers);
    setPrevMemory(pipelineState.memory);
    setPipelineState((s) => stepPipeline(s));
  }, [pipelineState]);

  const handleRunPause = useCallback(() => {
    if (!pipelineState) {
      const state = parseAndInit();
      if (state) {
        setPipelineState(state);
        setRunning(true);
      }
      return;
    }
    setRunning((r) => !r);
  }, [pipelineState, parseAndInit]);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setPipelineState((s) => {
          if (!s || s.done) {
            setRunning(false);
            return s;
          }
          setPrevRegisters(s.registers);
          setPrevMemory(s.memory);
          return stepPipeline(s);
        });
      }, speed);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, speed]);

  const cpi = pipelineState?.instructionsCompleted > 0
    ? (pipelineState.totalCycles / pipelineState.instructionsCompleted).toFixed(2)
    : "—";

  const ipc = pipelineState?.instructionsCompleted > 0
    ? (pipelineState.instructionsCompleted / pipelineState.totalCycles).toFixed(3)
    : "—";

  const tabs = [
    { id: "pipeline", label: "Pipeline" },
    { id: "registers", label: "Registers" },
    { id: "memory", label: "Memory" },
    { id: "education", label: "Learn" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#030712",
      color: "#e5e7eb",
      fontFamily: "'Inter', sans-serif",
      padding: "0",
    }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(90deg, #030712 0%, #0d1117 50%, #030712 100%)",
        borderBottom: "1px solid #1f2937",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 6,
            background: "linear-gradient(135deg, #1e3a5f, #3b82f6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, color: "#fff",
            boxShadow: "0 0 12px rgba(59,130,246,0.4)",
          }}>R</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f9fafb", letterSpacing: 0.5 }}>
              RISC-V Pipeline Simulator
            </div>
            <div style={{ fontSize: 10, color: "#4b5563", fontFamily: "monospace", letterSpacing: 1 }}>
              5-STAGE IN-ORDER PIPELINE · HAZARD DETECTION · DATA FORWARDING
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {pipelineState && (
            <>
              <GlowBadge label={`CYCLE ${pipelineState.cycle}`} color={STAGE_COLORS.IF} />
              {pipelineState.done && <GlowBadge label="DONE" color={STAGE_COLORS.WB} />}
              {pipelineState.hazards?.length > 0 && (
                <GlowBadge label={pipelineState.hazards[0].type === "control" ? "FLUSH" : pipelineState.hazards[0].type === "load-use" ? "STALL" : "FWD"} color={
                  pipelineState.hazards[0].type === "control" ? STAGE_COLORS.WB :
                  pipelineState.hazards[0].type === "load-use" ? STAGE_COLORS.MEM :
                  STAGE_COLORS.ID
                } />
              )}
            </>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 0, minHeight: "calc(100vh - 57px)" }}>

        {/* LEFT PANEL: Editor */}
        <div style={{
          borderRight: "1px solid #1f2937",
          display: "flex",
          flexDirection: "column",
          background: "#0d1117",
        }}>
          {/* Sample Programs */}
          <div style={{ padding: "12px 16px", borderBottom: "1px solid #1f2937" }}>
            <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: 2, marginBottom: 8, fontFamily: "monospace" }}>SAMPLE PROGRAMS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {Object.keys(SAMPLE_PROGRAMS).map((name) => (
                <button key={name} onClick={() => {
                  setCode(SAMPLE_PROGRAMS[name]);
                  setRunning(false);
                  setPipelineState(null);
                }} style={{
                  padding: "6px 10px",
                  borderRadius: 4,
                  border: "1px solid #1f2937",
                  background: "#030712",
                  color: "#9ca3af",
                  fontSize: 11,
                  cursor: "pointer",
                  textAlign: "left",
                  fontFamily: "monospace",
                  transition: "all 0.15s",
                }}
                  onMouseEnter={e => { e.target.style.borderColor = "#3b82f6"; e.target.style.color = "#93c5fd"; }}
                  onMouseLeave={e => { e.target.style.borderColor = "#1f2937"; e.target.style.color = "#9ca3af"; }}
                >{name}</button>
              ))}
            </div>
          </div>

          {/* Code Editor */}
          <div style={{ padding: "12px 16px", flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: 2, marginBottom: 8, fontFamily: "monospace" }}>ASSEMBLY EDITOR</div>
            <textarea
              value={code}
              onChange={(e) => { setCode(e.target.value); setPipelineState(null); setRunning(false); }}
              style={{
                flex: 1,
                minHeight: 200,
                background: "#030712",
                border: "1px solid #1f2937",
                borderRadius: 6,
                color: "#a5f3fc",
                fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
                fontSize: 12,
                lineHeight: 1.8,
                padding: "12px",
                resize: "vertical",
                outline: "none",
              }}
              spellCheck={false}
            />
            {parseError && (
              <div style={{ fontSize: 11, color: "#ef4444", marginTop: 6, fontFamily: "monospace" }}>⚠ {parseError}</div>
            )}
          </div>

          {/* Controls */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #1f2937" }}>
            <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: 2, marginBottom: 10, fontFamily: "monospace" }}>SIMULATION CONTROLS</div>

            {/* Speed */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace", whiteSpace: "nowrap" }}>SPEED</span>
              <input type="range" min={100} max={2000} step={100} value={speed}
                onChange={e => setSpeed(Number(e.target.value))}
                style={{ flex: 1, accentColor: "#3b82f6" }} />
              <span style={{ fontSize: 10, color: "#6b7280", fontFamily: "monospace", minWidth: 48 }}>{speed}ms</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {[
                { label: running ? "⏸ Pause" : "▶ Run", onClick: handleRunPause, accent: "#3b82f6" },
                { label: "⏭ Step", onClick: handleStep, accent: "#10b981", disabled: pipelineState?.done },
                { label: "↺ Reset", onClick: handleReset, accent: "#f59e0b" },
              ].map((btn) => (
                <button key={btn.label} onClick={btn.onClick} disabled={btn.disabled}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: `1px solid ${btn.disabled ? "#1f2937" : btn.accent}`,
                    background: btn.disabled ? "#0d1117" : `${btn.accent}18`,
                    color: btn.disabled ? "#374151" : btn.accent,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: btn.disabled ? "not-allowed" : "pointer",
                    fontFamily: "monospace",
                    transition: "all 0.15s",
                    boxShadow: !btn.disabled ? `0 0 8px ${btn.accent}30` : "none",
                  }}>
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Stats Bar */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 1,
            borderBottom: "1px solid #1f2937",
            background: "#0d1117",
          }}>
            {[
              { label: "CYCLES", value: pipelineState?.totalCycles ?? 0, color: "#60a5fa" },
              { label: "INSTRUCTIONS", value: pipelineState?.instructionsCompleted ?? 0, color: "#a78bfa" },
              { label: "CPI", value: cpi, color: "#34d399" },
              { label: "IPC", value: ipc, color: "#10b981" },
              { label: "STALLS", value: pipelineState?.stallCount ?? 0, color: "#fbbf24" },
              { label: "FORWARDS", value: pipelineState?.forwardCount ?? 0, color: "#4ade80" },
              { label: "FLUSHES", value: pipelineState?.flushCount ?? 0, color: "#f87171" },
            ].map((s) => (
              <div key={s.label} style={{
                padding: "10px 12px",
                borderRight: "1px solid #1f2937",
                display: "flex", flexDirection: "column", gap: 2,
              }}>
                <div style={{ fontSize: 9, color: "#4b5563", fontFamily: "monospace", letterSpacing: 2 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Pipeline Diagram */}
          <div style={{
            padding: "16px 20px",
            borderBottom: "1px solid #1f2937",
            background: "#030712",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: 2, fontFamily: "monospace" }}>PIPELINE STAGES</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                {pipelineState && <HazardIndicator hazards={pipelineState.hazards} />}
              </div>
            </div>
            {pipelineState ? (
              <>
                <PipelineDiagram pipelineState={pipelineState} />
                <PipelineRegistersDetail pipelineState={pipelineState} />
              </>
            ) : (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 80,
                color: "#374151",
                fontSize: 12,
                fontFamily: "monospace",
                border: "1px dashed #1f2937",
                borderRadius: 6,
              }}>
                Press ▶ Run or ⏭ Step to start simulation
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid #1f2937",
            background: "#0d1117",
          }}>
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                padding: "10px 20px",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #3b82f6" : "2px solid transparent",
                background: "transparent",
                color: activeTab === tab.id ? "#60a5fa" : "#4b5563",
                fontSize: 12,
                fontWeight: activeTab === tab.id ? 600 : 400,
                cursor: "pointer",
                fontFamily: "monospace",
                letterSpacing: 1,
                transition: "all 0.15s",
              }}>{tab.label.toUpperCase()}</button>
            ))}
          </div>

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: "auto", padding: "16px 20px" }}>
            {activeTab === "pipeline" && (
              <div>
                <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: 2, marginBottom: 12, fontFamily: "monospace" }}>
                  EXECUTION TIMELINE — Cycle {pipelineState?.cycle ?? 0}
                </div>
                {pipelineState ? (
                  <InstructionGrid pipelineState={pipelineState} />
                ) : (
                  <div style={{ color: "#374151", fontSize: 12, fontFamily: "monospace", padding: "32px 0", textAlign: "center" }}>
                    Execution timeline appears here after simulation starts
                  </div>
                )}

                {/* Forwarding Paths */}
                {pipelineState?.forwardingPaths?.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: 2, marginBottom: 8, fontFamily: "monospace" }}>ACTIVE FORWARDING PATHS</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {pipelineState.forwardingPaths.map((fp, i) => (
                        <div key={i} style={{
                          padding: "4px 10px",
                          borderRadius: 4,
                          background: "#0d1f1a",
                          border: "1px solid #10b981",
                          fontSize: 11,
                          color: "#6ee7b7",
                          fontFamily: "monospace",
                        }}>
                          {fp.from} → {fp.to} [x{fp.reg}={fp.value}]
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legend */}
                <div style={{ marginTop: 16, display: "flex", gap: 12, flexWrap: "wrap" }}>
                  {[
                    { label: "Stage", color: "#3b82f6" },
                    { label: "Stall (S)", color: "#f59e0b" },
                    { label: "Flush (F)", color: "#ef4444" },
                  ].map((l) => (
                    <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#6b7280", fontFamily: "monospace" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: l.color }} />
                      {l.label}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "registers" && (
              <div>
                <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: 2, marginBottom: 12, fontFamily: "monospace" }}>
                  REGISTER FILE (x0–x31) — Changed registers highlighted
                </div>
                <RegisterFile
                  registers={pipelineState?.registers ?? new Array(32).fill(0)}
                  prevRegisters={prevRegisters}
                />
              </div>
            )}

            {activeTab === "memory" && (
              <div>
                <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: 2, marginBottom: 12, fontFamily: "monospace" }}>
                  DATA MEMORY — LW/SW accesses
                </div>
                <MemoryViewer
                  memory={pipelineState?.memory ?? {}}
                  prevMemory={prevMemory}
                />
              </div>
            )}

            {activeTab === "education" && (
              <div>
                <div style={{ fontSize: 10, color: "#4b5563", letterSpacing: 2, marginBottom: 12, fontFamily: "monospace" }}>
                  EDUCATIONAL REFERENCE
                </div>
                <EducationalPanel />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}