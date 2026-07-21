import "server-only";

import { put, del, get, list } from "@vercel/blob";
import { ACCEPTED_RESUME_TYPE } from "@/lib/schemas/resume";

// The only module that talks to the blob vendor. Resumes are personal data, so
// every object is written private and read back through an ownership-scoped
// route — putting that policy here means no call site can forget it.
export async function putResume(
  path: string,
  file: File,
): Promise<{ url: string }> {
  const blob = await put(path, file, {
    access: "private",
    addRandomSuffix: true,
    contentType: ACCEPTED_RESUME_TYPE,
  });
  return { url: blob.url };
}

export async function deleteBlob(url: string | string[]): Promise<void> {
  await del(url);
}

// For the paths where losing the blob is better than failing the user's action:
// the caller has already decided the database row is what matters.
export async function deleteBlobQuietly(url: string): Promise<void> {
  try {
    await del(url);
  } catch {
    // the caller's row removal is the operation the user is waiting on
  }
}

export function getBlob(url: string) {
  return get(url, { access: "private" });
}

export function listBlobs(options: { prefix: string; cursor?: string }) {
  return list({ ...options, mode: "expanded" });
}
