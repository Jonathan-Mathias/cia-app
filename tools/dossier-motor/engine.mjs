import crypto from 'node:crypto';
import { assertStrategicQuestionnaireContract } from './questionnaire-contract.mjs';

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix = 'decision') {
  return `${prefix}_${crypto.randomUUID()}`;
}

function pushRule(list, code, message, source) {
  list.push({ code, message, source });
}

function hasText(value, min = 1) {
  return typeof value === 'string' && value.trim().length >= min;
}

function isWeakStrategicAnswer(value) {
  if (!hasText(value, 12)) return true;
  const normalized = value.trim().toLowerCase();
  return [
    'muito cedo',
    'ainda estou vendo',
    'ainda estou avaliando',
    'ainda nao sei',
    'ainda não sei',
    'qualquer mercado serve',
    'qualquer vaga serve'
  ].includes(normalized);
}

function isLowAvailability(value) {
  if (!hasText(value)) return false;
  const normalized = value.trim().toLowerCase();
  return ['baixa', 'muito baixa', 'low', 'very_low'].includes(normalized);
}

function isUnrealisticTimeline(value) {
  if (!hasText(value)) return false;
  const normalized = value.trim().toLowerCase();
  return ['0-3 meses', '0-3 months', 'urgent_without_base'].includes(normalized);
}

function splitEvidencePoints(value) {
  return String(value || '')
    .split(/[\n;]+|(?<=\.)\s+/)
    .map(item => item.trim())
    .filter(Boolean);
}

function countDefendableEvidence(value) {
  return splitEvidencePoints(value).filter(item => item.length >= 18).length;
}

function hasConcreteProofSignal(value) {
  if (!hasText(value, 8)) return false;
  const normalized = value.trim().toLowerCase();
  return /(\d|%|r\$|usd|eur|\$|k\b|m\b|mil|milh)/.test(normalized) ||
    /(reduz|reduc|aument|grow|grew|improv|saved|econom|revenue|custo|tempo|prazo|throughput|conversion)/.test(normalized);
}

function hasPremiumMarketAsset(materials = {}) {
  return !!(materials.linkedin || materials.portfolio || materials.github);
}

function hasSpecificRoleHypothesis(value) {
  return Array.isArray(value) && value.some(item => hasText(item, 4));
}

function normalizeDecisionText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function hasReferenceOpportunity(value) {
  if (!hasText(value, 6)) return false;
  const normalized = normalizeDecisionText(value);
  return !/(nenhuma|nenhum|nao tenho|nao mapeei|ainda nao|ainda nao tenho|sem vaga)/.test(normalized);
}

function countAlternativeMarkets(value) {
  const normalized = normalizeDecisionText(value);
  if (!normalized) return 0;
  const markets = [
    'alemanha',
    'australia',
    'canada',
    'estados unidos',
    'eua',
    'reino unido',
    'uk',
    'irlanda',
    'holanda',
    'portugal'
  ];
  return markets.filter(market => normalized.includes(market)).length;
}

function detectReferenceMarketTension(referenceValue, route) {
  const normalized = normalizeDecisionText(referenceValue);
  if (!normalized) return false;
  const isGermanyRoute = normalizeDecisionText(route).includes('alemanha');
  const routeTerms = isGermanyRoute ? ['alemanha', 'germany', 'berlin', 'munich', 'munique'] : ['australia', 'australia', 'sydney', 'melbourne', 'brisbane', 'perth'];
  const foreignTerms = isGermanyRoute
    ? ['australia', 'sydney', 'melbourne', 'brisbane', 'perth', 'uk', 'reino unido', 'canada', 'estados unidos', 'eua']
    : ['alemanha', 'germany', 'berlin', 'munich', 'munique', 'uk', 'reino unido', 'canada', 'estados unidos', 'eua'];
  const mentionsRoute = routeTerms.some(term => normalized.includes(term));
  const mentionsForeign = foreignTerms.some(term => normalized.includes(term));
  return mentionsForeign && !mentionsRoute;
}

function scoreTierAxes({ route, questionnaire, profile, materials }) {
  const seniority = profile?.seniority_level || '';
  const roles = Array.isArray(questionnaire?.target_role_hypotheses) ? questionnaire.target_role_hypotheses.filter(Boolean) : [];
  const evidence = questionnaire?.evidence_of_results || '';
  const marketLogic = questionnaire?.target_market_logic || '';
  const reference = questionnaire?.reference_opportunity || '';
  const hasConcreteProof = hasConcreteProofSignal(evidence);
  const hasMarketAsset = hasPremiumMarketAsset(materials);
  const referenceMapped = hasReferenceOpportunity(reference);
  const alternativeMarkets = countAlternativeMarkets(marketLogic);
  const referenceTension = detectReferenceMarketTension(reference, route);
  const tradeoff = questionnaire?.has_meaningful_tradeoffs === true;
  const highAmbiguity = questionnaire?.high_ambiguity_case === true;
  const storyInconsistent = questionnaire?.story_inconsistent === true;

  let density = 0;
  const densityReasons = [];
  if (['Senior', 'Especialista'].includes(seniority)) {
    density = 1;
    densityReasons.push('senioridade consolidada');
  }
  if (['Lideranca', 'Executivo'].includes(seniority) || ((['Senior', 'Especialista'].includes(seniority)) && hasConcreteProof)) {
    density = 2;
    densityReasons.push('trajetoria senior com responsabilidade defendivel');
  }
  if (!densityReasons.length && roles.length) densityReasons.push('senioridade ainda sem prova suficiente para leitura premium');

  let proof = 0;
  const proofReasons = [];
  if (hasConcreteProof || referenceMapped || hasMarketAsset) {
    proof = 1;
    proofReasons.push('ja existe alguma prova ou ativo de mercado');
  }
  if (hasConcreteProof && referenceMapped) {
    proof = 2;
    proofReasons.push('resultado concreto combinado com vaga de referencia mapeada');
  }
  if (proof === 2 && hasMarketAsset) proofReasons.push('ativo adicional de mercado reforca a prova');
  if (!proofReasons.length) proofReasons.push('prova ainda depende mais de intencao do que de evidencia');

  let complexity = 0;
  const complexityReasons = [];
  if (roles.length > 1 || tradeoff || alternativeMarkets > 1) {
    complexity = 1;
    complexityReasons.push('ja existe mais de uma variavel real competindo');
  }
  if (highAmbiguity || storyInconsistent || referenceTension || (tradeoff && (roles.length > 1 || alternativeMarkets > 1))) {
    complexity = 2;
    complexityReasons.push(referenceTension
      ? 'vaga de referencia aponta para uma trilha diferente da rota declarada'
      : 'caso tem ambiguidade ou contradicao real');
  }
  if (!complexityReasons.length) complexityReasons.push('caminho ainda parece relativamente linear');

  return {
    density,
    proof,
    complexity,
    total: density + proof + complexity,
    referenceMapped,
    referenceTension,
    hasConcreteProof,
    hasMarketAsset,
    densityReasons,
    proofReasons,
    complexityReasons
  };
}

function countTruthy(values) {
  return values.filter(Boolean).length;
}

function buildSummary(status, reasons) {
  const lead = reasons[0] || 'decisao gerada';
  return `${status}: ${lead}`;
}

function buildBasePayload(input) {
  const route = input?.route || 'Alemanha';
  const score = Number.isFinite(input?.score) ? input.score : 0;
  const band = input?.band || null;
  const hasCv = !!input?.materials?.cv;
  const hasQuestionnaire = !!input?.questionnaire;
  return {
    decision_meta: {
      decision_id: makeId(),
      generated_at: nowIso(),
      engine_version: 'mvp-local-v1',
      schema_version: 'v1'
    },
    input_snapshot: {
      lead_id: input?.lead_id || null,
      source_route: route,
      cia_band_public: band,
      cia_score: score,
      has_cv: hasCv,
      has_strategic_questionnaire: hasQuestionnaire,
      has_linkedin: !!input?.materials?.linkedin,
      has_portfolio: !!input?.materials?.portfolio,
      has_github: !!input?.materials?.github
    },
    decision: {
      status: null,
      recommended_offer: null,
      payment_eligibility: 'blocked',
      requires_human_review: false,
      decision_summary: '',
      next_step: 'manual_review'
    },
    lists: {
      required: [],
      warning: [],
      blocking: []
    },
    commercial: {
      can_show_payment: false,
      can_choose_offer_freely: false,
      commercial_message_key: 'manual_review'
    },
    generation: {
      output_template: null,
      intake_schema: null,
      questionnaire_action: 'none'
    },
    audit: {
      decision_reasons: [],
      critical_facts: [],
      policy_flags: [
        'no_job_promise',
        'no_visa_promise',
        'payment_after_decision_only',
        'single_complement_round_only',
        'language_is_real_guardrail'
      ]
    }
  };
}

function finalize(payload, status, config) {
  payload.decision.status = status;
  payload.decision.recommended_offer = config.recommended_offer ?? null;
  payload.decision.payment_eligibility = config.payment_eligibility;
  payload.decision.requires_human_review = !!config.requires_human_review;
  payload.decision.next_step = config.next_step;
  payload.decision.decision_summary = buildSummary(status, payload.audit.decision_reasons);
  payload.commercial.can_show_payment = !!config.can_show_payment;
  payload.commercial.can_choose_offer_freely = false;
  payload.commercial.commercial_message_key = config.commercial_message_key;
  payload.generation.output_template = config.output_template ?? null;
  payload.generation.intake_schema = config.intake_schema ?? null;
  payload.generation.questionnaire_action = config.questionnaire_action ?? 'none';
  return payload;
}

export function decideDossier(input = {}) {
  const payload = buildBasePayload(input);
  const score = payload.input_snapshot.cia_score;
  const q = input.questionnaire ? assertStrategicQuestionnaireContract(input.questionnaire) : {};
  const materials = input.materials || {};

  if (!materials.cv) {
    pushRule(payload.lists.required, 'missing_cv', 'CV ausente.', 'cv');
    payload.audit.decision_reasons.push('faltou CV atual');
    payload.audit.critical_facts.push('materials.cv=false');
  }

  payload.audit.critical_facts.push(`cia_score=${score}`);

  if (!input.questionnaire) {
    pushRule(payload.lists.required, 'missing_questionnaire', 'Questionario estrategico complementar ausente.', 'strategic_questionnaire');
    payload.audit.decision_reasons.push('faltou questionario complementar');
  }

  if (payload.lists.blocking.length > 0) {
    return finalize(payload, 'Recusa', {
      payment_eligibility: 'blocked',
      next_step: 'route_to_basic',
      can_show_payment: false,
      commercial_message_key: 'route_to_basic'
    });
  }

  if (payload.lists.required.some(item => item.code === 'missing_questionnaire')) {
    return finalize(payload, 'Faltam dados', {
      payment_eligibility: 'pending_complement',
      next_step: 'request_complement',
      can_show_payment: false,
      commercial_message_key: 'request_complement',
      questionnaire_action: 'request_complement_once'
    });
  }

  if (isWeakStrategicAnswer(q.goal_for_next_12_months)) {
    pushRule(payload.lists.required, 'goal_unclear', 'Objetivo dos proximos 12 meses ainda esta vago.', 'strategic_questionnaire');
  }

  if (isWeakStrategicAnswer(q.target_market_logic)) {
    pushRule(payload.lists.required, 'market_logic_weak', 'Logica do mercado-alvo ainda esta fraca.', 'strategic_questionnaire');
  }

  if (!hasText(q.language_level_detail, 6)) {
    pushRule(payload.lists.required, 'language_level_missing', 'Nivel de idioma nao foi confirmado.', 'strategic_questionnaire');
  }

  if (!hasText(q.reference_opportunity, 6)) {
    pushRule(payload.lists.required, 'reference_opportunity_missing', 'Falta vaga de referencia ou declaracao explicita de que ainda nao existe.', 'strategic_questionnaire');
  }

  if (!hasText(q.evidence_of_results, 12)) {
    pushRule(payload.lists.warning, 'insufficient_evidence', 'Evidencia de resultados ainda esta fraca.', 'strategic_questionnaire');
  }

  if (!hasSpecificRoleHypothesis(q.target_role_hypotheses)) {
    pushRule(payload.lists.required, 'target_roles_unclear', 'Hipotese de cargo-alvo ainda esta vaga.', 'strategic_questionnaire');
  }

  if (isLowAvailability(q.availability_for_execution)) {
    pushRule(payload.lists.warning, 'availability_low', 'Disponibilidade baixa para executar o plano.', 'strategic_questionnaire');
  }

  if (isUnrealisticTimeline(q.urgency_window)) {
    pushRule(payload.lists.warning, 'timeline_unrealistic', 'Prazo agressivo demais para a base atual.', 'strategic_questionnaire');
  }

  if (q.language_structural_block === true) {
    pushRule(payload.lists.blocking, 'language_gap_structural', 'Idioma ainda e gargalo estrutural real.', 'combined');
    payload.audit.decision_reasons.push('idioma como gargalo estrutural');
  }

  if (q.story_inconsistent === true) {
    pushRule(payload.lists.warning, 'story_inconsistent', 'Historia profissional apresenta inconsistencias relevantes.', 'combined');
  }

  if (payload.lists.blocking.length > 0) {
    return finalize(payload, 'Recusa', {
      payment_eligibility: 'blocked',
      next_step: 'route_to_basic',
      can_show_payment: false,
      commercial_message_key: 'route_to_basic'
    });
  }

  if (payload.lists.required.length > 0) {
    payload.audit.decision_reasons.push('faltam dados criticos para decidir');
    return finalize(payload, 'Faltam dados', {
      payment_eligibility: 'pending_complement',
      next_step: 'request_complement',
      can_show_payment: false,
      commercial_message_key: 'request_complement',
      questionnaire_action: 'request_complement_once'
    });
  }

  const axes = scoreTierAxes({
    route: input.route || payload.input_snapshot.source_route,
    questionnaire: q,
    profile: input.profile || {},
    materials
  });

  payload.audit.tier_axes = axes;
  payload.audit.critical_facts.push(`axis_density=${axes.density}`);
  payload.audit.critical_facts.push(`axis_proof=${axes.proof}`);
  payload.audit.critical_facts.push(`axis_complexity=${axes.complexity}`);
  payload.audit.critical_facts.push(`axis_total=${axes.total}`);
  payload.audit.critical_facts.push(`reference_mapped=${axes.referenceMapped}`);
  payload.audit.critical_facts.push(`reference_tension=${axes.referenceTension}`);
  payload.audit.critical_facts.push(`has_concrete_proof=${axes.hasConcreteProof}`);

  if (!axes.hasConcreteProof) {
    pushRule(payload.lists.warning, 'evidence_without_proof_signal', 'A evidencia ainda carece de numero, impacto ou contexto concreto.', 'strategic_questionnaire');
  }

  if (!axes.referenceMapped) {
    pushRule(payload.lists.warning, 'reference_not_mapped', 'Ainda nao existe vaga de referencia clara mapeada pelo lead.', 'strategic_questionnaire');
  }

  if (!axes.hasMarketAsset) {
    pushRule(payload.lists.warning, 'market_assets_light', 'Falta ao menos um ativo adicional de mercado para sustentar um premium.', 'materials');
  }

  const warningCount = payload.lists.warning.length;
  const requiresHumanReview = axes.total >= 5 || countTruthy([q.high_ambiguity_case, q.story_inconsistent, warningCount >= 3]) >= 2;
  if (requiresHumanReview) {
    pushRule(payload.lists.warning, 'needs_manual_review', 'Caso pede validacao humana antes de maior automacao.', 'combined');
  }

  const completoEligible = axes.total >= 4;

  if (completoEligible) {
    pushRule(payload.lists.warning, 'tier_completo_by_axes', `Soma D/P/C = ${axes.total}/6.`, 'combined');
    pushRule(payload.lists.warning, 'good_fit_completo', 'Bom fit para Dossie Completo.', 'combined');
    payload.audit.decision_reasons.push(`soma D/P/C em ${axes.total}/6 com leitura premium defensavel`);
    return finalize(payload, 'Completo', {
      recommended_offer: 'Completo',
      payment_eligibility: 'allowed',
      requires_human_review: requiresHumanReview,
      next_step: 'offer_completo',
      can_show_payment: true,
      commercial_message_key: 'offer_completo',
      output_template: 'template-output-dossie-completo.md',
      intake_schema: 'schema-intake-dossie-completo.json'
    });
  }

  pushRule(payload.lists.warning, 'tier_lite_by_axes', `Soma D/P/C = ${axes.total}/6.`, 'combined');
  pushRule(payload.lists.warning, 'good_fit_lite', 'Bom fit para Dossie Lite.', 'combined');
  payload.audit.decision_reasons.push(`soma D/P/C em ${axes.total}/6, ainda sem densidade suficiente para completo`);
  return finalize(payload, 'Lite', {
    recommended_offer: 'Lite',
    payment_eligibility: 'allowed',
    requires_human_review: requiresHumanReview,
    next_step: 'offer_lite',
    can_show_payment: true,
    commercial_message_key: 'offer_lite',
    output_template: 'template-output-dossie-lite.md',
    intake_schema: 'schema-intake-dossie-lite.json'
  });
}
