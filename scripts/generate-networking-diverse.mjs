/**
 * Improved expanded-data generator: networking (junior).
 *
 * Key difference from the old approach:
 *  - Templates use DIFFERENT commands/patterns, not just swapped parameters.
 *  - Each variant introduces a unique concept (pipe chains, alternate tools, flags).
 *  - Contexts use proper Turkish characters.
 *
 * Usage: node scripts/generate-networking-diverse.mjs
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// ─── Diverse question templates ────────────────────────────────────────────────
// Each question teaches a DISTINCT concept. No two questions share the same
// command pattern unless they demonstrate a meaningful variation.

const questions = [
  // ── ip / link layer ──
  {
    id: "jnet-div-001",
    scenario: "Tüm interface'lerin MAC adreslerini tek satırda göster.",
    answer: "ip -br link show",
    accepted: ["ip -br link show", "ip -br link"],
    hint: "Link katmanı bilgisi için `ip link` kullan, kısa format için `-br` ekle.",
    partial: "ip -br link ...",
  },
  {
    id: "jnet-div-002",
    scenario: "`eth0` interface'ine atanmış IPv4 adreslerini JSON formatında göster.",
    answer: "ip -j -4 addr show eth0",
    accepted: ["ip -j -4 addr show eth0", "ip -json -4 address show eth0"],
    hint: "JSON çıktı için `-j`, IPv4 filtresi için `-4` ekle.",
    partial: "ip -j -4 ...",
  },
  {
    id: "jnet-div-003",
    scenario: "Routing tablosundaki tüm cache entries'leri göster.",
    answer: "ip route show cache",
    accepted: ["ip route show cache", "ip r show cache"],
    hint: "Route cache'i görmek için `ip route show cache` kullan.",
    partial: "ip route show ...",
  },
  {
    id: "jnet-div-004",
    scenario: "`10.0.0.0/24` subnet'ine giden route'u göster.",
    answer: "ip route get 10.0.0.1",
    accepted: ["ip route get 10.0.0.1"],
    hint: "Belirli bir hedef IP için kernel'in seçtiği route'u `ip route get` ile sorgula.",
    partial: "ip route get ...",
  },
  {
    id: "jnet-div-005",
    scenario: "Interface istatistiklerini (RX/TX packet, error) tablo formatında göster.",
    answer: "ip -s -s link show",
    accepted: ["ip -s -s link show", "ip -statistics link show"],
    hint: "Detaylı istatistik için `-s` flag'ini iki kez kullan.",
    partial: "ip -s -s ...",
  },

  // ── ss / socket layer ──
  {
    id: "jnet-div-006",
    scenario: "Dinleyen UDP portlarını process bilgisiyle birlikte göster.",
    answer: "ss -lunp",
    accepted: ["ss -lunp", "ss -lnup", "ss --listening --udp --numeric --processes"],
    hint: "UDP için `-u`, process için `-p` ekle.",
    partial: "ss -lu...",
  },
  {
    id: "jnet-div-007",
    scenario: "ESTABLISHED durumdaki tüm TCP bağlantıları göster.",
    answer: "ss -tn state established",
    accepted: ["ss -tn state established", "ss -tnp state established"],
    hint: "State filtresi için `ss` sonunda `state established` kullan.",
    partial: "ss -tn state ...",
  },
  {
    id: "jnet-div-008",
    scenario: "443 portuna bağlı tüm bağlantıları göster.",
    answer: "ss -tn dst :443",
    accepted: ["ss -tn dst :443", "ss -tnp dst :443"],
    hint: "Hedef port filtresi için `dst :port` kullan.",
    partial: "ss -tn dst ...",
  },
  {
    id: "jnet-div-009",
    scenario: "Socket özet istatistiklerini (TCP/UDP/raw toplam) göster.",
    answer: "ss -s",
    accepted: ["ss -s", "ss --summary"],
    hint: "Toplam socket sayıları için `ss -s` yeterlidir.",
    partial: "ss -s",
  },
  {
    id: "jnet-div-010",
    scenario: "TIME-WAIT durumundaki bağlantı sayısını göster.",
    answer: "ss -tn state time-wait | wc -l",
    accepted: ["ss -tn state time-wait | wc -l", "ss -tan state time-wait | wc -l"],
    hint: "State filtresi + pipe ile `wc -l` kullanarak say.",
    partial: "ss -tn state time-wait | ...",
  },

  // ── DNS resolution ──
  {
    id: "jnet-div-011",
    scenario: "`example.com` için MX kayıtlarını sorgula.",
    answer: "dig mx example.com",
    accepted: ["dig mx example.com", "dig example.com mx"],
    hint: "Mail exchange kayıtları için `dig mx` kullan.",
    partial: "dig mx ...",
  },
  {
    id: "jnet-div-012",
    scenario: "`example.com` için TXT kayıtlarını kısa formatta göster.",
    answer: "dig +short txt example.com",
    accepted: ["dig +short txt example.com", "dig +short example.com txt"],
    hint: "TXT kaydı için `dig +short txt` kullan.",
    partial: "dig +short txt ...",
  },
  {
    id: "jnet-div-013",
    scenario: "`example.com` domain'inin SOA kaydını göster.",
    answer: "dig soa example.com",
    accepted: ["dig soa example.com", "dig example.com soa"],
    hint: "Start of Authority kaydı için `dig soa` kullan.",
    partial: "dig soa ...",
  },
  {
    id: "jnet-div-014",
    scenario: "Reverse DNS lookup ile `8.8.8.8` adresinin PTR kaydını sorgula.",
    answer: "dig +short -x 8.8.8.8",
    accepted: ["dig +short -x 8.8.8.8", "dig -x 8.8.8.8 +short"],
    hint: "Reverse lookup için `dig -x` kullan.",
    partial: "dig +short -x ...",
  },
  {
    id: "jnet-div-015",
    scenario: "`example.com` için tüm DNS kayıtlarını (ANY) göster.",
    answer: "dig any example.com",
    accepted: ["dig any example.com", "dig example.com any"],
    hint: "Tüm kayıt tipleri için `dig any` kullan.",
    partial: "dig any ...",
  },
  {
    id: "jnet-div-016",
    scenario: "`host` komutuyla `example.com` adresini çöz.",
    answer: "host example.com",
    accepted: ["host example.com"],
    hint: "Basit DNS çözümü için `host` komutu yeterlidir.",
    partial: "host ...",
  },
  {
    id: "jnet-div-017",
    scenario: "`/etc/hosts` dosyasını kullanarak `localhost` çözümünü göster.",
    answer: "getent hosts localhost",
    accepted: ["getent hosts localhost"],
    hint: "NSS üzerinden çözüm için `getent hosts` kullan.",
    partial: "getent hosts ...",
  },

  // ── HTTP / curl ──
  {
    id: "jnet-div-018",
    scenario: "`https://example.com` sayfasının HTTP status code'unu göster.",
    answer: "curl -o /dev/null -s -w '%{http_code}' https://example.com",
    accepted: [
      "curl -o /dev/null -s -w '%{http_code}' https://example.com",
      'curl -o /dev/null -s -w "%{http_code}" https://example.com',
      "curl -sw '%{http_code}' -o /dev/null https://example.com",
    ],
    hint: "Write-out formatı için `-w '%{http_code}'` ve çıktıyı atmak için `-o /dev/null` kullan.",
    partial: "curl -o /dev/null -s -w ...",
  },
  {
    id: "jnet-div-019",
    scenario: "`https://example.com` sayfasının response süresini göster.",
    answer: "curl -o /dev/null -s -w '%{time_total}' https://example.com",
    accepted: [
      "curl -o /dev/null -s -w '%{time_total}' https://example.com",
      'curl -o /dev/null -s -w "%{time_total}" https://example.com',
    ],
    hint: "Toplam süre için `%{time_total}` write-out değişkenini kullan.",
    partial: "curl -o /dev/null -s -w '%{time_total}' ...",
  },
  {
    id: "jnet-div-020",
    scenario: "`https://example.com` adresine redirect'leri takip ederek istek at.",
    answer: "curl -L https://example.com",
    accepted: ["curl -l https://example.com", "curl --location https://example.com"],
    hint: "Redirect takibi için `-L` flag'ini kullan.",
    partial: "curl -L ...",
  },
  {
    id: "jnet-div-021",
    scenario: "`https://example.com` TLS sertifika bilgilerini göster.",
    answer: "curl -vI https://example.com 2>&1 | grep -i 'ssl\\|tls\\|certificate'",
    accepted: [
      "curl -vi https://example.com 2>&1 | grep -i 'ssl\\|tls\\|certificate'",
      "curl -vI https://example.com 2>&1 | grep -i ssl",
    ],
    hint: "Verbose header çıktısından SSL satırlarını grep ile filtrele.",
    partial: "curl -vI https://example.com 2>&1 | grep ...",
  },
  {
    id: "jnet-div-022",
    scenario: "`https://example.com` sayfasını `page.html` olarak indir.",
    answer: "curl -o page.html https://example.com",
    accepted: ["curl -o page.html https://example.com", "curl https://example.com -o page.html"],
    hint: "Dosyaya kaydetmek için `-o filename` kullan.",
    partial: "curl -o ... https://example.com",
  },

  // ── connectivity / troubleshooting ──
  {
    id: "jnet-div-023",
    scenario: "`example.com` hedefine giden hop'ları ve response sürelerini göster.",
    answer: "traceroute example.com",
    accepted: ["traceroute example.com", "tracepath example.com"],
    hint: "Ara hop'ları görmek için `traceroute` kullan.",
    partial: "traceroute ...",
  },
  {
    id: "jnet-div-024",
    scenario: "`10.0.0.1` adresine 10 paket gönder ve packet loss oranını göster.",
    answer: "ping -c 10 10.0.0.1",
    accepted: ["ping -c 10 10.0.0.1"],
    hint: "Paket sayısı için `-c 10` kullan; özet otomatik gelir.",
    partial: "ping -c 10 ...",
  },
  {
    id: "jnet-div-025",
    scenario: "`localhost` üzerinde 5432 portunun açık olup olmadığını test et.",
    answer: "nc -zv localhost 5432",
    accepted: ["nc -zv localhost 5432", "nc -z localhost 5432"],
    hint: "TCP port testi için `nc -zv host port` kullan.",
    partial: "nc -zv ...",
  },
  {
    id: "jnet-div-026",
    scenario: "`example.com` 443 portuna TLS handshake testi yap.",
    answer: "openssl s_client -connect example.com:443 -brief",
    accepted: [
      "openssl s_client -connect example.com:443 -brief",
      "openssl s_client -connect example.com:443",
    ],
    hint: "TLS bağlantı testi için `openssl s_client -connect` kullan.",
    partial: "openssl s_client -connect ...",
  },
  {
    id: "jnet-div-027",
    scenario: "ARP tablosundaki tüm entry'leri göster.",
    answer: "ip neigh show",
    accepted: ["ip neigh show", "ip neighbor show", "arp -a"],
    hint: "Komşu tablosu için `ip neigh` veya klasik `arp -a` kullan.",
    partial: "ip neigh ...",
  },
  {
    id: "jnet-div-028",
    scenario: "Kernel'in IP forwarding ayarını kontrol et.",
    answer: "cat /proc/sys/net/ipv4/ip_forward",
    accepted: ["cat /proc/sys/net/ipv4/ip_forward", "sysctl net.ipv4.ip_forward"],
    hint: "procfs üzerinden veya `sysctl` ile forwarding değerini oku.",
    partial: "cat /proc/sys/net/ipv4/...",
  },

  // ── firewall / iptables ──
  {
    id: "jnet-div-029",
    scenario: "Aktif firewall kurallarını (iptables) listele.",
    answer: "iptables -L -n -v",
    accepted: ["iptables -l -n -v", "iptables -lnv", "sudo iptables -l -n -v"],
    hint: "Numeric ve verbose listeleme için `-L -n -v` kullan.",
    partial: "iptables -L ...",
  },
  {
    id: "jnet-div-030",
    scenario: "NAT tablosundaki kuralları göster.",
    answer: "iptables -t nat -L -n",
    accepted: ["iptables -t nat -l -n", "sudo iptables -t nat -l -n"],
    hint: "NAT tablosu için `-t nat` ekle.",
    partial: "iptables -t nat ...",
  },

  // ── pipe chains / practical combos ──
  {
    id: "jnet-div-031",
    scenario: "En çok bağlantı kurulan ilk 5 remote IP'yi göster.",
    answer: "ss -tn | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -5",
    accepted: [
      "ss -tn | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -5",
      "ss -tn | awk '{print $5}' | cut -d: -f1 | sort | uniq -c | sort -rn | head -n 5",
    ],
    hint: "ss çıktısını awk → cut → sort → uniq -c → sort -rn → head ile işle.",
    partial: "ss -tn | awk ... | sort | uniq -c | ...",
  },
  {
    id: "jnet-div-032",
    scenario: "Dinleyen portları ve sahip process'leri birlikte göster.",
    answer: "ss -ltnp",
    accepted: ["ss -ltnp", "ss -ltnp", "ss --listening --tcp --numeric --processes"],
    hint: "Process bilgisi için `-p` flag'ini ekle.",
    partial: "ss -ltn...",
  },
  {
    id: "jnet-div-033",
    scenario: "`/etc/resolv.conf` içindeki nameserver satırlarını göster.",
    answer: "grep nameserver /etc/resolv.conf",
    accepted: ["grep nameserver /etc/resolv.conf", "grep ^nameserver /etc/resolv.conf"],
    hint: "Sadece nameserver satırları için `grep nameserver` kullan.",
    partial: "grep nameserver ...",
  },
  {
    id: "jnet-div-034",
    scenario: "Makinenin hostname'ini ve tüm IP adreslerini göster.",
    answer: "hostname -I",
    accepted: ["hostname -i", "hostname -I"],
    hint: "Atanmış IP'ler için `hostname -I` kullan.",
    partial: "hostname -...",
  },
  {
    id: "jnet-div-035",
    scenario: "TCP bağlantılarını durumlarına göre gruplayarak say.",
    answer: "ss -tn | awk 'NR>1{print $1}' | sort | uniq -c | sort -rn",
    accepted: [
      "ss -tn | awk 'nr>1{print $1}' | sort | uniq -c | sort -rn",
      "ss -tan | awk 'NR>1{print $1}' | sort | uniq -c | sort -rn",
    ],
    hint: "ss çıktısının ilk kolonunu (state) awk ile al, uniq -c ile say.",
    partial: "ss -tn | awk ... | uniq -c | ...",
  },
  {
    id: "jnet-div-036",
    scenario: "`example.com` için WHOIS bilgisini sorgula.",
    answer: "whois example.com",
    accepted: ["whois example.com"],
    hint: "Domain tescil bilgileri için `whois` kullan.",
    partial: "whois ...",
  },
  {
    id: "jnet-div-037",
    scenario: "Belirli bir interface üzerinden geçen paketleri say.",
    answer: "ip -s link show eth0 | grep -A1 'RX:'",
    accepted: [
      "ip -s link show eth0 | grep -a1 'rx:'",
      "ip -s link show eth0",
    ],
    hint: "Interface istatistiklerinden RX satırını grep ile çek.",
    partial: "ip -s link show eth0 | grep ...",
  },
  {
    id: "jnet-div-038",
    scenario: "DNS çözüm süresini ölç.",
    answer: "time dig example.com",
    accepted: ["time dig example.com", "time dig +short example.com"],
    hint: "Komut süresini ölçmek için `time` prefix'ini kullan.",
    partial: "time dig ...",
  },
  {
    id: "jnet-div-039",
    scenario: "`/etc/services` dosyasında 443 portunun hangi servise ait olduğunu bul.",
    answer: "grep 443 /etc/services",
    accepted: ["grep 443 /etc/services", "grep ':443' /etc/services", "grep -w 443 /etc/services"],
    hint: "Port-servis eşleşmesi için `/etc/services` dosyasını grep'le.",
    partial: "grep 443 ...",
  },
  {
    id: "jnet-div-040",
    scenario: "Network namespace'lerini listele.",
    answer: "ip netns list",
    accepted: ["ip netns list", "ip netns"],
    hint: "Namespace listesi için `ip netns list` kullan.",
    partial: "ip netns ...",
  },
];

// ─── Write output ──────────────────────────────────────────────────────────────

function toQuizFormat(questions) {
  return questions.map((q) => ({
    id: q.id,
    type: "single",
    scenario: q.scenario,
    steps: [
      {
        prompt: "$ ",
        answer: q.answer,
        ...(q.accepted ? { accepted_answers: q.accepted } : {}),
        hint_text: q.hint,
        hint_partial: q.partial,
      },
    ],
  }));
}

async function writeTopicFile(level, topic, quizQuestions, fileStem) {
  const outputPath = path.join(ROOT_DIR, "src", "data", level, `${fileStem}.json`);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(
    outputPath,
    `${JSON.stringify({ level, topic, questions: quizQuestions }, null, 2)}\n`,
    "utf8",
  );
  console.log(`  wrote ${outputPath} (${quizQuestions.length} questions)`);
}

console.log("Generating diverse networking expanded data...");
await writeTopicFile("junior", "networking", toQuizFormat(questions), "networking-expanded");
console.log("Done.");
