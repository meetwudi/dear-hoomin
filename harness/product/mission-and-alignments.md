# Product Mission And Alignments

## Mission

Dear Hoomin is a mobile-friendly daily ritual product where hoomins can see a pet's daily musing with a cute cartoon-style image.

The home page centers on one thing: today's pet musing.

## Current Alignments

- Use a harness engineering approach.
- The hardness of the harness is close alignment between the developer and the AI agent.
- Stay closely aligned.
- Do not expand scope without clarification.
- Ask questions instead of inferring product direction.
- Product-facing copy must use "hoomin" instead of "human" or "user".
- Product name is Dear Hoomin.
- Product-facing copy calls the generated ritual a "musing"; use "thought" only for legacy internal persistence names when renaming would require a migration.
- Product-facing terminology is defined in `harness/product/glossary.md`; check it before changing copy.
- Product-facing copy should live in `apps/web/lib/product-copy/`; durable rules are aligned in `harness/product/incremental-alignments/2026-05-01-product-copy-library.md`.
- MVP scope is Dear Hoomin as described in `harness/product/incremental-alignments/2026-05-01-dear-hoomin-mvp.md`.
- UX, avatar, generation, and notification details are aligned in `harness/product/incremental-alignments/2026-05-01-ux-generation-notifications.md`.
- Journal-created musings are aligned in `harness/product/incremental-alignments/2026-05-01-journal-thoughts.md`.
- Tech stack is aligned in `harness/product/incremental-alignments/2026-05-01-tech-stack.md`.
- Public-facing docs should lead with the product, not over-callout the harness approach.

## Open Questions

- Should email invites send real email in MVP, or is a mocked email handoff acceptable for the first build?
