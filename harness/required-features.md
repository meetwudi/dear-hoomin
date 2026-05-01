# Required Features

This is the golden log of product features that must not disappear during normal development. Before preparing or updating a PR, compare the changed surfaces against this list and call out any missing, degraded, or unverified required feature.

## App Shell And Navigation

- Signed-in hoomins can reach the current daily musing from the primary app navigation.
- Signed-in hoomins can reach family management from the primary app navigation when they have a family.
- The primary app tabs are exactly `Musings` and `Family`.
- Do not add, rename, or remove a primary app tab unless the developer explicitly confirms the tab model change.

## Daily Musings

- Each pet can have one scheduled daily musing per local day.
- Daily musing generation respects the hoomin timezone and runs for the 6am local generation window.
- Hoomins can manually start or retry daily musing image generation when the pet is ready.
- Generated daily musings can be shared through unguessable public share links.

## Furbaby Setup

- Hoomins can add a furbaby with a real-world reference photo.
- Hoomins can choose or regenerate an avatar candidate before daily musing image generation.
- Hoomins can update the real-world reference photo.
- Hoomins can save extra furbaby notes for generation.

## Notifications

- Family exposes a browser notification enablement control.
- Family exposes all-notification and daily-musing-ready notification preferences.
- Daily musing publication attempts Web Push delivery to subscribed family members whose notification preferences allow it.
- Admin users can send a Web Push test notification from `/admin`.

## Family

- Hoomins can create a family.
- Hoomins can invite other hoomins with an invite link.
- Invited hoomins can accept a valid invite link.

## Journal Thoughts

- Hoomins can create journal thoughts with uploaded photos and a journal note.
- Today's timeline can show both the daily musing and journal-created thoughts.
- Journal-created thoughts can use uploaded photos as share-card covers.
