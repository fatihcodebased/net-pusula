# Net Pusula — YKS Puan Hesaplama

ÖSYM katsayı ve yığılma Excel verileriyle TYT / AYT netlerinden puan ve sıralama tahmini.

## Gereksinimler

- Python 3.10+
- `data/` klasöründeki `.xlsx` dosyaları (repoda veya [GitHub data](https://github.com/bilgingurek/yks-tercih-sihirbazi/tree/main/data))

## Kurulum

```powershell
cd "c:\Users\Fatih SALMAN\Desktop\yks-tercih-sihirbazi-main"
pip install -r requirements.txt
```

## Çalıştırma

Tek komutla site + API:

```powershell
python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Tarayıcı: **http://127.0.0.1:8000**

- `GET /yks/health` — sunucu durumu  
- `POST /yks/calculate` — puan hesabı (JSON gövde, `assets/calculator.js` ile uyumlu)

## Veri dosyaları (`data/`)

| Dosya | Açıklama |
|-------|----------|
| `TYT_Puan_Katsayilari_2019_2025.xlsx` | TYT katsayıları |
| `Sayisal_Puan_Katsayilari_2019_2025.xlsx` | Sayısal (SAY) |
| `Esit_Agirlik_Puan_Katsayilari_2019_2025.xlsx` | Eşit ağırlık (EA) |
| `sozel_puan_katsayilari_2019_2025.xlsx` | Sözel (SÖZ) |
| `Dil_Puan_Katsayilari_2020_2025.xlsx` | Dil (DİL) |
| `2022.xlsx` … `2025 Yigilma.xlsx` | Yerleştirme yığılması |
| `*_ham_Tablo.xlsx` | Ham puan yığılması |

## Proje yapısı

| Yol | Açıklama |
|-----|----------|
| `index.html` | Net Pusula arayüzü |
| `assets/net-pusula.css` | Koyu tema stilleri |
| `assets/calculator.js` | Net + API istemcisi |
| `backend/yks_hesaplayici.py` | Excel tabanlı hesaplama |
| `backend/main.py` | FastAPI + statik dosyalar |

## Buluta yayınlama

Laptop’u 7/24 açık tutmadan internete açmak için adım adım rehber:

**[DEPLOY.md](./DEPLOY.md)** — Railway (önerilen), Render, domain, güncelleme.

Projede `Dockerfile` ve `railway.toml` hazırdır.

## Not

Sonuçlar yayımlanmış tablolara dayalı **tahmindir**; resmi ÖSYM sonucu değildir. Taban puanları modülü sonraki sürümde eklenecek.
