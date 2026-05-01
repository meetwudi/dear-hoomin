# Coffee Thoughts MVP Alignment

## Product Name

Coffee Thoughts

## Product Idea

A mobile-friendly web app where hoomins can create a family, invite hoomins, add pets, upload pet photos, and see each pet's daily thought with a cute AI-generated cartoon image.

This is a daily ritual product. The home page should center on one thing: today's pet thought.

## Language

- Use "hoomin" instead of "human" or "user" in product-facing copy.

## MVP Scope

- Hoomins can sign up and log in.
- A hoomin can create a family.
- A family can invite other hoomins through a link and/or sending an email.
- Hoomins can belong to multiple families.
- A family can add pets.
- Each pet can have uploaded reference photos.
- Each pet gets one daily thought per local day.
- The family home page shows today's thought for the selected pet.
- The thought includes short text and a cartoon-style image.
- The app should be mobile-friendly and installable to a phone home screen as a PWA.

## Explicit Non-Goals For MVP

- Do not overbuild privacy for MVP.
- Anyone can sign up.
- Families are joinable through invite links.
- Do not build other social features yet.
- Do not build feed, likes, comments, discovery, or moderation.
- Do not over-engineer permissions beyond basic family membership.

## Daily Thought Rules

- Each pet should have one generated thought per local day.
- Text rules should be easily configurable.
- Text must be max 3 sentences.
- Text must be max 200 characters.
- Tone should be cute, sincere, slightly absurd, and warm, like pet-thinking.
- Text must not copy any existing book's wording.

## Daily Thought Tone Examples

- "i checked the hallway twice. nothing changed. suspicious."
- "today i protected the couch from silence."
- "the bowl was empty. then full. this is why i believe in miracles."

## Image Rules

- Generate or mock a cartoon-style image for the thought.
- The image should preserve the pet's identity over time.
- For MVP, use one fixed base style for all pets.
- The hoomin can provide a base style photo/reference image later.
- It is okay to mock image generation first, but structure the code so real image generation can be added later.

## Open Questions

- What application stack should be used?
- What auth provider or auth approach should be used?
- What storage should be used for pet photos?
- What counts as "local day" when a family or pet has no explicit timezone?
- Should first MVP email invites send through a real provider or only create shareable invite links?
