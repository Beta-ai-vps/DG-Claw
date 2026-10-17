# Como instalar o DG Claw

## Instalação no servidor e primeiro agente pelo painel

Em uma VPS Ubuntu 24.04 ou 22.04 (o 26.04 também instala, com um aviso), com acesso root, pelo menos 2 GB de RAM e 15 GB livres,
prepare Claude Code ou Codex e entre na sua assinatura. O Admin reutiliza esse login no root; a assinatura
é necessária para o Admin conversar.

O repositório é público. Execute estes três comandos no terminal da própria VPS onde o DG Claw vai
rodar:

```sh
git clone https://github.com/DGatoM/DG-Claw
cd DG-Claw
sudo ./install.sh --usuario admin --com-imagem
```

O instalador não pede senha. Espere o final: ele mostra o **link do painel**, o **usuário**, um
**link de primeiro acesso** e a frase **“Daqui pra frente é pelo painel”**. A senha nunca aparece no terminal.

Abra o **link de primeiro acesso** no navegador. Ele vale por 30 minutos e funciona uma única vez. Nele
você cadastra a sua senha (pelo menos 12 caracteres) e já entra no chat do **Admin**. Essa senha serve
para entrar no DG Claw, não é a senha da sua conta Claude. Se o link expirar, gere outro com
`sudo dgclaw primeiro-acesso`.

Se estiver instalando pelo Claude Code ou pelo Codex, ele roda `sudo ./install.sh --usuario admin --com-imagem`
sem senha nenhuma e mostra os dois links no fim. Ele não pergunta a senha no chat.

Já no card **Admin**:

1. Toque em **Quero criar meu primeiro agente** e diga o nome dele.
2. Preencha a função e o tom da conversa. Se quiser, suba uma foto ou gere um avatar ilustrado.
3. Toque em **Criar meu agente**. O Admin prepara o agente e a tela acompanha as etapas reais.
4. Quando aparecer **Conectar minha assinatura**, abra o painel do agente e use **Entrar com a
   assinatura**, na aba Status. Volte ao Admin e toque em **Já entrei. Pode testar.**
5. Depois que o agente responder ao teste, a caixa abre e aparece a badge com seu nome e sua foto,
   ou um avatar neutro. Toque nela para começar a conversa.

O botão **Tutorial** e os `?` explicam cada parte. No iPhone com **Reduzir Movimento**, a apresentação
é curta e mantém o cartão de boas-vindas. Se uma etapa falhar, o Admin continua na mesma conversa
para explicar e resolver. Não repita a instalação nem crie outro agente para contornar a falha.

Repetir o instalador em uma máquina que já tem senha mantém a senha atual, porque só o hash fica
guardado. Para trocar a senha, rode `sudo dgclaw senha`. Para receber um link novo de primeiro acesso,
rode `sudo dgclaw primeiro-acesso` (ou `sudo ./install.sh --novo-primeiro-acesso`; a senha antiga vale até o
link ser usado). Os detalhes da instalação estão em [INSTALAR.md](INSTALAR.md).
O contrato do fluxo e a origem dos estados estão em `web/docs/PRIMEIRO-AGENTE.md`.
