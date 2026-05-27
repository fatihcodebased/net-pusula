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

function text(value) {
    return value === null || value === undefined || value === '' ? '-' : String(value);
}

function number(value, fraction = 0) {
    if (value === null || value === undefined || value === '') return '-';
    return Number(value).toLocaleString('tr-TR', {
        minimumFractionDigits: fraction,
        maximumFractionDigits: fraction,
    });
}

function score(value) {
    if (value === null || value === undefined || value === '') return '-';
    return Number(value).toLocaleString('tr-TR', {
        minimumFractionDigits: 3,
        maximumFractionDigits: 5,
    });
}

function normalize(value) {
    return String(value || '').toLocaleLowerCase('tr-TR');
}

function hasValue(value) {
    return value !== null && value !== undefined && value !== '';
}

async function loadYear(year) {
    state.year = Number(year);
    state.page = 1;
    els.status.textContent = 'Veri yükleniyor...';
    els.tableBody.innerHTML = '';

    try {
        const response = await fetch(`data/taban-puanlari/${state.year}.json`);
        if (!response.ok) throw new Error(`${state.year} verisi yüklenemedi.`);
        const payload = await response.json();
        state.rows = Array.isArray(payload.programs) ? payload.programs : [];
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
    return [...new Set(state.rows.map((row) => row[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'tr-TR'));
}

function fillSelect(select, values, label) {
    const previous = select.value;
    select.innerHTML = `<option value="">${label}</option>` + values.map((value) => `<option value="${String(value).replaceAll('"', '&quot;')}">${value}</option>`).join('');
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
        const haystack = normalize([row.program_kodu, row.universite, row.fakulte, row.bolum].filter(Boolean).join(' '));
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
        const aMissing = !hasValue(av);
        const bMissing = !hasValue(bv);

        if (aMissing && bMissing) return 0;
        if (aMissing) return 1;
        if (bMissing) return -1;

        if (textKeys.has(key)) {
            return String(av).localeCompare(String(bv), 'tr-TR') * direction;
        }

        return (Number(av) - Number(bv)) * direction;
    });
}

function updateStats() {
    const scores = state.filtered.map((row) => row.taban_puan).filter(hasValue).map(Number);
    const ranks = state.filtered.map((row) => row.taban_siralama).filter(hasValue).map(Number);

    els.totalCount.textContent = number(state.rows.length);
    els.filteredCount.textContent = number(state.filtered.length);
    els.topScore.textContent = scores.length ? score(Math.max(...scores)) : '-';
    els.bestRank.textContent = ranks.length ? number(Math.min(...ranks)) : '-';
}

function render() {
    const totalPages = Math.max(1, Math.ceil(state.filtered.length / state.pageSize));
    if (state.page > totalPages) state.page = totalPages;

    const start = (state.page - 1) * state.pageSize;
    const rows = state.filtered.slice(start, start + state.pageSize);

    els.summary.textContent = `${state.filtered.length.toLocaleString('tr-TR')} program listeleniyor. Sayfa ${state.page}/${totalPages}.`;
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
    els.tableBody.innerHTML = rows.map((row) => `
        <tr>
            <td class="numeric">${text(row.program_kodu)}</td>
            <td>${text(row.universite)}</td>
            <td>${text(row.bolum)}</td>
            <td>${text(row.fakulte)}</td>
            <td>${text(row.sehir)}</td>
            <td>${text(row.universite_turu)}</td>
            <td class="numeric">${text(row.puan_turu)}</td>
            <td class="numeric">${number(row.kontenjan)}</td>
            <td class="numeric">${number(row.yerlesen)}</td>
            <td class="numeric">${score(row.taban_puan)}</td>
            <td class="numeric">${score(row.tavan_puan)}</td>
            <td class="numeric">${number(row.taban_siralama)}</td>
        </tr>
    `).join('');
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

    bind();
    loadYear(els.year.value);
});
