import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { noContent, badRequest, handleApiError, parseId } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Id inválido.");

  try {
    await prisma.platoPresa.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
