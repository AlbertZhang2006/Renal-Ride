-- =============================================================================
-- Renal Ride — Supabase Database Schema
-- =============================================================================
--
-- WARNING: This schema is for a demo/prototype and must be reviewed for
-- HIPAA/security compliance before production use. In particular:
--   - PHI columns (names, DOB, phone, addresses, notes) need encryption-at-rest
--     verification and access audit logging.
--   - RLS policies below are starter templates — a security review must confirm
--     they cover every edge case before handling real patient data.
--   - Supabase's default auth.users table stores email/password; a production
--     deployment should integrate with an identity provider that meets BAA
--     requirements.
--
-- Run against a Supabase project:
--   supabase db push        (via Supabase CLI)
--   — or paste into the SQL Editor in the Supabase Dashboard
-- =============================================================================


-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "moddatetime"; -- auto-update updated_at


-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- ---------------------------------------------------------------------------
-- 1. profiles — mirrors auth.users with app-level metadata
-- ---------------------------------------------------------------------------

create table profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text not null,
  email       text not null unique,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();


-- ---------------------------------------------------------------------------
-- 2. user_roles — many-to-many: one user can hold multiple roles
-- ---------------------------------------------------------------------------

create table user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles (id) on delete cascade,
  role        text not null check (role in ('patient', 'caregiver', 'clinic', 'vendor', 'admin')),
  -- Scoping: which org does this role apply to?
  clinic_id   uuid,  -- FK added after clinics table
  vendor_id   uuid,  -- FK added after vendors table
  patient_id  uuid,  -- FK added after patients table (for caregiver → patient link)
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (user_id, role, clinic_id, vendor_id, patient_id)
);

create index idx_user_roles_user   on user_roles (user_id);
create index idx_user_roles_role   on user_roles (role);
create index idx_user_roles_clinic on user_roles (clinic_id) where clinic_id is not null;
create index idx_user_roles_vendor on user_roles (vendor_id) where vendor_id is not null;


-- ---------------------------------------------------------------------------
-- 3. clinics
-- ---------------------------------------------------------------------------

create table clinics (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  address        text not null,
  phone          text,
  staff_contact  text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger clinics_updated_at
  before update on clinics
  for each row execute function set_updated_at();

-- Back-fill FK
alter table user_roles
  add constraint fk_user_roles_clinic
  foreign key (clinic_id) references clinics (id) on delete set null;


-- ---------------------------------------------------------------------------
-- 4. patients
-- ---------------------------------------------------------------------------

create table patients (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references profiles (id) on delete set null,
  clinic_id           uuid not null references clinics (id) on delete restrict,
  first_name          text not null,
  last_name           text not null,
  date_of_birth       date not null,
  phone               text,
  address             text not null,
  chair_time          time not null,
  treatment_days      text[] not null default '{}',
  mobility_level      text not null check (mobility_level in ('ambulatory', 'wheelchair', 'stretcher')),
  assistance_level    text not null check (assistance_level in ('independent', 'door-to-door', 'door-through-door')),
  preferred_language  text not null default 'English',
  notes               text not null default '',
  risk_level          text not null default 'low' check (risk_level in ('low', 'medium', 'high')),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger patients_updated_at
  before update on patients
  for each row execute function set_updated_at();

create index idx_patients_clinic on patients (clinic_id);
create index idx_patients_user   on patients (user_id) where user_id is not null;
create index idx_patients_risk   on patients (risk_level) where risk_level in ('medium', 'high');

-- Back-fill FK
alter table user_roles
  add constraint fk_user_roles_patient
  foreign key (patient_id) references patients (id) on delete set null;


-- ---------------------------------------------------------------------------
-- 5. caregivers
-- ---------------------------------------------------------------------------

create table caregivers (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid references profiles (id) on delete set null,
  patient_id               uuid not null references patients (id) on delete cascade,
  name                     text not null,
  relationship             text not null,
  phone                    text,
  email                    text,
  notification_preference  text not null default 'both'
    check (notification_preference in ('sms', 'email', 'both', 'none')),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

create trigger caregivers_updated_at
  before update on caregivers
  for each row execute function set_updated_at();

create index idx_caregivers_patient on caregivers (patient_id);
create index idx_caregivers_user    on caregivers (user_id) where user_id is not null;


-- ---------------------------------------------------------------------------
-- 6. vendors
-- ---------------------------------------------------------------------------

create table vendors (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  phone                     text,
  service_area              text,
  supports_wheelchair       boolean not null default false,
  supports_door_through_door boolean not null default false,
  on_time_rate              numeric(5,2) default 0,
  cancellation_rate         numeric(5,2) default 0,
  average_delay_minutes     numeric(5,1) default 0,
  is_active                 boolean not null default true,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

create trigger vendors_updated_at
  before update on vendors
  for each row execute function set_updated_at();

-- Back-fill FK
alter table user_roles
  add constraint fk_user_roles_vendor
  foreign key (vendor_id) references vendors (id) on delete set null;


-- ---------------------------------------------------------------------------
-- 7. drivers
-- ---------------------------------------------------------------------------

create table drivers (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid not null references vendors (id) on delete cascade,
  user_id     uuid references profiles (id) on delete set null,
  full_name   text not null,
  phone       text,
  license_no  text,
  status      text not null default 'available'
    check (status in ('available', 'on_trip', 'off_duty', 'inactive')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger drivers_updated_at
  before update on drivers
  for each row execute function set_updated_at();

create index idx_drivers_vendor on drivers (vendor_id);
create index idx_drivers_status on drivers (status) where status = 'available';


-- ---------------------------------------------------------------------------
-- 8. vehicles
-- ---------------------------------------------------------------------------

create table vehicles (
  id                    uuid primary key default gen_random_uuid(),
  vendor_id             uuid not null references vendors (id) on delete cascade,
  vehicle_type          text not null,
  license_plate         text,
  wheelchair_accessible boolean not null default false,
  bariatric_capable     boolean not null default false,
  status                text not null default 'active'
    check (status in ('active', 'maintenance', 'retired')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger vehicles_updated_at
  before update on vehicles
  for each row execute function set_updated_at();

create index idx_vehicles_vendor on vehicles (vendor_id);


-- ---------------------------------------------------------------------------
-- 9. standing_orders
-- ---------------------------------------------------------------------------

create table standing_orders (
  id            uuid primary key default gen_random_uuid(),
  patient_id    uuid not null references patients (id) on delete cascade,
  clinic_id     uuid not null references clinics (id) on delete cascade,
  vendor_id     uuid not null references vendors (id) on delete restrict,
  days_of_week  text[] not null,
  pickup_time   time not null,
  chair_time    time not null,
  return_mode   text not null default 'scheduled'
    check (return_mode in ('scheduled', 'will-call', 'clinic-triggered')),
  ride_type     text not null check (ride_type in ('ambulatory', 'wheelchair', 'stretcher')),
  is_active     boolean not null default true,
  start_date    date not null,
  end_date      date,
  notes         text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger standing_orders_updated_at
  before update on standing_orders
  for each row execute function set_updated_at();

create index idx_standing_orders_patient on standing_orders (patient_id);
create index idx_standing_orders_clinic  on standing_orders (clinic_id);
create index idx_standing_orders_vendor  on standing_orders (vendor_id);
create index idx_standing_orders_active  on standing_orders (is_active) where is_active = true;


-- ---------------------------------------------------------------------------
-- 10. rides
-- ---------------------------------------------------------------------------

create table rides (
  id                    uuid primary key default gen_random_uuid(),
  standing_order_id     uuid references standing_orders (id) on delete set null,
  patient_id            uuid not null references patients (id) on delete restrict,
  clinic_id             uuid not null references clinics (id) on delete restrict,
  vendor_id             uuid not null references vendors (id) on delete restrict,
  driver_id             uuid references drivers (id) on delete set null,
  vehicle_id            uuid references vehicles (id) on delete set null,
  pickup_address        text not null,
  dropoff_address       text not null,
  pickup_time           timestamptz not null,
  chair_time            time not null,
  estimated_return_time timestamptz,
  actual_pickup_time    timestamptz,
  actual_dropoff_time   timestamptz,
  status                text not null default 'scheduled'
    check (status in (
      'scheduled', 'driver_assigned', 'driver_en_route', 'driver_arrived',
      'picked_up', 'arrived_at_clinic', 'in_treatment', 'ready_for_return',
      'return_assigned', 'returning_home', 'arrived_home', 'completed',
      'delayed', 'missed', 'canceled', 'issue_reported'
    )),
  risk_level            text not null default 'low'
    check (risk_level in ('low', 'medium', 'high')),
  ride_type             text not null
    check (ride_type in ('ambulatory', 'wheelchair', 'stretcher')),
  direction             text not null
    check (direction in ('to-clinic', 'from-clinic')),
  notes                 text not null default '',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create trigger rides_updated_at
  before update on rides
  for each row execute function set_updated_at();

create index idx_rides_patient   on rides (patient_id);
create index idx_rides_clinic    on rides (clinic_id);
create index idx_rides_vendor    on rides (vendor_id);
create index idx_rides_driver    on rides (driver_id)  where driver_id is not null;
create index idx_rides_status    on rides (status);
create index idx_rides_pickup    on rides (pickup_time);
create index idx_rides_date      on rides (cast(pickup_time as date));


-- ---------------------------------------------------------------------------
-- 11. ride_status_events — immutable log of every status transition
-- ---------------------------------------------------------------------------

create table ride_status_events (
  id              uuid primary key default gen_random_uuid(),
  ride_id         uuid not null references rides (id) on delete cascade,
  previous_status text,
  new_status      text not null,
  changed_by      uuid references profiles (id) on delete set null,
  notes           text not null default '',
  created_at      timestamptz not null default now()
);

create index idx_ride_status_events_ride on ride_status_events (ride_id, created_at);


-- ---------------------------------------------------------------------------
-- 12. issues
-- ---------------------------------------------------------------------------

create table issues (
  id          uuid primary key default gen_random_uuid(),
  ride_id     uuid not null references rides (id) on delete cascade,
  patient_id  uuid not null references patients (id) on delete cascade,
  severity    text not null check (severity in ('low', 'medium', 'high', 'critical')),
  type        text not null check (type in (
    'late_pickup', 'no_show_driver', 'no_show_patient', 'wrong_vehicle',
    'patient_complaint', 'driver_complaint', 'safety_concern', 'billing_dispute'
  )),
  description text not null default '',
  resolved    boolean not null default false,
  resolved_at timestamptz,
  resolved_by uuid references profiles (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger issues_updated_at
  before update on issues
  for each row execute function set_updated_at();

create index idx_issues_ride       on issues (ride_id);
create index idx_issues_patient    on issues (patient_id);
create index idx_issues_unresolved on issues (resolved) where resolved = false;
create index idx_issues_severity   on issues (severity) where severity in ('high', 'critical');


-- ---------------------------------------------------------------------------
-- 13. notifications
-- ---------------------------------------------------------------------------

create table notifications (
  id              uuid primary key default gen_random_uuid(),
  recipient_id    uuid not null references profiles (id) on delete cascade,
  recipient_role  text not null check (recipient_role in ('patient', 'caregiver', 'clinic', 'vendor', 'admin', 'all')),
  patient_id      uuid references patients (id) on delete set null,
  title           text not null,
  message         text not null,
  severity        text not null default 'info'
    check (severity in ('info', 'success', 'warning', 'critical')),
  read            boolean not null default false,
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index idx_notifications_recipient on notifications (recipient_id, read, created_at desc);
create index idx_notifications_unread    on notifications (recipient_id) where read = false;


-- ---------------------------------------------------------------------------
-- 14. audit_logs — immutable system-wide audit trail
-- ---------------------------------------------------------------------------

create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references profiles (id) on delete set null,
  actor_role  text not null check (actor_role in ('patient', 'caregiver', 'clinic', 'vendor', 'admin', 'system')),
  actor_name  text not null,
  action      text not null,
  target      text not null,
  details     text not null default '',
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);

create index idx_audit_logs_actor   on audit_logs (actor_id);
create index idx_audit_logs_action  on audit_logs (action);
create index idx_audit_logs_created on audit_logs (created_at desc);


-- ===========================================================================
-- Row Level Security (RLS)
-- ===========================================================================
--
-- Enable RLS on every table. Supabase blocks all access by default once RLS
-- is on, so each table needs explicit policies.
-- ===========================================================================

alter table profiles           enable row level security;
alter table user_roles         enable row level security;
alter table clinics            enable row level security;
alter table patients           enable row level security;
alter table caregivers         enable row level security;
alter table vendors            enable row level security;
alter table drivers            enable row level security;
alter table vehicles           enable row level security;
alter table standing_orders    enable row level security;
alter table rides              enable row level security;
alter table ride_status_events enable row level security;
alter table issues             enable row level security;
alter table notifications      enable row level security;
alter table audit_logs         enable row level security;


-- ---------------------------------------------------------------------------
-- Helper: check if the current user holds a given role
-- ---------------------------------------------------------------------------

create or replace function has_role(required_role text)
returns boolean as $$
  select exists (
    select 1 from user_roles
    where user_id = auth.uid()
      and role = required_role
      and is_active = true
  );
$$ language sql stable security definer;


-- Helper: get clinic_ids for the current user's clinic role(s)
create or replace function my_clinic_ids()
returns setof uuid as $$
  select clinic_id from user_roles
  where user_id = auth.uid()
    and role = 'clinic'
    and clinic_id is not null
    and is_active = true;
$$ language sql stable security definer;


-- Helper: get vendor_ids for the current user's vendor role(s)
create or replace function my_vendor_ids()
returns setof uuid as $$
  select vendor_id from user_roles
  where user_id = auth.uid()
    and role = 'vendor'
    and vendor_id is not null
    and is_active = true;
$$ language sql stable security definer;


-- Helper: get patient_ids the current user is a caregiver for
create or replace function my_caregiver_patient_ids()
returns setof uuid as $$
  select patient_id from caregivers
  where user_id = auth.uid();
$$ language sql stable security definer;


-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create policy "Users can view their own profile"
  on profiles for select using (id = auth.uid());

create policy "Users can update their own profile"
  on profiles for update using (id = auth.uid());

create policy "Admin can view all profiles"
  on profiles for select using (has_role('admin'));


-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------

create policy "Users can view their own roles"
  on user_roles for select using (user_id = auth.uid());

create policy "Admin can manage all roles"
  on user_roles for all using (has_role('admin'));


-- ---------------------------------------------------------------------------
-- clinics
-- ---------------------------------------------------------------------------

create policy "Clinic staff can view their clinic"
  on clinics for select using (id in (select my_clinic_ids()));

create policy "Admin can view all clinics"
  on clinics for select using (has_role('admin'));

create policy "Patients can view their clinic"
  on clinics for select using (
    id in (select clinic_id from patients where user_id = auth.uid())
  );


-- ---------------------------------------------------------------------------
-- patients
-- ---------------------------------------------------------------------------

create policy "Patient can view own record"
  on patients for select using (user_id = auth.uid());

create policy "Caregiver can view linked patient"
  on patients for select using (id in (select my_caregiver_patient_ids()));

create policy "Clinic staff can view their patients"
  on patients for select using (clinic_id in (select my_clinic_ids()));

create policy "Vendor can view patients on assigned rides"
  on patients for select using (
    id in (
      select patient_id from rides
      where vendor_id in (select my_vendor_ids())
    )
  );

create policy "Admin can view all patients"
  on patients for select using (has_role('admin'));


-- ---------------------------------------------------------------------------
-- caregivers
-- ---------------------------------------------------------------------------

create policy "Caregiver can view own record"
  on caregivers for select using (user_id = auth.uid());

create policy "Patient can view their caregivers"
  on caregivers for select using (
    patient_id in (select id from patients where user_id = auth.uid())
  );

create policy "Clinic staff can view caregivers for their patients"
  on caregivers for select using (
    patient_id in (
      select id from patients where clinic_id in (select my_clinic_ids())
    )
  );

create policy "Admin can view all caregivers"
  on caregivers for select using (has_role('admin'));


-- ---------------------------------------------------------------------------
-- vendors
-- ---------------------------------------------------------------------------

create policy "Vendor staff can view own vendor"
  on vendors for select using (id in (select my_vendor_ids()));

create policy "Clinic staff can view all vendors"
  on vendors for select using (has_role('clinic'));

create policy "Admin can view all vendors"
  on vendors for select using (has_role('admin'));


-- ---------------------------------------------------------------------------
-- drivers
-- ---------------------------------------------------------------------------

create policy "Vendor can view their drivers"
  on drivers for select using (vendor_id in (select my_vendor_ids()));

create policy "Vendor can manage their drivers"
  on drivers for all using (vendor_id in (select my_vendor_ids()));

create policy "Admin can view all drivers"
  on drivers for select using (has_role('admin'));


-- ---------------------------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------------------------

create policy "Vendor can view their vehicles"
  on vehicles for select using (vendor_id in (select my_vendor_ids()));

create policy "Admin can view all vehicles"
  on vehicles for select using (has_role('admin'));


-- ---------------------------------------------------------------------------
-- standing_orders
-- ---------------------------------------------------------------------------

create policy "Patient can view own standing orders"
  on standing_orders for select using (
    patient_id in (select id from patients where user_id = auth.uid())
  );

create policy "Caregiver can view linked standing orders"
  on standing_orders for select using (
    patient_id in (select my_caregiver_patient_ids())
  );

create policy "Clinic staff can view their standing orders"
  on standing_orders for select using (clinic_id in (select my_clinic_ids()));

create policy "Vendor can view assigned standing orders"
  on standing_orders for select using (vendor_id in (select my_vendor_ids()));

create policy "Admin can view all standing orders"
  on standing_orders for select using (has_role('admin'));


-- ---------------------------------------------------------------------------
-- rides
-- ---------------------------------------------------------------------------

create policy "Patient can view own rides"
  on rides for select using (
    patient_id in (select id from patients where user_id = auth.uid())
  );

create policy "Caregiver can view linked patient rides"
  on rides for select using (
    patient_id in (select my_caregiver_patient_ids())
  );

create policy "Clinic staff can view rides for their clinic"
  on rides for select using (clinic_id in (select my_clinic_ids()));

create policy "Clinic staff can update rides for their clinic"
  on rides for update using (clinic_id in (select my_clinic_ids()));

create policy "Vendor can view rides assigned to them"
  on rides for select using (vendor_id in (select my_vendor_ids()));

create policy "Vendor can update rides assigned to them"
  on rides for update using (vendor_id in (select my_vendor_ids()));

create policy "Admin can view all rides"
  on rides for select using (has_role('admin'));

create policy "Admin can manage all rides"
  on rides for all using (has_role('admin'));


-- ---------------------------------------------------------------------------
-- ride_status_events
-- ---------------------------------------------------------------------------

create policy "Viewable by anyone who can see the parent ride"
  on ride_status_events for select using (
    ride_id in (select id from rides)  -- inherits rides RLS
  );

create policy "Clinic and vendor can insert status events"
  on ride_status_events for insert with check (
    has_role('clinic') or has_role('vendor') or has_role('admin')
  );


-- ---------------------------------------------------------------------------
-- issues
-- ---------------------------------------------------------------------------

create policy "Patient can view issues on own rides"
  on issues for select using (
    patient_id in (select id from patients where user_id = auth.uid())
  );

create policy "Caregiver can view issues for linked patient"
  on issues for select using (
    patient_id in (select my_caregiver_patient_ids())
  );

create policy "Clinic staff can view issues for their clinic"
  on issues for select using (
    ride_id in (
      select id from rides where clinic_id in (select my_clinic_ids())
    )
  );

create policy "Vendor can view issues on assigned rides"
  on issues for select using (
    ride_id in (
      select id from rides where vendor_id in (select my_vendor_ids())
    )
  );

create policy "Admin can view all issues"
  on issues for select using (has_role('admin'));


-- ---------------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------------

create policy "Users can view their own notifications"
  on notifications for select using (recipient_id = auth.uid());

create policy "Users can mark their own notifications read"
  on notifications for update using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

create policy "Admin can view all notifications"
  on notifications for select using (has_role('admin'));


-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------

create policy "Admin can view all audit logs"
  on audit_logs for select using (has_role('admin'));

create policy "Clinic staff can view audit logs for context"
  on audit_logs for select using (has_role('clinic'));

create policy "System and authenticated users can insert audit logs"
  on audit_logs for insert with check (auth.uid() is not null);
