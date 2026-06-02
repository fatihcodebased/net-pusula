"""Net Pusula — FastAPI sunucusu (statik site + YKS API)."""

from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from backend.yks_hesaplayici import YKSHesaplayici

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"

app = FastAPI(title="Net Pusula API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_hesaplayici: YKSHesaplayici | None = None


def get_hesaplayici() -> YKSHesaplayici:
    global _hesaplayici
    if _hesaplayici is None:
        if not DATA_DIR.is_dir():
            raise RuntimeError(f"Veri klasörü bulunamadı: {DATA_DIR}")
        _hesaplayici = YKSHesaplayici(DATA_DIR)
    return _hesaplayici


class TestBlock(BaseModel):
    dogru: int = 0
    yanlis: int = 0


class TytInput(BaseModel):
    turkce: TestBlock = Field(default_factory=TestBlock)
    sosyal: TestBlock = Field(default_factory=TestBlock)
    matematik: TestBlock = Field(default_factory=TestBlock)
    fen: TestBlock = Field(default_factory=TestBlock)


class AytInput(BaseModel):
    edebiyat: TestBlock = Field(default_factory=TestBlock)
    tarih1: TestBlock = Field(default_factory=TestBlock)
    cografya1: TestBlock = Field(default_factory=TestBlock)
    tarih2: TestBlock = Field(default_factory=TestBlock)
    cografya2: TestBlock = Field(default_factory=TestBlock)
    felsefe: TestBlock = Field(default_factory=TestBlock)
    din: TestBlock = Field(default_factory=TestBlock)
    matematik: TestBlock = Field(default_factory=TestBlock)
    fizik: TestBlock = Field(default_factory=TestBlock)
    kimya: TestBlock = Field(default_factory=TestBlock)
    biyoloji: TestBlock = Field(default_factory=TestBlock)
    ydt: TestBlock = Field(default_factory=TestBlock)


class CalculateRequest(BaseModel):
    obp: float = 85.0
    tyt: TytInput = Field(default_factory=TytInput)
    ayt: AytInput = Field(default_factory=AytInput)


@app.get("/yks/health")
def health():
    try:
        get_hesaplayici()
        return {"status": "ok", "service": "Net Pusula"}
    except Exception as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc


@app.post("/yks/calculate")
def calculate(body: CalculateRequest):
    try:
        h = get_hesaplayici()
        data = h.hesapla(
            body.obp,
            body.tyt.model_dump(),
            body.ayt.model_dump(),
        )
        return {"status": "success", "data": data}
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Hesaplama hatası: {exc}") from exc


@app.get("/")
@app.get("/index.html")
def index():
    path = ROOT / "index.html"
    if not path.exists():
        raise HTTPException(status_code=404, detail="index.html bulunamadı")
    return FileResponse(path)


@app.get("/taban-puanlari.html")
def taban_puanlari():
    path = ROOT / "taban-puanlari.html"
    if not path.exists():
        raise HTTPException(status_code=404, detail="taban-puanlari.html bulunamadı")
    return FileResponse(path)


@app.get("/blog.html")
def blog():
    path = ROOT / "blog.html"
    if not path.exists():
        raise HTTPException(status_code=404, detail="blog.html bulunamadı")
    return FileResponse(path)


@app.get("/gizlilik-politikasi.html")
def gizlilik_politikasi():
    path = ROOT / "gizlilik-politikasi.html"
    if not path.exists():
        raise HTTPException(status_code=404, detail="gizlilik-politikasi.html bulunamadı")
    return FileResponse(path)


@app.get("/kullanim-sartlari.html")
def kullanim_sartlari():
    path = ROOT / "kullanim-sartlari.html"
    if not path.exists():
        raise HTTPException(status_code=404, detail="kullanim-sartlari.html bulunamadı")
    return FileResponse(path)


@app.get("/hakkimizda-iletisim.html")
def hakkimizda_iletisim():
    path = ROOT / "hakkimizda-iletisim.html"
    if not path.exists():
        raise HTTPException(status_code=404, detail="hakkimizda-iletisim.html bulunamadı")
    return FileResponse(path)


@app.get("/sayac.html")
def sayac():
    path = ROOT / "sayac.html"
    if not path.exists():
        raise HTTPException(status_code=404, detail="sayac.html bulunamadı")
    return FileResponse(path)


@app.get("/robots.txt")
def robots_txt():
    path = ROOT / "robots.txt"
    if not path.exists():
        raise HTTPException(status_code=404, detail="robots.txt bulunamadı")
    return FileResponse(path, media_type="text/plain")


@app.get("/sitemap.xml")
def sitemap_xml():
    path = ROOT / "sitemap.xml"
    if not path.exists():
        raise HTTPException(status_code=404, detail="sitemap.xml bulunamadı")
    return FileResponse(path, media_type="application/xml")


assets_dir = ROOT / "assets"
if assets_dir.is_dir():
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

if DATA_DIR.is_dir():
    app.mount("/data", StaticFiles(directory=DATA_DIR), name="data")
