import Link from "next/link";
import { Card } from "@/components/ui";

const modulos = [
  {
    href: "/mesas",
    titulo: "Mesas",
    descripcion: "Administra las mesas del salón y su estado (libre / ocupada).",
  },
  {
    href: "/platos",
    titulo: "Platos",
    descripcion: "Carta de platos, precios, stock disponible y sus presas asociadas.",
  },
  {
    href: "/presas",
    titulo: "Presas",
    descripcion: "Catálogo de presas (piezas/acompañamientos) que se combinan en los platos.",
  },
  {
    href: "/pedidos",
    titulo: "Pedidos",
    descripcion: "Toma de pedidos por mesa, detalle de platos y cálculo automático del total.",
  },
];

export default function Home() {
  return (
    <div>
      <div className="mb-10">
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Panel de <span className="text-orange-500">restaurante-medium</span>
        </h1>
        <p className="mt-2 max-w-xl text-neutral-400">
          Sistema de gestión de mesas, platos y pedidos. Elegí un módulo para empezar.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {modulos.map((modulo) => (
          <Link key={modulo.href} href={modulo.href}>
            <Card className="h-full transition-colors hover:border-orange-500/60">
              <h2 className="text-lg font-medium text-white">{modulo.titulo}</h2>
              <p className="mt-1.5 text-sm text-neutral-400">{modulo.descripcion}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
