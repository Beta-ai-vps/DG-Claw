'use strict';
/* Visual de criação no chat do Admin. Mesmo contrato de texto dos vis-*:
   data-pergunta descreve a intenção; só o gesto do dono envia para a conversa.
   Foto usa o upload autenticado do chat, nunca uma URL externa. */
(function () {
  const esc = s => String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function json(url, op) {
    const r = await fetch(url, { cache: 'no-store', ...op });
    if (r.status === 401) { location.href = '/login?next=' + encodeURIComponent(location.pathname); throw new Error('Entre novamente para continuar.'); }
    const d = await r.json();
    if (!r.ok || d.ok === false) throw new Error(d.erro || 'Não consegui falar com o servidor. Tente novamente.');
    return d;
  }
  function iniciar({ agente, enviar, refazer }) {
    if (agente.tipo !== 'admin') {
      try {
        if (sessionStorage.getItem('dgclaw-agente-novo') === agente.id) {
          sessionStorage.removeItem('dgclaw-agente-novo');
          setTimeout(() => window.DGTour?.inicia({ passos: [{ alvo:'#btnMenu', titulo:'Seu agente está no menu', oque:'Agora é só selecionar e falar com ele.', como:'Toque no menu à esquerda e escolha o nome do agente.', porque:'Você pode voltar ao Admin ou conversar com seus agentes por aqui.' }] }), 500);
        }
      } catch (_) { /* A conversa funciona mesmo sem armazenamento local. */ }
      return;
    }
    const host = document.createElement('section');
    host.className = 'nascimento'; host.id = 'nascimento'; host.hidden = true;
    host.setAttribute('aria-label', 'Criar meu agente');
    document.getElementById('chat').appendChild(host);
    let tela = '', preenchendo = false, id = '', foto = null, nome = '';
    /* Depois de tocar, a animação vira um cartão estático no histórico (posicionado pela hora em que a
       criação terminou). Quem monta a lista da conversa pede os cartões por DGOnboarding.cartoes(). */
    const cartoes = new Map();
    // Ids dispensados nesta sessão: o polling não pode trazer de volta um cartão cuja gravação no servidor ainda está a caminho.
    const dispensados = new Set();
    let animando = null;
    const reduz = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
    const chaveVista = i => 'dgclaw-anim-vista:' + i;
    function vistaLocal(i) { try { return localStorage.getItem(chaveVista(i)) === '1'; } catch (_) { return false; } }
    async function marcarVista(i) {
      try { localStorage.setItem(chaveVista(i), '1'); } catch (_) { /* o servidor é a fonte principal */ }
      try { await json('/api/v1/onboarding/animacao-vista', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: i }) }); }
      catch (e) { console.warn('onboarding: não consegui guardar no servidor que a animação já tocou (' + e.message + '). Ela fica marcada só neste navegador; a próxima abertura tenta de novo.'); }
    }
    function pedeRender() { if (typeof refazer === 'function') refazer(); }
    function encerraAnimacao(d) {
      if (dispensados.has(d.id)) return;
      if (cartoes.has(d.id) && host.hidden) return;
      host.hidden = true; host.innerHTML = '';
      document.body.classList.remove('admin-primeiro-acesso');
      cartoes.set(d.id, { id: d.id, nome: d.nome, foto: d.foto, conversa: d.conversa, concluido: d.concluido });
      if (!d.animacaoVista) marcarVista(d.id);
      pedeRender();
    }
    function avisoDeErro(m) {
      host.hidden = false; tela = '';
      host.innerHTML = '<p class="nas-erro" role="alert"></p>';
      const e = host.querySelector('.nas-erro'); e.textContent = m; e.hidden = false;
      setTimeout(() => { if (host.querySelector('.nas-erro') && tela === '') { host.hidden = true; host.innerHTML = ''; } }, 8000);
    }
    // O X some com o cartão na hora; se o servidor não confirmar, o cartão volta e a causa aparece na tela.
    async function dispensar(i) {
      const c = cartoes.get(i);
      dispensados.add(i); cartoes.delete(i);
      if (animando === i) { animando = null; host.hidden = true; host.innerHTML = ''; tela = ''; document.body.classList.remove('admin-primeiro-acesso'); }
      pedeRender();
      try { await json('/api/v1/onboarding/cartao-dispensado', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: i }) }); }
      catch (e) {
        dispensados.delete(i);
        if (c) cartoes.set(i, c);
        pedeRender();
        avisoDeErro('Não consegui dispensar o cartão: ' + e.message + ' O cartão voltou; tente de novo em instantes.');
      }
    }
    // Um único ouvinte: os cartões do histórico são recriados a cada desenho da conversa.
    document.addEventListener('click', ev => {
      const b = ev.target && ev.target.closest && ev.target.closest('[data-dispensar]');
      if (b) { ev.preventDefault(); dispensar(b.dataset.dispensar); }
    });
    const dataHora = ep => {
      const dt = new Date(ep * 1000), z = n => String(n).padStart(2, '0');
      return { dia: z(dt.getDate()) + '/' + z(dt.getMonth() + 1) + '/' + dt.getFullYear(), hhmm: z(dt.getHours()) + ':' + z(dt.getMinutes()) };
    };
    window.DGOnboarding.cartoes = () => [...cartoes.values()].filter(c => c.id !== animando && c.concluido > 0).map(c => ({ ...c, ep: c.concluido, ...dataHora(c.concluido) }));
    const novoId = () => [...crypto.getRandomValues(new Uint8Array(16))].map(n => n.toString(16).padStart(2,'0')).join('');
    function erro(m) { const e = host.querySelector('.nas-erro'); if (e) { e.textContent = m; e.hidden = false; } }
    const passos = [
      { alvo:'[data-tour="nas-inicio"]', titulo:'Seu primeiro passo', oque:'O Admin prepara os agentes e cuida do servidor.', como:'O botão envia seu pedido nesta conversa. Você escolhe nome, função, tom e foto antes de confirmar a criação.', porque:'Você faz a configuração pelo painel e acompanha cada etapa.' },
      { alvo:'[data-tour="nas-nome"]', titulo:'Nome do seu agente', oque:'É como ele vai aparecer na conversa e no menu.', como:'Você escolhe o nome. O Admin cuida do cadastro.', porque:'Você reconhece seu agente pelo nome, sem precisar lidar com códigos.' },
      { alvo:'[data-tour="nas-papel"]', titulo:'Função e tom', oque:'O trabalho que você quer delegar e o jeito de conversar.', como:'Essas respostas entram na identidade do agente. Não existe uma nota ou cálculo.', porque:'Ele começa sabendo como pode ajudar você.' },
      { alvo:'[data-tour="nas-foto"]', titulo:'Foto opcional', oque:'A imagem que identifica seu agente.', como:'Suba PNG, JPEG ou WebP de até 5 MB, ou gere um avatar ilustrado aqui. A geração é local e não usa IA nem envia dados a outro serviço. Sem foto, usamos um avatar neutro.', porque:'A foto ajuda a reconhecer o agente. Você pode começar sem ela.' },
      { alvo:'[data-tour="nas-estado"]', titulo:'Preparação e boas-vindas', oque:'A etapa real da criação.', como:'O Admin prepara o agente, você conecta sua assinatura e ele testa uma resposta. Só depois a caixa abre.', porque:'Assim você sabe se precisa fazer algo e quando já pode conversar.' }
    ];
    function tutorial(seletor) { if (window.DGTour) window.DGTour.inicia({ passos: seletor ? passos.filter(p=>p.alvo===seletor) : passos }); }
    function cab(titulo) {
      return '<div class="nas-topo"><span class="nas-marca">DG CLAW · ADMIN</span><button type="button" class="nas-tutorial">Tutorial</button></div><h2>'+titulo+'</h2>';
    }
    function ligarAjuda() {
      host.querySelector('.nas-tutorial').onclick = () => tutorial();
      host.querySelectorAll('[data-ajuda]').forEach(b => b.onclick = () => tutorial(b.dataset.ajuda));
    }
    function inicio() {
      tela = 'inicio'; host.hidden = false;
      document.body.classList.add('admin-primeiro-acesso');
      host.innerHTML = cab('Bem-vindo ao seu DG Claw') + '<section data-tour="nas-inicio"><p>Eu sou o Admin. Cuido deste servidor e ajudo você a criar seus agentes.</p><p>Você escolhe um nome, conta o que quer delegar e acompanha tudo por aqui. Depois, é só conversar com seu agente pelo menu à esquerda.</p><button id="nasComecar" type="button" class="nas-principal" data-pergunta="Quero criar meu primeiro agente">Quero criar meu primeiro agente</button></section><p class="nas-erro" role="alert" hidden></p>';
      host.querySelector('.nas-tutorial').onclick = () => tutorial('[data-tour="nas-inicio"]');
      host.querySelector('#nasComecar').onclick = async () => {
        const b = host.querySelector('#nasComecar'); b.disabled = true;
        try { await enviar('Quero criar meu primeiro agente'); boasVindas(); }
        catch (e) { erro(e.message); b.disabled = false; }
      };
    }
    function boasVindas() {
      tela = 'boas-vindas'; host.hidden = false;
      host.innerHTML = cab('Vamos criar seu primeiro agente?') + '<p>Eu sou o Admin. Cuido deste servidor e preparo seus agentes. Como vai se chamar o primeiro?</p><form id="nasNome"><section data-tour="nas-nome"><div class="nas-rotulo"><label for="nasNomeInput">Nome do agente</label><button type="button" data-ajuda="[data-tour=nas-nome]" aria-label="Ajuda sobre o nome">?</button></div><input id="nasNomeInput" name="nome" maxlength="70" placeholder="Ex.: Sofia" required autocomplete="off"><button class="nas-principal" type="submit" data-pergunta="Quero criar meu primeiro agente">Continuar</button></section></form><p class="nas-erro" role="alert" hidden></p>';
      // Os seletores de tutorial são âncoras estáveis, sem dependência da aparência.
      host.querySelector('[data-ajuda]').onclick = () => tutorial('[data-tour="nas-nome"]');
      host.querySelector('.nas-tutorial').onclick = () => tutorial('[data-tour="nas-nome"]');
      host.querySelector('form').onsubmit = async ev => {
        ev.preventDefault(); nome = host.querySelector('input').value.trim(); if (!nome) return;
        const bot = host.querySelector('[type=submit]'); bot.disabled = true;
        try { await enviar('Quero criar meu primeiro agente. O nome será ' + nome + '. Vou preencher a função, o tom e a foto no formulário do painel. Aguarde minha confirmação em Criar meu agente.'); formulario(); }
        catch (e) { erro(e.message); bot.disabled = false; }
      };
    }
    /* Só o #chat rola (scrollIntoView podia deslocar a página inteira no iPhone). Chamado uma vez,
       a pedido da pessoa, quando o formulário abre. */
    function topoDoFormulario() {
      const chat = document.getElementById('chat');
      if (!chat) return;
      chat.scrollTop += host.getBoundingClientRect().top - chat.getBoundingClientRect().top;
    }
    function formulario() {
      preenchendo = true; tela = 'formulario'; id = id || novoId(); host.hidden = false;
      host.innerHTML = cab('Dê um jeito só dele') + '<p>Me conte o que você quer delegar. Eu preparo o resto.</p><form id="nasForm">'+
        '<section data-tour="nas-nome"><div class="nas-rotulo"><label for="nasNomeCompleto">Nome</label><button type="button" data-ajuda="[data-tour=&quot;nas-nome&quot;]" aria-label="Ajuda sobre o nome">?</button></div><input id="nasNomeCompleto" name="nome" value="'+esc(nome)+'" maxlength="70" required><label for="nasDono">Como você quer ser chamado?</label><input id="nasDono" name="dono" maxlength="70" placeholder="Seu nome (opcional)" autocomplete="given-name"></section>'+
        '<section data-tour="nas-papel"><div class="nas-rotulo"><label for="nasPapel">O que ele vai fazer por você?</label><button type="button" data-ajuda="[data-tour=&quot;nas-papel&quot;]" aria-label="Ajuda sobre função e tom">?</button></div><textarea id="nasPapel" name="papel" rows="3" maxlength="700" placeholder="Ex.: organizar minha agenda e me ajudar a escrever para o Instagram" required></textarea><label for="nasTom" title="O jeito de conversar que será gravado na identidade do agente">Tom da conversa</label><select id="nasTom" name="jeito"><option>Acolhedor e direto</option><option>Descontraído e bem-humorado</option><option>Formal e objetivo</option><option>Paciente e didático</option></select></section>'+
        '<section data-tour="nas-foto"><div class="nas-rotulo"><label for="nasFoto">Foto <span>(opcional)</span></label><button type="button" data-ajuda="[data-tour=&quot;nas-foto&quot;]" aria-label="Ajuda sobre a foto">?</button></div><div class="nas-foto"><div class="nas-avatar" id="nasPrevia" aria-label="Avatar neutro">◉</div><div><input id="nasFoto" type="file" accept="image/png,image/jpeg,image/webp"><small>PNG, JPEG ou WebP · até 5 MB</small><button type="button" id="nasGerarFoto" title="Cria um avatar ilustrado neste navegador, sem IA e sem custo">Gerar avatar</button></div></div></section>'+
        '<p class="nas-nota">Ao tocar em criar, você confirma essas escolhas. Seu agente usará a mesma assinatura do Admin e vocês conversarão aqui no painel.</p><button type="submit" class="nas-principal" data-pergunta="Crie meu agente com as escolhas deste formulário">Criar meu agente</button></form><p class="nas-erro" role="alert" hidden></p>';
      ligarAjuda();
      topoDoFormulario();
      host.querySelector('#nasFoto').onchange = () => {
        const f = host.querySelector('#nasFoto').files[0]; foto = null;
        const prev = host.querySelector('#nasPrevia'); prev.textContent = '◉';
        if (!f) return;
        if (!['image/png','image/jpeg','image/webp'].includes(f.type) || f.size > 5*1024*1024) { erro('Escolha uma foto PNG, JPEG ou WebP de até 5 MB.'); host.querySelector('#nasFoto').value = ''; return; }
        foto = f;
        const url = URL.createObjectURL(f), img = new Image(); img.alt = 'Foto escolhida'; img.onload = () => URL.revokeObjectURL(url); img.src = url; prev.replaceChildren(img);
      };
      host.querySelector('#nasGerarFoto').onclick = () => {
        const c = document.createElement('canvas'); c.width = c.height = 320;
        const x = c.getContext('2d'), cores = [['#e1ecdc','#477553'],['#e7e2f3','#7963a7'],['#f5e3d6','#b57750'],['#dceaf3','#497c9a']];
        const cor = cores[crypto.getRandomValues(new Uint8Array(1))[0] % cores.length];
        x.fillStyle = cor[0]; x.fillRect(0,0,320,320);
        x.fillStyle = cor[1]; x.beginPath(); x.roundRect(70,82,180,158,55); x.fill();
        x.lineWidth = 9; x.strokeStyle = cor[1]; x.beginPath(); x.moveTo(160,82); x.lineTo(160,56); x.stroke();
        x.beginPath(); x.arc(160,48,13,0,Math.PI*2); x.fill();
        x.fillStyle = '#fffefa'; [125,195].forEach(v => { x.beginPath(); x.arc(v,147,17,0,Math.PI*2); x.fill(); });
        x.strokeStyle = '#fffefa'; x.lineWidth = 8; x.lineCap = 'round'; x.beginPath(); x.arc(160,175,30,.15,Math.PI-.15); x.stroke();
        x.fillStyle = cor[1]; x.beginPath(); x.roundRect(95,257,130,65,24); x.fill();
        c.toBlob(blob => {
          if (!blob || tela !== 'formulario') return;
          foto = new File([blob], 'avatar.png', { type:'image/png' });
          host.querySelector('#nasFoto').value = '';
          const img = new Image(); img.alt = 'Avatar ilustrado gerado'; img.src = c.toDataURL('image/png'); host.querySelector('#nasPrevia').replaceChildren(img);
        }, 'image/png');
      };
      host.querySelector('form').onsubmit = async ev => {
        ev.preventDefault(); const f = ev.target, bot = f.querySelector('[type=submit]'); bot.disabled = true; bot.textContent = 'Enviando suas escolhas…';
        try {
          let fotoId = null;
          if (foto) { const fd = new FormData(); fd.append('file',foto); fd.append('enviar','0'); fd.append('cliente_id',id+'-foto'); const up = await json('/api/v1/agents/'+encodeURIComponent(agente.id)+'/upload',{method:'POST',body:fd}); fotoId = up.anexo.id; }
          const pedido = { id, dono:f.elements.dono.value.trim() || undefined, nome:f.elements.nome.value.trim(), papel:f.elements.papel.value.trim().replace(/\s+/g,' '), jeito:f.elements.jeito.value, foto:fotoId };
          const d = await json('/api/v1/onboarding',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(pedido)});
          preenchendo = false; mostrar(d);
        } catch(e) { erro(e.message); bot.disabled = false; bot.textContent = 'Tentar enviar novamente'; }
      };
    }
    // A barra tem estrutura fixa; as consultas só trocam texto e largura, sem redesenhar o cartão.
    function barraHtml() {
      return '<div class="nas-prog" data-estado="ok"><div class="nas-prog-topo"><strong class="nas-pct">0%</strong><span class="nas-etapa"></span></div>'+
        '<div class="nas-trilho" role="progressbar" aria-label="Andamento da criação do agente" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="nas-barra"></div></div>'+
        '<div class="nas-prog-erro" role="alert" hidden><b></b><span></span></div></div>';
    }
    let ultimaBarra = '';
    function pintaBarra(d) {
      const pr = d.progresso, el = host.querySelector('.nas-prog');
      if (!pr || !el) return;
      const chave = JSON.stringify(pr);
      if (chave === ultimaBarra && el.dataset.pintada === d.id) return;
      ultimaBarra = chave; el.dataset.pintada = d.id;
      const pct = Math.max(0, Math.min(100, Math.round(pr.pct || 0)));
      const passos = pr.passo && pr.total ? ' (' + pr.passo + ' de ' + pr.total + ')' : '';
      el.dataset.estado = pr.erro ? 'erro' : 'ok';
      el.querySelector('.nas-pct').textContent = pct + '%';
      el.querySelector('.nas-etapa').textContent = pr.etapa + passos;
      const trilho = el.querySelector('.nas-trilho');
      trilho.setAttribute('aria-valuenow', String(pct));
      trilho.setAttribute('aria-valuetext', pct + '%, ' + pr.etapa + (pr.erro ? '. Parou: ' + pr.erro.motivo : ''));
      el.querySelector('.nas-barra').style.width = pct + '%';
      const e = el.querySelector('.nas-prog-erro');
      e.hidden = !pr.erro;
      if (pr.erro) {
        e.querySelector('b').textContent = 'Parou nesta etapa: ' + pr.erro.motivo;
        e.querySelector('span').textContent = pr.erro.oQueFazer ? 'O que fazer: ' + pr.erro.oQueFazer : 'Peça ajuda ao Admin: ele confere o registro e retoma de onde parou.';
      }
    }
    function mostrar(d) {
      let novos = false;
      for (const c of d.cartoes || []) if (c.id !== animando && !cartoes.has(c.id) && !dispensados.has(c.id)) { cartoes.set(c.id, c); novos = true; }
      if (novos) pedeRender();
      if (preenchendo) return;
      if (d.fase === 'pronto' && (d.cartaoDispensado || dispensados.has(d.id))) {
        host.hidden = true; host.innerHTML = ''; document.body.classList.remove('admin-primeiro-acesso'); return;
      }
      if (d.fase === 'inativo') { host.hidden = true; return; }
      if (d.fase === 'boas-vindas') { if (!tela) inicio(); return; }
      const comErro = !!(d.progresso && d.progresso.erro);
      if (d.fase === 'pronto' && d.conversa) {
        if (animando === d.id) return;
        // A animação toca uma vez só: depois (ou com movimento reduzido) vira cartão estático do histórico.
        if (d.animacaoVista || vistaLocal(d.id) || reduz()) { encerraAnimacao(d); return; }
      }
      const assinatura = d.fase + ':' + d.id + ':' + d.mensagem + ':' + comErro;
      if (assinatura === tela) { pintaBarra(d); return; }
      tela = assinatura; ultimaBarra = ''; host.hidden = false;
      const pronto = d.fase === 'pronto' && d.conversa;
      const ocupado = ['solicitado','enviando','criando','testando'].includes(d.fase);
      const tit = pronto ? 'Seu agente chegou.' : d.fase === 'login' ? 'Falta conectar sua assinatura' : d.fase === 'erro' || d.fase === 'erro-envio' ? 'Vamos resolver juntos' : 'Um começo só seu';
      const fotoHtml = d.foto ? '<img src="'+esc(d.foto)+'" alt="Foto de '+esc(d.nome)+'">' : '<span aria-label="Avatar neutro">◉</span>';
      host.innerHTML = cab(tit) + '<section data-tour="nas-estado"><div class="nas-rotulo"><span class="nas-status">'+(pronto?'PRONTO PARA CONVERSAR':ocupado?'PREPARANDO '+esc(d.nome).toUpperCase():'PRÓXIMO PASSO')+'</span><button type="button" data-ajuda="[data-tour=&quot;nas-estado&quot;]" aria-label="Entenda esta etapa">?</button></div><div class="nas-palco '+(pronto?'nas-abriu':ocupado?'nas-gerando':'')+'" aria-hidden="true"><div class="nas-aura"></div><div class="nas-cubo"><div class="nas-face nas-frente"></div><div class="nas-face nas-lado"></div><div class="nas-face nas-tampa"></div><div class="nas-racha"></div></div></div>'+
        barraHtml()+
        (pronto?'<div class="nas-cx">'+botaoX(d.id, d.nome)+'<a class="nas-badge" href="'+esc(d.conversa)+'"><div class="nas-retrato">'+fotoHtml+'</div><strong>Oi, eu sou '+esc(d.nome)+'.</strong><span>Clique aqui pra gente começar a conversar <b aria-hidden="true">↗</b></span></a></div>':'<p class="nas-andamento" role="status" aria-live="polite">'+esc(d.mensagem)+'</p>')+
        (d.fase==='login' && d.login?'<a class="nas-principal" href="'+esc(d.login)+'" target="_blank" rel="noopener">Conectar minha assinatura</a><button type="button" id="nasTestar">Já entrei. Pode testar.</button>':'')+
        (d.fase==='erro'||d.fase==='erro-envio'||comErro?'<button type="button" id="nasReparar" class="nas-principal">Pedir ajuda ao Admin</button>':'')+
        '<p class="nas-erro" role="alert" hidden></p></section>';
      pintaBarra(d);
      ligarAjuda();
      const teste = host.querySelector('#nasTestar');
      if (teste) teste.onclick = async () => { teste.disabled = true; try { await enviar('Já entrei com minha assinatura. Pode testar meu agente e concluir a criação pelo formulário.'); teste.textContent='Avisei o Admin. Aguarde o teste.'; } catch(e) { erro(e.message); teste.disabled=false; } };
      const reparar = host.querySelector('#nasReparar');
      if (reparar) reparar.onclick = async () => { reparar.disabled=true; try { await enviar('Preciso de ajuda para continuar a criação do meu agente pelo formulário. Pode conferir o que aconteceu e retomar?'); reparar.textContent='Avisei o Admin'; } catch(e) {erro(e.message); reparar.disabled=false;} };
      // sem rolar aqui: esta tela é refeita a cada novidade do Admin, e puxar a página para o topo dela
      // a cada atualização fazia a conversa pular para cima. O fim é seguido por quem já estava no fim.
      if (pronto) {
        document.body.classList.remove('admin-primeiro-acesso');
        host.querySelector('.nas-badge').addEventListener('click', () => { try { sessionStorage.setItem('dgclaw-agente-novo', d.conversa.split('/').pop()); } catch (_) {} });
        animando = d.id; marcarVista(d.id);
        setTimeout(() => { animando = null; encerraAnimacao(d); }, 3400);
        host.querySelector('.nas-badge').setAttribute('aria-label', 'Oi, eu sou '+d.nome+'. Clique aqui pra gente começar a conversar');
      }
    }
    let timer = null, rodando = false, ultimaFase = '';
    // Mais rápido enquanto algo está sendo criado; devagar quando só espera a pessoa; para no pronto.
    const ritmo = f => ['enviando','solicitado','criando','testando'].includes(f) ? 1500 : 6000;
    function agendar() { clearTimeout(timer); if (ultimaFase !== 'pronto') timer = setTimeout(atualizar, ritmo(ultimaFase)); }
    async function atualizar() {
      if (rodando) return;
      if (document.hidden) { agendar(); return; }
      rodando = true;
      try { const d = await json('/api/v1/onboarding'); ultimaFase = d.fase; mostrar(d); }
      catch(e) { if (host.hidden) { host.hidden=false; host.innerHTML=cab('Vamos começar')+'<p class="nas-erro" role="alert"></p>'; host.querySelector('.nas-tutorial').onclick=()=>tutorial(); } erro(e.message); }
      finally { rodando = false; agendar(); }
    }
    document.addEventListener('visibilitychange', () => { if (!document.hidden && ultimaFase !== 'pronto') atualizar(); });
    atualizar();
    window.addEventListener('pagehide',()=>clearTimeout(timer),{once:true});
  }
  const botaoX = (id, nome) => '<button type="button" class="nas-x" data-dispensar="' + esc(id) + '" aria-label="' + esc('Dispensar o cartão de ' + nome) + '"><span aria-hidden="true">×</span></button>';
  function htmlCartao(c) {
    const retrato = c.foto ? '<img src="' + esc(c.foto) + '" alt="Foto de ' + esc(c.nome) + '" loading="lazy">' : '<span aria-label="Avatar neutro">◉</span>';
    const miolo = '<div class="nas-retrato">' + retrato + '</div><strong>' + esc(c.nome) + ' nasceu às ' + esc(c.hhmm) + '</strong>' +
      (c.conversa ? '<span>Clique aqui pra conversar com ' + esc(c.nome) + ' <b aria-hidden="true">↗</b></span>' : '');
    return '<div class="nas-hist" data-msg="' + esc('nasc-' + c.id) + '"><div class="nas-cx">' + botaoX(c.id, c.nome) + (c.conversa ? '<a class="nas-badge" href="' + esc(c.conversa) + '">' + miolo + '</a>' : '<div class="nas-badge">' + miolo + '</div>') + '</div></div>';
  }
  window.DGOnboarding = { iniciar, htmlCartao };
})();
