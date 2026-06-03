import json
from pathlib import Path

import pandas as pd

import sys

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.yks_hesaplayici import KATSAYI_FILES, YKSHesaplayici, _match_ders_key, _norm


def build_table(df: pd.DataFrame) -> dict:
    ders_col = df.columns[0]
    table: dict[str, dict[int, float]] = {}
    base: dict[int, float] = {}

    for _, row in df.iterrows():
        ders = str(row[ders_col]).strip()
        n = _norm(ders)
        if n.startswith("baslang") or "puani" in n:
            for col in df.columns[1:]:
                y = YKSHesaplayici._parse_year_col(col)
                if y:
                    base[y] = float(row[col])
            continue

        key = _match_ders_key(ders)
        if not key:
            continue

        table[key] = {}
        for col in df.columns[1:]:
            y = YKSHesaplayici._parse_year_col(col)
            if y:
                table[key][y] = float(row[col])

    table["__base__"] = base
    return table


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    data_dir = root / "data"
    out_path = data_dir / "yks_katsayilar.json"

    out: dict[str, dict] = {}
    for tur, fname in KATSAYI_FILES.items():
        path = data_dir / fname
        df = pd.read_excel(path)
        out[tur] = build_table(df)

    out_path.write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")


if __name__ == "__main__":
    main()
