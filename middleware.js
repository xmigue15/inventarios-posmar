import { NextResponse } from 'next/server';
// Protege toda la app con una clave simple (usuario: cualquiera, clave: APP_PASSWORD)
export function middleware(req) {
  const h = req.headers.get('authorization') || '';
  const b64 = h.split(' ')[1];
  if (b64) {
    const pass = atob(b64).split(':').slice(1).join(':');
    if (pass && pass === process.env.APP_PASSWORD) return NextResponse.next();
  }
  return new NextResponse('Se requiere clave', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Inventario"' },
  });
}
