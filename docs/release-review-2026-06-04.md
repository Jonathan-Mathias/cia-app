# CIA App — Release Review Package

Status: not published
Date: 2026-06-04

## What changed

This local version moves the CIA App from a technically strong quiz toward an EML product.

### Product and branding

- Landing page now anchors on EML positioning: `Ser bom não basta se o mercado não entende seu valor`.
- Germany is presented as the primary EML route.
- Australia is presented as a second route, not removed and not overclaimed.
- Australia visual accent was moved from blue to deep green, matching the approved brand direction.
- Blue is preserved as a functional/data color.

### Funnel and CTA routing

A primary CTA card was added to the result page. Each band now has one main recommended next step:

- Explorador: `Entrar no grupo gratuito`.
- Em Rota: `Ajustar meu CV para o mercado-alvo`.
- Pronto para Embarcar: `Preparar minha candidatura estratégica`.
- Elite: `Registrar interesse premium futuro`.

### Privacy and consent

- `privacy.html` was created.
- Lead gate consent now links to privacy policy.
- Copy no longer calls identifiable data anonymous.
- User is told that data is used to deliver the diagnosis, send relevant next steps and improve the CIA App.

### Technical readiness

- `APP_CONFIG` centralizes products, partners, owned channels, email route status and future Supabase config.
- Supabase remains off by default.
- Germany email route remains enabled.
- Australia email route remains disabled as `plugin_pending_review`.
- `lead_id` connects lead, result, events, NPS and CTA clicks.

## QA evidence

See `docs/qa-run-2026-06-04.md`.

Passed:

- JavaScript syntax check.
- App DOM render via Chromium headless.
- Privacy page DOM render via Chromium headless.
- Static checks for product/branding changes.
- Functional smoke scenarios through Chrome DevTools Protocol.

Synthetic routing results:

- DE low → Explorador → community foundation.
- DE mid → Em Rota → CV Builder.
- DE ready → Pronto para Embarcar → strategic application.
- DE elite → Elite → premium waitlist.
- AU low → Explorador → community foundation.
- AU mid/ready → Pronto para Embarcar → strategic application.
- AU elite → Elite → premium waitlist.

## Known issues and non-blockers

- AU score calibration may be slightly generous in synthetic mid scenarios. This should be reviewed when AU emails and route strategy are reviewed.
- Privacy page is functional and acceptable for MVP, but visually more document-like than the app. Polish later.
- Some final links remain placeholders.
- Premium waitlist currently falls back to LinkedIn until a real waitlist URL exists.
- Supabase remains disabled until project and backend decision are final.

## Human inputs still needed before publishing

1. Official EML contact email for privacy/support.
2. Final links for products:
   - Não Comece do Zero;
   - premium future waitlist;
   - production CV Builder;
   - Carta de Apresentação;
   - LinkedIn Optimizer.
3. Final partner links:
   - Alemão de Verdade;
   - BARMER;
   - Kanzlei Hamburg;
   - AU partners, if any.
4. Supabase decision:
   - MVP anon key + RLS; or
   - Edge Function/proxy before production.
5. Human review of AU email route.

## Recommendation

Do not publish yet. Continue one more implementation pass to:

- reduce duplicate/secondary CTAs;
- polish visual hierarchy on mobile;
- add final fallback behavior for empty partner/product links;
- run manual scenario walkthroughs when an interactive browser is available.

After that, prepare a review branch or local commit for Jonathan approval before push/publication.
