import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { ok, created, badRequest, handleApiError } from "@/lib/api";
import { ESTADOS_PEDIDO } from "@/types";

export async function GET() {
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: { fecha: "desc" },
      include: {
        mesa: true,
        detalles: { include: { plato: true } },
      },
    });
    return ok(pedidos);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mesa_id, estado } = body;

    if (!mesa_id || Number.isNaN(Number(mesa_id))) {
      return badRequest("mesa_id es obligatorio.");
    }
    if (estado !== undefined && !ESTADOS_PEDIDO.includes(estado)) {
      return badRequest(`estado debe ser uno de: ${ESTADOS_PEDIDO.join(", ")}`);
    }

    const mesa = await prisma.mesa.findUnique({ where: { id: Number(mesa_id) } });
    if (!mesa) return badRequest("La mesa indicada no existe.");
    if (!mesa.estado) {
      return badRequest(
        `La mesa ${mesa.numero} está ocupada. No se puede crear un nuevo pedido hasta que se libere.`
      );
    }

    const pedido = await prisma.pedido.create({
      data: {
        mesa_id: Number(mesa_id),
        estado: estado ?? "pendiente",
      },
      include: { mesa: true, detalles: true },
    });

    return created(pedido);
  } catch (error) {
    return handleApiError(error);
  }
}
