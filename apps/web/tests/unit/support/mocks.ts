import { vi } from "vitest";
import type { AuthSession } from "../../../lib/auth/session";

export const generationMocks = {
  generateJournalThought: vi.fn(),
};

export const petStoreMocks = {
  choosePetAvatar: vi.fn(),
  createPetWithPhoto: vi.fn(),
  deleteJournalThoughtForHoomin: vi.fn(),
  updatePetProfile: vi.fn(),
};

export const authMocks = {
  getSession: vi.fn<() => Promise<AuthSession | null>>(),
};

export function resetUnitMocks() {
  generationMocks.generateJournalThought.mockReset();
  petStoreMocks.choosePetAvatar.mockReset();
  petStoreMocks.createPetWithPhoto.mockReset();
  petStoreMocks.deleteJournalThoughtForHoomin.mockReset();
  petStoreMocks.updatePetProfile.mockReset();
  authMocks.getSession.mockReset();
}

export function mockPetGenerationModule() {
  vi.doMock("../../../lib/pets/generation", () => ({
    generateJournalThought: generationMocks.generateJournalThought,
  }));
}

export function mockPetStoreModule() {
  vi.doMock("../../../lib/pets/store", () => ({
    choosePetAvatar: petStoreMocks.choosePetAvatar,
    createPetWithPhoto: petStoreMocks.createPetWithPhoto,
    deleteJournalThoughtForHoomin: petStoreMocks.deleteJournalThoughtForHoomin,
    updatePetProfile: petStoreMocks.updatePetProfile,
  }));
}

export function mockAuthSessionModule() {
  vi.doMock("../../../lib/auth/session", () => ({
    getSession: authMocks.getSession,
  }));
}

export function testSession(overrides: Partial<AuthSession> = {}): AuthSession {
  return {
    email: "hoomin@example.test",
    expiresAt: Date.now() + 60_000,
    hoominId: "hoomin-1",
    name: "Test Hoomin",
    picture: null,
    ...overrides,
  };
}

export async function importPetsClientApiWithMocks() {
  vi.resetModules();
  mockPetGenerationModule();
  mockPetStoreModule();

  return import("../../../lib/client-api/pets");
}

export async function importJournalRouteWithMocks() {
  vi.resetModules();
  mockAuthSessionModule();
  mockPetGenerationModule();
  mockPetStoreModule();

  return import(
    "../../../app/api/v1/families/[familyId]/pets/[petId]/journal-musings/route"
  );
}

export async function importMusingRouteWithMocks() {
  vi.resetModules();
  mockAuthSessionModule();
  mockPetGenerationModule();
  mockPetStoreModule();

  return import("../../../app/api/v1/musings/[musingId]/route");
}

export function imageFile({
  name = "pet.jpg",
  type = "image/jpeg",
}: {
  name?: string;
  type?: string;
} = {}) {
  return new File(["pet-photo"], name, { type });
}
