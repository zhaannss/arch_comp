# RISC-V 5-Stage Pipeline Simulator

A comprehensive educational simulator designed to demonstrate how RISC-V processors execute instructions through a classic 5-stage pipeline architecture. The simulator includes real-time visualization of hazard detection, data forwarding, and pipeline flushes.

## Overview

This project implements an interactive 5-stage pipeline simulator for the RISC-V Instruction Set Architecture (ISA). It provides a visual representation of instruction flow through a processor's pipeline, specifically demonstrating:

- **Pipeline Stages**: IF (Instruction Fetch) → ID (Instruction Decode) → EX (Execute) → MEM (Memory Access) → WB (Write Back)
- **Hazard Detection**: Automatic identification of RAW (Read-After-Write), control, and load-use hazards.
- **Data Forwarding**: Real-time visualization of forwarding paths utilized to prevent unnecessary pipeline stalls.
- **Performance Metrics**: Tracking and calculation of CPI (Cycles Per Instruction), IPC (Instructions Per Cycle), and comprehensive hazard statistics.

## Features

### Interactive Simulation
- **Step-by-Step Execution**: Cycle-by-cycle granular control over execution.
- **Auto-Run Mode**: Continuous execution with an adjustable speed setting (100-2000ms per cycle).
- **Live Pipeline Visualization**: Real-time display of instructions progressing through the pipeline stages.
- **Pipeline Registers Detail**: Granular view of the data held within the pipeline registers (IF/ID, ID/EX, EX/MEM, MEM/WB).
- **State Inspection**: Live tracking and highlighting of changes within the Register File and Data Memory.

### Hazard Analysis
- **RAW Hazard Detection**: Automatic resolution via data forwarding.
- **Load-Use Hazard**: Accurate simulation of forced pipeline stall cycles.
- **Control Hazard**: Visualization of pipeline flushes resulting from branch instructions.
- **Data Forwarding Paths**: Indication of active EX→EX and MEM→EX data forwarding.

### Performance Metrics
- **Total Cycles**: The complete number of clock cycles elapsed.
- **Instructions Completed**: The total number of instructions successfully committed.
- **CPI (Cycles Per Instruction)**: The average number of clock cycles required per instruction.
- **IPC (Instructions Per Cycle)**: The average number of instructions completed per clock cycle (throughput).
- **Stall Count**: The number of cycles lost specifically to load-use hazards.
- **Forward Count**: The number of potential hazards successfully resolved via data forwarding.
- **Flush Count**: The number of instructions flushed from the pipeline due to branch mispredictions.

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation & Execution

```bash
# Navigate to the project directory
cd arch_final

# Install dependencies
npm install

# Start the development server
npm run dev
```

The simulator will be accessible at `http://localhost:5173`.

## Usage Instructions

### 1. Load RISC-V Code
   - Enter RISC-V assembly code into the left-hand editor panel.
   - Alternatively, load one of the provided pre-configured sample programs.
   - **Supported Instructions**: `add`, `sub`, `and`, `or`, `addi`, `lw`, `sw`, `beq`.

### 2. Control Execution
   - Click **Run** to execute the program continuously.
   - Click **Step** to manually advance the simulation by a single clock cycle.
   - Adjust the **Speed** slider to control the auto-run execution rate.
   - Click **Reset** to clear the pipeline and restart the simulation.

### 3. Monitor State
   - **Pipeline Diagram**: Observe the current instruction occupying each pipeline stage.
   - **Pipeline Registers Detail**: Inspect the precise data values held in the inter-stage registers.
   - **Execution Timeline**: Review the complete instruction trace across all cycles.
   - **Register File**: Monitor the state of all 32 architectural registers (x0-x31).
   - **Memory**: Track read and write operations to the data memory.

### 4. Analyze Pipeline Behavior
   - Monitor the interface for specific hazard indicators (Control Hazards, Load-Use Stalls, RAW Forwarding).
   - Correlate these visual indicators with the real-time performance metrics (CPI, IPC).

## Educational Scenarios

The simulator includes pre-loaded scenarios designed to demonstrate specific architectural concepts:

1. **RAW Hazard Demo**: Demonstrates basic register dependency hazards and their resolution via data forwarding without incurring stalls.
2. **Load-Use Hazard**: Illustrates a scenario where data forwarding is insufficient, resulting in a mandatory pipeline stall due to memory access latency.
3. **Branch & Flush**: Demonstrates the impact of control flow changes, specifically how a taken branch necessitates flushing speculative instructions from the fetch and decode stages.

## Architecture & Implementation

### Core Components

- **Instruction Parser** (`parseInstruction`): Converts raw RISC-V assembly into an internal object representation, extracting opcodes, operands, and register dependencies.
- **Pipeline Engine** (`stepPipeline`): The core state machine simulating one clock cycle. It manages the propagation of instructions between pipeline stages and coordinates the registers.
- **Hazard Detection Unit**: Evaluates register dependencies across stages to detect RAW hazards, identifies load-use conditions, and monitors branch execution.
- **Forwarding Unit**: Implements EX→EX and MEM→EX data forwarding logic to bypass the register file and provide data directly to the ALU inputs.

### Performance Interpretation

- **CPI (Cycles Per Instruction)**: A fundamental metric of pipeline efficiency. An ideal pipeline approaches a CPI of 1.0. Realistic values range higher (e.g., 1.2 - 1.5) due to unavoidable stalls and flushes.
  - `CPI = Total Cycles / Instructions Completed`
- **IPC (Instructions Per Cycle)**: The inverse of CPI, representing overall throughput.
  - `IPC = Instructions Completed / Total Cycles`
- **Stalls & Flushes**: Every stall or flush cycle inherently increases the CPI, demonstrating the performance cost of hazards.

## Development

### Project Structure
```text
arch_final/
├── src/
│   ├── App.jsx           # Main component and simulator engine
│   ├── App.css           # Application styling
│   └── main.jsx          # Application entry point
├── public/               # Static assets
├── package.json          # Dependency configuration
└── vite.config.js        # Vite build configuration
```

### Building for Production
```bash
npm run build
npm run preview
```

## References
- Patterson, D. A., & Hennessy, J. L. *Computer Organization and Design RISC-V Edition*.
- RISC-V Instruction Set Manual.
