import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "NóminaFlow <notificaciones@nominaflow.co>";

function baseLayout(contenido: string) {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;"><tr><td align="center">
<table width="520" cellpadding="0" cellspacing="0">
  <tr><td style="padding-bottom:24px;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="background:#1a1916;width:36px;height:36px;border-radius:8px;text-align:center;vertical-align:middle;">
        <span style="color:white;font-size:15px;font-weight:600;line-height:36px;">N</span>
      </td>
      <td style="padding-left:10px;vertical-align:middle;">
        <span style="font-size:14px;font-weight:600;color:#1a1916;">NóminaFlow</span>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="background:white;border-radius:12px;border:1px solid rgba(0,0,0,0.08);overflow:hidden;">
    ${contenido}
  </td></tr>
  <tr><td style="padding-top:20px;text-align:center;">
    <p style="font-size:11px;color:#999891;margin:0;">Correo automático de NóminaFlow. No respondas.</p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`.trim();
}

const s   = (h: string) => `<div style="padding:28px 32px;">${h}</div>`;
const h1  = (t: string) => `<h1 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#1a1916;letter-spacing:-0.3px;">${t}</h1>`;
const par = (t: string) => `<p style="margin:0 0 16px;font-size:14px;color:#6b6a64;line-height:1.6;">${t}</p>`;
const hr  = ()           => `<div style="height:1px;background:rgba(0,0,0,0.06);margin:0 0 20px;"></div>`;
const chip = (t: string, c: "verde"|"ambar"|"rojo") => {
  const m = { verde:"background:#e6f5ed;color:#1a7a4a;", ambar:"background:#fef3dc;color:#92600a;", rojo:"background:#faeaea;color:#a02020;" };
  return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:500;${m[c]}">${t}</span>`;
};
const fila = (l: string, v: string) =>
  `<tr><td style="padding:5px 0;font-size:12px;color:#999891;width:150px;">${l}</td><td style="padding:5px 0;font-size:12px;color:#1a1916;font-weight:500;">${v}</td></tr>`;
const btn = (t: string, href: string) =>
  `<a href="${href}" style="display:inline-block;background:#1a1916;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:500;">${t} →</a>`;

// ── Revisión → admin ──────────────────────────────────────────────────────────
export async function emailRevisionAdmin({ adminEmail, adminNombre, contratistaNombre, entregableNombre, contratoTitulo, valor, url }: {
  adminEmail: string; adminNombre: string; contratistaNombre: string;
  entregableNombre: string; contratoTitulo: string; valor: number; url: string;
}) {
  return resend.emails.send({
    from: FROM, to: adminEmail,
    subject: `Revisión pendiente: ${entregableNombre}`,
    html: baseLayout(s(`
      ${h1("Entregable enviado a revisión")}
      ${par(`<strong>${contratistaNombre}</strong> ha enviado un entregable para tu revisión.`)}
      ${hr()}
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
        ${fila("Entregable", entregableNombre)}
        ${fila("Contrato", contratoTitulo)}
        ${fila("Valor", `$${valor.toLocaleString("es-CO")}`)}
        ${fila("Contratista", contratistaNombre)}
        ${fila("Estado", chip("En revisión", "ambar"))}
      </table>
      ${btn("Revisar entregable", url)}
    `)),
  });
}

// ── Aprobado → contratista ────────────────────────────────────────────────────
export async function emailAprobado({ contratistaNombre, contratistaEmail, entregableNombre, contratoTitulo, valorOriginal, valorFinal, penalizacion, bono, iva, retencion, retencionPorcentaje, url }: {
  contratistaNombre: string; contratistaEmail: string;
  entregableNombre: string; contratoTitulo: string;
  valorOriginal: number; valorFinal: number;
  penalizacion: number; bono: number;
  iva: number; retencion: number; retencionPorcentaje: number; url: string;
}) {
  return resend.emails.send({
    from: FROM, to: contratistaEmail,
    subject: `Aprobado: ${entregableNombre} — neto $${valorFinal.toLocaleString("es-CO")}`,
    html: baseLayout(s(`
      ${h1("¡Entregable aprobado!")}
      ${par(`Tu entregable <strong>${entregableNombre}</strong> fue aprobado. El pago será procesado pronto.`)}
      ${hr()}
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
        ${fila("Entregable", entregableNombre)}
        ${fila("Contrato", contratoTitulo)}
        ${fila("Valor base", `$${valorOriginal.toLocaleString("es-CO")}`)}
        ${penalizacion > 0 ? fila("Penalización", `<span style="color:#a02020;">-$${penalizacion.toLocaleString("es-CO")}</span>`) : ""}
        ${bono > 0 ? fila("Bono anticipado", `<span style="color:#1a7a4a;">+$${bono.toLocaleString("es-CO")}</span>`) : ""}
        ${iva > 0 ? fila("IVA (19%)", `<span style="color:#1a7a4a;">+$${iva.toLocaleString("es-CO")}</span>`) : ""}
        ${retencion > 0 ? fila(`Retención (${retencionPorcentaje}%)`, `<span style="color:#92600a;">-$${retencion.toLocaleString("es-CO")}</span>`) : ""}
        ${fila("Neto a recibir", `<strong style="color:#1a7a4a;">$${valorFinal.toLocaleString("es-CO")}</strong>`)}
        ${fila("Estado", chip("Aprobado", "verde"))}
      </table>
      ${btn("Ver acta y detalle", url)}
    `)),
  });
}

// ── Rechazado → contratista ───────────────────────────────────────────────────
export async function emailRechazado({ contratistaNombre, contratistaEmail, entregableNombre, contratoTitulo, comentario, url }: {
  contratistaNombre: string; contratistaEmail: string;
  entregableNombre: string; contratoTitulo: string;
  comentario?: string; url: string;
}) {
  return resend.emails.send({
    from: FROM, to: contratistaEmail,
    subject: `Rechazado: ${entregableNombre} — requiere correcciones`,
    html: baseLayout(s(`
      ${h1("Entregable rechazado")}
      ${par(`Tu entregable <strong>${entregableNombre}</strong> fue rechazado. Revisa los comentarios y vuelve a enviarlo.`)}
      ${hr()}
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
        ${fila("Entregable", entregableNombre)}
        ${fila("Contrato", contratoTitulo)}
        ${fila("Estado", chip("Rechazado", "rojo"))}
      </table>
      ${comentario ? `<div style="background:#fafaf7;border-radius:8px;padding:14px 16px;margin-bottom:20px;border-left:3px solid rgba(0,0,0,0.1);">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#999891;">Comentario</p>
        <p style="margin:0;font-size:13px;color:#1a1916;line-height:1.5;">${comentario}</p>
      </div>` : ""}
      ${btn("Ver entregable", url)}
    `)),
  });
}

// ── Recordatorio fecha límite → contratista ───────────────────────────────────
export async function emailRecordatorio({ contratistaEmail, contratistaNombre, entregableNombre, contratoTitulo, fechaLimite, diasRestantes, valor, url }: {
  contratistaEmail: string; contratistaNombre: string;
  entregableNombre: string; contratoTitulo: string;
  fechaLimite: Date; diasRestantes: number; valor: number; url: string;
}) {
  const urgente = diasRestantes <= 1;
  const fechaFormateada = fechaLimite.toLocaleDateString("es-CO", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  const mensajeDias =
    diasRestantes === 0 ? "Vence <strong>hoy</strong>" :
    diasRestantes === 1 ? "Vence <strong>mañana</strong>" :
    `Vence en <strong>${diasRestantes} días</strong>`;

  return resend.emails.send({
    from: FROM, to: contratistaEmail,
    subject: urgente
      ? `Vence ${diasRestantes === 0 ? "hoy" : "mañana"}: ${entregableNombre}`
      : `Recordatorio: ${entregableNombre} vence en ${diasRestantes} días`,
    html: baseLayout(s(`
      ${h1(urgente ? "Entregable por vencer" : "Recordatorio de entregable")}
      ${par(`${mensajeDias}. Asegúrate de enviar tu entregable a revisión antes de la fecha límite.`)}
      ${hr()}
      <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
        ${fila("Entregable", entregableNombre)}
        ${fila("Contrato", contratoTitulo)}
        ${fila("Valor", `$${valor.toLocaleString("es-CO")}`)}
        ${fila("Fecha límite", fechaFormateada)}
        ${fila("Tiempo restante", chip(
          diasRestantes === 0 ? "Vence hoy" : `${diasRestantes} día${diasRestantes !== 1 ? "s" : ""}`,
          urgente ? "rojo" : "ambar"
        ))}
      </table>
      ${btn("Ir al portal", url)}
    `)),
  });
}