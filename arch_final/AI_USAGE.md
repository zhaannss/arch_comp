# AI Usage Documentation

## Project: RISC-V 5-Stage Pipeline Simulator

This document details the utilization of AI assistants throughout the development of the RISC-V 5-Stage Pipeline Simulator, demonstrating compliance with the course requirement regarding the mandatory use of AI tools.

---

## Executive Summary

The development process leveraged two primary AI tools to accelerate development, ensure code quality, and maintain comprehensive documentation:

1. **Claude (Anthropic)**: Primary development assistant for architectural planning, component generation, and documentation drafting.
2. **GitHub Copilot**: Real-time coding assistant for autocomplete, syntax verification, and localized problem-solving.

**Division of Responsibilities:**
- **Development Team (Human)**: Provided strategic direction, verified requirements, conducted rigorous code review and testing, defined problems, and made all final implementation decisions.
- **AI Assistants**: Analyzed requirements, generated boilerplate and logic implementations, identified potential bugs, and drafted documentation based on human-provided specifications.

---

## Tool 1: Claude

### Purpose
Claude served as the primary assistant for understanding high-level project requirements and implementing core features.

### Key Implementation Tasks

#### 1. Requirements Analysis
**Task**: Analyze the provided course specification to identify missing components in the initial project structure.
**Process**: The project requirements were provided to Claude, which cross-referenced them with the existing codebase.
**Result**: Generated a comprehensive checklist identifying missing features, notably the IPC metric and pipeline register visualization, raising compliance to 100%.

#### 2. IPC Metrics Implementation
**Task**: Implement the Instructions Per Cycle (IPC) metric within the performance dashboard.
**Process**: Prompted Claude to calculate IPC as the inverse of CPI (`instructionsCompleted / totalCycles`) and format it to 3 decimal places.
**Result**: Successfully generated the calculation logic and integrated it into the metrics panel.

#### 3. Pipeline Registers Visualization
**Task**: Develop a detailed visualization of the pipeline register states (IF/ID, ID/EX, EX/MEM, MEM/WB).
**Process**: Instructed Claude to create a React component (`PipelineRegistersDetail`) utilizing a 4-column grid layout, displaying specific data points for each register stage.
**Result**: Produced a functional, color-coded UI component that accurately reflects the real-time state of the pipeline registers.

#### 4. Documentation Generation
**Task**: Draft comprehensive project documentation (`README.md`).
**Process**: Provided an outline of required sections (Overview, Quick Start, Metrics Explanation, Supported Instructions, Educational Scenarios, Architecture).
**Result**: Generated a structured, professional-grade markdown document. The development team subsequently reviewed, verified, and refined the content for accuracy and formatting.

---

## Tool 2: GitHub Copilot

### Purpose
GitHub Copilot functioned as an integrated, real-time assistant for localized code generation and error correction.

### Key Usage Scenarios

#### 1. Layout Adjustments
When expanding the metrics grid from 6 to 7 columns to accommodate the new IPC metric, Copilot accurately suggested the updated CSS grid property (`gridTemplateColumns: "repeat(7, 1fr)"`).

#### 2. Pattern Recognition
While implementing the IPC state updates, Copilot recognized the existing pattern used for CPI and automatically suggested the corresponding, structurally identical logic for IPC.

#### 3. Error Detection
Copilot assisted in identifying unresolved component imports (e.g., flagging the `PipelineRegistersDetail` component before it was properly imported/defined) and suggested immediate fixes.

#### 4. Styling Consistency
When adding new UI elements, Copilot suggested hex codes that perfectly matched the existing dark theme palette, ensuring visual consistency without requiring manual color lookups.

---

## AI Contribution Metrics

| Component | AI Contribution Level | Human Verification |
|-----------|-----------------------|--------------------|
| IPC Calculation | High (Logic generated) | Verified |
| PipelineRegisters Component | High (Structure generated) | Reviewed and Refined |
| Metrics Grid Update | High (Real-time suggestion) | Verified |
| README Documentation | High (Draft generated) | Reviewed and Edited |
| General Bug Fixes | Medium (Suggestions provided)| Validated and Tested |

---

## Collaborative Workflow

The development process followed a structured human-AI collaboration model:

1. **Analysis**: The human team defined the requirements and provided them to the AI for initial analysis and checklist generation.
2. **Implementation**: The human team specified individual tasks. Claude generated the core logic, while Copilot assisted with syntax and real-time completion.
3. **Verification**: The human team rigorously tested the generated code, diagnosed any resulting bugs, and collaborated with the AI tools to refine the solutions.
4. **Documentation**: The AI drafted documentation based on the implemented features, which the human team then reviewed and finalized.

---

## Best Practices and Insights

The integration of AI tools yielded several key insights regarding effective software development workflows:

- **Prototyping**: AI significantly accelerated the initial prototyping phase and the creation of boilerplate code.
- **Verification is Critical**: While AI-generated code is often syntactically correct, human verification is essential to ensure logical accuracy, especially regarding specific mathematical formulas (e.g., CPI/IPC calculations) and architectural constraints.
- **Iterative Refinement**: The most effective results were achieved through an iterative process of prompting, generating, testing, and refining.

## Conclusion

The RISC-V 5-Stage Pipeline Simulator project successfully demonstrates a highly effective human-AI collaborative workflow. By leveraging AI for code generation and documentation drafting, the development team was able to focus on high-level architectural decisions, rigorous testing, and ensuring the educational value of the final product. The project fully satisfies all course requirements.
