import assert from 'node:assert/strict';

const STATUS = new Set(['Lite', 'Completo', 'Recusa', 'Faltam dados']);
const OFFERS = new Set(['Lite', 'Completo', null]);
const PAYMENT = new Set(['allowed', 'blocked', 'pending_complement']);
const NEXT_STEP = new Set([
  'offer_lite',
  'offer_completo',
  'request_complement',
  'route_to_basic'
]);
const MESSAGE_KEY = new Set([
  'offer_lite',
  'offer_completo',
  'request_complement',
  'route_to_basic'
]);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function assertRuleItem(item) {
  assert.equal(typeof item, 'object');
  assert.ok(isNonEmptyString(item.code));
  assert.ok(isNonEmptyString(item.message));
  assert.ok(isNonEmptyString(item.source));
}

export function assertDecisionContract(payload) {
  assert.equal(typeof payload, 'object');

  assert.ok(isNonEmptyString(payload.decision_meta?.decision_id));
  assert.ok(isNonEmptyString(payload.decision_meta?.generated_at));
  assert.ok(isNonEmptyString(payload.decision_meta?.engine_version));
  assert.equal(payload.decision_meta?.schema_version, 'v1');

  assert.ok(isNonEmptyString(payload.input_snapshot?.lead_id));
  assert.ok(['Alemanha', 'Australia'].includes(payload.input_snapshot?.source_route));
  assert.ok(['Explorador', 'Em Rota', 'Pronto para Embarcar', 'Elite'].includes(payload.input_snapshot?.cia_band_public));
  assert.equal(typeof payload.input_snapshot?.cia_score, 'number');
  assert.equal(typeof payload.input_snapshot?.has_cv, 'boolean');
  assert.equal(typeof payload.input_snapshot?.has_strategic_questionnaire, 'boolean');

  assert.ok(STATUS.has(payload.decision?.status));
  assert.ok(OFFERS.has(payload.decision?.recommended_offer ?? null));
  assert.ok(PAYMENT.has(payload.decision?.payment_eligibility));
  assert.equal(typeof payload.decision?.requires_human_review, 'boolean');
  assert.ok(isNonEmptyString(payload.decision?.decision_summary));
  assert.ok(NEXT_STEP.has(payload.decision?.next_step));

  assert.ok(Array.isArray(payload.lists?.required));
  assert.ok(Array.isArray(payload.lists?.warning));
  assert.ok(Array.isArray(payload.lists?.blocking));
  payload.lists.required.forEach(assertRuleItem);
  payload.lists.warning.forEach(assertRuleItem);
  payload.lists.blocking.forEach(assertRuleItem);

  assert.equal(typeof payload.commercial?.can_show_payment, 'boolean');
  assert.equal(payload.commercial?.can_choose_offer_freely, false);
  assert.ok(MESSAGE_KEY.has(payload.commercial?.commercial_message_key));

  assert.ok(
    payload.generation?.output_template === null ||
      isNonEmptyString(payload.generation?.output_template)
  );
  assert.ok(
    payload.generation?.intake_schema === null ||
      isNonEmptyString(payload.generation?.intake_schema)
  );
  assert.ok(['none', 'request_complement_once'].includes(payload.generation?.questionnaire_action));

  assert.ok(Array.isArray(payload.audit?.decision_reasons));
  assert.ok(Array.isArray(payload.audit?.critical_facts));
  assert.ok(Array.isArray(payload.audit?.policy_flags));
}
