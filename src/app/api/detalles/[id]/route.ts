import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, noContent, badRequest, notFound, handleApiError, parseId } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Id inválido.");

  try {
    const body = await req.json();
    const { cantidad } = body;

    if (!cantidad || !Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
      return badRequest("cantidad debe ser un entero positivo.");
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const detalle = await tx.detallePedido.findUnique({ where: { id }, include: { plato: true } });
      if (!detalle) throw new Error("DETALLE_NOT_FOUND");

      const diferencia = Number(cantidad) - detalle.cantidad; // positivo = pide más, negativo = pide menos

      if (diferencia > 0 && detalle.plato.cantidad_disponible < diferencia) {
        throw new Error("STOCK_INSUFICIENTE");
      }

      const nuevoSubtotal = Number(detalle.plato.precio) * Number(cantidad);
      const diferenciaTotal = nuevoSubtotal - Number(detalle.subtotal);

      const actualizado = await tx.detallePedido.update({
        where: { id },
        data: { cantidad: Number(cantidad), subtotal: nuevoSubtotal },
        include: { plato: true },
      });

      await tx.plato.update({
        where: { id: detalle.plato_id },
        data: { cantidad_disponible: { decrement: diferencia } },
      });

      await tx.pedido.update({
        where: { id: detalle.pedido_id },
        data: { total: { increment: diferenciaTotal } },
      });

      return actualizado;
    });

    return ok(resultado);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "DETALLE_NOT_FOUND") return notFound("Detalle no encontrado.");
      if (error.message === "STOCK_INSUFICIENTE")
        return badRequest("No hay suficiente stock disponible para esa cantidad.");
    }
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Id inválido.");

  try {
    await prisma.$transaction(async (tx) => {
      const detalle = await tx.detallePedido.findUnique({ where: { id } });
      if (!detalle) throw new Error("DETALLE_NOT_FOUND");

      await tx.plato.update({
        where: { id: detalle.plato_id },
        data: { cantidad_disponible: { increment: detalle.cantidad } },
      });

      await tx.pedido.update({
        where: { id: detalle.pedido_id },
        data: { total: { decrement: Number(detalle.subtotal) } },
      });

      await tx.detallePedido.delete({ where: { id } });
    });

    return noContent();
  } catch (error) {
    if (error instanceof Error && error.message === "DETALLE_NOT_FOUND") {
      return notFound("Detalle no encontrado.");
    }
    return handleApiError(error);
  }
}
