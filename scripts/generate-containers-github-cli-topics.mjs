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
  "Operasyon devrinde",
  "On-call görevinde",
  "Kesinti sonrasında",
];

const CONTAINER_VARIANTS = [
  {
    context: CONTEXTS[0],
    container: "web",
    staleContainer: "web-old",
    newContainer: "web-demo",
    image: "nginx:alpine",
    hostPort: 8080,
    containerPort: 80,
    listPath: "/usr/share/nginx/html",
    localFile: "./index.html",
    remoteFile: "/usr/share/nginx/html/index.html",
    copyOutFile: "/etc/nginx/nginx.conf",
    network: "frontend",
    volume: "web-data",
  },
  {
    context: CONTEXTS[1],
    container: "api",
    staleContainer: "api-old",
    newContainer: "api-demo",
    image: "node:20-alpine",
    hostPort: 3000,
    containerPort: 3000,
    listPath: "/usr/src/app",
    localFile: "./config.json",
    remoteFile: "/usr/src/app/config.json",
    copyOutFile: "/usr/src/app/package.json",
    network: "backend",
    volume: "api-cache",
  },
  {
    context: CONTEXTS[2],
    container: "worker",
    staleContainer: "worker-old",
    newContainer: "worker-demo",
    image: "python:3.12-alpine",
    hostPort: 5000,
    containerPort: 5000,
    listPath: "/app",
    localFile: "./worker.env",
    remoteFile: "/app/.env",
    copyOutFile: "/app/requirements.txt",
    network: "jobs",
    volume: "worker-tmp",
  },
  {
    context: CONTEXTS[3],
    container: "cache",
    staleContainer: "cache-old",
    newContainer: "cache-demo",
    image: "redis:7-alpine",
    hostPort: 6379,
    containerPort: 6379,
    listPath: "/data",
    localFile: "./redis.conf",
    remoteFile: "/usr/local/etc/redis/redis.conf",
    copyOutFile: "/data/dump.rdb",
    network: "cache-net",
    volume: "redis-data",
  },
  {
    context: CONTEXTS[4],
    container: "db",
    staleContainer: "db-old",
    newContainer: "db-demo",
    image: "postgres:16-alpine",
    hostPort: 5432,
    containerPort: 5432,
    listPath: "/var/lib/postgresql/data",
    localFile: "./postgresql.conf",
    remoteFile: "/etc/postgresql/postgresql.conf",
    copyOutFile: "/var/lib/postgresql/data/PG_VERSION",
    network: "db-net",
    volume: "pg-data",
  },
  {
    context: CONTEXTS[5],
    container: "queue",
    staleContainer: "queue-old",
    newContainer: "queue-demo",
    image: "rabbitmq:3-management-alpine",
    hostPort: 15672,
    containerPort: 15672,
    listPath: "/etc/rabbitmq",
    localFile: "./rabbitmq.conf",
    remoteFile: "/etc/rabbitmq/rabbitmq.conf",
    copyOutFile: "/etc/rabbitmq/enabled_plugins",
    network: "queue-net",
    volume: "rabbit-data",
  },
  {
    context: CONTEXTS[6],
    container: "scheduler",
    staleContainer: "scheduler-old",
    newContainer: "scheduler-demo",
    image: "alpine:3.20",
    hostPort: 9000,
    containerPort: 9000,
    listPath: "/opt/jobs",
    localFile: "./jobs.txt",
    remoteFile: "/opt/jobs/jobs.txt",
    copyOutFile: "/etc/os-release",
    network: "ops-net",
    volume: "scheduler-data",
  },
  {
    context: CONTEXTS[7],
    container: "proxy",
    staleContainer: "proxy-old",
    newContainer: "proxy-demo",
    image: "haproxy:alpine",
    hostPort: 8404,
    containerPort: 8404,
    listPath: "/usr/local/etc/haproxy",
    localFile: "./haproxy.cfg",
    remoteFile: "/usr/local/etc/haproxy/haproxy.cfg",
    copyOutFile: "/usr/local/etc/haproxy/haproxy.cfg",
    network: "edge",
    volume: "proxy-data",
  },
  {
    context: CONTEXTS[8],
    container: "metrics",
    staleContainer: "metrics-old",
    newContainer: "metrics-demo",
    image: "prom/prometheus:v2.54.1",
    hostPort: 9090,
    containerPort: 9090,
    listPath: "/etc/prometheus",
    localFile: "./prometheus.yml",
    remoteFile: "/etc/prometheus/prometheus.yml",
    copyOutFile: "/etc/prometheus/prometheus.yml",
    network: "monitoring",
    volume: "prom-data",
  },
  {
    context: CONTEXTS[9],
    container: "grafana",
    staleContainer: "grafana-old",
    newContainer: "grafana-demo",
    image: "grafana/grafana-oss:11.1.0",
    hostPort: 3001,
    containerPort: 3000,
    listPath: "/etc/grafana",
    localFile: "./grafana.ini",
    remoteFile: "/etc/grafana/grafana.ini",
    copyOutFile: "/etc/grafana/grafana.ini",
    network: "monitoring",
    volume: "grafana-data",
  },
];

const GH_VARIANTS = [
  { context: CONTEXTS[0], repo: "acme/platform-api", issue: 42, pr: 15, run: 1201, workflow: "ci.yml", branch: "main", label: "bug", tag: "v1.4.0" },
  { context: CONTEXTS[1], repo: "acme/web-app", issue: 58, pr: 21, run: 1202, workflow: "deploy.yml", branch: "develop", label: "frontend", tag: "v1.5.0" },
  { context: CONTEXTS[2], repo: "acme/payments", issue: 77, pr: 34, run: 1203, workflow: "smoke.yml", branch: "release/1.6.0", label: "incident", tag: "v1.6.0" },
  { context: CONTEXTS[3], repo: "acme/ops-tooling", issue: 89, pr: 55, run: 1204, workflow: "lint.yml", branch: "main", label: "ops", tag: "v2.0.0" },
  { context: CONTEXTS[4], repo: "acme/data-pipeline", issue: 101, pr: 63, run: 1205, workflow: "nightly.yml", branch: "staging", label: "data", tag: "v2.1.0" },
  { context: CONTEXTS[5], repo: "acme/mobile-api", issue: 115, pr: 72, run: 1206, workflow: "test.yml", branch: "hotfix/auth", label: "backend", tag: "v2.1.1" },
  { context: CONTEXTS[6], repo: "acme/catalog", issue: 126, pr: 81, run: 1207, workflow: "release.yml", branch: "release/2.2.0", label: "release", tag: "v2.2.0" },
  { context: CONTEXTS[7], repo: "acme/search", issue: 141, pr: 94, run: 1208, workflow: "e2e.yml", branch: "main", label: "search", tag: "v2.3.0" },
  { context: CONTEXTS[8], repo: "acme/infra-live", issue: 152, pr: 105, run: 1209, workflow: "plan.yml", branch: "prod", label: "infra", tag: "v3.0.0" },
  { context: CONTEXTS[9], repo: "acme/observability", issue: 166, pr: 117, run: 1210, workflow: "alerts.yml", branch: "main", label: "monitoring", tag: "v3.1.0" },
];

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

async function writeTopicFile(level, topic, questions, fileStem = topic) {
  const outputPath = path.join(ROOT_DIR, "src", "data", level, `${fileStem}.json`);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify({ level, topic, questions }, null, 2)}\n`, "utf8");
}

function generateQuestions(prefix, variants, templates) {
  const questions = [];
  let counter = 1;

  for (const variant of variants) {
    for (const template of templates) {
      questions.push(template(variant, `${prefix}-${String(counter).padStart(3, "0")}`));
      counter += 1;
    }
  }

  return questions;
}

const juniorContainersBaseQuestions = [
  singleQuestion("jdkr-001", "Running container'lari listele.", "docker ps", "Ayakta olan container'lari gormek icin `docker ps` kullan.", "docker ps"),
  singleQuestion("jdkr-002", "Stopped olanlar dahil tum container'lari listele.", "docker ps -a", "Tum container kayitlarini gormek icin `docker ps -a` kullan.", "docker ps -a"),
  singleQuestion("jdkr-003", "Local image listesini goster.", "docker images", "Makinedeki image'lari gormek icin `docker images` kullan.", "docker images"),
  singleQuestion("jdkr-004", "`web` container'inin son 50 log satirini goster.", "docker logs --tail 50 web", "Tum log yerine son satirlari gormek icin `--tail` kullan.", "docker logs --tail ..."),
  singleQuestion("jdkr-005", "`web` container'inin loglarini canli takip et.", "docker logs -f web", "Canli log akisi icin `docker logs -f` kullan.", "docker logs -f ..."),
  singleQuestion("jdkr-006", "`web` container'i icinde shell ac.", "docker exec -it web sh", "Container icine girmek icin `docker exec -it <container> sh` kullan.", "docker exec -it ..."),
  singleQuestion("jdkr-007", "`web` container detaylarini incele.", "docker inspect web", "Port, mount ve network ayrintilari icin `docker inspect` kullan.", "docker inspect ..."),
  singleQuestion("jdkr-008", "`web` container'inin port mapping bilgisini goster.", "docker port web", "Host-container port eslesmesini `docker port` ile gor.", "docker port ..."),
  singleQuestion("jdkr-009", "Container kaynak kullanimini tek seferlik goster.", "docker stats --no-stream", "Canli ekran yerine tek snapshot icin `--no-stream` kullan.", "docker stats --no-stream"),
  singleQuestion("jdkr-010", "Docker network listesini goster.", "docker network ls", "Network adlarini ve driver bilgisini gormek icin `docker network ls` kullan.", "docker network ls"),
  singleQuestion("jdkr-011", "Docker volume listesini goster.", "docker volume ls", "Kalici volume'leri gormek icin `docker volume ls` kullan.", "docker volume ls"),
  singleQuestion("jdkr-012", "`nginx:alpine` image'ini indir.", "docker pull nginx:alpine", "Belirli image ve tag'i indirmek icin `docker pull` kullan.", "docker pull ..."),
  singleQuestion("jdkr-013", "Tek kullanimlik alpine container'da `cat /etc/os-release` calistir.", "docker run --rm alpine cat /etc/os-release", "Is bitince container silinsin istiyorsan `docker run --rm` kullan.", "docker run --rm ..."),
  singleQuestion("jdkr-014", "`demo` adinda detached nginx container'ini 8080:80 port mapping ile baslat.", "docker run -d --name demo -p 8080:80 nginx:alpine", "Detached ve port map'li baslatmak icin `docker run -d --name -p` kullan.", "docker run -d ..."),
  singleQuestion("jdkr-015", "`demo` container'ini durdur.", "docker stop demo", "Ayakta olan container'i durdurmak icin `docker stop` kullan.", "docker stop ..."),
  singleQuestion("jdkr-016", "`demo` container'ini sil.", "docker rm demo", "Stopped container kaydini temizlemek icin `docker rm` kullan.", "docker rm ..."),
];

const juniorContainersTemplates = [
  (v, id) => singleQuestion(id, `${v.context} \`${v.container}\` container detaylarini incele.`, `docker inspect ${v.container}`, "Container metadata'sini gormek icin `docker inspect` kullan.", "docker inspect ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.container}\` container'inin son 50 log satirini goster.`, `docker logs --tail 50 ${v.container}`, "Tum akisi okumak yerine son satirlari `--tail` ile gor.", "docker logs --tail ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.container}\` container loglarini canli izle.`, `docker logs -f ${v.container}`, "Canli log takibi icin `docker logs -f` kullan.", "docker logs -f ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.container}\` container'i icinde shell ac.`, `docker exec -it ${v.container} sh`, "Container icine interaktif girmek icin `docker exec -it` kullan.", "docker exec -it ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.container}\` container'inda \`${v.listPath}\` klasorunu listele.`, `docker exec ${v.container} ls ${v.listPath}`, "Tek seferlik komut icin `docker exec <container> <command>` kullan.", "docker exec ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.container}\` container'inin port mapping bilgisini goster.`, `docker port ${v.container}`, "Host-port eslesmesini `docker port` ile gor.", "docker port ..."),
  (v, id) => singleQuestion(id, `${v.context} yalnizca \`${v.container}\` container'inin kaynak kullanimini tek seferlik goster.`, `docker stats --no-stream ${v.container}`, "Tek container snapshot'i icin `docker stats --no-stream <container>` kullan.", "docker stats --no-stream ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.container}\` container'ini yeniden baslat.`, `docker restart ${v.container}`, "Log veya config degisimi sonrasi `docker restart` kullan.", "docker restart ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.container}\` container'ini durdur.`, `docker stop ${v.container}`, "Ayakta olan container'i durdurmak icin `docker stop` kullan.", "docker stop ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.container}\` container'ini tekrar baslat.`, `docker start ${v.container}`, "Stopped container'i ayağa kaldirmak icin `docker start` kullan.", "docker start ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.image}\` image'ini indir.`, `docker pull ${v.image}`, "Image'i host'a almak icin `docker pull` kullan.", "docker pull ..."),
  (v, id) => singleQuestion(id, `${v.context} tek kullanimlik \`${v.image}\` container'inda ` + "`echo ok`" + ` komutunu calistir.`, `docker run --rm ${v.image} sh -c 'echo ok'`, "Komutu calistirip container'i silmek icin `docker run --rm` kullan.", "docker run --rm ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.newContainer}\` adinda detached container'i \`${v.hostPort}:${v.containerPort}\` port mapping ile baslat.`, `docker run -d --name ${v.newContainer} -p ${v.hostPort}:${v.containerPort} ${v.image}`, "Detached ve port map'li baslatmak icin `docker run -d --name -p` kullan.", "docker run -d ..."),
  (v, id) => singleQuestion(id, `${v.context} eski \`${v.staleContainer}\` container kaydini sil.`, `docker rm ${v.staleContainer}`, "Stopped eski kaydi temizlemek icin `docker rm` kullan.", "docker rm ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.staleContainer}\` container adini \`${v.newContainer}\` yap.`, `docker rename ${v.staleContainer} ${v.newContainer}`, "Container adini degistirmek icin `docker rename` kullan.", "docker rename ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.localFile}\` dosyasini \`${v.container}\` container'indaki \`${v.remoteFile}\` yoluna kopyala.`, `docker cp ${v.localFile} ${v.container}:${v.remoteFile}`, "Host'tan container'a dosya atmak icin `docker cp` kullan.", "docker cp ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.container}\` container'indaki \`${v.copyOutFile}\` dosyasini bulundugun dizine al.`, `docker cp ${v.container}:${v.copyOutFile} ./`, "Container'dan host'a dosya cekmek icin `docker cp` kullan.", "docker cp ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.network}\` Docker network'ini incele.`, `docker network inspect ${v.network}`, "Bagli container ve subnet bilgisini gormek icin `docker network inspect` kullan.", "docker network inspect ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.volume}\` Docker volume detaylarini gor.`, `docker volume inspect ${v.volume}`, "Mountpoint ve driver bilgisini gormek icin `docker volume inspect` kullan.", "docker volume inspect ..."),
  (v, id) => multiStepQuestion(id, `${v.context} \`${v.image}\` image'ini indir, sonra \`${v.newContainer}\` adinda detached container'i \`${v.hostPort}:${v.containerPort}\` port mapping ile baslat.`, [
    {
      answer: `docker pull ${v.image}`,
      hintText: "Ilk adimda gereken image'i host'a indir.",
      hintPartial: "docker pull ...",
    },
    {
      answer: `docker run -d --name ${v.newContainer} -p ${v.hostPort}:${v.containerPort} ${v.image}`,
      hintText: "Ikinci adimda container'i isim ve port map ile ayağa kaldir.",
      hintPartial: "docker run -d ...",
    },
  ]),
];

const juniorGithubCliBaseQuestions = [
  singleQuestion("jgh-001", "GitHub CLI auth durumunu kontrol et.", "gh auth status", "Aktif login ve host bilgisini gormek icin `gh auth status` kullan.", "gh auth status"),
  singleQuestion("jgh-002", "GitHub CLI login akisina gir.", "gh auth login", "Ilk kurulumda veya yeni makinede `gh auth login` ile baglan.", "gh auth login"),
  singleQuestion("jgh-003", "Mevcut repo ozetini goster.", "gh repo view", "Bulundugun repo ozetini gormek icin `gh repo view` kullan.", "gh repo view"),
  singleQuestion("jgh-004", "`acme/platform-api` reposunu clone et.", "gh repo clone acme/platform-api", "GitHub uzerinden repo clone etmek icin `gh repo clone` kullan.", "gh repo clone ..."),
  singleQuestion("jgh-005", "Varsayilan repo baglamini `acme/platform-api` yap.", "gh repo set-default acme/platform-api", "Bu klasorde calisacagin default repo'yu `gh repo set-default` ile sec.", "gh repo set-default ..."),
  singleQuestion("jgh-006", "Open issue listesini goster.", "gh issue list --state open", "Acik issue kuyruğunu gormek icin `gh issue list --state open` kullan.", "gh issue list ..."),
  singleQuestion("jgh-007", "Issue 42 detayini goster.", "gh issue view 42", "Belirli issue detayini gormek icin `gh issue view` kullan.", "gh issue view ..."),
  singleQuestion("jgh-008", "Issue 42'ye `ack` notunu ekle.", "gh issue comment 42 --body ack", "Kisa geri bildirim icin `gh issue comment` kullan.", "gh issue comment ..."),
  singleQuestion("jgh-009", "Open pull request listesini goster.", "gh pr list --state open", "Acik PR'lari gormek icin `gh pr list --state open` kullan.", "gh pr list ..."),
  singleQuestion("jgh-010", "PR 15 detayini goster.", "gh pr view 15", "Belirli PR detayini gormek icin `gh pr view` kullan.", "gh pr view ..."),
  singleQuestion("jgh-011", "PR 15 branch'ine gec.", "gh pr checkout 15", "Review edecegin PR branch'ini cekmek icin `gh pr checkout` kullan.", "gh pr checkout ..."),
  singleQuestion("jgh-012", "Mevcut branch icin otomatik doldurulmus PR olusturma akisina gir.", "gh pr create --fill", "PR baslik ve govdesini commit'lerden doldurmak icin `--fill` kullan.", "gh pr create ..."),
  singleQuestion("jgh-013", "PR durum ozetini goster.", "gh pr status", "Senin PR'larini ve review isteklerini `gh pr status` ile gor.", "gh pr status"),
  singleQuestion("jgh-014", "Son 10 workflow run kaydini goster.", "gh run list --limit 10", "Yeni calismis workflow'lari gormek icin `gh run list --limit` kullan.", "gh run list ..."),
  singleQuestion("jgh-015", "Run 1201 detayini goster.", "gh run view 1201", "Belirli run ozetini gormek icin `gh run view` kullan.", "gh run view ..."),
  singleQuestion("jgh-016", "GitHub CLI surumunu kontrol et.", "gh --version", "Kurulu surumu dogrulamak icin `gh --version` kullan.", "gh --..."),
];

const juniorGithubCliTemplates = [
  (v, id) => singleQuestion(id, `${v.context} GitHub CLI auth durumunu kontrol et.`, "gh auth status", "Aktif login ve host bilgisini `gh auth status` ile gor.", "gh auth status"),
  (v, id) => singleQuestion(id, `${v.context} GitHub CLI login akisina gir.`, "gh auth login", "Yeni makinede veya token yenilerken `gh auth login` kullan.", "gh auth login"),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunun ozetini goster.`, `gh repo view ${v.repo}`, "Repo detayini gormek icin `gh repo view <owner>/<repo>` kullan.", "gh repo view ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunu clone et.`, `gh repo clone ${v.repo}`, "Repo'yu yerel ortama cekmek icin `gh repo clone` kullan.", "gh repo clone ..."),
  (v, id) => singleQuestion(id, `${v.context} varsayilan repo baglamini \`${v.repo}\` yap.`, `gh repo set-default ${v.repo}`, "Calisma klasorunde default repo secmek icin `gh repo set-default` kullan.", "gh repo set-default ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposundaki open issue'lari listele.`, `gh issue list --repo ${v.repo} --state open`, "Repo issue kuyruğunu gormek icin `gh issue list --repo` kullan.", "gh issue list ..."),
  (v, id) => singleQuestion(id, `${v.context} sana atanmis open issue'lari listele.`, "gh issue list --state open --assignee @me", "Kendi issue kuyruğunu filtrelemek icin `--assignee @me` kullan.", "gh issue list ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda issue ${v.issue} detayini goster.`, `gh issue view ${v.issue} --repo ${v.repo}`, "Belirli issue ayrintisini `gh issue view` ile gor.", "gh issue view ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda issue ${v.issue}'ye \`ack\` notunu ekle.`, `gh issue comment ${v.issue} --body ack --repo ${v.repo}`, "Kisa issue notu eklemek icin `gh issue comment` kullan.", "gh issue comment ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposundaki open PR'lari listele.`, `gh pr list --repo ${v.repo} --state open`, "Acik PR listesini gormek icin `gh pr list --state open` kullan.", "gh pr list ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda PR ${v.pr} detayini goster.`, `gh pr view ${v.pr} --repo ${v.repo}`, "Belirli PR detayina `gh pr view` ile bak.", "gh pr view ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda PR ${v.pr} branch'ine gec.`, `gh pr checkout ${v.pr} --repo ${v.repo}`, "Review edecegin branch'i cekmek icin `gh pr checkout` kullan.", "gh pr checkout ..."),
  (v, id) => singleQuestion(id, `${v.context} mevcut branch icin otomatik doldurulmus PR olusturma akisina gir.`, "gh pr create --fill", "PR baslik ve govdesini commit'lerden doldurmak icin `--fill` kullan.", "gh pr create ..."),
  (v, id) => singleQuestion(id, `${v.context} PR durum ozetini goster.`, "gh pr status", "Uzerinde calistigin ve review bekleyen PR'lari `gh pr status` ile gor.", "gh pr status"),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposundaki son 10 workflow run kaydini listele.`, `gh run list --repo ${v.repo} --limit 10`, "Yakindaki workflow calismalarini `gh run list --limit` ile gor.", "gh run list ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda run ${v.run} ozetini goster.`, `gh run view ${v.run} --repo ${v.repo}`, "Belirli run'in durumunu `gh run view` ile kontrol et.", "gh run view ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposundaki workflow listesini goster.`, `gh workflow list --repo ${v.repo}`, "Tanimli workflow'lari gormek icin `gh workflow list` kullan.", "gh workflow list ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` repo sayfasini browser'da ac.`, `gh repo view ${v.repo} --web`, "Terminalden web arayuzune gecmek icin `gh repo view --web` kullan.", "gh repo view ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda issue ${v.issue}'ye \`${v.label}\` label'ini ekle.`, `gh issue edit ${v.issue} --add-label ${v.label} --repo ${v.repo}`, "Issue'ya label eklemek icin `gh issue edit --add-label` kullan.", "gh issue edit ..."),
  (v, id) => multiStepQuestion(id, `${v.context} \`${v.repo}\` reposunda once PR ${v.pr} branch'ine gec, sonra detayini goster.`, [
    {
      answer: `gh pr checkout ${v.pr} --repo ${v.repo}`,
      hintText: "Ilk adimda inceleyecegin PR branch'ini cek.",
      hintPartial: "gh pr checkout ...",
    },
    {
      answer: `gh pr view ${v.pr} --repo ${v.repo}`,
      hintText: "Ikinci adimda PR detayini terminalde ac.",
      hintPartial: "gh pr view ...",
    },
  ]),
];

const midGithubCliBaseQuestions = [
  singleQuestion("mgh-001", "GitHub CLI auth durumunu kontrol et.", "gh auth status", "Aktif login ve host bilgisini gormek icin `gh auth status` kullan.", "gh auth status"),
  singleQuestion("mgh-002", "Varsayilan repo baglamini `acme/platform-api` yap.", "gh repo set-default acme/platform-api", "Bulundugun klasorde default repo secmek icin `gh repo set-default` kullan.", "gh repo set-default ..."),
  singleQuestion("mgh-003", "`acme/platform-api` reposunu clone et.", "gh repo clone acme/platform-api", "GitHub repo clone icin `gh repo clone` kullan.", "gh repo clone ..."),
  singleQuestion("mgh-004", "Uzerine atanmis open issue'lari listele.", "gh issue list --state open --assignee @me", "Kendi issue kuyruğunu gormek icin `gh issue list --assignee @me` kullan.", "gh issue list ..."),
  singleQuestion("mgh-005", "Issue 42 detayini yorumlariyla birlikte goster.", "gh issue view 42 --comments", "Issue gecmisini yorumlarla gormek icin `--comments` ekle.", "gh issue view ..."),
  singleQuestion("mgh-006", "Issue 42'ye `investigating` notunu ekle.", "gh issue comment 42 --body investigating", "CLI uzerinden kisa issue yorumu icin `gh issue comment` kullan.", "gh issue comment ..."),
  singleQuestion("mgh-007", "Mevcut branch icin aciklamayi doldurarak PR olusturma akisina gir.", "gh pr create --fill", "Son commit bilgisinden PR metni doldurmak icin `--fill` kullan.", "gh pr create ..."),
  singleQuestion("mgh-008", "PR 15 branch'ine gec.", "gh pr checkout 15", "Review oncesi PR branch'ini cekmek icin `gh pr checkout` kullan.", "gh pr checkout ..."),
  singleQuestion("mgh-009", "PR 15 check sonucunu tamamlanana kadar izle.", "gh pr checks 15 --watch", "Checks sonuclanana kadar beklemek icin `--watch` kullan.", "gh pr checks ..."),
  singleQuestion("mgh-010", "Son 10 workflow run kaydini goster.", "gh run list --limit 10", "En son run'lari kisa listelemek icin `gh run list --limit` kullan.", "gh run list ..."),
];

const midGithubCliTemplates = [
  (v, id) => singleQuestion(id, `${v.context} GitHub CLI auth durumunu kontrol et.`, "gh auth status", "Login ve token kapsam bilgisini `gh auth status` ile gor.", "gh auth status"),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunu clone et.`, `gh repo clone ${v.repo}`, "Repo'yu yerel makineye almak icin `gh repo clone` kullan.", "gh repo clone ..."),
  (v, id) => singleQuestion(id, `${v.context} varsayilan repo baglamini \`${v.repo}\` yap.`, `gh repo set-default ${v.repo}`, "Default repo secimi icin `gh repo set-default` kullan.", "gh repo set-default ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` repo sayfasini browser'da ac.`, `gh repo view ${v.repo} --web`, "Web tarafina hizli gecis icin `gh repo view --web` kullan.", "gh repo view ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposundaki open issue'lari listele.`, `gh issue list --repo ${v.repo} --state open`, "Repo issue kuyruğunu gormek icin `gh issue list --repo` kullan.", "gh issue list ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda \`${v.label}\` label'li open issue'lari listele.`, `gh issue list --repo ${v.repo} --label ${v.label} --state open`, "Label filtrelemek icin `--label` kullan.", "gh issue list ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda issue ${v.issue} detayini yorumlariyla gor.`, `gh issue view ${v.issue} --comments --repo ${v.repo}`, "Issue gecmisini ve yorumlari gormek icin `--comments` ekle.", "gh issue view ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda issue ${v.issue}'ye \`ack\` notunu ekle.`, `gh issue comment ${v.issue} --body ack --repo ${v.repo}`, "Hizli issue geri bildirimi icin `gh issue comment` kullan.", "gh issue comment ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda issue ${v.issue}'ye \`${v.label}\` label'ini ekle.`, `gh issue edit ${v.issue} --add-label ${v.label} --repo ${v.repo}`, "Label eklemek icin `gh issue edit --add-label` kullan.", "gh issue edit ..."),
  (v, id) => singleQuestion(id, `${v.context} mevcut branch icin \`${v.branch}\` tabanli PR olusturma akisina gir.`, `gh pr create --fill --base ${v.branch}`, "Base branch belirterek PR olusturmak icin `gh pr create --base` kullan.", "gh pr create ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda PR ${v.pr} branch'ine gec.`, `gh pr checkout ${v.pr} --repo ${v.repo}`, "Belirli repo ve PR branch'ini cekmek icin `gh pr checkout` kullan.", "gh pr checkout ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda PR ${v.pr} detayini yorumlariyla gor.`, `gh pr view ${v.pr} --comments --repo ${v.repo}`, "PR tartismasini yorumlarla birlikte gormek icin `gh pr view --comments` kullan.", "gh pr view ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda PR ${v.pr} diff'ini goster.`, `gh pr diff ${v.pr} --repo ${v.repo}`, "Kod degisikliklerini terminalde gormek icin `gh pr diff` kullan.", "gh pr diff ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda PR ${v.pr} checks sonucunu izle.`, `gh pr checks ${v.pr} --watch --repo ${v.repo}`, "Checks tamamlanana kadar beklemek icin `--watch` ekle.", "gh pr checks ..."),
  (v, id) => singleQuestion(id, `${v.context} PR durum ozetini goster.`, "gh pr status", "Uzerinde calistigin ve review bekleyen PR'lari `gh pr status` ile gor.", "gh pr status"),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda \`${v.workflow}\` workflow'unu \`${v.branch}\` ref'i icin tetikle.`, `gh workflow run ${v.workflow} --ref ${v.branch} --repo ${v.repo}`, "Workflow dispatch icin `gh workflow run` kullan.", "gh workflow run ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda \`${v.workflow}\` workflow'una ait son 10 run kaydini goster.`, `gh run list --workflow ${v.workflow} --limit 10 --repo ${v.repo}`, "Workflow bazli run filtrelemek icin `gh run list --workflow` kullan.", "gh run list ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda run ${v.run} loglarinda sadece hata satirlarini goster.`, `gh run view ${v.run} --log-failed --repo ${v.repo}`, "Tum log yerine failed bolumleri icin `--log-failed` kullan.", "gh run view ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda issue aramak icin \`${v.label}\` label'li open issue'lari getir.`, `gh issue list --repo ${v.repo} --label ${v.label} --state open`, "Issue filtrelemede label ve state kombinasyonunu kullan.", "gh issue list ..."),
  (v, id) => multiStepQuestion(id, `${v.context} \`${v.repo}\` reposunda once PR ${v.pr} branch'ine gec, sonra checks durumunu izle.`, [
    {
      answer: `gh pr checkout ${v.pr} --repo ${v.repo}`,
      hintText: "Ilk adimda review edecegin PR branch'ini cek.",
      hintPartial: "gh pr checkout ...",
    },
    {
      answer: `gh pr checks ${v.pr} --watch --repo ${v.repo}`,
      hintText: "Ikinci adimda checks tamamlanana kadar bekle.",
      hintPartial: "gh pr checks ...",
    },
  ]),
];

const seniorGithubCliBaseQuestions = [
  singleQuestion("sgh-001", "`acme/platform-api` reposunda PR 15 review comment'lerini API ile listele.", "gh api repos/acme/platform-api/pulls/15/comments", "REST endpoint'ini `gh api` ile cagir.", "gh api repos/..."),
  singleQuestion("sgh-002", "`acme/platform-api` reposunda run 1201 job detaylarini API ile cek.", "gh api repos/acme/platform-api/actions/runs/1201/jobs", "Actions job verisi icin `gh api` uzerinden jobs endpoint'ine git.", "gh api repos/..."),
  singleQuestion("sgh-003", "PR 15'i squash merge edip branch'i sil.", "gh pr merge 15 --squash --delete-branch", "CLI uzerinden merge stratejisi ve branch silmeyi ayni anda verebilirsin.", "gh pr merge ..."),
  singleQuestion("sgh-004", "PR 15'i approve review ile onayla.", "gh pr review 15 --approve --body approved", "Approve review icin `gh pr review --approve` kullan.", "gh pr review ..."),
  singleQuestion("sgh-005", "PR 15 icin change request review gonder.", "gh pr review 15 --request-changes --body needs-fix", "Degisiklik istemek icin `--request-changes` kullan.", "gh pr review ..."),
  singleQuestion("sgh-006", "Run 1201'de sadece basarisiz job'lari tekrar calistir.", "gh run rerun 1201 --failed", "Tum workflow yerine sadece failed job'lari rerun etmek icin `--failed` kullan.", "gh run rerun ..."),
  singleQuestion("sgh-007", "Run 1201 artifact'larini `./artifacts` klasorune indir.", "gh run download 1201 -D ./artifacts", "Artifact indirme dizini icin `-D` kullan.", "gh run download ..."),
  singleQuestion("sgh-008", "Run 1201 ozetini JSON alanlariyla goster.", "gh run view 1201 --json name,status,conclusion", "Makinece okunur run ozeti icin `--json` kullan.", "gh run view ..."),
  singleQuestion("sgh-009", "`acme/platform-api` reposunda `v1.4.0` release detayini goster.", "gh release view v1.4.0 --repo acme/platform-api", "Belirli release'i repo baglami ile gormek icin `gh release view --repo` kullan.", "gh release view ..."),
  singleQuestion("sgh-010", "`acme/platform-api` reposundaki repository variable listesini goster.", "gh variable list -R acme/platform-api", "Repo bazli variable gormek icin `gh variable list -R` kullan.", "gh variable list ..."),
];

const seniorGithubCliTemplates = [
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` repository metadata'sini API ile cek.`, `gh api repos/${v.repo}`, "Ham repository bilgisini almak icin `gh api repos/<owner>/<repo>` kullan.", "gh api repos/..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda PR ${v.pr} review comment'lerini API ile listele.`, `gh api repos/${v.repo}/pulls/${v.pr}/comments`, "PR review comment endpoint'ini `gh api` ile cagir.", "gh api repos/..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda run ${v.run} job detaylarini API ile cek.`, `gh api repos/${v.repo}/actions/runs/${v.run}/jobs`, "Actions job verisi icin run jobs endpoint'ini kullan.", "gh api repos/..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposundaki son release bilgisini API ile al.`, `gh api repos/${v.repo}/releases/latest`, "Son release metadata'si icin latest endpoint'ini cagir.", "gh api repos/..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda \`${v.branch}\` branch koruma ayarini API ile gor.`, `gh api repos/${v.repo}/branches/${v.branch}/protection`, "Branch protection denetimi icin protection endpoint'ini kullan.", "gh api repos/..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda PR ${v.pr}'i squash merge edip branch'i sil.`, `gh pr merge ${v.pr} --squash --delete-branch --repo ${v.repo}`, "Merge stratejisi ve branch cleanup'i ayni komutta ver.", "gh pr merge ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda PR ${v.pr}'i approve review ile onayla.`, `gh pr review ${v.pr} --approve --body approved --repo ${v.repo}`, "Approve review gondermek icin `gh pr review --approve` kullan.", "gh pr review ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda PR ${v.pr} icin change request review gonder.`, `gh pr review ${v.pr} --request-changes --body needs-fix --repo ${v.repo}`, "Degisiklik istemek icin `--request-changes` kullan.", "gh pr review ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda PR ${v.pr}'e \`investigating\` notunu ekle.`, `gh pr comment ${v.pr} --body investigating --repo ${v.repo}`, "Review disi ek yorum icin `gh pr comment` kullan.", "gh pr comment ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda PR ${v.pr} checks sonucunu izle.`, `gh pr checks ${v.pr} --watch --repo ${v.repo}`, "Checks tamamlanana kadar `--watch` ile bekle.", "gh pr checks ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda run ${v.run}'de sadece failed job'lari rerun et.`, `gh run rerun ${v.run} --failed --repo ${v.repo}`, "Tum workflow yerine yalnizca basarisiz job'lari calistir.", "gh run rerun ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda run ${v.run} artifact'larini \`./artifacts\` klasorune indir.`, `gh run download ${v.run} -D ./artifacts --repo ${v.repo}`, "Artifact cikisini belirli dizine almak icin `-D` kullan.", "gh run download ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda run ${v.run} ozetini JSON alanlariyla goster.`, `gh run view ${v.run} --json name,status,conclusion --repo ${v.repo}`, "Makinece okunur ozet icin `gh run view --json` kullan.", "gh run view ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda \`${v.tag}\` release detayini goster.`, `gh release view ${v.tag} --repo ${v.repo}`, "Belirli release'i gormek icin `gh release view` kullan.", "gh release view ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda \`${v.tag}\` release asset'lerini \`./releases\` klasorune indir.`, `gh release download ${v.tag} -D ./releases --repo ${v.repo}`, "Release artifact'larini belirli dizine indirmek icin `-D` kullan.", "gh release download ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposundaki repository variable listesini goster.`, `gh variable list -R ${v.repo}`, "Repo variable denetimi icin `gh variable list -R` kullan.", "gh variable list ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposundaki repository secret listesini goster.`, `gh secret list -R ${v.repo}`, "Secret isimlerini kontrol etmek icin `gh secret list -R` kullan.", "gh secret list ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda \`TODO\` gecen kodlari ara.`, `gh search code TODO --repo ${v.repo}`, "Kod aramasi icin `gh search code` kullan.", "gh search code ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda \`${v.label}\` label'li open issue'lari listele.`, `gh issue list --repo ${v.repo} --label ${v.label} --state open`, "Incident veya release label'li issue'lari filtrelemek icin `--label` kullan.", "gh issue list ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.repo}\` reposunda PR ${v.pr} durumunu JSON alanlariyla goster.`, `gh pr view ${v.pr} --json state,mergeStateStatus,reviewDecision --repo ${v.repo}`, "Merge readiness kontrolu icin `gh pr view --json` kullan.", "gh pr view ..."),
];

await writeTopicFile("junior", "docker", juniorContainersBaseQuestions, "containers");
await writeTopicFile("junior", "docker", generateQuestions("jdkr-exp", CONTAINER_VARIANTS, juniorContainersTemplates), "containers-expanded");

await writeTopicFile("junior", "github-cli", juniorGithubCliBaseQuestions);
await writeTopicFile("junior", "github-cli", generateQuestions("jgh-exp", GH_VARIANTS, juniorGithubCliTemplates), "github-cli-expanded");

await writeTopicFile("mid", "github-cli", midGithubCliBaseQuestions);
await writeTopicFile("mid", "github-cli", generateQuestions("mgh-exp", GH_VARIANTS, midGithubCliTemplates), "github-cli-expanded");

await writeTopicFile("senior", "github-cli", seniorGithubCliBaseQuestions);
await writeTopicFile("senior", "github-cli", generateQuestions("sgh-exp", GH_VARIANTS, seniorGithubCliTemplates), "github-cli-expanded");

console.log("containers and github-cli topics generated");
