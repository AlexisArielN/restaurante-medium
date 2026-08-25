import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, noContent, badRequest, notFound, handleApiError, parseId } from "@/lib/api";
import { ESTADOS_PEDIDO } from "@/types";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Id inválido.");

  try {
    const pedido = await prisma.pedido.findUnique({
      where: { id },
      include: { mesa: true, detalles: { include: { plato: true } } },
    });
    if (!pedido) return notFound("Pedido no encontrado.");
    return ok(pedido);
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
    const { mesa_id, estado } = body;

    if (estado !== undefined && !ESTADOS_PEDIDO.includes(estado)) {
      return badRequest(`estado debe ser uno de: ${ESTADOS_PEDIDO.join(", ")}`);
    }

    const pedido = await prisma.$transaction(async (tx) => {
      const actualizado = await tx.pedido.update({
        where: { id },
        data: {
          ...(mesa_id !== undefined ? { mesa_id: Number(mesa_id) } : {}),
          ...(estado !== undefined ? { estado } : {}),
        },
        include: { mesa: true, detalles: { include: { plato: true } } },
      });

      // La mesa se ocupa cuando el pedido entra en preparación, y se libera
      // cuando el pedido se cancela o se entrega (queda lista para el siguiente cliente).
      if (estado === "en_preparacion" || estado === "entregado") {
        await tx.mesa.update({ where: { id: actualizado.mesa_id }, data: { estado: false } });
      } else if (estado === "cancelado" ) {
        await tx.mesa.update({ where: { id: actualizado.mesa_id }, data: { estado: true } });
      }

      if (estado !== undefined) {
        return tx.pedido.findUniqueOrThrow({
          where: { id },
          include: { mesa: true, detalles: { include: { plato: true } } },
        });
      }
      return actualizado;
    });

    return ok(pedido);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id: rawId } = await params;
  const id = parseId(rawId);
  if (!id) return badRequest("Id inválido.");

  try {
    await prisma.$transaction(async (tx) => {
      const pedido = await tx.pedido.findUnique({ where: { id } });
      if (!pedido) throw new Error("PEDIDO_NOT_FOUND");

      const detalles = await tx.detallePedido.findMany({ where: { pedido_id: id } });

      // Devolvemos el stock reservado por cada detalle antes de borrar el pedido.
      for (const detalle of detalles) {
        await tx.plato.update({
          where: { id: detalle.plato_id },
          data: { cantidad_disponible: { increment: detalle.cantidad } },
        });
      }

      await tx.detallePedido.deleteMany({ where: { pedido_id: id } });
      await tx.pedido.delete({ where: { id } });

      // Liberamos la mesa que este pedido tenía ocupada.
      await tx.mesa.update({ where: { id: pedido.mesa_id }, data: { estado: true } });
    });

    return noContent();
  } catch (error) {
    if (error instanceof Error && error.message === "PEDIDO_NOT_FOUND") {
      return notFound("Pedido no encontrado.");
    }
    return handleApiError(error);
  }
}
