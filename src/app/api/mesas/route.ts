import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const mesas = await prisma.mesa.findMany({ orderBy: { numero: "asc" } });
    return ok(mesas);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { numero, estado } = body;

    if (numero === undefined || numero === null || Number.isNaN(Number(numero))) {
      return badRequest("El número de mesa es obligatorio y debe ser numérico.");
    }

    const mesa = await prisma.mesa.create({
      data: {
        numero: Number(numero),
        estado: estado === undefined ? true : Boolean(estado),
      },
    });
    return created(mesa);
  } catch (error) {
    return handleApiError(error);
  }
}
