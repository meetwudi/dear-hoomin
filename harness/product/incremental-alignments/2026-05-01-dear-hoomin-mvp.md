# Dear Hoomin MVP Alignment

## Product Name

Dear Hoomin

## Product Idea

A mobile-friendly web app where hoomins can create a family, invite hoomins, add pets, upload pet photos, and see each pet's daily musing with a cute AI-generated cartoon image.

This is a daily ritual product. The home page should center on one thing: today's pet musing.

## Language

- Use "hoomin" instead of "human" or "user" in product-facing copy.

## MVP Scope

- Hoomins can sign up and log in.
- A hoomin can create a family.
- A family can invite other hoomins through a link and/or sending an email.
- Hoomins can belong to multiple families.
- A family can add pets.
- Each pet can have uploaded reference photos.
- Each pet gets one daily musing per local day.
- The family home page shows today's musing for the selected pet.
- The product home page centers on the pet's current daily musing.
- The musing includes short text and a cartoon-style image.
- The app should be mobile-friendly and installable to a phone home screen as a PWA.
- MVP user experience assumes one pet while keeping data modeling open for more pets later.

## Explicit Non-Goals For MVP

- Do not overbuild privacy for MVP.
- Anyone can sign up.
- Families are joinable through invite links.
- Created invite links must remain visible and directly copyable from the family management surface.
- Do not build other social features yet.
- Do not build feed, likes, comments, discovery, or moderation.
- Do not over-engineer permissions beyond basic family membership.

## Daily Musing Rules

- Each pet should have one generated daily musing per local day.
- A hoomin's local day is defined by their settings timezone.
- The default timezone for existing and new hoomins is `America/Los_Angeles`.
- Scheduled daily generation runs for a pet/date when a family hoomin's local time is at or past 6am.
- Text rules should be easily configurable.
- Text must be max 3 sentences.
- Text must be max 200 characters.
- Tone should be cute, sincere, slightly absurd, and warm, like pet-thinking.
- Text must not copy any existing book's wording.

## Daily Musing Tone Examples

- "i checked the hallway twice. nothing changed. suspicious."
- "today i protected the couch from silence."
- "the bowl was empty. then full. this is why i believe in miracles."

## Image Rules

- Generate or mock a cartoon-style image for the musing.
- The image should preserve the pet's identity over time.
- For MVP, use one fixed base style for all pets.
- The system owns the base avatar style image; admins can upload it.
- The hoomin can regenerate avatar candidates with content instructions, but cannot override the system style.
- Musing images should use the chosen pet avatar as the identity anchor.

## Open Questions

- Should first MVP email invites send through a real provider or only create shareable invite links?
