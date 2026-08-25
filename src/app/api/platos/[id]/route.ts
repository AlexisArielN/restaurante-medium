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
    const plato = await prisma.plato.findUnique({
      where: { id },
      include: { presas: { include: { presa: true } } },
    });
    if (!plato) return notFound("Plato no encontrado.");
    return ok(plato);
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
    const { nombre, precio, cantidad_disponible, presa_ids } = body;

    if (nombre !== undefined && (!nombre || !String(nombre).trim())) {
      return badRequest("El nombre no puede estar vacío.");
    }
    if (precio !== undefined && (Number.isNaN(Number(precio)) || Number(precio) < 0)) {
      return badRequest("El precio debe ser un número válido.");
    }
    if (
      cantidad_disponible !== undefined &&
      (!Number.isInteger(Number(cantidad_disponible)) || Number(cantidad_disponible) < 0)
    ) {
      return badRequest("La cantidad disponible debe ser un entero válido.");
    }

    // Si se envía presa_ids, reemplazamos completamente las relaciones existentes.
    if (Array.isArray(presa_ids)) {
      await prisma.platoPresa.deleteMany({ where: { plato_id: id } });
    }

    const plato = await prisma.plato.update({
      where: { id },
      data: {
        ...(nombre !== undefined ? { nombre: String(nombre).trim() } : {}),
        ...(precio !== undefined ? { precio: Number(precio) } : {}),
        ...(cantidad_disponible !== undefined
          ? { cantidad_disponible: Number(cantidad_disponible) }
          : {}),
        ...(Array.isArray(presa_ids) && presa_ids.length > 0
          ? {
              presas: {
                create: presa_ids.map((presa_id: number) => ({
                  presa: { connect: { id: Number(presa_id) } },
                })),
              },
            }
          : {}),
      },
      include: { presas: { include: { presa: true } } },
    });

    return ok(plato);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Id inválido.");

  try {
    await prisma.plato.delete({ where: { id } });
    return noContent();
  } catch (error) {
    return handleApiError(error);
  }
}
