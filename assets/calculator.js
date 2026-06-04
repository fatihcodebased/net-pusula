/**
 * Net Pusula — YKS puan hesaplama (aynı origin API)
 */
const API_URL = '';

const TYT_TESTS = [
    { prefix: 'tyt_turk', max: 40, label: 'Türkçe' },
    { prefix: 'tyt_sos', max: 20, label: 'Sosyal Bilimler' },
    { prefix: 'tyt_mat', max: 40, label: 'Temel Matematik' },
    { prefix: 'tyt_fen', max: 20, label: 'Fen Bilimleri' },
];

const AYT_TESTS = [
    { prefix: 'ayt_ede', max: 24, label: 'Edebiyat' },
    { prefix: 'ayt_tar1', max: 10, label: 'Tarih 1' },
    { prefix: 'ayt_cog1', max: 6, label: 'Coğrafya 1' },
    { prefix: 'ayt_tar2', max: 11, label: 'Tarih 2' },
    { prefix: 'ayt_cog2', max: 11, label: 'Coğrafya 2' },
    { prefix: 'ayt_fel', max: 12, label: 'Felsefe' },
    { prefix: 'ayt_din', max: 6, label: 'Din / DKAB' },
    { prefix: 'ayt_mat', max: 40, label: 'Matematik' },
    { prefix: 'ayt_fiz', max: 14, label: 'Fizik' },
    { prefix: 'ayt_kim', max: 13, label: 'Kimya' },
    { prefix: 'ayt_bio', max: 13, label: 'Biyoloji' },
    { prefix: 'ayt_ydt', max: 80, label: 'YDT' },
];

let debounceTimer = null;
let hasCalculated = false;
let loadedFromSharedLink = false;
let katsayiPromise = null;

const STORAGE = {
    autoRecalc: 'np_autoRecalc',
    scrollResults: 'np_scrollResults',
    aytCollapsed: 'np_aytCollapsed',
};

const settings = {
    autoRecalc: true,
    scrollResults: true,
    aytCollapsed: false,
};

function loadSettings() {
    const read = (key, fallback) => {
        const v = localStorage.getItem(key);
        if (v === null) return fallback;
        return v === '1';
    };
    settings.autoRecalc = read(STORAGE.autoRecalc, true);
    settings.scrollResults = read(STORAGE.scrollResults, true);
    settings.aytCollapsed = read(STORAGE.aytCollapsed, false);
}

function saveSetting(key, value) {
    localStorage.setItem(key, value ? '1' : '0');
}

function applyAytCollapsed(collapsed) {
    const panel = document.getElementById('aytPanel');
    const btn = document.getElementById('aytToggleBtn');
    if (!panel) return;
    panel.classList.toggle('ayt-collapsed', collapsed);
    if (btn) btn.setAttribute('aria-expanded', String(!collapsed));
}

function resetAllInputs() {
    [...TYT_TESTS, ...AYT_TESTS].forEach((test) => {
        const d = document.getElementById(`${test.prefix}_d`);
        const y = document.getElementById(`${test.prefix}_y`);
        if (d) d.value = 0;
        if (y) y.value = 0;
        updateNet(test.prefix, test.max);
    });
    const obp = document.getElementById('obp');
    if (obp) obp.value = 85;
    const prev = document.getElementById('previousPlacement');
    if (prev) prev.checked = false;
    hasCalculated = false;
    const section = document.getElementById('resultsSection');
    if (section) section.classList.remove('visible');
    const container = document.getElementById('resultsContainer');
    if (container) container.innerHTML = '';
}

function hesaplaNet(dogru, yanlis) {
    return Math.max(0, dogru - 0.25 * yanlis);
}

function updateNet(prefix, maxSoru) {
    const dogruInput = document.getElementById(`${prefix}_d`);
    const yanlisInput = document.getElementById(`${prefix}_y`);
    const netDisplay = document.getElementById(`${prefix}_net`);
    if (!dogruInput || !yanlisInput || !netDisplay) return;

    let dogru = parseInt(dogruInput.value, 10) || 0;
    let yanlis = parseInt(yanlisInput.value, 10) || 0;

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
    netDisplay.textContent = hesaplaNet(dogru, yanlis).toFixed(2);
}

function bindTest(test) {
    const d = document.getElementById(`${test.prefix}_d`);
    const y = document.getElementById(`${test.prefix}_y`);
    if (!d || !y) return;
    const handler = () => {
        updateNet(test.prefix, test.max);
        if (hasCalculated) scheduleRecalc();
    };
    d.addEventListener('input', handler);
    y.addEventListener('input', handler);
}

function scheduleRecalc() {
    if (!settings.autoRecalc || !hasCalculated) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => hesaplaVeGoster(true), 700);
}

async function loadKatsayilar() {
    if (!katsayiPromise) {
        katsayiPromise = fetch('data/yks_katsayilar.json').then(async (r) => {
            if (!r.ok) {
                let msg = `Katsayı verisi alınamadı (${r.status})`;
                try {
                    const err = await r.json();
                    if (err?.detail) msg = String(err.detail);
                } catch (_) {}
                throw new Error(msg);
            }
            return r.json();
        });
    }
    return katsayiPromise;
}

function collectPayload() {
    const diploma = parseFloat(document.getElementById('obp').value) || 0;
    const previousPlacement = Boolean(document.getElementById('previousPlacement').checked);

    const block = (prefix) => ({
        dogru: parseInt(document.getElementById(`${prefix}_d`).value, 10) || 0,
        yanlis: parseInt(document.getElementById(`${prefix}_y`).value, 10) || 0,
    });

    return {
        obp: diploma,
        previousPlacement,
        tyt: {
            turkce: block('tyt_turk'),
            sosyal: block('tyt_sos'),
            matematik: block('tyt_mat'),
            fen: block('tyt_fen'),
        },
        ayt: {
            edebiyat: block('ayt_ede'),
            tarih1: block('ayt_tar1'),
            cografya1: block('ayt_cog1'),
            tarih2: block('ayt_tar2'),
            cografya2: block('ayt_cog2'),
            felsefe: block('ayt_fel'),
            din: block('ayt_din'),
            matematik: block('ayt_mat'),
            fizik: block('ayt_fiz'),
            kimya: block('ayt_kim'),
            biyoloji: block('ayt_bio'),
            ydt: block('ayt_ydt'),
        },
    };
}

function getFormStateForShare() {
    const tests = [...TYT_TESTS, ...AYT_TESTS];
    const state = {
        obp: parseFloat(document.getElementById('obp')?.value || '0') || 0,
        previousPlacement: document.getElementById('previousPlacement')?.checked ? '1' : '0',
    };
    tests.forEach((test) => {
        state[`${test.prefix}_d`] = parseInt(document.getElementById(`${test.prefix}_d`)?.value || '0', 10) || 0;
        state[`${test.prefix}_y`] = parseInt(document.getElementById(`${test.prefix}_y`)?.value || '0', 10) || 0;
    });
    return state;
}

function buildShareUrl() {
    const url = new URL(window.location.href);
    url.search = '';
    const params = new URLSearchParams();
    const state = getFormStateForShare();
    Object.entries(state).forEach(([key, value]) => params.set(key, String(value)));
    url.search = params.toString();
    return url.toString();
}

function showToast(message, ok = true) {
    const el = document.getElementById('globalToast');
    if (!el) return;
    el.textContent = message;
    el.className = `api-status show ${ok ? 'ok' : 'err'}`;
    window.clearTimeout(showToast._timer);
    showToast._timer = window.setTimeout(() => {
        el.classList.remove('show');
    }, 2600);
}

async function handleShareResult() {
    if (!hasCalculated) {
        showToast('Önce puan hesaplaması yapmalısın.', false);
        return;
    }
    const shareUrl = buildShareUrl();
    let copied = false;

    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(shareUrl);
            copied = true;
        }
    } catch (_) {
        copied = false;
    }

    try {
        if (navigator.share) {
            await navigator.share({
                title: 'Net Pusula YKS Sonuç Linki',
                text: 'YKS tahmin sonucuma buradan bakabilirsin:',
                url: shareUrl,
            });
        }
    } catch (_) {
        // User cancelled native share.
    }

    showToast(
        copied
            ? 'Sonuç linki kopyalandı, arkadaşlarına gönderebilirsin!'
            : 'Paylaşım linki hazır. Adres çubuğundan kopyalayabilirsin!',
        copied
    );
}

function readSharedParams() {
    const params = new URLSearchParams(window.location.search);
    if (!params.size) return false;

    const tests = [...TYT_TESTS, ...AYT_TESTS];
    let changed = false;
    tests.forEach((test) => {
        const dKey = `${test.prefix}_d`;
        const yKey = `${test.prefix}_y`;
        const dVal = params.get(dKey);
        const yVal = params.get(yKey);
        if (dVal !== null || yVal !== null) {
            const dInput = document.getElementById(dKey);
            const yInput = document.getElementById(yKey);
            if (dInput && yInput) {
                dInput.value = String(Math.max(0, Math.min(test.max, parseInt(dVal || '0', 10) || 0)));
                yInput.value = String(Math.max(0, Math.min(test.max, parseInt(yVal || '0', 10) || 0)));
                updateNet(test.prefix, test.max);
                changed = true;
            }
        }
    });

    const obpParam = params.get('obp');
    if (obpParam !== null) {
        const obpInput = document.getElementById('obp');
        if (obpInput) {
            obpInput.value = String(Math.max(0, Math.min(100, parseFloat(obpParam) || 0)));
            changed = true;
        }
    }

    const prevParam = params.get('previousPlacement');
    if (prevParam !== null) {
        const prev = document.getElementById('previousPlacement');
        if (prev) {
            prev.checked = prevParam === '1' || prevParam === 'true';
            changed = true;
        }
    }
    return changed;
}

async function hesaplaVeGoster(otomatik = false) {
    const btn = document.getElementById('calculateBtn');
    const originalHtml = btn.innerHTML;

    if (!otomatik) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Hesaplanıyor…';
    }

    try {
        const payload = collectPayload();
        let data = null;
        const apiPayload = { ...payload };
        delete apiPayload.previousPlacement;
        if (payload.previousPlacement) {
            apiPayload.obp = apiPayload.obp / 2;
        }

        try {
            const response = await fetch(`${API_URL}/yks/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiPayload),
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || `Sunucu hatası (${response.status})`);
            }

            const result = await response.json();
            if (result.status !== 'success') {
                throw new Error(result.message || 'Hesaplama başarısız');
            }
            data = result.data;
        } catch (apiErr) {
            if (window.YKSEngine?.calculate) {
                const katsayilar = await loadKatsayilar();
                data = window.YKSEngine.calculate(payload, katsayilar, { years: [2025, 2024, 2023, 2022] });
            } else {
                throw apiErr;
            }
        }
        hasCalculated = true;
        gosterSonuclar(data);

        if (!otomatik && settings.scrollResults) {
            document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    } catch (error) {
        console.error(error);
        if (!otomatik) {
            alert(`Hesaplama yapılamadı: ${error.message}\n\nSunucunun çalıştığından emin olun (README’deki komut).`);
        }
    } finally {
        if (!otomatik) {
            btn.disabled = false;
            btn.innerHTML = originalHtml;
        }
    }
}

function gosterSonuclar(sonuclar) {
    const section = document.getElementById('resultsSection');
    const container = document.getElementById('resultsContainer');
    section.classList.add('visible');
    const sharedNotice = document.getElementById('sharedResultNotice');
    if (sharedNotice) {
        sharedNotice.hidden = !loadedFromSharedLink;
    }

    const turAd = {
        TYT: 'TYT',
        SAY: 'Sayısal',
        'SÖZ': 'Sözel',
        EA: 'Eşit Ağırlık',
        'DİL': 'Dil',
    };
    const turler = ['TYT', 'SAY', 'SÖZ', 'EA', 'DİL'];
    const years = Object.keys(sonuclar || {})
        .map((x) => parseInt(x, 10))
        .filter((x) => Number.isFinite(x))
        .sort((a, b) => b - a);

    const storedYear = parseInt(localStorage.getItem('np_resultYear') || '', 10);
    const defaultYear = years.includes(storedYear) ? storedYear : years[0];
    const yearOptions = years.map((y) => `<option value="${y}" ${y === defaultYear ? 'selected' : ''}>${y}</option>`).join('');

    container.innerHTML = `
        <div class="results-topbar">
            <div class="results-year">
                <span class="results-year-label">Yıl</span>
                <select id="resultYearSelect" class="results-year-select">${yearOptions}</select>
            </div>
            <div class="results-subnote">Seçili yıla göre ham ve yerleştirme puanları</div>
        </div>
        <div id="scoreCards" class="score-grid"></div>
    `;

    const cardsEl = document.getElementById('scoreCards');
    const selectEl = document.getElementById('resultYearSelect');

    const renderYear = (year) => {
        const yilData = sonuclar?.[year];
        if (!yilData) {
            cardsEl.innerHTML = '';
            return;
        }

        cardsEl.innerHTML = turler
            .map((tur) => {
                const v = yilData?.[tur];
                const ham = v?.['Ham Puan'];
                const yer = v?.['Yer. Puanı'];
                return `
                    <div class="score-card">
                        <div class="score-card-head">
                            <div class="score-type">${turAd[tur] || tur}</div>
                            <div class="score-year">${year}</div>
                        </div>
                        <div class="score-values">
                            <div class="score-val score-val-primary">
                                <div class="score-val-label">Yer puanı</div>
                                <div class="score-val-num">${fmtPuan(yer)}</div>
                            </div>
                            <div class="score-val score-val-primary">
                                <div class="score-val-label">Ham puan</div>
                                <div class="score-val-num">${fmtPuan(ham)}</div>
                            </div>
                        </div>
                    </div>
                `;
            })
            .join('');
    };

    if (selectEl) {
        selectEl.addEventListener('change', () => {
            const y = parseInt(selectEl.value, 10);
            if (Number.isFinite(y)) {
                localStorage.setItem('np_resultYear', String(y));
                renderYear(y);
            }
        });
    }

    renderYear(defaultYear);
}

function fmtPuan(n) {
    return n != null && !Number.isNaN(n) ? Number(n).toFixed(3) : '—';
}

function fmtSira(n) {
    return n != null ? Number(n).toLocaleString('tr-TR') : '—';
}

function initSettingsUI() {
    loadSettings();

    const autoEl = document.getElementById('settingAutoRecalc');
    const scrollEl = document.getElementById('settingScrollResults');
    const aytEl = document.getElementById('settingAytCollapsed');

    if (autoEl) {
        autoEl.checked = settings.autoRecalc;
        autoEl.addEventListener('change', () => {
            settings.autoRecalc = autoEl.checked;
            saveSetting(STORAGE.autoRecalc, settings.autoRecalc);
        });
    }
    if (scrollEl) {
        scrollEl.checked = settings.scrollResults;
        scrollEl.addEventListener('change', () => {
            settings.scrollResults = scrollEl.checked;
            saveSetting(STORAGE.scrollResults, settings.scrollResults);
        });
    }
    if (aytEl) {
        aytEl.checked = settings.aytCollapsed;
        applyAytCollapsed(settings.aytCollapsed);
        aytEl.addEventListener('change', () => {
            settings.aytCollapsed = aytEl.checked;
            saveSetting(STORAGE.aytCollapsed, settings.aytCollapsed);
            applyAytCollapsed(settings.aytCollapsed);
        });
    }

    document.getElementById('aytToggleBtn')?.addEventListener('click', () => {
        settings.aytCollapsed = !settings.aytCollapsed;
        if (aytEl) aytEl.checked = settings.aytCollapsed;
        saveSetting(STORAGE.aytCollapsed, settings.aytCollapsed);
        applyAytCollapsed(settings.aytCollapsed);
    });

    document.getElementById('resetAllBtn')?.addEventListener('click', () => {
        if (confirm('Tüm netler ve sonuçlar sıfırlanacak. Emin misiniz?')) {
            resetAllInputs();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    [...TYT_TESTS, ...AYT_TESTS].forEach(bindTest);
    initSettingsUI();

    document.getElementById('obp')?.addEventListener('input', scheduleRecalc);
    document.getElementById('previousPlacement')?.addEventListener('change', scheduleRecalc);

    document.getElementById('calculateBtn')?.addEventListener('click', () => hesaplaVeGoster(false));
    document.getElementById('shareResultBtn')?.addEventListener('click', handleShareResult);

    loadedFromSharedLink = readSharedParams();
    if (loadedFromSharedLink) {
        hasCalculated = true;
        // Shared linkten gelen veride sonuçları doğrudan üret.
        hesaplaVeGoster(true);
    }
});
