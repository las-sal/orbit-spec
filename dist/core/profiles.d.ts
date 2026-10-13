/**
 * Profile System
 *
 * Defines workflow profiles that control which workflows are installed.
 * Profiles determine WHICH workflows; delivery (in global config) determines HOW.
 */
import type { Profile } from './global-config.js';
/**
 * Core workflows included in the 'core' profile.
 * These provide the streamlined experience for new users.
 */
export declare const CORE_WORKFLOWS: readonly ["propose", "explore", "apply", "archive"];
/**
 * All available workflows in the system.
 */
export declare const ALL_WORKFLOWS: readonly ["propose", "explore", "new", "continue", "apply", "ff", "sync", "archive", "bulk-archive", "verify", "onboard", "review", "address-reviews", "audit-drift", "architect"];
export type WorkflowId = (typeof ALL_WORKFLOWS)[number];
export type CoreWorkflowId = (typeof CORE_WORKFLOWS)[number];
/**
 * Resolves which workflows should be active.
 *
 * orbit (D15): every install gets the full workflow surface, regardless of
 * profile configuration. Partial installs were a recurring source of
 * confusion (the canonical flow itself needs `verify` and `onboard`, which
 * upstream's core profile omits) and serve no orbit use case. The profile
 * machinery is upstream code kept for cherry-pick compatibility; resolution
 * is deliberately inert.
 */
export declare function getProfileWorkflows(_profile: Profile, _customWorkflows?: string[]): readonly string[];
//# sourceMappingURL=profiles.d.ts.map