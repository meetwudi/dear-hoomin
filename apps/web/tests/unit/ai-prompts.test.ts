import { describe, expect, it } from "vitest";
import { buildThoughtImagePrompt } from "../../lib/ai/prompts";

describe("buildThoughtImagePrompt", () => {
  it("names the referenced hoomin avatar when a reference name is supplied", () => {
    const prompt = buildThoughtImagePrompt({
      petName: "Mochi",
      species: "dog",
      thoughtText: "dog park with poppa",
      hasHoominAvatar: true,
      hoominAvatarReferenceName: "poppa",
    });

    expect(prompt).toContain("referenced hoomin avatar/photo");
    expect(prompt).toContain('"poppa"');
  });

  it("keeps the pet avatar as the primary anchor when a hoomin avatar is supplied", () => {
    const prompt = buildThoughtImagePrompt({
      petName: "Coffee",
      species: "dog",
      thoughtText: "Poppa's here, tail's wagging like crazy!",
      hasHoominAvatar: true,
      hasHoominReferenceSheet: true,
      hoominAvatarReferenceName: "poppa",
    });

    expect(prompt).toContain("first input image is Coffee's selected pet avatar");
    expect(prompt).toContain("primary identity and style anchor");
    expect(prompt).toContain("reference sheet of hoomin avatars");
    expect(prompt).toContain("do not copy any hoomin details onto the pet");
    expect(prompt).toContain("clothing can adapt to the scene");
  });
});
