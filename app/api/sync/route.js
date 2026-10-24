import { NextResponse } from 'next/server';
import { db, getAccess, ml } from '../../../lib/ml';
export const maxDuration = 60;

export async function POST() {
  try {
    const t = await getAccess();
    if (!t) return NextResponse.json({ error: 'Conecta MercadoLibre primero' }, { status: 400 });

    // 1) IDs de todas tus publicaciones
    const ids = [];
    for (let offset = 0; offset < 1000; offset += 100) {
      const r = await ml(`/users/${t.user_id}/items/search?limit=100&offset=${offset}`, t.access_token);
      ids.push(...r.results);
      if (ids.length >= r.paging.total || r.results.length === 0) break;
    }

    // 2) Detalle de a 20 en 20, varios lotes en paralelo
    const attrs = 'id,title,seller_custom_field,attributes,available_quantity,sold_quantity,price,status,permalink,thumbnail';
    const chunks = [];
    for (let i = 0; i < ids.length; i += 20) chunks.push(ids.slice(i, i + 20));
    const rows = [];
    for (let i = 0; i < chunks.length; i += 5) {
      const res = await Promise.all(
        chunks.slice(i, i + 5).map((c) => ml(`/items?ids=${c.join(',')}&attributes=${attrs}`, t.access_token))
      );
      for (const batch of res)
        for (const { code, body } of batch) {
          if (code !== 200) continue;
          const skuAttr = body.attributes?.find((a) => a.id === 'SELLER_SKU')?.value_name;
          rows.push({
            id: body.id,
            title: body.title,
            sku: body.seller_custom_field || skuAttr || null,
            available_quantity: body.available_quantity,
            sold_quantity: body.sold_quantity,
            price: body.price,
            status: body.status,
            permalink: body.permalink,
            thumbnail: body.thumbnail,
            updated_at: new Date().toISOString(),
          });
        }
    }
    const { error } = await db().from('products').upsert(rows);
    if (error) throw new Error(error.message);
    return NextResponse.json({ total: rows.length });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
