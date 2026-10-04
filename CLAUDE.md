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
- `src/game/engine` — funções puras com as regras (montagem, chapa, fritadeira/forno, bebidas, bandeja, pedido/nota/pagamento, reputação, XP e níveis, desbloqueios, tipos e aparência dos clientes, relógio, `step`). Sem React, sem `Date.now()`, sem `Math.random()` (usa RNG com seed em `rng.ts`). Testável sozinho.
- `src/game/store` — estado global (Zustand). Só o que é progresso vai para o save (`player` com estoque, preços, avaliações, empréstimo…, `settings`, `hasSave`); o turno em andamento (`session`) não é salvo. O save tem versão (`SAVE_VERSION`) e migração em cadeia (`MIGRATIONS`) + `sanitizeSave` (versão atual: 3), para saves antigos ou corrompidos não quebrarem o jogo.
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
| 4 | Níveis, desbloqueios, receitas e tipos de cliente | ✅ Feita |
| 5 | Loja de melhorias e evolução da hamburgueria | ⬜ |
| 6 | Funcionários | ⬜ |
| 7 | Missões, conquistas, combos e eventos | ⬜ |
| 8 | Som, efeitos e acabamento | ⬜ |
| 9 | Tutorial, celular, configurações e save | ⬜ |
| 10 | Balanceamento e revisão geral | ⬜ |
| 11 | Publicação na internet | ⬜ |

### Estado atual (fim da Etapa 4)
Fluxo: Título → **Preparação do dia** (estoque · cardápio · avaliações; botão do **Livro de Receitas**) → Cozinha (turno) → **Resumo do dia** → Preparação do dia seguinte (ou **Falência**). Na cozinha: HUD, balcão com até 3 clientes, bandeja e bancada em abas (Montagem · Chapa · Fritadeira · Bebidas · Doces — "Doces" só aparece com o forno liberado). Subir de nível pausa o jogo e abre a tela **LEVEL UP!**.

**Progressão (Etapa 4)**
- **XP e níveis 1–50** (`config/progression.ts`, `engine/xp.ts`): XP por entrega = `xpByStars[estrelas−1]` + `xpPerExtraItem` por item além do primeiro, × `xpFactor` do tipo de cliente. Curva: níveis 1–5 usam `earlyXp` (15, 35, 60, 100, 150 — um pedido perfeito já sobe o nível 1); a partir do 6 é `round(xpBase · nível^xpExponent)` (282 no 6, 533 no 10, 2 106 no 30). Total acumulado: ~1 900 XP até o nível 10, ~17 500 até o 25, ~86 000 até o 50. `addXp` pode subir vários níveis de uma vez. Ganhar XP por missões/conquistas é da Etapa 7 (basta chamar `addXp`).
- **Desbloqueios por nível** (`engine/unlocks.ts`): a lista é **gerada dos catálogos** (`allUnlocks()` varre `INGREDIENTS`, `RECIPES`, `COOKABLES`, `DESSERTS`, `DRINK_CONFIG`, `CUSTOMER_TYPES` e `EXTRA_UNLOCKS`), então mudar um `unlockLevel` na config já muda tudo (pedidos, loja, tela de nível novo). Tabela atual: 2 cheddar · 3 cebola, Apressado · 4 bacon, X-Bacon · 5 suco, Criança · 6 picles, Burger Picles · 7 batata rústica · 8 maionese verde, Família · 9 brioche, Brioche Clássico · 10 cebola caramelizada · 11 nuggets, Indeciso · 12 brownie/forno (2 espaços), 3º espaço da chapa · 13 carne dupla (informativo; vem com o Smash Duplo) · 14 cheddar cremoso, Cheddar Melt, Influenciador · 15 milkshake de chocolate · 16 barbecue, Barbecue Bacon, 3º cesto da fritadeira · 17 anéis de cebola · 18 ovo, X-Egg, Crítico · 19 milkshake de morango · 20 frango empanado, Frango Crocante · 21 sorvete · 23 pão australiano · 24 milkshake de baunilha, Australiano · 26 batata com cheddar e bacon · 28 hambúrguer vegetal, Vegetariano, 4º espaço da chapa · 32 Brasa Supreme.
- **Tela de nível novo** (`LevelUpOverlay`, `engine/levelup.ts`): `applyLevelUp(session, de, para)` estende chapa/fritadeira/forno, dá `UNLOCK_GIFT_UNITS` (6) de cada ingrediente novo no estoque do dia e devolve a lista de desbloqueios; o store guarda `levelUp` e pausa; "Continuar" retoma. Confete + ícone de cada item.
- **Receitas** (`config/recipes.ts`, 15 no total): nome, ingredientes em ordem (do pão de baixo ao de cima), `basePrice`, `simple` (criança) e `signature` (Brasa Supreme, nível 32). Os pedidos usam o **nome da receita**; tocar no balão abre a **montagem de referência** (`RecipeReference`, passo a passo de baixo para cima com desenho). **Livro de Receitas** (`screens/RecipeBookScreen`): liberadas (toque abre o passo a passo) e bloqueadas (silhueta + cadeado + nível); abre pela preparação e pelo menu de pausa e volta para onde estava.
- **Ingredientes** (21, `config/ingredients.ts`): cada um tem `role` (base/closing/protein/topping), `category` (Pães, Queijos, Vegetais, Molhos, Extras — abas da montagem) e `stock`. Pães vêm em pares (`BUN_PAIRS`: o de cima fecha o lanche e é escolhido sozinho). Proteínas (carne, frango, vegetal) passam pela chapa (tempos próprios em `GRILL.kinds`) e vão ao prato de "carnes prontas" (`held`, até 4) antes de entrar no lanche; a receita define quantas entram (Smash Duplo e Supreme usam 2). Altura máxima do lanche: `MAX_BURGER_HEIGHT`.
- **Acompanhamentos e sobremesas**: fritadeira/estufa (`engine/cookers.ts`, genérico para `fryer`/`warmer`) faz batata, rústica, nuggets, anéis e batata com cheddar e bacon; forno/vitrine faz brownie; sorvete é instantâneo (`scoopIceCream`). Cada um tem tempos de pronto/queimado/murcho em `COOKABLES`. **Bebidas**: refri, suco e 3 milkshakes × 3 tamanhos, enchimento segurando o botão com `fillRate` por tipo.
- **Pedido = listas**: `OrderItems { burgers[], sides[], drinks[], desserts[] }`; a bandeja tem as mesmas listas (capacidades em `TRAY`). A nota (`rateOrder`) casa item a item (exato → parecido → errado → faltando); a penalidade de cada categoria é a média dos itens; estrelas = `ceil(5 − penalidade − 0,5)` limitado a 1–5.
- **Tipos de cliente** (`config/customerTypes.ts`, `engine/customers.ts`): Normal, **Apressado** (paciência baixa, gorjeta alta), **Criança** (só receitas simples), **Família** (2–4 lanches + extras, vem com acompanhante), **Indeciso** (muda o pedido no meio; `mindChangeAt`/`changeMind`), **Influenciador** (paga mais; se sair feliz, o movimento do dia seguinte sobe `influencerBoost`: `dayBoost`) e **Crítico** (raro, `strict`: só nota alta com atendimento perfeito, avaliação com peso 4 na reputação). Cada tipo tem fatores de paciência/gorjeta/pagamento/XP; só aparecem depois do nível em que são liberados.
- **Visual dos clientes** (`engine/looks.ts`, `art/customers/*`): a aparência é sorteada por partes (pele, cabelo + cor, roupa + cor, acessório) e o engine evita repetir a mesma combinação entre os clientes presentes (`lookSignature`, `lookRetries`). O SVG é montado das partes, com humor feliz/neutro/impaciente/bravo (`customerMood`). Os tipos têm marcas próprias: terno e óculos no Crítico (`SPECIAL_PARTS`), óculos escuros e celular no Influenciador, linhas de pressa no Apressado, acompanhante na Família.
- **Dificuldade** (`engine/demand.ts`, `config/progression.ts`): `levelDemandFactor = 1 + (nível−1)·demandPerLevel` (máx. `demandMax`) acelera a chegada de clientes; pedidos maiores vêm de (a) mais receitas liberadas, (b) chance de acompanhamento/bebida/sobremesa por nível (`ORDER_RULES`) e (c) famílias. O jogador cresce junto: mais espaços na chapa/fritadeira, forno, estoque inicial maior (`startingStock(nível)`).
- **Save v3**: `SAVE_VERSION = 3`; v1→v2 cria estoque/preços/avaliações/empréstimo; v2→v3 renomeia as chaves de preço (`fries`→`side:fries`, `drink:<tam>`→`drink:soda:<tam>`) e cria `dayBoost`. `sanitizeSave` reconstrói o que faltar (inclusive estoque conforme o nível). O dia em andamento guarda `dayStart`: **recarregar no meio do dia recomeça o dia daquele estado**.

**Base (Etapas 1–3)**
- **Dia** (`config/shift.ts`, `config/demand.ts`, `engine/demand.ts`, `tick.ts`): das 11h às 23h em 300 s reais. `DEMAND.hourly` dá o movimento por hora (almoço 12–14h e jantar 19–21h com pico). O intervalo entre clientes = `baseSpawnInterval` ÷ (hora × dia × reputação × preços × nível), com jitter. `dayMultiplier(day)` é a "previsão". Depois das 23h não chegam mais clientes e o dia acaba quando o balcão esvazia (ou após `closingGraceSeconds`).
- **Estoque** (`config/stock.ts`, `engine/stock.ts`): 29 itens com custo unitário e nível de liberação (só os liberados aparecem na loja, agrupados por categoria). O estoque do dia vive na `session` e é gasto ao montar; acabou → botão cinza. Compra por carrinho (+10/+50) na preparação (`purchaseStock`, teto `MAX_STOCK`). Itens perecíveis estragam (`spoilDays`, `ageStock`).
- **Preços** (`engine/pricing.ts`, `PRICING`): chaves `recipe:`, `side:`, `drink:<tipo>:<tam>`, `dessert:`; o jogador ajusta de 60% a 160%. Preço médio alto → menos movimento; preço do pedido alto → menos paciência e gorjeta.
- **Finanças** (`engine/day.ts`): `closeDay` desconta custos fixos e parcela do empréstimo, envelhece o estoque e monta o `DaySummary`. Caixa negativo → **empréstimo** (`LOAN`, uma vez só). `ECONOMY.bankruptcyDays` dias seguidos no vermelho = **falência**.
- **Reputação e avaliações** (`engine/reputation.ts`, `reviews.ts`): cada entrega ou cliente perdido gera uma `Review` (nota, texto, nome, peso, tipo de cliente); a reputação é a média ponderada das últimas 25 com uma nota-prior; mais reputação = mais clientes e mais paciência.

Notas para as próximas etapas:
- O turno em andamento (clientes, chapa etc.) continua fora do save; só o progresso e o estado de abertura do dia são salvos.
- Ganchos prontos: XP por missão/conquista (`addXp`), `EXTRA_UNLOCKS` para liberar itens que não vêm de um catálogo, `GameEvent`s (`leveledUp`, `customerServed` com `customerType`, `customerChangedMind`, `cook*`) para sons e missões.
- Balanceamento (preços, XP, ritmo de níveis, demanda) é de primeira versão; há testes de sanidade em `day.test.ts`/`game.test.ts`/`progression.test.ts`. Revisão fina na etapa 10 (por exemplo, o salto de XP entre os níveis 5 e 6).
- Layout: o balão do pedido encolhe os desenhos conforme o número de itens (`OrderBubble`, tamanhos solo/big/medium/small/tiny) para caber sempre na mesma área; a chapa com mais de 2 espaços usa um layout compacto.
- Em desenvolvimento (`npm run dev`) o store fica em `window.__game` (ex.: `__game.getState().tick(0.1)`, `__game.setState(...)` para testar níveis altos).

## Regras de trabalho (valem para todas as etapas)
- Toda regra nova do jogo fica no engine e ganha teste no Vitest.
- Ao terminar cada etapa: rodar testes, typecheck e build; corrigir todos os erros; atualizar o status neste arquivo; fazer commit com mensagem clara; dizer ao usuário em poucas linhas o que mudou e como testar no navegador.
- Interface toda em português do Brasil.
- Não quebrar o que já funciona. Se precisar de uma mudança grande na estrutura, avisar antes.
- Sem números mágicos: balanceamento vai em `src/game/config`.
