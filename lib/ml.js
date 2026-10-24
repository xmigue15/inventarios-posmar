import { createClient } from '@supabase/supabase-js';

export const db = () =>
  createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

async function tokenRequest(params) {
  const res = await fetch('https://api.mercadolibre.com/oauth/token', {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.ML_CLIENT_ID,
      client_secret: process.env.ML_CLIENT_SECRET,
      ...params,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error('MercadoLibre rechazó el token: ' + JSON.stringify(data));
  return data;
}

export async function saveTokens(data) {
  const row = {
    id: 1,
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: new Date(Date.now() + (data.expires_in - 120) * 1000).toISOString(),
    user_id: data.user_id,
  };
  const { error } = await db().from('ml_tokens').upsert(row);
  if (error) throw new Error(error.message);
  return row;
}

export const exchangeCode = (code) =>
  tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: process.env.ML_REDIRECT_URI });

// Devuelve un token válido; lo renueva solo si venció
export async function getAccess() {
  const { data: t } = await db().from('ml_tokens').select('*').eq('id', 1).maybeSingle();
  if (!t) return null;
  if (new Date(t.expires_at) > new Date()) return t;
  const fresh = await tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh_token });
  return saveTokens({ ...fresh, user_id: t.user_id });
}

export async function ml(path, token) {
  const res = await fetch('https://api.mercadolibre.com' + path, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`ML ${res.status} en ${path}`);
  return res.json();
}
