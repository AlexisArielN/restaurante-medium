"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { apiFetch, formatCurrency, formatDate } from "@/lib/client";
import type { Pedido, Mesa } from "@/types";
import {
  Button,
  Card,
  Select,
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

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mesaId, setMesaId] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargarDatos() {
    setLoading(true);
    setError("");
    try {
      const [pedidosData, mesasData] = await Promise.all([
        apiFetch<Pedido[]>("/api/pedidos"),
        apiFetch<Mesa[]>("/api/mesas"),
      ]);
      setPedidos(pedidosData);
      setMesas(mesasData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar pedidos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function abrirNuevo() {
    setMesaId("");
    setFormError("");
    setMostrarForm(true);
  }

  async function crearPedido(e: FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!mesaId) return setFormError("Seleccioná una mesa.");

    setGuardando(true);
    try {
      await apiFetch("/api/pedidos", {
        method: "POST",
        body: JSON.stringify({ mesa_id: Number(mesaId) }),
      });
      setMostrarForm(false);
      await cargarDatos();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al crear el pedido.");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(pedido: Pedido) {
    if (!confirm(`¿Eliminar el pedido #${pedido.id}? Se restaurará el stock reservado.`)) return;
    try {
      await apiFetch(`/api/pedidos/${pedido.id}`, { method: "DELETE" });
      await cargarDatos();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar el pedido.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Pedidos activos e históricos por mesa."
        action={<Button onClick={abrirNuevo}>+ Nuevo pedido</Button>}
      />

      <ErrorBanner message={error} />

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={crearPedido} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>Mesa</Label>
              <Select value={mesaId} onChange={(e) => setMesaId(e.target.value)}>
                <option value="">Seleccioná una mesa</option>
                {mesas.map((mesa) => (
                  <option key={mesa.id} value={mesa.id} disabled={!mesa.estado}>
                    Mesa {mesa.numero} {mesa.estado ? "(libre)" : "(ocupada)"}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={guardando}>
                {guardando ? "Creando..." : "Crear pedido"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)}>
                Cancelar
              </Button>
            </div>
            {formError && <p className="text-sm text-red-400">{formError}</p>}
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Cargando pedidos...</p>
      ) : pedidos.length === 0 ? (
        <EmptyState message="Todavía no hay pedidos registrados." />
      ) : (
        <Card className="divide-y divide-neutral-800 p-0">
          {pedidos.map((pedido) => (
            <div
              key={pedido.id}
              className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">Pedido #{pedido.id}</span>
                  <Badge tone={ESTADO_TONE[pedido.estado] ?? "neutral"}>
                    {pedido.estado.replace("_", " ")}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  Mesa {pedido.mesa?.numero ?? pedido.mesa_id} · {formatDate(pedido.fecha)} ·{" "}
                  {pedido.detalles?.length ?? 0} ítem(s)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-orange-500">
                  {formatCurrency(pedido.total)}
                </span>
                <Link href={`/pedidos/${pedido.id}`}>
                  <Button variant="secondary">Ver detalle</Button>
                </Link>
                <Button variant="danger" onClick={() => eliminar(pedido)}>
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
