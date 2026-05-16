// Parse a single RISC-V assembly instruction
export function parseInstruction(line, index) {
  const trimmed = line.trim().replace(/,/g, " ").replace(/\s+/g, " ");
  if (!trimmed || trimmed.startsWith("#")) return null;

  const parts = trimmed.split(" ").filter(Boolean);
  const op = parts[0].toLowerCase();

  const parseReg = (s) => {
    if (!s) return 0;
    const n = parseInt(s.replace(/x/i, ""));
    return isNaN(n) ? 0 : n;
  };

  const parseImm = (s) => {
    if (!s) return 0;
    // Handle offset(reg) format
    const m = s.match(/(-?\d+)\(x?(\d+)\)/);
    if (m) return { imm: parseInt(m[1]), base: parseInt(m[2]) };
    return parseInt(s) || 0;
  };

  try {
    switch (op) {
      case "add":
        return { id: index, op, rd: parseReg(parts[1]), rs1: parseReg(parts[2]), rs2: parseReg(parts[3]), imm: 0, type: "R", raw: line.trim() };
      case "sub":
        return { id: index, op, rd: parseReg(parts[1]), rs1: parseReg(parts[2]), rs2: parseReg(parts[3]), imm: 0, type: "R", raw: line.trim() };
      case "and":
        return { id: index, op, rd: parseReg(parts[1]), rs1: parseReg(parts[2]), rs2: parseReg(parts[3]), imm: 0, type: "R", raw: line.trim() };
      case "or":
        return { id: index, op, rd: parseReg(parts[1]), rs1: parseReg(parts[2]), rs2: parseReg(parts[3]), imm: 0, type: "R", raw: line.trim() };
      case "addi": {
        const immVal = parseImm(parts[3]);
        return { id: index, op, rd: parseReg(parts[1]), rs1: parseReg(parts[2]), rs2: -1, imm: typeof immVal === "object" ? immVal.imm : immVal, type: "I", raw: line.trim() };
      }
      case "lw": {
        const memOp = parseImm(parts[2]);
        if (typeof memOp === "object") {
          return { id: index, op, rd: parseReg(parts[1]), rs1: memOp.base, rs2: -1, imm: memOp.imm, type: "L", raw: line.trim() };
        }
        return { id: index, op, rd: parseReg(parts[1]), rs1: parseReg(parts[2]), rs2: -1, imm: 0, type: "L", raw: line.trim() };
      }
      case "sw": {
        const memOp = parseImm(parts[2]);
        if (typeof memOp === "object") {
          return { id: index, op, rd: -1, rs1: memOp.base, rs2: parseReg(parts[1]), imm: memOp.imm, type: "S", raw: line.trim() };
        }
        return { id: index, op, rd: -1, rs1: parseReg(parts[1]), rs2: parseReg(parts[2]), imm: 0, type: "S", raw: line.trim() };
      }
      case "beq":
        return { id: index, op, rd: -1, rs1: parseReg(parts[1]), rs2: parseReg(parts[2]), imm: parseInt(parts[3]) || 0, type: "B", raw: line.trim() };
      default:
        return null;
    }
  } catch (e) {
    return null;
  }
}

export function createInitialPipelineState(instructions) {
  return {
    cycle: 0,
    pc: 0,
    instructions,
    // Pipeline registers: IF/ID, ID/EX, EX/MEM, MEM/WB
    ifid: null,
    idex: null,
    exmem: null,
    memwb: null,
    // Register file x0–x31
    registers: new Array(32).fill(0),
    // Memory: address -> value
    memory: {},
    // Stats
    totalCycles: 0,
    stallCount: 0,
    forwardCount: 0,
    flushCount: 0,
    instructionsCompleted: 0,
    // Active hazards this cycle
    hazards: [],
    forwardingPaths: [],
    // Per-instruction stage tracking for grid visualization
    instructionHistory: {},
    done: false,
  };
}

// Advance the pipeline by one cycle
export function stepPipeline(state) {
  const {
    instructions, pc, ifid, idex, exmem, memwb,
    registers, memory, stallCount, forwardCount, flushCount,
    instructionsCompleted, instructionHistory,
  } = state;

  const regs = [...registers];
  const mem = { ...memory };
  const newHistory = { ...instructionHistory };
  let newStalls = stallCount;
  let newForwards = forwardCount;
  let newFlushes = flushCount;
  let newCompleted = instructionsCompleted;
  const hazards = [];
  const forwardingPaths = [];

  // ── WB Stage ──────────────────────────────────────────────
  if (memwb && !memwb.bubble) {
    const instr = memwb.instr;
    if (instr.rd > 0) {
      regs[instr.rd] = memwb.result;
    }
    newCompleted++;
    if (newHistory[instr.id]) {
      newHistory[instr.id] = [...(newHistory[instr.id] || []), "WB"];
    }
  } else if (memwb?.bubble && newHistory[memwb?.instr?.id]) {
    newHistory[memwb.instr.id] = [...(newHistory[memwb.instr.id] || []), "—"];
  }

  // ── MEM Stage ─────────────────────────────────────────────
  let newMemWB = null;
  if (exmem && !exmem.bubble) {
    const instr = exmem.instr;
    let result = exmem.aluResult;
    if (instr.op === "lw") {
      result = mem[exmem.aluResult] ?? 0;
    } else if (instr.op === "sw") {
      mem[exmem.aluResult] = exmem.rs2Val;
    }
    newMemWB = { instr, result, bubble: false };
    if (!newHistory[instr.id]) newHistory[instr.id] = [];
    newHistory[instr.id] = [...(newHistory[instr.id] || []), "MEM"];
  } else if (exmem) {
    newMemWB = { ...exmem }; // pass bubble
    if (exmem.instr && newHistory[exmem.instr.id]) {
      newHistory[exmem.instr.id] = [...(newHistory[exmem.instr.id] || []), "—"];
    }
  }

  // ── EX Stage with Forwarding ──────────────────────────────
  let newExMEM = null;
  let stall = false;
  let flushIF = false;

  if (idex && !idex.bubble) {
    const instr = idex.instr;
    let rs1Val = idex.rs1Val;
    let rs2Val = idex.rs2Val;

    // LOAD-USE HAZARD: if previous instruction is LW and its rd matches our rs1/rs2
    // we must stall for 1 cycle (cannot forward from MEM stage to EX stage in same cycle)
    if (exmem && !exmem.bubble && exmem.instr.op === "lw") {
      const lwRd = exmem.instr.rd;
      if (lwRd > 0 && (lwRd === instr.rs1 || (instr.rs2 >= 0 && lwRd === instr.rs2))) {
        stall = true;
        hazards.push({ type: "load-use", from: exmem.instr.id, to: instr.id });
      }
    }

    if (!stall) {
      // EX-EX Forwarding: forward from EX/MEM register
      if (exmem && !exmem.bubble && exmem.instr.rd > 0) {
        if (exmem.instr.rd === instr.rs1) {
          rs1Val = exmem.aluResult;
          newForwards++;
          forwardingPaths.push({ from: "EX/MEM", to: "EX", reg: instr.rs1, value: exmem.aluResult });
          hazards.push({ type: "raw-forward", from: exmem.instr.id, to: instr.id });
        }
        if (instr.rs2 >= 0 && exmem.instr.rd === instr.rs2) {
          rs2Val = exmem.aluResult;
          newForwards++;
          forwardingPaths.push({ from: "EX/MEM", to: "EX", reg: instr.rs2, value: exmem.aluResult });
        }
      }

      // MEM-EX Forwarding: forward from MEM/WB register
      if (memwb && !memwb.bubble && memwb.instr.rd > 0) {
        if (memwb.instr.rd === instr.rs1 && !(exmem && !exmem.bubble && exmem.instr.rd === instr.rs1)) {
          rs1Val = memwb.result;
          newForwards++;
          forwardingPaths.push({ from: "MEM/WB", to: "EX", reg: instr.rs1, value: memwb.result });
          hazards.push({ type: "raw-forward", from: memwb.instr.id, to: instr.id });
        }
        if (instr.rs2 >= 0 && memwb.instr.rd === instr.rs2 && !(exmem && !exmem.bubble && exmem.instr.rd === instr.rs2)) {
          rs2Val = memwb.result;
          newForwards++;
          forwardingPaths.push({ from: "MEM/WB", to: "EX", reg: instr.rs2, value: memwb.result });
        }
      }

      // ALU Execute
      let aluResult = 0;
      switch (instr.op) {
        case "add": aluResult = rs1Val + rs2Val; break;
        case "sub": aluResult = rs1Val - rs2Val; break;
        case "and": aluResult = rs1Val & rs2Val; break;
        case "or": aluResult = rs1Val | rs2Val; break;
        case "addi": aluResult = rs1Val + instr.imm; break;
        case "lw": aluResult = rs1Val + instr.imm; break;
        case "sw": aluResult = rs1Val + instr.imm; break;
        case "beq":
          aluResult = rs1Val === rs2Val ? 1 : 0;
          if (rs1Val === rs2Val) {
            flushIF = true;
            newFlushes++;
            hazards.push({ type: "control", from: instr.id });
          }
          break;
      }

      newExMEM = { instr, aluResult, rs2Val, bubble: false };
      if (!newHistory[instr.id]) newHistory[instr.id] = [];
      newHistory[instr.id] = [...(newHistory[instr.id] || []), "EX"];
    }
  } else if (idex) {
    newExMEM = { ...idex, bubble: true }; // pass bubble
  }

  // ── ID Stage ──────────────────────────────────────────────
  let newIDEX = null;
  if (!stall) {
    if (ifid && !ifid.bubble) {
      const instr = ifid.instr;
      const rs1Val = regs[instr.rs1] || 0;
      const rs2Val = instr.rs2 >= 0 ? (regs[instr.rs2] || 0) : 0;
      newIDEX = { instr, rs1Val, rs2Val, bubble: false };
      if (!newHistory[instr.id]) newHistory[instr.id] = [];
      newHistory[instr.id] = [...(newHistory[instr.id] || []), "ID"];
    } else if (ifid) {
      newIDEX = { ...ifid, bubble: true };
    }
  } else {
    // Stall: keep ID/EX as bubble, keep IF/ID unchanged
    newIDEX = { instr: idex?.instr, bubble: true };
    newStalls++;
    if (idex?.instr) {
      if (!newHistory[idex.instr.id]) newHistory[idex.instr.id] = [];
      newHistory[idex.instr.id] = [...(newHistory[idex.instr.id] || []), "stall"];
    }
  }

  // ── IF Stage ──────────────────────────────────────────────
  let newIFID = null;
  let newPc = pc;

  if (!stall) {
    if (flushIF) {
      // Flush: inject bubble (branch taken)
      newIFID = { instr: ifid?.instr, bubble: true };
      newPc = pc; // branch target would be here
      if (ifid?.instr) {
        if (!newHistory[ifid.instr.id]) newHistory[ifid.instr.id] = [];
        newHistory[ifid.instr.id] = [...(newHistory[ifid.instr.id] || []), "flush"];
      }
    } else if (newPc < instructions.length) {
      const instr = instructions[newPc];
      newIFID = { instr, bubble: false };
      newPc = pc + 1;
      if (!newHistory[instr.id]) newHistory[instr.id] = ["IF"];
      else newHistory[instr.id] = [...(newHistory[instr.id] || []), "IF"];
    } else {
      newIFID = null;
    }
  } else {
    // Stall: do not advance PC or IF
    newIFID = ifid;
    newPc = pc;
  }

  const newCycle = state.cycle + 1;
  const isDone =
    !newIFID &&
    !newIDEX &&
    !newExMEM &&
    !newMemWB &&
    newCompleted >= instructions.length;

  return {
    ...state,
    cycle: newCycle,
    pc: newPc,
    ifid: newIFID,
    idex: newIDEX,
    exmem: newExMEM,
    memwb: newMemWB,
    registers: regs,
    memory: mem,
    totalCycles: newCycle,
    stallCount: newStalls,
    forwardCount: newForwards,
    flushCount: newFlushes,
    instructionsCompleted: newCompleted,
    hazards,
    forwardingPaths,
    instructionHistory: newHistory,
    done: isDone,
  };
}