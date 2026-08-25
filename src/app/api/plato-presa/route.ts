import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const relaciones = await prisma.platoPresa.findMany({
      include: { plato: true, presa: true },
      orderBy: { id: "asc" },
    });
    return ok(relaciones);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { plato_id, presa_id } = body;

    if (!plato_id || !presa_id) {
      return badRequest("plato_id y presa_id son obligatorios.");
    }

    const relacion = await prisma.platoPresa.create({
      data: { plato_id: Number(plato_id), presa_id: Number(presa_id) },
      include: { plato: true, presa: true },
    });
    return created(relacion);
  } catch (error) {
    return handleApiError(error);
  }
}
