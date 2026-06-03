const YKSEngine = (() => {
    const PUAN_TURU_NETS = {
        TYT: ['turkce', 'sosyal', 'tyt_matematik', 'fen'],
        SAY: ['turkce', 'sosyal', 'tyt_matematik', 'fen', 'matematik', 'fizik', 'kimya', 'biyoloji'],
        EA: ['turkce', 'sosyal', 'tyt_matematik', 'fen', 'matematik', 'edebiyat', 'tarih1', 'cografya1'],
        'SÖZ': ['turkce', 'sosyal', 'tyt_matematik', 'fen', 'edebiyat', 'tarih1', 'cografya1', 'tarih2', 'cografya2', 'felsefe', 'din'],
        'DİL': ['turkce', 'sosyal', 'tyt_matematik', 'fen', 'ydt'],
    };
    const OBP_KATSAYI = 0.12;
    const OBP_KATSAYI_YARIM = 0.06;
    const TUR_ORDER = ['TYT', 'SAY', 'SÖZ', 'EA', 'DİL'];
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    const round3 = (n) => Math.round(n * 1000) / 1000;
    const net = (dogru, yanlis) => Math.max(0, (Number(dogru) || 0) - 0.25 * (Number(yanlis) || 0));
    const collectNets = (tyt, ayt) => {
        const nets = {};
        const tytAlias = { matematik: 'tyt_matematik' };
        Object.entries(tyt || {}).forEach(([k, v]) => {
            if (!v || typeof v !== 'object') return;
            const key = tytAlias[k] || k;
            nets[key] = net(v.dogru, v.yanlis);
        });
        Object.entries(ayt || {}).forEach(([k, v]) => {
            if (!v || typeof v !== 'object') return;
            nets[k] = net(v.dogru, v.yanlis);
        });
        return nets;
    };
    const hamPuan = (puanTuru, year, nets, katsayilar) => {
        const table = katsayilar?.[puanTuru];
        const base = table?.__base__?.[String(year)] ?? table?.__base__?.[year];
        if (base == null) return null;
        let total = Number(base) || 0;
        const keys = PUAN_TURU_NETS[puanTuru] || [];
        keys.forEach((k) => {
            const coef = table?.[k]?.[String(year)] ?? table?.[k]?.[year];
            if (coef == null) return;
            total += (nets?.[k] || 0) * (Number(coef) || 0);
        });
        return round3(total);
    };
    const yerPuan = (ham, diploma, previousPlacement) => {
        if (ham == null) return null;
        const dip = clamp(Number(diploma) || 0, 0, 100);
        const obp = dip * 5;
        const katsayi = previousPlacement ? OBP_KATSAYI_YARIM : OBP_KATSAYI;
        return round3(Number(ham) + obp * katsayi);
    };
    const calculate = (input, katsayilar, options) => {
        const years = options?.years || [2025, 2024, 2023, 2022];
        const nets = collectNets(input?.tyt, input?.ayt);
        const diploma = input?.obp ?? input?.diploma ?? 0;
        const prev = Boolean(input?.previousPlacement);
        const out = {};
        years.forEach((year) => {
            const yil = {};
            TUR_ORDER.forEach((tur) => {
                const ham = hamPuan(tur, year, nets, katsayilar);
                const yer = yerPuan(ham, diploma, prev);
                yil[tur] = {
                    'Ham Puan': ham,
                    'Ham P. Sıralama': null,
                    'Yer. Puanı': yer,
                    'Yer. Sıralama': null,
                };
            });
            out[year] = yil;
        });
        return out;
    };
    return { net, collectNets, hamPuan, yerPuan, calculate };
})();
(() => {
    const root = typeof window !== 'undefined' ? window : globalThis;
    root.YKSEngine = YKSEngine;
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = YKSEngine;
    }
})();
