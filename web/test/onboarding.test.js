'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { subirWeb } = require('./ajuda');
const { criarRunnerFalso } = require('./runner-falso');
const { loja } = require('../lib/onboarding');
const { executar } = require('../bin/onboarding');

async function cenario(t) {
  const runner = criarRunnerFalso({agenteId:'admin'}), porta = await runner.ouvir();
  const web = await subirWeb({agentes:[{slug:'admin',tipo:'admin',nome:'Admin',provedor:'claude',runner:'http://127.0.0.1:'+porta,agente_id:'admin'}]});
  t.after(async()=>{await web.fechar(); await runner.fechar(); fs.rmSync(web.dir,{recursive:true,force:true});});
  return {web,runner};
}
const pedido = {id:'a'.repeat(32),nome:'Sofia',papel:'Organizar minha agenda',jeito:'Acolhedor e direto'};
test('formulário exige sessão e origem; salva e envia ao Admin uma única vez',async t=>{
  const {web,runner}=await cenario(t);
  assert.equal((await web.c.get('/api/v1/onboarding')).status,401);
  await web.login();
  assert.equal((await web.c.get('/api/v1/onboarding')).json.fase,'boas-vindas');
  assert.equal((await web.c.post('/api/v1/onboarding',{json:pedido,origin:false})).status,403);
  const r = await web.c.post('/api/v1/onboarding',{json:pedido});
  assert.equal(r.status,200,r.texto); assert.equal(r.json.fase,'solicitado');
  assert.equal(runner.rec.inputs.length,1);
  assert.match(runner.rec.inputs[0].text,/do visual Criar meu agente/);
  assert.match(runner.rec.inputs[0].text,/Confirmo a criação pelo formulário/);
  assert.doesNotMatch(runner.rec.inputs[0].text,/onboarding\.js|\/opt\//);
  assert.equal((await web.c.post('/api/v1/onboarding',{json:pedido})).status,200);
  assert.equal(runner.rec.inputs.length,1);
  assert.equal((await web.c.post('/api/v1/onboarding',{json:{...pedido,id:'b'.repeat(32)}})).status,409);
  assert.equal(fs.statSync(path.join(web.dados,'onboarding',pedido.id+'.json')).mode & 0o777,0o600);
});
test('validação recusa foto de outro chat, ids e campos inválidos antes de enviar',async t=>{
  const {web,runner}=await cenario(t); await web.login();
  for(const dado of [null,[],{...pedido,id:'../../escape'},{...pedido,nome:'<script>'},{...pedido,dono:'<script>'},{...pedido,dono:'a'.repeat(71)},{...pedido,papel:''},{...pedido,jeito:'a'.repeat(181)},{...pedido,foto:'foto-inexistente'}]) assert.equal((await web.c.post('/api/v1/onboarding',{json:dado})).status,400);
  assert.equal(runner.rec.inputs.length,0);
});
test('Admin indisponível mantém pedido e permite retomar entrega',async t=>{
  const {web,runner}=await cenario(t); await web.login();
  runner.opcoes.falhaInput={status:409,corpo:{error:'NO_PTY'}};
  assert.ok((await web.c.post('/api/v1/onboarding',{json:pedido})).status>=400);
  assert.equal((await web.c.get('/api/v1/onboarding')).json.fase,'erro-envio');
  runner.opcoes.falhaInput=null;
  assert.equal((await web.c.post('/api/v1/onboarding',{json:pedido})).json.fase,'solicitado');
});
test('helper usa argv separados, cria uma vez e só abre a badge após resposta nova',async t=>{
  const {web}=await cenario(t); await web.login();
  const nome='Sofia $(touch /tmp/nao-executar)';
  await web.c.post('/api/v1/onboarding',{json:{...pedido,nome}});
  let chamadas=0;
  const {EventEmitter}=require('node:events');
  const fakeSpawn=(bin,args,opts)=>{
    chamadas++; assert.equal(bin,'/usr/local/bin/dgclaw'); assert.equal(opts.shell,false); assert.equal(args[4],nome);
    const p=loja(web.dados).ler(pedido.id);
    const reg=JSON.parse(fs.readFileSync(web.agentesPath));reg.agentes.push({slug:p.slug,nome:p.nome,agente_id:p.slug,runner:'http://127.0.0.1:1',porta_painel:8301});fs.writeFileSync(web.agentesPath,JSON.stringify(reg));
    const emitter=new EventEmitter();setImmediate(()=>emitter.emit('exit',0));return emitter;
  };
  let r=await executar('criar',pedido.id,{web:web.web,spawn:fakeSpawn});assert.equal(r.fase,'login');
  assert.equal((await web.c.get('/api/v1/onboarding')).json.conversa,null);
  await executar('criar',pedido.id,{web:web.web,spawn:fakeSpawn});assert.equal(chamadas,1);
  let enviado=false;
  const faux={...web.web,conversa:{enviar:async()=>{enviado=true;return{status:200,corpo:{ep_enviado:100}};},thread:async()=>({msgs:enviado?[{id:'nova',origin:'agente',ep:101}]:[{id:'antiga',origin:'agente',ep:1}]})}};
  r=await executar('testar',pedido.id,{web:faux,esperaMs:20,intervaloMs:1});assert.equal(r.fase,'pronto');assert.equal(r.respostaId,'nova');
  const estado=(await web.c.get('/api/v1/onboarding')).json;assert.equal(estado.conversa,'/a/'+r.slug);
});
test('status de processo ou resposta antiga não conclui o teste do agente',async t=>{
  const {web}=await cenario(t);await web.login();await web.c.post('/api/v1/onboarding',{json:pedido});
  const db=loja(web.dados),p=db.ler(pedido.id);
  const registro={obter:()=>({slug:p.slug,tipo:'agente'})};
  const faux={...web.web,registro,conversa:{enviar:async()=>({status:200,corpo:{ep_enviado:100}}),thread:async()=>({msgs:[{id:'antiga',origin:'agente',ep:1}]})}};
  const {EventEmitter}=require('node:events');const chamadas=[];
  const spawnFalso=(bin,args)=>{chamadas.push(args);const e=new EventEmitter();setImmediate(()=>e.emit('exit',0));return e;};
  await assert.rejects(executar('testar',pedido.id,{web:faux,esperaMs:10,intervaloMs:1,reinicioMs:1,spawn:spawnFalso}),/ainda não respondeu/);
  assert.deepEqual(chamadas,[['agente','reiniciar',p.slug]]);
  assert.equal(db.ler(pedido.id).fase,'erro');assert.ok(!fs.existsSync(path.join(db.dir,pedido.id+'.lock')));
});
test('agente que só responde depois do reinício termina em pronto',async t=>{
  const {web}=await cenario(t);await web.login();await web.c.post('/api/v1/onboarding',{json:pedido});
  const db=loja(web.dados),p=db.ler(pedido.id);
  const registro={obter:()=>({slug:p.slug,tipo:'agente'})};
  const {EventEmitter}=require('node:events');
  let reiniciou=false,envios=0;const chamadas=[];
  const spawnFalso=(bin,args)=>{chamadas.push(args);reiniciou=true;const e=new EventEmitter();setImmediate(()=>e.emit('exit',0));return e;};
  const faux={...web.web,registro,conversa:{enviar:async()=>{envios++;return{status:200,corpo:{ep_enviado:100*envios}};},thread:async()=>({msgs:reiniciou&&envios>=2?[{id:'antiga',origin:'agente',ep:1},{id:'nova',origin:'agente',ep:200}]:[{id:'antiga',origin:'agente',ep:1}]})}};
  const r=await executar('testar',pedido.id,{web:faux,esperaMs:10,intervaloMs:1,reinicioMs:1,spawn:spawnFalso});
  assert.equal(r.fase,'pronto');assert.equal(r.respostaId,'nova');assert.equal(envios,2);
  assert.deepEqual(chamadas,[['agente','reiniciar',p.slug]]);
});
test('reinício que falha vira mensagem clara',async t=>{
  const {web}=await cenario(t);await web.login();await web.c.post('/api/v1/onboarding',{json:pedido});
  const p=loja(web.dados).ler(pedido.id);const {EventEmitter}=require('node:events');
  const faux={...web.web,registro:{obter:()=>({slug:p.slug,tipo:'agente'})},conversa:{enviar:async()=>({status:200,corpo:{ep_enviado:100}}),thread:async()=>({msgs:[]})}};
  const spawnFalso=()=>{const e=new EventEmitter();setImmediate(()=>e.emit('exit',1));return e;};
  await assert.rejects(executar('testar',pedido.id,{web:faux,esperaMs:5,intervaloMs:1,reinicioMs:1,spawn:spawnFalso}),/reiniciar o seu agente/);
});

test('pedido corrompido não derruba a lista nem o chat dos agentes',async t=>{
  const {web}=await cenario(t);await web.login();
  const db=loja(web.dados);db.gravar({...pedido,criado:new Date().toISOString(),fase:'solicitado'});
  fs.writeFileSync(db.arquivo(pedido.id),'json-interrompido');
  assert.equal((await web.c.get('/api/v1/onboarding')).status,500);
  assert.equal((await web.c.get('/api/v1/agents')).status,200);
  assert.equal((await web.c.get('/a/admin')).status,200);
});
