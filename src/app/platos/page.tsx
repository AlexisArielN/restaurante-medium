"use client";

import { useEffect, useState, FormEvent } from "react";
import { apiFetch, formatCurrency } from "@/lib/client";
import type { Plato, Presa } from "@/types";
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

export default function PlatosPage() {
  const [platos, setPlatos] = useState<Plato[]>([]);
  const [presas, setPresas] = useState<Presa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editando, setEditando] = useState<Plato | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  const [nombre, setNombre] = useState("");
  const [precio, setPrecio] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [presasSeleccionadas, setPresasSeleccionadas] = useState<number[]>([]);
  const [guardando, setGuardando] = useState(false);

  async function cargarDatos() {
    setLoading(true);
    setError("");
    try {
      const [platosData, presasData] = await Promise.all([
        apiFetch<Plato[]>("/api/platos"),
        apiFetch<Presa[]>("/api/presas"),
      ]);
      setPlatos(platosData);
      setPresas(presasData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar los platos.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, []);

  function abrirNuevo() {
    setEditando(null);
    setNombre("");
    setPrecio("");
    setCantidad("");
    setPresasSeleccionadas([]);
    setFormError("");
    setMostrarForm(true);
  }

  function abrirEditar(plato: Plato) {
    setEditando(plato);
    setNombre(plato.nombre);
    setPrecio(plato.precio);
    setCantidad(String(plato.cantidad_disponible));
    setPresasSeleccionadas(plato.presas?.map((p) => p.presa_id) ?? []);
    setFormError("");
    setMostrarForm(true);
  }

  function togglePresa(id: number) {
    setPresasSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!nombre.trim()) return setFormError("El nombre es obligatorio.");
    if (!precio || Number(precio) < 0) return setFormError("El precio debe ser válido.");
    if (!cantidad || Number(cantidad) < 0)
      return setFormError("La cantidad disponible debe ser válida.");

    const payload = {
      nombre,
      precio: Number(precio),
      cantidad_disponible: Number(cantidad),
      presa_ids: presasSeleccionadas,
    };

    setGuardando(true);
    try {
      if (editando) {
        await apiFetch(`/api/platos/${editando.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/platos", { method: "POST", body: JSON.stringify(payload) });
      }
      setMostrarForm(false);
      await cargarDatos();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar el plato.");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(plato: Plato) {
    if (!confirm(`¿Eliminar el plato "${plato.nombre}"?`)) return;
    try {
      await apiFetch(`/api/platos/${plato.id}`, { method: "DELETE" });
      await cargarDatos();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar el plato.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Platos"
        description="Carta de platos con precio, stock y presas asociadas."
        action={<Button onClick={abrirNuevo}>+ Nuevo plato</Button>}
      />

      <ErrorBanner message={error} />

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={guardar} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label>Nombre</Label>
                <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Pollo a la broaster" />
              </div>
              <div>
                <Label>Precio (Bs)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="Ej. 35.00"
                />
              </div>
              <div>
                <Label>Cantidad disponible</Label>
                <Input
                  type="number"
                  min={0}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Ej. 20"
                />
              </div>
            </div>

            <div>
              <Label>Presas asociadas</Label>
              {presas.length === 0 ? (
                <p className="text-xs text-neutral-500">
                  No hay presas creadas todavía. Podés crearlas en la sección Presas.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {presas.map((presa) => {
                    const activo = presasSeleccionadas.includes(presa.id);
                    return (
                      <button
                        type="button"
                        key={presa.id}
                        onClick={() => togglePresa(presa.id)}
                        className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                          activo
                            ? "border-orange-500 bg-orange-500/15 text-orange-400"
                            : "border-neutral-700 text-neutral-400 hover:border-neutral-500"
                        }`}
                      >
                        {presa.nombre}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : editando ? "Actualizar" : "Crear"}
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
        <p className="text-sm text-neutral-500">Cargando platos...</p>
      ) : platos.length === 0 ? (
        <EmptyState message="Todavía no hay platos registrados." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {platos.map((plato) => (
            <Card key={plato.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium text-white">{plato.nombre}</h3>
                <Badge tone={plato.cantidad_disponible > 0 ? "blue" : "red"}>
                  {plato.cantidad_disponible > 0
                    ? `${plato.cantidad_disponible} disp.`
                    : "Sin stock"}
                </Badge>
              </div>
              <p className="text-lg font-semibold text-orange-500">
                {formatCurrency(plato.precio)}
              </p>
              {plato.presas && plato.presas.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {plato.presas.map((pp) => (
                    <span
                      key={pp.id}
                      className="rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-300"
                    >
                      {pp.presa?.nombre}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-auto flex gap-2 pt-2">
                <Button variant="secondary" className="flex-1" onClick={() => abrirEditar(plato)}>
                  Editar
                </Button>
                <Button variant="danger" onClick={() => eliminar(plato)}>
                  Eliminar
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
