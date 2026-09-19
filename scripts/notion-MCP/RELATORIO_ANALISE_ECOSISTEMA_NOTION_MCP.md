# Análise e evolução do ecossistema `scripts/notion-MCP`

**Data:** 17/09/2026  
**Escopo:** auditoria exclusivamente do diretório `C:\dev\orquestrador-mvp\scripts\notion-MCP`.  
**Status:** análise e proposta; nenhuma alteração no MCP, no Notion, no Pipeline ou no `_kit-ux-meta`.

> **Limitação de inventário.** A primeira tentativa de varredura recursiva atravessou `node_modules`, permaneceu sem saída e terminou com código 137. Para não repetir uma operação pesada no mount, foi usado um inventário seguro dos 31 arquivos de primeiro nível, com leitura direta dos arquivos relevantes e inspeção dos manifestos/arquivos essenciais dentro dos três `.mcpb`. `node_modules` foi tratado como dependência instalada, não como fonte de código do projeto.

## 1. Resumo executivo

Hoje, `scripts/notion-MCP` é um **MCP local read-only empacotado para Notion**, acompanhado por scripts de descoberta, migração, validação e geração de manifestos. A estrutura contém uma implementação runtime relativamente pequena e um histórico operacional mais amplo, que registra a evolução de uma consulta única do Estado Atual para cinco Data Sources: Estado Atual, Pipeline, Parking Lot, Lessons Learned e AI Partner Ecosystem.

O núcleo atual é claro: `server.js` usa o SDK MCP via stdio, autentica com `NOTION_API_KEY`, consulta Data Sources por IDs fornecidos no ambiente e expõe cinco ferramentas read-only. O `manifest.json` V3.0.0 declara as mesmas cinco configurações e o `README mcpbV3.md` documenta o processo de empacotamento.

O entorno, porém, está menos organizado que o runtime. Há **13 scripts auxiliares** misturando captura, descoberta, migração, correção de manifesto, atualização de dados, inspeção privada e testes. Algumas famílias têm versões duplicadas ou sucessivas, principalmente `check-last-row.cjs`/`check-last-row-v2.cjs` e `get-only-parking-lessons.cjs`/`get-only-parking-lessons-v2.cjs`. A diferença entre versões é compreensível historicamente, mas não está registrada em um catálogo de scripts nem em uma matriz de “canônico versus legado”.

A recomendação é preservar a V3 como artefato operacional e evoluir primeiro a **documentação e a rastreabilidade**, sem reorganização física imediata. O próximo passo de baixo risco seria separar conceitualmente runtime, scripts de diagnóstico, scripts de migração, contratos, documentação e distribuição. Uma migração física para `src/`, `scripts/`, `contracts/`, `docs/`, `archive/` e `dist/` só deveria ocorrer após confirmar o caminho de empacotamento no ambiente real.

## 2. Inventário atual

### 2.1 Contagem no primeiro nível

Foram encontrados 31 arquivos de primeiro nível, totalizando aproximadamente 9,90 MB. O inventário seguro identificou:

| Tipo | Quantidade | Função predominante |
|---|---:|---|
| `.cjs` | 13 | Captura, descoberta, migração, validação e correção |
| `.js` | 4 | Runtime MCP e testes/listagem |
| `.json` | 6 | Manifestos, contratos, inventários e configuração exemplo |
| `.mcpb` | 3 | Distribuições empacotadas V1, V2 e V3 |
| `.md` | 2 | README geral e README V3 |
| `.env` | 1 | Configuração local sensível |
| `.env.example` | 1 | Modelo mínimo de configuração |
| `.gitignore` | 1 | Exclusão de segredos, dependências e temporários |
| **Total** | **31** | — |

Além dos arquivos de primeiro nível, existe `node_modules/`. Ele não foi contado como código autoral do projeto nesta auditoria, pois a tentativa de atravessá-lo recursivamente causou o bloqueio ambiental. Os MCPBs carregam dependências dentro do pacote: os artefatos V1 e V2 têm 2.202 entradas internas, e o V3 tem 2.214 entradas internas.

### 2.2 Distribuições `.mcpb`

| Artefato | Tamanho | Entradas internas | Versão do manifesto | Escopo declarado |
|---|---:|---:|---:|---|
| `anti-jegue-notion-readonly-1.0.0.mcpb` | 3.255.796 bytes | 2.202 | 1.0.0 | Estado Atual, uma ferramenta/configuração principal |
| `anti-jegue-notion-readonly-2.0.0.mcpb` | 3.257.349 bytes | 2.202 | 2.0.0 | Cinco bases, incluindo Parking, Lessons e Ecosystem |
| `anti-jegue-notion-readonly-3.0.0.mcpb` | 3.273.994 bytes | 2.214 | 3.0.0 | Cinco Data Sources; Parking/Lessons com quatro colunas simples |

Hashes observados:

- V1: `3615e6c6495b18c3e9cf00dec959774223888ee7e08ef31f9c8ab44b3aa6606f`
- V2: `83f93812731d3697f1b2de147a81001e6624f434668e784ae3499c67455d711e`
- V3: `0e0dafcd8a0f911b4a379a1b4ee83fcb2b6af893edcb2f6c9ccd5555002677c7`

A V3 é a distribuição mais recente observada no diretório e contém os scripts auxiliares atuais junto do runtime. Isso a torna o candidato natural a artefato canônico de distribuição, mas a confirmação final deveria ser feita pelo responsável pelo deploy/uso no Claude Desktop.

### 2.3 Arquivos de runtime e contrato

- `server.js`: servidor MCP V3 via stdio, com cinco ferramentas read-only.
- `manifest.json`: manifesto V3.0.0, `manifest_version` 0.3, configurações do usuário e entry point.
- `package.json`/`package-lock.json`: dependências de MCP SDK, Notion SDK, dotenv e zod.
- `notion-read-contract.json`: contrato de leitura do Estado Atual.
- `claude-desktop-config.example.json`: exemplo de conexão local ao servidor.
- `README.md`: documentação original da versão de uma base.
- `README mcpbV3.md`: documentação operacional da versão V3.

### 2.4 Scripts auxiliares por função

#### Captura e descoberta

- `capture-v3-fix.cjs`: busca Data Sources visíveis, classifica títulos e imprime IDs para o `.env`; detecta IDs duplicados.
- `list-notion-keys.js`: lista Data Sources e databases compartilhados com a integração.
- `get-only-parking-lessons.cjs`: primeira tentativa de localizar Parking Lot e Lessons Learned.
- `get-only-parking-lessons-v2.cjs`: versão mais robusta, recupera o título real com `dataSources.retrieve` e prioriza bases `NEW` com a coluna `Atualizado em`.
- `check-private.cjs`: inspeção de páginas/objetos privados e Data Sources.

#### Validação

- `check-last-row.cjs`: localiza databases por título, obtém Data Source e consulta a última linha.
- `check-last-row-v2.cjs`: versão adaptada à busca direta de Data Sources e ao schema V3.
- `test-notion.js`: teste mínimo.
- `test-direct-notion.js`: teste direto mais completo da API.

#### Migração e transformação

- `transform-to-datasource-v2.cjs`: lê blocos de páginas antigas, cria databases `NEW` com campos intermediários e popula registros.
- `transform-to-datasource-v3-simple.cjs`: reduz o schema para `Item | Notas | Data | Atualizado em` e cria novas bases simples.
- `map-lessons-parking.cjs`: inventaria blocos de Lessons e Parking e salva amostras/contagens.

#### Geração/correção de distribuição e ambiente

- `fix-existing.cjs`: localiza databases `NEW` e tenta complementar propriedades.
- `fix-v3.cjs`: monta o manifesto V3 a partir do `.env` atual.
- `update-env-v3.cjs`: atualização relacionada ao ambiente V3.
- `update-d17-concluida.cjs`: alteração de um registro específico do Estado Atual.

A classificação acima é funcional. O diretório ainda não expressa essa separação fisicamente.

## 3. Como o `notion-MCP` está sendo usado

O fluxo de runtime documentado é:

```text
Claude Desktop ou outro cliente MCP
        ↓ stdio
server.js
        ↓ @notionhq/client
Notion API / dataSources.query
        ↓
Data Sources do workspace
```

O uso atual é predominantemente read-only. O `server.js` não registra ferramentas de criação, edição ou exclusão. Ele normaliza propriedades para objetos JSON e inclui `_id` e `_url` para rastreabilidade.

As cinco ferramentas declaradas no runtime V3 são:

| Ferramenta | Fonte | Filtros/sorts observados |
|---|---|---|
| `get_current_state` | Estado Atual | `Data` descendente; limite 1–100 |
| `get_pipeline` | Pipeline | filtro por `Prioridade` e `Status`; limite 1–100 |
| `get_parking_lot` | Parking Lot | `Atualizado em` e `Data` descendentes |
| `get_lessons_learned` | Lessons Learned | `Atualizado em` e `Data` descendentes |
| `get_partner_ecosystem` | AI Partner Ecosystem | consulta genérica; limite 1–100 |

O manifesto passa os IDs via `user_config`, evitando gravar IDs diretamente no código do runtime. O `.env` local contém credenciais e IDs reais, e o `.gitignore` exclui esse arquivo.

## 4. Padrões de evolução V1 → V2 → V3

### V1 — uma base e contrato mínimo

A distribuição V1 declara uma ferramenta e duas configurações: chave da API e ID do Estado Atual. O README original confirma o princípio inicial: começar com uma leitura simples antes de adicionar outras bases, escrita ou automações.

**Resultado aparente:** um MCP pequeno, com escopo controlado e contrato explícito.

### V2 — expansão para cinco bases

A V2 declara cinco IDs e amplia o escopo para Pipeline, Parking Lot, Lessons Learned e AI Partner Ecosystem. O surgimento de `fix-existing.cjs`, scripts de inspeção e `test-direct-notion.js` indica que a expansão trouxe problemas de descoberta, schema e configuração.

**Resultado aparente:** maior cobertura funcional, mas com dependência de IDs corretos, compartilhamento manual e compatibilidade entre databases e Data Sources.

### V3 — migração para Data Sources e simplificação de schema

A V3 adiciona captura por `search` filtrado em `data_source`, validação por consulta direta e scripts para transformar páginas antigas em bases `NEW`. Parking Lot e Lessons Learned passam a usar quatro propriedades: `Item`, `Notas`, `Data` e `Atualizado em`.

A motivação é observável nos scripts: a versão antiga procurava databases e páginas; a V3 trabalha com `dataSources.retrieve` e `dataSources.query`. A transformação simples abandona campos intermediários da V2 e reduz a superfície de incompatibilidade.

**Resultado aparente:** runtime mais coerente com a API atual e schema menor para as duas bases migradas. O custo foi acumular scripts de transição e manter IDs/nomes históricos no diretório.

## 5. MCP/Notion API — o que funcionou e o que não funcionou

### 5.1 Confirmado como funcionando no código

- O runtime usa `McpServer`, `StdioServerTransport`, `Client` do Notion e `zod`.
- O manifesto usa `manifest_version: 0.3`, entry point `server.js` e configuração sensível para a chave.
- O runtime tem cinco ferramentas registradas.
- Os limites de consulta são restringidos a intervalos finitos.
- O helper `getPropValue` suporta title, rich_text, select, status, date, number, checkbox e people.
- `normalizePage` trata variações de nomes de propriedades para o Estado Atual.
- `normalizeGeneric` preserva propriedades genéricas do Pipeline, Parking, Lessons e Ecosystem.
- Erros de cada ferramenta retornam `isError: true` e mensagem no conteúdo MCP.
- O runtime não registra operações de escrita.
- O V3 inclui detecção de presença das cinco variáveis no boot, sem imprimir os valores.

### 5.2 Confirmado por evidência operacional anterior

- O endpoint de busca da API respondeu HTTP 200.
- Consultas diretas a Estado Atual, Pipeline e AI Partner Ecosystem responderam HTTP 200 com limite 1.
- O problema de `/users` 403 é específico da restrição do Personal Access Token para listar usuários, não prova de token totalmente inválido.
- A captura original `capture-v3-fix.cjs` ficou sem resposta em uma execução anterior, enquanto uma rota HTTP nativa read-only respondeu.
- Parking Lot e Lessons Learned não estavam disponíveis para aquela integração em uma execução anterior; o relatório correspondente tratou isso como bloqueio de compartilhamento/visibilidade, não como causa única comprovada.

### 5.3 Fragilidades observadas

- A execução de `capture-v3-fix.cjs` depende de uma chamada ampla e sequencial a `search`; uma resposta lenta ou SDK travado deixa pouca evidência intermediária.
- O script captura IDs por heurística de texto em dumps JSON. Isso é útil como diagnóstico, mas pode classificar incorretamente bases com títulos ambíguos.
- `server.js` aceita IDs alternativos de ambiente, mas o manifesto oferece apenas os nomes principais. Essa tolerância é útil para migração, porém pode esconder configuração inconsistente.
- `get_pipeline` monta filtros com `query.filter` e depois substitui o campo por uma combinação. O comportamento é legível, mas deveria ser coberto por teste para evitar regressão de filtros compostos.
- Parking e Lessons fazem sort por `Atualizado em`. Se uma base antiga, view ou Data Source sem essa propriedade for configurada, a consulta pode falhar.
- O manifesto marca cinco IDs como `required: false`, embora o runtime ofereça as cinco ferramentas. Isso permite instalar uma configuração parcialmente funcional sem declarar claramente quais ferramentas ficarão bloqueadas.
- O `.env.example` documenta apenas a API key e o Estado Atual, embora a V3 precise de cinco IDs para funcionamento completo.
- `server.js` loga no boot se variáveis estão presentes e imprime IDs durante consultas. Isso não expõe a chave, mas pode revelar IDs em logs locais; a política deveria ser explícita.
- A documentação V3 contém IDs de exemplo/produção e descreve o estado de migração, mas não apresenta uma tabela de compatibilidade por versão.

### 5.4 Hipóteses

- A multiplicação de scripts V2 ocorreu porque a API atual e o modelo Data Source tornaram insuficiente a estratégia baseada em database/page. Isso é fortemente sugerido pelos imports e chamadas, mas o motivo humano exato não está documentado.
- Parte dos timeouts pode estar relacionada a comportamento do SDK, rede ou mount, e não necessariamente ao Notion. A evidência anterior separa o problema de conectividade geral da rota original, mas não isola a causa interna do SDK.
- A configuração de cinco bases como opcional provavelmente foi escolhida para permitir instalação incremental. O arquivo não registra essa decisão; portanto, deve ser tratada como hipótese.

## 6. Problemas de organização

### 6.1 Runtime e ferramentas de manutenção no mesmo nível

`server.js`, `manifest.json`, scripts de migração, scripts de inspeção e distribuição `.mcpb` coexistem na raiz. Isso facilita executar comandos rápidos, mas dificulta responder qual arquivo é necessário para:

- rodar o MCP;
- validar o MCP;
- migrar dados;
- gerar uma nova distribuição;
- investigar uma base não compartilhada;
- reproduzir uma versão histórica.

### 6.2 Falta de catálogo de scripts

Não há uma tabela única com nome, categoria, entrada, efeitos, dependências, risco e status canônico. O usuário precisa inferir a finalidade a partir do nome e do código.

### 6.3 Falta de separação entre leitura e escrita auxiliar

Embora o runtime seja read-only, alguns auxiliares têm operações de escrita:

- `transform-to-datasource-v2.cjs` cria bases e páginas;
- `transform-to-datasource-v3-simple.cjs` cria e popula bases;
- `update-d17-concluida.cjs` atualiza um registro;
- `fix-existing.cjs` parece voltado a alteração/complementação de estrutura.

Esses scripts não estão marcados no nome como `WRITE`, `MIGRATION` ou `DESTRUCTIVE/REVERSIBLE`. Isso é um risco operacional para quem executa o diretório por engano.

### 6.4 Ambiente de exemplo incompleto

`.env.example` tem apenas duas chaves. Para V3, deveria documentar todas as seis variáveis sem valores reais, incluindo os quatro IDs adicionais.

### 6.5 Artefatos gerados não estão em `dist/`

Os três `.mcpb` ficam na raiz e não há indicação de qual foi gerado pelo último build, qual está publicado e qual é apenas histórico.

### 6.6 Dependências pesadas dentro do pacote

Os MCPBs carregam centenas/milhares de entradas de dependências. Isso explica boa parte do tamanho de aproximadamente 3,2 MB por pacote e torna inventários recursivos, diffs e cópias mais caros.

## 7. Duplicações e redundâncias

### 7.1 `check-last-row.cjs` versus `check-last-row-v2.cjs`

A versão original localiza databases por título com `notion.search`, recupera o database e extrai o primeiro Data Source. A V2 busca diretamente objetos `data_source`, chama `dataSources.retrieve`, procura títulos por inclusão e consulta a última linha.

**Classificação:** V2 é o candidato canônico para o schema atual; a versão original deve ser preservada como histórico ou teste de compatibilidade, não executada como padrão.

### 7.2 `get-only-parking-lessons.cjs` versus V2

A versão original filtra resultados de search usando o dump do objeto. A V2 recupera cada Data Source, usa o título real, verifica propriedades e prioriza bases `NEW` com `Atualizado em`.

**Classificação:** V2 é o diagnóstico preferencial para a estrutura atual. A versão original é útil para documentar a tentativa inicial e possíveis ambientes antigos.

### 7.3 Transformações V2 versus V3 simples

A V2 cria oito propriedades, incluindo Categoria, Prioridade, Status e TipoOriginal. A V3 simples reduz para quatro propriedades e é alinhada ao README V3 para Parking/Lessons.

**Classificação:** são estratégias distintas, não duplicatas exatas. V2 é uma migração enriquecida; V3 é uma migração minimalista. A escolha deve ser documentada por cenário.

### 7.4 Três MCPBs

Os pacotes não são duplicatas sem valor: representam V1, V2 e V3. Contudo, manter todos na raiz sem uma política de retenção gera ambiguidade.

**Classificação recomendada:** V3 como distribuição atual; V1/V2 em arquivo histórico somente leitura, com hashes e data de retenção. Não apagar antes de confirmar que nenhum cliente ainda usa V1 ou V2.

### 7.5 Manifestos e geradores

`manifest.json` é o manifesto atual. `fix-v3.cjs` é um gerador que o sobrescreve. Isso cria risco de divergência: editar o manifesto manualmente não atualiza o gerador, e executar o gerador pode substituir campos documentados depois.

## 8. Ativos reutilizáveis identificados

### Alto potencial

| Ativo | Evidência de reutilização | Recomendação |
|---|---|---|
| `server.js` V3 | Cinco ferramentas, normalização genérica, limites e erros MCP | Template read-only para projetos Notion+MCP |
| `manifest.json` V3 | Configuração MCPB 0.3, `user_config`, entry point Node | Template de manifesto, após remover nomes/IDs do projeto |
| `capture-v3-fix.cjs` | Descoberta de Data Sources, classificação e alerta de duplicatas | Ferramenta genérica de bootstrap/diagnóstico |
| `check-last-row-v2.cjs` | Valida título, propriedades e consulta `limit:1` | Smoke test de Data Source |
| `notion-read-contract.json` | Contrato explícito de campos read-only | Modelo de contrato por recurso |
| `README mcpbV3.md` | Processo `npm ci`, validação e `mcpb pack` | Runbook de release, após separar fatos específicos |
| `.env.example` | Protege contra inclusão de segredo | Template ampliado para configuração segura |

### Potencial médio

- `transform-to-datasource-v3-simple.cjs`: útil como migração one-shot, mas não deve ser tratado como ferramenta de rotina sem idempotência, dry-run e confirmação.
- `inventory.json`: útil como evidência de origem dos blocos, desde que tenha data, hash e fonte explícitos.
- `test-direct-notion.js`: útil para diagnóstico de rede/SDK, se receber timeout e saída estruturada.
- `get-only-parking-lessons-v2.cjs`: útil para troubleshooting de compartilhamento.

### Não classificar automaticamente como ativo

- `update-d17-concluida.cjs`, por ser específico de uma tarefa.
- `fix-existing.cjs`, até definir claramente se é diagnóstico, migração ou escrita.
- `.mcpb` antigos, enquanto não houver confirmação de consumidores.
- `.env` local, que é configuração sensível, não ativo reutilizável.

## 9. Lacunas de rastreabilidade

1. Não há ID de execução associado a cada script.
2. Não há registro de quem executou um script, quando, com qual versão de Node/SDK e contra qual workspace.
3. Não há `dry-run`/`write` explícito no nome ou argumento dos scripts que alteram Notion.
4. Não há saída JSON padronizada para captura, validação e migração.
5. Não há matriz de critérios V1/V2/V3 com `PASS`, `FAIL`, `BLOCKED` e evidência.
6. Não há catálogo de versões `.mcpb` com commit, hash, data de build e status de distribuição.
7. Não há declaração única de schema por Data Source, embora o runtime dependa de propriedades específicas para sort e normalização.
8. Não há indicação uniforme de quais IDs são Data Source IDs e quais são database/page IDs em todos os scripts.
9. O contrato formal cobre principalmente Estado Atual; as quatro ferramentas genéricas não têm contratos de propriedades equivalentes.
10. Não há política registrada para falhas de API, retries, backoff ou timeouts.
11. Não há teste automatizado do filtro composto de Pipeline.
12. Não há validação automática que impeça uma configuração com IDs duplicados ou com Data Source inexistente antes de iniciar o MCP.

## 10. Oportunidades de melhoria

### Baixo risco

- Criar `docs/SCRIPT_CATALOG.md` com categoria, efeito, entrada, saída, risco e status canônico.
- Ampliar `.env.example` com as seis variáveis do manifesto, sem valores reais.
- Adicionar ao README uma tabela V1/V2/V3 e uma seção “qual arquivo executar para cada objetivo”.
- Adicionar um comando de validação que apenas verifica presença, formato UUID e unicidade dos IDs.
- Documentar que somente `server.js` é runtime; scripts auxiliares não são carregados pelo cliente MCP.
- Marcar scripts de escrita com documentação explícita e exigir uma confirmação textual ou variável `ALLOW_WRITE=true`.

### Médio risco

- Criar contratos JSON para Pipeline, Parking, Lessons e Ecosystem, além do Estado Atual.
- Unificar captura e validação em um CLI com subcomandos `discover`, `check`, `query` e `export`.
- Implementar timeout, retry limitado e logs estruturados em scripts de diagnóstico.
- Gerar o manifesto a partir de uma fonte declarativa única, evitando `fix-v3.cjs` sobrescrever manualmente um manifesto divergente.
- Usar `npm ci` em um diretório limpo para build reproducível e registrar Node/npm/mcpb.

### Alto impacto, somente depois de validação

- Separar runtime, ferramentas de manutenção, contratos e distribuição em diretórios distintos.
- Criar pipeline de release que gere `.mcpb` em `dist/`, calcule hash e produza um relatório de release.
- Adicionar testes automatizados com mocks da Notion API para normalização, filtros, limites e erros.
- Evoluir de IDs manuais para descoberta opcional por nome, mantendo IDs fixos como fonte de verdade no ambiente de produção.

## 11. Proposta de nova arquitetura

Esta proposta não foi implementada.

```text
scripts/notion-MCP/
├── src/
│   └── server.js
├── contracts/
│   ├── estado-atual.json
│   ├── pipeline.json
│   ├── parking-lot.json
│   ├── lessons-learned.json
│   └── ecosystem.json
├── scripts/
│   ├── discover/
│   │   ├── capture-data-sources.cjs
│   │   └── list-shared-resources.js
│   ├── validate/
│   │   ├── check-config.cjs
│   │   ├── smoke-test.cjs
│   │   └── check-schema.cjs
│   ├── migrate/
│   │   ├── transform-page-to-data-source.cjs
│   │   └── update-record.cjs
│   └── release/
│       ├── generate-manifest.cjs
│       └── pack.cjs
├── docs/
│   ├── README.md
│   ├── RELEASE.md
│   ├── SCRIPT_CATALOG.md
│   ├── SECURITY.md
│   └── TROUBLESHOOTING.md
├── dist/
│   ├── anti-jegue-notion-readonly-3.0.0.mcpb
│   └── checksums.txt
├── archive/
│   ├── mcpb-v1/
│   ├── mcpb-v2/
│   └── legacy-scripts/
├── manifest.json
├── package.json
├── package-lock.json
├── .env.example
└── .gitignore
```

### Responsabilidades

- `src/`: somente runtime do MCP.
- `contracts/`: schema e propriedades esperadas por ferramenta.
- `scripts/discover/`: busca de IDs e recursos compartilhados, sem escrita.
- `scripts/validate/`: smoke tests, configuração e schema.
- `scripts/migrate/`: operações com escrita, sempre separadas e explicitamente documentadas.
- `scripts/release/`: geração de manifesto e empacotamento.
- `docs/`: uso humano e decisões.
- `dist/`: artefatos gerados e hashes.
- `archive/`: versões anteriores preservadas, não usadas como padrão.

## 12. Alternativas possíveis

### Alternativa A — Documentação e catálogo, sem mover arquivos

Manter a raiz atual, adicionar catálogo de scripts, contratos complementares e README de release.

**Vantagens:** baixo risco; preserva caminhos; não quebra o uso atual; rápida validação.  
**Desvantagens:** a mistura física permanece; versões antigas continuam visíveis.

### Alternativa B — Separação por responsabilidade

Adotar `src/`, `scripts/`, `contracts/`, `docs/`, `dist/` e `archive/`, mantendo aliases temporários se necessário.

**Vantagens:** descoberta clara, menor risco de executar migração por engano e release mais previsível.  
**Desvantagens:** pode quebrar caminhos no manifesto, no README, no Claude Desktop e em comandos de empacotamento; exige teste fora do mount.

### Alternativa C — Template genérico parametrizado

Transformar o MCP em um template de cinco recursos, com contratos declarativos e configuração por recurso.

**Vantagens:** reutilização em outros projetos Notion+MCP e menor duplicação de `get_*`.  
**Desvantagens:** risco de abstração prematura; pode esconder diferenças reais entre schemas; maior custo de testes e documentação.

### Recomendação

Adotar **Alternativa A imediatamente**, sem mudar caminhos. Depois de validar o catálogo e o release em uma nova versão, aplicar gradualmente a Alternativa B. A Alternativa C só deve ser considerada após existirem pelo menos dois projetos com necessidades semelhantes, para que a abstração seja baseada em evidência.

## 13. Trade-offs

| Escolha | Benefício | Custo/Risco |
|---|---|---|
| Manter V1/V2/V3 na raiz | Preserva histórico e compatibilidade | Ambiguidade sobre pacote canônico |
| Mover antigos para archive | Clareza operacional | Pode quebrar referências ou clientes antigos |
| IDs manuais no `.env` | Determinismo e segurança contra nome ambíguo | Exige atualização manual após migração |
| Descoberta automática por título | Onboarding facilitado | Colisão de nomes e risco de selecionar base errada |
| Cinco IDs opcionais | Instalação incremental | Ferramentas podem falhar só em runtime |
| Cinco IDs obrigatórios | Feedback imediato de configuração incompleta | Menos flexível para instalação parcial |
| Script único de diagnóstico | Menos duplicação | CLI mais complexo e maior superfície de regressão |
| Scripts separados | Simplicidade local | Duplicação de autenticação e tratamento de erro |
| Empacotar `node_modules` | Instalação portátil | Pacote maior e inventário mais pesado |
| Instalação externa de dependências | Pacote menor | Mais dependência do ambiente do cliente |

## 14. Decisões humanas necessárias

### Decisão 1 — Qual pacote é oficialmente canônico?

Opções: V1, V2, V3 ou uma nova release.

**Recomendação:** V3.0.0 como canônico atual, preservando V1/V2 como histórico até confirmar que não existem consumidores ativos.

### Decisão 2 — O MCP deve permanecer read-only?

**Recomendação:** sim. Migrações e updates devem permanecer scripts separados, nunca ferramentas MCP padrão, até haver política de aprovação e auditoria.

### Decisão 3 — As cinco bases devem ser obrigatórias?

**Recomendação:** Estado Atual obrigatório; as demais podem ser opcionais apenas se o manifesto e as ferramentas exibirem claramente `not configured`, em vez de deixar a falha aparecer como erro genérico.

### Decisão 4 — Quando arquivar V1/V2 e scripts antigos?

**Recomendação:** após registrar consumidor, hash, data e substituto de cada artefato. Não apagar durante a primeira reorganização.

### Decisão 5 — O objetivo é apenas o projeto Anti-Jegue ou um template?

**Recomendação:** primeiro estabilizar o projeto atual. Depois extrair um template sanitizado, sem nomes, IDs, tokens, URLs privadas ou regras específicas.

### Decisão 6 — Quais scripts de escrita continuam autorizados?

Deve ser decidido se transformações e updates são ferramentas permanentes ou scripts históricos de migração já encerrada.

## 15. Próximos passos sugeridos

1. Confirmar que `anti-jegue-notion-readonly-3.0.0.mcpb` é o pacote em uso.
2. Criar um catálogo de scripts sem alterar o comportamento.
3. Ampliar `.env.example` para refletir o manifesto V3.
4. Criar um check read-only de configuração: variáveis presentes, UUIDs válidos, IDs distintos e Data Sources acessíveis.
5. Documentar claramente quais scripts fazem escrita no Notion.
6. Definir a matriz V1/V2/V3 com mudanças de schema e compatibilidade.
7. Criar contratos para as quatro bases genéricas, não apenas Estado Atual.
8. Registrar para cada release: commit, data, Node, npm, versão do `mcpb`, hash e teste smoke.
9. Validar timeout/retry em um ambiente fora do mount antes de alterar a implementação.
10. Arquivar logicamente, sem apagar, scripts substituídos pelas versões V2/V3.
11. Só depois decidir sobre a separação física em `src/`, `scripts/`, `contracts/`, `docs/`, `dist/` e `archive/`.
12. Se houver segundo projeto Notion+MCP, comparar os contratos antes de criar um template genérico.

## 16. Conclusão

### O que o `scripts/notion-MCP` é hoje

É um MCP local read-only funcional em sua concepção, com runtime V3 para cinco Data Sources, três distribuições empacotadas e um conjunto de scripts históricos que documentam descoberta, migração e validação de bases Notion.

### O que deveria se tornar

Deveria se tornar uma pequena camada de integração com quatro propriedades: runtime separado dos scripts de manutenção; contratos explícitos por Data Source; release reproduzível com hash; e diagnóstico seguro com saída estruturada.

### Por quê

Porque a parte mais valiosa já existe: o padrão de leitura read-only, normalização e exposição via ferramentas MCP. O risco atual está menos na ideia do MCP e mais na manutenção: scripts de escrita misturados com runtime, versões históricas sem status canônico, configuração incompleta no `.env.example` e ausência de testes/contratos equivalentes para todas as bases.

A evolução recomendada é incremental. Primeiro documentar e catalogar; depois separar responsabilidades; por fim, se houver evidência de reutilização em outros projetos, extrair um template parametrizado.

**Nenhuma alteração no conteúdo do `scripts/notion-MCP` foi implementada nesta auditoria.**
