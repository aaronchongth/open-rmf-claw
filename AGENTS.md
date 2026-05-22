# Agent Contribution Guidelines (AGENTS.md)

Welcome! This document outlines the operational rules, standards, and guidelines for AI developer agents contributing to this open-source project. Please read and adhere to these guidelines strictly before planning or executing any tasks.

---

## 🚀 Core Contribution Guidelines

To maintain the highest standard of code quality and project health, all contributions must comply with the following rules:

### 1. 🟢 Continuous Integration (CI) Requirements
* **Strict Passing Rule**: Every Pull Request (PR) or proposed commit **must** pass all continuous integration (CI) checks successfully before it can be merged.
* **Pre-flight Checks**: Prior to submitting your work, run the local test suites, linter suites, and type checkers to ensure there are no regressions. Do not submit a PR with failing or skipped tests.

### 2. 📄 Documentation Mandatory Presence
* **README.md Requirement**: Every sub-project, package, or major component within this repository **must** contain a comprehensive `README.md` file at its root.
* **Stale Docs Prevention**: If your changes modify existing functionality or add new features, you must update the corresponding `README.md` to reflect the changes. Stale documentation is unacceptable.

### 3. 🚫 Code Block Restrictions in README.md
* **Code Block Limitation**: Avoid including code blocks in the `README.md` file wherever possible. Prefer clear, concise prose and conceptual explanations to describe how to use the software.
* **Python Exception**: If a code block is absolutely unavoidable to explain a concept, **only Python code blocks are permitted**. No other language code blocks (e.g., Bash, Javascript, Rust, JSON, YAML) are allowed in `README.md`.
* **Formatting**: Any unavoidable Python code blocks must use standard markdown syntax highlighting:
  ```python
  # Example of an unavoidable python code block
  def greet(name: str) -> str:
      return f"Hello, {name}!"
  ```

---

## 🤖 Operational Directives for AI Agents

When you are dispatched to work on this repository, you must structure your behavior according to these practices:

### 🧩 Phase 1: Plan & Discover
1. **Verify Context**: Locate and read the root `README.md` of the target package.
2. **Inspect Active Systems**: Understand existing architecture, test files, and setup instructions.

### 🛠️ Phase 2: Implement & Test
1. **Local Verification**: Run linting and test suites locally before finalizing edits.
2. **CI Simulation**: Ensure all code is correct and would pass remote CI checks seamlessly.

### 📝 Phase 3: Document & Review
1. **Documentation Check**: Ensure `README.md` is present, up-to-date, and adheres strictly to the **No Code Blocks** (or **Python Only**) rule.
2. **Clean & Concise**: Keep your edits clean, preserve existing comments, and don't leave scratch files in version-controlled directories.

