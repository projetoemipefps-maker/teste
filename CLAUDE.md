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
- `src/game/store` — estado global (Zustand). Só o que é progresso vai para o save (`player`, `settings`, `hasSave`); o turno em andamento (`session`) não é salvo. O save tem versão (`SAVE_VERSION`) e migração em cadeia (`MIGRATIONS`) + `sanitizeSave`, para saves antigos ou corrompidos não quebrarem o jogo.
- `src/game/loop` — `useGameLoop` (requestAnimationFrame com delta time; pausável) e `eventBus` (eventos do engine → efeitos visuais; no futuro, sons).
- `src/screens` e `src/components` — interface.
- `src/art` — desenhos em SVG como componentes React.

Fluxo: o loop chama `store.tick(dt)` → `engine.step(session, player, dt)` devolve novo estado + lista de `GameEvent` → o store grava e emite os eventos → a interface anima (moedas, textos flutuantes).

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
| 3 | Dia de trabalho, estoque e economia | ⬜ |
| 4 | Níveis, desbloqueios, receitas e tipos de cliente | ⬜ |
| 5 | Loja de melhorias e evolução da hamburgueria | ⬜ |
| 6 | Funcionários | ⬜ |
| 7 | Missões, conquistas, combos e eventos | ⬜ |
| 8 | Som, efeitos e acabamento | ⬜ |
| 9 | Tutorial, celular, configurações e save | ⬜ |
| 10 | Balanceamento e revisão geral | ⬜ |
| 11 | Publicação na internet | ⬜ |

### Estado atual (fim da Etapa 2)
Tela inicial, cozinha com HUD, balcão (3 clientes), **bandeja de entrega** sempre visível e uma bancada em **abas**: Montagem · Chapa · Fritadeira · Bebidas (pontinho de alerta na aba quando algo está pronto ou queimando).

- **Chapa** (`engine/grill.ts`, `config/grill.ts`): 2 espaços; cada carne tem dois lados (`sides`) e só cozinha o lado que está na chapa. Estágios: crua → no ponto (os dois lados ≥ `sideDoneSeconds`) → passada → queimada (pelo lado mais cozido). Clique vira a carne (quantas vezes quiser). "Tirar" manda a carne para o prato de carnes prontas (`held`, com o ponto registrado); queimada vai para o lixo. Efeitos visuais: anel duplo de cozimento (lado de baixo/lado de cima), flip animado, fumaça, chiado (bolhas) e faíscas.
- **Fritadeira** (`engine/fryer.ts`): 2 cestos; pronta → estufa (`warmer`, 3 porções, murcha após `staleSeconds`) → bandeja; queimada vai para o lixo.
- **Bebidas** (`engine/drinks.ts`): escolher o copo (P/M/G) e **segurar** o botão para encher (`session.pouring` + `step`); abaixo de `minFillRatio` = "pouco", acima de 100% = derrama.
- **Pedidos** (`OrderItems`): lanche + batata opcional + bebida opcional (tamanho). O balão mostra cada item e põe um check nos que já estão na bandeja (só para o cliente selecionado). O lanche fechado vai sozinho para a bandeja (`sendBurgerToTray`, com atraso de UI em `config/ui.ts`); a carne só entra no lanche vinda do prato (`addPattyToBurger`).
- **Nota e pagamento** (`rating.ts` → `rateOrder`, `payment.ts`, `serve.ts` → `evaluateService`): nota de 1 a 5 parte de 5 e perde estrelas por lanche errado/faltando, ponto da carne (média das carnes), batata murcha/faltando, copo pouco/derramado/tamanho errado/faltando e espera (arredondamento "meio para baixo"). Pagamento = preço dos itens (item errado paga `wrongPayFraction`, faltando não paga) + gorjeta (por nota × rapidez) + bônus de carne no ponto. Popup animado (`ScorePopup`) mostra nota, itens, gorjeta e motivos. Reputação e XP dependem da nota.

Notas para as próximas etapas:
- O turno termina em 180 s reais e o "Próximo dia" só incrementa o dia (sem estoque ainda — etapa 3). Ingredientes e carne crua são ilimitados até lá.
- Receitas e combos têm `unlockLevel: 1`; a seleção por nível já existe (`unlockedRecipes`, `COMBOS`) para a etapa 4.
- O save não mudou nesta etapa (`SAVE_VERSION` continua 1); o estado das estações vive na `session` e não é salvo.
- Em desenvolvimento (`npm run dev`) o store fica em `window.__game` (útil para avançar o tempo: `__game.getState().tick(0.1)`).

## Regras de trabalho (valem para todas as etapas)
- Toda regra nova do jogo fica no engine e ganha teste no Vitest.
- Ao terminar cada etapa: rodar testes, typecheck e build; corrigir todos os erros; atualizar o status neste arquivo; fazer commit com mensagem clara; dizer ao usuário em poucas linhas o que mudou e como testar no navegador.
- Interface toda em português do Brasil.
- Não quebrar o que já funciona. Se precisar de uma mudança grande na estrutura, avisar antes.
- Sem números mágicos: balanceamento vai em `src/game/config`.
