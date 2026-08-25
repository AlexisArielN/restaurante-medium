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
    const mesa = await prisma.mesa.findUnique({
      where: { id },
      include: { pedidos: true },
    });
    if (!mesa) return notFound("Mesa no encontrada.");
    return ok(mesa);
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
    const { numero, estado } = body;

    const mesa = await prisma.mesa.update({
      where: { id },
      data: {
        ...(numero !== undefined ? { numero: Number(numero) } : {}),
        ...(estado !== undefined ? { estado: Boolean(estado) } : {}),
      },
    });
    return ok(mesa);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Id inválido.");

  try {
    await prisma.mesa.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
