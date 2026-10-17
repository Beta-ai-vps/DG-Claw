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
(`DGCLAW_RAIZ`) e substitutos dos comandos do sistema. A prova de instalação completa usa uma VPS
de teste separada, conforme o [roteiro de QA](web/docs/QA-PRIMEIRO-AGENTE.md).
