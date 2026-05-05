"use client";

export type CreateJournalMusingInput = {
  familyId: string;
  journalText: string | null;
  petId: string;
  photos: File[];
};

export type CreateJournalMusingResult = {
  familyId: string;
  musingId: string | null;
  petId: string;
  status: "succeeded" | "failed" | "not_ready" | "in_progress";
};

export type JournalMusingStreamEvent =
  | {
      familyId: string;
      petId: string;
      stage: "accepted" | "generating_text";
    }
  | {
      familyId: string;
      musingId: string;
      petId: string;
      stage: "musing_created" | "generating_image";
    }
  | {
      error?: string;
      familyId: string;
      musingId: string | null;
      petId: string;
      stage: CreateJournalMusingResult["status"];
    };

type CreateJournalMusingOptions = {
  onEvent?: (event: JournalMusingStreamEvent) => void;
};

// Cross-platform exception: this browser transport helper submits multipart
// media to the versioned HTTP API; product behavior lives in pets.ts.
export async function createJournalMusing({
  familyId,
  journalText,
  petId,
  photos,
}: CreateJournalMusingInput, options: CreateJournalMusingOptions = {}): Promise<CreateJournalMusingResult> {
  const formData = new FormData();

  if (journalText) {
    formData.set("journalText", journalText);
  }

  for (const photo of photos) {
    formData.append("photos", photo);
  }

  const response = await fetch(
    `/api/v1/families/${encodeURIComponent(familyId)}/pets/${encodeURIComponent(petId)}/journal-musings`,
    {
      body: formData,
      headers: {
        Accept: "text/event-stream",
      },
      method: "POST",
    },
  );

  if (!response.ok) {
    const result = (await response.json()) as { error?: string };
    throw new Error("error" in result && result.error ? result.error : "journal_musing_failed");
  }

  if (!response.headers.get("content-type")?.includes("text/event-stream") || !response.body) {
    return (await response.json()) as CreateJournalMusingResult;
  }

  return readJournalMusingEventStream(response.body, options.onEvent);
}

async function readJournalMusingEventStream(
  body: ReadableStream<Uint8Array>,
  onEvent?: (event: JournalMusingStreamEvent) => void,
) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalEvent: JournalMusingStreamEvent | null = null;

  while (true) {
    const { done, value } = await reader.read();

    if (value) {
      buffer += decoder.decode(value, { stream: !done });
    }

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const event = parseJournalMusingEvent(chunk);

      if (!event) {
        continue;
      }

      onEvent?.(event);
      finalEvent = event;
    }

    if (done) {
      break;
    }
  }

  if (
    finalEvent?.stage === "succeeded" ||
    finalEvent?.stage === "failed" ||
    finalEvent?.stage === "not_ready" ||
    finalEvent?.stage === "in_progress"
  ) {
    if (finalEvent.stage !== "succeeded") {
      throw new Error("error" in finalEvent && finalEvent.error ? finalEvent.error : finalEvent.stage);
    }

    return {
      familyId: finalEvent.familyId,
      musingId: finalEvent.musingId,
      petId: finalEvent.petId,
      status: finalEvent.stage,
    };
  }

  throw new Error("journal_musing_stream_incomplete");
}

export async function deleteJournalMusing(musingId: string) {
  const response = await fetch(`/api/v1/musings/${encodeURIComponent(musingId)}`, {
    method: "DELETE",
  });
  const result = (await response.json()) as { error?: string; musingId?: string };

  if (!response.ok) {
    throw new Error(result.error ?? "delete_journal_musing_failed");
  }

  return result;
}

function parseJournalMusingEvent(chunk: string) {
  const dataLine = chunk
    .split("\n")
    .find((line) => line.startsWith("data: "));

  if (!dataLine) {
    return null;
  }

  return JSON.parse(dataLine.slice("data: ".length)) as JournalMusingStreamEvent;
}
