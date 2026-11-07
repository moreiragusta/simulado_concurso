/* =========================================================
   Simulado PrudenPrev
   Etapa 2: interface + demonstração com questões de exemplo.
   Etapa 3 vai trocar a DEMO pelo motor real
   (carregar JSON, sorteio por matéria, embaralhar alternativas).
   ========================================================= */
(function () {
  'use strict';

  var LETRAS = ['A', 'B', 'C', 'D', 'E'];

  var MATERIAS = {
    portugues:   { nome: 'Língua Portuguesa',            noSimulado: '2 ou 3', valor: 2 },
    matematica:  { nome: 'Matemática/Raciocínio Lógico', noSimulado: '2 ou 3', valor: 2 },
    informatica: { nome: 'Noções de Informática',        noSimulado: '2 ou 3', valor: 2 },
    legislacao:  { nome: 'Legislação',                   noSimulado: '2 ou 3', valor: 2 },
    especificos: { nome: 'Conhecimentos Específicos',    noSimulado: '10',     valor: 3 }
  };

  // ---------- DEMO (temporário — substituído na etapa 3) ----------
  var DEMO = [
    { tema: 'portugues', enunciado: 'Assinale a alternativa em que todas as palavras estão grafadas corretamente.',
      alternativas: ['excessão, análise, privilégio', 'exceção, análise, privilégio', 'exceção, análize, privilégio', 'exceção, análise, previlégio', 'esceção, análise, privilégio'], correta: 1 },
    { tema: 'matematica', enunciado: 'Um servidor recebe R$ 3.000,00 e contribui com 14% para o regime próprio. Qual o valor da contribuição?',
      alternativas: ['R$ 300,00', 'R$ 340,00', 'R$ 400,00', 'R$ 420,00', 'R$ 440,00'], correta: 3 },
    { tema: 'informatica', enunciado: 'No Microsoft Word, o atalho Ctrl + Z serve para:',
      alternativas: ['salvar o documento', 'desfazer a última ação', 'refazer a última ação', 'selecionar todo o texto', 'fechar o documento'], correta: 1 },
    { tema: 'especificos', enunciado: 'O Regime Próprio de Previdência Social (RPPS) é destinado aos:',
      alternativas: ['trabalhadores da iniciativa privada', 'servidores titulares de cargo efetivo', 'ocupantes exclusivamente de cargo em comissão', 'trabalhadores autônomos', 'empregados públicos celetistas'], correta: 1 }
  ];

  // ---------- Elementos ----------
  var $ = function (id) { return document.getElementById(id); };
  var telas = { inicio: $('tela-inicio'), questao: $('tela-questao'), resultado: $('tela-resultado') };

  var estado = { questoes: [], atual: 0, respostas: [] };

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

  // ---------- Tela inicial ----------
  function montarTabelaMaterias() {
    $('tabela-materias').innerHTML = Object.keys(MATERIAS).map(function (k) {
      var m = MATERIAS[k];
      return '<tr><td>' + m.nome + '</td><td>' + m.noSimulado + '</td><td>' + m.valor + ' pts</td></tr>';
    }).join('');
  }

  function iniciar() {
    estado.questoes = DEMO;
    estado.atual = 0;
    estado.respostas = [];
    mostrar('questao');
    renderQuestao();
  }

  // ---------- Tela de questão ----------
  function renderQuestao() {
    var q = estado.questoes[estado.atual];
    var total = estado.questoes.length;

    $('contador').textContent = 'Questão ' + (estado.atual + 1) + ' de ' + total;
    $('barra').style.width = (estado.atual / total * 100) + '%';
    $('tag-materia').textContent = MATERIAS[q.tema].nome;
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
    if (estado.respostas[estado.atual] !== undefined) return; // já respondida
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
    prox.focus();
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
      var valor = MATERIAS[q.tema].valor;
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

    $('desempenho').innerHTML = Object.keys(MATERIAS).filter(function (k) { return porMateria[k]; }).map(function (k) {
      var pm = porMateria[k];
      var pct = Math.round(pm.ok / pm.total * 100);
      return '<li><div class="linha"><span>' + MATERIAS[k].nome + '</span><span>' + pm.ok + '/' + pm.total + '</span></div>' +
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
        '<span class="mat">' + MATERIAS[q.tema].nome + '</span>' +
        '<span class="resp">' + resp + '</span></li>';
    }).join('');
  }

  // ---------- Eventos ----------
  $('btn-iniciar').addEventListener('click', iniciar);
  $('btn-proxima').addEventListener('click', proxima);
  $('btn-refazer').addEventListener('click', iniciar);

  montarTabelaMaterias();
})();
