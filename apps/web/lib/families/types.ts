export type FamilySummary = {
  id: string;
  name: string;
  role: "owner" | "member";
  memberCount: number;
};

export type FamilyMember = {
  hoominId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: "owner" | "member";
  createdAt: Date;
};

export type FamilyInvite = {
  id: string;
  familyId: string;
  familyName: string;
  inviteToken: string;
  createdAt: Date;
  expiresAt: Date | null;
  acceptedAt: Date | null;
};

export type InviteLookup = {
  inviteId: string;
  familyId: string;
  familyName: string;
  inviteToken: string;
  acceptedAt: Date | null;
  expiresAt: Date | null;
  isMember: boolean;
  memberCount: number;
};
