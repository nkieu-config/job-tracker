"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { deleteBlobQuietly } from "@/server/blob";
import { requireSession } from "@/server/get-session";
import {
  getResumeFileUrl,
  deleteResumeForUser,
} from "@/server/data/resumes";

export async function deleteResume(id: string): Promise<void> {
  const session = await requireSession();

  // Scope by userId so a user can only delete their own resume.
  const resume = await getResumeFileUrl(id, session.user.id);
  if (!resume) {
    redirect("/dashboard/resumes");
  }

  if (resume.fileUrl) {
    await deleteBlobQuietly(resume.fileUrl);
  }

  await deleteResumeForUser(id, session.user.id);

  revalidatePath("/dashboard/resumes");
  redirect("/dashboard/resumes");
}
