export const STAGES = ["IF", "ID", "EX", "MEM", "WB"];

export const SAMPLE_PROGRAMS = {
  "RAW Hazard Demo": `addi x1, x0, 10
addi x2, x0, 20
add x3, x1, x2
sub x4, x3, x1
and x5, x3, x4`,
  "Load-Use Hazard": `addi x1, x0, 100
lw x2, 0(x1)
add x3, x2, x1
sw x3, 4(x1)
addi x4, x3, 1`,
  "Branch & Flush": `addi x1, x0, 5
addi x2, x0, 5
beq x1, x2, 8
addi x3, x0, 99
addi x4, x0, 42
add x5, x1, x2`,
  "Mixed Hazards": `lw x1, 0(x0)
lw x2, 4(x0)
add x3, x1, x2
sw x3, 8(x0)
beq x3, x0, 8
addi x5, x3, 1
sub x6, x3, x2`,
};

export const STAGE_COLORS = {
  IF:  { bg: "#1e3a5f", border: "#3b82f6", text: "#93c5fd", glow: "rgba(59,130,246,0.4)" },
  ID:  { bg: "#1e3a2f", border: "#10b981", text: "#6ee7b7", glow: "rgba(16,185,129,0.4)" },
  EX:  { bg: "#3a1e2f", border: "#a855f7", text: "#d8b4fe", glow: "rgba(168,85,247,0.4)" },
  MEM: { bg: "#3a2a1e", border: "#f59e0b", text: "#fcd34d", glow: "rgba(245,158,11,0.4)" },
  WB:  { bg: "#3a1e1e", border: "#ef4444", text: "#fca5a5", glow: "rgba(239,68,68,0.4)" },
};

export const HAZARD_COLORS = {
  "raw-forward": "#10b981",
  "load-use": "#f59e0b",
  "control": "#ef4444",
};