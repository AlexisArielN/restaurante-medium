import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, noContent, badRequest, notFound, handleApiError, parseId } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Id inválido.");

  try {
    const presa = await prisma.presa.findUnique({ where: { id } });
    if (!presa) return notFound("Presa no encontrada.");
    return ok(presa);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Id inválido.");

  try {
    const body = await req.json();
    const { nombre } = body;
    if (nombre !== undefined && (!nombre || !String(nombre).trim())) {
      return badRequest("El nombre no puede estar vacío.");
    }

    const presa = await prisma.presa.update({
      where: { id },
      data: { ...(nombre !== undefined ? { nombre: String(nombre).trim() } : {}) },
    });
    return ok(presa);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Id inválido.");

  try {
    await prisma.presa.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
