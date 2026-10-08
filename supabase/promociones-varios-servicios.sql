-- ════════════════════════════════════════════════════════════════════
--  PROMOCIONES CON VARIOS SERVICIOS
--  Ejecutar completo en Supabase → SQL Editor, después de promociones.sql.
--  Se puede ejecutar más de una vez sin problema.
-- ════════════════════════════════════════════════════════════════════

-- 1. Tabla intermedia: qué servicios incluye cada promoción ---------------
create table if not exists public.promociones_servicios (
  idpromocion        bigint not null references public.promociones(id) on delete cascade,
  iddetalleservicio  bigint not null references public.servicios_detalles(id) on delete cascade,
  primary key (idpromocion, iddetalleservicio)
);

-- 2. Pasar el servicio que ya tenían las promociones guardadas ------------
insert into public.promociones_servicios (idpromocion, iddetalleservicio)
select id, iddetalleservicio
from public.promociones
where iddetalleservicio is not null
on conflict do nothing;

-- 3. Seguridad (RLS) ------------------------------------------------------
alter table public.promociones_servicios enable row level security;

drop policy if exists "Ver servicios de promociones" on public.promociones_servicios;
create policy "Ver servicios de promociones"
  on public.promociones_servicios for select
  to anon, authenticated
  using (true);

drop policy if exists "Solo administradoras" on public.promociones_servicios;
create policy "Solo administradoras"
  on public.promociones_servicios for all
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

grant select on public.promociones_servicios to anon, authenticated;
grant insert, update, delete on public.promociones_servicios to authenticated;

-- 4. Al agendar: la promoción debe estar vigente y, si tiene servicios,
--    el servicio elegido debe ser uno de ellos
create or replace function public.validar_promocion_cita()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.promociones%rowtype;
begin
  if new.idpromocion is null then
    return new;
  end if;

  select * into p from public.promociones where id = new.idpromocion;

  if not found
     or p.id_estado <> 1
     or public.hoy_honduras() not between p.fecha_inicio and p.fecha_fin
     or new.dia > p.fecha_fin then
    raise exception 'PROMOCION_NO_DISPONIBLE';
  end if;

  if exists (select 1 from public.promociones_servicios where idpromocion = p.id)
     and not exists (
       select 1 from public.promociones_servicios
       where idpromocion = p.id and iddetalleservicio = new.iddetalleservicio
     ) then
    raise exception 'PROMOCION_NO_DISPONIBLE';
  end if;

  return new;
end;
$$;

-- 5. Comprobación: cada promoción con sus servicios -----------------------
select p.id, p.titulo, ps.iddetalleservicio
from public.promociones p
left join public.promociones_servicios ps on ps.idpromocion = p.id
order by p.id;


-- ════════════════════════════════════════════════════════════════════
--  LIMPIEZA (opcional, DESPUÉS de subir el admin y la landing nuevos)
--  La columna vieja ya no se usa; mientras exista, la versión anterior
--  del sitio sigue funcionando.
-- ════════════════════════════════════════════════════════════════════
-- alter table public.promociones drop column if exists iddetalleservicio;
