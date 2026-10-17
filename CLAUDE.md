# DG Claw: estrutura do repositório

O DG Claw instala um painel web com chat, um Admin e a infraestrutura para agentes de trabalho
em containers separados. O [README](README.md) apresenta o produto e o [INSTALAR.md](INSTALAR.md)
contém o procedimento de instalação.

## Componentes

| Caminho | Conteúdo |
| --- | --- |
| `install.sh`, `lib/` | Instalador e funções de administração |
| `bin/dgclaw` | CLI de administração dos agentes |
| `runner/` | Execução de sessões Claude Code e Codex |
| `web/` | Interface web, autenticação e chat |
| `panel/` | Configurações e recursos de cada agente |
| `container/` | Imagem dos agentes |
| `templates/` | Arquivos iniciais do Admin e dos agentes |
| `skills/` | Recursos e roteiros dos agentes |
| `docs/` | Documentação do produto |
| `tests/` | Testes automatizados |

A [arquitetura](docs/ARQUITETURA.md) descreve o funcionamento e os limites entre os componentes.
`tests/rodar.sh` executa as baterias automatizadas. Os testes do instalador usam uma raiz temporária
(`DGCLAW_RAIZ`) e substitutos dos comandos do sistema.

## Contexto de uso

- **Onde o repositório é clonado.** O caminho normal é clonar o DG Claw direto na VPS em que ele vai
  rodar e instalar ali mesmo, com `sudo ./install.sh`. A pasta clonada na VPS é, portanto, a
  instalação de destino, e não uma cópia de desenvolvimento.
- **Quem instala.** Na maioria dos casos é uma pessoa que não é programadora, seguindo uma aula ou o
  [COMO-INSTALAR.md](COMO-INSTALAR.md) com a ajuda do próprio Claude Code ou Codex no terminal da VPS.
- **GitHub.** O repositório é público. O clone funciona com `git` puro, sem `gh` e sem login no
  GitHub; o `gh` só aparece dentro da imagem dos agentes, para quem quiser publicar código depois.
- **Por que o Admin roda como root.** O Admin é a peça que instala, atualiza, cria e conserta os
  agentes, e isso exige mexer em serviços, containers e firewall do servidor. Ele roda como root
  justamente para que a pessoa resolva tudo conversando pelo painel, sem precisar voltar ao
  terminal. Em contrapartida, só o dono do painel fala com ele, e ele não lê e-mail, não abre links
  de terceiros e não tem canal externo.
- **Os agentes de trabalho não rodam como root.** Os agentes que a pessoa cria (e que conversam com o
  mundo por WhatsApp, Telegram, e-mail e navegador) ficam em containers sem root, sem acesso ao
  servidor nem aos vizinhos. O [SEGURANCA.md](docs/SEGURANCA.md) detalha essa separação.
- **Versão.** A v1.0.0 é a versão publicada e em uso. Os testes de instalação completa da equipe
  rodam em VPS separadas, conforme o [roteiro de QA](web/docs/QA-PRIMEIRO-AGENTE.md); isso não muda
  nada para quem instala na própria VPS.
