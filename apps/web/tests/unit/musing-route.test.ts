import { describe, expect, it } from "vitest";
import {
  authMocks,
  importMusingRouteWithMocks,
  petStoreMocks,
  resetUnitMocks,
  testSession,
} from "./support/mocks";

describe("DELETE /api/v1/musings/:musingId", () => {
  it("requires a session", async () => {
    resetUnitMocks();
    authMocks.getSession.mockResolvedValue(null);
    const { DELETE } = await importMusingRouteWithMocks();

    const response = await DELETE(new Request("https://app.test", { method: "DELETE" }), {
      params: Promise.resolve({ musingId: "musing-1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "unauthorized" });
  });

  it("deletes the journal musing for the signed-in hoomin", async () => {
    resetUnitMocks();
    authMocks.getSession.mockResolvedValue(testSession({ hoominId: "hoomin-1" }));
    petStoreMocks.deleteJournalThoughtForHoomin.mockResolvedValue(undefined);
    const { DELETE } = await importMusingRouteWithMocks();

    const response = await DELETE(new Request("https://app.test", { method: "DELETE" }), {
      params: Promise.resolve({ musingId: "musing-1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ musingId: "musing-1" });
    expect(petStoreMocks.deleteJournalThoughtForHoomin).toHaveBeenCalledWith({
      hoominId: "hoomin-1",
      musingId: "musing-1",
    });
  });
});
