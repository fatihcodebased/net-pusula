# Net Pusula — Bulut yayın rehberi

Bu rehber, siteyi **kendi bilgisayarınızı 7/24 açık tutmadan** internete açmanız içindir. Önerilen platform: **Railway** (kurulumu kolay). Alternatif: **Render**.

---

## Önce bilmeniz gerekenler

| Konu | Açıklama |
|------|----------|
| Laptop | Yayın sonrası **kapalı olabilir** — site bulutta çalışır |
| Maliyet | Railway/Render’da başlangıç genelde **$0–7/ay** (kullanıma göre) |
| Domain | İsteğe bağlı (`netpusula.com` vb.) — platformun verdiği `*.railway.app` adresi de yeter |
| `data/` klasörü | **GitHub’a yüklenmeli** — Excel dosyaları olmadan hesap çalışmaz |
| Taban puanları | Sonra eklenecek; bu deploy’u bozmaz |

---

## Adım 1 — Projeyi GitHub’a yükleyin

1. [github.com](https://github.com) hesabı açın (yoksa).
2. Yeni repo: örn. `net-pusula` (Private veya Public).
3. Bilgisayarınızda proje klasöründe:

```powershell
cd "c:\Users\Fatih SALMAN\Desktop\yks-tercih-sihirbazi-main"
git init
git add .
git commit -m "Net Pusula: ilk yayın sürümü"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/net-pusula.git
git push -u origin main
```

> `data/` içindeki tüm `.xlsx` dosyalarının commit’te olduğundan emin olun: `git status` ile kontrol edin.

---

## Adım 2 — Railway ile deploy (önerilen)

1. [railway.app](https://railway.app) → GitHub ile giriş.
2. **New Project** → **Deploy from GitHub repo** → `net-pusula` reposunu seçin.
3. Railway `Dockerfile`’ı otomatik kullanır (`railway.toml` ayarlı).
4. İlk build 2–5 dakika sürebilir.
5. **Settings** → **Networking** → **Generate Domain** (örn. `net-pusula-production.up.railway.app`).
6. Tarayıcıda domain’i açın → Net Pusula ana sayfası gelmeli.
7. Sağ altta **“Hesaplama motoru hazır”** görünüyorsa API de çalışıyordur.

### Sorun giderme

| Belirti | Çözüm |
|---------|--------|
| Build hatası | Railway loglarında `pip` / `data/` eksikliğine bakın |
| Site açılıyor, hesap yok | `data/` repoda mı? `/yks/health` adresini açın |
| 503 health | Excel dosya adları `README` ile aynı mı? |

---

## Adım 3 — Kendi domain (isteğe bağlı)

1. Domain satın alın (Natro, GoDaddy, Google Domains vb.).
2. Railway → proje → **Settings** → **Custom Domain** → alan adınızı ekleyin.
3. Satıcı panelinde Railway’in verdiği **CNAME** kaydını girin.
4. Birkaç saat içinde `https://sizin-domain.com` çalışır (HTTPS otomatik).

---

## Alternatif: Render.com

1. [render.com](https://render.com) → GitHub bağlantısı.
2. **New** → **Web Service** → repoyu seçin.
3. **Runtime: Docker** (veya repodaki `render.yaml` Blueprint).
4. **Health Check Path:** `/yks/health`
5. Deploy → Render `*.onrender.com` adresi verir.

Ücretsiz planda soğuk başlangıç (ilk istek 30–60 sn gecikebilir) olabilir; Railway genelde daha akıcıdır.

---

## Güncelleme (yeni sürüm yayınlama)

Kod değiştirdikten sonra:

```powershell
git add .
git commit -m "Açıklama"
git push
```

Railway/Render otomatik yeniden deploy eder.

---

## Sonraki faz: Taban puanları

1. Veri hazır olunca (CSV/Excel) `data/` veya `data/programs/` altına ekleyin.
2. Yeni backend modülü + `taban-puanlari.html` (veya menü linki).
3. `git push` — mevcut hesaplayıcı **aynı adreste** çalışmaya devam eder.

---

## Özet

| Soru | Cevap |
|------|--------|
| Bulut doğru mu? | Evet — laptop için en mantıklısı |
| Omen zarar görür mü? | Bulutta yayında **hayır** |
| Hep açık PC? | **Hayır** |
| Bu rehber yeterli mi? | Railway + GitHub ile tek başına yayın mümkün |

Takıldığınız adımı yazın; log ekran görüntüsüyle birlikte netleştiririz.
