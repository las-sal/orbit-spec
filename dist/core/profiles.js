/**
 * Profile System
 *
 * Defines workflow profiles that control which workflows are installed.
 * Profiles determine WHICH workflows; delivery (in global config) determines HOW.
 */
/**
 * Core workflows included in the 'core' profile.
 * These provide the streamlined experience for new users.
 */
export const CORE_WORKFLOWS = ['propose', 'explore', 'apply', 'archive'];
/**
 * All available workflows in the system.
 */
export const ALL_WORKFLOWS = [
    'propose',
    'explore',
    'new',
    'continue',
    'apply',
    'ff',
    'sync',
    'archive',
    'bulk-archive',
    'verify',
    'onboard',
    'review',
    'address-reviews',
    'audit-drift',
    'architect',
];
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
export function getProfileWorkflows(_profile, _customWorkflows) {
    return ALL_WORKFLOWS;
}
//# sourceMappingURL=profiles.js.map