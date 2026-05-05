import { describe, expect, it, vi } from "vitest";
import {
  createJournalMusing,
  deleteJournalMusing,
} from "../../lib/client-api/journal-musings";
import { imageFile } from "./support/mocks";

describe("createJournalMusing browser transport", () => {
  it("submits the expected multipart field shape", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          familyId: "family-1",
          musingId: "musing-1",
          petId: "pet-1",
          status: "succeeded",
        }),
        { status: 200 },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);
    const photo = imageFile();

    await createJournalMusing({
      familyId: "family-1",
      journalText: "a tiny note",
      petId: "pet-1",
      photos: [photo],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/v1/families/family-1/pets/pet-1/journal-musings",
      expect.objectContaining({
        headers: {
          Accept: "text/event-stream",
        },
        method: "POST",
      }),
    );
    const body = fetchMock.mock.calls[0][1].body as FormData;
    expect(body.get("journalText")).toBe("a tiny note");
    expect(body.getAll("photos")).toEqual([photo]);
  });

  it("reads streamed musing updates", async () => {
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        controller.enqueue(
          encoder.encode(
            'event: accepted\ndata: {"familyId":"family-1","petId":"pet-1","stage":"accepted"}\n\n',
          ),
        );
        controller.enqueue(
          encoder.encode(
            'event: succeeded\ndata: {"familyId":"family-1","musingId":"musing-1","petId":"pet-1","stage":"succeeded"}\n\n',
          ),
        );
        controller.close();
      },
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
        },
        status: 200,
      }),
    );
    const onEvent = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createJournalMusing(
        {
          familyId: "family-1",
          journalText: null,
          petId: "pet-1",
          photos: [imageFile()],
        },
        { onEvent },
      ),
    ).resolves.toEqual({
      familyId: "family-1",
      musingId: "musing-1",
      petId: "pet-1",
      status: "succeeded",
    });
    expect(onEvent).toHaveBeenCalledWith({
      familyId: "family-1",
      petId: "pet-1",
      stage: "accepted",
    });
  });

  it("deletes journal musings through the musing API", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ musingId: "musing-1" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(deleteJournalMusing("musing-1")).resolves.toEqual({
      musingId: "musing-1",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/v1/musings/musing-1", {
      method: "DELETE",
    });
  });
});
