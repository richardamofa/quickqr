import QRCode from 'qrcode'
import type { Style } from './types'

export function makeSvg(payload: string, s: Style, px?: number): string {
  const qr = QRCode.create(payload, { errorCorrectionLevel: s.logo ? 'H' : 'M' })
  const n = qr.modules.size, data = qr.modules.data, q = 4, total = n + q * 2
  const ls = s.logo ? Math.round((n * s.logoSize) / 100) : 0
  const lo = Math.floor((n - ls) / 2), hi = lo + ls
  const skip = (x: number, y: number) => ls > 0 && x >= lo && x < hi && y >= lo && y < hi
  let d = '', r = ''
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    if (!data[y * n + x] || skip(x, y)) continue
    if (s.rounded) r += `<rect x="${x + q}" y="${y + q}" width="1.02" height="1.02" rx=".32"/>`
    else d += `M${x + q} ${y + q}h1v1h-1z`
  }
  const body = s.rounded ? `<g fill="${s.fg}">${r}</g>` : `<path fill="${s.fg}" d="${d}" shape-rendering="crispEdges"/>`
  const pad = 0.6
  const logo = s.logo && ls ? `<rect x="${lo + q - pad}" y="${lo + q - pad}" width="${ls + pad * 2}" height="${ls + pad * 2}" rx="1" fill="${s.bg}"/><image href="${s.logo}" x="${lo + q}" y="${lo + q}" width="${ls}" height="${ls}" preserveAspectRatio="xMidYMid meet"/>` : ''
  const size = px ? ` width="${px}" height="${px}"` : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}"${size}><rect width="${total}" height="${total}" fill="${s.bg}"/>${body}${logo}</svg>`
}

function lum(hex: string) {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
export function contrast(a: string, b: string) {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05)
}
