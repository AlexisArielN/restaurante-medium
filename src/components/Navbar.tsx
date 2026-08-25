"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/mesas", label: "Mesas" },
  { href: "/platos", label: "Platos" },
  { href: "/presas", label: "Presas" },
  { href: "/pedidos", label: "Pedidos" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [abierto, setAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link
          href="/"
          onClick={() => setAbierto(false)}
          className="text-lg font-semibold tracking-tight text-white"
        >
          restaurante<span className="text-orange-500">-medium</span>
        </Link>

        {/* Links en desktop */}
        <ul className="hidden items-center gap-1 text-sm md:flex">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`rounded-md px-3 py-1.5 transition-colors ${
                    active
                      ? "bg-orange-500 text-white"
                      : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Botón hamburguesa en mobile */}
        <button
          onClick={() => setAbierto((v) => !v)}
          className="flex items-center justify-center rounded-md p-2 text-neutral-300 hover:bg-neutral-800 md:hidden"
          aria-label="Abrir menú"
          aria-expanded={abierto}
        >
          {abierto ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          )}
        </button>
      </nav>

      {/* Menú desplegable en mobile */}
      {abierto && (
        <ul className="flex flex-col gap-1 border-t border-neutral-800 px-4 py-3 text-sm md:hidden">
          {links.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setAbierto(false)}
                  className={`block rounded-md px-3 py-2 transition-colors ${
                    active
                      ? "bg-orange-500 text-white"
                      : "text-neutral-300 hover:bg-neutral-800 hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </header>
  );
}