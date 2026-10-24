import { NextResponse } from 'next/server';
import { db } from '../../../lib/ml';
export const dynamic = 'force-dynamic';

export async function GET() {
  const s = db();
  const { data: tok } = await s.from('ml_tokens').select('id').eq('id', 1).maybeSingle();
  const { data, error } = await s.from('products').select('*').order('title').limit(2000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connected: !!tok, products: data });
}
