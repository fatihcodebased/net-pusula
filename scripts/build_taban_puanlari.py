from __future__ import annotations

import csv
import json
import math
import os
import zipfile
from collections import defaultdict
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "data" / "taban-puanlari"
ARCHIVE_ZIP = Path(os.environ.get("TABAN_ARCHIVE_ZIP", r"C:\Users\Fatih SALMAN\Downloads\archive.zip"))
YOKATLAS_2025_ZIP = Path(os.environ.get("YOKATLAS_2025_ZIP", r"C:\Users\Fatih SALMAN\Downloads\yokatlas-dataset-2025-main.zip"))
ENCODING = "utf-8-sig"

YEARS = list(range(2019, 2026))


def clean_text(value: Any) -> str | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text.lower() in {"nan", "none", "null"}:
        return None
    if any(marker in text for marker in ("Ã", "Ä", "Å", "Â")):
        try:
            repaired = text.encode("latin1").decode("utf-8")
            if "�" not in repaired:
                text = repaired
        except UnicodeError:
            pass
    return text


def to_int(value: Any) -> int | None:
    text = clean_text(value)
    if text is None:
        return None
    try:
        number = float(text.replace(",", "."))
    except ValueError:
        return None
    if math.isnan(number) or number < 0:
        return None
    return int(number)


def to_float(value: Any) -> float | None:
    text = clean_text(value)
    if text is None:
        return None
    try:
        number = float(text.replace(",", "."))
    except ValueError:
        return None
    if math.isnan(number) or number < 0:
        return None
    return round(number, 5)


def normalize_score_type(value: Any) -> str | None:
    text = clean_text(value)
    if text is None:
        return None
    mapping = {
        "SAYISAL": "SAY",
        "EŞİT AĞIRLIK": "EA",
        "SÖZEL": "SÖZ",
        "DİL": "DİL",
    }
    return mapping.get(text.upper(), text.upper())


def normalize_uni_type(value: Any) -> str | None:
    text = clean_text(value)
    if text is None:
        return None
    text = text.strip()
    mapping = {
        "devlet": "Devlet",
        "vakif": "Vakıf",
        "kktc": "KKTC",
        "yurt_disi": "Yurt Dışı",
        "DEVLET": "Devlet",
        "VAKIF": "Vakıf",
        "KKTC": "KKTC",
        "YURT DIŞI": "Yurt Dışı",
    }
    return mapping.get(text, text.title())


def read_zip_csv(zip_path: Path, member_name: str) -> list[dict[str, str]]:
    with zipfile.ZipFile(zip_path) as archive:
        with archive.open(member_name) as file:
            text = file.read().decode(ENCODING, errors="replace")
    return list(csv.DictReader(text.splitlines()))


def base_record(year: int, source: str) -> dict[str, Any]:
    return {
        "yil": year,
        "kaynak": source,
        "program_kodu": None,
        "universite": None,
        "fakulte": None,
        "bolum": None,
        "sehir": None,
        "universite_turu": None,
        "puan_turu": None,
        "ogretim_suresi": None,
        "ogretim_turu": None,
        "burs": None,
        "onlisans": None,
        "kontenjan": None,
        "okul_birincisi_kontenjan": None,
        "yerlesen": None,
        "okul_birincisi_yerlesen": None,
        "taban_puan": None,
        "tavan_puan": None,
        "taban_siralama": None,
        "tavan_siralama": None,
        "etiketler": None,
    }


def build_2019_2024() -> dict[int, list[dict[str, Any]]]:
    rows = read_zip_csv(ARCHIVE_ZIP, "01_university_admissions_turkey_2019_2024.csv")
    grouped: dict[int, list[dict[str, Any]]] = defaultdict(list)

    for row in rows:
        year = to_int(row.get("year"))
        if year not in range(2019, 2025):
            continue

        record = base_record(year, "archive.zip / 01_university_admissions_turkey_2019_2024.csv")
        record.update(
            {
                "program_kodu": clean_text(row.get("program_code")),
                "universite": clean_text(row.get("university_name")),
                "fakulte": clean_text(row.get("faculty_name")),
                "bolum": clean_text(row.get("department_name")),
                "sehir": clean_text(row.get("city")),
                "universite_turu": normalize_uni_type(row.get("university_type")),
                "puan_turu": normalize_score_type(row.get("score_type")),
                "burs": clean_text(row.get("scholarship_type")),
                "onlisans": clean_text(row.get("is_undergraduate")) == "False",
                "kontenjan": to_int(row.get("total_quota")),
                "yerlesen": to_int(row.get("total_enrolled")),
                "taban_puan": to_float(row.get("final_score_012")),
                "taban_siralama": to_int(row.get("final_rank_012")),
                "etiketler": clean_text(row.get("all_tags")),
            }
        )
        grouped[year].append(record)

    return grouped


def build_2025() -> list[dict[str, Any]]:
    rows = read_zip_csv(YOKATLAS_2025_ZIP, "yokatlas-dataset-2025-main/tum_bolumler.csv")
    records: list[dict[str, Any]] = []

    for row in rows:
        record = base_record(2025, "yokatlas-dataset-2025-main.zip / tum_bolumler.csv")
        record.update(
            {
                "program_kodu": clean_text(row.get("id")),
                "universite": clean_text(row.get("universite")),
                "fakulte": clean_text(row.get("fakulte")),
                "bolum": clean_text(row.get("isim")),
                "sehir": clean_text(row.get("il")),
                "universite_turu": normalize_uni_type(row.get("unitur")),
                "puan_turu": normalize_score_type(row.get("tur")),
                "ogretim_suresi": to_int(row.get("sure")),
                "onlisans": clean_text(row.get("onlisans")) == "1",
                "kontenjan": to_int(row.get("kontenjan2024")),
                "okul_birincisi_kontenjan": to_int(row.get("birinci2024")),
                "yerlesen": to_int(row.get("yerlesen2024")),
                "okul_birincisi_yerlesen": to_int(row.get("birinciyerlesen2024")),
                "taban_puan": to_float(row.get("puan2024")),
                "tavan_puan": to_float(row.get("maxpuan2024")),
                "taban_siralama": to_int(row.get("sira2024")),
                "etiketler": clean_text(row.get("aciklama")),
            }
        )
        records.append(record)

    return records


def write_year(year: int, records: list[dict[str, Any]]) -> None:
    payload = {
        "yil": year,
        "son_guncelleme": "2026-05-27",
        "toplam_program": len(records),
        "not": "2025 dosyası YÖK Atlas veri setindeki en güncel yerleşmiş yıl alanlarından normalize edilmiştir.",
        "programs": records,
    }
    target = OUT_DIR / f"{year}.json"
    target.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


def main() -> None:
    if not ARCHIVE_ZIP.exists():
        raise FileNotFoundError(f"Bulunamadı: {ARCHIVE_ZIP}")
    if not YOKATLAS_2025_ZIP.exists():
        raise FileNotFoundError(f"Bulunamadı: {YOKATLAS_2025_ZIP}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    grouped = build_2019_2024()
    grouped[2025] = build_2025()

    index = []
    for year in YEARS:
        records = grouped.get(year, [])
        records.sort(key=lambda item: (item.get("universite") or "", item.get("bolum") or "", item.get("program_kodu") or ""))
        write_year(year, records)
        index.append({"yil": year, "dosya": f"data/taban-puanlari/{year}.json", "toplam_program": len(records)})

    (OUT_DIR / "index.json").write_text(json.dumps({"yillar": index}, ensure_ascii=False, indent=2), encoding="utf-8")
    print("Üretilen dosyalar:")
    for item in index:
        print(f"- {item['yil']}: {item['toplam_program']} program")


if __name__ == "__main__":
    main()
