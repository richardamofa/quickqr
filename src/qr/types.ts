export type QRType = 'url' | 'text' | 'wifi' | 'email' | 'phone' | 'whatsapp' | 'location'
export type Values = Record<string, string>
export interface Style { fg: string; bg: string; rounded: boolean; logo: string | null; logoSize: number }
export interface Field { key: string; label: string; placeholder?: string; multiline?: boolean; type?: string }
export type Built = { status: 'empty' } | { status: 'invalid'; message: string } | { status: 'ok'; payload: string; label: string }