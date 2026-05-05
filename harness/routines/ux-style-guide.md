# UX Style Guide

Use this guide when adding or changing user-facing UI.

## Current System

- Use the app's theme tokens and reusable classes in `apps/web/app/globals.css` before adding new bespoke styling.
- Prefer shared primitives for panels, buttons, links, inputs, forms, section blocks, lists, media frames, loading states, and status text.
- Add a new CSS class only when the component has a distinct product role or layout responsibility that cannot be expressed by an existing primitive plus a narrow modifier.
- Keep new visual tokens semantic. Prefer names like `--surface`, `--field-border`, `--radius-md`, or `--shadow-card` over names tied to a single component.
- Keep one-off decorative treatments out of product flows unless the product alignment explicitly calls for them.

## Library Direction

- The tech-stack alignment names Tailwind CSS, but the current web package does not install Tailwind or shadcn/ui. Do not add either casually inside an unrelated UI change.
- If Tailwind is introduced, map this guide's tokens to Tailwind theme values first, then migrate component classes incrementally.
- If shadcn/ui is introduced, keep it as a primitive source. Theme it to Dear Hoomin tokens and wrap reusable app-specific components instead of copying generated variants into pages.
- Avoid mixing a new utility/component-library layer with large amounts of unmanaged global CSS for the same primitive.

## Review Checklist

- New UI reuses existing classes or extends them with small modifiers.
- Repeated literals for colors, radii, shadows, spacing, or control sizing have been promoted to semantic tokens.
- Component-specific CSS is limited to component-specific structure, state, or layout.
- Product pages do not introduce new visual systems, button variants, field styles, or card styles without updating this guide.
- Browser or screenshot review confirms the reusable styles still fit the changed flow.
