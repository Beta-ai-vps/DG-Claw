# Como instalar o DG Claw

## Instalação no servidor e primeiro agente pelo painel

Em uma VPS Ubuntu 22.04 ou 24.04, com acesso root, pelo menos 2 GB de RAM e 15 GB livres,
prepare Claude Code ou Codex e entre na sua assinatura. O Admin reutiliza esse login no root; a assinatura
é necessária para o Admin conversar.

O repositório é público. Execute estes três comandos no terminal da própria VPS onde o DG Claw vai
rodar:

```sh
git clone https://github.com/DGatoM/DG-Claw
cd DG-Claw
sudo ./install.sh --usuario admin
```

Escolha a senha do painel quando o instalador pedir, com pelo menos 12 caracteres. Espere o final.
Ele mostra o **link do painel**, **usuário**, **senha** e a frase **“Daqui pra frente é pelo painel”**.
Guarde o acesso. A senha serve para entrar no DG Claw, não é a senha da sua conta Claude.

Abra o link no navegador. Entre e você estará no card **Admin**:

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

Repetir o instalador sem informar uma senha nova mantém a anterior. Nesse caso, ele informa que a
senha foi mantida, porque só o hash fica guardado. Os detalhes da instalação estão em [INSTALAR.md](INSTALAR.md).
O contrato do fluxo e a origem dos estados estão em `web/docs/PRIMEIRO-AGENTE.md`.
