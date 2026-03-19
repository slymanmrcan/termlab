# Fake Terminal

Fake Terminal, Linux, DevOps ve terminal becerilerini gelistirmek icin tasarlanmis interaktif bir command-line simulatorudur. Gercek operasyon senaryolarina dayali statik soru setleriyle komut bilgisini, problem cozme hizini ve pratik beceriyi gelistirmeye odaklanir.

## Ozellikler

- junior, mid ve senior seviye akislari
- topic bazli statik JSON soru setleri
- tamamen statik frontend build, backend gerektirmez
- React + TypeScript + Vite tabanli hafif kurulum

## Gelistirme

```bash
npm install
npm run dev
npm run build
npm run lint
```

Varsayilan gelistirme adresi `http://localhost:5173` olur.

## Deploy

Uygulama tamamen statik Vite ciktisi uretir. `dist/` klasoru dogrudan GitHub Pages, Netlify, Cloudflare Pages, Vercel static hosting veya herhangi bir CDN uzerine alinabilir.

Kendi subdomain'inle yayinlayacaksan, ornek olarak `termlab.is-app.com` veya `fterminal.is-app.com` gibi bir alan adini statik ciktiya yonlendirmen yeterlidir.

Kok domain veya subdomain altinda yayinliyorsan ekstra ayar gerekmez. Repo alt yolunda yayinlayacaksan build alirken `BASE_PATH` ver:

```bash
BASE_PATH=/repo-name/ npm run build
```

## Veri Kaynagi

Uygulama aktif soru setlerini su klasorden alir:

```text
src/data/<level>/*.json
```

`*-expanded.json` dosyalari referans veya arsiv amaclidir; production bundle icine alinmaz.

## Mimari

- `src/components/`: terminal arayuzu
- `src/lib/useQuiz.ts`: quiz state ve davranislar
- `src/lib/quizLoader.ts`: statik JSON import ve dogrulama
- `src/types/quiz.ts`: ortak type tanimlari

## Lisans

Proje [MIT lisansi](./LICENSE) ile yayinlanir.
