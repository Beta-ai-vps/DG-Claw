---
name: mesa
description: Registra o seu trabalho na Mesa de tarefas do DG Claw Web, a tela em que o dono vê o que cada agente está fazendo, quanto falta, o que travou e o que espera por ele. Use quando o dono perguntar "o que você está fazendo?", "como está a tarefa?", "acompanha isso", "põe na mesa", "cria uma tarefa", "dá como concluído", "pode concluir", "/dgclaw:mesa", e SEMPRE que for começar um trabalho de verdade (conteúdo, desenvolvimento, projeto, levantamento de várias etapas), travar nele, precisar de uma decisão do dono ou terminá-lo. Usa o comando dgclaw-mesa, que fala com o Web pela caixa do agente.
user-invocable: true
---

# /dgclaw:mesa: o seu trabalho na mesa do dono

A Mesa fica em `/mesa` no DG Claw Web. Você cria, atualiza e conclui as suas tarefas pelo
comando `dgclaw-mesa`. O dono acompanha pela tela e também mexe: responde o que você
perguntou, conclui, cancela ou cria uma tarefa para você.

## Quando criar uma tarefa

1. **Pedido rápido não vira tarefa.** Responder, mandar um arquivo, conferir algo em dois
   minutos: só faça.
2. **Trabalho de verdade vira tarefa ANTES de começar.** Conteúdo, desenvolvimento, projeto,
   levantamento de várias etapas. Delegou a outra sessão? A tarefa continua sua.
3. **Na dúvida, pergunte ao dono:** "quer que eu acompanhe isso na mesa?".
4. **Atualize enquanto trabalha** (`progresso`, `passos` ou `nota`). Tarefa em `fazendo` sem
   nenhuma atualização há 45 minutos aparece como "parada?".
5. **Travou ou precisa do dono? Diga.** `travar` e `pedir` exigem `--motivo` e vão para o topo da
   mesa. `pedir` também avisa o aparelho do dono.
6. **O dono respondeu na conversa?** Atualize a tarefa no mesmo turno: `retomar` com a resposta
   em `--nota`. Autorizar a execução não é o mesmo que concluir.
7. **Terminou, conclua**, com `--link` quando houver.

Guarde o `id` de cada tarefa na working-memory, junto da pendência.

## O comando

Use o primeiro que existir: `dgclaw-mesa` no PATH, senão `/opt/dgclaw/app/bin/dgclaw-mesa`,
senão `${CLAUDE_PLUGIN_ROOT}/bin/dgclaw-mesa`. Você não passa endereço nem chave.

```bash
dgclaw-mesa criar --titulo "Roteiro do reels" --origem "Dono, 05/10 15h42: faz o roteiro" \
  --tipo conteudo --passo pesquisa --passo roteiro --passo revisão
# tarefa #12 criada (fazendo) "Roteiro do reels"
dgclaw-mesa atualizar 12 --progresso 60 --nota "escrevendo o gancho"
dgclaw-mesa passo 12 1                 # marca o passo 1 (ou pelo texto); --desfazer desmarca
dgclaw-mesa pedir 12 --motivo "gancho A ou B? mandei os dois na conversa"
dgclaw-mesa travar 12 --motivo "a API do Instagram caiu"
dgclaw-mesa retomar 12 --nota "dono escolheu o B"
dgclaw-mesa concluir 12 --link "https://..."
dgclaw-mesa cancelar 12 --motivo "o dono desistiu"
dgclaw-mesa vivo 12                    # sinal de vida, sem mudar nada
dgclaw-mesa ver 12                     # a tarefa com o histórico
dgclaw-mesa listar                     # as minhas abertas e as de hoje
dgclaw-mesa listar --todos             # a mesa inteira
dgclaw-mesa listar --dia todos         # inclui as fechadas de qualquer dia (ou AAAA-MM-DD)
```

- `--origem` é o pedido em uma linha, **com a data** ("Dono, 05/10 15h42: ..."). `--tipo`:
  `conteudo`, `desenvolvimento`, `projeto` ou `outro`.
- `atualizar --passo` **troca a lista inteira** de passos. Para marcar um só, use `passo`.
- Qualquer subcomando aceita `--json` para ver a resposta crua.
- Progresso sem medida aparece como "sem medida" (não é zero). Só informe `--progresso` quando souber.
- `listar --retrato` lê a última cópia que o Web deixou (sem chamar o Web) e avisa a data dela.
  Serve quando o Web está fora do ar.

## Quando o comando falha

| Saída | O que fazer |
| --- | --- |
| 1 | Erro no que você digitou (id que não é número, falta `--motivo`). A mensagem diz o que corrigir |
| 2 | O Web não respondeu. Espere um minuto e tente de novo. Não insista em laço |
| 3 | A caixa do agente não está disponível. Conte ao dono: ele precisa rodar `sudo dgclaw agente reparar <seu-slug>` |
| 4 | O Web recusou o pedido. A frase do erro (e os campos) saem no stderr: corrija e repita. `403` é tarefa de outro agente |
| 5 | Erro do lado do Web. Tente de novo em instantes; se continuar, conte ao dono com a frase do erro |

Nunca finja que atualizou a mesa: se o comando falhou, diga ao dono.

## O recado "[Mesa] ..."

Quando o dono mexe numa tarefa sua pela tela, o Web manda à sua sessão um recado que começa com
`[Mesa]`, por exemplo `[Mesa] O dono respondeu na tarefa #12 "Roteiro...": nota "pode usar o gancho B"`.
Leia a tarefa com `dgclaw-mesa ver <id>` e siga o que ele pediu. Não responda ao recado em
voz alta no chat, a não ser que haja o que dizer.

## API crua (o que o comando não cobre)

Use o `dgclaw-api` (a caixa do agente). Rotas em `GET /api/v1/tarefas/docs.md`.

```bash
dgclaw-api GET /api/v1/tarefas/docs.md
# anexos: acrescenta links ao fim (URL repetida só troca o rótulo)
dgclaw-api PATCH /api/v1/tarefas/12 '{"anexos_add":[{"rotulo":"Planilha","url":"https://..."}]}'
dgclaw-api PATCH /api/v1/tarefas/12 '{"anexos_remover":["https://..."]}'
```

Conflito entre duas escritas: a tarefa traz o campo `versao`. Mande `"se_versao": "<versao>"` no
corpo do `PATCH` ou do `DELETE`; se a tarefa mudou desde então, volta `412` com a tarefa atual e
nada é gravado. Leia de novo com `dgclaw-mesa ver <id>` e refaça.
