# CIA App — Tracking taxonomy

Status: foundation v0.1  
Date: 2026-06-23

## Goal

Track enough behaviour to learn whether the CIA App is moving people through the funnel without collecting unnecessary data or exposing PII in analytics files.

## Current events

- `app_loaded` — page loaded; includes `session_id`, path, referrer and UTM/source parameters.
- `route_selected` — user selected Germany (`de`) or Australia (`au`).
- `profile_started` — user completed age/current-country pre-step.
- `question_answered` — user answered a quiz question; stores question id, option value and label.
- `lead_gate_view` — user reached the lead gate before result.
- `lead` — lead gate submitted; includes contact details, route, score, band and dimensions.
- `quiz_complete` — result generated; includes score, band, dimensions, answers, counters, alerts and insights.
- `cta_click` — primary/result CTA clicked; includes CTA id, label, URL, route, score and band.
- `share_click` — share action clicked.
- `nps` — NPS score/comment submitted.
- `email_plugin_pending` — route email plugin intentionally disabled or pending review.
- `dossier_intake_submitted` — user submitted the short strategic intake for Dossier eligibility.
- `dossier_decision_received` — the dossier motor returned a valid decision payload.
- `dossier_decision_error` — the dossier motor failed and the app fell back to stored/local state.

## IDs

- `session_id`: generated at page load and stored in browser `sessionStorage`; used to connect anonymous pre-lead events.
- `lead_id`: generated only when lead/result flow needs it; used to connect lead, result, CTA and NPS.

## Minimum funnel metrics

1. Landing views: count `app_loaded`.
2. Route split: count `route_selected` by `trilha`.
3. Quiz start: count `profile_started`.
4. Lead gate reach: count `lead_gate_view`.
5. Lead conversion: count `lead` / `lead_gate_view`.
6. Result completion: count `quiz_complete`.
7. CTA intent: count `cta_click` by `cta_id`, `banda`, `trilha`.
8. Quality: average/distribution of `nps` by route and band.
9. Dossier activation: count `dossier_intake_submitted` by route and band.
10. Dossier decision mix: count `dossier_decision_received` by `decision_status`, `recommended_offer` and route.

## Privacy rules

- Do not export raw `cia_leads` into repo, docs, public dashboards or screenshots.
- For learning notes, use aggregate counts or anonymised patterns only.
- Keep public frontend limited to Supabase anon key + RLS insert-only.
- Never expose Brevo key or Supabase `service_role` in `index.html`.
- Do not call contact details anonymous. They are identifiable lead data.

## Open decision before production

Jonathan still needs to choose final Supabase activation architecture:

1. **Fast MVP:** frontend anon key + insert-only RLS.
2. **Safer production:** Edge Function/proxy with captcha/rate limit and server-side validation.

Recommendation for first controlled test: start with option 1 only if traffic is low and RLS insert-only is verified. Move to option 2 before broad traffic or paid acquisition.
