"use client";

import { useState } from "react";
import { productCopy } from "../../lib/product-copy";
import { AppModal } from "../components/app-modal";
import { CopyInviteLink } from "../components/copy-invite-link";

export function InviteMemberDialog({
  createInviteAction,
  familyId,
  latestInviteUrl,
}: {
  createInviteAction: (formData: FormData) => void | Promise<void>;
  familyId: string;
  latestInviteUrl: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="primary-link button-link"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {productCopy.family.inviteMemberButton}
      </button>
      {isOpen ? (
        <AppModal
          labelledBy="invite-member-heading"
          onDismiss={() => setIsOpen(false)}
        >
          <div className="modal-stack">
            <h2 id="invite-member-heading">{productCopy.family.inviteHeading}</h2>
            <form action={createInviteAction}>
              <input name="familyId" type="hidden" value={familyId} />
              <button className="primary-button" type="submit">
                {productCopy.family.createInviteButton}
              </button>
            </form>
            {latestInviteUrl ? (
              <CopyInviteLink inviteUrl={latestInviteUrl} />
            ) : null}
          </div>
        </AppModal>
      ) : null}
    </>
  );
}
