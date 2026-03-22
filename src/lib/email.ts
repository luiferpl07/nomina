import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "NóminaFlow <notificaciones@nominaflow.co>";

function baseLayout(contenido: string) {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f0ede8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom:24px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1a1916;width:36px;height:36px;border-radius:8px;text-align:center;vertical-align:middle;">
                    <span style="color:white;font-size:15px;font-weight:600;line-height:36px;">N</span>
                  </td>
                  <td style="padding-left:10px;vertical-align:middle;">
                    <span style="font-size:14px;font-weight:600;color:#1a1916;">NóminaFlow</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:white;border-radius:12px;border:1px solid rgba(0,0,0,0.08);overflow:hidden;">
              ${contenido}
            </td>
          </tr>
          <tr>
            <td style="padding-top:20px;text-align:center;">
              <p style="font-size:11px;color:#999891;margin:0;">Correo automático de NóminaFlow. No respondas a este mensaje.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

function seccion(html: string) {
  return `<div style="padding:28px 32px;">${html}</div>`;
}
function titulo(texto: string) {
  return `<h1 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#1a1916;letter-spacing:-0.3px;">${texto}</h1>`;
}
function parrafo(texto: string) {
  return `<p style="margin:0 0 16px;font-size:14px;color:#6b6a64;line-height:1.6;">${texto}</p>`;
}
function separador() {
  return `<div style="height:1px;background:rgba(0,0,0,0.06);margin:0 0 20px;"></div>`;
}
function chip(texto: string, tipo: "verde" | "ambar" | "rojo") {
  const estilos = {
    verde: "background:#e6f5ed;color:#1a7a4a;",
    ambar: "background:#fef3dc;color:#92600a;",
    rojo:  "background:#faeaea;color:#a02020;",
  };
  return `<span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:500;${estilos[tipo]}">${texto}</span>`;
}
function fila(label: string, valor: string) {
  return `
    <tr>
      <td style="padding:5px 0;font-size:12px;color:#999891;width:140px;">${label}</td>
      <td style="padding:5px 0;font-size:12px;color:#1a1916;font-weight:500;">${valor}</td>
    </tr>`;
}
function boton(texto: string, href: string) {
  return `<a href="${href}" style="display:inline-block;background:#1a1916;color:white;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:500;">${texto} →</a>`;
}

// ── Email: contratista envía a revisión → admin ───────────────────────────────
export async function emailRevisionAdmin({
  adminEmail, adminNombre, contratistaNombre,
  entregableNombre, contratoTitulo, valor, url,
}: {
  adminEmail: string; adminNombre: string; contratistaNombre: string;
  entregableNombre: string; contratoTitulo: string; valor: number; url: string;
}) {
  const html = baseLayout(seccion(`
    ${titulo("Entregable enviado a revisión")}
    ${parrafo(`<strong>${contratistaNombre}</strong> ha enviado un entregable para tu revisión.`)}
    ${separador()}
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
      ${fila("Entregable", entregableNombre)}
      ${fila("Contrato", contratoTitulo)}
      ${fila("Valor", `$${valor.toLocaleString("es-CO")}`)}
      ${fila("Contratista", contratistaNombre)}
      ${fila("Estado", chip("En revisión", "ambar"))}
    </table>
    ${boton("Revisar entregable", url)}
  `));

  return resend.emails.send({
    from: FROM,
    to: adminEmail,
    subject: `Revisión pendiente: ${entregableNombre}`,
    html,
  });
}

// ── Email: entregable aprobado → contratista ─────────────────────────────────
export async function emailAprobado({
  contratistaNombre, contratistaEmail, entregableNombre,
  contratoTitulo, valorOriginal, valorFinal, penalizacion,
  bono, retencion, retencionPorcentaje, url,
}: {
  contratistaNombre: string; contratistaEmail: string;
  entregableNombre: string; contratoTitulo: string;
  valorOriginal: number; valorFinal: number;
  penalizacion: number; bono: number;
  retencion: number; retencionPorcentaje: number;
  url: string;
}) {
  const html = baseLayout(seccion(`
    ${titulo("¡Entregable aprobado!")}
    ${parrafo(`Tu entregable <strong>${entregableNombre}</strong> fue aprobado. El pago será procesado pronto.`)}
    ${separador()}
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
      ${fila("Entregable", entregableNombre)}
      ${fila("Contrato", contratoTitulo)}
      ${fila("Valor base", `$${valorOriginal.toLocaleString("es-CO")}`)}
      ${penalizacion > 0 ? fila("Penalización", `<span style="color:#a02020;">-$${penalizacion.toLocaleString("es-CO")}</span>`) : ""}
      ${bono > 0 ? fila("Bono anticipado", `<span style="color:#1a7a4a;">+$${bono.toLocaleString("es-CO")}</span>`) : ""}
      ${retencion > 0 ? fila(`Retención (${retencionPorcentaje}%)`, `<span style="color:#92600a;">-$${retencion.toLocaleString("es-CO")}</span>`) : ""}
      ${fila("Neto a recibir", `<strong style="color:#1a7a4a;">$${valorFinal.toLocaleString("es-CO")}</strong>`)}
      ${fila("Estado", chip("Aprobado", "verde"))}
    </table>
    ${boton("Ver acta y detalle", url)}
  `));

  return resend.emails.send({
    from: FROM,
    to: contratistaEmail,
    subject: `Aprobado: ${entregableNombre} — neto $${valorFinal.toLocaleString("es-CO")}`,
    html,
  });
}

// ── Email: entregable rechazado → contratista ────────────────────────────────
export async function emailRechazado({
  contratistaNombre, contratistaEmail, entregableNombre,
  contratoTitulo, comentario, url,
}: {
  contratistaNombre: string; contratistaEmail: string;
  entregableNombre: string; contratoTitulo: string;
  comentario?: string; url: string;
}) {
  const html = baseLayout(seccion(`
    ${titulo("Entregable rechazado")}
    ${parrafo(`Tu entregable <strong>${entregableNombre}</strong> fue rechazado. Revisa los comentarios y vuelve a enviarlo.`)}
    ${separador()}
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
      ${fila("Entregable", entregableNombre)}
      ${fila("Contrato", contratoTitulo)}
      ${fila("Estado", chip("Rechazado", "rojo"))}
    </table>
    ${comentario ? `
      <div style="background:#fafaf7;border-radius:8px;padding:14px 16px;margin-bottom:20px;border-left:3px solid rgba(0,0,0,0.1);">
        <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:#999891;">Comentario</p>
        <p style="margin:0;font-size:13px;color:#1a1916;line-height:1.5;">${comentario}</p>
      </div>` : ""}
    ${boton("Ver entregable", url)}
  `));

  return resend.emails.send({
    from: FROM,
    to: contratistaEmail,
    subject: `Rechazado: ${entregableNombre} — requiere correcciones`,
    html,
  });
}