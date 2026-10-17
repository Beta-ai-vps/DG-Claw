'use strict';
/* menu-lado.js: o menu do agente na tela de conversa (gaveta no celular, barra fixa no computador).

   Mostra a foto do agente, o seletor para trocar de agente (cada item com a PRÓPRIA foto), a
   Conversa, as páginas do painel daquele agente e a seção Configurações (instalar o app).
   As partes que só montam texto (itemAgente, linksPainel, instrucaoInstalar) ficam fora do DOM e
   têm teste em web/test/menu-lado.test.js. Quem chama é o conversa.js, que já buscou a lista de
   /api/v1/agents: aqui ela não é buscada de novo, a não ser para o botão "recarregar". */
(function (raiz, fabrica) {
  const m = fabrica(raiz);
  if (typeof module === 'object' && module.exports) module.exports = m;
  else raiz.DGMenuLado = m;
})(this, function (raiz) {
  const esc = s => String(s == null ? '' : s)
    .replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  /* chave = o que vai depois de #aba= (o painel abre a aba por ela) */
  const ABAS_PAINEL = [
    ['status', '◉', 'Status'], ['skills', '✦', 'Skills'], ['rotinas', '↻', 'Rotinas'],
    ['cofre', '⚿', 'Cofre (chaves)'], ['arquivos', '▢', 'Pasta do agente'],
    ['memory', '▤', 'Memória'], ['operations', '⚙', 'Operações'], ['costs', '◇', 'Custos'],
    ['como', '◎', 'Como funciona'], ['identity', '◈', 'Identidade'], ['personality', '◐', 'Personalidade'],
    ['apps', '▨', 'Apps'], ['socorro', '✚', 'Socorro'],
  ];


  /* A foto vem SEMPRE do próprio agente do item. Sem foto, círculo com a cor dele e a letra. */
  function fotoDe(a) {
    const img = a.avatar_img || (/^https:\/\//i.test(a.avatar || '') ? a.avatar : '');
    if (img) return `<img src="${esc(img)}" alt="">`;
    return esc(a.avatar || (a.nome || '?').slice(0, 1));
  }

  function itemAgente(a, atualId) {
    const aqui = a.id === atualId;
    const sub = a.subtitulo || [a.provedor, a.modelo].filter(Boolean).join(' · ');
    return `<a class="ml-ag${aqui ? ' atual' : ''}" role="menuitem" href="/a/${encodeURIComponent(a.id)}"` +
      `${aqui ? ' aria-current="page"' : ''}>` +
      `<span class="ml-mini" style="background:${esc(a.cor || '#2f9e5e')}">${fotoDe(a)}</span>` +
      `<span class="ml-quem"><b>${esc(a.nome)}</b><small>${esc(sub)}</small></span>` +
      `${aqui ? '<span class="ml-aqui">aqui</span>' : ''}</a>`;
  }

  function linksPainel(a) {
    if (!a || !a.tem_painel) return [];
    const base = a.painel_url || ('/p/' + encodeURIComponent(a.id) + '/');
    return ABAS_PAINEL.map(([chave, ico, nome]) => ({ nome, ico, href: base + '#aba=' + chave }));
  }

  /* env = { standalone, ios, promptGuardado }. Devolve { tipo, texto }:
     'instalado' (esconde o item), 'prompt' (chama o prompt do navegador), 'ios' ou 'sem' (só explica). */
  function instrucaoInstalar(env) {
    if (env.standalone) return { tipo: 'instalado', texto: '' };
    if (env.promptGuardado) return { tipo: 'prompt', texto: '' };
    if (env.ios) {
      return { tipo: 'ios', texto: 'Toque em Compartilhar (o quadrado com a seta para cima) e depois em Adicionar à Tela de Início.' };
    }
    return { tipo: 'sem', texto: 'Este navegador não oferece a instalação por aqui. No Chrome ou no Edge, abra o menu do navegador e procure Instalar app. No Firefox para computador, o recurso não existe.' };
  }

  if (!raiz.document) return { ABAS_PAINEL, itemAgente, linksPainel, instrucaoInstalar };

  /* ── Parte com DOM ─────────────────────────────────────────────────────── */
  const $ = id => document.getElementById(id);
  let promptGuardado = null;
  // O Chrome dispara isto uma vez, cedo; sem guardar aqui o toque no item não teria o que chamar.
  window.addEventListener('beforeinstallprompt', ev => {
    ev.preventDefault();
    promptGuardado = ev;
    pintaInstalar();
  });
  window.addEventListener('appinstalled', () => { promptGuardado = null; pintaInstalar(); });

  const ehStandalone = () => navigator.standalone === true ||
    (window.matchMedia && matchMedia('(display-mode: standalone)').matches);
  const ehIos = () => /iPad|iPhone|iPod/.test(navigator.userAgent || '') ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

  function pintaInstalar() {
    const sec = $('mlConfig');
    if (!sec) return;
    const r = instrucaoInstalar({ standalone: ehStandalone(), ios: ehIos(), promptGuardado: !!promptGuardado });
    sec.hidden = r.tipo === 'instalado';
    $('mlInstalarSub').textContent = r.tipo === 'prompt' ? 'atalho na tela, abre sem barra do navegador'
      : 'como colocar na tela inicial';
  }

  function mostraCaixa(texto) {
    const c = $('mlInstalarAjuda');
    c.textContent = texto;
    c.hidden = !texto;
  }

  async function aoInstalar() {
    const r = instrucaoInstalar({ standalone: ehStandalone(), ios: ehIos(), promptGuardado: !!promptGuardado });
    if (r.tipo !== 'prompt') { mostraCaixa($('mlInstalarAjuda').hidden ? r.texto : ''); return; }
    const p = promptGuardado;
    promptGuardado = null;
    try {
      await p.prompt();
      const esc_ = await p.userChoice;
      mostraCaixa(esc_ && esc_.outcome === 'accepted' ? '' : 'Tudo bem. Se mudar de ideia, o item continua aqui no menu.');
    } catch (e) {
      console.warn('menu-lado: o navegador recusou abrir a instalação:', e.message);
      mostraCaixa('O navegador não abriu a instalação (' + e.message + '). Tente pelo menu do navegador, em Instalar app.');
    }
    pintaInstalar();
  }

  function pintaLista(ag, lista, erro) {
    const caixa = $('mlLista'), troca = $('mlTroca');
    if (erro) {
      troca.hidden = false;
      caixa.innerHTML = `<div class="ml-vazio" role="alert">Não consegui listar os agentes: ${esc(erro)}. ` +
        '<button type="button" id="mlRecarrega">Recarregar a lista</button></div>';
      $('mlRecarrega').onclick = recarrega.bind(null, ag);
      return;
    }
    // sem outro agente para onde ir, o seletor só atrapalha
    troca.hidden = lista.length < 2;
    const ordem = lista.filter(a => a.tipo === 'admin').concat(lista.filter(a => a.tipo !== 'admin'));
    caixa.innerHTML = ordem.map(a => itemAgente(a, ag.id)).join('');
  }

  /* silencioso: nas buscas automáticas uma falha de rede passageira não troca a lista por um erro. */
  async function recarrega(ag, silencioso) {
    try {
      const r = await fetch('/api/v1/agents', { cache: 'no-store' });
      const d = await r.json().catch(() => null);
      if (!r.ok || !d || d.ok === false) throw new Error((d && d.erro) || ('a API respondeu ' + r.status));
      pintaLista(ag, Array.isArray(d.agentes) ? d.agentes : [], null);
    } catch (e) {
      if (silencioso) console.warn('menu-lado: não consegui atualizar a lista de agentes (mantive a anterior):', e.message);
      else pintaLista(ag, [], e.message);
    }
  }

  /* opcoes: { agente, agentes (a lista já carregada), fecha() (fecha a gaveta) } */
  function inicia(opcoes) {
    const ag = opcoes.agente;
    $('mlMoldura').innerHTML = `<span class="ml-foto" style="background:${esc(ag.cor || '#2f9e5e')}">${fotoDe(ag)}</span>`;
    $('mlNome').textContent = ag.nome;
    $('mlSub').textContent = ag.tipo === 'admin' ? 'administrador do servidor'
      : (ag.subtitulo || [ag.provedor, ag.modelo].filter(Boolean).join(' · '));
    document.documentElement.classList.add('ml-ativo');

    const troca = $('mlTroca'), btn = $('mlTrocaBtn');
    const abre = sim => { troca.classList.toggle('aberto', sim); btn.setAttribute('aria-expanded', String(sim)); };
    btn.onclick = () => abre(!troca.classList.contains('aberto'));
    document.addEventListener('keydown', ev => {
      if (ev.key === 'Escape' && troca.classList.contains('aberto')) { abre(false); ev.stopPropagation(); }
    }, true);
    if (Array.isArray(opcoes.agentes)) pintaLista(ag, opcoes.agentes, null);
    else recarrega(ag);
    /* Agente criado ou apagado em outra aba aparece sem recarregar a página: a cada 30 s e quando a aba volta a ficar visível. */
    const atualiza = () => { if (document.visibilityState === 'visible') recarrega(ag, true); };
    document.addEventListener('visibilitychange', atualiza);
    setInterval(atualiza, 30000);

    const painel = $('mlPainel'), links = linksPainel(ag);
    painel.innerHTML = links.map(l => `<a class="ml-tab" href="${esc(l.href)}">` +
      `<span class="ml-ico" aria-hidden="true">${l.ico}</span>${esc(l.nome)}</a>`).join('');
    painel.hidden = !links.length;

    $('gmIrConversa').onclick = () => opcoes.fecha();
    $('mlInstalar').onclick = aoInstalar;
    // escolher uma página fecha a gaveta (a navegação em seguida troca a tela)
    $('mlTabs').addEventListener('click', ev => { if (ev.target.closest('a')) opcoes.fecha(); });
    pintaInstalar();
  }

  return { ABAS_PAINEL, itemAgente, linksPainel, instrucaoInstalar, inicia };
});
