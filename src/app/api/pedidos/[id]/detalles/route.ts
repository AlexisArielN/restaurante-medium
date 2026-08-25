import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, notFound, handleApiError, parseId } from "@/lib/api";

interface Params {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const pedidoId = parseId(rawId);
  if (!pedidoId) return badRequest("Id de pedido inválido.");

  try {
    const body = await req.json();
    const { plato_id, cantidad } = body;

    if (!plato_id || !cantidad || !Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
      return badRequest("plato_id y cantidad (entero positivo) son obligatorios.");
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({ where: { id: pedidoId } });
      if (!pedido) throw new Error("PEDIDO_NOT_FOUND");

      const plato = await tx.plato.findUnique({ where: { id: Number(plato_id) } });
      if (!plato) throw new Error("PLATO_NOT_FOUND");
      if (plato.cantidad_disponible < Number(cantidad)) {
        throw new Error("STOCK_INSUFICIENTE");
      }

      const subtotal = Number(plato.precio) * Number(cantidad);

      const detalle = await tx.detallePedido.create({
        data: {
          pedido_id: pedidoId,
          plato_id: Number(plato_id),
          cantidad: Number(cantidad),
          subtotal,
        },
        include: { plato: true },
      });

      await tx.plato.update({
        where: { id: Number(plato_id) },
        data: { cantidad_disponible: { decrement: Number(cantidad) } },
      });

      await tx.pedido.update({
        where: { id: pedidoId },
        data: { total: { increment: subtotal } },
      });

      return detalle;
    });

    return created(resultado);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "PEDIDO_NOT_FOUND") return notFound("Pedido no encontrado.");
      if (error.message === "PLATO_NOT_FOUND") return notFound("Plato no encontrado.");
      if (error.message === "STOCK_INSUFICIENTE")
        return badRequest("No hay suficiente stock disponible para ese plato.");
    }
    return handleApiError(error);
  }
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const pedidoId = parseId(rawId);
  if (!pedidoId) return badRequest("Id de pedido inválido.");

  try {
    const detalles = await prisma.detallePedido.findMany({
      where: { pedido_id: pedidoId },
      include: { plato: true },
    });
    return ok(detalles);
  } catch (error) {
    return handleApiError(error);
  }
}
