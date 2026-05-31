const DATA_VERSION = '20260531b';

const state = {
    year: 2025,
    rows: [],
    filtered: [],
    page: 1,
    pageSize: 50,
    sortBy: 'taban_siralama',
    sortDirection: 'asc',
};

const els = {};

/** Canonical field → olası ham JSON / CSV anahtarları */
const FIELD_ALIASES = {
    program_kodu: ['program_kodu', 'program_kod', 'program_code', 'kod', 'id'],
    universite: ['universite', 'university_name', 'university'],
    fakulte: ['fakulte', 'faculty_name', 'faculty'],
    bolum: ['bolum', 'department_name', 'isim', 'department'],
    sehir: ['sehir', 'city', 'il'],
    universite_turu: ['universite_turu', 'university_type', 'unitur'],
    puan_turu: ['puan_turu', 'score_type', 'tur'],
    kontenjan: [
        'kontenjan', 'kontenjan2024', 'kontenjan2023', 'kontenjan2022',
        'kontenjan2021', 'kontenjan2020', 'total_quota',
    ],
    yerlesen: [
        'yerlesen', 'yerlesen2024', 'yerlesen2023', 'yerlesen2022',
        'yerlesen2021', 'yerlesme2024', 'yerlesme2023', 'total_enrolled',
    ],
    taban_puan: [
        'taban_puan', 'puan2024', 'puan2023', 'puan2022', 'puan2021', 'puan2020',
        'final_score_012', 'puan2019', 'puan2018',
    ],
    tavan_puan: [
        'tavan_puan', 'maxpuan2024', 'maxpuan2023', 'maxpuan2022', 'maxpuan2021',
        'maxpuan2020', 'final_score_018', 'maxpuan2019',
    ],
    taban_siralama: [
        'taban_siralama', 'sira2024', 'sira2023', 'sira2022', 'sira2021', 'sira2020',
        'final_rank_012', 'sira2019', 'basari_sirasi', 'basari_siralama',
    ],
};

const METRIC_ZERO_IS_EMPTY = new Set(['taban_puan', 'tavan_puan', 'taban_siralama']);

function text(value) {
    return value === null || value === undefined || value === '' ? '-' : String(value);
}

function coerceNumber(value) {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : null;
    }
    const normalized = String(value).trim().replace(/\s/g, '').replace(',', '.');
    if (!normalized || normalized === '-' || normalized === '—') return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

function hasValue(value) {
    return value !== null && value !== undefined && value !== '';
}

function isMeaningfulMetric(field, value) {
    const numeric = coerceNumber(value);
    if (numeric === null) return false;
    if (METRIC_ZERO_IS_EMPTY.has(field) && numeric === 0) return false;
    return true;
}

function pickField(row, aliases, { allowZero = false } = {}) {
    for (const key of aliases) {
        if (!Object.prototype.hasOwnProperty.call(row, key)) continue;
        const raw = row[key];
        if (raw === null || raw === undefined || raw === '') continue;
        const numeric = coerceNumber(raw);
        if (numeric !== null) {
            if (!allowZero && numeric === 0) continue;
            return numeric;
        }
        if (typeof raw === 'string' && raw.trim()) return raw.trim();
    }
    return null;
}

function normalizeProgram(row) {
    if (!row || typeof row !== 'object') return row;

    const normalized = { ...row };

    for (const [canonical, aliases] of Object.entries(FIELD_ALIASES)) {
        const allowZero = canonical === 'yerlesen' || canonical === 'kontenjan';
        const picked = pickField(row, aliases, { allowZero });
        if (picked !== null && picked !== undefined) {
            normalized[canonical] = picked;
        }
    }

    for (const key of ['kontenjan', 'yerlesen', 'taban_puan', 'tavan_puan', 'taban_siralama']) {
        if (!hasValue(normalized[key])) continue;
        const numeric = coerceNumber(normalized[key]);
        if (numeric !== null) normalized[key] = numeric;
    }

    return normalized;
}

function extractPrograms(payload) {
    if (Array.isArray(payload)) return payload.map(normalizeProgram);
    if (payload && Array.isArray(payload.programs)) return payload.programs.map(normalizeProgram);
    if (payload && Array.isArray(payload.data)) return payload.data.map(normalizeProgram);
    if (payload && Array.isArray(payload.records)) return payload.records.map(normalizeProgram);
    return [];
}

function number(value, fraction = 0) {
    const numeric = coerceNumber(value);
    if (numeric === null) return '-';
    return numeric.toLocaleString('tr-TR', {
        minimumFractionDigits: fraction,
        maximumFractionDigits: fraction,
    });
}

function score(value) {
    const numeric = coerceNumber(value);
    if (numeric === null || numeric === 0) return '-';
    return numeric.toLocaleString('tr-TR', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 5,
    });
}

function formatMetric(field, value) {
    if (!isMeaningfulMetric(field, value)) return '-';
    if (field === 'taban_puan' || field === 'tavan_puan') return score(value);
    return number(value);
}

function normalize(value) {
    return String(value || '').toLocaleLowerCase('tr-TR');
}

function updateYearNotice() {
    if (!els.yearNotice) return;
    const show = state.year === 2025;
    els.yearNotice.hidden = !show;
    els.yearNotice.classList.toggle('is-visible', show);
}

async function loadYear(year) {
    state.year = Number(year);
    state.page = 1;
    updateYearNotice();
    els.status.textContent = 'Veri yükleniyor...';
    els.tableBody.innerHTML = '';

    try {
        const response = await fetch(`data/taban-puanlari/${state.year}.json?v=${DATA_VERSION}`);
        if (!response.ok) throw new Error(`${state.year} verisi yüklenemedi.`);
        const payload = await response.json();
        state.rows = extractPrograms(payload);
        if (!state.rows.length) {
            throw new Error(`${state.year} için program listesi bulunamadı.`);
        }
        fillDynamicFilters();
        applyFilters();
    } catch (error) {
        state.rows = [];
        state.filtered = [];
        els.status.textContent = error.message;
        render();
    }
}

function uniqueValues(key) {
    return [...new Set(state.rows.map((row) => row[key]).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b), 'tr-TR'));
}

function fillSelect(select, values, label) {
    const previous = select.value;
    select.innerHTML = `<option value="">${label}</option>`
        + values.map((value) => {
            const safe = String(value).replaceAll('"', '&quot;');
            return `<option value="${safe}">${value}</option>`;
        }).join('');
    if (values.includes(previous)) select.value = previous;
}

function fillDynamicFilters() {
    fillSelect(els.city, uniqueValues('sehir'), 'Tüm şehirler');
    fillSelect(els.uniType, uniqueValues('universite_turu'), 'Tüm üniversite türleri');
}

function applyFilters() {
    const query = normalize(els.search.value);
    const scoreType = els.scoreType.value;
    const city = els.city.value;
    const uniType = els.uniType.value;
    state.sortBy = els.sortBy.value;
    state.sortDirection = els.sortDirection.value;

    state.filtered = state.rows.filter((row) => {
        const haystack = normalize([
            row.program_kodu,
            row.universite,
            row.fakulte,
            row.bolum,
        ].filter(Boolean).join(' '));
        return (!query || haystack.includes(query))
            && (!scoreType || row.puan_turu === scoreType)
            && (!city || row.sehir === city)
            && (!uniType || row.universite_turu === uniType);
    });

    sortRows();
    state.page = 1;
    render();
}

function sortRows() {
    const key = state.sortBy;
    const direction = state.sortDirection === 'desc' ? -1 : 1;
    const textKeys = new Set(['universite', 'bolum']);

    state.filtered.sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        const aMissing = !isMeaningfulMetric(key, av) && !textKeys.has(key);
        const bMissing = !isMeaningfulMetric(key, bv) && !textKeys.has(key);

        if (textKeys.has(key)) {
            const aText = hasValue(av) ? String(av) : '';
            const bText = hasValue(bv) ? String(bv) : '';
            if (!aText && !bText) return 0;
            if (!aText) return 1;
            if (!bText) return -1;
            return aText.localeCompare(bText, 'tr-TR') * direction;
        }

        if (aMissing && bMissing) return 0;
        if (aMissing) return 1;
        if (bMissing) return -1;

        return (coerceNumber(av) - coerceNumber(bv)) * direction;
    });
}

function updateStats() {
    const scores = state.filtered
        .map((row) => row.taban_puan)
        .filter((value) => isMeaningfulMetric('taban_puan', value))
        .map(coerceNumber);
    const ranks = state.filtered
        .map((row) => row.taban_siralama)
        .filter((value) => isMeaningfulMetric('taban_siralama', value))
        .map(coerceNumber);

    els.totalCount.textContent = number(state.rows.length);
    els.filteredCount.textContent = number(state.filtered.length);
    els.topScore.textContent = scores.length ? score(Math.max(...scores)) : '-';
    els.bestRank.textContent = ranks.length ? number(Math.min(...ranks)) : '-';
}

function renderRow(row) {
    return `
        <tr>
            <td class="numeric" data-label="Kod">${text(row.program_kodu)}</td>
            <td data-label="Üniversite">${text(row.universite)}</td>
            <td data-label="Bölüm">${text(row.bolum)}</td>
            <td data-label="Fakülte">${text(row.fakulte)}</td>
            <td data-label="Şehir">${text(row.sehir)}</td>
            <td data-label="Tür">${text(row.universite_turu)}</td>
            <td class="numeric" data-label="Puan">${text(row.puan_turu)}</td>
            <td class="numeric" data-label="Kont.">${formatMetric('kontenjan', row.kontenjan)}</td>
            <td class="numeric" data-label="Yer.">${formatMetric('yerlesen', row.yerlesen)}</td>
            <td class="numeric col-highlight" data-label="Taban Puan">${formatMetric('taban_puan', row.taban_puan)}</td>
            <td class="numeric" data-label="Tavan Puan">${formatMetric('tavan_puan', row.tavan_puan)}</td>
            <td class="numeric col-highlight" data-label="Başarı Sırası">${formatMetric('taban_siralama', row.taban_siralama)}</td>
        </tr>
    `;
}

function render() {
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;

    const start = (state.page - 1) * state.pageSize;
    const rows = state.filtered.slice(start, start + state.pageSize);

    els.summary.textContent = `${state.filtered.length.toLocaleString('tr-TR')} program listeleniyor · ${state.year} · Sayfa ${state.page}/${totalPages}`;
    els.prev.disabled = state.page <= 1;
    els.next.disabled = state.page >= totalPages;
    updateStats();

    if (!rows.length) {
        els.tableBody.innerHTML = '';
        els.status.textContent = state.rows.length ? 'Filtrelere uygun program bulunamadı.' : 'Veri yok.';
        els.status.style.display = 'block';
        return;
    }

    els.status.style.display = 'none';
    els.tableBody.innerHTML = rows.map(renderRow).join('');
    if (typeof els.updateScrollHint === 'function') {
        requestAnimationFrame(els.updateScrollHint);
    }
}

function resetFilters() {
    els.search.value = '';
    els.scoreType.value = '';
    els.city.value = '';
    els.uniType.value = '';
    els.sortBy.value = 'taban_siralama';
    els.sortDirection.value = 'asc';
    applyFilters();
}

function bind() {
    els.year.addEventListener('change', (event) => loadYear(event.target.value));
    els.search.addEventListener('input', applyFilters);
    els.scoreType.addEventListener('change', applyFilters);
    els.city.addEventListener('change', applyFilters);
    els.uniType.addEventListener('change', applyFilters);
    els.sortBy.addEventListener('change', applyFilters);
    els.sortDirection.addEventListener('change', applyFilters);
    els.reset.addEventListener('click', resetFilters);
    els.prev.addEventListener('click', () => {
        state.page -= 1;
        render();
    });
    els.next.addEventListener('click', () => {
        state.page += 1;
        render();
    });
}

window.addEventListener('DOMContentLoaded', () => {
    els.year = document.getElementById('tabanYear');
    els.search = document.getElementById('tabanSearch');
    els.scoreType = document.getElementById('tabanScoreType');
    els.city = document.getElementById('tabanCity');
    els.uniType = document.getElementById('tabanUniType');
    els.sortBy = document.getElementById('tabanSortBy');
    els.sortDirection = document.getElementById('tabanSortDirection');
    els.reset = document.getElementById('tabanReset');
    els.prev = document.getElementById('tabanPrev');
    els.next = document.getElementById('tabanNext');
    els.summary = document.getElementById('tabanSummary');
    els.status = document.getElementById('tabanStatus');
    els.tableBody = document.getElementById('tabanTableBody');
    els.totalCount = document.getElementById('tabanTotalCount');
    els.filteredCount = document.getElementById('tabanFilteredCount');
    els.topScore = document.getElementById('tabanTopScore');
    els.bestRank = document.getElementById('tabanBestRank');
    els.yearNotice = document.getElementById('tabanYearNotice');

    const tableScroll = document.getElementById('tabanTableScroll');
    const tableWrap = document.getElementById('tabanTableWrap');

    els.updateScrollHint = () => {
        if (!tableScroll || !tableWrap) return;
        tableScroll.classList.toggle('is-scrollable', tableWrap.scrollWidth > tableWrap.clientWidth + 8);
    };

    window.addEventListener('resize', els.updateScrollHint);
    if (tableWrap) {
        tableWrap.addEventListener('scroll', els.updateScrollHint, { passive: true });
    }

    bind();
    loadYear(els.year.value);
});
