import { describe, expect, it } from "vitest";
import {
  generationMocks,
  imageFile,
  importPetsClientApiWithMocks,
  petStoreMocks,
  resetUnitMocks,
  testSession,
} from "./support/mocks";

describe("createJournalMusingCapability", () => {
  it("requires at least one photo", async () => {
    resetUnitMocks();
    const { createJournalMusingCapability } = await importPetsClientApiWithMocks();

    await expect(
      createJournalMusingCapability(
        { session: testSession() },
        {
          familyId: "family-1",
          journalText: null,
          petId: "pet-1",
          photos: [],
        },
      ),
    ).rejects.toThrow("photos_required");
    expect(generationMocks.generateJournalThought).not.toHaveBeenCalled();
  });

  it("rejects invalid image types", async () => {
    resetUnitMocks();
    const { createJournalMusingCapability } = await importPetsClientApiWithMocks();

    await expect(
      createJournalMusingCapability(
        { session: testSession() },
        {
          familyId: "family-1",
          journalText: null,
          petId: "pet-1",
          photos: [imageFile({ name: "notes.txt", type: "text/plain" })],
        },
      ),
    ).rejects.toThrow("photo_type_invalid");
    expect(generationMocks.generateJournalThought).not.toHaveBeenCalled();
  });

  it("normalizes optional text and caps photos before generation", async () => {
    resetUnitMocks();
    generationMocks.generateJournalThought.mockResolvedValue({
      status: "succeeded",
      thoughtId: "thought-1",
    });
    const { createJournalMusingCapability } = await importPetsClientApiWithMocks();
    const photos = Array.from({ length: 7 }, (_, index) =>
      imageFile({ name: `pet-${index}.jpg` }),
    );

    const result = await createJournalMusingCapability(
      { session: testSession({ hoominId: "hoomin-7" }) },
      {
        familyId: "family-1",
        journalText: "   ",
        petId: "pet-1",
        photos,
      },
    );

    expect(result).toEqual({
      familyId: "family-1",
      musingId: "thought-1",
      petId: "pet-1",
      status: "succeeded",
    });
    expect(generationMocks.generateJournalThought).toHaveBeenCalledWith(
      expect.objectContaining({
        familyId: "family-1",
        hoominId: "hoomin-7",
        journalText: null,
        petId: "pet-1",
        photos: photos.slice(0, 6),
      }),
    );
  });

  it("streams serializable musing status events", async () => {
    resetUnitMocks();
    generationMocks.generateJournalThought.mockImplementation(async (input) => {
      await input.onProgress({ stage: "generating_text" });
      await input.onProgress({ stage: "musing_created", musingId: "musing-1" });

      return {
        status: "succeeded",
        thoughtId: "musing-1",
      };
    });
    const { createJournalMusingEventsCapability } = await importPetsClientApiWithMocks();
    const events = [];

    for await (const event of createJournalMusingEventsCapability(
      { session: testSession({ hoominId: "hoomin-8" }) },
      {
        familyId: "family-1",
        journalText: "hello",
        petId: "pet-1",
        photos: [imageFile()],
      },
    )) {
      events.push(event);
    }

    expect(events).toEqual([
      {
        familyId: "family-1",
        petId: "pet-1",
        stage: "accepted",
      },
      {
        familyId: "family-1",
        petId: "pet-1",
        stage: "generating_text",
      },
      {
        familyId: "family-1",
        musingId: "musing-1",
        petId: "pet-1",
        stage: "musing_created",
      },
      {
        familyId: "family-1",
        musingId: "musing-1",
        petId: "pet-1",
        stage: "succeeded",
      },
    ]);
  });

  it("deletes journal musings through the shared capability", async () => {
    resetUnitMocks();
    petStoreMocks.deleteJournalThoughtForHoomin.mockResolvedValue(undefined);
    const { deleteJournalMusingCapability } = await importPetsClientApiWithMocks();

    await expect(
      deleteJournalMusingCapability(
        { session: testSession({ hoominId: "hoomin-9" }) },
        "musing-9",
      ),
    ).resolves.toEqual({ musingId: "musing-9" });
    expect(petStoreMocks.deleteJournalThoughtForHoomin).toHaveBeenCalledWith({
      hoominId: "hoomin-9",
      musingId: "musing-9",
    });
  });
});
