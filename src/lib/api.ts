import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function notFound(message = "Recurso no encontrado") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/**
 * Traduce errores conocidos de Prisma a respuestas HTTP legibles.
 */
export function handleApiError(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Ya existe un registro con ese valor único." },
        { status: 409 }
      );
    }
    if (error.code === "P2003") {
      return NextResponse.json(
        {
          error:
            "No se puede completar la operación: hay registros relacionados que lo impiden (clave foránea).",
        },
        { status: 409 }
      );
    }
    if (error.code === "P2025") {
      return NextResponse.json(
        { error: "El registro solicitado no existe." },
        { status: 404 }
      );
    }
  }

  console.error(error);
  return NextResponse.json(
    { error: "Error interno del servidor." },
    { status: 500 }
  );
}

export function parseId(raw: string): number | null {
  const id = Number(raw);
  if (!Number.isInteger(id) || id <= 0) return null;
  return id;
}
