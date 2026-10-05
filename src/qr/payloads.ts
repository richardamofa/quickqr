import type { Built, Field, QRType, Values } from './types';

export const TYPES: { id: QRType; name: string }[] = [
  { id: 'url', name: 'URL' },
  { id: 'text', name: 'Text' },
  { id: 'wifi', name: 'Wi-Fi' },
  { id: 'email', name: 'Email' },
  { id: 'phone', name: 'Phone' },
  { id: 'whatsapp', name: 'WhatsApp' },
  { id: 'location', name: 'Location' },
];

export const FIELDS: Record<QRType, Field[]> = {
  url: [
    { key: 'url', label: 'Website URL', placeholder: 'https://example.com', type: 'url' },
  ],
  text: [
    { key: 'text', label: 'Text', placeholder: 'Anything you want to encode', multiline: true },
  ],
  wifi: [
    { key: 'ssid', label: 'Network name (SSID)' },
    { key: 'password', label: 'Password' },
  ],
  email: [
    { key: 'to', label: 'Email address', placeholder: 'name@example.com', type: 'email' },
    { key: 'subject', label: 'Subject' },
    { key: 'body', label: 'Message', multiline: true },
  ],
  phone: [
    { key: 'phone', label: 'Phone number', placeholder: '+233 24 000 0000', type: 'tel' },
  ],
  whatsapp: [
    { key: 'phone', label: 'Phone number (with country code)', placeholder: '+233 24 000 0000', type: 'tel' },
    { key: 'message', label: 'Message (optional)', multiline: true },
  ],
  location: [
    { key: 'lat', label: 'Latitude', placeholder: '5.6037' },
    { key: 'lng', label: 'Longitude', placeholder: '-0.1870' },
  ],
};

export const DEFAULTS: Record<QRType, Values> = {
  url: {},
  text: {},
  wifi: { security: 'WPA', hidden: 'false' },
  email: {},
  phone: {},
  whatsapp: {},
  location: {},
};

const esc = (s: string) => s.replace(/([\\;,:"])/g, '\\$1');
const phoneDigits = (s: string) => s.replace(/[^\d+]/g, '');

export function build(type: QRType, v: Values): Built {
  const g = (k: string) => (v[k] ?? '').trim();
  const bad = (message: string): Built => ({ status: 'invalid', message });

  switch (type) {
    case 'url': {
      const u = g('url');
      if (!u) return { status: 'empty' };

      const full = /^[a-z][a-z0-9+.-]*:\/\//i.test(u) ? u : `https://${u}`;

      try {
        const p = new URL(full);
        if (!/^https?:$/.test(p.protocol) || !p.hostname.includes('.')) {
          return bad('Enter a valid URL');
        }

        return { status: 'ok', payload: full, label: p.hostname };
      } catch {
        return bad('Enter a valid URL');
      }
    }

    case 'text': {
      const t = v.text ?? '';
      return t.trim() ? { status: 'ok', payload: t, label: t.trim().slice(0, 30) } : { status: 'empty' };
    }

    case 'wifi': {
      const s = g('ssid');
      if (!s) return { status: 'empty' };

      const sec = v.security ?? 'WPA';
      if (sec !== 'nopass' && !v.password) return bad('Enter the network password');

      const pw = sec === 'nopass' ? '' : esc(v.password);
      return {
        status: 'ok',
        payload: `WIFI:T:${sec};S:${esc(s)};P:${pw};H:${v.hidden === 'true'};;`,
        label: `Wi-Fi ${s}`,
      };
    }

    case 'email': {
      const to = g('to');
      if (!to) return { status: 'empty' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return bad('Enter a valid email address');

      const q = [['subject', g('subject')], ['body', v.body?.trim() ?? '']]
        .filter(([, x]) => x)
        .map(([k, x]) => `${k}=${encodeURIComponent(x)}`)
        .join('&');

      return { status: 'ok', payload: `mailto:${to}${q ? `?${q}` : ''}`, label: to };
    }

    case 'phone': {
      const p = phoneDigits(g('phone'));
      if (!g('phone')) return { status: 'empty' };

      return p.replace('+', '').length < 5
        ? bad('Enter a valid phone number')
        : { status: 'ok', payload: `tel:${p}`, label: p };
    }

    case 'whatsapp': {
      const p = phoneDigits(g('phone')).replace('+', '');
      if (!g('phone')) return { status: 'empty' };
      if (p.length < 7 || p.length > 15) return bad('Enter the number with country code');

      const m = g('message');
      return {
        status: 'ok',
        payload: `https://wa.me/${p}${m ? `?text=${encodeURIComponent(m)}` : ''}`,
        label: `WhatsApp ${p}`,
      };
    }

    case 'location': {
      if (!g('lat') && !g('lng')) return { status: 'empty' };

      const lat = Number(g('lat'));
      const lng = Number(g('lng'));

      if (!g('lat') || !g('lng') || Number.isNaN(lat) || Number.isNaN(lng)) {
        return bad('Enter both latitude and longitude');
      }

      if (Math.abs(lat) > 90) return bad('Latitude must be between -90 and 90');
      if (Math.abs(lng) > 180) return bad('Longitude must be between -180 and 180');

      return { status: 'ok', payload: `geo:${lat},${lng}`, label: `${lat}, ${lng}` };
    }
  }
}

