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

const USERS = ["deploy", "app", "backup", "reporting", "analytics", "ops", "api", "worker", "support", "build"];
const GROUPS = ["docker", "developers", "analytics", "support", "ops", "infra", "ci", "backup", "readonly", "dbops"];
const USER_DIRS = [
  "/srv/deploy",
  "/srv/app",
  "/srv/backup",
  "/srv/reporting",
  "/srv/analytics",
  "/srv/ops",
  "/srv/api",
  "/srv/worker",
  "/srv/support",
  "/srv/build",
];
const EXPIRY_DATES = ["2026-12-31", "2026-11-30", "2026-10-31", "2026-09-30", "2026-08-31", "2026-07-31", "2026-06-30", "2026-05-31", "2026-04-30", "2026-03-31"];

const FEATURES = ["login-ui", "billing-export", "cache-refresh", "search-tuning", "auth-audit", "alert-cleanup", "db-metrics", "queue-retry", "report-fix", "release-notes"];
const RELEASES = ["1.4.0", "1.5.0", "1.5.1", "1.6.0", "1.6.1", "1.7.0", "1.8.0", "2.0.0", "2.0.1", "2.1.0"];
const HOTFIXES = ["auth-timeout", "ssl-chain", "cache-leak", "queue-stall", "db-rollback", "header-bug", "token-expiry", "worker-crash", "billing-rounding", "search-regression"];

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

function userVariant(index) {
  return {
    context: CONTEXTS[index],
    user: USERS[index],
    group: GROUPS[index],
    dir: USER_DIRS[index],
    expiryDate: EXPIRY_DATES[index],
  };
}

function gitFlowVariant(index) {
  return {
    context: CONTEXTS[index],
    feature: FEATURES[index],
    release: RELEASES[index],
    hotfix: HOTFIXES[index],
  };
}

const userVariants = Array.from({ length: 10 }, (_, index) => userVariant(index));
const gitFlowVariants = Array.from({ length: 10 }, (_, index) => gitFlowVariant(index));

const juniorUserBaseQuestions = [
  singleQuestion("jusr-001", "Mevcut kullaniciyi gor.", "whoami", "Aktif shell'in hangi hesapla calistigini gormek icin `whoami` kullan.", "whoami"),
  singleQuestion("jusr-002", "Mevcut kullanicinin UID, GID ve group bilgisini gor.", "id", "Mevcut hesabin kimlik bilgisini topluca gormek icin `id` kullan.", "id"),
  singleQuestion("jusr-003", "Mevcut kullanicinin group uyeliklerini gor.", "groups", "Aktif kullanicinin gruplarini `groups` ile listele.", "groups"),
  singleQuestion("jusr-004", "Login olan kullanicilari gor.", "who", "Sistemde oturum acmis kullanicilari `who` ile gor.", "who"),
  singleQuestion("jusr-005", "`ali` kullanicisinin passwd kaydini gor.", "getent passwd ali", "Belirli bir hesabin sistem kaydini `getent passwd` ile oku.", "getent passwd ..."),
  singleQuestion("jusr-006", "`developers` grubunun kaydini gor.", "getent group developers", "Bir grubun sistem kaydini `getent group` ile sorgula.", "getent group ..."),
  singleQuestion("jusr-007", "`ali` kullanicisinin UID, GID ve group bilgisini gor.", "id ali", "Belirli bir kullanicinin kimlik bilgisini `id` ile denetle.", "id ..."),
  singleQuestion("jusr-008", "`ali` kullanicisinin group uyeliklerini gor.", "groups ali", "Belirli bir kullanicinin gruplarini `groups` ile listele.", "groups ..."),
  singleQuestion("jusr-009", "Home dizini ile birlikte `ali` kullanicisini olustur.", "useradd -m ali", "Yeni bir hesabi home dizini ile birlikte acmak icin `useradd -m` kullan.", "useradd -m ..."),
  singleQuestion("jusr-010", "`ali` kullanicisi icin parola belirle.", "passwd ali", "Yeni veya mevcut bir hesaba parola atamak icin `passwd` kullan.", "passwd ..."),
  singleQuestion("jusr-011", "`developers` grubunu olustur.", "groupadd developers", "Yeni bir grup tanimlamak icin `groupadd` kullan.", "groupadd ..."),
  singleQuestion("jusr-012", "`ali` kullanicisini `developers` grubuna ekle.", "usermod -aG developers ali", "Kullaniciyi ek gruba katmak icin `usermod -aG` kullan.", "usermod -aG ..."),
  singleQuestion("jusr-013", "`ali` kullanicisini `developers` grubundan cikar.", "gpasswd -d ali developers", "Kullaniciyi belirli bir gruptan cikarmak icin `gpasswd -d` kullan.", "gpasswd -d ..."),
  singleQuestion("jusr-014", "`ali` kullanicisinin parola durumunu gor.", "passwd -S ali", "Parolanin aktif veya kilitli durumunu `passwd -S` ile gor.", "passwd -S ..."),
  singleQuestion("jusr-015", "`ali` kullanicisinin parolasini kilitle.", "passwd -l ali", "Hesabi silmeden parola login'ini kapatmak icin `passwd -l` kullan.", "passwd -l ..."),
  singleQuestion("jusr-016", "`ali` kullanicisinin parola kilidini ac.", "passwd -u ali", "Kilitli parolayi tekrar aktif etmek icin `passwd -u` kullan.", "passwd -u ..."),
  singleQuestion("jusr-017", "`ali` kullanicisinin parola aging bilgisini gor.", "chage -l ali", "Hesabin expiry ve warning politikasini `chage -l` ile gor.", "chage -l ..."),
  singleQuestion("jusr-018", "`ali` kullanicisinin son login bilgisini gor.", "lastlog -u ali", "Belirli bir hesabin en son login zamanini `lastlog` ile kontrol et.", "lastlog -u ..."),
  singleQuestion("jusr-019", "`ali` kullanicisini sil.", "userdel ali", "Bir hesabi home dizini kalacak sekilde silmek icin `userdel` kullan.", "userdel ..."),
  singleQuestion("jusr-020", "`ali` kullanicisini home diziniyle birlikte sil.", "userdel -r ali", "Offboarding sirasinda kullaniciyi home'u ile birlikte kaldir.", "userdel -r ..."),
];

const juniorGitFlowBaseQuestions = [
  singleQuestion("jgf-001", "Git flow yapisini varsayilan ayarlarla baslat.", "git flow init -d", "Varsayilan branch isimleriyle hizli baslatmak icin `git flow init -d` kullan.", "git flow init ..."),
  singleQuestion("jgf-002", "Aktif branch adini goster.", "git branch --show-current", "Hangi branch'te oldugunu hizli gormek icin `git branch --show-current` kullan.", "git branch --show-current"),
  singleQuestion("jgf-003", "Tum feature branch'lerini listele.", "git flow feature list", "Aktif feature branch'lerini `feature list` ile gor.", "git flow feature list"),
  singleQuestion("jgf-004", "`login-ui` feature branch'ini baslat.", "git flow feature start login-ui", "Yeni bir feature branch'i acmak icin `feature start` kullan.", "git flow feature start ..."),
  singleQuestion("jgf-005", "`login-ui` feature branch'ini remote'a publish et.", "git flow feature publish login-ui", "Takimla paylasmak icin feature branch'ini publish et.", "git flow feature publish ..."),
  singleQuestion("jgf-006", "`login-ui` feature branch'ini finish et.", "git flow feature finish login-ui", "Feature tamamlandiginda `feature finish` ile kapat.", "git flow feature finish ..."),
  singleQuestion("jgf-007", "Tum release branch'lerini listele.", "git flow release list", "Aktif release branch'lerini `release list` ile gor.", "git flow release list"),
  singleQuestion("jgf-008", "`1.6.0` release branch'ini baslat.", "git flow release start 1.6.0", "Release hazirligi icin `release start` kullan.", "git flow release start ..."),
  singleQuestion("jgf-009", "`1.6.0` release branch'ini remote'a publish et.", "git flow release publish 1.6.0", "Takimla ortak release calismasi icin publish et.", "git flow release publish ..."),
  multiStepQuestion("jgf-010", "`1.6.0` release branch'ini finish et, sonra main'i, develop'u ve tag'leri remote'a gonder.", [
    {
      answer: "git flow release finish 1.6.0",
      hintText: "Release'i kapatip main ve develop akisina geri almak icin `release finish` kullan.",
      hintPartial: "git flow release finish ...",
    },
    {
      answer: "git push origin main",
      hintText: "Release sonucu guncellenen main branch'ini remote'a gonder.",
      hintPartial: "git push origin ...",
    },
    {
      answer: "git push origin develop",
      hintText: "Release sonucu guncellenen develop branch'ini remote'a gonder.",
      hintPartial: "git push origin ...",
    },
    {
      answer: "git push origin --tags",
      hintText: "Release tag'lerini de remote'a gondermeyi unutma.",
      hintPartial: "git push origin ...",
    },
  ]),
  singleQuestion("jgf-011", "Tum hotfix branch'lerini listele.", "git flow hotfix list", "Aktif hotfix branch'lerini `hotfix list` ile gor.", "git flow hotfix list"),
  singleQuestion("jgf-012", "`auth-timeout` hotfix branch'ini baslat.", "git flow hotfix start auth-timeout", "Production acili icin `hotfix start` kullan.", "git flow hotfix start ..."),
  singleQuestion("jgf-013", "`auth-timeout` hotfix branch'ini remote'a publish et.", "git flow hotfix publish auth-timeout", "Acil duzeltmeyi paylasmak icin hotfix publish et.", "git flow hotfix publish ..."),
  multiStepQuestion("jgf-014", "`auth-timeout` hotfix branch'ini finish et, sonra main'i, develop'u ve tag'leri remote'a gonder.", [
    {
      answer: "git flow hotfix finish auth-timeout",
      hintText: "Hotfix'i main ve develop akisina geri almak icin `hotfix finish` kullan.",
      hintPartial: "git flow hotfix finish ...",
    },
    {
      answer: "git push origin main",
      hintText: "Hotfix sonucu guncellenen main branch'ini remote'a gonder.",
      hintPartial: "git push origin ...",
    },
    {
      answer: "git push origin develop",
      hintText: "Hotfix sonucu guncellenen develop branch'ini remote'a gonder.",
      hintPartial: "git push origin ...",
    },
    {
      answer: "git push origin --tags",
      hintText: "Hotfix tag'lerini de remote'a gonder.",
      hintPartial: "git push origin ...",
    },
  ]),
  singleQuestion("jgf-015", "Tum remote bilgilerini guncelle ve stale branch'leri temizle.", "git fetch --all --prune", "Remote referanslarini tazelemek icin `fetch --all --prune` kullan.", "git fetch --all ..."),
  singleQuestion("jgf-016", "Tum branch gecmisini graph formatta goster.", "git log --oneline --graph --decorate --all", "Flow akisini denetlemek icin graph gorunumu kullan.", "git log ..."),
];

const midUserBaseQuestions = [
  singleQuestion("musr-001", "`deploy` kullanicisinin passwd kaydini gor.", "getent passwd deploy", "Bir hesabin sistem kaydini gormek icin `getent passwd` kullan.", "getent passwd ..."),
  singleQuestion("musr-002", "`deploy` kullanicisinin UID, GID ve group bilgisini gor.", "id deploy", "Belirli bir kullanicinin kimlik bilgisini `id` ile gor.", "id ..."),
  multiStepQuestion("musr-003", "`deploy` kullanicisini home dizini ve bash shell ile olustur, sonra `docker` grubuna ekle.", [
    {
      answer: "useradd -m -s /bin/bash deploy",
      hintText: "Login shell ve home dizini ile kullanici olustur.",
      hintPartial: "useradd -m -s ...",
    },
    {
      answer: "usermod -aG docker deploy",
      hintText: "Kullaniciyi ek bir gruba dahil etmek icin group ekleme secenegini kullan.",
      hintPartial: "usermod -aG ...",
    },
  ]),
  singleQuestion("musr-004", "`deploy` kullanicisinin parola durumunu gor.", "passwd -S deploy", "Parolanin aktif, kilitli veya tarih durumunu `passwd` durum gorunumuyle oku.", "passwd -S ..."),
  singleQuestion("musr-005", "`deploy` kullanicisi icin parola aging bilgisini gor.", "chage -l deploy", "Parola yaslandirma politikasini `chage -l` ile gor.", "chage -l ..."),
  singleQuestion("musr-006", "`deploy` kullanicisinin parolasini kilitle.", "passwd -l deploy", "Hesabi tamamen silmeden parola ile girisi kilitle.", "passwd -l ..."),
  singleQuestion("musr-007", "`deploy` kullanicisinin parola kilidini ac.", "passwd -u deploy", "Daha once kilitlenen parolayi geri ac.", "passwd -u ..."),
  singleQuestion("musr-008", "`deploy` kullanicisi icin parola maksimum yasini 90 gun yap.", "chage -M 90 deploy", "Parola suresini gun bazinda `chage` ile ayarla.", "chage -M ..."),
  singleQuestion("musr-009", "`deploy` kullanicisinin sudo yetkilerini kontrol et.", "sudo -l -U deploy", "Bir kullanicinin sudo kapsamini denetlemek icin `sudo -l -U` kullan.", "sudo -l -U ..."),
  singleQuestion("musr-010", "`deploy` kullanicisi ve `docker` grubu sahibi olacak sekilde `/srv/deploy` dizinini olustur.", "install -d -o deploy -g docker /srv/deploy", "Sahiplik vererek dizin olusturmak icin `install -d` kullan.", "install -d ..."),
];

const seniorUserBaseQuestions = [
  singleQuestion("susr-001", "UID degeri 0 olan tum hesaplari listele.", "awk -F: '$3 == 0 {print $1}' /etc/passwd", "Root yetkisine sahip hesaplari passwd verisinden filtrele.", "awk -F: ... /etc/passwd"),
  singleQuestion("susr-002", "Sistemde sahibi veya grubu bulunamayan dosyalari tara.", "find / -nouser -o -nogroup 2>/dev/null", "Eski veya silinmis hesap artigini bulmak icin `find` audit'i yap.", "find / ..."),
  singleQuestion("susr-003", "Interaktif shell'i olan tum hesaplari listele.", "awk -F: '$7 !~ /(nologin|false)$/ {print $1 \":\" $7}' /etc/passwd", "Gercek login shell kullanan hesaplari passwd alanlari uzerinden ayikla.", "awk -F: ... /etc/passwd"),
  singleQuestion("susr-004", "`deploy` kullanicisinin sudo yetkilerini denetle.", "sudo -l -U deploy", "Sudo kapsamini audit etmek icin `sudo -l -U` kullan.", "sudo -l -U ..."),
  singleQuestion("susr-005", "`deploy` kullanicisinin son login bilgisini gor.", "lastlog -u deploy", "En son giris zamanini `lastlog` ile kontrol et.", "lastlog -u ..."),
  singleQuestion("susr-006", "`deploy` kullanicisinin parola aging politikasini gor.", "chage -l deploy", "Hesabin expiry ve warning politikasini `chage -l` ile denetle.", "chage -l ..."),
  singleQuestion("susr-007", "`deploy` kullanicisinin shell'ini `nologin` yap.", "usermod -s /usr/sbin/nologin deploy", "Servis hesabi yapmak veya interaktif girisi kapatmak icin shell'i degistir.", "usermod -s ..."),
  singleQuestion("susr-008", "`deploy` kullanicisi ve `docker` grubu sahibi olacak sekilde `750` izinli `/srv/deploy` dizinini olustur.", "install -d -o deploy -g docker -m 750 /srv/deploy", "Sahiplik ve izinle dizin olusturmak icin `install -d -m` kullan.", "install -d ..."),
  singleQuestion("susr-009", "Home dizinlerini birinci seviyede listele.", "find /home -maxdepth 1 -mindepth 1 -type d -printf '%f\\n'", "Gercek kullanici home dizinlerini ilk seviyede filtrele.", "find /home ..."),
  singleQuestion("susr-010", "`deploy` kullanicisinin passwd alanlarindan kullanici, uid, gid, home ve shell bilgisini goster.", "getent passwd deploy | cut -d: -f1,3,4,6,7", "Passwd kaydindan secili alanlari almak icin ayirici kullan.", "getent passwd ... | cut ..."),
];

const juniorUserTemplates = [
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin passwd kaydini gor.`, `getent passwd ${v.user}`, "Sistem hesap kaydini gormek icin `getent passwd` kullan.", "getent passwd ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.group}\` grubunun kaydini gor.`, `getent group ${v.group}`, "Grup kaydini sistem veritabanindan okumak icin `getent group` kullan.", "getent group ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin UID, GID ve group bilgisini gor.`, `id ${v.user}`, "Bir hesabin kimlik bilgisini `id` ile goster.", "id ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin group uyeliklerini gor.`, `groups ${v.user}`, "Kullanicinin gruplarini `groups` ile listele.", "groups ..."),
  (v, id) => singleQuestion(id, `${v.context} home dizini ile birlikte \`${v.user}\` kullanicisini olustur.`, `useradd -m ${v.user}`, "Yeni hesabi home dizini ile birlikte acmak icin `useradd -m` kullan.", "useradd -m ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisi icin parola belirle.`, `passwd ${v.user}`, "Hesaba parola atamak icin `passwd` kullan.", "passwd ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.group}\` grubunu olustur.`, `groupadd ${v.group}`, "Yeni grup acmak icin `groupadd` kullan.", "groupadd ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.group}\` grubunu sil.`, `groupdel ${v.group}`, "Artik kullanilmayan grubu `groupdel` ile sil.", "groupdel ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisini \`${v.group}\` grubuna ekle.`, `usermod -aG ${v.group} ${v.user}`, "Kullaniciyi ek gruba katmak icin `usermod -aG` kullan.", "usermod -aG ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisini \`${v.group}\` grubundan cikar.`, `gpasswd -d ${v.user} ${v.group}`, "Kullaniciyi belirli bir gruptan cikarmak icin `gpasswd -d` kullan.", "gpasswd -d ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin parola durumunu gor.`, `passwd -S ${v.user}`, "Parola kilit durumunu `passwd -S` ile denetle.", "passwd -S ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin parolasini kilitle.`, `passwd -l ${v.user}`, "Parola ile girisi kapatmak icin `passwd -l` kullan.", "passwd -l ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin parola kilidini ac.`, `passwd -u ${v.user}`, "Kilitli hesabi tekrar aktif etmek icin `passwd -u` kullan.", "passwd -u ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin parola aging bilgisini gor.`, `chage -l ${v.user}`, "Expiry ve warning politikasini `chage -l` ile gor.", "chage -l ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin son login bilgisini gor.`, `lastlog -u ${v.user}`, "Son login zamanini `lastlog` ile denetle.", "lastlog -u ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` ve \`${v.group}\` sahibi olacak sekilde \`${v.dir}\` dizinini olustur.`, `install -d -o ${v.user} -g ${v.group} ${v.dir}`, "Sahiplik vererek dizin olusturmak icin `install -d` kullan.", "install -d ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisini sil.`, `userdel ${v.user}`, "Hesabi home dizini kalacak sekilde silmek icin `userdel` kullan.", "userdel ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisini home diziniyle birlikte sil.`, `userdel -r ${v.user}`, "Offboarding icin kullaniciyi home'u ile birlikte kaldir.", "userdel -r ..."),
  (v, id) => multiStepQuestion(id, `${v.context} \`${v.user}\` kullanicisini olustur, sonra \`${v.group}\` grubuna ekle.`, [
    {
      answer: `useradd -m ${v.user}`,
      hintText: "Ilk adimda hesabi home dizini ile birlikte ac.",
      hintPartial: "useradd -m ...",
    },
    {
      answer: `usermod -aG ${v.group} ${v.user}`,
      hintText: "Ikinci adimda gerekli ek gruba dahil et.",
      hintPartial: "usermod -aG ...",
    },
  ]),
  (v, id) => multiStepQuestion(id, `${v.context} \`${v.user}\` kullanicisinin parolasini kilitle, sonra durumunu dogrula.`, [
    {
      answer: `passwd -l ${v.user}`,
      hintText: "Ilk adimda parola login'ini kapat.",
      hintPartial: "passwd -l ...",
    },
    {
      answer: `passwd -S ${v.user}`,
      hintText: "Ikinci adimda kilit durumunu `passwd -S` ile kontrol et.",
      hintPartial: "passwd -S ...",
    },
  ]),
];

const midUserTemplates = [
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin passwd kaydini gor.`, `getent passwd ${v.user}`, "Sistem hesap kaydini gormek icin `getent passwd` kullan.", "getent passwd ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin UID, GID ve group bilgisini gor.`, `id ${v.user}`, "Belirli bir kullanicinin kimlik bilgisini `id` ile gor.", "id ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin group uyeliklerini gor.`, `groups ${v.user}`, "Kullanicinin ikincil gruplarini `groups` ile listele.", "groups ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.group}\` grubunun kaydini gor.`, `getent group ${v.group}`, "Bir grubun sistem kaydini `getent group` ile sorgula.", "getent group ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisini home dizini ve bash shell ile olustur.`, `useradd -m -s /bin/bash ${v.user}`, "Login shell ve home ile yeni bir kullanici ac.", "useradd -m -s ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisi icin parola belirle.`, `passwd ${v.user}`, "Hesaba parola atamak icin `passwd` kullan.", "passwd ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisini \`${v.group}\` grubuna ekle.`, `usermod -aG ${v.group} ${v.user}`, "Bir kullaniciyi ek gruba katmak icin `usermod -aG` kullan.", "usermod -aG ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisini \`${v.group}\` grubundan cikar.`, `gpasswd -d ${v.user} ${v.group}`, "Kullaniciyi belirli bir gruptan cikarmak icin `gpasswd -d` kullan.", "gpasswd -d ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin parolasini kilitle.`, `passwd -l ${v.user}`, "Hesabi silmeden parola login'ini kapat.", "passwd -l ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin parola kilidini ac.`, `passwd -u ${v.user}`, "Kilitli parolayi tekrar aktif et.", "passwd -u ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin parola durumunu gor.`, `passwd -S ${v.user}`, "Hesabin parola durumunu `passwd -S` ile denetle.", "passwd -S ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin parola aging bilgisini gor.`, `chage -l ${v.user}`, "Expiry ve warning politikasini `chage -l` ile gor.", "chage -l ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisi icin parola maksimum yasini 90 gun yap.`, `chage -M 90 ${v.user}`, "Parola maksimum yasini gun cinsinden ayarla.", "chage -M ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin hesap bitis tarihini \`${v.expiryDate}\` yap.`, `chage -E ${v.expiryDate} ${v.user}`, "Hesaba son gecerlilik tarihi vermek icin `chage -E` kullan.", "chage -E ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin shell'ini \`nologin\` yap.`, `usermod -s /usr/sbin/nologin ${v.user}`, "Interaktif login'i kapatmak icin shell'i degistir.", "usermod -s ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin sudo yetkilerini kontrol et.`, `sudo -l -U ${v.user}`, "Bir hesabin sudo kapsamini denetle.", "sudo -l -U ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin son login bilgisini gor.`, `lastlog -u ${v.user}`, "Son login zamanini `lastlog` ile denetle.", "lastlog -u ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` ve \`${v.group}\` sahibi olacak sekilde \`${v.dir}\` dizinini olustur.`, `install -d -o ${v.user} -g ${v.group} ${v.dir}`, "Sahiplik vererek dizin olusturmak icin `install -d` kullan.", "install -d ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisini home diziniyle birlikte sil.`, `userdel -r ${v.user}`, "Offboarding icin kullaniciyi home'u ile birlikte kaldir.", "userdel -r ..."),
  (v, id) => multiStepQuestion(id, `${v.context} \`${v.user}\` kullanicisini olustur, sonra \`${v.group}\` grubuna ekle.`, [
    {
      answer: `useradd -m -s /bin/bash ${v.user}`,
      hintText: "Ilk adimda login shell ve home ile hesap ac.",
      hintPartial: "useradd -m -s ...",
    },
    {
      answer: `usermod -aG ${v.group} ${v.user}`,
      hintText: "Ikinci adimda kullaniciyi gerekli gruba dahil et.",
      hintPartial: "usermod -aG ...",
    },
  ]),
];

const seniorUserTemplates = [
  (v, id) => singleQuestion(id, `${v.context} UID degeri 0 olan tum hesaplari listele.`, "awk -F: '$3 == 0 {print $1}' /etc/passwd", "Root esdegeri hesaplari passwd verisinden filtrele.", "awk -F: ... /etc/passwd"),
  (v, id) => singleQuestion(id, `${v.context} sahibi veya grubu bulunamayan dosyalari tara.`, "find / -nouser -o -nogroup 2>/dev/null", "Silinmis hesaplardan kalan dosyalari `find` ile tespit et.", "find / ..."),
  (v, id) => singleQuestion(id, `${v.context} interaktif shell'i olan tum hesaplari listele.`, "awk -F: '$7 !~ /(nologin|false)$/ {print $1 \":\" $7}' /etc/passwd", "Gercek login shell kullanan hesaplari passwd alanlarindan ayikla.", "awk -F: ... /etc/passwd"),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin sudo yetkilerini audit et.`, `sudo -l -U ${v.user}`, "Sudo kapsam denetimi icin `sudo -l -U` kullan.", "sudo -l -U ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin son login bilgisini gor.`, `lastlog -u ${v.user}`, "En son login kaydini `lastlog` ile denetle.", "lastlog -u ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin parola durumunu audit et.`, `passwd -S ${v.user}`, "Parola kilit ve politika durumunu `passwd -S` ile gor.", "passwd -S ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin aging politikasini gor.`, `chage -l ${v.user}`, "Expiry ve warning politikasini `chage -l` ile denetle.", "chage -l ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin shell'ini \`nologin\` yap.`, `usermod -s /usr/sbin/nologin ${v.user}`, "Interaktif erisimi kapatmak icin shell'i degistir.", "usermod -s ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` ve \`${v.group}\` sahibi olacak sekilde \`750\` izinli \`${v.dir}\` dizinini olustur.`, `install -d -o ${v.user} -g ${v.group} -m 750 ${v.dir}`, "Sahiplik ve izin vererek dizin hazirla.", "install -d ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin passwd alanlarindan kullanici, uid, gid, home ve shell bilgisini goster.`, `getent passwd ${v.user} | cut -d: -f1,3,4,6,7`, "Passwd kaydindan secili alanlari ayiklamak icin ayirici kullan.", "getent passwd ... | cut ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin sahip oldugu \`/srv\` altindaki dizinleri listele.`, `find /srv -maxdepth 2 -type d -user ${v.user} -printf '%u:%g %p\\n'`, "Belirli bir hesabin sahipligini dizin bazinda audit et.", "find /srv ..."),
  (v, id) => singleQuestion(id, `${v.context} \`/home\` altindaki dizinleri birinci seviyede listele.`, "find /home -maxdepth 1 -mindepth 1 -type d -printf '%f\\n'", "Home dizinlerini ilk seviyede filtreleyerek gor.", "find /home ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin hesap bitis tarihini \`${v.expiryDate}\` yap.`, `chage -E ${v.expiryDate} ${v.user}`, "Hesabi tarih bazli kapatmak icin `chage -E` kullan.", "chage -E ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisi icin parola maksimum yasini 90 gun yap.`, `chage -M 90 ${v.user}`, "Parola politikasini gun bazinda duzenle.", "chage -M ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.group}\` grubunun kaydini denetle.`, `getent group ${v.group}`, "Grubun sistem kaydini `getent group` ile oku.", "getent group ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin UID, GID ve group bilgisini gor.`, `id ${v.user}`, "Hesabin kimlik bilgisini `id` ile denetle.", "id ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin parolasini kilitle.`, `passwd -l ${v.user}`, "Acil durumda parola login'ini kapat.", "passwd -l ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin parola kilidini ac.`, `passwd -u ${v.user}`, "Bakim sonrasi hesabi yeniden aktif et.", "passwd -u ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisinin passwd kaydini gor.`, `getent passwd ${v.user}`, "Passwd kaydi ile home ve shell alanlarini kontrol et.", "getent passwd ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}\` kullanicisi icin sudo erisimi audit etmek amaciyla \`sudo -l -U\` calistir.`, `sudo -l -U ${v.user}`, "Yetki kapsam audit'inde `sudo -l -U` kullanilir.", "sudo -l -U ..."),
];

const juniorGitFlowTemplates = [
  (v, id) => singleQuestion(id, `${v.context} git flow yapisini varsayilan ayarlarla baslat.`, "git flow init -d", "Flow yapisini varsayilan branch isimleriyle kurmak icin `git flow init -d` kullan.", "git flow init ..."),
  (v, id) => singleQuestion(id, `${v.context} aktif branch adini goster.`, "git branch --show-current", "Bulundugun branch'i hizli gormek icin bu komutu kullan.", "git branch --show-current"),
  (v, id) => singleQuestion(id, `${v.context} \`${v.feature}\` feature branch'ini baslat.`, `git flow feature start ${v.feature}`, "Yeni bir feature branch'i acmak icin `feature start` kullan.", "git flow feature start ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.feature}\` feature branch'ini remote'a publish et.`, `git flow feature publish ${v.feature}`, "Takimla paylasmak icin feature branch'ini publish et.", "git flow feature publish ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.feature}\` feature branch'ini finish et.`, `git flow feature finish ${v.feature}`, "Feature tamamlandiginda `feature finish` ile kapat.", "git flow feature finish ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.feature}\` feature branch'ini git flow ile checkout et.`, `git flow feature checkout ${v.feature}`, "Belirli feature branch'ine gecmek icin `feature checkout` kullan.", "git flow feature checkout ..."),
  (v, id) => singleQuestion(id, `${v.context} origin'deki \`${v.feature}\` feature branch'ini takip etmeye basla.`, `git flow feature track ${v.feature}`, "Remote feature branch'ini yerelde takip etmek icin `feature track` kullan.", "git flow feature track ..."),
  (v, id) => singleQuestion(id, `${v.context} tum feature branch'lerini listele.`, "git flow feature list", "Aktif feature branch'lerini `feature list` ile gor.", "git flow feature list"),
  (v, id) => singleQuestion(id, `${v.context} \`${v.release}\` release branch'ini baslat.`, `git flow release start ${v.release}`, "Release hazirligi icin `release start` kullan.", "git flow release start ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.release}\` release branch'ini remote'a publish et.`, `git flow release publish ${v.release}`, "Release branch'ini ekip ile paylasmak icin publish et.", "git flow release publish ..."),
  (v, id) => multiStepQuestion(id, `${v.context} \`${v.release}\` release branch'ini finish et, sonra main'i, develop'u ve tag'leri remote'a gonder.`, [
    {
      answer: `git flow release finish ${v.release}`,
      hintText: "Ilk adimda release branch'ini finish et.",
      hintPartial: "git flow release finish ...",
    },
    {
      answer: "git push origin main",
      hintText: "Finish sonrasi guncellenen main branch'ini remote'a gonder.",
      hintPartial: "git push origin ...",
    },
    {
      answer: "git push origin develop",
      hintText: "Finish sonrasi guncellenen develop branch'ini remote'a gonder.",
      hintPartial: "git push origin ...",
    },
    {
      answer: "git push origin --tags",
      hintText: "Release tag'lerini de remote'a gonder.",
      hintPartial: "git push origin ...",
    },
  ]),
  (v, id) => singleQuestion(id, `${v.context} tum release branch'lerini listele.`, "git flow release list", "Aktif release branch'lerini `release list` ile gor.", "git flow release list"),
  (v, id) => singleQuestion(id, `${v.context} \`${v.hotfix}\` hotfix branch'ini baslat.`, `git flow hotfix start ${v.hotfix}`, "Production acili icin `hotfix start` kullan.", "git flow hotfix start ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.hotfix}\` hotfix branch'ini remote'a publish et.`, `git flow hotfix publish ${v.hotfix}`, "Acil duzeltmeyi paylasmak icin hotfix publish et.", "git flow hotfix publish ..."),
  (v, id) => multiStepQuestion(id, `${v.context} \`${v.hotfix}\` hotfix branch'ini finish et, sonra main'i, develop'u ve tag'leri remote'a gonder.`, [
    {
      answer: `git flow hotfix finish ${v.hotfix}`,
      hintText: "Ilk adimda hotfix branch'ini finish et.",
      hintPartial: "git flow hotfix finish ...",
    },
    {
      answer: "git push origin main",
      hintText: "Finish sonrasi guncellenen main branch'ini remote'a gonder.",
      hintPartial: "git push origin ...",
    },
    {
      answer: "git push origin develop",
      hintText: "Finish sonrasi guncellenen develop branch'ini remote'a gonder.",
      hintPartial: "git push origin ...",
    },
    {
      answer: "git push origin --tags",
      hintText: "Hotfix tag'lerini de remote'a gonder.",
      hintPartial: "git push origin ...",
    },
  ]),
  (v, id) => singleQuestion(id, `${v.context} tum hotfix branch'lerini listele.`, "git flow hotfix list", "Aktif hotfix branch'lerini `hotfix list` ile gor.", "git flow hotfix list"),
  (v, id) => singleQuestion(id, `${v.context} tum remote bilgilerini guncelle ve stale branch'leri temizle.`, "git fetch --all --prune", "Remote referanslarini tazelemek icin `fetch --all --prune` kullan.", "git fetch --all ..."),
  (v, id) => singleQuestion(id, `${v.context} tum branch gecmisini graph formatta goster.`, "git log --oneline --graph --decorate --all", "Flow akisini graph gorunumuyle kontrol et.", "git log ..."),
  (v, id) => singleQuestion(id, `${v.context} local ve remote branch'leri listele.`, "git branch -a", "Tum branch kapsamini `git branch -a` ile gor.", "git branch -a"),
  (v, id) => singleQuestion(id, `${v.context} \`main\` ile \`develop\` arasindaki farki goster.`, "git diff main...develop", "Release oncesi iki ana branch arasindaki farki incele.", "git diff main...develop"),
];

const midGitFlowBaseQuestions = [
  singleQuestion("mgf-001", "Git flow yapisini varsayilan ayarlarla baslat.", "git flow init -d", "Varsayilan branch isimleriyle hizli baslatmak icin `-d` kullan.", "git flow init ..."),
  singleQuestion("mgf-002", "`billing-export` adinda yeni bir feature baslat.", "git flow feature start billing-export", "Yeni feature branch'i acmak icin `git flow feature start` kullan.", "git flow feature start ..."),
  singleQuestion("mgf-003", "`billing-export` feature branch'ini remote'a publish et.", "git flow feature publish billing-export", "Takimla paylasmak icin feature branch'ini publish et.", "git flow feature publish ..."),
  singleQuestion("mgf-004", "`billing-export` feature branch'ini bitir.", "git flow feature finish billing-export", "Feature calismasi bittiginde finish komutu ile kapat.", "git flow feature finish ..."),
  singleQuestion("mgf-005", "`1.6.0` release branch'ini baslat.", "git flow release start 1.6.0", "Release hazirligi icin release branch'i ac.", "git flow release start ..."),
  singleQuestion("mgf-006", "`1.6.0` release branch'ini remote'a publish et.", "git flow release publish 1.6.0", "Takimla ortak calisma icin release branch'ini publish et.", "git flow release publish ..."),
  singleQuestion("mgf-007", "`1.6.0` release branch'ini finish et.", "git flow release finish 1.6.0", "Release'i main ve develop akisina kapatmak icin finish kullan.", "git flow release finish ..."),
  singleQuestion("mgf-008", "`auth-timeout` hotfix branch'ini baslat.", "git flow hotfix start auth-timeout", "Production acili icin hotfix branch'i ac.", "git flow hotfix start ..."),
  singleQuestion("mgf-009", "`auth-timeout` hotfix branch'ini finish et.", "git flow hotfix finish auth-timeout", "Hotfix'i main ve develop akisina kapatmak icin finish kullan.", "git flow hotfix finish ..."),
  singleQuestion("mgf-010", "Tum branch gecmisini graph formatta goster.", "git log --oneline --graph --decorate --all", "Flow akisini denetlemek icin tum branch gecmisini graph olarak gor.", "git log ..."),
];

const seniorGitFlowBaseQuestions = [
  singleQuestion("sgf-001", "Tum remote bilgilerini guncelle ve eski tracking branch'leri temizle.", "git fetch --all --prune", "Remote referanslarini tazelemek icin `fetch --all --prune` kullan.", "git fetch --all ..."),
  singleQuestion("sgf-002", "Tum branch'leri upstream bilgileriyle listele.", "git branch -vv", "Branch'lerin hangi remote'u takip ettigini `-vv` ile gor.", "git branch -vv"),
  singleQuestion("sgf-003", "Tum branch gecmisini graph formatta goster.", "git log --oneline --graph --decorate --all", "Akisin durumunu denetlemek icin graph gorunumu kullan.", "git log ..."),
  singleQuestion("sgf-004", "`main` ile `develop` arasindaki farki goster.", "git diff main...develop", "Release oncesi farki uc nokta notasyonuyla incele.", "git diff main...develop"),
  singleQuestion("sgf-005", "`billing-export` feature branch'ini origin'den pull et.", "git flow feature pull origin billing-export", "Baska bir ekip uyesinin feature branch'ini takip etmek icin `feature pull` kullan.", "git flow feature pull ..."),
  singleQuestion("sgf-006", "`1.6.0` release branch'ini remote'a publish et.", "git flow release publish 1.6.0", "Release branch'ini ekip ile paylasmak icin publish et.", "git flow release publish ..."),
  singleQuestion("sgf-007", "`1.6.0` release branch'ini finish et.", "git flow release finish 1.6.0", "Release kapama islemi icin `release finish` kullan.", "git flow release finish ..."),
  singleQuestion("sgf-008", "`auth-timeout` hotfix branch'ini remote'a publish et.", "git flow hotfix publish auth-timeout", "Acil duzeltmeyi baska ekiplerle paylasmak icin hotfix publish et.", "git flow hotfix publish ..."),
  singleQuestion("sgf-009", "`auth-timeout` hotfix branch'ini finish et.", "git flow hotfix finish auth-timeout", "Hotfix'i main ve develop akisina geri kapat.", "git flow hotfix finish ..."),
  multiStepQuestion("sgf-010", "`v1.6.0` annotated tag'ini olustur ve tum tag'leri remote'a gonder.", [
    {
      answer: "git tag -a v1.6.0 -m \"release v1.6.0\"",
      hintText: "Annotated release tag'i mesajiyla birlikte olustur.",
      hintPartial: "git tag -a ... -m ...",
    },
    {
      answer: "git push origin --tags",
      hintText: "Tag'leri remote'a gondermek icin toplu tag push kullan.",
      hintPartial: "git push origin ...",
    },
  ]),
];

const midGitFlowTemplates = [
  (v, id) => singleQuestion(id, `${v.context} git flow yapisini varsayilan ayarlarla baslat.`, "git flow init -d", "Flow yapisini hizli kurmak icin varsayilan init secenegini kullan.", "git flow init ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.feature}\` feature branch'ini baslat.`, `git flow feature start ${v.feature}`, "Yeni bir feature icin `feature start` kullan.", "git flow feature start ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.feature}\` feature branch'ini remote'a publish et.`, `git flow feature publish ${v.feature}`, "Takimla paylasmak icin feature branch'ini publish et.", "git flow feature publish ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.feature}\` feature branch'ini finish et.`, `git flow feature finish ${v.feature}`, "Feature tamamlandiginda `feature finish` ile kapat.", "git flow feature finish ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.feature}\` feature branch'ini git flow ile checkout et.`, `git flow feature checkout ${v.feature}`, "Belirli feature branch'ine gecmek icin `feature checkout` kullan.", "git flow feature checkout ..."),
  (v, id) => singleQuestion(id, `${v.context} origin'deki \`${v.feature}\` feature branch'ini takip etmeye basla.`, `git flow feature track ${v.feature}`, "Remote feature branch'ini yerelde takip etmek icin `feature track` kullan.", "git flow feature track ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.release}\` release branch'ini baslat.`, `git flow release start ${v.release}`, "Release hazirligi icin `release start` kullan.", "git flow release start ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.release}\` release branch'ini remote'a publish et.`, `git flow release publish ${v.release}`, "Takimla ortak release calismasi icin publish et.", "git flow release publish ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.release}\` release branch'ini finish et.`, `git flow release finish ${v.release}`, "Release'i main ve develop akisina kapatmak icin finish kullan.", "git flow release finish ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.hotfix}\` hotfix branch'ini baslat.`, `git flow hotfix start ${v.hotfix}`, "Production acili icin hotfix branch'i ac.", "git flow hotfix start ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.hotfix}\` hotfix branch'ini remote'a publish et.`, `git flow hotfix publish ${v.hotfix}`, "Hotfix calismasini paylasmak icin publish et.", "git flow hotfix publish ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.hotfix}\` hotfix branch'ini finish et.`, `git flow hotfix finish ${v.hotfix}`, "Hotfix'i main ve develop akisina finish ile kapat.", "git flow hotfix finish ..."),
  (v, id) => singleQuestion(id, `${v.context} tum feature branch'lerini listele.`, "git flow feature list", "Aktif feature branch'lerini `feature list` ile gor.", "git flow feature list"),
  (v, id) => singleQuestion(id, `${v.context} tum release branch'lerini listele.`, "git flow release list", "Aktif release branch'lerini `release list` ile gor.", "git flow release list"),
  (v, id) => singleQuestion(id, `${v.context} tum hotfix branch'lerini listele.`, "git flow hotfix list", "Aktif hotfix branch'lerini `hotfix list` ile gor.", "git flow hotfix list"),
  (v, id) => singleQuestion(id, `${v.context} tum remote bilgilerini guncelle ve stale branch'leri temizle.`, "git fetch --all --prune", "Remote referanslarini temizlemek icin `fetch --all --prune` kullan.", "git fetch --all ..."),
  (v, id) => singleQuestion(id, `${v.context} \`develop\` branch'ini remote'dan guncelle.`, "git pull origin develop", "Develop branch'ini remote ile esitlemek icin pull yap.", "git pull origin ..."),
  (v, id) => singleQuestion(id, `${v.context} \`develop\` branch'ini remote'a gonder.`, "git push origin develop", "Develop branch'ini origin'e gonder.", "git push origin ..."),
  (v, id) => singleQuestion(id, `${v.context} tum branch gecmisini graph formatta goster.`, "git log --oneline --graph --decorate --all", "Flow akisini graph gorunumuyle incele.", "git log ..."),
  (v, id) => singleQuestion(id, `${v.context} tum tag'leri remote'a gonder.`, "git push origin --tags", "Release tag'lerini toplu gondermek icin tag push kullan.", "git push origin ..."),
];

const seniorGitFlowTemplates = [
  (v, id) => singleQuestion(id, `${v.context} tum remote bilgilerini guncelle ve stale branch'leri temizle.`, "git fetch --all --prune", "Remote referanslarini tazelemek icin `fetch --all --prune` kullan.", "git fetch --all ..."),
  (v, id) => singleQuestion(id, `${v.context} tum branch'leri upstream bilgileriyle listele.`, "git branch -vv", "Branch'lerin hangi upstream'i takip ettigini `-vv` ile denetle.", "git branch -vv"),
  (v, id) => singleQuestion(id, `${v.context} tum branch gecmisini graph formatta goster.`, "git log --oneline --graph --decorate --all", "Akisin durumunu graph gorunumuyle kontrol et.", "git log ..."),
  (v, id) => singleQuestion(id, `${v.context} \`main\` ile \`develop\` arasindaki farki goster.`, "git diff main...develop", "Release oncesi farki uc nokta notasyonuyla incele.", "git diff main...develop"),
  (v, id) => singleQuestion(id, `${v.context} \`main\` ile \`develop\` arasinda degisen dosyalari goster.`, "git diff --name-only main...develop", "Yalnizca degisen dosyalari gormek icin `--name-only` kullan.", "git diff --name-only ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.feature}\` feature branch'ini remote'a publish et.`, `git flow feature publish ${v.feature}`, "Takimla paylasilan feature branch icin publish kullan.", "git flow feature publish ..."),
  (v, id) => singleQuestion(id, `${v.context} origin'deki \`${v.feature}\` feature branch'ini pull et.`, `git flow feature pull origin ${v.feature}`, "Baska bir ekip uyesinin feature branch'ini cekmek icin `feature pull` kullan.", "git flow feature pull ..."),
  (v, id) => singleQuestion(id, `${v.context} origin'deki \`${v.feature}\` feature branch'ini track et.`, `git flow feature track ${v.feature}`, "Remote feature branch'ini takip etmek icin `feature track` kullan.", "git flow feature track ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.release}\` release branch'ini baslat.`, `git flow release start ${v.release}`, "Release hazirligi icin `release start` kullan.", "git flow release start ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.release}\` release branch'ini remote'a publish et.`, `git flow release publish ${v.release}`, "Release branch'ini paylasmak icin publish et.", "git flow release publish ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.release}\` release branch'ini finish et.`, `git flow release finish ${v.release}`, "Release kapama islemini `release finish` ile yap.", "git flow release finish ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.hotfix}\` hotfix branch'ini baslat.`, `git flow hotfix start ${v.hotfix}`, "Production acili icin `hotfix start` kullan.", "git flow hotfix start ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.hotfix}\` hotfix branch'ini remote'a publish et.`, `git flow hotfix publish ${v.hotfix}`, "Acil duzeltmeyi paylasmak icin hotfix publish et.", "git flow hotfix publish ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.hotfix}\` hotfix branch'ini finish et.`, `git flow hotfix finish ${v.hotfix}`, "Hotfix'i main ve develop akisina finish ile kapat.", "git flow hotfix finish ..."),
  (v, id) => singleQuestion(id, `${v.context} \`main\` ile merge olmus branch'leri listele.`, "git branch --merged main", "Release sonrasi temizlenebilecek branch'leri `--merged` ile gor.", "git branch --merged ..."),
  (v, id) => singleQuestion(id, `${v.context} remote adreslerini gor.`, "git remote -v", "Multi-remote veya governance kontrolu icin remote adreslerini denetle.", "git remote -v"),
  (v, id) => singleQuestion(id, `${v.context} \`v${v.release}\` annotated tag'ini olustur.`, `git tag -a v${v.release} -m "release v${v.release}"`, "Annotated release tag'i mesaj ile birlikte olustur.", "git tag -a ... -m ..."),
  (v, id) => singleQuestion(id, `${v.context} \`v${v.release}\` tag'ini goster.`, `git show v${v.release}`, "Tag'in isaret ettigi commit ve notlarini `git show` ile gor.", "git show ..."),
  (v, id) => singleQuestion(id, `${v.context} tum tag'leri remote'a gonder.`, "git push origin --tags", "Release tag'lerini toplu gondermek icin tag push kullan.", "git push origin ..."),
  (v, id) => singleQuestion(id, `${v.context} tum branch'leri local ve remote olarak listele.`, "git branch -a", "Local ve remote branch kapsamini `git branch -a` ile gor.", "git branch -a"),
];

await writeTopicFile("junior", "user", juniorUserBaseQuestions);
await writeTopicFile("junior", "user", generateQuestions("jusr-exp", userVariants, juniorUserTemplates), "user-expanded");
await writeTopicFile("junior", "git-flow", juniorGitFlowBaseQuestions);
await writeTopicFile("junior", "git-flow", generateQuestions("jgf-exp", gitFlowVariants, juniorGitFlowTemplates), "git-flow-expanded");
await writeTopicFile("mid", "user", midUserBaseQuestions);
await writeTopicFile("mid", "user", generateQuestions("musr-exp", userVariants, midUserTemplates), "user-expanded");
await writeTopicFile("senior", "user", seniorUserBaseQuestions);
await writeTopicFile("senior", "user", generateQuestions("susr-exp", userVariants, seniorUserTemplates), "user-expanded");
await writeTopicFile("mid", "git-flow", midGitFlowBaseQuestions);
await writeTopicFile("mid", "git-flow", generateQuestions("mgf-exp", gitFlowVariants, midGitFlowTemplates), "git-flow-expanded");
await writeTopicFile("senior", "git-flow", seniorGitFlowBaseQuestions);
await writeTopicFile("senior", "git-flow", generateQuestions("sgf-exp", gitFlowVariants, seniorGitFlowTemplates), "git-flow-expanded");

console.log("user and git-flow topics generated");
