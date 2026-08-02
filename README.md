# TermLab

TermLab, Linux, DevOps ve terminal becerilerini pratik etmek icin hazirlanmis statik bir React/Vite uygulamasidir. Uygulama JSON tabanli soru havuzunu yukler, terminal benzeri bir arayuzde senaryo bazli komut sorulari sorar ve `junior`, `mid`, `senior` seviyelerinde ilerler.

Canli adres: [https://termlab.is-app.com/](https://termlab.is-app.com/)

## Ne Yapar

- Linux, shell, git, docker, kubernetes, networking ve benzeri konularda interaktif komut sorulari sunar.
- Her soruda hint, skip ve show answer akisini destekler.
- Soru havuzunu statik JSON dosyalarindan yukler; runtime'da ekstra veri uretmez.
- Vite build ciktisi ile dogrudan statik olarak deploy edilir.

## Yapi

- `src/components/`: terminal arayuzu, alt bar, header ve uygulama kabugu.
- `src/config/topics.ts`: topic kimlikleri, etiketleri ve UI section dagilimi.
- `src/lib/useQuiz.ts`: quiz state, ilerleme, scoring ve shortcut davranisi.
- `src/lib/quizLoader.ts`: `src/data/` altindaki aktif JSON dosyalarini toplar.
- `src/data/<level>/*.json`: aktif soru havuzu. Non-expanded seed dosyalari burada tutulur.
- `src/data/**/*-expanded.json`: ayni topic icin ek varyasyon soru setleri. Mevcut loader bunlari da merge eder.
- `Dockerfile`: production build alip nginx ile servis eder.
- `docker-compose.yml`: container'i mevcut `infra_net` agina baglayacak sekilde hazirlanmistir.

## Local Calistirma

Gereksinim: Node.js 22+ ve npm.

```bash
npm install
npm run dev
```

Varsayilan gelistirme adresi Vite tarafinda terminalde yazdirilir. Kontrol icin:

```bash
npm run build
npm run lint
```

Istersen production preview da acabilirsin:

```bash
npm run preview
```

## Docker

Tek container ile calistirmak icin:

```bash
docker build -t fake-terminal .
docker run --rm -p 8080:80 fake-terminal
```

Ardindan uygulama su adreste acilir:

```text
http://localhost:8080
```

`docker-compose.yml` kullanmak icin once external network olustur:

```bash
docker network create infra_net
docker compose up -d --build
```

Bu compose tanimi container'i `infra_net` icinde `fake-terminal` servisi olarak ayaga kaldirir. Reverse proxy kullaniyorsan bu ag uzerinden publish etmen gerekir.

## Veri Akisi

- Soru setleri `src/data/<level>/*.json` altinda tutulur.
- Loader yalniz secili `level/topic` icin gerekli base ve `*-expanded.json` dosyalarini lazy load eder, sonra merge edip quiz datasina cevirir.
- Kullanilan aktif veri statiktir; uygulama soru kalitesini runtime'da override etmez.

## Yeni Topic Ekleme

Yeni bir konu eklemek icin minimum akisin tamami client-side kalir:

1. `src/config/topics.ts` icine yeni `id`, `label` ve `section` ekle.
2. Her seviye icin `src/data/<level>/<topic>.json` dosyasi olustur.
3. JSON icindeki `topic` alani config'deki `id` ile birebir ayni olsun.
4. Dosya adi varsayilan olarak `topic` id ile ayni olmali; farkli bir stem kullanacaksan `src/lib/quizLoader.ts` icindeki topic file map'ini de guncelle.
5. Ek varyasyon istiyorsan `src/data/<level>/<topic>-expanded.json` dosyalari ekle.
6. Son olarak `npm run build` ve `npm run lint` ile veri ve topic tanimini dogrula.

## Deploy

Uygulama statik build verir. Production ciktisi `dist/` klasorune yazilir.

```bash
npm run build
```

Nginx, CDN ya da herhangi bir static hosting uzerinden yayinlanabilir. Mevcut deploy adresi:

- [https://termlab.is-app.com/](https://termlab.is-app.com/)

## Lisans

Bu repo MIT lisansi ile dagitilir. Ayrinti icin [LICENSE](./LICENSE) dosyasina bak.
