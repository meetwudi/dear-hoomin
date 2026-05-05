import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { imageFile } from "./support/mocks";

const createJournalMusingMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("../../lib/client-api/journal-musings", () => ({
  createJournalMusing: createJournalMusingMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

describe("JournalComposer", () => {
  it("shows selected photo preview and submits optional text as null", async () => {
    createJournalMusingMock.mockResolvedValue({
      familyId: "family-1",
      musingId: "musing-1",
      petId: "pet-1",
      status: "succeeded",
    });
    const { JournalComposer } = await import("../../app/components/journal-composer");
    const user = userEvent.setup();
    const photo = imageFile({ name: "mochi.jpg" });

    render(
      <JournalComposer
        defaultPetId="pet-1"
        familyId="family-1"
        pets={[{ id: "pet-1", name: "Mochi" }]}
      />,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, photo);

    await waitFor(() => {
      expect(screen.getByAltText("Selected photo 1")).toBeTruthy();
    });
    expect(screen.getByPlaceholderText("what's on Mochi's mind?")).toBeTruthy();

    const submitButton = screen.getByRole("button", { name: "Make a journal musing" });
    fireEvent.submit(submitButton.closest("form") as HTMLFormElement);

    await waitFor(() => {
      expect(createJournalMusingMock).toHaveBeenCalledWith(
        {
          familyId: "family-1",
          journalText: null,
          petId: "pet-1",
          photos: [photo],
        },
        {
          onEvent: expect.any(Function),
        },
      );
    });
    expect(refreshMock).toHaveBeenCalled();
  });

  it("shows pending button text while submission is running", async () => {
    let resolveSubmit: (value: unknown) => void = () => {};
    createJournalMusingMock.mockReturnValue(
      new Promise((resolve) => {
        resolveSubmit = resolve;
      }),
    );
    const { JournalComposer } = await import("../../app/components/journal-composer");
    const user = userEvent.setup();

    render(
      <JournalComposer
        defaultPetId="pet-1"
        familyId="family-1"
        pets={[{ id: "pet-1", name: "Mochi" }]}
      />,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, imageFile());
    fireEvent.submit(
      screen
        .getByRole("button", { name: "Make a journal musing" })
        .closest("form") as HTMLFormElement,
    );

    await waitFor(() => {
      const pendingButton = screen.getByRole("button", { name: "Woofing..." });
      expect((pendingButton as HTMLButtonElement).disabled).toBe(true);
    });

    resolveSubmit({
      familyId: "family-1",
      musingId: "musing-1",
      petId: "pet-1",
      status: "succeeded",
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Make a journal musing" })).toBeTruthy();
    });
  });

  it("submits with the keyboard shortcut", async () => {
    createJournalMusingMock.mockResolvedValue({
      familyId: "family-1",
      musingId: "musing-1",
      petId: "pet-1",
      status: "succeeded",
    });
    const { JournalComposer } = await import("../../app/components/journal-composer");
    const user = userEvent.setup();
    const photo = imageFile({ name: "mochi.jpg" });

    render(
      <JournalComposer
        defaultPetId="pet-1"
        familyId="family-1"
        pets={[{ id: "pet-1", name: "Mochi" }]}
      />,
    );

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, photo);
    const note = screen.getByLabelText("Journal note");
    await user.type(note, "thinking about snacks");
    fireEvent.keyDown(note, {
      key: "Enter",
      metaKey: true,
    });

    await waitFor(() => {
      expect(createJournalMusingMock).toHaveBeenCalledWith(
        {
          familyId: "family-1",
          journalText: "thinking about snacks",
          petId: "pet-1",
          photos: [photo],
        },
        {
          onEvent: expect.any(Function),
        },
      );
    });
  });
});
