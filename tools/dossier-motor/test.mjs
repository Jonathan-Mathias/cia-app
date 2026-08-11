import assert from 'node:assert/strict';
import { assertDecisionContract } from './contract-test.mjs';
import { decideDossier } from './engine.mjs';
import { assertStrategicQuestionnaireContract } from './questionnaire-contract.mjs';

function makeBaseInput(overrides = {}) {
  return {
    lead_id: 'lead_test_001',
    route: 'Alemanha',
    band: 'Pronto para Embarcar',
    score: 72,
    profile: {
      seniority_level: 'Senior'
    },
    materials: {
      cv: true,
      linkedin: true,
      portfolio: false,
      github: false
    },
    questionnaire: {
      goal_for_next_12_months: 'Quero me reposicionar para o mercado alemao com candidatura mais legivel e focada.',
      target_market_logic: 'Alemanha faz sentido pela aderencia da minha experiencia e pelo tipo de industria que quero atacar.',
      evidence_of_results: 'Reduzi o tempo de ciclo em 18% em uma frente operacional. Liderei um projeto que gerou economia anual de EUR 120k com impacto direto na area.',
      language_level_detail: 'Alemao B2 em contexto profissional tecnico.',
      reference_opportunity: 'Vaga de Operations Manager em empresa industrial na Alemanha ja mapeada.',
      availability_for_execution: 'media',
      urgency_window: '3-6 meses',
      target_role_hypotheses: ['Operations Manager', 'Project Manager'],
      has_meaningful_tradeoffs: true,
      high_ambiguity_case: false,
      story_inconsistent: false,
      language_structural_block: false
    },
    ...overrides
  };
}

{
  const out = decideDossier(makeBaseInput({ materials: { cv: false } }));
  assertDecisionContract(out);
  assert.equal(out.decision.status, 'Faltam dados');
  assert.equal(out.decision.payment_eligibility, 'pending_complement');
  assert.ok(out.lists.required.some(item => item.code === 'missing_cv'));
}

{
  const input = makeBaseInput();
  delete input.questionnaire;
  const out = decideDossier(input);
  assertDecisionContract(out);
  assert.equal(out.decision.status, 'Faltam dados');
  assert.equal(out.decision.payment_eligibility, 'pending_complement');
  assert.equal(out.generation.questionnaire_action, 'request_complement_once');
}

{
  const out = decideDossier(makeBaseInput({
    score: 61,
    band: 'Em Rota',
    profile: { seniority_level: 'Senior' },
    questionnaire: {
      goal_for_next_12_months: 'Quero corrigir a legibilidade do meu perfil e atacar o mercado certo.',
      target_market_logic: 'Existe aderencia entre meu historico e a demanda do mercado alvo.',
      evidence_of_results: 'Tenho alguns resultados e experiencia relevante, mas ainda sem muitos numeros organizados.',
      language_level_detail: 'Alemao B1 em progresso.',
      reference_opportunity: 'Ainda nao mapeei uma vaga especifica.',
      availability_for_execution: 'media',
      urgency_window: '3-6 meses',
      target_role_hypotheses: ['Operations Manager'],
      has_meaningful_tradeoffs: false,
      high_ambiguity_case: false,
      story_inconsistent: false,
      language_structural_block: false
    }
  }));
  assertDecisionContract(out);
  assertStrategicQuestionnaireContract(makeBaseInput({
    score: 61,
    band: 'Em Rota',
    profile: { seniority_level: 'Senior' },
    questionnaire: {
      goal_for_next_12_months: 'Quero corrigir a legibilidade do meu perfil e atacar o mercado certo.',
      target_market_logic: 'Existe aderencia entre meu historico e a demanda do mercado alvo.',
      evidence_of_results: 'Tenho alguns resultados e experiencia relevante.',
      language_level_detail: 'Alemao B1 em progresso.',
      reference_opportunity: 'Ainda nao mapeei uma vaga especifica.',
      availability_for_execution: 'media',
      urgency_window: '3-6 meses',
      target_role_hypotheses: ['Operations Manager'],
      has_meaningful_tradeoffs: false,
      high_ambiguity_case: false,
      story_inconsistent: false,
      language_structural_block: false
    }
  }).questionnaire);
  assert.equal(out.decision.status, 'Lite');
  assert.equal(out.decision.recommended_offer, 'Lite');
}

{
  const out = decideDossier(makeBaseInput());
  assertDecisionContract(out);
  assert.equal(out.decision.status, 'Completo');
  assert.equal(out.decision.recommended_offer, 'Completo');
  assert.equal(out.generation.intake_schema, 'schema-intake-dossie-completo.json');
  assert.ok(out.audit.questionnaire_plan.visible_questions.length <= 6);
  assert.ok(out.audit.questionnaire_plan.omitted_questions.length >= 1);
  assert.ok(out.audit.questionnaire_plan.personalized_from_cia.length >= 1);
  assert.ok(out.audit.questionnaire_plan.personalized_from_cv.length >= 1);
}

{
  const out = decideDossier(makeBaseInput({
    questionnaire: {
      ...makeBaseInput().questionnaire,
      goal_for_next_12_months: 'Quero aplicar para Operations Manager na Alemanha nos proximos meses com uma trilha principal.',
      target_market_logic: 'Alemanha e a rota principal pela aderencia setorial e pelas vagas que venho mapeando.',
      evidence_of_results: 'Entreguei reducao de 18% no tempo de ciclo e economia anual de EUR 120k em frente operacional.',
      reference_opportunity: 'Vaga de Operations Manager em empresa industrial na Alemanha ja mapeada.',
      target_role_hypotheses: ['Operations Manager'],
      has_meaningful_tradeoffs: false
    }
  }));
  assertDecisionContract(out);
  const visibleIds = out.audit.questionnaire_plan.visible_questions.map(item => item.id);
  assert.ok(!visibleIds.includes('goal_for_next_12_months'));
  assert.ok(!visibleIds.includes('target_market_logic'));
  assert.ok(!visibleIds.includes('reference_opportunity'));
}

console.log('dossier-motor tests: ok');
