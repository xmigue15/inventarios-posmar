import { NextResponse } from 'next/server';
export function GET() {
  const url = new URL('https://auth.mercadolibre.com.co/authorization');
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', process.env.ML_CLIENT_ID);
  url.searchParams.set('redirect_uri', process.env.ML_REDIRECT_URI);
  return NextResponse.redirect(url);
}
