# Simulado PrudenPrev

Simulado web (celular e computador) com questões no estilo da banca **FAFIPA** para o concurso da
**PrudenPrev** — Instituto de Previdência dos Servidores de Presidente Prudente/SP.

## Como funciona

- Cada simulado sorteia **20 questões** de um banco de **200**, respeitando o peso de cada matéria na prova.
- As 5 alternativas são sempre embaralhadas.
- A resposta é corrigida na hora e não pode ser alterada.
- No final aparece o gabarito (✓ / ✗), o desempenho por matéria e a nota ponderada.

## Matérias (prova real: 40 questões / 100 pontos)

| Matéria | Questões | Valor | Total | No banco | Por simulado |
|---|---|---|---|---|---|
| Língua Portuguesa | 5 | 2,00 | 10,00 | 25 | 2 ou 3 |
| Matemática/Raciocínio Lógico | 5 | 2,00 | 10,00 | 25 | 2 ou 3 |
| Noções de Informática | 5 | 2,00 | 10,00 | 25 | 2 ou 3 |
| Legislação | 5 | 2,00 | 10,00 | 25 | 2 ou 3 |
| Conhecimentos Específicos | 20 | 3,00 | 60,00 | 100 | 10 |

As 4 matérias básicas somam 10 questões por simulado: duas delas, sorteadas, recebem 3 e as outras duas recebem 2.

## Estrutura

```
index.html          página principal
css/style.css       estilos (tema claro/escuro)
js/app.js           lógica do simulado
data/questoes.json  banco de questões
tools/validar.py    validador do banco (python tools/validar.py)
PLANO_QUESTOES.md   distribuição e progresso das 200 questões
```

### Formato de uma questão

```json
{
  "id": "POR-001",
  "tema": "portugues",
  "enunciado": "Texto da pergunta",
  "correta": "alternativa certa",
  "incorretas": ["errada 1", "errada 2", "errada 3", "errada 4"]
}
```

Evite alternativas do tipo "todas as anteriores", porque as alternativas são embaralhadas.

> As questões foram elaboradas com apoio de IA a partir do conteúdo do edital e podem conter erros.
> Confira sempre com a legislação oficial.

## Rodar localmente

Como a página carrega um arquivo JSON, abra com um servidor local (por exemplo `python -m http.server`)
e acesse `http://localhost:8000`.

## Roadmap

- [x] Etapa 1 — estrutura e repositório
- [x] Etapa 2 — visual (cartoon P&B, claro/escuro, responsivo)
- [x] Etapa 3 — lógica do simulado
- [ ] Etapa 4 — banco de 200 questões
- [ ] Etapa 5 — extras (progresso, desempenho por matéria, histórico)
- [ ] v2 — explicação por questão, filtro por matéria
