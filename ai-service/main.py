from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Sommelier IA")

# CORS: permite que el backend (http://localhost:4000) nos llame
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # para desarrollo; luego puedes poner ["http://localhost:4000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CandidateWine(BaseModel):
    name: str
    type: str
    body: str
    acidity: Optional[str] = None
    priceEUR: Optional[float] = None
    description: Optional[str] = None
    pairingNotes: Optional[str] = None

class Preferences(BaseModel):
    acidity: Optional[str] = None
    body: Optional[str] = None
    budget: Optional[str] = None

class RankRequest(BaseModel):
    dishCategory: str
    dishIntensity: str
    dishName: Optional[str] = None
    preferences: Preferences
    candidateWines: List[CandidateWine]

@app.post("/rank-and-explain")
def rank_and_explain(req: RankRequest):
    """
    Versión mínima (sin LLM por ahora):
    - Recibe vinos candidatos ya filtrados por tu backend.
    - Devuelve una explicación corta estilo sommelier para cada uno.
    """
    recs = []

    for w in req.candidateWines[:3]:
        frases = []

        # Match simple por categoría del plato
        if "carne" in req.dishCategory.lower() and w.type == "tinto":
            frases.append("El tinto acompaña bien las notas cárnicas")
        if "pescado" in req.dishCategory.lower() and w.type == "blanco":
            frases.append("El blanco resalta la frescura del pescado")
        if "queso" in req.dishCategory.lower():
            frases.append("Buena afinidad con quesos por su estructura")

        # Intensidad plato ↔ cuerpo vino
        if req.dishIntensity == "fuerte" and w.body in ["intenso", "medio"]:
            frases.append("Tiene estructura suficiente para un plato intenso")
        if req.dishIntensity == "suave" and w.body == "ligero":
            frases.append("Ligero y amable, no tapa el plato")

        # Preferencias del cliente
        if req.preferences.body and w.body == req.preferences.body:
            frases.append(f"Cuerpo {w.body}, acorde a tu preferencia")
        if req.preferences.acidity and w.acidity == req.preferences.acidity:
            frases.append(f"Acidez {w.acidity}, tal como pediste")

        # Precio (si viene)
        if w.priceEUR is not None:
            frases.append(f"Precio aprox.: {w.priceEUR}€")

        texto = ". ".join(frases).strip()
        if texto and not texto.endswith("."):
            texto += "."
        if not texto:
            texto = "Opción equilibrada para el plato."

        recs.append({
            "wineName": w.name,
            "why": texto
        })

    return {"recommendations": recs}