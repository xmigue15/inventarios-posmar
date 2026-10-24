create table if not exists ml_tokens (
  id int primary key default 1,
  access_token text not null,
  refresh_token text,
  expires_at timestamptz not null,
  user_id bigint,
  constraint solo_una_fila check (id = 1)
);
create table if not exists products (
  id text primary key,
  title text,
  sku text,
  available_quantity int default 0,
  sold_quantity int default 0,
  price numeric,
  status text,
  permalink text,
  thumbnail text,
  updated_at timestamptz default now()
);
alter table ml_tokens enable row level security;
alter table products enable row level security;
