// YKS Puan Hesaplama JavaScript - Backend API ile entegre

// API tabanı: canlı demo veya kendi sunucunuz (ör. '') — sayfadan: window.__YKS_API_BASE__ = 'https://api.ornek.com'
const API_URL =
    typeof window !== 'undefined' && typeof window.__YKS_API_BASE__ === 'string'
        ? window.__YKS_API_BASE__.replace(/\/$/, '')
        : '';
// Sonuçların gösterilip gösterilmediğini takip et
let sonuclarGosterildi = false;

// Debounce timer
let debounceTimer = null;

// Net hesaplama fonksiyonu
function hesaplaNet(dogru, yanlis) {
    return Math.max(0, dogru - 0.25 * yanlis);
}

// Tüm input alanlarına event listener ekle
document.addEventListener('DOMContentLoaded', function() {
    // TYT Net Hesaplamaları
    const tytTestler = [
        { prefix: 'tyt_turk', max: 40 },
        { prefix: 'tyt_sos', max: 20 },
        { prefix: 'tyt_mat', max: 40 },
        { prefix: 'tyt_fen', max: 20 }
    ];

    tytTestler.forEach(test => {
        const dogruInput = document.getElementById(`${test.prefix}_d`);
        const yanlisInput = document.getElementById(`${test.prefix}_y`);
        const netDisplay = document.getElementById(`${test.prefix}_net`);

        if (dogruInput && yanlisInput && netDisplay) {
            dogruInput.addEventListener('input', () => {
                updateNet(test.prefix, test.max);
                otomatikHesapla();
            });
            yanlisInput.addEventListener('input', () => {
                updateNet(test.prefix, test.max);
                otomatikHesapla();
            });
        }
    });

    // AYT Net Hesaplamaları
    const aytTestler = [
        { prefix: 'ayt_ede', max: 24 },
        { prefix: 'ayt_tar1', max: 10 },
        { prefix: 'ayt_cog1', max: 6 },
        { prefix: 'ayt_tar2', max: 11 },
        { prefix: 'ayt_cog2', max: 11 },
        { prefix: 'ayt_fel', max: 12 },
        { prefix: 'ayt_din', max: 6 },
        { prefix: 'ayt_mat', max: 40 },
        { prefix: 'ayt_fiz', max: 14 },
        { prefix: 'ayt_kim', max: 13 },
        { prefix: 'ayt_bio', max: 13 },
        { prefix: 'ayt_ydt', max: 80 }
    ];

    aytTestler.forEach(test => {
        const dogruInput = document.getElementById(`${test.prefix}_d`);
        const yanlisInput = document.getElementById(`${test.prefix}_y`);
        const netDisplay = document.getElementById(`${test.prefix}_net`);

        if (dogruInput && yanlisInput && netDisplay) {
            dogruInput.addEventListener('input', () => {
                updateNet(test.prefix, test.max);
                otomatikHesapla();
            });
            yanlisInput.addEventListener('input', () => {
                updateNet(test.prefix, test.max);
                otomatikHesapla();
            });
        }
    });

    // OBP ve geçen sene yerleştim checkbox'ına da event listener ekle
    const obpInput = document.getElementById('obp');
    const previousPlacementCheckbox = document.getElementById('previousPlacement');
    
    if (obpInput) {
        obpInput.addEventListener('input', otomatikHesapla);
    }
    
    if (previousPlacementCheckbox) {
        previousPlacementCheckbox.addEventListener('change', otomatikHesapla);
    }

    // Hesapla butonuna event listener
    const calculateBtn = document.getElementById('calculateBtn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', () => {
            sonuclarGosterildi = true;
            hesaplaVeGoster();
        });
    }
});

// Net güncelleme fonksiyonu
function updateNet(prefix, maxSoru) {
    const dogruInput = document.getElementById(`${prefix}_d`);
    const yanlisInput = document.getElementById(`${prefix}_y`);
    const netDisplay = document.getElementById(`${prefix}_net`);

    if (!dogruInput || !yanlisInput || !netDisplay) return;

    let dogru = parseInt(dogruInput.value) || 0;
    let yanlis = parseInt(yanlisInput.value) || 0;

    // Validasyon
    if (dogru < 0) dogru = 0;
    if (yanlis < 0) yanlis = 0;
    if (dogru > maxSoru) dogru = maxSoru;
    if (yanlis > maxSoru) yanlis = maxSoru;
    if (dogru + yanlis > maxSoru) {
        yanlis = maxSoru - dogru;
        yanlisInput.value = yanlis;
    }

    dogruInput.value = dogru;
    yanlisInput.value = yanlis;

    const net = hesaplaNet(dogru, yanlis);
    netDisplay.textContent = net.toFixed(2);
}

// Otomatik hesaplama fonksiyonu (debounce ile)
function otomatikHesapla() {
    // Eğer sonuçlar gösterilmemişse hiçbir şey yapma
    if (!sonuclarGosterildi) {
        return;
    }

    // Önceki timer'ı temizle
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    // 800ms bekle, kullanıcı yazmayı bitirsin
    debounceTimer = setTimeout(() => {
        hesaplaVeGoster(true); // true = otomatik hesaplama
    }, 800);
}

// Ana hesaplama ve gösterim fonksiyonu - Backend API'ye istek gönder
async function hesaplaVeGoster(otomatik = false) {
    const calculateBtn = document.getElementById('calculateBtn');
    const originalText = calculateBtn.innerHTML;
    
    // Butonu devre dışı bırak ve loading göster (sadece manuel hesaplamada)
    if (!otomatik) {
        calculateBtn.disabled = true;
        calculateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> HESAPLANIYOR...';
    }

    try {
        // OBP al
        let obp = parseFloat(document.getElementById('obp').value) || 0;
        
        // Geçen sene yerleştim kontrolü - Eğer aktifse OBP'yi yarıya düşür
        const previousPlacement = document.getElementById('previousPlacement').checked;
        if (previousPlacement) {
            obp = obp / 2;
            console.log(`📊 Geçen sene yerleşti - OBP yarıya düşürüldü: ${obp}`);
        }

        // Netleri topla
        const tyt = {
            turkce: {
                dogru: parseInt(document.getElementById('tyt_turk_d').value) || 0,
                yanlis: parseInt(document.getElementById('tyt_turk_y').value) || 0
            },
            sosyal: {
                dogru: parseInt(document.getElementById('tyt_sos_d').value) || 0,
                yanlis: parseInt(document.getElementById('tyt_sos_y').value) || 0
            },
            matematik: {
                dogru: parseInt(document.getElementById('tyt_mat_d').value) || 0,
                yanlis: parseInt(document.getElementById('tyt_mat_y').value) || 0
            },
            fen: {
                dogru: parseInt(document.getElementById('tyt_fen_d').value) || 0,
                yanlis: parseInt(document.getElementById('tyt_fen_y').value) || 0
            }
        };

        const ayt = {
            edebiyat: {
                dogru: parseInt(document.getElementById('ayt_ede_d').value) || 0,
                yanlis: parseInt(document.getElementById('ayt_ede_y').value) || 0
            },
            tarih1: {
                dogru: parseInt(document.getElementById('ayt_tar1_d').value) || 0,
                yanlis: parseInt(document.getElementById('ayt_tar1_y').value) || 0
            },
            cografya1: {
                dogru: parseInt(document.getElementById('ayt_cog1_d').value) || 0,
                yanlis: parseInt(document.getElementById('ayt_cog1_y').value) || 0
            },
            tarih2: {
                dogru: parseInt(document.getElementById('ayt_tar2_d').value) || 0,
                yanlis: parseInt(document.getElementById('ayt_tar2_y').value) || 0
            },
            cografya2: {
                dogru: parseInt(document.getElementById('ayt_cog2_d').value) || 0,
                yanlis: parseInt(document.getElementById('ayt_cog2_y').value) || 0
            },
            felsefe: {
                dogru: parseInt(document.getElementById('ayt_fel_d').value) || 0,
                yanlis: parseInt(document.getElementById('ayt_fel_y').value) || 0
            },
            din: {
                dogru: parseInt(document.getElementById('ayt_din_d').value) || 0,
                yanlis: parseInt(document.getElementById('ayt_din_y').value) || 0
            },
            matematik: {
                dogru: parseInt(document.getElementById('ayt_mat_d').value) || 0,
                yanlis: parseInt(document.getElementById('ayt_mat_y').value) || 0
            },
            fizik: {
                dogru: parseInt(document.getElementById('ayt_fiz_d').value) || 0,
                yanlis: parseInt(document.getElementById('ayt_fiz_y').value) || 0
            },
            kimya: {
                dogru: parseInt(document.getElementById('ayt_kim_d').value) || 0,
                yanlis: parseInt(document.getElementById('ayt_kim_y').value) || 0
            },
            biyoloji: {
                dogru: parseInt(document.getElementById('ayt_bio_d').value) || 0,
                yanlis: parseInt(document.getElementById('ayt_bio_y').value) || 0
            },
            ydt: {
                dogru: parseInt(document.getElementById('ayt_ydt_d').value) || 0,
                yanlis: parseInt(document.getElementById('ayt_ydt_y').value) || 0
            }
        };

        // API'ye istek gönder
        const response = await fetch(`${API_URL}/yks/calculate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                obp: obp,
                tyt: tyt,
                ayt: ayt
            })
        });

        if (!response.ok) {
            throw new Error(`API Hatası: ${response.status}`);
        }

        const result = await response.json();

        if (result.status === 'success') {
            // Sonuçları göster
            gosterSonuclar(result.data);
            
            // Sonuçlar bölümüne scroll yap (sadece manuel hesaplamada)
            if (!otomatik) {
                document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
            }
        } else {
            throw new Error(result.message || 'Hesaplama hatası');
        }

    } catch (error) {
        console.error('Hesaplama hatası:', error);
        // Hata mesajını sadece manuel hesaplamada göster
        if (!otomatik) {      
            alert(
                `Hata: ${error.message}\n\nBackend API adresini ayarlamadıysanız, tarayıcı konsolunda veya HTML öncesinde window.__YKS_API_BASE__ tanımlayın; sunucunuzda POST /yks/calculate ve GET /yks/health uçlarının açık olduğundan emin olun.`
            );
        }
    } finally {
        // Butonu tekrar aktif et (sadece manuel hesaplamada)
        if (!otomatik) {
            calculateBtn.disabled = false;
            calculateBtn.innerHTML = originalText;
        }
    }
}

// Sonuçları göster
function gosterSonuclar(sonuclar) {
    const resultsSection = document.getElementById('resultsSection');
    const resultsContainer = document.getElementById('resultsContainer');

    if (!resultsSection || !resultsContainer) return;

    // Sonuçlar bölümünü göster
    resultsSection.style.display = 'block';

    // HTML oluştur
    let html = '';

    // Yıllara göre sonuçları göster
    const yillar = [2025, 2024, 2023, 2022];
    yillar.forEach(yil => {
        if (!sonuclar[yil]) return;

        html += '<div class="year-result">';
        html += `<h3 class="year-title"><i class="fas fa-chart-line"></i> ${yil} YKS Puanları ve Sıralamaları</h3>`;
        html += '<div class="table-wrapper">';
        html += '<table class="results-table">';
        html += '<thead><tr>';
        html += '<th>Puan Türü</th>';
        html += '<th>Ham Puan</th>';
        html += '<th>Ham P. Sıralama</th>';
        html += '<th>Yerleştirme Puanı</th>';
        html += '<th>Yer. Sıralama</th>';
        html += '</tr></thead>';
        html += '<tbody>';

        const puanTurleri = ['TYT', 'SÖZ', 'EA', 'SAY', 'DİL'];
        const puanTurleriAd = {
            'TYT': 'TYT',
            'SAY': 'Sayısal',
            'SÖZ': 'Sözel',
            'EA': 'Eşit Ağırlık',
            'DİL': 'Dil'
        };

        puanTurleri.forEach(tur => {
            if (sonuclar[yil][tur]) {
                const veri = sonuclar[yil][tur];
                html += '<tr>';
                html += `<td>${puanTurleriAd[tur]}</td>`;
                html += `<td>${veri['Ham Puan'] !== null ? veri['Ham Puan'].toFixed(3) : '-'}</td>`;
                html += `<td>${veri['Ham P. Sıralama'] !== null ? veri['Ham P. Sıralama'].toLocaleString('tr-TR') : '-'}</td>`;
                html += `<td>${veri['Yer. Puanı'] !== null ? veri['Yer. Puanı'].toFixed(3) : '-'}</td>`;
                html += `<td>${veri['Yer. Sıralama'] !== null ? veri['Yer. Sıralama'].toLocaleString('tr-TR') : '-'}</td>`;
                html += '</tr>';
            }
        });

        html += '</tbody></table></div></div>';
    });

    // Ek bilgilendirme
    html += '<div class="info-box" style="margin-top: 2rem;">';
    html += '<p><strong>Bilgilendirme:</strong> Bu sonuçlar gerçek ÖSYM katsayıları ve yığılma verileri kullanılarak hesaplanmıştır.</p>';
    html += '</div>';

    resultsContainer.innerHTML = html;
}

// API sağlık kontrolü (taban URL tanımlıysa)
async function checkAPIHealth() {
    if (!API_URL) {
        console.info('ℹ️ API tabanı yok (portfolio). Hesaplama için window.__YKS_API_BASE__ ayarlayın.');
        return false;
    }
    try {
        const response = await fetch(`${API_URL}/yks/health`);
        if (response.ok) {
            console.log('✅ Backend API bağlantısı başarılı');
            return true;
        }
    } catch (error) {
        console.warn('⚠️ Backend API\'ye bağlanılamıyor.');
        return false;
    }
}

// Sayfa yüklendiğinde başlat
window.addEventListener('load', function() {
    console.log('🎓 YKS Puan Hesaplama Sistemi yüklendi.');
    console.log('📊 Backend API: ' + API_URL);
    
    // API sağlık kontrolü
    checkAPIHealth();
});
