import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export const STRATEGIC_QUESTIONNAIRE_SCHEMA = JSON.parse(
  readFileSync(new URL('./schema-questionario-estrategico-complementar.json', import.meta.url), 'utf8')
);

const STRING_FIELDS = [
  'goal_for_next_12_months',
  'target_market_logic',
  'evidence_of_results',
  'language_level_detail',
  'reference_opportunity'
];

const BOOLEAN_FIELDS = [
  'has_meaningful_tradeoffs',
  'high_ambiguity_case',
  'story_inconsistent',
  'language_structural_block'
];

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function getAllowedPropertySet() {
  return new Set(Object.keys(STRATEGIC_QUESTIONNAIRE_SCHEMA.properties || {}));
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : value;
}

export function normalizeStrategicQuestionnaire(questionnaire) {
  if (!isPlainObject(questionnaire)) return questionnaire;
  const normalized = { ...questionnaire };

  for (const field of STRING_FIELDS) {
    normalized[field] = normalizeString(normalized[field]);
  }

  normalized.target_role_hypotheses = Array.isArray(normalized.target_role_hypotheses)
    ? normalized.target_role_hypotheses.map(normalizeString).filter(Boolean)
    : normalized.target_role_hypotheses;

  return normalized;
}

export function validateStrategicQuestionnaireContract(questionnaire) {
  const schema = STRATEGIC_QUESTIONNAIRE_SCHEMA;
  const errors = [];

  if (!isPlainObject(questionnaire)) {
    return { ok: false, errors: ['questionnaire must be a plain object'] };
  }

  const normalized = normalizeStrategicQuestionnaire(questionnaire);
  const allowedProperties = getAllowedPropertySet();

  for (const key of Object.keys(normalized)) {
    if (!allowedProperties.has(key)) {
      errors.push(`unexpected property: ${key}`);
    }
  }

  for (const key of schema.required || []) {
    if (!(key in normalized)) {
      errors.push(`missing required field: ${key}`);
    }
  }

  for (const field of STRING_FIELDS) {
    const value = normalized[field];
    const rules = schema.properties[field];
    if (typeof value !== 'string') {
      errors.push(`${field} must be a string`);
      continue;
    }
    if (value.length < rules.minLength) {
      errors.push(`${field} must have at least ${rules.minLength} characters`);
    }
    if (value.length > rules.maxLength) {
      errors.push(`${field} must have at most ${rules.maxLength} characters`);
    }
  }

  const availabilityRules = schema.properties.availability_for_execution;
  if (!availabilityRules.enum.includes(normalized.availability_for_execution)) {
    errors.push(
      `availability_for_execution must be one of: ${availabilityRules.enum.join(', ')}`
    );
  }

  const urgencyRules = schema.properties.urgency_window;
  if (!urgencyRules.enum.includes(normalized.urgency_window)) {
    errors.push(`urgency_window must be one of: ${urgencyRules.enum.join(', ')}`);
  }

  const roles = normalized.target_role_hypotheses;
  const roleRules = schema.properties.target_role_hypotheses;
  if (!Array.isArray(roles)) {
    errors.push('target_role_hypotheses must be an array');
  } else {
    if (roles.length < roleRules.minItems) {
      errors.push(`target_role_hypotheses must have at least ${roleRules.minItems} item(s)`);
    }
    if (roles.length > roleRules.maxItems) {
      errors.push(`target_role_hypotheses must have at most ${roleRules.maxItems} item(s)`);
    }
    roles.forEach((role, index) => {
      if (typeof role !== 'string') {
        errors.push(`target_role_hypotheses[${index}] must be a string`);
        return;
      }
      if (role.length < roleRules.items.minLength) {
        errors.push(
          `target_role_hypotheses[${index}] must have at least ${roleRules.items.minLength} characters`
        );
      }
      if (role.length > roleRules.items.maxLength) {
        errors.push(
          `target_role_hypotheses[${index}] must have at most ${roleRules.items.maxLength} characters`
        );
      }
    });
  }

  for (const field of BOOLEAN_FIELDS) {
    if (typeof normalized[field] !== 'boolean') {
      errors.push(`${field} must be a boolean`);
    }
  }

  return { ok: errors.length === 0, errors, normalized };
}

export function assertStrategicQuestionnaireContract(questionnaire) {
  const result = validateStrategicQuestionnaireContract(questionnaire);
  assert.equal(
    result.ok,
    true,
    `invalid strategic questionnaire contract: ${result.errors.join('; ')}`
  );
  return result.normalized;
}
