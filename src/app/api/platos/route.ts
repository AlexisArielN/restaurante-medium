import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const platos = await prisma.plato.findMany({
      orderBy: { nombre: "asc" },
      include: { presas: { include: { presa: true } } },
    });
    return ok(platos);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre, precio, cantidad_disponible, presa_ids } = body;

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return badRequest("El nombre del plato es obligatorio.");
    }
    if (precio === undefined || Number.isNaN(Number(precio)) || Number(precio) < 0) {
      return badRequest("El precio es obligatorio y debe ser un número válido.");
    }
    if (
      cantidad_disponible === undefined ||
      !Number.isInteger(Number(cantidad_disponible)) ||
      Number(cantidad_disponible) < 0
    ) {
      return badRequest("La cantidad disponible es obligatoria y debe ser un entero válido.");
    }

    const plato = await prisma.plato.create({
      data: {
        nombre: nombre.trim(),
        precio: Number(precio),
        cantidad_disponible: Number(cantidad_disponible),
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

    return created(plato);
  } catch (error) {
    return handleApiError(error);
  }
}
