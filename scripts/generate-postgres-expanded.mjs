import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const CONTEXTS = [
  "Gece vardiyasında",
  "Bakım penceresinde",
  "Incident sonrasında",
  "Deploy öncesinde",
  "Audit sırasında",
  "Troubleshooting sırasında",
  "Release kontrolünde",
  "Ops handover'da",
  "On-call görevinde",
  "Kesinti sonrasında",
];

const DBS = ["app", "billing", "analytics", "inventory", "reporting", "warehouse", "crm", "support", "events", "core"];
const TABLES = [
  "users",
  "orders",
  "sessions",
  "payments",
  "invoices",
  "shipments",
  "audit_logs",
  "events",
  "job_runs",
  "notifications",
];
const ROLES = [
  "app_user",
  "billing_user",
  "analytics_user",
  "inventory_user",
  "report_user",
  "warehouse_user",
  "crm_user",
  "support_user",
  "events_user",
  "core_user",
];
const EXTENSIONS = [
  "pgcrypto",
  "uuid-ossp",
  "citext",
  "hstore",
  "pg_trgm",
  "btree_gin",
  "btree_gist",
  "unaccent",
  "pgstattuple",
  "pg_visibility",
];
const BASIC_SETTINGS = [
  "max_connections",
  "shared_buffers",
  "work_mem",
  "maintenance_work_mem",
  "statement_timeout",
  "lock_timeout",
  "search_path",
  "TimeZone",
  "application_name",
  "client_encoding",
];
const ADVANCED_SETTINGS = [
  "wal_level",
  "max_wal_size",
  "min_wal_size",
  "checkpoint_timeout",
  "checkpoint_completion_target",
  "max_worker_processes",
  "max_parallel_workers",
  "max_parallel_maintenance_workers",
  "autovacuum_naptime",
  "track_io_timing",
];
const LIMITS = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];
const MINUTES = [5, 10, 15, 20, 30, 45, 60, 90, 120, 180];
const TIMEOUTS = ["5s", "10s", "15s", "20s", "30s", "45s", "60s", "90s", "120s", "180s"];
const WORK_MEM_VALUES = ["32MB", "48MB", "64MB", "80MB", "96MB", "128MB", "160MB", "192MB", "224MB", "256MB"];
const FILTERS = [
  { column: "status", value: "pending" },
  { column: "status", value: "paid" },
  { column: "event_type", value: "login" },
  { column: "state", value: "queued" },
  { column: "kind", value: "invoice" },
  { column: "source", value: "api" },
  { column: "channel", value: "email" },
  { column: "type", value: "sync" },
  { column: "region", value: "eu-west-1" },
  { column: "level", value: "error" },
];
const INDEX_COLUMNS = [
  "created_at",
  "updated_at",
  "user_id",
  "status",
  "customer_id",
  "event_time",
  "session_id",
  "queue_at",
  "processed_at",
  "sent_at",
];
const SLOT_NAMES = [
  "slot_app",
  "slot_billing",
  "slot_analytics",
  "slot_inventory",
  "slot_reporting",
  "slot_warehouse",
  "slot_crm",
  "slot_support",
  "slot_events",
  "slot_core",
];
const REPLICATION_APPS = [
  "replica-app-1",
  "replica-billing-1",
  "replica-analytics-1",
  "replica-inventory-1",
  "replica-reporting-1",
  "replica-warehouse-1",
  "replica-crm-1",
  "replica-support-1",
  "replica-events-1",
  "replica-core-1",
];
const PARTITION_TABLES = [
  "users_p",
  "orders_p",
  "sessions_p",
  "payments_p",
  "invoices_p",
  "shipments_p",
  "audit_logs_p",
  "events_p",
  "job_runs_p",
  "notifications_p",
];

function sqlLiteral(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function psql(db, sql) {
  return `psql -U postgres -d ${db} -c "${sql}"`;
}

function buildVariant(index) {
  return {
    context: CONTEXTS[index],
    db: DBS[index],
    table: TABLES[index],
    role: ROLES[index],
    extension: EXTENSIONS[index],
    basicSetting: BASIC_SETTINGS[index],
    advancedSetting: ADVANCED_SETTINGS[index],
    limit: LIMITS[index],
    minutes: MINUTES[index],
    timeout: TIMEOUTS[index],
    workMem: WORK_MEM_VALUES[index],
    filter: FILTERS[index],
    indexColumn: INDEX_COLUMNS[index],
    slotName: SLOT_NAMES[index],
    replicationApp: REPLICATION_APPS[index],
    partitionTable: PARTITION_TABLES[index],
    rolePassword: `${ROLES[index]}_pw2026`,
    labDb: `${DBS[index]}_lab`,
    csvFile: `${TABLES[index]}.csv`,
    sqlFile: `${DBS[index]}-seed.sql`,
    plainDumpFile: `${DBS[index]}.sql`,
    schemaDumpFile: `${DBS[index]}-schema.sql`,
    customDumpFile: `${DBS[index]}.dump`,
  };
}

function singleQuestion(id, scenario, answer, hintText, hintPartial) {
  return {
    id,
    type: "single",
    scenario,
    steps: [
      {
        prompt: "$ ",
        answer,
        hint_text: hintText,
        hint_partial: hintPartial,
      },
    ],
  };
}

function multiStepQuestion(id, scenario, steps) {
  return {
    id,
    type: "multi-step",
    scenario,
    steps: steps.map((step) => ({
      prompt: "$ ",
      answer: step.answer,
      hint_text: step.hintText,
      hint_partial: step.hintPartial,
    })),
  };
}

function generateQuestions(prefix, templates) {
  const variants = Array.from({ length: 10 }, (_, index) => buildVariant(index));
  const questions = [];
  let counter = 1;

  for (const variant of variants) {
    for (const template of templates) {
      questions.push(template(variant, `${prefix}-exp-${String(counter).padStart(3, "0")}`));
      counter += 1;
    }
  }

  return questions;
}

const juniorTemplates = [
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'ine baglan.`,
      `psql -U postgres -d ${v.db}`,
      "psql ile dogrudan ilgili database'e baglan.",
      "psql -U postgres -d ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} cluster'da \`${v.db}\` adli database var mi kontrol et.`,
      psql("postgres", `SELECT datname FROM pg_database WHERE datname = ${sqlLiteral(v.db)};`),
      "Database varligini kontrol etmek icin pg_database view'unu ilgili isimle filtrele.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'indeki schema adlarini alfabetik listele.`,
      psql(v.db, "SELECT schema_name FROM information_schema.schemata ORDER BY schema_name;"),
      "Schema isimleri icin information_schema tarafindan sunulan view'u kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde PostgreSQL surum bilgisini goster.`,
      psql(v.db, "SELECT version();"),
      "Sunucu surum bilgisini SQL tarafindan donduren yerlesik fonksiyonla oku.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` tarafinda aktif search_path degerini goster.`,
      psql(v.db, "SHOW search_path;"),
      "Oturumun schema arama yolunu gormek icin ilgili ayari dogrudan oku.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde public schema altindaki tablo adlarini listele.`,
      psql(v.db, "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"),
      "Public tablolari pg_tables view'u uzerinden filtrele.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde psql meta-komutuyla \`${v.table}\` tablosunun kolon ve index bilgisini gor.`,
      `psql -U postgres -d ${v.db} -c "\\d ${v.table}"`,
      "Tek komutla tablo yapisini gormek icin psql'in describe meta-komutunu kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde \`${v.table}\` tablosunun kolonlarini sira numarasina gore getir.`,
      psql(v.db, `SELECT column_name FROM information_schema.columns WHERE table_name = ${sqlLiteral(v.table)} ORDER BY ordinal_position;`),
      "Kolon listesi icin information_schema.columns ve ordinal_position kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde \`${v.table}\` tablosundaki toplam kayit sayisini hesapla.`,
      psql(v.db, `SELECT COUNT(*) FROM ${v.table};`),
      "Kayit sayisi icin COUNT(*) ile tabloyu sorgula.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde \`${v.table}\` tablosundan ilk ${v.limit} satiri getir.`,
      psql(v.db, `SELECT * FROM ${v.table} LIMIT ${v.limit};`),
      "Satir sayisini sinirlamak icin LIMIT kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde \`${v.table}\` tablosundan \`${v.filter.column} = ${v.filter.value}\` olan ilk ${v.limit} satiri getir.`,
      psql(v.db, `SELECT * FROM ${v.table} WHERE ${v.filter.column} = ${sqlLiteral(v.filter.value)} LIMIT ${v.limit};`),
      "Filtreli veri icin WHERE, satir siniri icin LIMIT kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde \`${v.table}\` tablosunu CSV header ile \`${v.csvFile}\` dosyasina aktar.`,
      `psql -U postgres -d ${v.db} -c "\\copy ${v.table} TO '${v.csvFile}' CSV HEADER"`,
      "Terminalden dosyaya export icin psql'in client-side copy meta-komutunu kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    multiStepQuestion(
      id,
      `${v.context} deneme icin \`${v.labDb}\` adinda bir database olustur ve sonra baglan.`,
      [
        {
          answer: `createdb -U postgres ${v.labDb}`,
          hintText: "Yeni bir database acmak icin createdb kullan.",
          hintPartial: "createdb -U postgres ...",
        },
        {
          answer: `psql -U postgres -d ${v.labDb}`,
          hintText: "Olusturdugun database'e psql ile baglan.",
          hintPartial: "psql -U postgres -d ...",
        },
      ],
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} deneme icin acilan \`${v.labDb}\` database'ini sil.`,
      `dropdb -U postgres ${v.labDb}`,
      "Database kaldirmak icin dropdb kullan.",
      "dropdb -U postgres ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.role}\` rolunun login ozelligini kontrol et.`,
      psql("postgres", `SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname = ${sqlLiteral(v.role)};`),
      "Belirli bir rolun ozelliklerini gormek icin pg_roles view'unu rol adi ile filtrele.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde kurulu extension'lari listele.`,
      psql(v.db, "SELECT extname FROM pg_extension ORDER BY extname;"),
      "Kurulu extension'lar icin pg_extension view'unu kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` tarafinda aktif \`${v.basicSetting}\` degerini goster.`,
      psql(v.db, `SHOW ${v.basicSetting};`),
      "Bir PostgreSQL ayarini okumak icin SHOW kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` icin server tarafinda baglanti hazir mi kontrol et.`,
      `pg_isready -U postgres -d ${v.db}`,
      "Hazirlik kontrolu icin pg_isready komutunu kullan.",
      "pg_isready -U postgres -d ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inin plain SQL backup'ini \`${v.plainDumpFile}\` dosyasina al.`,
      `pg_dump -U postgres ${v.db} > ${v.plainDumpFile}`,
      "Plain SQL export icin pg_dump ciktisini dosyaya yonlendir.",
      "pg_dump -U postgres ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inin sadece schema bilgisini \`${v.schemaDumpFile}\` dosyasina cikar.`,
      `pg_dump -U postgres --schema-only ${v.db} > ${v.schemaDumpFile}`,
      "Sadece schema icin pg_dump'i schema-only modunda calistir.",
      "pg_dump -U postgres --schema-only ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.sqlFile}\` dosyasini \`${v.db}\` database'ine uygula.`,
      `psql -U postgres -d ${v.db} -f ${v.sqlFile}`,
      "Bir SQL dosyasini uygulamak icin psql'i -f ile calistir.",
      "psql -U postgres -d ... -f ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'indeki aktif session'lari pid, user ve state ile listele.`,
      psql("postgres", `SELECT pid, usename, state FROM pg_stat_activity WHERE datname = ${sqlLiteral(v.db)};`),
      "Aktif baglantilar icin pg_stat_activity view'unu database filtresiyle kullan.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'ine acik toplam session sayisini goster.`,
      psql("postgres", `SELECT COUNT(*) FROM pg_stat_activity WHERE datname = ${sqlLiteral(v.db)};`),
      "Baglanti yogunlugunu hizli gormek icin pg_stat_activity uzerinde sayim yap.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inin toplam boyutunu insan okunur formatta goster.`,
      psql("postgres", `SELECT pg_size_pretty(pg_database_size(${sqlLiteral(v.db)}));`),
      "Database boyutunu gormek icin pg_database_size ve pg_size_pretty kullan.",
      "psql -U postgres -d postgres -c ...",
    ),
];

const midTemplates = [
  (v, id) =>
    multiStepQuestion(
      id,
      `${v.context} \`${v.role}\` adinda login role olustur ve owner'i bu rol olan \`${v.db}\` database'ini ac.`,
      [
        {
          answer: psql("postgres", `CREATE ROLE ${v.role} WITH LOGIN PASSWORD ${sqlLiteral(v.rolePassword)};`),
          hintText: "Login role olustururken CREATE ROLE ve WITH LOGIN PASSWORD kullan.",
          hintPartial: "psql -U postgres -d postgres -c ...",
        },
        {
          answer: `createdb -U postgres -O ${v.role} ${v.db}`,
          hintText: "Owner belirleyerek database acmak icin createdb -O kullan.",
          hintPartial: "createdb -U postgres -O ...",
        },
      ],
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.role}\` rolune \`${v.db}\` database'i icin CONNECT izni ver.`,
      psql("postgres", `GRANT CONNECT ON DATABASE ${v.db} TO ${v.role};`),
      "Database baglanti izni icin GRANT CONNECT ON DATABASE kullan.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.role}\` rolune \`${v.db}\` icindeki public schema icin USAGE izni ver.`,
      psql(v.db, `GRANT USAGE ON SCHEMA public TO ${v.role};`),
      "Schema kullanimi icin GRANT USAGE ON SCHEMA komutunu kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.role}\` rolune \`${v.db}\` icindeki mevcut tum tablolarda SELECT, INSERT, UPDATE ve DELETE izni ver.`,
      psql(v.db, `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${v.role};`),
      "Tum mevcut tablolar icin ALL TABLES IN SCHEMA public uzerinden grant ver.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.role}\` rolune \`${v.db}\` icindeki mevcut tum sequence'lerde USAGE, SELECT ve UPDATE izni ver.`,
      psql(v.db, `GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO ${v.role};`),
      "Sequence yetkileri icin ALL SEQUENCES IN SCHEMA public kalibini kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} bundan sonra olusacak tum tablolar icin \`${v.role}\` rolune varsayilan SELECT izni tanimla.`,
      psql(v.db, `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO ${v.role};`),
      "Gelecekte olusacak tablolar icin ALTER DEFAULT PRIVILEGES kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde \`${v.extension}\` extension'ini kur.`,
      psql(v.db, `CREATE EXTENSION IF NOT EXISTS "${v.extension}";`),
      "Extension kurulumu icin CREATE EXTENSION IF NOT EXISTS kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde \`${v.table}\` tablosunun toplam boyutunu insan okunur formatta goster.`,
      psql(v.db, `SELECT pg_size_pretty(pg_total_relation_size(${sqlLiteral(v.table)}));`),
      "Tablo boyutu icin pg_total_relation_size ve pg_size_pretty birlikte kullanilir.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inin toplam boyutunu insan okunur formatta goster.`,
      psql("postgres", `SELECT pg_size_pretty(pg_database_size(${sqlLiteral(v.db)}));`),
      "Database boyutu icin pg_database_size kullan.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde \`${v.table}\` tablosu icin tanimli index isimlerini listele.`,
      psql(v.db, `SELECT indexname FROM pg_indexes WHERE tablename = ${sqlLiteral(v.table)} ORDER BY indexname;`),
      "Tablo index'lerini gormek icin pg_indexes view'unu kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.table}\` tablosunda \`${v.filter.column} = ${v.filter.value}\` filtresi icin query planini goster.`,
      psql(v.db, `EXPLAIN SELECT * FROM ${v.table} WHERE ${v.filter.column} = ${sqlLiteral(v.filter.value)};`),
      "Calistirmadan plan gormek icin EXPLAIN kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.table}\` tablosunda \`${v.filter.column} = ${v.filter.value}\` filtresini gercek kosuyla analiz et.`,
      psql(v.db, `EXPLAIN ANALYZE SELECT * FROM ${v.table} WHERE ${v.filter.column} = ${sqlLiteral(v.filter.value)};`),
      "Gercek calisma maliyeti icin EXPLAIN ANALYZE kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} planner istatistiklerini guncellemek icin \`${v.table}\` tablosunu ANALYZE et.`,
      psql(v.db, `ANALYZE ${v.table};`),
      "Tablo istatistigi yenilemek icin ANALYZE kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.table}\` tablosu uzerinde VACUUM ANALYZE calistir.`,
      psql(v.db, `VACUUM ANALYZE ${v.table};`),
      "Bakim ve istatistik icin VACUUM ANALYZE kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inin custom format backup'ini \`${v.customDumpFile}\` dosyasina al.`,
      `pg_dump -U postgres -Fc ${v.db} -f ${v.customDumpFile}`,
      "Custom dump icin pg_dump'i -Fc ile calistir.",
      "pg_dump -U postgres -Fc ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.customDumpFile}\` dump dosyasini \`${v.db}\` database'ine clean restore et.`,
      `pg_restore -U postgres -d ${v.db} --clean --if-exists ${v.customDumpFile}`,
      "Temiz restore icin pg_restore'u --clean ve --if-exists ile calistir.",
      "pg_restore -U postgres -d ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'indeki idle session'lari sonlandir.`,
      psql("postgres", `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ${sqlLiteral(v.db)} AND state = 'idle';`),
      "Idle session kapatmak icin pg_stat_activity ve pg_terminate_backend kullan.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.table}\` tablosu uzerindeki relation lock ayrintilarini listele.`,
      psql(v.db, `SELECT locktype, mode, granted FROM pg_locks l JOIN pg_class c ON c.oid = l.relation WHERE c.relname = ${sqlLiteral(v.table)};`),
      "Belirli bir tablo lock'unu gormek icin pg_locks ile pg_class join'i yap.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.role}\` rolune \`${v.db}\` icin ${v.timeout} statement timeout ata.`,
      psql(v.db, `ALTER ROLE ${v.role} IN DATABASE ${v.db} SET statement_timeout = ${sqlLiteral(v.timeout)};`),
      "Role ve database bazli ayar icin ALTER ROLE ... IN DATABASE ... SET kullan.",
      "psql -U postgres -d ... -c ...",
    ),
];

const seniorTemplates = [
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde bloklanan backend'leri ve kim tarafindan bloklandiklarini goster.`,
      psql("postgres", `SELECT pid, pg_blocking_pids(pid) FROM pg_stat_activity WHERE datname = ${sqlLiteral(v.db)} AND cardinality(pg_blocking_pids(pid)) > 0;`),
      "Bloklayan pid zincirini gormek icin pg_blocking_pids kullan.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde ${v.minutes} dakikadan uzun suredir kosan query'leri listele.`,
      psql("postgres", `SELECT pid, now() - query_start AS runtime, query FROM pg_stat_activity WHERE datname = ${sqlLiteral(v.db)} AND state <> 'idle' AND now() - query_start > interval ${sqlLiteral(`${v.minutes} minutes`)};`),
      "Uzun kosan query icin pg_stat_activity ve query_start uzerinden zaman filtresi kur.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} bakim oncesi \`${v.db}\` database'indeki tum session'lari kendi session'in haric sonlandir.`,
      psql("postgres", `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = ${sqlLiteral(v.db)} AND pid <> pg_backend_pid();`),
      "Kendi session'ini korumak icin pg_backend_pid filtresi ekle.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde bekleyen backend'leri wait event bilgileriyle goster.`,
      psql("postgres", `SELECT pid, wait_event_type, wait_event FROM pg_stat_activity WHERE datname = ${sqlLiteral(v.db)} AND wait_event_type IS NOT NULL;`),
      "Bekleme sebebini gormek icin wait_event_type ve wait_event kolonlarini kullan.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.table}(${v.indexColumn})\` uzerine online index olustur.`,
      psql(v.db, `CREATE INDEX CONCURRENTLY idx_${v.table}_${v.indexColumn} ON ${v.table} (${v.indexColumn});`),
      "Uretimde kesinti riskini azaltmak icin CREATE INDEX CONCURRENTLY kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`idx_${v.table}_${v.indexColumn}\` index'ini concurrent sekilde reindex et.`,
      psql(v.db, `REINDEX INDEX CONCURRENTLY idx_${v.table}_${v.indexColumn};`),
      "Online reindex icin REINDEX INDEX CONCURRENTLY kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.table}\` tablosu icin verbose vacuum analyze calistir.`,
      psql(v.db, `VACUUM (VERBOSE, ANALYZE) ${v.table};`),
      "Ayrintili bakim ciktisi icin VACUUM (VERBOSE, ANALYZE) kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde en fazla dead tuple birikmis ilk 10 tabloyu goster.`,
      psql(v.db, "SELECT relname, n_dead_tup FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 10;"),
      "Bloat ipucu icin pg_stat_user_tables uzerinden n_dead_tup siralamasi yap.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.table}\` tablosunda \`${v.filter.column} = ${v.filter.value}\` filtresini buffer istatistikleriyle analiz et.`,
      psql(v.db, `EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM ${v.table} WHERE ${v.filter.column} = ${sqlLiteral(v.filter.value)};`),
      "Gercek plan ve buffer kullanimini bir arada gormek icin EXPLAIN (ANALYZE, BUFFERS) kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'indeki en buyuk 10 user tablosunu boyutlariyla listele.`,
      psql(v.db, "SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) AS size FROM pg_catalog.pg_statio_user_tables ORDER BY pg_total_relation_size(relid) DESC LIMIT 10;"),
      "Buyuk tablolar icin pg_statio_user_tables ve pg_total_relation_size kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde gecersiz index'leri bul.`,
      psql(v.db, "SELECT indexrelid::regclass AS index_name FROM pg_index WHERE NOT indisvalid;"),
      "Gecersiz index kontrolu icin pg_index uzerinde indisvalid filtresi kullan.",
      "psql -U postgres -d ... -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.slotName}\` replication slot'unu aktiflik ve restart LSN bilgisiyle goster.`,
      psql("postgres", `SELECT slot_name, active, restart_lsn FROM pg_replication_slots WHERE slot_name = ${sqlLiteral(v.slotName)};`),
      "Slot ayrintisi icin pg_replication_slots view'unu kullan.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.replicationApp}\` replication client'ini state ve sync state ile goster.`,
      psql("postgres", `SELECT application_name, state, sync_state FROM pg_stat_replication WHERE application_name = ${sqlLiteral(v.replicationApp)};`),
      "Replication istemcisi durumu icin pg_stat_replication view'unu filtrele.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.replicationApp}\` replika istemcisi icin WAL byte lag bilgisini goster.`,
      psql("postgres", `SELECT application_name, pg_wal_lsn_diff(sent_lsn, replay_lsn) AS byte_lag FROM pg_stat_replication WHERE application_name = ${sqlLiteral(v.replicationApp)};`),
      "WAL lag icin pg_wal_lsn_diff fonksiyonunu kullan.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} ${v.minutes} dakikadan daha eski prepared transaction kayitlarini listele.`,
      psql("postgres", `SELECT gid, prepared, owner FROM pg_prepared_xacts WHERE prepared < now() - interval ${sqlLiteral(`${v.minutes} minutes`)};`),
      "Hazir bekleyen transaction'lar icin pg_prepared_xacts view'unu zaman filtresiyle tara.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.db}\` database'inde ${v.minutes} dakikadan eski idle in transaction session'lari listele.`,
      psql("postgres", `SELECT pid, now() - xact_start AS idle_tx_age, query FROM pg_stat_activity WHERE datname = ${sqlLiteral(v.db)} AND state = 'idle in transaction' AND now() - xact_start > interval ${sqlLiteral(`${v.minutes} minutes`)};`),
      "Takili transaction'lari bulmak icin pg_stat_activity uzerinde state = 'idle in transaction' filtresi kullan.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    multiStepQuestion(
      id,
      `${v.context} global ayarda work_mem degerini \`${v.workMem}\` yap ve config'i reload et.`,
      [
        {
          answer: psql("postgres", `ALTER SYSTEM SET work_mem = ${sqlLiteral(v.workMem)};`),
          hintText: "Kalici ayar icin ALTER SYSTEM SET work_mem kullan.",
          hintPartial: "psql -U postgres -d postgres -c ...",
        },
        {
          answer: psql("postgres", "SELECT pg_reload_conf();"),
          hintText: "Degisiklikleri yeniden okutmak icin pg_reload_conf cagir.",
          hintPartial: "psql -U postgres -d postgres -c ...",
        },
      ],
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} ileri seviye ayarlardan \`${v.advancedSetting}\` degerini goster.`,
      psql("postgres", `SHOW ${v.advancedSetting};`),
      "Sunucu ayari okumak icin SHOW kullan.",
      "psql -U postgres -d postgres -c ...",
    ),
  (v, id) =>
    singleQuestion(
      id,
      `${v.context} \`${v.partitionTable}\` tablosunun partition tree bilgisini getir.`,
      psql(v.db, `SELECT relid::regclass, parentrelid::regclass, isleaf FROM pg_partition_tree(${sqlLiteral(v.partitionTable)});`),
      "Partition hiyerarsisini gormek icin pg_partition_tree fonksiyonunu kullan.",
      "psql -U postgres -d ... -c ...",
    ),
];

async function writeExpandedFile(level, prefix, templates) {
  const outputPath = path.join(ROOT_DIR, "src", "data", level, "postgres-expanded.json");
  const questions = generateQuestions(prefix, templates);

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify({ level, topic: "postgres", questions }, null, 2)}\n`,
    "utf8",
  );
}

await writeExpandedFile("junior", "jpg", juniorTemplates);
await writeExpandedFile("mid", "mpg", midTemplates);
await writeExpandedFile("senior", "spg", seniorTemplates);

console.log("postgres expanded datasets generated");
