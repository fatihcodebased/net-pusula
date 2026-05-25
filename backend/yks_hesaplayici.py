"""YKS puan ve sıralama hesaplama — Excel katsayı ve yığılma verileri."""

from __future__ import annotations

import re
import unicodedata
from pathlib import Path
from typing import Any

import pandas as pd

YEARS = (2022, 2023, 2024, 2025)
OBP_KATSAYI = 0.12

KATSAYI_FILES = {
    "TYT": "TYT_Puan_Katsayilari_2019_2025.xlsx",
    "SAY": "Sayisal_Puan_Katsayilari_2019_2025.xlsx",
    "EA": "Esit_Agirlik_Puan_Katsayilari_2019_2025.xlsx",
    "SÖZ": "sozel_puan_katsayilari_2019_2025.xlsx",
    "DİL": "Dil_Puan_Katsayilari_2020_2025.xlsx",
}

YIGILMA_YER = {
    2022: "2022.xlsx",
    2023: "2023.xlsx",
    2024: "2024.xlsx",
    2025: "2025 Yigilma.xlsx",
}

YIGILMA_HAM = {
    2022: "2022_YKS_Yiginsal_Dagilim_ham_Tablo.xlsx",
    2023: "2023_YKS_Yiginsal_Dagilim_ham_Tablo.xlsx",
    2024: "2024_YKS_Yiginsal_Dagilim_ham_Tablo.xlsx",
    2025: "2025_YKS_Yiginsal_Dagilim_ham_Tablo.xlsx",
}

PUAN_TURU_COL = {
    "TYT": ("TYT", "TYT"),
    "SAY": ("SAYISAL", "Sayısal"),
    "SÖZ": ("SÖZEL", "Sözel"),
    "EA": ("EŞİT AĞIRLIK", "Eşit Ağırlık", "EŞIT AĞIRLIK"),
    "DİL": ("DİL", "Dil"),
}

# Excel satır adı -> net anahtarı
DERS_NET_MAP = {
    "turkce": ["türkçe", "turkce"],
    "sosyal": ["sosyal bilimler"],
    "tyt_matematik": ["temel matematik"],
    "matematik": ["matematik"],
    "fen": ["fen bilimleri"],
    "edebiyat": ["edebiyat", "türk dili ve edebiyatı"],
    "tarih1": ["tarih-1", "tarih 1"],
    "cografya1": ["coğrafya-1", "cografya-1", "coğrafya 1"],
    "tarih2": ["tarih-2", "tarih 2"],
    "cografya2": ["coğrafya-2", "cografya-2", "coğrafya 2"],
    "felsefe": ["felsefe grubu", "felsefe"],
    "din": ["dkab", "din kültürü", "ilave felsefe"],
    "fizik": ["fizik"],
    "kimya": ["kimya"],
    "biyoloji": ["biyoloji"],
    "ydt": ["yabancı dil", "yabanci dil"],
}

TYT_NET_KEYS = ("turkce", "sosyal", "tyt_matematik", "fen")
SAY_AYT_KEYS = ("matematik", "fizik", "kimya", "biyoloji")
EA_AYT_KEYS = ("matematik", "edebiyat", "tarih1", "cografya1")
SOZ_AYT_KEYS = ("edebiyat", "tarih1", "cografya1", "tarih2", "cografya2", "felsefe", "din")
DIL_AYT_KEYS = ("ydt",)

PUAN_TURU_NETS = {
    "TYT": TYT_NET_KEYS,
    "SAY": TYT_NET_KEYS + SAY_AYT_KEYS,
    "EA": TYT_NET_KEYS + EA_AYT_KEYS,
    "SÖZ": TYT_NET_KEYS + SOZ_AYT_KEYS,
    "DİL": TYT_NET_KEYS + DIL_AYT_KEYS,
}


def _norm(text: str) -> str:
    text = unicodedata.normalize("NFKD", str(text))
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def _net(dogru: int, yanlis: int) -> float:
    return max(0.0, float(dogru) - 0.25 * float(yanlis))


def _collect_nets(tyt: dict, ayt: dict) -> dict[str, float]:
    nets: dict[str, float] = {}
    tyt_alias = {"matematik": "tyt_matematik"}
    for key, block in tyt.items():
        if isinstance(block, dict):
            nk = tyt_alias.get(key, key)
            nets[nk] = _net(block.get("dogru", 0), block.get("yanlis", 0))
    for key, block in ayt.items():
        if isinstance(block, dict):
            nets[key] = _net(block.get("dogru", 0), block.get("yanlis", 0))
    return nets


def _match_ders_key(ders_adi: str) -> str | None:
    n = _norm(ders_adi)
    if n.startswith("baslang") or "puani" in n:
        return None
    if "temelmatematik" in n:
        return "tyt_matematik"
    for net_key, patterns in DERS_NET_MAP.items():
        if net_key == "tyt_matematik":
            continue
        for p in patterns:
            if _norm(p) in n or n in _norm(p):
                return net_key
    return None


class YKSHesaplayici:
    def __init__(self, base_path: str | Path) -> None:
        self.base_path = Path(base_path)
        self._katsayilar: dict[str, pd.DataFrame] = {}
        self._yigilma_yer: dict[int, pd.DataFrame] = {}
        self._yigilma_ham: dict[int, pd.DataFrame] = {}
        self._load()

    def _load(self) -> None:
        for tur, fname in KATSAYI_FILES.items():
            path = self.base_path / fname
            if not path.exists():
                raise FileNotFoundError(f"Eksik veri dosyası: {path}")
            self._katsayilar[tur] = pd.read_excel(path)

        for year, fname in YIGILMA_YER.items():
            self._yigilma_yer[year] = pd.read_excel(self.base_path / fname)

        for year, fname in YIGILMA_HAM.items():
            self._yigilma_ham[year] = pd.read_excel(self.base_path / fname)

    def _coef_table(self, puan_turu: str) -> dict[str, dict[int, float]]:
        df = self._katsayilar[puan_turu]
        ders_col = df.columns[0]
        table: dict[str, dict[int, float]] = {}
        base: dict[int, float] = {}

        for _, row in df.iterrows():
            ders = str(row[ders_col]).strip()
            n = _norm(ders)
            if n.startswith("baslang") or "puani" in n:
                for col in df.columns[1:]:
                    y = self._parse_year_col(col)
                    if y:
                        base[y] = float(row[col])
                continue
            key = _match_ders_key(ders)
            if not key:
                continue
            table[key] = {}
            for col in df.columns[1:]:
                y = self._parse_year_col(col)
                if y:
                    table[key][y] = float(row[col])

        table["__base__"] = base
        return table

    @staticmethod
    def _parse_year_col(col: Any) -> int | None:
        try:
            y = int(float(col))
            if 2019 <= y <= 2030:
                return y
        except (TypeError, ValueError):
            pass
        return None

    def _ham_puan(self, puan_turu: str, year: int, nets: dict[str, float]) -> float | None:
        table = self._coef_table(puan_turu)
        base = table.get("__base__", {}).get(year)
        if base is None:
            return None

        keys = PUAN_TURU_NETS[puan_turu]
        total = base
        for key in keys:
            net = nets.get(key, 0.0)
            coef = table.get(key, {}).get(year)
            if coef is not None:
                total += net * coef
        return round(total, 3)

    def _yer_puan(self, ham: float | None, diploma: float) -> float | None:
        if ham is None:
            return None
        obp = max(0.0, min(100.0, diploma)) * 5.0
        return round(ham + obp * OBP_KATSAYI, 3)

    def _find_col(self, df: pd.DataFrame, aliases: tuple[str, ...]) -> str | None:
        for col in df.columns:
            cn = _norm(str(col))
            for alias in aliases:
                if _norm(alias) == cn:
                    return col
        return None

    def _siralama(self, puan: float | None, df: pd.DataFrame, puan_turu: str) -> int | None:
        if puan is None or puan <= 0:
            return None
        aliases = PUAN_TURU_COL.get(puan_turu, (puan_turu,))
        col = self._find_col(df, aliases)
        if not col or "min" not in df.columns:
            return None

        work = df.dropna(subset=["min"]).sort_values("min", ascending=False)
        for _, row in work.iterrows():
            try:
                threshold = float(row["min"])
            except (TypeError, ValueError):
                continue
            if puan >= threshold:
                val = row[col]
                if pd.notna(val):
                    return int(val)
        return None

    def hesapla(self, obp: float, tyt: dict, ayt: dict) -> dict[int, dict[str, dict[str, Any]]]:
        nets = _collect_nets(tyt, ayt)
        diploma = float(obp)
        sonuc: dict[int, dict[str, dict[str, Any]]] = {}

        for year in YEARS:
            yil_veri: dict[str, dict[str, Any]] = {}
            for tur in ("TYT", "SAY", "SÖZ", "EA", "DİL"):
                ham = self._ham_puan(tur, year, nets)
                yer = self._yer_puan(ham, diploma)
                ham_sr = self._siralama(ham, self._yigilma_ham[year], tur)
                yer_sr = self._siralama(yer, self._yigilma_yer[year], tur)
                yil_veri[tur] = {
                    "Ham Puan": ham,
                    "Ham P. Sıralama": ham_sr,
                    "Yer. Puanı": yer,
                    "Yer. Sıralama": yer_sr,
                }
            sonuc[year] = yil_veri

        return sonuc
