# Journal Thoughts Alignment

## Product Alignment

- Dear Hoomin is not a social product; hoomin-created entries are called journals, not posts.
- The timeline is made of entries. An entry can be a daily musing or a journal thought.
- Product UI does not need to expose the word entry.
- During the day, a hoomin can upload one or more pet photos and add a journal note.
- A journal creates a pet thought that appears in the same today interface as the daily musing.
- The home page can show multiple entries for today: the daily musing plus any journal-created thoughts.
- Timeline entries are shown as a vertical list.
- Entries can have multiple pictures. A picture can be generated or hoomin-uploaded.
- Entries with multiple pictures allow horizontal swiping with snap behavior inside that entry.
- People can share entries.
- When sharing an entry with multiple pictures as a link, the picture currently selected in the entry media carousel becomes the first picture shown in the shared link/card.
- When sharing an entry as a picture directly, the picture currently selected in the entry media carousel becomes the only picture used for the shared image.

## Generation Alignment

- Thought generation should be organized so different thought sources can share a clear generation path without hiding source-specific context.
- Daily musings use the pet, the hoomin's extra thought instructions, and recent thought text from the previous 30 days to reduce repetition.
- Journal thoughts use the pet, the hoomin's extra thought instructions, the journal note, and one uploaded photo to control token usage.
- Journal thought images use the selected avatar as the pet identity anchor and may use one uploaded journal photo as scene/context input.

## Mobile/API Alignment

- Treat timeline entry as a product and API concept even when the UI does not show that term.
- Entry payloads should have stable IDs, source kind, pet identity, local date, thought text, media ordered for display, and share targets for selected media.
- Mobile clients should receive app-owned file and share routes instead of storage-provider object keys.
- Timeline APIs should be pagination-friendly and return entries as vertical feed items, with each entry carrying its own horizontally ordered media list.
- Journal creation APIs should support multipart photo uploads plus journal text and pet ID; later multi-pet classification can sit before entry creation.
- Sharing APIs should accept a selected media ID so link previews use that picture first and direct picture sharing renders only that picture.

## Future TODOs

- Current UX still assumes one pet per family.
- When Dear Hoomin supports multiple pets per family, hoomins need controls to add pets, archive pets while keeping thoughts, and delete pets with their thoughts.
- Multi-pet families need pet identification during photo upload so Dear Hoomin can classify which pet appears in uploaded photos before creating a journal thought.
