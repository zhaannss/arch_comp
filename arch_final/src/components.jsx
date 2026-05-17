import { useState } from "react";
import { STAGE_COLORS, HAZARD_COLORS } from "./constants.js";

export function GlowBadge({ label, color, small }) {
  return (
    <span style={{
      display: "inline-block",
      padding: small ? "1px 6px" : "2px 10px",
      borderRadius: 4,
      fontSize: small ? 10 : 11,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      fontWeight: 600,
      background: color.bg,
      border: `1px solid ${color.border}`,
      color: color.text,
      boxShadow: `0 0 8px ${color.glow}`,
      letterSpacing: 1,
    }}>{label}</span>
  );
}

export function StageBox({ stage, instruction, isActive, isBubble, isForwarding }) {
  const col = STAGE_COLORS[stage];
  const active = isActive && !isBubble;

  return (
    <div style={{
      width: 90,
      minHeight: 64,
      borderRadius: 8,
      border: `1.5px solid ${active ? col.border : isBubble ? "#374151" : "#1f2937"}`,
      background: active ? col.bg : isBubble ? "#111827" : "#0d1117",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      transition: "all 0.25s ease",
      boxShadow: active ? `0 0 16px ${col.glow}, inset 0 0 8px ${col.glow}30` : isForwarding ? `0 0 12px ${HAZARD_COLORS["raw-forward"]}60` : "none",
      position: "relative",
      overflow: "hidden",
    }}>
      {active && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${col.border}, transparent)`,
        }} />
      )}
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 2,
        color: active ? col.text : "#374151",
        fontFamily: "monospace",
      }}>{stage}</span>
      {active && instruction && (
        <span style={{
          fontSize: 9,
          color: col.text,
          opacity: 0.8,
          fontFamily: "monospace",
          maxWidth: 80,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textAlign: "center",
        }}>{instruction}</span>
      )}
      {isBubble && (
        <span style={{ fontSize: 9, color: "#4b5563", fontFamily: "monospace" }}>NOP</span>
      )}
    </div>
  );
}

export function PipelineRegistersDetail({ pipelineState }) {
  const { ifid, idex, exmem, memwb, cycle } = pipelineState;
  
  const registers = [
    { name: "IF/ID", data: ifid, fields: ["instruction"] },
    { name: "ID/EX", data: idex, fields: ["instruction", "rs1Val", "rs2Val"] },
    { name: "EX/MEM", data: exmem, fields: ["instruction", "aluResult", "rs2Val"] },
    { name: "MEM/WB", data: memwb, fields: ["instruction", "result", "memVal"] },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 12 }}>
      {registers.map(({ name, data, fields }) => (
        <div key={name} style={{
          background: "#0d1117",
          border: `1px solid ${data && !data.bubble ? "#3b82f6" : "#1f2937"}`,
          borderRadius: 6,
          padding: "10px 12px",
          fontSize: 11,
          color: "#e5e7eb",
        }}>
          <div style={{
            fontSize: 9,
            fontWeight: 700,
            color: data && !data.bubble ? "#60a5fa" : "#4b5563",
            marginBottom: 8,
            fontFamily: "monospace",
            letterSpacing: 1,
          }}>
            {name}
          </div>
          {data && !data.bubble ? (
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#9ca3af", display: "flex", flexDirection: "column", gap: 3 }}>
              {data.instr && <div>Instr: <span style={{ color: "#a5f3fc" }}>{data.instr.raw}</span></div>}
              {data.aluResult !== undefined && <div>ALU: <span style={{ color: "#34d399" }}>{data.aluResult}</span></div>}
              {data.result !== undefined && <div>Result: <span style={{ color: "#34d399" }}>{data.result}</span></div>}
              {data.rs1Val !== undefined && <div>rs1: <span style={{ color: "#fbbf24" }}>{data.rs1Val}</span></div>}
              {data.rs2Val !== undefined && <div>rs2: <span style={{ color: "#fbbf24" }}>{data.rs2Val}</span></div>}
            </div>
          ) : (
            <div style={{ fontFamily: "monospace", fontSize: 9, color: "#374151" }}>— (empty)</div>
          )}
        </div>
      ))}
    </div>
  );
}

export function PipelineDiagram({ pipelineState }) {
  const { ifid, idex, exmem, memwb, forwardingPaths } = pipelineState;

  const stages = [
    { stage: "IF", data: ifid },
    { stage: "ID", data: idex },
    { stage: "EX", data: exmem },
    { stage: "MEM", data: exmem },
    { stage: "WB", data: memwb },
  ];

  // remap to correct pipeline registers
  const stageData = [
    { stage: "IF", data: ifid },
    { stage: "ID", data: ifid },
    { stage: "EX", data: idex },
    { stage: "MEM", data: exmem },
    { stage: "WB", data: memwb },
  ];

  const forwardedRegs = new Set(forwardingPaths.map((f) => f.to));

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", padding: "8px 0" }}>
      {stageData.map(({ stage, data }, i) => (
        <div key={stage} style={{ display: "flex", alignItems: "center" }}>
          <StageBox
            stage={stage}
            instruction={data && !data.bubble ? data.instr?.raw : null}
            isActive={!!data && !data.bubble}
            isBubble={!!data && data.bubble}
            isForwarding={forwardedRegs.has(stage)}
          />
          {i < stageData.length - 1 && (
            <div style={{
              width: 24, height: 2,
              background: "linear-gradient(90deg, #1f2937, #374151)",
              position: "relative",
            }}>
              <div style={{
                position: "absolute", right: 0, top: -3,
                width: 0, height: 0,
                borderTop: "4px solid transparent",
                borderBottom: "4px solid transparent",
                borderLeft: "6px solid #374151",
              }} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function InstructionGrid({ pipelineState }) {
  const { instructions, instructionHistory, cycle } = pipelineState;
  const maxCycles = Math.max(cycle, 1);
  const displayCycles = Math.min(maxCycles + 2, 20);

  const getCellStyle = (stageLabel) => {
    if (!stageLabel) return { bg: "transparent", color: "#1f2937", text: "" };
    if (stageLabel === "stall") return { bg: "#292524", color: "#f59e0b", text: "S" };
    if (stageLabel === "flush") return { bg: "#1c0a0a", color: "#ef4444", text: "F" };
    if (stageLabel === "—") return { bg: "transparent", color: "#374151", text: "·" };
    const col = STAGE_COLORS[stageLabel];
    if (col) return { bg: col.bg, color: col.text, text: stageLabel };
    return { bg: "transparent", color: "#374151", text: stageLabel };
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", fontSize: 10, fontFamily: "monospace", minWidth: "100%" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "4px 8px", color: "#6b7280", fontWeight: 500, minWidth: 160, borderBottom: "1px solid #1f2937" }}>Instruction</th>
            {Array.from({ length: displayCycles }, (_, i) => (
              <th key={i} style={{
                padding: "4px 6px",
                color: i + 1 === cycle ? "#60a5fa" : "#4b5563",
                fontWeight: i + 1 === cycle ? 700 : 400,
                minWidth: 34,
                textAlign: "center",
                borderBottom: "1px solid #1f2937",
                borderLeft: i + 1 === cycle ? "1px solid #1e3a5f" : "none",
                borderRight: i + 1 === cycle ? "1px solid #1e3a5f" : "none",
                background: i + 1 === cycle ? "#0f172a" : "transparent",
              }}>{i + 1}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {instructions.map((instr, idx) => {
            const history = instructionHistory[idx] || [];
            return (
              <tr key={idx} style={{ borderBottom: "1px solid #111827" }}>
                <td style={{ padding: "3px 8px", color: "#9ca3af", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
                  <span style={{ color: "#4b5563", marginRight: 6 }}>{idx + 1}.</span>
                  {instr.raw}
                </td>
                {Array.from({ length: displayCycles }, (_, i) => {
                  const stageLabel = history[i] || "";
                  const cell = getCellStyle(stageLabel);
                  return (
                    <td key={i} style={{
                      padding: "3px 6px",
                      textAlign: "center",
                      background: cell.bg,
                      color: cell.color,
                      fontWeight: 600,
                      borderLeft: i + 1 === cycle ? "1px solid #1e3a5f" : "none",
                      borderRight: i + 1 === cycle ? "1px solid #1e3a5f" : "none",
                      fontSize: 9,
                    }}>{cell.text}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function RegisterFile({ registers, prevRegisters }) {
  const names = ["zero","ra","sp","gp","tp","t0","t1","t2","s0","s1","a0","a1","a2","a3","a4","a5","a6","a7","s2","s3","s4","s5","s6","s7","s8","s9","s10","s11","t3","t4","t5","t6"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 3 }}>
      {registers.map((val, i) => {
        const changed = prevRegisters && prevRegisters[i] !== val;
        return (
          <div key={i} style={{
            padding: "4px 6px",
            borderRadius: 4,
            background: changed ? "#1e3a5f" : "#0d1117",
            border: `1px solid ${changed ? "#3b82f6" : "#1f2937"}`,
            transition: "all 0.3s ease",
            boxShadow: changed ? "0 0 8px rgba(59,130,246,0.3)" : "none",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 9, color: "#4b5563", fontFamily: "monospace" }}>x{i}</span>
              <span style={{ fontSize: 8, color: "#374151", fontFamily: "monospace" }}>{names[i]}</span>
            </div>
            <div style={{ fontSize: 11, color: changed ? "#93c5fd" : "#6b7280", fontFamily: "monospace", fontWeight: 600 }}>
              {val}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MemoryViewer({ memory, prevMemory }) {
  const entries = Object.entries(memory);
  if (entries.length === 0) {
    return (
      <div style={{ color: "#374151", fontSize: 12, fontFamily: "monospace", padding: "16px 0", textAlign: "center" }}>
        No memory accesses yet
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {entries.map(([addr, val]) => {
        const changed = prevMemory && prevMemory[addr] !== val;
        return (
          <div key={addr} style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "4px 8px",
            borderRadius: 4,
            background: changed ? "#3a2a1e" : "#0d1117",
            border: `1px solid ${changed ? "#f59e0b" : "#1f2937"}`,
            fontFamily: "monospace",
          }}>
            <span style={{ fontSize: 11, color: "#6b7280" }}>0x{parseInt(addr).toString(16).padStart(4, "0")}</span>
            <span style={{ fontSize: 11, color: changed ? "#fcd34d" : "#9ca3af", fontWeight: 600 }}>{val}</span>
          </div>
        );
      })}
    </div>
  );
}

export function HazardIndicator({ hazards }) {
  if (!hazards || hazards.length === 0) {
    return (
      <div style={{ color: "#10b981", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 16 }}>✓</span> No hazards this cycle
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {hazards.map((h, i) => (
        <div key={i} style={{
          padding: "4px 10px",
          borderRadius: 4,
          background: h.type === "control" ? "#1c0a0a" : h.type === "load-use" ? "#292524" : "#0d1f1a",
          border: `1px solid ${HAZARD_COLORS[h.type]}`,
          fontSize: 11,
          color: HAZARD_COLORS[h.type],
          fontFamily: "monospace",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}>
          {h.type === "control" ? "⚡" : h.type === "load-use" ? "⚠" : "→"}
          {h.type === "raw-forward" ? "RAW (forwarded)" : h.type === "load-use" ? "Load-Use Stall" : "Control Hazard"}
        </div>
      ))}
    </div>
  );
}

export function StatCard({ label, value, accent }) {
  return (
    <div style={{
      background: "#0d1117",
      border: "1px solid #1f2937",
      borderRadius: 8,
      padding: "12px 16px",
      borderLeft: `3px solid ${accent}`,
    }}>
      <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4, fontFamily: "monospace", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: accent, fontFamily: "monospace" }}>{value}</div>
    </div>
  );
}

export function EducationalPanel() {
  const [selected, setSelected] = useState("pipeline");
  const topics = {
    pipeline: {
      title: "5-Stage Pipeline",
      content: [
        { stage: "IF", desc: "Instruction Fetch: PC → Memory → Instruction register. Reads the next instruction from memory using the Program Counter." },
        { stage: "ID", desc: "Instruction Decode: Decode opcode, read register file, sign-extend immediates. Control signals generated here." },
        { stage: "EX", desc: "Execute: ALU performs arithmetic/logic. Forwarding unit resolves RAW hazards by feeding results directly back." },
        { stage: "MEM", desc: "Memory Access: Load/store operations. LW reads from data memory; SW writes. Branch target computed." },
        { stage: "WB", desc: "Write Back: Final result written to register file. Completes instruction execution." },
      ],
    },
    hazards: {
      title: "Hazard Types",
      content: [
        { stage: "RAW", desc: "Read After Write: Instruction reads a register before a previous instruction has written it. Solved by forwarding or stalling." },
        { stage: "WAR", desc: "Write After Read: Later write conflicts with earlier read. Rare in 5-stage pipelines with in-order execution." },
        { stage: "WAW", desc: "Write After Write: Two writes to same register. Can occur with out-of-order execution or multi-cycle ops." },
        { stage: "CTRL", desc: "Control Hazard: Branch outcome unknown until EX stage. Causes 1-cycle bubble (flush) when branch is taken." },
        { stage: "LOAD", desc: "Load-Use: LW result unavailable until MEM stage. Cannot forward in time — requires 1 stall cycle before EX." },
      ],
    },
    forwarding: {
      title: "Data Forwarding",
      content: [
        { stage: "EX→EX", desc: "Forward ALU result from EX/MEM register back to EX stage input. Eliminates RAW stalls for most R-type instructions." },
        { stage: "MEM→EX", desc: "Forward from MEM/WB register to EX stage. Handles 2-cycle RAW hazards when no load is involved." },
        { stage: "MEM→MEM", desc: "Forward store value from MEM/WB to MEM stage. Enables back-to-back memory operations." },
        { stage: "LIMIT", desc: "Load-Use hazard cannot be forwarded: LW data exits MEM at the same time the next instruction needs it in EX." },
      ],
    },
  };

  const current = topics[selected];

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {Object.keys(topics).map((k) => (
          <button key={k} onClick={() => setSelected(k)} style={{
            padding: "4px 12px",
            borderRadius: 4,
            border: `1px solid ${selected === k ? "#3b82f6" : "#1f2937"}`,
            background: selected === k ? "#1e3a5f" : "#0d1117",
            color: selected === k ? "#93c5fd" : "#6b7280",
            fontSize: 11,
            fontFamily: "monospace",
            cursor: "pointer",
            letterSpacing: 1,
          }}>{k.toUpperCase()}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {current.content.map((item, i) => (
          <div key={i} style={{
            display: "flex",
            gap: 10,
            padding: "8px 10px",
            borderRadius: 6,
            background: "#0d1117",
            border: "1px solid #1f2937",
          }}>
            <span style={{
              fontSize: 9,
              fontFamily: "monospace",
              fontWeight: 700,
              color: "#60a5fa",
              background: "#1e3a5f",
              border: "1px solid #3b82f6",
              borderRadius: 3,
              padding: "2px 5px",
              height: "fit-content",
              whiteSpace: "nowrap",
            }}>{item.stage}</span>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}