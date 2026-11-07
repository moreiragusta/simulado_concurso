"""Valida data/questoes.json.

Uso: python tools/validar.py

Checa: JSON válido, IDs únicos, tema existente, 4 incorretas,
alternativas repetidas, alternativas proibidas ("todas/nenhuma das
anteriores") e avisa quando a correta é a alternativa mais longa
(padrão que entrega a resposta).
"""
import json
import sys
from collections import Counter
from pathlib import Path

ARQ = Path(__file__).resolve().parent.parent / "data" / "questoes.json"
PROIBIDAS = ("todas as anteriores", "nenhuma das anteriores", "todas as alternativas", "nenhuma das alternativas")


def main() -> int:
    dados = json.loads(ARQ.read_text(encoding="utf-8"))
    temas = {t["id"]: t["nome"] for t in dados["temas"]}
    erros, avisos = [], []
    ids = Counter(q.get("id") for q in dados["questoes"])
    for i, n in ids.items():
        if n > 1:
            erros.append(f"ID repetido: {i}")

    enunciados = Counter(q.get("enunciado", "").strip().lower() for q in dados["questoes"])
    for e, n in enunciados.items():
        if n > 1:
            avisos.append(f"Enunciado repetido: {e[:60]}...")

    mais_longa = 0
    for q in dados["questoes"]:
        qid = q.get("id", "?")
        if q.get("tema") not in temas:
            erros.append(f"{qid}: tema inexistente '{q.get('tema')}'")
        inc = q.get("incorretas", [])
        if len(inc) != 4:
            erros.append(f"{qid}: tem {len(inc)} incorretas (precisa de 4)")
        alts = [q.get("correta", "")] + inc
        if len({a.strip().lower() for a in alts}) != len(alts):
            erros.append(f"{qid}: alternativas repetidas")
        for a in alts:
            if any(p in a.lower() for p in PROIBIDAS):
                erros.append(f"{qid}: alternativa proibida com embaralhamento: '{a}'")
        if inc and len(q["correta"]) > max(len(a) for a in inc) * 1.15:
            mais_longa += 1
            avisos.append(f"{qid}: correta bem mais longa que as demais")

    contagem = Counter(q.get("tema") for q in dados["questoes"])
    print(f"Total: {len(dados['questoes'])} questões")
    for tid, nome in temas.items():
        print(f"  {nome}: {contagem.get(tid, 0)}")
    for a in avisos:
        print("AVISO:", a)
    for e in erros:
        print("ERRO:", e)
    print("OK" if not erros else f"{len(erros)} erro(s)")
    return 1 if erros else 0


if __name__ == "__main__":
    sys.exit(main())
