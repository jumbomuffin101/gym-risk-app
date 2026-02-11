import { NextResponse } from "next/server";
import { fetchExternalExercises } from "@/app/lib/exerciseSource";

export const revalidate = 86400;

export async function GET() {
  const items = await fetchExternalExercises();
  return NextResponse.json({ items });
}
