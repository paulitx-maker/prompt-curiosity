# Créditos, execuções e feedback (Foto → Post)

## O que será feito

1. Três tabelas no backend: `users` (identificados por `device_id` do navegador, com créditos e gasto acumulado), `executions` (histórico de cada geração) e `feedbacks` (nota + "o que faltou").
2. O fluxo Foto → Post passa a: identificar o dispositivo, registrar a execução, descontar 1 crédito e somar o custo — tudo no servidor.
3. Na tela de resultado da aba Foto → Post: botões "Gostei ★" (nota 5) e "Deu ruim" (abre campo "O que faltou?", salva nota 1 + texto).
4. Aba Áudio, homepage e design permanecem intocados. Nenhuma tela de pagamento.

## Um ajuste de segurança que recomendo

Você pediu policies de leitura/inserção para visitantes anônimos em `users`. Como `users` guarda `device_id` e saldo, uma policy de SELECT aberta deixaria qualquer pessoa listar todos os dispositivos e créditos do app. Proposta: manter a tabela `users` fechada para o navegador e fazer o "buscar ou criar usuário" no servidor (que já tem acesso privilegiado) — o frontend continua só mandando o `device_id`. Mesma coisa para `executions`. Em `feedbacks`, o insert também vai pelo servidor, vinculado à execução recém-criada. Se você preferir literalmente o que descreveu, digo na revisão e mudo.

## Policies de RLS

RLS habilitado nas três tabelas.

- `users`: nenhuma policy para `anon`/`authenticated`. Acesso só pelo servidor (service role, que ignora RLS). Sem UPDATE pelo cliente — o decremento de créditos é exclusivamente server-side.
- `executions`: nenhuma policy para `anon`/`authenticated`. Inserção e leitura só pelo servidor.
- `feedbacks`: nenhuma policy para `anon`/`authenticated`. Inserção só pelo servidor, validando que a execução existe.

GRANTs: apenas `GRANT ALL ... TO service_role` nas três tabelas (sem grants a `anon`/`authenticated`), já que nenhum acesso passa direto pelo Data API.

## Arquivos que serão alterados/criados

| Arquivo | Mudança |
| --- | --- |
| migração SQL (nova) | cria as 3 tabelas, índices (`device_id`, `execution_id`), GRANTs e RLS conforme acima |
| `src/lib/device.ts` (novo) | gera/lê `orquestrador_device_id` no localStorage com `crypto.randomUUID()` |
| `src/lib/antijegue.functions.ts` | `postImagem` passa a receber `deviceId`; nova server fn `enviarFeedback` |
| `src/lib/antijegue.server.ts` | após gerar o post: garante o user, insere `executions`, decrementa crédito e soma custo; extrai `tema_extraido`; grava `prompt_final` e `modelo_usado` |
| `src/lib/credits.server.ts` (novo) | helpers com o admin client: `ensureUser`, `logExecution`, `chargeCredit`, `saveFeedback` |
| `src/components/antijegue/FotoPost.tsx` | envia `deviceId`, recebe `executionId`, renderiza os 2 botões de feedback + campo "O que faltou?" |
| `src/components/antijegue/FeedbackBar.tsx` (novo) | UI dos botões e do input, no estilo atual (borda, surface, neon) |

`AudioResumo.tsx`, `src/routes/index.tsx` e `src/styles.css` não serão tocados.

## Detalhes técnicos

- O decremento é atômico via função SQL `SECURITY DEFINER` `public.charge_credit(_device_id text, _custo numeric)` que faz `UPDATE users SET credits = credits - 1, total_gasto_usd = total_gasto_usd + _custo WHERE device_id = _device_id AND credits > 0 RETURNING credits`, com `EXECUTE` apenas para `service_role`.
- O admin client é carregado dentro do handler (`await import("@/integrations/supabase/client.server")`), nunca no escopo do módulo.
- Se o usuário estiver sem créditos, a geração é bloqueada antes de chamar o OpenRouter e a UI mostra uma mensagem em pt-BR (sem tela de pagamento).
- Falha ao registrar execução/feedback não derruba o post já gerado — é logada no servidor.
- `tema_extraido`: primeira linha/frase-chave do post gerado, truncada.
