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

const NETWORK_INTERFACES = ["eth0", "eth1", "ens160", "ens192", "enp0s3", "wlan0", "bond0", "tun0", "br0", "lo"];
const NETWORK_HOSTS = [
  "api.internal",
  "db.internal",
  "cache.internal",
  "status.example.com",
  "auth.example.com",
  "cdn.example.com",
  "billing.example.com",
  "search.example.com",
  "grafana.internal",
  "queue.internal",
];
const PUBLIC_DOMAINS = [
  "example.com",
  "openai.com",
  "github.com",
  "gitlab.com",
  "cloudflare.com",
  "postgresql.org",
  "nginx.org",
  "ubuntu.com",
  "kernel.org",
  "iana.org",
];
const NETWORK_IPS = ["8.8.8.8", "1.1.1.1", "9.9.9.9", "10.0.0.10", "10.10.10.10", "172.16.0.10", "192.168.1.1", "192.168.56.10", "203.0.113.10", "198.51.100.20"];
const NETWORK_PORTS = [22, 53, 80, 443, 5432, 6379, 8080, 8443, 9090, 3000];
const DNS_SERVERS = ["8.8.8.8", "1.1.1.1", "9.9.9.9", "208.67.222.222", "8.8.4.4", "1.0.0.1", "149.112.112.112", "208.67.220.220", "76.76.2.0", "94.140.14.14"];

const SSH_USERS = ["ops", "deploy", "ubuntu", "ec2-user", "app", "backup", "analyst", "support", "admin", "git"];
const SSH_HOSTS = ["10.0.0.5", "10.0.0.10", "10.10.10.20", "172.16.1.15", "172.16.10.22", "192.168.1.50", "192.168.56.12", "203.0.113.30", "198.51.100.12", "10.1.2.3"];
const SSH_PORTS = [22, 2222, 2202, 2022, 2200, 22222, 10022, 22022, 20220, 21022];
const SSH_ALIASES = ["app", "db", "cache", "bastion", "metrics", "logs", "queue", "search", "reports", "ci"];
const SSH_UPLOAD_FILES = ["config.yml", "deploy.env", "app.tar.gz", "backup.sql", "nginx.conf", "prometheus.yml", "grafana.ini", "known_hosts", "inventory.ini", "release.txt"];
const SSH_DOWNLOAD_FILES = [
  "/var/log/syslog",
  "/var/log/auth.log",
  "/tmp/backup.sql",
  "/opt/app/.env",
  "/etc/nginx/nginx.conf",
  "/var/log/nginx/error.log",
  "/srv/app/release.txt",
  "/etc/hosts",
  "/var/log/messages",
  "/tmp/output.txt",
];
const RSYNC_TARGETS = [
  "/opt/app/",
  "/srv/www/",
  "/etc/nginx/",
  "/srv/backup/",
  "/opt/prometheus/",
  "/etc/ssh/",
  "/srv/config/",
  "/opt/worker/",
  "/srv/releases/",
  "/etc/systemd/system/",
];
const FORWARD_TARGETS = [
  "db.internal:5432",
  "redis.internal:6379",
  "grafana.internal:3000",
  "prometheus.internal:9090",
  "api.internal:8443",
  "search.internal:9200",
  "vault.internal:8200",
  "kibana.internal:5601",
  "smtp.internal:25",
  "mysql.internal:3306",
];
const LOCAL_FORWARD_PORTS = [5432, 6379, 3000, 9090, 8443, 9200, 8200, 5601, 2525, 3306];
const REVERSE_FORWARD_PORTS = [8080, 3000, 9090, 5000, 8443, 7000, 8022, 8888, 8081, 8088];

const MONITOR_SERVICES = ["nginx", "postgresql", "redis-server", "docker", "sshd", "prometheus", "grafana-server", "node-exporter", "cron", "app"];
const MONITOR_PATHS = ["/", "/var", "/home", "/srv", "/opt", "/var/log", "/tmp", "/boot", "/data", "/mnt"];
const MONITOR_LOGS = [
  "/var/log/syslog",
  "/var/log/auth.log",
  "/var/log/nginx/error.log",
  "/var/log/nginx/access.log",
  "/var/log/kern.log",
  "/var/log/postgresql/postgresql.log",
  "/var/log/redis/redis-server.log",
  "/var/log/messages",
  "/var/log/cloud-init.log",
  "/var/log/app/app.log",
];
const MONITOR_WATCH_COMMANDS = [
  "ps aux --sort=-%cpu | head -10",
  "ps aux --sort=-%mem | head -10",
  "ss -s",
  "free -h",
  "uptime",
  "df -h /var",
  "df -h /srv",
  "vmstat 1 2",
  "iostat -xz 1 2",
  "tail -n 20 /var/log/syslog",
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

const networkingBaseQuestions = [
  singleQuestion("jnet-001", "Makinedeki tum interface'leri kisa formatta goster.", "ip -br a", "Adresleri ve interface durumlarini tek ekranda gormek icin kisa `ip` gorunumunu kullan.", "ip -br ..."),
  singleQuestion("jnet-002", "Varsayilan route bilgisini goster.", "ip route show default", "Default gateway bilgisini routing tablosundan filtrele.", "ip route show ..."),
  singleQuestion("jnet-003", "Dinleyen TCP portlarini goster.", "ss -ltn", "Sunucuda dinleyen TCP socket'leri listelemek icin `ss` kullan.", "ss -l..."),
  singleQuestion("jnet-004", "8.8.8.8 adresine 4 paket gondererek erisim testi yap.", "ping -c 4 8.8.8.8", "Paket sayisini sinirlayarak basit bir baglanti testi yap.", "ping -c 4 ..."),
  singleQuestion("jnet-005", "`example.com` icin A kaydini kisa formatta sorgula.", "dig +short example.com", "Sadece cozulmus adresi gormek icin `dig +short` kullan.", "dig +short ..."),
  singleQuestion("jnet-006", "`example.com` icin AAAA kaydini kisa formatta sorgula.", "dig +short aaaa example.com", "IPv6 DNS kaydini kisa formatta iste.", "dig +short aaaa ..."),
  singleQuestion("jnet-007", "`example.com` icin HTTP response header'larini goster.", "curl -I https://example.com", "Sadece header'lari gormek icin `curl`'un head modunu kullan.", "curl -I ..."),
  singleQuestion("jnet-008", "Sistem resolver sonucunu kullanarak `localhost` kaydini cozdur.", "getent hosts localhost", "Hostname cozumunu libc resolver uzerinden gormek icin `getent hosts` kullan.", "getent hosts ..."),
  singleQuestion("jnet-009", "`/etc/resolv.conf` dosyasini oku.", "cat /etc/resolv.conf", "Aktif DNS resolver ayarini dosya uzerinden gor.", "cat /etc/..."),
  singleQuestion("jnet-010", "Socket ozetini goster.", "ss -s", "Toplam socket durumlarini hizli gormek icin `ss -s` kullan.", "ss -s"),
  singleQuestion("jnet-011", "1.1.1.1 adresine giderken hangi route kullaniliyor goster.", "ip route get 1.1.1.1", "Belirli bir hedef icin secilen route'u `ip route get` ile sorgula.", "ip route get ..."),
  singleQuestion("jnet-012", "Tum link istatistiklerini goster.", "ip -s link", "Paket ve hata sayilarini interface bazinda gormek icin link istatistiklerini iste.", "ip -s ..."),
  singleQuestion("jnet-013", "`nmcli` ile device durumlarini listele.", "nmcli device status", "NetworkManager tarafindaki device durumlarini topluca gormek icin `nmcli` kullan.", "nmcli device ..."),
  singleQuestion("jnet-014", "`localhost` uzerinde 5432 portu dinliyor mu test et.", "nc -zv localhost 5432", "Belirli bir porta TCP baglanti testi yapmak icin `nc -zv` kullan.", "nc -zv ..."),
  singleQuestion("jnet-015", "`example.com` hedefine giden hop'lari goster.", "traceroute example.com", "Paketi hangi ara noktalardan gectigini gormek icin `traceroute` kullan.", "traceroute ..."),
  singleQuestion("jnet-016", "Makinenin atanmis IP adreslerini tek satirda goster.", "hostname -I", "Atanmis IP adreslerini hizli gormek icin `hostname -I` kullan.", "hostname -I"),
];

const sshBaseQuestions = [
  singleQuestion("jssh-001", "`ops@10.0.0.5` hostuna SSH ile baglan.", "ssh ops@10.0.0.5", "Temel SSH baglantisinda `user@host` formatini kullan.", "ssh ..."),
  singleQuestion("jssh-002", "2222 portundan `deploy@10.0.0.10` hostuna SSH ile baglan.", "ssh -p 2222 deploy@10.0.0.10", "Varsayilan port disinda baglanti icin `-p` ekle.", "ssh -p ..."),
  singleQuestion("jssh-003", "Yeni bir `ed25519` SSH key olustur.", "ssh-keygen -t ed25519", "Modern bir SSH key cifti olusturmak icin `ssh-keygen` kullan.", "ssh-keygen -t ..."),
  singleQuestion("jssh-004", "`~/.ssh/id_ed25519.pub` dosyasini goruntule.", "cat ~/.ssh/id_ed25519.pub", "Kopyalanacak public key'i dosyadan oku.", "cat ~/.ssh/..."),
  singleQuestion("jssh-005", "Public key'i `ops@10.0.0.5` hostuna kopyala.", "ssh-copy-id ops@10.0.0.5", "Parolasiz giris icin public key'i hedef hosta yukle.", "ssh-copy-id ..."),
  singleQuestion("jssh-006", "`config.yml` dosyasini `ops@10.0.0.5:/tmp/` hedefine kopyala.", "scp config.yml ops@10.0.0.5:/tmp/", "Tek bir dosyayi uzak hosta tasimak icin `scp` kullan.", "scp ..."),
  singleQuestion("jssh-007", "`ops@10.0.0.5:/var/log/syslog` dosyasini bulundugun dizine indir.", "scp ops@10.0.0.5:/var/log/syslog .", "Uzak kaynaktan dosya cekmek icin `scp remote local` formunu kullan.", "scp ..."),
  singleQuestion("jssh-008", "`./deploy/` klasorunu `ops@10.0.0.5:/opt/app/` hedefine `rsync` ile senkronize et.", "rsync -avz ./deploy/ ops@10.0.0.5:/opt/app/", "Klasor senkronizasyonu icin `rsync -avz` kullan.", "rsync -avz ..."),
  singleQuestion("jssh-009", "`~/.ssh/config` dosyasini olustur.", "touch ~/.ssh/config", "SSH alias ve ayarlar icin config dosyasini hazirla.", "touch ~/.ssh/..."),
  singleQuestion("jssh-010", "`~/.ssh/config` izinlerini `600` yap.", "chmod 600 ~/.ssh/config", "SSH config dosyasi yalnizca sahibi tarafindan okunabilir olmali.", "chmod 600 ..."),
  singleQuestion("jssh-011", "`~/.ssh` dizini izinlerini `700` yap.", "chmod 700 ~/.ssh", "SSH dizin izinlerini sIkIlastir.", "chmod 700 ..."),
  singleQuestion("jssh-012", "`ops@10.0.0.5` hostunda uzaktan `hostname` komutunu calistir.", "ssh ops@10.0.0.5 hostname", "SSH ile baglanip tek seferlik komut calistirabilirsin.", "ssh ... ..."),
  singleQuestion("jssh-013", "`10.0.0.5` icin eski known_hosts kaydini sil.", "ssh-keygen -R 10.0.0.5", "Host key degistiginde eski kaydi known_hosts'tan temizle.", "ssh-keygen -R ..."),
  singleQuestion("jssh-014", "Local 5432 portunu remote `db.internal:5432` servisine yonlendir.", "ssh -L 5432:db.internal:5432 ops@bastion", "Yerel port forwarding icin `-L local:host:port` formunu kullan.", "ssh -L ..."),
  singleQuestion("jssh-015", "SOCKS proxy icin local 1080 portunda dynamic tunnel ac.", "ssh -D 1080 ops@bastion", "Dinamik proxy icin `ssh -D` kullan.", "ssh -D ..."),
  singleQuestion("jssh-016", "SSH verbose debug output ile `ops@10.0.0.5` hostuna baglan.", "ssh -v ops@10.0.0.5", "El sikisma ve auth ayrintilarini gormek icin debug modunu ac.", "ssh -v ..."),
];

const monitoringBaseQuestions = [
  singleQuestion("jmon-001", "Interactive process monitoring ekranini ac.", "top", "Canli process gorunumu icin klasik araci ac.", "top"),
  singleQuestion("jmon-002", "Memory kullanimini human-readable formatta goster.", "free -h", "RAM ve swap ozetini okunur formatta gormek icin `free -h` kullan.", "free -h"),
  singleQuestion("jmon-003", "Load average ve uptime bilgisini goster.", "uptime", "Yuk ortalamasini hizli gormek icin `uptime` yeterlidir.", "uptime"),
  singleQuestion("jmon-004", "Disk kullanimini human-readable formatta goster.", "df -h", "Filesystem kullanimini okunur boyutlarla listele.", "df -h"),
  singleQuestion("jmon-005", "Inode kullanimini goster.", "df -i", "Disk dolu degilse bile inode problemi icin inode ozetine bak.", "df -i"),
  singleQuestion("jmon-006", "En cok CPU tuketen ilk 10 process'i goster.", "ps aux --sort=-%cpu | head -10", "Process listesini CPU tuketimine gore sirala.", "ps aux --sort=-%cpu ..."),
  singleQuestion("jmon-007", "En cok memory tuketen ilk 10 process'i goster.", "ps aux --sort=-%mem | head -10", "Process listesini memory tuketimine gore sirala.", "ps aux --sort=-%mem ..."),
  singleQuestion("jmon-008", "Run queue ve context switch durumunu 5 ornek boyunca topla.", "vmstat 1 5", "Kisa sureli sistem snapshots icin `vmstat interval count` kullan.", "vmstat 1 ..."),
  singleQuestion("jmon-009", "Disk I/O istatistiklerini ayrintili formatta izle.", "iostat -xz 1", "Block device bazli I/O icin `iostat -xz` kullan.", "iostat -xz ..."),
  singleQuestion("jmon-010", "Socket ozetini goster.", "ss -s", "Baglanti turlerini ve sayilarini hizli ozetle.", "ss -s"),
  singleQuestion("jmon-011", "`nginx` servis durumunu kontrol et.", "systemctl status nginx", "Servisin ayakta olup olmadigini `systemctl status` ile gor.", "systemctl status ..."),
  singleQuestion("jmon-012", "`nginx` servisinin son 50 log satirini goster.", "journalctl -u nginx -n 50", "Belirli bir service unit'i icin son log satirlarini oku.", "journalctl -u ..."),
  singleQuestion("jmon-013", "Her saniye en cok CPU tuketen ilk 10 process'i yenileyerek goster.", "watch -n 1 \"ps aux --sort=-%cpu | head -10\"", "Ayni komutu aralikli tekrar calistirmak icin `watch` kullan.", "watch -n 1 ..."),
  singleQuestion("jmon-014", "`/proc/loadavg` dosyasini oku.", "cat /proc/loadavg", "Kernel'in load average bilgisini dogrudan procfs'ten gor.", "cat /proc/..."),
  singleQuestion("jmon-015", "Kritik memory ve swap satirlarini `/proc/meminfo` icinden filtrele.", "grep -E 'MemAvailable|SwapTotal|SwapFree' /proc/meminfo", "Tum meminfo yerine kritik satirlari `grep -E` ile ayikla.", "grep -E ..."),
  singleQuestion("jmon-016", "`/var/log` altindaki klasorlerin boyutunu ozetle.", "du -sh /var/log/*", "Log klasorlerinin disk maliyetini hizli gormek icin `du -sh` kullan.", "du -sh ..."),
];

function networkVariant(index) {
  return {
    context: CONTEXTS[index],
    iface: NETWORK_INTERFACES[index],
    host: NETWORK_HOSTS[index],
    domain: PUBLIC_DOMAINS[index],
    ip: NETWORK_IPS[index],
    port: NETWORK_PORTS[index],
    dnsServer: DNS_SERVERS[index],
  };
}

function sshVariant(index) {
  return {
    context: CONTEXTS[index],
    user: SSH_USERS[index],
    host: SSH_HOSTS[index],
    port: SSH_PORTS[index],
    alias: SSH_ALIASES[index],
    uploadFile: SSH_UPLOAD_FILES[index],
    downloadFile: SSH_DOWNLOAD_FILES[index],
    rsyncTarget: RSYNC_TARGETS[index],
    forwardTarget: FORWARD_TARGETS[index],
    localPort: LOCAL_FORWARD_PORTS[index],
    reversePort: REVERSE_FORWARD_PORTS[index],
  };
}

function monitoringVariant(index) {
  return {
    context: CONTEXTS[index],
    service: MONITOR_SERVICES[index],
    path: MONITOR_PATHS[index],
    logFile: MONITOR_LOGS[index],
    watchCommand: MONITOR_WATCH_COMMANDS[index],
  };
}

const networkingTemplates = [
  (v, id) => singleQuestion(id, `${v.context} \`${v.iface}\` interface bilgisini goster.`, `ip a show ${v.iface}`, "Belirli bir interface'in adres bilgilerini `ip` ile goster.", "ip a show ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.iface}\` interface'ini kisa formatta goster.`, `ip -br a show ${v.iface}`, "Tek interface icin kisa adres gorunumu iste.", "ip -br a show ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.iface}\` link durumunu goster.`, `ip link show ${v.iface}`, "Link seviyesindeki durumu gormek icin `ip link show` kullan.", "ip link show ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.iface}\` istatistiklerini goster.`, `ip -s link show ${v.iface}`, "Paket ve hata sayilari icin interface istatistiklerini iste.", "ip -s link show ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.ip}\` hedefi icin secilen route'u goster.`, `ip route get ${v.ip}`, "Belirli hedefe giden rota kararini `ip route get` ile gor.", "ip route get ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.ip}\` adresine 4 paket gonder.`, `ping -c 4 ${v.ip}`, "Hedefe ulasim testi icin sinirli sayida ping gonder.", "ping -c 4 ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.host}\` hostuna 2 paket gonder.`, `ping -c 2 ${v.host}`, "Hostname uzerinden erisim testi icin kisa ping kullan.", "ping -c 2 ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.domain}\` icin A kaydini kisa formatta sorgula.`, `dig +short ${v.domain}`, "Kisa DNS cozum sonucu icin `dig +short` kullan.", "dig +short ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.domain}\` icin AAAA kaydini kisa formatta sorgula.`, `dig +short aaaa ${v.domain}`, "IPv6 kaydi icin AAAA sorgusu yap.", "dig +short aaaa ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.domain}\` icin \`${v.dnsServer}\` DNS sunucusu uzerinden sorgu yap.`, `dig @${v.dnsServer} ${v.domain}`, "Belirli resolver ile test icin `dig @server` kullan.", "dig @..."),
  (v, id) => singleQuestion(id, `${v.context} sistem resolver ile \`${v.host}\` hostunu cozdur.`, `getent hosts ${v.host}`, "Sistem resolver sonucunu gormek icin `getent hosts` kullan.", "getent hosts ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.domain}\` icin HTTP response header'larini goster.`, `curl -I https://${v.domain}`, "Sadece header'lari gormek icin `curl -I` kullan.", "curl -I ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.domain}\` sayfasini getir.`, `curl https://${v.domain}`, "Basit bir HTTP istegi icin dogrudan `curl` kullan.", "curl https://..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.host}\` uzerinde \`${v.port}\` portu dinliyor mu test et.`, `nc -zv ${v.host} ${v.port}`, "TCP port testi icin `nc -zv` kullan.", "nc -zv ..."),
  (v, id) => singleQuestion(id, `${v.context} dinleyen \`${v.port}\` TCP portunu goster.`, `ss -ltn "( sport = :${v.port} )"`, "Belirli bir dinleyen portu `ss` ile filtrele.", "ss -ltn ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.domain}\` hedefine giden hop'lari goster.`, `traceroute ${v.domain}`, "Ara hop'lari gormek icin `traceroute` kullan.", "traceroute ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.iface}\` icin NetworkManager ayrintilarini goster.`, `nmcli device show ${v.iface}`, "Interface'e ait NetworkManager verisini `nmcli` ile gor.", "nmcli device show ..."),
  (v, id) => singleQuestion(id, `${v.context} kayitli network connection profillerini listele.`, "nmcli connection show", "Connection profillerini listelemek icin `nmcli connection show` kullan.", "nmcli connection ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.domain}\` icin nameserver kayitlarini goster.`, `host -t ns ${v.domain}`, "Nameserver kayitlarini `host -t ns` ile sorgula.", "host -t ns ..."),
  (v, id) => singleQuestion(id, `${v.context} varsayilan route'u tekrar goster.`, "ip route show default", "Default gateway kontrolu icin routing tablosunu default filtrele.", "ip route show ..."),
];

const sshTemplates = [
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}@${v.host}\` hostuna SSH ile baglan.`, `ssh ${v.user}@${v.host}`, "Temel uzak baglanti icin `user@host` formunu kullan.", "ssh ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.port}\` portundan \`${v.user}@${v.host}\` hostuna baglan.`, `ssh -p ${v.port} ${v.user}@${v.host}`, "Varsayilan disi SSH portu icin `-p` kullan.", "ssh -p ..."),
  (v, id) => singleQuestion(id, `${v.context} ` + "`~/.ssh/id_ed25519`" + ` identity file ile \`${v.user}@${v.host}\` hostuna baglan.`, `ssh -i ~/.ssh/id_ed25519 ${v.user}@${v.host}`, "Belirli bir key file kullanarak baglanmak icin `-i` ekle.", "ssh -i ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}@${v.host}\` hostunda uzaktan \`hostname\` komutunu calistir.`, `ssh ${v.user}@${v.host} hostname`, "SSH ile tek seferlik komutu host bilgisinden sonra ver.", "ssh ... ..."),
  (v, id) => singleQuestion(id, `${v.context} public key'i \`${v.user}@${v.host}\` hostuna kopyala.`, `ssh-copy-id ${v.user}@${v.host}`, "Parolasiz giris icin public key'i hedefe yukle.", "ssh-copy-id ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.uploadFile}\` dosyasini \`${v.user}@${v.host}:/tmp/\` hedefine kopyala.`, `scp ${v.uploadFile} ${v.user}@${v.host}:/tmp/`, "Tek dosyayi uzak hedefe aktarmak icin `scp` kullan.", "scp ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.user}@${v.host}:${v.downloadFile}\` dosyasini bulundugun dizine indir.`, `scp ${v.user}@${v.host}:${v.downloadFile} .`, "Uzak kaynaktan dosya cekmek icin `scp remote local` formunu kullan.", "scp ..."),
  (v, id) => singleQuestion(id, `${v.context} \`./deploy/\` klasorunu \`${v.user}@${v.host}:${v.rsyncTarget}\` hedefine senkronize et.`, `rsync -avz ./deploy/ ${v.user}@${v.host}:${v.rsyncTarget}`, "Klasor senkronizasyonu icin `rsync -avz` kullan.", "rsync -avz ..."),
  (v, id) => singleQuestion(id, `${v.context} local \`${v.localPort}\` portunu remote \`${v.forwardTarget}\` servisine yonlendir.`, `ssh -L ${v.localPort}:${v.forwardTarget} ${v.user}@${v.host}`, "Yerel port forwarding icin `-L local:target:port` formunu kullan.", "ssh -L ..."),
  (v, id) => singleQuestion(id, `${v.context} remote \`${v.reversePort}\` portunu local \`localhost:3000\` servisine reverse tunnel ile ac.`, `ssh -R ${v.reversePort}:localhost:3000 ${v.user}@${v.host}`, "Ters yone forwarding icin `ssh -R` kullan.", "ssh -R ..."),
  (v, id) => singleQuestion(id, `${v.context} SOCKS proxy icin local \`1080\` portunda dynamic tunnel ac.`, `ssh -D 1080 ${v.user}@${v.host}`, "Dinamik proxy icin `-D` secenegini kullan.", "ssh -D ..."),
  (v, id) => singleQuestion(id, `${v.context} SSH verbose debug output ile \`${v.user}@${v.host}\` hostuna baglan.`, `ssh -v ${v.user}@${v.host}`, "Baglanti detaylarini gormek icin debug modunu ac.", "ssh -v ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.host}\` icin eski known_hosts kaydini sil.`, `ssh-keygen -R ${v.host}`, "Host key degisti ise eski kaydi temizlemek icin `ssh-keygen -R` kullan.", "ssh-keygen -R ..."),
  (v, id) => singleQuestion(id, `${v.context} \`~/.ssh/config\` dosyasini olustur.`, "touch ~/.ssh/config", "SSH alias ve ozel ayarlar icin config dosyasini hazirla.", "touch ~/.ssh/..."),
  (v, id) => singleQuestion(id, `${v.context} \`~/.ssh/config\` izinlerini \`600\` yap.`, "chmod 600 ~/.ssh/config", "SSH config dosyasini yalnizca sahibinin okuyabilmesi gerekir.", "chmod 600 ..."),
  (v, id) => singleQuestion(id, `${v.context} \`~/.ssh\` dizini izinlerini \`700\` yap.`, "chmod 700 ~/.ssh", "SSH dizininin erisimini daralt.", "chmod 700 ..."),
  (v, id) => singleQuestion(id, `${v.context} \`~/.ssh\` altindaki dosyalari listele.`, "ls ~/.ssh/", "Mevcut key ve config dosyalarini gormek icin dizini listele.", "ls ~/.ssh/..."),
  (v, id) => singleQuestion(id, `${v.context} ` + "`~/.ssh/id_ed25519.pub`" + ` dosyasini goruntule.`, "cat ~/.ssh/id_ed25519.pub", "Kopyalanacak public key'i dosyadan gor.", "cat ~/.ssh/..."),
  (v, id) => singleQuestion(id, `${v.context} alias \`${v.alias}\` icin cozulen SSH konfigurasyonunu goster.`, `ssh -G ${v.alias} | grep -E '^(hostname|user|identityfile) '`, "Baglanti acmadan cozulmus ayarlari gormek icin `ssh -G` kullan.", "ssh -G ..."),
  (v, id) => singleQuestion(id, `${v.context} yeni bir \`ed25519\` SSH key olustur.`, "ssh-keygen -t ed25519", "Modern bir key cifti olusturmak icin `ssh-keygen -t ed25519` kullan.", "ssh-keygen -t ..."),
];

const monitoringTemplates = [
  (v, id) => singleQuestion(id, `${v.context} \`${v.service}\` servis durumunu kontrol et.`, `systemctl status ${v.service}`, "Servisin ayakta olup olmadigini `systemctl status` ile gor.", "systemctl status ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.service}\` servisinin son 50 log satirini goster.`, `journalctl -u ${v.service} -n 50`, "Belirli bir service unit'inin son loglarini oku.", "journalctl -u ..."),
  (v, id) => singleQuestion(id, `${v.context} RAM ve swap kullanimini human-readable formatta goster.`, "free -h", "Bellek ozetini okunur boyutlarla gormek icin `free -h` kullan.", "free -h"),
  (v, id) => singleQuestion(id, `${v.context} load average ve uptime bilgisini goster.`, "uptime", "Sistemin yukunu hizli gormek icin `uptime` yeterlidir.", "uptime"),
  (v, id) => singleQuestion(id, `${v.context} \`${v.path}\` icin disk kullanimini human-readable formatta goster.`, `df -h ${v.path}`, "Belirli mount point veya yol icin disk kullanimini `df -h` ile gor.", "df -h ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.path}\` icin inode kullanimini goster.`, `df -i ${v.path}`, "Inode tuketimini kontrol etmek icin `df -i` kullan.", "df -i ..."),
  (v, id) => singleQuestion(id, `${v.context} en cok CPU tuketen ilk 10 process'i listele.`, "ps aux --sort=-%cpu | head -10", "CPU tuketimine gore siralamak icin `ps` cikisini filtrele.", "ps aux --sort=-%cpu ..."),
  (v, id) => singleQuestion(id, `${v.context} en cok memory tuketen ilk 10 process'i listele.`, "ps aux --sort=-%mem | head -10", "Memory tuketimine gore siralamak icin `ps` cikisini filtrele.", "ps aux --sort=-%mem ..."),
  (v, id) => singleQuestion(id, `${v.context} run queue ve context switch metriklerini 5 ornek boyunca topla.`, "vmstat 1 5", "Aralikli sistem snapshots icin `vmstat interval count` kullan.", "vmstat 1 ..."),
  (v, id) => singleQuestion(id, `${v.context} disk I/O istatistiklerini ayrintili formatta izle.`, "iostat -xz 1", "Block device I/O'yu detayli gormek icin `iostat -xz` kullan.", "iostat -xz ..."),
  (v, id) => singleQuestion(id, `${v.context} socket ozetini goster.`, "ss -s", "Baglanti sayilarini ve durumlarini toplu gormek icin `ss -s` kullan.", "ss -s"),
  (v, id) => singleQuestion(id, `${v.context} \`${v.watchCommand}\` komutunu her saniye yenileyerek izle.`, `watch -n 1 "${v.watchCommand}"`, "Ayni komutu periyodik calistirmak icin `watch` kullan.", "watch -n 1 ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.logFile}\` log dosyasinin son 50 satirini goster.`, `tail -n 50 ${v.logFile}`, "Bir log dosyasinin son bolumunu hizli gormek icin `tail -n` kullan.", "tail -n 50 ..."),
  (v, id) => singleQuestion(id, `${v.context} \`${v.path}\` yolunun boyutunu ozetle.`, `du -sh ${v.path}`, "Belirli bir yolun kapladigi alani `du -sh` ile ozetle.", "du -sh ..."),
  (v, id) => singleQuestion(id, `${v.context} kritik memory ve swap satirlarini \`/proc/meminfo\` icinden filtrele.`, "grep -E 'MemAvailable|SwapTotal|SwapFree' /proc/meminfo", "Tum meminfo yerine kritik satirlari regex ile ayikla.", "grep -E ..."),
  (v, id) => singleQuestion(id, `${v.context} \`/proc/loadavg\` dosyasini oku.`, "cat /proc/loadavg", "Kernel load average bilgisini procfs uzerinden gor.", "cat /proc/..."),
  (v, id) => singleQuestion(id, `${v.context} process bazinda CPU kullanimini canli izle.`, "pidstat -u 1", "Process seviyesinde CPU ornekleri icin `pidstat -u` kullan.", "pidstat -u ..."),
  (v, id) => singleQuestion(id, `${v.context} CPU kullanimini 5 ornek boyunca ` + "`sar`" + ` ile topla.`, "sar -u 1 5", "CPU metriklerini aralikli toplamak icin `sar -u interval count` kullan.", "sar -u ..."),
  (v, id) => singleQuestion(id, `${v.context} swap aktivitelerini 5 ornek boyunca ` + "`sar`" + ` ile topla.`, "sar -W 1 5", "Swap giris cikislarini `sar -W` ile izle.", "sar -W ..."),
  (v, id) => singleQuestion(id, `${v.context} calisan service'leri listele.`, "systemctl list-units --type=service --state=running", "Aktif servisleri systemd uzerinden filtreleyerek listele.", "systemctl list-units ..."),
];

const networkVariants = Array.from({ length: 10 }, (_, index) => networkVariant(index));
const sshVariants = Array.from({ length: 10 }, (_, index) => sshVariant(index));
const monitoringVariants = Array.from({ length: 10 }, (_, index) => monitoringVariant(index));

await writeTopicFile("junior", "networking", networkingBaseQuestions);
await writeTopicFile("junior", "networking", generateQuestions("jnet-exp", networkVariants, networkingTemplates), "networking-expanded");
await writeTopicFile("junior", "ssh", sshBaseQuestions);
await writeTopicFile("junior", "ssh", generateQuestions("jssh-exp", sshVariants, sshTemplates), "ssh-expanded");
await writeTopicFile("junior", "monitoring", monitoringBaseQuestions);
await writeTopicFile("junior", "monitoring", generateQuestions("jmon-exp", monitoringVariants, monitoringTemplates), "monitoring-expanded");

console.log("junior practical topics generated");
