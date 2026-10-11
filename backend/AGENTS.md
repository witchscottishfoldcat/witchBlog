Codex Development Guidelines
This document defines how Codex should generate, modify, refactor, and review code in this repository. Existing project conventions take priority. When the project has no clear local convention, follow this document.

Quality Gate Convention (canonical mapping)
This project follows the witchcat quality-gate canonical G-item semantics. The authoritative command list lives in quality-gate.config.json (repo-committed, review-controlled):

- G0 risk self-assessment: per-task JSON (all 12 risk dimensions) at docs/gates/<task>/artifacts/risk-assessment.json
- G1 static column: scripts/static_checks.py = compileall + black --check + isort --check + flake8 + mypy ratchet (scope: app/, tests/, main.py)
- G2 unit/integration tests: fast subset with --junitxml=docs/gates/latest/pytest.xml (JUnit XML is the canonical evidence)
- G3 coverage non-regression: scripts/coverage_gate.py, evidence JSON at docs/gates/latest/coverage-gate.json, baseline ratchets via scripts/coverage_baseline.txt (--update only upward)
- G4-G9: recorded per task as N-A/PARTIAL per canonical conditions (no requirements brief => G4 N-A; no user-facing flow change => G5 N-A; no schema change => G6 N-A; Windows-dev + Linux-docker deploy => G7 PARTIAL with gap until CI reports; no SLO => G8 N-A; no security-relevant risk hit => G9 N-A)
- G10_REVIEW / G11_ROLLBACK / G12_USER_AUTH: forced by risk hits per task-levels matrix
Project-specific extras beyond canonical: G2_FULL (scripts/tests_gate.py, full-suite double ratchet: passed count may not drop, failure count may not grow; baseline scripts/tests_baseline.txt) and the mypy ratchet inside G1 (scripts/mypy_baseline.txt, currently 0). docs/gates/latest/ is a mutable scratch area for machine evidence; per-task dirs under docs/gates/ are immutable archives once terminal. Run the machine verdict with: python <witchcat-skills>/testing/quality-gate/scripts/evaluate_gate.py docs/gates/<task>/quality-gate.json --run

Core Principles
Prefer clear, maintainable, and testable code.
Avoid implicit behavior. Important business rules must be explicitly named.
Design code to be easy to extend and localized to change.
Keep modules loosely coupled and highly cohesive.
Keep every change focused on the requested task.
Do not introduce unexplained magic values.
Do not create god functions, god classes, or all-purpose modules.
Keep cyclomatic complexity low. Prefer decomposition, guard clauses, strategy dispatch, and data-driven mappings over deeply nested branches.
Enums And Constants
Finite business sets such as statuses, types, modes, sources, roles, permissions, event names, error codes, and workflow stages must be represented with enums or named constants whenever possible.
Do not scatter string or number literals through business logic when they carry business meaning.
Constant names must describe the business meaning, not merely repeat the literal value.
Define enums in a clear boundary such as constants, enums, types, or the relevant domain module.
Each enum's additions, deprecations, and mappings should have one authoritative maintenance location.
When enum values need labels, colors, sorting, permissions, or behavior, use configuration maps instead of repeated if/else logic.
Do not over-abstract only for the sake of using enums. Extract them when there is reuse, business meaning, or likely change.
Example:

export enum OrderStatus {
  Pending = "pending",
  Paid = "paid",
  Cancelled = "cancelled",
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  [OrderStatus.Pending]: "Pending payment",
  [OrderStatus.Paid]: "Paid",
  [OrderStatus.Cancelled]: "Cancelled",
};
No Magic Values
Do not place business-significant numbers, strings, boolean combinations, or regular expressions directly inside logic.
Timeouts, retry counts, page sizes, length limits, amount thresholds, status codes, path segments, cache keys, and event names must be named.
Put constants as close as possible to their usage while keeping reuse practical.
Global constants should only contain concepts that are genuinely shared across modules.
Prefer configuration files, environment variables, or injected domain configuration objects over hard-coded values.
Separate external protocol values from internal business semantics with a mapping or adapter layer when needed.
Example:

const DEFAULT_PAGE_SIZE = 20;
const REQUEST_TIMEOUT_MS = 10_000;

fetchOrders({ pageSize: DEFAULT_PAGE_SIZE, timeout: REQUEST_TIMEOUT_MS });
Function Design
A function should do one thing, and its name should clearly describe that thing.
Keep function parameters to three or fewer when practical. Use a named options object for larger parameter sets.
Keep functions concise. If a function requires scrolling through multiple screens, split it.
Avoid functions that combine validation, querying, calculation, transformation, persistence, logging, and notification.
Split complex workflows into explicit stages, each with its own function.
Prefer pure functions for calculation and transformation logic so they are easy to test.
Concentrate side effects at boundaries such as APIs, databases, file systems, message queues, and UI event handlers.
Do not drive core business logic through implicit global state.
No God Functions Or God Classes
Do not write a single function that runs an entire business process while also containing many branches.
Do not write a single class that handles modeling, validation, orchestration, persistence, rendering, authorization, and logging.
Orchestration layers should coordinate flow, not contain most of the business details.
Domain logic should live in domain services, strategy objects, pure functions, or dedicated modules.
Data access must be decoupled from business rules.
UI components should be decoupled from business calculations, API details, and state mappings.
If a module is frequently changed for many unrelated reasons, split its responsibilities.
Cyclomatic Complexity
Prefer guard clauses to reduce nesting.
If logic exceeds two levels of nesting, consider extracting functions or reversing the condition.
For multi-state behavior, prefer enum maps, strategy tables, or polymorphic dispatch.
Avoid long if/else if/else chains and large switch statements.
Avoid deeply nested conditions inside loops.
Handle exceptional cases early so the main path stays readable.
Keep a single function's cyclomatic complexity under 10 whenever practical. If it exceeds that, there must be a clear reason or a decomposition plan.
Example:

const HANDLERS: Record<OrderStatus, () => void> = {
  [OrderStatus.Pending]: handlePendingOrder,
  [OrderStatus.Paid]: handlePaidOrder,
  [OrderStatus.Cancelled]: handleCancelledOrder,
};

HANDLERS[order.status]();
Extensibility
Identify stable points and variation points before choosing abstraction boundaries.
For logic that is likely to add new types, channels, strategies, or rules, prefer configuration maps, strategy patterns, or plugin-style registration.
Isolate external dependencies behind interfaces or adapter layers.
Adding a capability should usually mean adding a module or strategy, not modifying many existing branches.
Abstractions must serve real variation. Do not over-engineer for speculative scenarios.
Shared capabilities must have clear inputs, outputs, and error boundaries.
Domain layers must not directly depend on specific frameworks, UI implementations, HTTP clients, or database implementations.
Decoupling
Separate business logic from presentation logic.
Separate business logic from storage implementations.
Separate business logic from third-party SDKs.
Separate data transformation from business validation.
Separate configuration loading from configuration usage.
Separate state management from side-effect execution.
Higher-level modules should depend on abstractions; lower-level modules should provide implementations.
Avoid circular dependencies. If one appears, adjust the module boundary.
Error Handling
Clearly distinguish business errors, parameter errors, authorization errors, external dependency errors, and system errors.
Do not swallow exceptions unless there is an explicit fallback strategy.
When catching errors, preserve enough context for debugging.
Separate user-facing errors from internal technical details.
Retries, fallbacks, and default behavior must have explicit boundaries and named configuration values.
Testing
Prioritize unit tests for pure functions, strategy dispatch, state transitions, permission checks, amount calculations, and time calculations.
When fixing a bug, add a test that reproduces the bug.
Multi-branch logic should cover main branches, exceptional branches, and boundary values.
Use mocks, stubs, or test adapters for external dependencies. Do not call real external services from unit tests.
Test names should describe the business scenario and expected result.
Refactoring
Understand the existing module responsibilities and call chain before refactoring.
Each refactor should solve a specific problem. Do not mix unrelated formatting or style changes into it.
Add tests or confirm existing coverage before high-risk refactoring.
Preserve external behavior when extracting functions.
Preserve public interfaces when splitting modules. Add a compatibility layer when needed.
Before deleting code, confirm there are no callers, configuration references, documentation references, or runtime reflection dependencies.
Review Checklist
Before submitting or finishing a change, check:

Are there business values that should be enums or named constants?
Are there unnamed magic values?
Are any functions too long or mixing responsibilities?
Are there god classes, god modules, or overly centralized workflows?
Is there excessive nesting or high cyclomatic complexity?
Could repeated branches be replaced with configuration maps, strategy tables, or polymorphism?
Is business logic coupled to UI, storage, network, or SDK details?
Are error boundaries and exception contexts clear?
Were necessary tests added or updated?
Is the change scope aligned with the requested task?
Codex Behavior Requirements
Read relevant context before changing code. Do not edit based on guesses.
Prefer the project's existing architecture, naming, toolchain, and test style.
When design issues are found, propose small, actionable improvements first.
Do not introduce large frameworks or complex patterns without a real requirement.
Do not hard-code business rules inside components, controllers, or entry-point functions.
Do not expand duplicated logic through copy and paste.
When requirements are unclear, make a conservative implementation based on context. Ask for confirmation only when the risk is high.
After finishing, report what changed, how it was verified, and any remaining risk.