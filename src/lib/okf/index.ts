/**
 * OKF (Open Knowledge Format) integration — authoring/interchange layer for the
 * agent knowledge base. See OKF_INTEGRATION_PLAN.md.
 *
 * OKF is how knowledge enters/leaves Voxie; RAG stays how the agent uses it;
 * Postgres stays the source of truth. Knowledge concepts only — never PII.
 */
export { serializeFrontmatter, parseFrontmatter } from "./frontmatter";
export type { Frontmatter, FrontmatterValue } from "./frontmatter";
export { contentHash } from "./hash";
export {
  serializeAgentKnowledge,
  serializeBusinessData,
  serializeAgentCard,
} from "./serialize";
export type {
  OkfAgentMeta,
  OkfKnowledgeInput,
  OkfBusinessDataInput,
  OkfAgentCardInput,
} from "./serialize";
export { parseOkfBundle, conceptToKnowledgeItem, conceptToBusinessData } from "./parse";
export type { OkfConcept, KnowledgeItemDraft, BusinessDataDraft } from "./parse";
