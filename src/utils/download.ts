import { makeSvg } from '../qr/svg';
import type { Style } from '../qr/types';

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), a = document.createElement('a')
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export function downloadSvg(payload: string, s: Style) {
  save(new Blob([makeSvg(payload, s)], { type: 'image/svg+xml' }), 'qr-studio.svg')
}
export async function downloadPng(payload: string, s: Style, size: number) {
  const svg = makeSvg(payload, s, size)
  const img = new Image()
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('render')); img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` })
  const c = document.createElement('canvas'); c.width = c.height = size
  const ctx = c.getContext('2d'); if (!ctx) throw new Error('canvas')
  ctx.drawImage(img, 0, 0, size, size)
  const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/png'))
  if (!blob) throw new Error('png')
  save(blob, `qr-studio-${size}.png`)
}
