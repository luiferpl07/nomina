"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface Props {
  rol: string;
  nombre: string;
  empresaNombre?: string;
}

export default function Sidebar({ rol, nombre, empresaNombre }: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const iniciales = nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navAdmin = [
    {
      section: "General",
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.4"/></svg>,
        },
        {
          label: "Contratos",
          href: "/dashboard/contratos",
          icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l4 4v9H3V2z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/><path d="M10 2v4h4" stroke="currentColor" strokeWidth="1.4"/><path d="M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
        },
      ],
    },
    {
      section: "Nómina",
      items: [
        {
          label: "Penalizaciones",
          href: "/dashboard/penalizaciones",
          icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
        },
        {
          label: "Actas PDF",
          href: "/dashboard/actas",
          icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l4 4v9H3V2z" stroke="currentColor" strokeWidth="1.4"/><path d="M5 9l2 2 4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
        },
      ],
    },
  ];

  const navContratista = [
    {
      section: "Mi portal",
      items: [
        {
          label: "Mis contratos",
          href: "/portal",
          icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>,
        },
      ],
    },
  ];

  const nav = rol === "CONTRATISTA" ? navContratista : navAdmin;

  return (
    <aside
      className="min-h-screen bg-white border-r border-stone-100 flex flex-col fixed left-0 top-0 z-10 transition-all duration-200"
      style={{ width: collapsed ? "60px" : "224px" }}
    >
      {/* Logo + botón colapsar */}
      <div className="px-4 py-5 border-b border-stone-100 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">{iniciales}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900 leading-none truncate">NóminaFlow</p>
              {empresaNombre && (
                <p className="text-xs text-stone-400 mt-0.5 truncate max-w-[110px]">{empresaNombre}</p>
              )}
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-full bg-stone-900 flex items-center justify-center mx-auto">
            <span className="text-white text-xs font-bold">{iniciales}</span>
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="flex-shrink-0 p-1 rounded-lg hover:bg-stone-50 text-stone-400 hover:text-stone-600"
            title="Colapsar"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M6 1v14" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M9 6l-2 2 2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-6 w-6 h-6 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 shadow-sm"
            title="Expandir"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-5 overflow-y-auto overflow-x-hidden">
        {nav.map((group) => (
          <div key={group.section} className="mb-5">
            {!collapsed && (
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider px-2 mb-2">
                {group.section}
              </p>
            )}
            {collapsed && <div className="mb-2 border-t border-stone-100" />}
            {group.items.map((item) => {
              const activo = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 py-2 text-sm mb-0.5 transition-all rounded-lg ${
                    collapsed ? "justify-center px-2" : "px-2"
                  } ${
                    activo
                      ? "text-stone-900 font-semibold"
                      : "text-stone-400 hover:text-stone-700"
                  }`}
                >
                  <span className={`flex-shrink-0 ${activo ? "text-stone-900" : "text-stone-400"}`}>
                    {item.icon}
                  </span>
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Usuario */}
      <div className="px-2 py-4 border-t border-stone-100">
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-stone-50 cursor-pointer">
              <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-stone-600">{iniciales}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-stone-900 truncate">{nombre}</p>
                <p className="text-xs text-stone-400">
                  {rol === "CONTRATISTA" ? "Contratista" : "Administrador"}
                </p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full mt-1 flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs text-stone-400 hover:bg-stone-50 hover:text-stone-600"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Cerrar sesión
            </button>
          </>
        ) : (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Cerrar sesión"
            className="w-full flex items-center justify-center py-2 text-stone-400 hover:text-stone-600"
          >
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>
    </aside>
  );
}