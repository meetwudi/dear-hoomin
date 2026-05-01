# UX, Generation, And Notification Alignment

## Experience Direction

- Keep Dear Hoomin cute, cozy, and mobile friendly.
- The home page is the product surface, not a landing page.
- Home should center on the pet's thought for today, written from the pet's perspective.
- Product copy can be playful and conversational, including hoomin/pet phrasing, while staying readable.
- Use a doodle-ish readable font direction with no licensing risk. If a web font is introduced later, record its license and hosting decision.

## Current Pet Scope

- Assume one pet in the MVP user experience.
- Keep data modeling compatible with multiple pets later.
- Do not allow adding more than one pet in the current UI.

## Avatar Flow

- Pet setup starts with a hoomin-uploaded original reference photo.
- Before thought images are generated, the app generates three avatar candidates.
- The hoomin chooses one avatar or regenerates three candidates with optional content instructions.
- The system owns the base avatar style image. Admins can upload it.
- Hoomin instructions can tweak content but not override the system style.
- Subsequent pet thought images should use the selected avatar as the identity anchor.

## Home States

- No family: create a family.
- No pet: link to settings to add a pet.
- Pet exists but no chosen avatar: show the reusable avatar chooser.
- Chosen avatar but no generated thought image: show a manual generation button.
- Generation in flight: show the generating state while preserving any existing thought content.
- Generated thought ready: show the thought and image.

## Generation Organization

- Keep LLM clients and prompts in `apps/web/lib/ai/`.
- Keep generation orchestration in `apps/web/lib/pets/generation.ts`.
- Use OpenAI metadata where supported for trace filtering.
- Use structured application logging for generation step observability.

## Notifications

- Settings should expose an all-on/all-off notification preference.
- Settings should also expose granular notification preferences.
- The first granular type is pet thought published.
- Notification messages should feel natural and pet-like, not system-alert-y.
