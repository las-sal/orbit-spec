/**
 * Agent Skill Templates
 *
 * Compatibility facade that re-exports split workflow template modules.
 */
export { getExploreSkillTemplate, getOrbitExploreCommandTemplate } from './workflows/explore.js';
export { getNewChangeSkillTemplate, getOrbitNewCommandTemplate } from './workflows/new-change.js';
export { getContinueChangeSkillTemplate, getOrbitContinueCommandTemplate } from './workflows/continue-change.js';
export { getApplyChangeSkillTemplate, getOrbitApplyCommandTemplate } from './workflows/apply-change.js';
export { getFfChangeSkillTemplate, getOrbitFfCommandTemplate } from './workflows/ff-change.js';
export { getSyncSpecsSkillTemplate, getOrbitSyncCommandTemplate } from './workflows/sync-specs.js';
export { getArchiveChangeSkillTemplate, getOrbitArchiveCommandTemplate } from './workflows/archive-change.js';
export { getBulkArchiveChangeSkillTemplate, getOrbitBulkArchiveCommandTemplate } from './workflows/bulk-archive-change.js';
export { getVerifyChangeSkillTemplate, getOrbitVerifyCommandTemplate } from './workflows/verify-change.js';
export { getOnboardSkillTemplate, getOrbitOnboardCommandTemplate } from './workflows/onboard.js';
export { getOrbitProposeSkillTemplate, getOrbitProposeCommandTemplate } from './workflows/propose.js';
export { getReviewSkillTemplate, getOrbitReviewCommandTemplate } from './workflows/review.js';
export { getAddressReviewsSkillTemplate, getOrbitAddressReviewsCommandTemplate } from './workflows/address-reviews.js';
export { getAuditDriftSkillTemplate, getOrbitAuditDriftCommandTemplate } from './workflows/audit-drift.js';
export { getArchitectSkillTemplate, getOrbitArchitectCommandTemplate } from './workflows/architect.js';
export { getFeedbackSkillTemplate } from './workflows/feedback.js';
//# sourceMappingURL=skill-templates.js.map