import { prisma } from "@/app/lib/prisma";

let extendedFieldSupportCache: boolean | null = null;
let extendedFieldSupportPromise: Promise<boolean> | null = null;

export async function supportsExtendedSetEntryFields() {
  if (extendedFieldSupportCache !== null) {
    return extendedFieldSupportCache;
  }

  if (extendedFieldSupportPromise) {
    return extendedFieldSupportPromise;
  }

  extendedFieldSupportPromise = prisma.setEntry
    .findFirst({
      select: {
        id: true,
        durationSeconds: true,
        distanceMeters: true,
        notes: true,
      },
    })
    .then(() => {
      extendedFieldSupportCache = true;
      return true;
    })
    .catch((error) => {
      if (!isMissingSetEntryColumnError(error)) {
        throw error;
      }

      extendedFieldSupportCache = false;
      return false;
    })
    .finally(() => {
      extendedFieldSupportPromise = null;
    });

  return extendedFieldSupportPromise;
}

export function markExtendedSetEntryFieldsUnsupported() {
  extendedFieldSupportCache = false;
  extendedFieldSupportPromise = null;
}

export function isMissingSetEntryColumnError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return message.includes("durationSeconds") || message.includes("distanceMeters") || message.includes("notes");
}
