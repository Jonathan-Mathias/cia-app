import assert from 'node:assert/strict';
import { assertDecisionContract } from './contract-test.mjs';
import { decideDossier } from './engine.mjs';
import { assertStrategicQuestionnaireContract } from './questionnaire-contract.mjs';

function makeBaseInput(overrides = {}) {
  return {
    lead_id: 'lead_regression_base',
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
      goal_for_next_12_months: 'Quero me reposicionar para o mercado alemao com candidatura mais legivel e foco em vaga alvo.',
      target_market_logic: 'A Alemanha faz sentido pela aderencia da minha experiencia e pelo tipo de industria que quero atacar.',
      evidence_of_results: 'Aumentei a produtividade da operacao em 14% em uma frente critica. Liderei um redesenho que cortou EUR 90k em desperdicio anual.',
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

const cases = [
  {
    id: 'recusa_missing_cv',
    input: makeBaseInput({ materials: { cv: false, linkedin: true, portfolio: false, github: false } }),
    expect: {
      status: 'Recusa',
      payment: 'blocked',
      blocking: ['missing_cv']
    }
  },
  {
    id: 'recusa_language_block',
    input: makeBaseInput({
      questionnaire: {
        ...makeBaseInput().questionnaire,
        language_structural_block: true
      }
    }),
    expect: {
      status: 'Recusa',
      payment: 'blocked',
      blocking: ['language_gap_structural']
    }
  },
  {
    id: 'faltam_dados_missing_questionnaire',
    input: (() => {
      const data = makeBaseInput();
      delete data.questionnaire;
      return data;
    })(),
    expect: {
      status: 'Faltam dados',
      payment: 'pending_complement',
      required: ['missing_questionnaire']
    }
  },
  {
    id: 'faltam_dados_goal_unclear',
    input: makeBaseInput({
      questionnaire: {
        ...makeBaseInput().questionnaire,
        goal_for_next_12_months: 'Ainda estou vendo'
      }
    }),
    expect: {
      status: 'Faltam dados',
      payment: 'pending_complement',
      required: ['goal_unclear']
    }
  },
  {
    id: 'lite_clear_lower_density',
    input: makeBaseInput({
      score: 61,
      band: 'Em Rota',
      questionnaire: {
        goal_for_next_12_months: 'Quero corrigir a legibilidade do meu perfil e atacar o mercado certo.',
        target_market_logic: 'Existe aderencia entre meu historico e a demanda do mercado alvo.',
        evidence_of_results: 'Tenho alguns resultados e experiencia relevante, mas ainda sem muitos numeros organizados.',
        availability_for_execution: 'media',
        urgency_window: '3-6 meses',
        target_role_hypotheses: ['Operations Manager'],
        has_meaningful_tradeoffs: false,
        high_ambiguity_case: false,
        story_inconsistent: false,
        language_structural_block: false
      }
    }),
    expect: {
      status: 'Lite',
      payment: 'allowed',
      offer: 'Lite'
    }
  },
  {
    id: 'completo_high_density',
    input: makeBaseInput(),
    expect: {
      status: 'Completo',
      payment: 'allowed',
      offer: 'Completo'
    }
  },
  {
    id: 'lite_high_density_but_missing_asset',
    input: makeBaseInput({
      materials: {
        cv: true,
        linkedin: false,
        portfolio: false,
        github: false
      }
    }),
    expect: {
      status: 'Lite',
      payment: 'allowed',
      offer: 'Lite'
    }
  }
];

const summary = [];

for (const testCase of cases) {
  if (testCase.input.questionnaire) {
    assertStrategicQuestionnaireContract(testCase.input.questionnaire);
  }
  const out = decideDossier(testCase.input);
  assertDecisionContract(out);
  assert.equal(out.decision.status, testCase.expect.status, `${testCase.id}: status mismatch`);
  assert.equal(out.decision.payment_eligibility, testCase.expect.payment, `${testCase.id}: payment mismatch`);

  if ('offer' in testCase.expect) {
    assert.equal(out.decision.recommended_offer, testCase.expect.offer, `${testCase.id}: offer mismatch`);
  }

  if (testCase.expect.blocking) {
    for (const code of testCase.expect.blocking) {
      assert.ok(out.lists.blocking.some(item => item.code === code), `${testCase.id}: missing blocking ${code}`);
    }
  }

  if (testCase.expect.required) {
    for (const code of testCase.expect.required) {
      assert.ok(out.lists.required.some(item => item.code === code), `${testCase.id}: missing required ${code}`);
    }
  }

  summary.push({
    id: testCase.id,
    status: out.decision.status,
    payment: out.decision.payment_eligibility,
    offer: out.decision.recommended_offer
  });
}

console.log(JSON.stringify({ ok: true, cases: summary }, null, 2));
