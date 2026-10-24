import { NextResponse } from 'next/server';
import { exchangeCode, saveTokens } from '../../../lib/ml';
export async function GET(req) {
  const code = new URL(req.url).searchParams.get('code');
  if (!code) return new NextResponse('Falta el código de autorización', { status: 400 });
  try {
    await saveTokens(await exchangeCode(code));
    return NextResponse.redirect(new URL('/?conectado=1', req.url));
  } catch (e) {
    return new NextResponse('Error al conectar: ' + e.message, { status: 500 });
  }
}
