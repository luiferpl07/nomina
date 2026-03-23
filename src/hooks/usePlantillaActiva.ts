// src/hooks/usePlantillaActiva.ts
"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface EntregablePlantilla {
  nombre: string;
  descripcion: string;
  valor: number;
  diasPlazo: number;
}

interface Plantilla {
  id: string;
  titulo: string;
  descripcion: string | null;
  valorSugerido: number | null;
  entregables: EntregablePlantilla[];
}

export function usePlantillaActiva() {
  const searchParams = useSearchParams();
  const [plantilla, setPlantilla] = useState<Plantilla | null>(null);

  useEffect(() => {
    if (searchParams.get("plantilla") === "1") {
      try {
        const raw = sessionStorage.getItem("plantilla_activa");
        if (raw) {
          setPlantilla(JSON.parse(raw));
          sessionStorage.removeItem("plantilla_activa");
        }
      } catch {
        // ignorar error de parseo
      }
    }
  }, [searchParams]);

  return plantilla;
}