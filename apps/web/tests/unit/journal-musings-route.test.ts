import { describe, expect, it } from "vitest";
import {
  authMocks,
  generationMocks,
  imageFile,
  importJournalRouteWithMocks,
  resetUnitMocks,
  testSession,
} from "./support/mocks";

describe("POST /api/v1/families/:familyId/pets/:petId/journal-musings", () => {
  it("returns unauthorized when no session exists", async () => {
    resetUnitMocks();
    authMocks.getSession.mockResolvedValue(null);
    const { POST } = await importJournalRouteWithMocks();

    const response = await POST(new Request("https://app.test", { method: "POST" }), {
      params: Promise.resolve({ familyId: "family-1", petId: "pet-1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
    expect(generationMocks.generateJournalThought).not.toHaveBeenCalled();
  });

  it("parses multipart photos and optional blank text", async () => {
    resetUnitMocks();
    authMocks.getSession.mockResolvedValue(testSession({ hoominId: "hoomin-2" }));
    generationMocks.generateJournalThought.mockResolvedValue({
      status: "succeeded",
      thoughtId: "thought-2",
    });
    const { POST } = await importJournalRouteWithMocks();
    const formData = new FormData();
    const photo = imageFile();

    formData.set("journalText", " ");
    formData.append("photos", photo);

    const response = await POST(
      {
        formData: async () => formData,
        headers: new Headers(),
      } as Request,
      {
        params: Promise.resolve({ familyId: "family-2", petId: "pet-2" }),
      },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      familyId: "family-2",
      musingId: "thought-2",
      petId: "pet-2",
      status: "succeeded",
    });
    expect(generationMocks.generateJournalThought).toHaveBeenCalledWith(
      expect.objectContaining({
        familyId: "family-2",
        hoominId: "hoomin-2",
        journalText: null,
        petId: "pet-2",
        photos: [photo],
      }),
    );
  });

  it("streams journal musing events when requested", async () => {
    resetUnitMocks();
    authMocks.getSession.mockResolvedValue(testSession({ hoominId: "hoomin-3" }));
    generationMocks.generateJournalThought.mockImplementation(async (input) => {
      await input.onProgress({ stage: "generating_text" });

      return {
        status: "succeeded",
        thoughtId: "musing-3",
      };
    });
    const { POST } = await importJournalRouteWithMocks();
    const formData = new FormData();

    formData.append("photos", imageFile());

    const response = await POST(
      {
        formData: async () => formData,
        headers: new Headers({ Accept: "text/event-stream" }),
      } as Request,
      {
        params: Promise.resolve({ familyId: "family-3", petId: "pet-3" }),
      },
    );
    const body = await response.text();

    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(body).toContain('event: accepted');
    expect(body).toContain('"stage":"generating_text"');
    expect(body).toContain('"musingId":"musing-3"');
  });
});
