'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../public/menu-lado');

const pub = (n) => fs.readFileSync(path.join(__dirname, '../public', n), 'utf8');

test('conversa.html carrega o menu novo e não tem mais o link avulso do painel', () => {
  const h = pub('conversa.html');
  assert.match(h, /<link rel="stylesheet" href="\/menu-lado\.css">/);
  assert.match(h, /<script src="\/menu-lado\.js"><\/script>/);
  assert.ok(h.indexOf('/menu-lado.js') < h.indexOf('/conversa.js'), 'menu-lado.js precisa vir antes do conversa.js');
  assert.doesNotMatch(h, /gmSecPainel/);
});

test('sw.js guarda os arquivos novos e está na v13', () => {
  const s = pub('sw.js');
  assert.match(s, /dgclaw-estaticos-v13/);
  assert.match(s, /'\/menu-lado\.js'/);
  assert.match(s, /'\/menu-lado\.css'/);
});

test('seletor: cada item usa a foto do próprio agente, não a do agente atual', () => {
  const ana = { id: 'ana', nome: 'Ana', cor: '#aa0000', avatar_img: '/fotos/ana.png' };
  const bento = { id: 'bento', nome: 'Bento', cor: '#0000bb', avatar_img: '/fotos/bento.png' };
  const caio = { id: 'caio', nome: 'Caio', cor: '#00cc00', avatar: 'C' };
  const hAna = M.itemAgente(ana, 'bento'), hBento = M.itemAgente(bento, 'bento'), hCaio = M.itemAgente(caio, 'bento');
  assert.match(hAna, /src="\/fotos\/ana\.png"/);
  assert.doesNotMatch(hAna, /bento\.png/);
  assert.match(hBento, /src="\/fotos\/bento\.png"/);
  assert.match(hBento, /aqui/);
  assert.doesNotMatch(hAna, /aqui/);
  assert.match(hCaio, /background:#00cc00/);
  assert.match(hCaio, />C</);
  assert.doesNotMatch(hCaio, /<img/);
  assert.match(hCaio, /href="\/a\/caio"/);
});

test('seletor: nome com HTML não vira marcação', () => {
  const h = M.itemAgente({ id: 'x', nome: '<b>"x"</b>' }, 'y');
  assert.doesNotMatch(h, /<b>"x"/);
});

test('páginas do painel: 13 links com #aba=, e nenhum sem painel', () => {
  const l = M.linksPainel({ id: 'ana', tem_painel: true, painel_url: '/p/ana/' });
  assert.deepEqual(l.map(x => x.href.split('#aba=')[1]),
    ['status', 'skills', 'rotinas', 'cofre', 'arquivos', 'memory', 'operations', 'costs', 'como', 'identity', 'personality', 'apps', 'socorro']);
  assert.ok(l.every(x => x.href.startsWith('/p/ana/#aba=')));
  assert.deepEqual(M.linksPainel({ id: 'admin', tem_painel: false }), []);
});

test('instalar o app: instalado some, prompt do Chrome, iPhone explica, resto explica o porquê', () => {
  assert.equal(M.instrucaoInstalar({ standalone: true }).tipo, 'instalado');
  assert.equal(M.instrucaoInstalar({ promptGuardado: true }).tipo, 'prompt');
  const ios = M.instrucaoInstalar({ ios: true });
  assert.equal(ios.tipo, 'ios');
  assert.match(ios.texto, /Adicionar à Tela de Início/);
  assert.match(M.instrucaoInstalar({}).texto, /não oferece/);
});

test('manifesto instalável: standalone, start_url, ícones 192/512 e maskable existem', () => {
  const m = JSON.parse(pub('manifest.webmanifest'));
  assert.equal(m.display, 'standalone');
  assert.equal(m.start_url, '/');
  for (const i of m.icons) assert.ok(fs.existsSync(path.join(__dirname, '../public', i.src)), i.src);
  assert.ok(m.icons.some(i => i.sizes === '192x192') && m.icons.some(i => i.sizes === '512x512'));
});
