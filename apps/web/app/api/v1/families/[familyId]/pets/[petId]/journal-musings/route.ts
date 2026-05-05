import {
  apiErrorResponse,
  apiHandler,
  optionalFormString,
  requireApiContext,
} from "../../../../../../../../lib/client-api/http";
import {
  createJournalMusingCapability,
  createJournalMusingEventsCapability,
} from "../../../../../../../../lib/client-api/pets";

type JournalMusingsRouteProps = {
  params: Promise<{
    familyId: string;
    petId: string;
  }>;
};

export async function POST(request: Request, { params }: JournalMusingsRouteProps) {
  try {
    const context = await requireApiContext();
    const { familyId, petId } = await params;
    const formData = await request.formData();
    const photos = formData
      .getAll("photos")
      .filter((value): value is File => value instanceof File && value.size > 0);
    const input = {
      familyId,
      petId,
      journalText: optionalFormString(formData, "journalText"),
      photos,
    };

    if (request.headers.get("accept")?.includes("text/event-stream")) {
      const encoder = new TextEncoder();

      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              for await (const event of createJournalMusingEventsCapability(context, input)) {
                controller.enqueue(
                  encoder.encode(`event: ${event.stage}\ndata: ${JSON.stringify(event)}\n\n`),
                );
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : "journal_musing_failed";
              controller.enqueue(
                encoder.encode(
                  `event: failed\ndata: ${JSON.stringify({
                    error: message,
                    familyId,
                    musingId: null,
                    petId,
                    stage: "failed",
                  })}\n\n`,
                ),
              );
            } finally {
              controller.close();
            }
          },
        }),
        {
          headers: {
            "Cache-Control": "no-cache, no-transform",
            "Content-Type": "text/event-stream; charset=utf-8",
            "X-Accel-Buffering": "no",
          },
        },
      );
    }

    return apiHandler(async () => createJournalMusingCapability(context, input));
  } catch (error) {
    return apiErrorResponse(error);
  }
}
