# Brasa Burger

## Visão do jogo
Simulador de hamburgueria em português do Brasil que roda direto no navegador. Sem login e sem cadastro:
a pessoa abre o site e já joga. O progresso fica salvo no navegador (localStorage).

## Stack
Vite + React 19 + TypeScript (strict) + Tailwind CSS 3 + Framer Motion + Zustand (persist) + Vitest.

Scripts: `npm run dev` · `npm test` · `npm run typecheck` · `npm run build`.

## Arquitetura
A lógica do jogo é totalmente separada da interface.

- `src/game/config` — **todos** os números de balanceamento (preços, tempos, XP, ingredientes, receitas). Nenhum número mágico no código.
- `src/game/engine` — funções puras com as regras (montagem, chapa, fritadeira, bebidas, bandeja, pedido/nota/pagamento, reputação, XP, clientes, relógio, `step`). Sem React, sem `Date.now()`, sem `Math.random()` (usa RNG com seed em `rng.ts`). Testável sozinho.
- `src/game/store` — estado global (Zustand). Só o que é progresso vai para o save (`player` com estoque, preços, avaliações, empréstimo…, `settings`, `hasSave`); o turno em andamento (`session`) não é salvo. O save tem versão (`SAVE_VERSION`) e migração em cadeia (`MIGRATIONS`) + `sanitizeSave` (versão atual: 2), para saves antigos ou corrompidos não quebrarem o jogo.
- `src/game/loop` — `useGameLoop` (requestAnimationFrame com delta time; pausável) e `eventBus` (eventos do engine → efeitos visuais; no futuro, sons).
- `src/screens` e `src/components` — interface.
- `src/art` — desenhos em SVG como componentes React.

Fluxo: o loop chama `store.tick(dt)` → `engine.step(session, player, dt)` devolve novo estado + lista de `GameEvent` → o store grava e emite os eventos → a interface anima (moedas, textos flutuantes). Ao fim do turno, `store.finishDay()` chama `engine.closeDay` (uma única vez) e vai para o resumo.

### Como mudar o save (importante)
Ao mudar o formato de `player`/`settings`: aumente `SAVE_VERSION`, adicione `MIGRATIONS[versaoAntiga]` em `store/migrations.ts`, atualize `sanitizeSave`/`defaultSave` e escreva teste.

## Direção de arte
2D cartoon, colorido e "suculento", com cara de jogo casual de celular de alta qualidade: cantos arredondados, sombras suaves, contornos grossos (marrom-escuro `#3B1F0E`, ~4px).
Tudo em SVG feito à mão (sem emoji, sem imagem de banco), no mesmo estilo. Paleta quente: vermelho tomate, amarelo mostarda, laranja, marrom de pão tostado, fundo creme (tokens no `tailwind.config.ts`).
Fontes: Lilita One (títulos) e Nunito (texto), via Google Fonts.
Animações com Framer Motion em tudo: botões que afundam, ingredientes caindo e empilhando, moedas voando até o contador.
Layout mobile-first (a cozinha é escalada em telas baixas) e centralizado no desktop.

## Roteiro
| # | Etapa | Status |
|---|-------|--------|
| 1 | Base e mecânica principal | ✅ Feita |
| 2 | Chapa, fritadeira, bebidas e combos | ✅ Feita |
| 3 | Dia de trabalho, estoque e economia | ✅ Feita |
| 4 | Níveis, desbloqueios, receitas e tipos de cliente | ⬜ |
| 5 | Loja de melhorias e evolução da hamburgueria | ⬜ |
| 6 | Funcionários | ⬜ |
| 7 | Missões, conquistas, combos e eventos | ⬜ |
| 8 | Som, efeitos e acabamento | ⬜ |
| 9 | Tutorial, celular, configurações e save | ⬜ |
| 10 | Balanceamento e revisão geral | ⬜ |
| 11 | Publicação na internet | ⬜ |

### Estado atual (fim da Etapa 3)
Fluxo: Título → **Preparação do dia** → Cozinha (turno) → **Resumo do dia** → Preparação do dia seguinte (ou **Falência**). Na cozinha: HUD, balcão, bandeja e bancada em abas (Montagem · Chapa · Fritadeira · Bebidas).

- **Chapa / fritadeira / bebidas / pedidos / nota** (Etapa 2): ver `engine/grill.ts`, `fryer.ts`, `drinks.ts`, `rating.ts` (`rateOrder`), `serve.ts` (`evaluateService`). Pedido = lanche + batata + bebida opcionais; nota 1–5; gorjeta por nota × rapidez; bônus de carne no ponto.
- **Dia** (`config/shift.ts`, `config/demand.ts`, `engine/demand.ts`, `tick.ts`): das 11h às 23h em 300 s reais. `DEMAND.hourly` dá o movimento por hora (almoço 12–14h e jantar 19–21h com pico; fim de tarde calmo). O intervalo entre clientes = `baseSpawnInterval` ÷ (hora × dia × reputação × preços), com jitter. `dayMultiplier(day)` é a "previsão" (determinística; dia 1 normal). Depois das 23h não chegam mais clientes e o dia acaba quando o balcão esvazia (ou após `closingGraceSeconds`).
- **Estoque** (`config/stock.ts`, `engine/stock.ts`): 7 itens (pão, carne, queijo, alface, tomate, batata, refri) com custo unitário. O estoque do dia vive na `session` e é gasto ao montar (pão ao abrir o lanche, ingrediente ao entrar, carne ao ir para a chapa, batata ao ir para o óleo, refri ao pôr o copo; trocar copo vazio devolve). Acabou → botão cinza ("Acabou"). Compra por carrinho (+10/+50) na preparação (`purchaseStock`). Alface e tomate estragam: a idade média sobe 1 por dia e, no limite (`spoilDays`), todo o estoque daquele item estraga (`ageStock`).
- **Preços** (`engine/pricing.ts`, `PRICING`): cada item (5 lanches, batata, 3 copos) tem preço padrão (`basePrice`) e o jogador ajusta de 60% a 160%. Preço médio alto → menos movimento; preço do pedido alto → cliente menos paciente e menos gorjeta; preço baixo → o contrário.
- **Finanças** (`engine/day.ts`): `closeDay` desconta custos fixos (aluguel, luz, gás), parcela do empréstimo e envelhece o estoque; monta o `DaySummary` (lucro líquido = faturamento + gorjetas − gastos = variação do caixa, sem a entrada do empréstimo). Caixa negativo → aviso e **empréstimo** (`LOAN`: R$ 500, 20% de juros, 6 parcelas; uma vez só, só no vermelho). `ECONOMY.bankruptcyDays` (3) dias seguidos fechando no vermelho = **falência** (tela com "Recomeçar").
- **Reputação e avaliações** (`engine/reputation.ts`, `reviews.ts`, `config/reputation.ts`, `config/reviews.ts`): cada entrega ou cliente perdido gera uma `Review` (nota + texto curto + nome). A reputação (0–5) é a média das últimas 25 avaliações com um peso de nota neutra; reputação maior = mais clientes e mais pacientes. Avaliações aparecem na aba "Avaliações" da preparação e no modal aberto tocando nas estrelas do HUD.
- **Save v2**: `SAVE_VERSION = 2`; a migração v1→v2 mantém dinheiro/XP/nível/dia e cria estoque, preços, avaliações, empréstimo etc. O dia em andamento guarda `dayStart` (estado de abertura): **recarregar no meio do dia recomeça o dia daquele estado** (impede repetir o dia de graça). O storage grava no máximo 1×/s (`store/storage.ts`).

Notas para as próximas etapas:
- O turno em andamento (clientes, chapa etc.) continua fora do save; só o progresso e o estado de abertura do dia são salvos.
- Receitas e combos têm `unlockLevel: 1`; a seleção por nível já existe (`unlockedRecipes`, `COMBOS`) para a etapa 4.
- Balanceamento (preços, custos fixos, demanda) é de primeira versão; há testes de sanidade em `day.test.ts`/`game.test.ts` (ponto de equilíbrio, pico vs. fim de tarde). Revisão fina na etapa 10.
- Em desenvolvimento (`npm run dev`) o store fica em `window.__game` (ex.: `__game.getState().tick(0.1)`).

## Regras de trabalho (valem para todas as etapas)
- Toda regra nova do jogo fica no engine e ganha teste no Vitest.
- Ao terminar cada etapa: rodar testes, typecheck e build; corrigir todos os erros; atualizar o status neste arquivo; fazer commit com mensagem clara; dizer ao usuário em poucas linhas o que mudou e como testar no navegador.
- Interface toda em português do Brasil.
- Não quebrar o que já funciona. Se precisar de uma mudança grande na estrutura, avisar antes.
- Sem números mágicos: balanceamento vai em `src/game/config`.
