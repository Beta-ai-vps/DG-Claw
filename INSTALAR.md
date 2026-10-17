# Instalar o DG Claw

O resultado é um painel com endereço HTTPS, usuário e senha, aberto na conversa com o Admin.
A instalação inicial prepara esse acesso. O primeiro agente, áudio e canais são configurados depois,
pelo painel.

## Antes de começar

Uma VPS Ubuntu 22.04 ou 24.04, com acesso root, 2 GB de memória e 15 GB livres. As portas 80 e 443
precisam estar disponíveis. Claude Code ou Codex deve estar instalado e conectado à sua assinatura
no root da VPS. `--provedor claude` ou `--provedor codex` define o motor do Admin. Sem opção,
o instalador mantém a escolha anterior; em uma máquina nova, procura Claude primeiro e depois
o login do Codex. O Admin reutiliza o acesso do motor escolhido no root, sem copiá-lo aos agentes.

No terminal do Claude Code, você pode pedir:

> Baixa, analisa e instala o DG Claw: https://github.com/DGatoM/DG-Claw

Com o projeto já aberto, o pedido pode ser apenas **“instala”**. Este documento contém o procedimento
completo. A escolha do usuário e da senha do painel faz parte da instalação.

## Etapas da instalação

Esta lista permite acompanhar o trabalho e marcar cada etapa concluída. O instalador também mostra
o andamento em português, com explicações e mensagens de conclusão.

1. **Analisar as dependências.** Conferência do Ubuntu, memória, disco, portas e login do motor escolhido.
   Se algo faltar, a mensagem explica como resolver antes de continuar.
2. **Baixar o programa.** Na primeira instalação: `git clone https://github.com/DGatoM/DG-Claw`
   e `cd DG-Claw`. Quem recebeu o pacote compactado pode abrir a pasta extraída.
3. **Definir o acesso.** Escolha um usuário e uma senha de pelo menos 12 caracteres para o painel.
   Essa senha é separada da conta Claude. O comando é `sudo ./install.sh --usuario <seu-usuario>`.
   Ele pede a senha sem exibir a digitação. Para automação, recebe a senha pela entrada padrão,
   nunca por argumento. Repetir sem senha nova mantém a anterior.
4. **Instalar as bibliotecas.** Node.js executa o painel; npm instala e compila o programa do Admin;
   Caddy fornece o endereço seguro. Podman prepara a separação dos futuros agentes e ufw protege
   as portas do servidor. A instalação aproveita os componentes que já estão disponíveis.
   Áudio, navegador e construção da imagem dos agentes ficam para depois.
5. **Configurar o endereço e a proteção.** O nome da VPS na Hostinger é usado quando aponta para
   ela. Caso contrário, o instalador tenta um endereço sslip.io baseado no IP. Um domínio próprio
   pode ser informado com `--dominio painel.exemplo.com`, já apontando para o servidor.
   O Caddy solicita o certificado HTTPS e o firewall libera SSH, HTTP e HTTPS.
6. **Ligar o painel e o Admin.** O painel guarda somente o hash da senha. O Admin é uma sessão
   normal do Claude Code ou Codex, com poderes de administrador para cuidar desta VPS. Ele reutiliza a
   autenticação que já existe no root. Nenhuma credencial do root é copiada para os novos agentes.
7. **Testar o runtime.** O instalador verifica o HTTPS, o painel e o serviço que executa o Admin,
   e envia a mensagem de boas-vindas. O acesso aparece ao final com endereço, login e senha.
   O primeiro agente terá um teste próprio: a apresentação só termina quando ele responder.

A duração depende da rede e dos pacotes já instalados. `--ensaio` mostra as mudanças previstas sem
aplicá-las. `--com-imagem` adianta a construção da imagem dos futuros agentes em segundo plano;
é opcional. Sem essa opção, o Admin faz essa preparação quando você cria o primeiro agente.

## Abrir o painel

O final mostra **“Seu DG Claw está instalado e configurado em … Clique aqui para acessar”**,
seguido do login e da senha. Guarde o acesso em local privado. Daqui pra frente é pelo painel.

Abra o link e toque em **Quero criar meu primeiro agente**. O Admin pergunta o nome e o formulário
reúne função, tom e foto opcional. Você pode subir uma foto ou gerar um avatar ilustrado no navegador.
Depois, o Admin prepara o agente, orienta a conexão da sua assinatura e testa uma resposta real.
A caixa abre, apresenta seu agente e leva à conversa dele.

O botão **Tutorial** explica cada etapa. Telegram, outras conexões e áudio podem ser configurados
com o agente quando você precisar. O acesso à assinatura de cada agente é feito no painel dele.

## Se algo precisar de atenção

- **Motor sem login no root:** entre no Claude Code ou Codex, conforme a escolha, no root da VPS
  e repita a instalação.
- **Porta ocupada:** a mensagem identifica o conflito. Confira o serviço existente antes de pará-lo.
- **HTTPS não abriu:** confira se o domínio aponta para a VPS e se 80/443 estão liberadas no provedor.
- **Criação demorando:** a primeira criação também prepara a imagem dos agentes. O Admin acompanha
  a preparação; o formulário mantém suas escolhas.

A [arquitetura](docs/ARQUITETURA.md) descreve os componentes. O [README](README.md) lista os serviços,
as pastas e o procedimento para desfazer a instalação.
