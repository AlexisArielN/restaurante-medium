"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/client";
import type { Mesa, Pedido } from "@/types";
import {
  Button,
  Card,
  Input,
  Label,
  Badge,
  PageHeader,
  EmptyState,
  ErrorBanner,
} from "@/components/ui";

// Estados de pedido que consideramos "en curso" para asociarlos a una mesa ocupada.
// (todo excepto "cancelado", que es el único que libera la mesa)
const ESTADOS_ACTIVOS = ["pendiente", "en_preparacion", "entregado"];

export default function MesasPage() {
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [pedidosActivos, setPedidosActivos] = useState<Record<number, Pedido>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editando, setEditando] = useState<Mesa | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [numero, setNumero] = useState("");
  const [estado, setEstado] = useState(true);
  const [guardando, setGuardando] = useState(false);

  async function cargarMesas() {
    setLoading(true);
    setError("");
    try {
      const [mesasData, pedidosData] = await Promise.all([
        apiFetch<Mesa[]>("/api/mesas"),
        apiFetch<Pedido[]>("/api/pedidos"),
      ]);
      setMesas(mesasData);

      const mapa: Record<number, Pedido> = {};
      for (const pedido of pedidosData) {
        if (!ESTADOS_ACTIVOS.includes(pedido.estado)) continue;
        const actual = mapa[pedido.mesa_id];
        if (!actual || new Date(pedido.fecha) > new Date(actual.fecha)) {
          mapa[pedido.mesa_id] = pedido;
        }
      }
      setPedidosActivos(mapa);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar mesas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarMesas();
  }, []);

  function abrirNuevo() {
    setEditando(null);
    setNumero("");
    setEstado(true);
    setFormError("");
    setMostrarForm(true);
  }

  function abrirEditar(mesa: Mesa) {
    setEditando(mesa);
    setNumero(String(mesa.numero));
    setEstado(mesa.estado);
    setFormError("");
    setMostrarForm(true);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!numero || Number.isNaN(Number(numero))) {
      setFormError("El número de mesa es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      if (editando) {
        await apiFetch(`/api/mesas/${editando.id}`, {
          method: "PUT",
          body: JSON.stringify({ numero: Number(numero), estado }),
        });
      } else {
        await apiFetch("/api/mesas", {
          method: "POST",
          body: JSON.stringify({ numero: Number(numero), estado }),
        });
      }
      setMostrarForm(false);
      await cargarMesas();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar la mesa.");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(mesa: Mesa) {
    if (!confirm(`¿Eliminar la mesa Nº ${mesa.numero}? Esta acción no se puede deshacer.`)) return;
    try {
      await apiFetch(`/api/mesas/${mesa.id}`, { method: "DELETE" });
      await cargarMesas();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar la mesa.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Mesas"
        description="Gestioná el salón y el estado de ocupación de cada mesa."
        action={
          <Button onClick={abrirNuevo} className="w-full sm:w-auto">
            + Nueva mesa
          </Button>
        }
      />

      <ErrorBanner message={error} />

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={guardar} className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
            <div>
              <Label>Número de mesa</Label>
              <Input
                type="number"
                min={1}
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ej. 5"
              />
            </div>
            <div className="flex items-center gap-2 pb-2">
              <input
                id="estado"
                type="checkbox"
                checked={estado}
                onChange={(e) => setEstado(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-900 accent-orange-500"
              />
              <label htmlFor="estado" className="text-sm text-neutral-300">
                Mesa libre
              </label>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="submit" disabled={guardando} className="flex-1 sm:flex-none">
                {guardando ? "Guardando..." : editando ? "Actualizar" : "Crear"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setMostrarForm(false)}
                className="flex-1 sm:flex-none"
              >
                Cancelar
              </Button>
            </div>
            {formError && (
              <p className="sm:col-span-3 text-sm text-red-400">{formError}</p>
            )}
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Cargando mesas...</p>
      ) : mesas.length === 0 ? (
        <EmptyState message="Todavía no hay mesas registradas." />
      ) : (
        <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
          {mesas.map((mesa) => {
            const pedidoActivo = pedidosActivos[mesa.id];
            const ocupadaConPedido = !mesa.estado && pedidoActivo;

            return (
              <Card
                key={mesa.id}
                className={`flex flex-col gap-3 ${
                  ocupadaConPedido ? "cursor-pointer transition-colors hover:border-orange-500/60" : ""
                }`}
              >
                {ocupadaConPedido ? (
                  <Link href={`/pedidos/${pedidoActivo.id}`} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xl font-semibold text-white">Mesa {mesa.numero}</span>
                      <Badge tone="red">Ocupada</Badge>
                    </div>
                    <p className="text-xs text-neutral-500">
                      Pedido #{pedidoActivo.id} · {pedidoActivo.estado.replace("_", " ")} · ver
                      detalle →
                    </p>
                  </Link>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xl font-semibold text-white">Mesa {mesa.numero}</span>
                    <Badge tone={mesa.estado ? "green" : "red"}>
                      {mesa.estado ? "Libre" : "Ocupada"}
                    </Badge>
                  </div>
                )}
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button variant="secondary" className="flex-1" onClick={() => abrirEditar(mesa)}>
                    Editar
                  </Button>
                  <Button variant="danger" className="flex-1 sm:flex-none" onClick={() => eliminar(mesa)}>
                    Eliminar
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}