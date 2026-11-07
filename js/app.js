/* =========================================================
   Simulado PrudenPrev
   Carrega o banco (data/questoes.json), sorteia as questões
   respeitando o peso de cada matéria e embaralha as alternativas.
   ========================================================= */
(function () {
  'use strict';

  var LETRAS = ['A', 'B', 'C', 'D', 'E'];
  var ARQUIVO = 'data/questoes.json';

  // ---------- Elementos ----------
  var $ = function (id) { return document.getElementById(id); };
  var telas = { inicio: $('tela-inicio'), questao: $('tela-questao'), resultado: $('tela-resultado') };

  var banco = { total: 20, temas: [], porId: {}, questoes: [] };
  var estado = { questoes: [], atual: 0, respostas: [] };

  // ---------- Utilidades ----------
  // Embaralhamento de Fisher–Yates (devolve uma cópia).
  function embaralhar(lista) {
    var a = lista.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function escapar(txt) {
    return String(txt).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- Tema claro/escuro ----------
  function temaAtual() {
    var t = document.documentElement.dataset.theme;
    if (t) return t;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  $('btn-tema').addEventListener('click', function () {
    var novo = temaAtual() === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = novo;
    try { localStorage.setItem('tema', novo === 'dark' ? 'escuro' : 'claro'); } catch (e) {}
  });

  // ---------- Navegação ----------
  function mostrar(nome) {
    Object.keys(telas).forEach(function (k) { telas[k].hidden = k !== nome; });
    window.scrollTo(0, 0);
  }

  // ---------- Banco de questões ----------
  function questaoValida(q) {
    return q && q.id && banco.porId[q.tema] && q.enunciado && q.correta &&
      Array.isArray(q.incorretas) && q.incorretas.length === 4;
  }

  function carregarBanco() {
    return fetch(ARQUIVO, { cache: 'no-cache' })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (dados) {
        banco.total = (dados.simulado && dados.simulado.totalQuestoes) || 20;
        banco.temas = dados.temas;
        banco.porId = {};
        dados.temas.forEach(function (t) { banco.porId[t.id] = t; });
        banco.questoes = (dados.questoes || []).filter(function (q) {
          var ok = questaoValida(q);
          if (!ok) console.warn('Questão ignorada (formato inválido):', q && q.id);
          return ok;
        });
      });
  }

  // Quantas questões de cada matéria entram no simulado.
  // Matérias com "noSimulado" fixo recebem essa quantidade; as demais
  // dividem o restante igualmente, e a sobra vai para matérias sorteadas.
  function cotasPorMateria() {
    var cotas = {};
    var restante = banco.total;
    var livres = [];
    banco.temas.forEach(function (t) {
      if (t.noSimulado) { cotas[t.id] = t.noSimulado; restante -= t.noSimulado; }
      else livres.push(t.id);
    });
    if (livres.length) {
      var base = Math.floor(restante / livres.length);
      var sobra = restante - base * livres.length;
      embaralhar(livres).forEach(function (id, i) { cotas[id] = base + (i < sobra ? 1 : 0); });
    }
    return cotas;
  }

  // Sorteia as questões e embaralha as alternativas de cada uma.
  function sortearSimulado() {
    var cotas = cotasPorMateria();
    var escolhidas = [];
    banco.temas.forEach(function (t) {
      var daMateria = banco.questoes.filter(function (q) { return q.tema === t.id; });
      escolhidas = escolhidas.concat(embaralhar(daMateria).slice(0, cotas[t.id] || 0));
    });
    // Ordem da prova: matérias na ordem do edital (como no caderno real).
    return escolhidas.map(function (q) {
      var alternativas = embaralhar([q.correta].concat(q.incorretas));
      return {
        id: q.id,
        tema: q.tema,
        texto: q.texto || '',
        enunciado: q.enunciado,
        alternativas: alternativas,
        correta: alternativas.indexOf(q.correta)
      };
    });
  }

  // ---------- Tela inicial ----------
  function montarTelaInicial() {
    var cotasFixas = {};
    banco.temas.forEach(function (t) { cotasFixas[t.id] = t.noSimulado; });
    var livres = banco.temas.filter(function (t) { return !t.noSimulado; });
    var restante = banco.total - banco.temas.reduce(function (s, t) { return s + (t.noSimulado || 0); }, 0);
    var base = livres.length ? Math.floor(restante / livres.length) : 0;
    var temSobra = livres.length && restante % livres.length !== 0;

    $('tabela-materias').innerHTML = banco.temas.map(function (t) {
      var qtd = t.noSimulado ? String(t.noSimulado) : (temSobra ? base + ' ou ' + (base + 1) : String(base));
      var noBanco = banco.questoes.filter(function (q) { return q.tema === t.id; }).length;
      return '<tr><td>' + escapar(t.nome) + '</td><td>' + qtd + '</td><td>' + t.valor + ' pts</td><td>' + noBanco + '</td></tr>';
    }).join('');

    $('info-banco').textContent = 'Banco atual: ' + banco.questoes.length + ' questões.';
    $('btn-iniciar').disabled = banco.questoes.length === 0;
  }

  function iniciar() {
    estado.questoes = sortearSimulado();
    estado.atual = 0;
    estado.respostas = [];
    if (!estado.questoes.length) return;
    mostrar('questao');
    renderQuestao();
  }

  // ---------- Tela de questão ----------
  function renderQuestao() {
    var q = estado.questoes[estado.atual];
    var total = estado.questoes.length;

    $('contador').textContent = 'Questão ' + (estado.atual + 1) + ' de ' + total;
    $('barra').style.width = (estado.atual / total * 100) + '%';
    $('tag-materia').textContent = banco.porId[q.tema].nome;
    $('texto-base').textContent = q.texto;
    $('texto-base').hidden = !q.texto;
    $('enunciado').textContent = q.enunciado;
    $('feedback').textContent = '';
    $('feedback').className = 'feedback';
    $('btn-proxima').hidden = true;

    var lista = $('alternativas');
    lista.innerHTML = '';
    q.alternativas.forEach(function (texto, i) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'alt';
      btn.innerHTML = '<span class="letra">' + LETRAS[i] + '</span><span class="texto"></span><span class="icone" aria-hidden="true"></span>';
      btn.querySelector('.texto').textContent = texto;
      btn.addEventListener('click', function () { responder(i); });
      li.appendChild(btn);
      lista.appendChild(li);
    });
    atualizarPlacar();
  }

  function responder(escolha) {
    var q = estado.questoes[estado.atual];
    if (estado.respostas[estado.atual] !== undefined) return; // resposta travada
    var acertou = escolha === q.correta;
    estado.respostas[estado.atual] = { escolha: escolha, acertou: acertou };

    var botoes = $('alternativas').querySelectorAll('.alt');
    botoes.forEach(function (b, i) {
      b.disabled = true;
      if (i === q.correta) {
        b.classList.add('certa');
        b.querySelector('.icone').textContent = '✓';
      } else if (i === escolha) {
        b.classList.add('errada');
        b.querySelector('.icone').textContent = '✗';
      } else {
        b.classList.add('apagada');
      }
    });

    var fb = $('feedback');
    fb.textContent = acertou ? 'Acertou! ✓' : 'Errou! A correta é a letra ' + LETRAS[q.correta] + '.';
    fb.className = 'feedback ' + (acertou ? 'ok' : 'erro');

    $('barra').style.width = ((estado.atual + 1) / estado.questoes.length * 100) + '%';
    var prox = $('btn-proxima');
    prox.textContent = estado.atual === estado.questoes.length - 1 ? 'Ver resultado →' : 'Próxima →';
    prox.hidden = false;
    prox.focus({ preventScroll: true });
    atualizarPlacar();
  }

  function atualizarPlacar() {
    var ok = estado.respostas.filter(function (r) { return r && r.acertou; }).length;
    var erro = estado.respostas.filter(function (r) { return r && !r.acertou; }).length;
    $('placar-ok').textContent = '✓ ' + ok;
    $('placar-erro').textContent = '✗ ' + erro;
  }

  function proxima() {
    if (estado.atual < estado.questoes.length - 1) {
      estado.atual++;
      renderQuestao();
      window.scrollTo(0, 0);
    } else {
      renderResultado();
      mostrar('resultado');
    }
  }

  // ---------- Tela de resultado ----------
  function renderResultado() {
    var nota = 0, max = 0, acertos = 0;
    var porMateria = {};

    estado.questoes.forEach(function (q, i) {
      var valor = banco.porId[q.tema].valor;
      var r = estado.respostas[i];
      max += valor;
      if (r.acertou) { nota += valor; acertos++; }
      var pm = porMateria[q.tema] || (porMateria[q.tema] = { ok: 0, total: 0 });
      pm.total++;
      if (r.acertou) pm.ok++;
    });

    var total = estado.questoes.length;
    $('nota').textContent = nota;
    $('nota-max').textContent = max;
    $('resumo').textContent = acertos + ' de ' + total + ' questões certas (' + Math.round(acertos / total * 100) + '%)';

    var melhorAnterior = registrarTentativa({
      data: Date.now(), nota: nota, max: max, acertos: acertos, total: total, porMateria: porMateria
    });
    var comp = $('comparativo');
    if (melhorAnterior === null) {
      comp.hidden = true;
    } else {
      comp.hidden = false;
      comp.className = 'comparativo' + (nota > melhorAnterior ? ' melhor' : '');
      comp.textContent = nota > melhorAnterior
        ? '★ Novo recorde! Sua melhor nota anterior era ' + melhorAnterior + ' pts.'
        : 'Sua melhor nota até agora: ' + melhorAnterior + ' pts.';
    }

    $('desempenho').innerHTML = banco.temas.filter(function (t) { return porMateria[t.id]; }).map(function (t) {
      var pm = porMateria[t.id];
      var pct = Math.round(pm.ok / pm.total * 100);
      return '<li><div class="linha"><span>' + escapar(t.nome) + '</span><span>' + pm.ok + '/' + pm.total + '</span></div>' +
        '<div class="trilho"><div class="cheio" style="width:' + pct + '%"></div></div></li>';
    }).join('');

    $('gabarito').innerHTML = estado.questoes.map(function (q, i) {
      var r = estado.respostas[i];
      var resp = r.acertou
        ? 'sua: <b>' + LETRAS[r.escolha] + '</b>'
        : '<span class="sua">sua: <b>' + LETRAS[r.escolha] + '</b></span> · <span class="certa-txt">certa: <b>' + LETRAS[q.correta] + '</b></span>';
      return '<li class="' + (r.acertou ? 'ok' : 'erro') + '">' +
        '<span class="num">' + (i + 1) + '.</span>' +
        '<span class="marca-res" aria-label="' + (r.acertou ? 'certa' : 'errada') + '">' + (r.acertou ? '✓' : '✗') + '</span>' +
        '<span class="mat">' + escapar(banco.porId[q.tema].nome) + '</span>' +
        '<span class="resp">' + resp + '</span></li>';
    }).join('');
  }

  // ---------- Histórico de tentativas (salvo só neste navegador) ----------
  var CHAVE_HISTORICO = 'historico-simulados';
  var MAX_HISTORICO = 30;

  function lerHistorico() {
    try {
      var lista = JSON.parse(localStorage.getItem(CHAVE_HISTORICO) || '[]');
      return Array.isArray(lista) ? lista : [];
    } catch (e) { return []; }
  }

  function gravarHistorico(lista) {
    try { localStorage.setItem(CHAVE_HISTORICO, JSON.stringify(lista.slice(0, MAX_HISTORICO))); } catch (e) {}
  }

  // Registra a tentativa e devolve a melhor nota anterior (ou null, se for a primeira).
  function registrarTentativa(t) {
    var lista = lerHistorico();
    var melhorAnterior = lista.length ? Math.max.apply(null, lista.map(function (x) { return x.nota; })) : null;
    lista.unshift(t);
    gravarHistorico(lista);
    return melhorAnterior;
  }

  function formatarData(ms) {
    var d = new Date(ms);
    var dois = function (n) { return (n < 10 ? '0' : '') + n; };
    return dois(d.getDate()) + '/' + dois(d.getMonth() + 1) + ' ' + dois(d.getHours()) + 'h' + dois(d.getMinutes());
  }

  function renderHistorico() {
    var lista = lerHistorico();
    $('card-historico').hidden = lista.length === 0;
    if (!lista.length) return;

    var soma = 0, melhor = 0;
    lista.forEach(function (t) { soma += t.nota; if (t.nota > melhor) melhor = t.nota; });
    $('hist-total').textContent = lista.length;
    $('hist-media').textContent = (Math.round(soma / lista.length * 10) / 10).toString().replace('.', ',');
    $('hist-melhor').textContent = melhor;

    $('lista-historico').innerHTML = lista.slice(0, 10).map(function (t) {
      var pct = t.max ? Math.round(t.nota / t.max * 100) : 0;
      return '<li><span class="data">' + formatarData(t.data) + '</span>' +
        '<span class="acertos">' + t.acertos + '/' + t.total + ' · ' + t.nota + '/' + t.max + ' pts</span>' +
        '<div class="mini" aria-hidden="true"><div style="width:' + pct + '%"></div></div></li>';
    }).join('');
  }

  $('btn-limpar-historico').addEventListener('click', function () {
    if (!window.confirm('Apagar todo o histórico de simulados deste navegador?')) return;
    try { localStorage.removeItem(CHAVE_HISTORICO); } catch (e) {}
    renderHistorico();
  });

  $('btn-inicio').addEventListener('click', function () {
    renderHistorico();
    mostrar('inicio');
  });

  // ---------- Início ----------
  $('btn-iniciar').addEventListener('click', iniciar);
  $('btn-proxima').addEventListener('click', proxima);
  $('btn-refazer').addEventListener('click', iniciar);

  renderHistorico();

  carregarBanco()
    .then(montarTelaInicial)
    .catch(function (e) {
      console.error(e);
      var info = $('info-banco');
      info.textContent = 'Não foi possível carregar as questões. Se abriu o arquivo direto do computador, use um servidor local (veja o README).';
      info.className = 'info-banco erro';
    });
})();
