'use client';
import { useEffect, useMemo, useState } from 'react';

const ESTADOS = { active: 'Activa', paused: 'Pausada', closed: 'Cerrada', under_review: 'En revisión' };
const money = (n) => (n == null ? '' : new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n));

export default function Home() {
  const [data, setData] = useState(null);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('todas');
  const [soloBajo, setSoloBajo] = useState(false);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const r = await fetch('/api/products');
    setData(await r.json());
  };
  useEffect(() => { load(); }, []);

  const sync = async () => {
    setBusy(true); setMsg('Sincronizando con MercadoLibre…');
    const r = await fetch('/api/sync', { method: 'POST' });
    const j = await r.json();
    setMsg(r.ok ? `Listo: ${j.total} publicaciones actualizadas.` : `Error: ${j.error}`);
    setBusy(false);
    load();
  };

  const lista = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data?.products || []).filter((p) =>
      (estado === 'todas' || p.status === estado) &&
      (!soloBajo || p.available_quantity <= 2) &&
      (!t || p.title?.toLowerCase().includes(t) || p.sku?.toLowerCase().includes(t) || p.id.toLowerCase().includes(t)));
  }, [data, q, estado, soloBajo]);

  const unidades = lista.reduce((s, p) => s + (p.available_quantity || 0), 0);

  if (!data) return <main><p className="aviso">Cargando…</p></main>;
  if (data.error) return <main><p className="aviso error">No se pudo leer la base de datos: {data.error}</p></main>;

  return (
    <main>
      <header>
        <h1>Inventario en MercadoLibre</h1>
        {data.connected
          ? <button onClick={sync} disabled={busy}>{busy ? 'Sincronizando…' : 'Sincronizar ahora'}</button>
          : <a className="btn" href="/api/login">Conectar MercadoLibre</a>}
      </header>

      {!data.connected && <p className="aviso">Aún no hay cuenta conectada. Conéctala para traer tus publicaciones.</p>}
      {msg && <p className="aviso">{msg}</p>}

      {data.products.length > 0 && (<>
        <div className="filtros">
          <input placeholder="Buscar por título, SKU o código MCO…" value={q} onChange={(e) => setQ(e.target.value)} />
          <select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="todas">Todos los estados</option>
            {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <label><input type="checkbox" checked={soloBajo} onChange={(e) => setSoloBajo(e.target.checked)} /> Stock bajo (2 o menos)</label>
        </div>
        <p className="resumen">{lista.length} publicaciones · {unidades} unidades publicadas</p>
        <div className="tabla">
          <table>
            <thead><tr><th></th><th>Producto</th><th>SKU</th><th className="num">Stock publicado</th><th className="num">Vendidos</th><th className="num">Precio</th><th>Estado</th></tr></thead>
            <tbody>
              {lista.map((p) => (
                <tr key={p.id}>
                  <td><img src={p.thumbnail} alt="" width="44" height="44" /></td>
                  <td><a href={p.permalink} target="_blank" rel="noreferrer">{p.title}</a><small>{p.id}</small></td>
                  <td>{p.sku || <span className="vacio">sin SKU</span>}</td>
                  <td className={'num stock' + (p.available_quantity <= 2 ? ' bajo' : '')}>{p.available_quantity}</td>
                  <td className="num">{p.sold_quantity}</td>
                  <td className="num">{money(p.price)}</td>
                  <td><span className={'estado ' + p.status}>{ESTADOS[p.status] || p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>)}

      {data.connected && data.products.length === 0 && <p className="aviso">Todavía no hay productos. Pulsa “Sincronizar ahora”.</p>}
    </main>
  );
}
