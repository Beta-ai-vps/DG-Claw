# Conversa no DG Claw v1

O chat do navegador é o ponto de entrada do DG Claw. Depois de entrar com usuário e senha,
o dono abre a conversa do Admin em `/a/admin` ou escolhe um agente no menu à esquerda.

## Como uma mensagem chega

1. O navegador envia o texto ou anexo para a API autenticada do Web.
2. O Web localiza o agente no registro e encaminha a mensagem ao runner correspondente.
3. O runner entrega a mensagem à sessão Claude Code ou Codex do agente.
4. O agente responde pelo MCP dgchat. O Web acompanha o registro e apresenta a resposta.
5. A conexão de eventos do navegador atualiza a conversa e o estado do agente.

Uma conexão aberta com o painel não significa que o agente está disponível. O cabeçalho
mostra **agente sem sinal** quando o runner não responde. Durante o envio, a gravação de áudio
ou outras ações, ele informa o andamento da ação em curso.

## Admin e primeiro agente

O Admin é a sessão administradora do servidor. O botão **Quero criar meu primeiro agente**
inicia a conversa e o formulário reúne as escolhas do dono. O Admin executa a criação e
acompanha a conexão da assinatura. Uma resposta real de teste libera a apresentação final.

O [fluxo do primeiro agente](../web/docs/PRIMEIRO-AGENTE.md) descreve os estados, o formulário,
a foto e a apresentação com movimento reduzido.

## Conversa, arquivos e visuais

O chat apresenta mensagens, anexos, arquivos e visuais interativos conforme os recursos
habilitados. Os arquivos passam pelas rotas autenticadas do Web. Um visual pode oferecer
botões que enviam uma escolha para a conversa; isso exige a interação da pessoa.

Telegram e outros canais são opcionais. A instalação inicial funciona pelo chat do painel,
sem configurar um bot. O histórico disponível depende dos registros da sessão e das conexões
habilitadas no agente.

## Componentes

| Componente | Responsabilidade |
| --- | --- |
| `web/server.js` | API autenticada, páginas e encaminhamento |
| `web/lib/` | Registro, conversa, mídia e serviços do Web |
| `web/public/conversa.js` | Interface do chat e eventos |
| `runner/` | Sessões dos provedores |
| `scripts/dgchat-mcp/` | Respostas e anexos enviados pelos agentes |

O botão **Tutorial** explica a interface. A [arquitetura](ARQUITETURA.md) descreve os serviços
instalados e a separação entre Admin e agentes.
