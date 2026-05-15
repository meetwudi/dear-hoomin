import { describe, expect, it } from "vitest";
import {
  buildThoughtImagePrompt,
  buildThoughtTextPrompt,
} from "../../lib/ai/prompts";

describe("buildThoughtTextPrompt", () => {
  it("uses bounded recent musing context and asks for a different premise", () => {
    const prompt = buildThoughtTextPrompt({
      petName: "Mochi",
      species: "dog",
      recentThoughts: Array.from(
        { length: 14 },
        (_, index) => `recent musing ${index + 1}`,
      ),
    });

    expect(prompt).toContain("Recent musings to avoid echoing");
    expect(prompt).toContain("recent musing 12");
    expect(prompt).not.toContain("recent musing 13");
    expect(prompt).toContain("Vary the premise");
    expect(prompt).toContain("yard, porch, sidewalk, park");
  });
});

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
      hoominAvatarReferenceNames: ["poppa", "mooma"],
      hoominAvatarReferenceName: "poppa",
    });

    expect(prompt).toContain("first input image is Coffee's selected pet avatar");
    expect(prompt).toContain("primary identity and style anchor");
    expect(prompt).toContain("reference sheet of hoomin avatars");
    expect(prompt).toContain('"poppa", "mooma"');
    expect(prompt).toContain("do not copy any hoomin details onto the pet");
    expect(prompt).toContain("clothing can adapt to the scene");
  });

  it("uses recent musings to steer scene variety", () => {
    const prompt = buildThoughtImagePrompt({
      petName: "Coffee",
      species: "dog",
      thoughtText: "today i inspected the sunbeam",
      recentThoughts: ["window patrol report", "laundry pile investigation"],
    });

    expect(prompt).toContain("Avoid repeating recent musing scenes/text");
    expect(prompt).toContain("window patrol report");
    expect(prompt).toContain("specific scene with action");
    expect(prompt).toContain("indoor/outdoor location");
    expect(prompt).toContain("yard, porch, sidewalk, park");
  });
});
