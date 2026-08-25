"use client";

import { useEffect, useState, FormEvent, use } from "react";
import Link from "next/link";
import { apiFetch, formatCurrency, formatDate } from "@/lib/client";
import type { Pedido, Plato, EstadoPedido } from "@/types";
import { ESTADOS_PEDIDO } from "@/types";
import {
  Button,
  Card,
  Select,
  Input,
  Label,
  Badge,
  PageHeader,
  EmptyState,
  ErrorBanner,
} from "@/components/ui";

const ESTADO_TONE: Record<string, "yellow" | "blue" | "green" | "red"> = {
  pendiente: "yellow",
  en_preparacion: "blue",
  entregado: "green",
  cancelado: "red",
};

export default function PedidoDetallePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");

  const [platoId, setPlatoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [agregando, setAgregando] = useState(false);

  async function cargarDatos() {
    setLoading(true);
    setError("");
    try {
      const [pedidoData, platosData] = await Promise.all([
        apiFetch<Pedido>(`/api/pedidos/${id}`),
        apiFetch<Plato[]>("/api/platos"),
      ]);
      setPedido(pedidoData);
      setPlatos(platosData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el pedido.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function agregarDetalle(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!platoId) return setFormError("Seleccioná un plato.");
    if (!cantidad || Number(cantidad) <= 0) return setFormError("La cantidad debe ser mayor a 0.");

    setAgregando(true);
    try {
      await apiFetch(`/api/pedidos/${id}/detalles`, {
        method: "POST",
        body: JSON.stringify({ plato_id: Number(platoId), cantidad: Number(cantidad) }),
      });
      setPlatoId("");
      setCantidad("1");
      await cargarDatos();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "No se pudo agregar el ítem.");
    } finally {
      setAgregando(false);
    }
  }

  async function eliminarDetalle(detalleId: number) {
    if (!confirm("¿Quitar este ítem del pedido?")) return;
    try {
      await apiFetch(`/api/detalles/${detalleId}`, { method: "DELETE" });
      await cargarDatos();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar el ítem.");
    }
  }

  async function cambiarEstado(estado: EstadoPedido) {
    try {
      await apiFetch(`/api/pedidos/${id}`, {
        method: "PUT",
        body: JSON.stringify({ estado }),
      });
      await cargarDatos();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo actualizar el estado.");
    }
  }

  if (loading) return <p className="text-sm text-neutral-500">Cargando pedido...</p>;
  if (error || !pedido) return <ErrorBanner message={error || "Pedido no encontrado."} />;

  return (
    <div>
      <Link href="/pedidos" className="mb-4 inline-block text-sm text-neutral-400 hover:text-white">
        ← Volver a pedidos
      </Link>

      <PageHeader
        title={`Pedido #${pedido.id}`}
        description={`Mesa ${pedido.mesa?.numero ?? pedido.mesa_id} · ${formatDate(pedido.fecha)}`}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={ESTADO_TONE[pedido.estado] ?? "neutral"}>
              {pedido.estado.replace("_", " ")}
            </Badge>
            <Select
              value={pedido.estado}
              onChange={(e) => cambiarEstado(e.target.value as EstadoPedido)}
              className="w-auto"
            >
              {ESTADOS_PEDIDO.map((estado) => (
                <option key={estado} value={estado}>
                  {estado.replace("_", " ")}
                </option>
              ))}
            </Select>
          </div>
        }
      />

      <Card className="mb-6">
        <form onSubmit={agregarDetalle} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <Label>Plato</Label>
            <Select value={platoId} onChange={(e) => setPlatoId(e.target.value)}>
              <option value="">Seleccioná un plato</option>
              {platos.map((plato) => (
                <option key={plato.id} value={plato.id} disabled={plato.cantidad_disponible <= 0}>
                  {plato.nombre} — {formatCurrency(plato.precio)} (
                  {plato.cantidad_disponible > 0
                    ? `${plato.cantidad_disponible} disp.`
                    : "sin stock"}
                  )
                </option>
              ))}
            </Select>
          </div>
          <div className="w-full sm:w-32">
            <Label>Cantidad</Label>
            <Input
              type="number"
              min={1}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={agregando}>
            {agregando ? "Agregando..." : "Agregar ítem"}
          </Button>
          {formError && <p className="text-sm text-red-400">{formError}</p>}
        </form>
      </Card>

      {!pedido.detalles || pedido.detalles.length === 0 ? (
        <EmptyState message="Este pedido todavía no tiene ítems." />
      ) : (
        <Card className="divide-y divide-neutral-800 p-0">
          {pedido.detalles.map((detalle) => (
            <div key={detalle.id} className="flex items-center justify-between px-5 py-3">
              <div>
                <p className="text-sm font-medium text-neutral-100">{detalle.plato?.nombre}</p>
                <p className="text-xs text-neutral-500">
                  {detalle.cantidad} × {formatCurrency(detalle.plato?.precio ?? 0)}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-orange-500">
                  {formatCurrency(detalle.subtotal)}
                </span>
                <Button variant="danger" onClick={() => eliminarDetalle(detalle.id)}>
                  Quitar
                </Button>
              </div>
            </div>
          ))}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-sm font-medium text-neutral-300">Total</span>
            <span className="text-lg font-semibold text-white">
              {formatCurrency(pedido.total)}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
