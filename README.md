# YKS Puan Hesaplama — Portfolio

Bu paket; **ön yüz** (HTML/CSS/JS), **hesaplama için kullanılan Excel veri tabloları** ve kısa dokümantasyonu bir arada sunar. Üretim sunucu yapılandırması, API anahtarları ve tam `api.py` kodu burada zorunlu değildir; veri dosyaları backend’i kendiniz çalıştırırken veya incelemek için eklenmiştir.

## İçindekiler

| Dosya / klasör | Açıklama |
|----------------|----------|
| `index.html` | TYT/AYT net girişi, OBP, sonuç alanı ve bilgilendirme içeriği |
| `assets/puan-hesaplama.css` | Hesaplayıcı arayüz stilleri |
| `assets/layout-shell.css` | Üst menü, portfolio notu ve footer kabuğu |
| `assets/puan-hesaplama.js` | Net hesaplama, `POST /yks/calculate` ile sonuç isteği |
| `data/*.xlsx` | Katsayı ve yığılma tabloları (aşağıda ayrıntılı liste) |

## Veri tabloları (`data/`)

Backend’deki `YKSHesaplayici` sınıfı bu dosya adlarıyla uyumludur; kendi API’nizi bu klasörü `base_path` olarak gösterecek şekilde çalıştırabilirsiniz.

### Katsayı dosyaları (puan türü başına)

| Dosya | Kullanım |
|-------|----------|
| `TYT_Puan_Katsayilari_2019_2025.xlsx` | TYT ham puan katsayıları |
| `Sayisal_Puan_Katsayilari_2019_2025.xlsx` | Sayısal (SAY) |
| `Esit_Agirlik_Puan_Katsayilari_2019_2025.xlsx` | Eşit ağırlık (EA) |
| `sozel_puan_katsayilari_2019_2025.xlsx` | Sözel (SÖZ) |
| `Dil_Puan_Katsayilari_2020_2025.xlsx` | Dil (DİL) |

### Yığılma dosyaları (yerleştirme puanı sıralaması)

| Dosya | Yıl / not |
|-------|-----------|
| `2022.xlsx` … `2024.xlsx` | İlgili yıl yerleştirme yığılması |
| `2025 Yigilma.xlsx` | 2025 yığılma |

### Ham puan yığılması (ham puan sıralaması)

| Dosya | Yıl |
|-------|-----|
| `2022_YKS_Yiginsal_Dagilim_ham_Tablo.xlsx` | 2022 |
| `2023_YKS_Yiginsal_Dagilim_ham_Tablo.xlsx` | 2023 |
| `2024_YKS_Yiginsal_Dagilim_ham_Tablo.xlsx` | 2024 |
| `2025_YKS_Yiginsal_Dagilim_ham_Tablo.xlsx` | 2025 |

> Tarayıcıdaki statik sayfa bu Excel’leri doğrudan okumaz; okuma işlemi sunucu tarafında (pandas vb.) yapılır.

## Yerelde önizleme

Kök dizinde (`portfolio/yks-puan-hesaplama/`):

```bash
python3 -m http.server 8080
```

Tarayıcı: `http://localhost:8080`

> **Not:** API tabanı ayarlanmadan “Hesapla” isteği aynı origin üzerinde `/yks/calculate` arar; statik sunucuda bu uç yoksa hata alırsınız — bu beklenen davranıştır.

## API’yi bağlama (isteğe bağlı)

Kendi veya herkese açık bir API’niz varsa, sayfayı yüklemeden önce taban URL’yi verin:

```html
<script>
  window.__YKS_API_BASE__ = 'https://ornek-alanadiniz.com';
</script>
```

Sunucunun şu uçlara yanıt vermesi gerekir:

- `POST /yks/calculate` — istek gövdesi, üretimdeki `api.py` ile uyumlu JSON
- `GET /yks/health` — sağlık kontrolü (istemci bağlantıyı doğrulamak için kullanır)

API sürecinin bu Excel’leri okuması için veri klasörünü ana projedeki `tercih simülasyonu` yapısına benzer şekilde (`data/` içeriğini `base_path` olarak) bağlamanız gerekir.

CORS, API’nin barındığı alan adından bu statik sayfaya izin verecek şekilde yapılandırılmalıdır.

## Üretim sürümünden farklar

- Google Tag Manager / reklam ölçümü kaldırıldı
- Ürün reklam slider’ı kaldırıldı; yerine portfolio açıklama kutusu eklendi
- Navigasyon ve footer, harici site linkleri yerine GitHub odaklı sadeleştirildi
- Logo ve sosyal görseller (`/static/images/...`) kaldırıldı
- İstemci kodunda **sabit sunucu IP’si** bulunmaz

## Tam backend (ana repo)

FastAPI route’ları, şablonlar ve diğer site sayfaları ana projededir; bu paket özellikle **portfolio + veri + ön yüz** tekrarını kolaylaştırmak içindir.

## Lisans / telif

İçerik ve formüller eğitim / portfolio gösterimi içindir. ÖSYM ve resmi veri kaynaklarının kullanım koşullarına uyum sizin sorumluluğunuzdadır.
