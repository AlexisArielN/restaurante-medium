"use client";

import { useEffect, useState, FormEvent } from "react";
import { apiFetch } from "@/lib/client";
import type { Presa } from "@/types";
import { Button, Card, Input, Label, PageHeader, EmptyState, ErrorBanner } from "@/components/ui";

export default function PresasPage() {
  const [presas, setPresas] = useState<Presa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [editando, setEditando] = useState<Presa | null>(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function cargarPresas() {
    setLoading(true);
    setError("");
    try {
      const data = await apiFetch<Presa[]>("/api/presas");
      setPresas(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar presas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    cargarPresas();
  }, []);

  function abrirNuevo() {
    setEditando(null);
    setNombre("");
    setFormError("");
    setMostrarForm(true);
  }

  function abrirEditar(presa: Presa) {
    setEditando(presa);
    setNombre(presa.nombre);
    setFormError("");
    setMostrarForm(true);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!nombre.trim()) {
      setFormError("El nombre es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      if (editando) {
        await apiFetch(`/api/presas/${editando.id}`, {
          method: "PUT",
          body: JSON.stringify({ nombre }),
        });
      } else {
        await apiFetch("/api/presas", {
          method: "POST",
          body: JSON.stringify({ nombre }),
        });
      }
      setMostrarForm(false);
      await cargarPresas();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar la presa.");
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(presa: Presa) {
    if (!confirm(`¿Eliminar la presa "${presa.nombre}"?`)) return;
    try {
      await apiFetch(`/api/presas/${presa.id}`, { method: "DELETE" });
      await cargarPresas();
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo eliminar la presa.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Presas"
        description="Catálogo de presas que se combinan dentro de los platos."
        action={<Button onClick={abrirNuevo}>+ Nueva presa</Button>}
      />

      <ErrorBanner message={error} />

      {mostrarForm && (
        <Card className="mb-6">
          <form onSubmit={guardar} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Label>Nombre de la presa</Label>
              <Input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Pechuga"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={guardando}>
                {guardando ? "Guardando..." : editando ? "Actualizar" : "Crear"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setMostrarForm(false)}>
                Cancelar
              </Button>
            </div>
            {formError && <p className="text-sm text-red-400 sm:ml-2">{formError}</p>}
          </form>
        </Card>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Cargando presas...</p>
      ) : presas.length === 0 ? (
        <EmptyState message="Todavía no hay presas registradas." />
      ) : (
        <Card className="divide-y divide-neutral-800 p-0">
          {presas.map((presa) => (
            <div key={presa.id} className="flex items-center justify-between px-5 py-3">
              <span className="text-sm text-neutral-100">{presa.nombre}</span>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => abrirEditar(presa)}>
                  Editar
                </Button>
                <Button variant="danger" onClick={() => eliminar(presa)}>
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
