"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

interface Props {
  rol: string;
  nombre: string;
  empresaNombre?: string;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ rol, nombre, empresaNombre, collapsed, onToggle }: Props) {
  const pathname = usePathname();

  const navAdmin = [
    {
      items: [
        {
          label: "Dashboard",
          href: "/dashboard",
          icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5"/></svg>,
        },
        {
          label: "Contratos",
          href: "/dashboard/contratos",
          icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M5 5h6M5 8h6M5 11h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
        },
        {
          label: "Penalizaciones",
          href: "/dashboard/penalizaciones",
          icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/><path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
        },
        {
          label: "Actas PDF",
          href: "/dashboard/actas",
          icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l4 4v9H3V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 2v4h4" stroke="currentColor" strokeWidth="1.5"/><path d="M5 9l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
        },
      ],
    },
  ];

  const navContratista = [
    {
      items: [
        {
          label: "Mis contratos",
          href: "/portal",
          icon: <svg width="18" height="18" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/><path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
        },
      ],
    },
  ];

  const nav = rol === "CONTRATISTA" ? navContratista : navAdmin;
  const w = collapsed ? 64 : 220;

  const iniciales = nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      style={{ width: `${w}px` }}
      className="bg-white rounded-2xl flex flex-col overflow-hidden transition-all duration-200 flex-shrink-0"
    >
      {/* Header */}
      <div className={`flex items-center h-16 px-4 border-b border-stone-100 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M8 3v10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-stone-900 truncate leading-tight">NóminaFlow</p>
              {empresaNombre && (
                <p className="text-xs text-stone-400 truncate leading-tight">{empresaNombre}</p>
              )}
            </div>
          </div>
        )}

        {collapsed && (
          <div className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M8 3v10" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        )}

        {/* Botón colapsar — ícono como la imagen de referencia */}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-md text-stone-300 hover:text-stone-600 hover:bg-stone-50 transition-colors flex-shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="1" y="1" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M6 1v16" stroke="currentColor" strokeWidth="1.3"/>
            </svg>
          </button>
        )}

        {collapsed && (
          <button
            onClick={onToggle}
            className="absolute -right-3 top-6 w-5 h-5 bg-white border border-stone-200 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 shadow-sm"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path d="M2 1.5l3 2.5-3 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        {nav.map((group, gi) => (
          <div key={gi} className={collapsed ? "px-2" : "px-3"}>
            {group.items.map((item) => {
              const activo = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 py-2.5 text-sm mb-0.5 rounded-lg transition-colors ${
                    collapsed ? "justify-center px-2" : "px-3"
                  } ${
                    activo
                      ? "text-stone-900 font-semibold bg-stone-50"
                      : "text-stone-400 hover:text-stone-700 hover:bg-stone-50"
                  }`}
                >
                  <span className={`flex-shrink-0 ${activo ? "text-stone-900" : "text-stone-400"}`}>
                    {item.icon}
                  </span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className={`border-t border-stone-100 py-3 ${collapsed ? "px-2" : "px-3"}`}>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          title={collapsed ? "Cerrar sesión" : undefined}
          className={`w-full flex items-center gap-3 py-2.5 text-sm rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors ${
            collapsed ? "justify-center px-2" : "px-3"
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          {!collapsed && <span>Cerrar sesión</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-lg hover:bg-stone-50 cursor-pointer">
            <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-stone-600">{iniciales}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-stone-900 truncate">{nombre}</p>
              <p className="text-xs text-stone-400">{rol === "CONTRATISTA" ? "Contratista" : "Administrador"}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}