import { AlertTriangle, Check, Copy, Download, ImagePlus, Lock, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useQRHistory } from './hooks/useQRHistory'
import { DEFAULTS, FIELDS, TYPES, build } from './qr/payloads'
import { contrast, makeSvg } from './qr/svg'
import type { QRType, Style, Values } from './qr/types'
import { downloadPng, downloadSvg } from './utils/download'

const PRESETS = [
  { name: 'Classic', fg: '#16161a', bg: '#ffffff' }, { name: 'Midnight', fg: '#ffffff', bg: '#16161a' },
  { name: 'Signal', fg: '#2f3cff', bg: '#ffffff' }, { name: 'Ocean', fg: '#0b4f6c', bg: '#eaf6fb' }, { name: 'Forest', fg: '#1e4d2b', bg: '#f1f7ee' },
]
const SIZES = [512, 1024, 2048]
const btn = 'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold transition active:scale-[.98] disabled:opacity-40 disabled:pointer-events-none'

export default function App() {
  const [type, setType] = useState<QRType>('url')
  const [values, setValues] = useState<Values>(DEFAULTS.url)
  const [fg, setFg] = useState('#16161a'), [bg, setBg] = useState('#ffffff')
  const [rounded, setRounded] = useState(false)
  const [logo, setLogo] = useState<string | null>(null), [logoSize, setLogoSize] = useState(18)
  const [pngSize, setPngSize] = useState(1024)
  const [toast, setToast] = useState(''), [about, setAbout] = useState(false), [copied, setCopied] = useState(false)
  const gen = useRef<HTMLElement>(null)
  const hist = useQRHistory()

  const built = useMemo(() => build(type, values), [type, values])
  const style: Style = { fg, bg, rounded, logo, logoSize }
  const svg = useMemo(() => (built.status === 'ok' ? makeSvg(built.payload, style) : ''), [built, fg, bg, rounded, logo, logoSize]) // eslint-disable-line react-hooks/exhaustive-deps
  const ratio = contrast(fg, bg)
  const lowContrast = ratio < 4, inverted = contrast(fg, '#000000') < contrast(bg, '#000000') // lighter-on-darker

  useEffect(() => {
    if (built.status !== 'ok') return
    const t = setTimeout(() => hist.add({ type, values, fg, bg, rounded, label: built.label, key: `${type}|${built.payload}|${fg}|${bg}|${rounded}` }), 1500)
    return () => clearTimeout(t)
  }, [built, type, values, fg, bg, rounded]) // eslint-disable-line react-hooks/exhaustive-deps

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200) }
  const set = (k: string, v: string) => setValues(p => ({ ...p, [k]: v }))
  const pick = (t: QRType) => { setType(t); setValues({ ...DEFAULTS[t] }) }
  const run = async (fn: () => void | Promise<void>, ok: string) => { try { await fn(); flash(ok) } catch { flash('Download failed. Try again.') } }
  const onLogo = (f?: File) => {
    if (!f) return
    if (!f.type.startsWith('image/') || f.size > 2_000_000) return flash('Choose an image under 2 MB')
    const r = new FileReader(); r.onload = () => setLogo(String(r.result)); r.readAsDataURL(f)
  }
  const start = () => {
    gen.current?.scrollIntoView({ behavior: 'smooth' })
    setTimeout(
      () => gen.current?.querySelector<HTMLElement>('input,textarea')?.focus({ preventScroll: true }),
      350,
    )
  }
  const copy = async () => {
    if (built.status !== 'ok') return

    try {
      await navigator.clipboard.writeText(built.payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      flash('Copy not available')
    }
  }

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <a href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
          <span className="grid h-7 w-7 grid-cols-2 gap-[3px] rounded-md bg-accent p-1.5" aria-hidden><i className="rounded-[1px] bg-white" /><i className="rounded-[1px] bg-white/50" /><i className="rounded-[1px] bg-white/50" /><i className="rounded-[1px] bg-white" /></span>
          QucikQR
        </a>
        <button onClick={() => setAbout(a => !a)} aria-expanded={about} className="rounded-md px-3 py-1.5 text-sm text-neutral-600 hover:bg-black/5">About</button>
      </header>
      {about && <div className="mx-auto max-w-6xl px-5">
        <p className="max-w-xl rounded-lg border border-line bg-white p-4 text-sm leading-relaxed text-neutral-600">QucikQR is a free, single-purpose QR code generator.
            Everything runs in your browser: no accounts, no tracking, no uploads. Recent codes are kept in this browser's local storage only. Minimal utility product from: <a href='https://richardamofa.vercel.app/'>richardamofa</a>
      </p></div>}

      <section className="mx-auto max-w-6xl px-5 pb-10 pt-10 sm:pt-16">
        <h1 className="max-w-2xl text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">Create QR codes in seconds.</h1>
        <p className="mt-4 text-lg text-neutral-600">Free. Fast. No account required.</p>
        <p className="mt-2 max-w-md text-neutral-500">Generate QR codes for links, Wi-Fi, WhatsApp, email, phone numbers, locations, and text.</p>
        <button onClick={start} className={`${btn} mt-7 bg-ink text-white hover:bg-black`}>Create a QR code</button>
      </section>

      <main ref={gen} id="generator" className="mx-auto max-w-6xl scroll-mt-4 px-5 pb-16">
        <h2 className="mb-5 text-xl font-semibold tracking-tight">Create your QR code</h2>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,390px)] lg:items-start">
          <section aria-label="QR type" className="rounded-2xl border border-line bg-white p-5">
            <div role="radiogroup" aria-label="QR type" className="flex flex-wrap gap-2">
              {TYPES.map(t => <button key={t.id} role="radio" aria-checked={type === t.id} onClick={() => pick(t.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${type === t.id ? 'border-accent bg-accent text-white' : 'border-line hover:border-neutral-400'}`}>{t.name}</button>)}
            </div>
          </section>

          <section aria-label="Content" className="rounded-2xl border border-line bg-white p-5">
            <div className="space-y-4">
              {FIELDS[type].map(f => (
                <div key={f.key}>
                  <label htmlFor={`f-${f.key}`} className="lbl">{f.label}</label>
                  {f.multiline ? <textarea id={`f-${f.key}`} rows={3} className="field" placeholder={f.placeholder} value={values[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} />
                    : <input id={`f-${f.key}`} className="field" type={f.key === 'password' ? 'text' : f.type === 'url' ? 'text' : f.type ?? 'text'} inputMode={f.type === 'tel' ? 'tel' : f.type === 'url' ? 'url' : undefined} autoComplete="off" placeholder={f.placeholder} value={values[f.key] ?? ''} onChange={e => set(f.key, e.target.value)} />}
                </div>
              ))}
              {type === 'wifi' && <>
                <div><label htmlFor="sec" className="lbl">Security</label>
                  <select id="sec" className="field" value={values.security} onChange={e => set('security', e.target.value)}><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">None</option></select></div>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-[#2f3cff]" checked={values.hidden === 'true'} onChange={e => set('hidden', String(e.target.checked))} />Hidden network</label>
              </>}
              {built.status === 'invalid' && <p role="alert" className="text-sm text-red-600">{built.message}</p>}
            </div>
          </section>

          <section aria-label="Preview" className="rounded-2xl border border-line bg-white p-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
            <div className="mx-auto aspect-square w-full max-w-[360px] overflow-hidden rounded-xl border border-line bg-paper">
              {svg ? <div className="h-full w-full [&>svg]:h-full [&>svg]:w-full" role="img" aria-label={`QR code for ${built.status === 'ok' ? built.label : ''}`} dangerouslySetInnerHTML={{ __html: svg }} />
                : <div className="grid h-full place-items-center text-center text-neutral-400"><p className="text-xl leading-snug">Your QR code<br />will appear here</p></div>}
            </div>
            <div aria-live="polite" className="mt-4 flex min-h-6 flex-wrap items-center justify-between gap-2 text-sm">
              {built.status === 'ok' ? <><span className="flex items-center gap-1.5 font-medium text-emerald-700"><Check size={16} />Ready to scan</span>
                <button onClick={copy} className="flex items-center gap-1.5 rounded-md px-2 py-1 text-neutral-600 hover:bg-black/5" aria-label="Copy QR content">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Copied' : 'Copy content'}</button></>
                : built.status === 'invalid' ? <span className="text-neutral-500">{built.message}</span> : <span className="text-neutral-400">Fill in the form to get started</span>}
            </div>
          </section>

          <section aria-label="Customize" className="rounded-2xl border border-line bg-white p-5">
            <h3 className="mb-4 font-semibold">Customize</h3>
            <div className="mb-4 flex flex-wrap gap-2">
              {PRESETS.map(p => <button key={p.name} onClick={() => { setFg(p.fg); setBg(p.bg) }} aria-label={`${p.name} colors`}
                className={`flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-sm ${fg === p.fg && bg === p.bg ? 'border-accent' : 'border-line hover:border-neutral-400'}`}>
                <span className="h-5 w-5 rounded-full border border-black/10" style={{ background: `linear-gradient(135deg,${p.fg} 50%,${p.bg} 50%)` }} />{p.name}</button>)}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {([['Foreground', fg, setFg, 'fg'], ['Background', bg, setBg, 'bg']] as const).map(([l, v, s, id]) => (
                <div key={id}><label htmlFor={id} className="lbl">{l}</label>
                  <input id={id} type="color" value={v} onChange={e => s(e.target.value)} className="h-10 w-full cursor-pointer rounded-lg border border-line bg-white p-1" /></div>))}
            </div>
            <div className="mt-4 flex items-center justify-between"><span className="lbl !mb-0" id="st">Dot style</span>
              <div role="radiogroup" aria-labelledby="st" className="flex rounded-lg border border-line p-0.5 text-sm">
                {[['Square', false], ['Rounded', true]].map(([n, r]) => <button key={String(n)} role="radio" aria-checked={rounded === r} onClick={() => setRounded(r as boolean)} className={`rounded-md px-3 py-1.5 ${rounded === r ? 'bg-ink text-white' : ''}`}>{n}</button>)}
              </div></div>
            <div className="mt-5 border-t border-line pt-4">
              <span className="lbl">Logo</span>
              <div className="flex items-center gap-3">
                <label className={`${btn} cursor-pointer border border-line bg-white py-2 hover:border-neutral-400 focus-within:outline focus-within:outline-2 focus-within:outline-accent`}><ImagePlus size={16} />Upload logo
                  <input type="file" accept="image/*" className="sr-only" onChange={e => { onLogo(e.target.files?.[0]); e.target.value = '' }} /></label>
                {logo && <><img src={logo} alt="Logo preview" className="h-9 w-9 rounded border border-line object-contain" /><button onClick={() => setLogo(null)} className="flex items-center gap-1 text-sm text-neutral-600 hover:text-red-600"><X size={14} />Remove logo</button></>}
              </div>
              {logo && <div className="mt-3"><label htmlFor="ls" className="lbl">Logo size: {logoSize}%</label><input id="ls" type="range" min={10} max={26} value={logoSize} onChange={e => setLogoSize(+e.target.value)} className="w-full accent-[#2f3cff]" /></div>}
            </div>
            {(lowContrast || inverted || logo || rounded) && <p className="mt-4 flex gap-2 text-sm text-amber-700"><AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>{lowContrast ? 'Low contrast can make scanning unreliable. ' : ''}{inverted ? 'Light-on-dark codes may not scan in every app. ' : ''}{logo ? 'A logo covers part of the code; keep it small and test before printing. ' : ''}{rounded && !logo && !lowContrast && !inverted ? 'Rounded dots scan well, but test before printing.' : ''}</span></p>}
          </section>

          <section aria-label="Download" className="rounded-2xl border border-line bg-white p-5 lg:col-start-2 lg:row-start-3">
            <div className="mb-3 flex items-center justify-between"><label htmlFor="px" className="text-sm font-medium text-neutral-700">PNG size</label>
              <select id="px" className="rounded-lg border border-line bg-white px-2 py-1.5 text-sm" value={pngSize} onChange={e => setPngSize(+e.target.value)}>{SIZES.map(s => <option key={s} value={s}>{s} × {s}</option>)}</select></div>
            <div className="grid grid-cols-2 gap-3">
              <button disabled={built.status !== 'ok'} className={`${btn} bg-accent text-white hover:brightness-110`} onClick={() => built.status === 'ok' && run(() => downloadPng(built.payload, style, pngSize), 'PNG downloaded')}><Download size={16} />Download PNG</button>
              <button disabled={built.status !== 'ok'} className={`${btn} bg-ink text-white hover:bg-black`} onClick={() => built.status === 'ok' && run(() => downloadSvg(built.payload, style), 'SVG downloaded')}><Download size={16} />Download SVG</button>
            </div>
          </section>
        </div>

        {hist.items.length > 0 && <section aria-label="Recent" className="mt-10">
          <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Recent</h3><button onClick={hist.clear} className="text-sm text-neutral-500 hover:text-red-600">Clear all</button></div>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {hist.items.map(i => (
              <li key={i.id} className="flex items-center rounded-lg border border-line bg-white">
                <button className="flex min-w-0 flex-1 items-center gap-3 p-2.5 text-left" onClick={() => { setType(i.type); setValues(i.values); setFg(i.fg); setBg(i.bg); setRounded(i.rounded); setLogo(null); start() }}>
                  <span className="h-9 w-9 shrink-0 overflow-hidden rounded border border-line [&>svg]:h-full [&>svg]:w-full" dangerouslySetInnerHTML={{ __html: (() => { const b = build(i.type, i.values); return b.status === 'ok' ? makeSvg(b.payload, { fg: i.fg, bg: i.bg, rounded: i.rounded, logo: null, logoSize: 0 }) : '' })() }} />
                  <span className="min-w-0"><span className="block truncate text-sm font-medium">{i.label}</span><span className="text-xs text-neutral-500">{TYPES.find(t => t.id === i.type)?.name}</span></span>
                </button>
                <button onClick={() => hist.remove(i.id)} aria-label={`Delete ${i.label}`} className="p-3 text-neutral-400 hover:text-red-600"><Trash2 size={15} /></button>
              </li>))}
          </ul>
        </section>}
      </main>

      <footer className="border-t border-line px-5 py-8 text-center text-sm text-neutral-500">
        <p className="mx-auto flex max-w-md items-start justify-center gap-2 text-left"><Lock size={15} className="mt-0.5 shrink-0" />Your QR codes are generated in your browser. Nothing is uploaded or stored on our servers.</p>
      </footer>
      <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 flex justify-center">{toast && <span className="rounded-full bg-ink px-4 py-2 text-sm text-white shadow-lg">{toast}</span>}</div>
    </div>
  )
}
