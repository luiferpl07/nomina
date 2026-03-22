"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";

interface Props {
  rol: string;
  nombre: string;
  empresaNombre?: string;
}

export default function SidebarWrapper({ rol, nombre, empresaNombre }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      <Sidebar
        rol={rol}
        nombre={nombre}
        empresaNombre={empresaNombre}
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />
      <style>{`
        .main-content {
          marginLeft: ${collapsed ? "72px" : "220px"};
          transition: margin-left 0.2s;
        }
      `}</style>
    </>
  );
}