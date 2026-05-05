import { getPool } from "../db/client";
import * as publicThoughtSql from "../db/sql/public-thoughts";

export type PublicThought = {
  id: string;
  publicShareToken: string;
  localDate: string;
  createdAt: string;
  source: "daily" | "journal";
  text: string;
  journalText: string | null;
  imageGenerationStatus: "not_started" | "in_progress" | "succeeded" | "failed";
  petName: string;
  imagePath: string | null;
  journalPhotos: {
    id: string;
    imagePath: string;
    contentType: string | null;
  }[];
  viewCount: number;
};

type PublicThoughtRow = {
  id: string;
  public_share_token: string;
  local_date: string;
  created_at: string;
  source: PublicThought["source"];
  text: string;
  journal_text: string | null;
  image_generation_status: PublicThought["imageGenerationStatus"];
  pet_name: string;
  image_path: string | null;
  journal_photos: PublicThought["journalPhotos"];
  view_count: number;
};

function toPublicThought(row: PublicThoughtRow): PublicThought {
  return {
    id: row.id,
    publicShareToken: row.public_share_token,
    localDate: row.local_date,
    createdAt: row.created_at,
    source: row.source,
    text: row.text,
    journalText: row.journal_text,
    imageGenerationStatus: row.image_generation_status,
    petName: row.pet_name,
    imagePath: row.image_path,
    journalPhotos: row.journal_photos ?? [],
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

export async function getPublicThoughtCoverImage({
  shareToken,
  coverFileId,
}: {
  shareToken: string;
  coverFileId: string | null;
}) {
  if (
    coverFileId &&
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      coverFileId,
    )
  ) {
    return null;
  }

  const result = await getPool().query<{
    object_key: string;
    content_type: string | null;
  }>(publicThoughtSql.getPublicThoughtCoverImage, [shareToken, coverFileId]);

  return result.rows[0] ?? null;
}
