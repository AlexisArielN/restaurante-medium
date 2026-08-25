import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, handleApiError } from "@/lib/api";

export async function GET() {
  try {
    const presas = await prisma.presa.findMany({ orderBy: { nombre: "asc" } });
    return ok(presas);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nombre } = body;

    if (!nombre || typeof nombre !== "string" || !nombre.trim()) {
      return badRequest("El nombre de la presa es obligatorio.");
    }

    const presa = await prisma.presa.create({ data: { nombre: nombre.trim() } });
    return created(presa);
  } catch (error) {
    return handleApiError(error);
  }
}
