import { getPool } from "../db/client";
import * as publicThoughtSql from "../db/sql/public-thoughts";

export type PublicThought = {
  id: string;
  publicShareToken: string;
  localDate: string;
  text: string;
  imageGenerationStatus: "not_started" | "in_progress" | "succeeded" | "failed";
  petName: string;
  imagePath: string | null;
  viewCount: number;
};

type PublicThoughtRow = {
  id: string;
  public_share_token: string;
  local_date: string;
  text: string;
  image_generation_status: PublicThought["imageGenerationStatus"];
  pet_name: string;
  image_path: string | null;
  view_count: number;
};

function toPublicThought(row: PublicThoughtRow): PublicThought {
  return {
    id: row.id,
    publicShareToken: row.public_share_token,
    localDate: row.local_date,
    text: row.text,
    imageGenerationStatus: row.image_generation_status,
    petName: row.pet_name,
    imagePath: row.image_path,
    viewCount: row.view_count,
  };
}

export async function getPublicThought(shareToken: string) {
  const result = await getPool().query<PublicThoughtRow>(
    publicThoughtSql.getPublicThought,
    [shareToken],
  );
  const row = result.rows[0];

  return row ? toPublicThought(row) : null;
}

export async function recordPublicThoughtView({
  shareToken,
  referrer,
  userAgent,
}: {
  shareToken: string;
  referrer: string | null;
  userAgent: string | null;
}) {
  const thought = await getPublicThought(shareToken);

  if (!thought) {
    return;
  }

  await getPool().query(publicThoughtSql.recordPublicThoughtView, [
    thought.id,
    referrer?.slice(0, 2048) ?? null,
    userAgent?.slice(0, 1024) ?? null,
  ]);
}
