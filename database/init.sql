CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('manager', 'chief_manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS works (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'tender',
  customer TEXT NOT NULL,
  object_name TEXT,
  manager_id UUID REFERENCES users(id),
  deadline TIMESTAMPTZ,
  state TEXT NOT NULL DEFAULT 'found',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  inn TEXT,
  contact_name TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID NOT NULL REFERENCES works(id) ON DELETE CASCADE,
  row_no INTEGER NOT NULL,
  group_name TEXT,
  name TEXT NOT NULL,
  qty NUMERIC(14,3) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'шт',
  tech_description TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  purchase_price NUMERIC(14,2),
  sale_price NUMERIC(14,2),
  currency TEXT NOT NULL DEFAULT 'RUB',
  vat_rate NUMERIC(5,2) DEFAULT 20,
  production_days INTEGER,
  delivery_days INTEGER,
  planned_ready_date DATE,
  actual_ready_date DATE,
  shipment_place TEXT,
  status TEXT NOT NULL DEFAULT 'not_started',
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(work_id, row_no)
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  file_path TEXT,
  uploaded_by UUID REFERENCES users(id),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id UUID REFERENCES works(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id),
  title TEXT NOT NULL,
  due_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'normal',
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO users (id, name, role) VALUES
('00000000-0000-0000-0000-000000000001', 'Иван Петров', 'manager'),
('00000000-0000-0000-0000-000000000002', 'Главный менеджер', 'chief_manager')
ON CONFLICT DO NOTHING;

INSERT INTO suppliers (id, name, inn, contact_name, phone, email, city) VALUES
('10000000-0000-0000-0000-000000000001', 'ООО Арматура-Сервис', '7700000001', 'Алексей', '+7 495 000-00-01', 'sales@arm-service.test', 'Москва'),
('10000000-0000-0000-0000-000000000002', 'Завод ПромКлапан', '7800000002', 'Марина', '+7 812 000-00-02', 'tender@promklapan.test', 'Санкт-Петербург'),
('10000000-0000-0000-0000-000000000003', 'ТД КИП Комплект', '6600000003', 'Дмитрий', '+7 343 000-00-03', 'info@kip.test', 'Екатеринбург')
ON CONFLICT DO NOTHING;

INSERT INTO works (id, code, title, source, customer, object_name, manager_id, deadline, state, comment) VALUES
('20000000-0000-0000-0000-000000000001', 'PA-2026-0001', 'Клапаны 46 шт', 'tender', 'НкНПЗ', 'Реконструкция установки', '00000000-0000-0000-0000-000000000001', now() + interval '2 days', 'calculation', 'Тестовая объемная заявка'),
('20000000-0000-0000-0000-000000000002', 'PA-2026-0002', 'Поставка КИПиА', 'site', 'ООО СеверХим', 'Новый цех', '00000000-0000-0000-0000-000000000001', now() + interval '6 days', 'waiting_tkp', 'Заявка с сайта'),
('20000000-0000-0000-0000-000000000003', 'PA-2026-0003', 'Запорная арматура', 'cold_call', 'АО ТеплоСеть', 'Котельная №4', '00000000-0000-0000-0000-000000000001', now() + interval '12 hours', 'need_suppliers', 'После холодного звонка')
ON CONFLICT DO NOTHING;

INSERT INTO positions (work_id, row_no, group_name, name, qty, unit, supplier_id, purchase_price, sale_price, production_days, delivery_days, shipment_place, status, comment) VALUES
('20000000-0000-0000-0000-000000000001', 1, 'Клапаны', 'Клапан обратный DN50 PN16', 8, 'шт', '10000000-0000-0000-0000-000000000001', 18500, 24800, 20, 5, 'Москва', 'price_calculated', 'Нужен паспорт'),
('20000000-0000-0000-0000-000000000001', 2, 'Клапаны', 'Клапан запорный DN80 PN25', 12, 'шт', '10000000-0000-0000-0000-000000000002', 32200, 41500, 28, 6, 'Санкт-Петербург', 'tkp_received', ''),
('20000000-0000-0000-0000-000000000001', 3, 'Клапаны', 'Клапан регулирующий DN100 PN40', 4, 'шт', NULL, NULL, NULL, NULL, NULL, NULL, 'need_supplier', 'Нужен производитель'),
('20000000-0000-0000-0000-000000000001', 4, 'Фильтры', 'Фильтр сетчатый DN150 PN16', 6, 'шт', '10000000-0000-0000-0000-000000000003', 41000, 46200, 35, 7, 'Екатеринбург', 'price_calculated', 'Маржа низкая'),
('20000000-0000-0000-0000-000000000002', 1, 'КИП', 'Датчик давления 0-16 бар', 10, 'шт', '10000000-0000-0000-0000-000000000003', NULL, NULL, 14, 4, 'Екатеринбург', 'waiting_tkp', ''),
('20000000-0000-0000-0000-000000000003', 1, 'Арматура', 'Задвижка DN200 PN16', 2, 'шт', NULL, NULL, NULL, NULL, NULL, NULL, 'need_supplier', '')
ON CONFLICT DO NOTHING;

INSERT INTO documents (work_id, type, name, file_path, uploaded_by) VALUES
('20000000-0000-0000-0000-000000000001', 'ТЗ', 'Техническое задание НкНПЗ.pdf', '/uploads/demo/tz.pdf', '00000000-0000-0000-0000-000000000001'),
('20000000-0000-0000-0000-000000000001', 'ТКП', 'ТКП Арматура-Сервис.pdf', '/uploads/demo/tkp1.pdf', '00000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;
