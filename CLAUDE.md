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
- `src/game/engine` — funções puras com as regras (montagem, pagamento, nota/reputação, XP, clientes, relógio, `step`). Sem React, sem `Date.now()`, sem `Math.random()` (usa RNG com seed em `rng.ts`). Testável sozinho.
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
| 2 | Chapa, fritadeira, bebidas e combos | ⬜ |
| 3 | Dia de trabalho, estoque e economia | ⬜ |
| 4 | Níveis, desbloqueios, receitas e tipos de cliente | ⬜ |
| 5 | Loja de melhorias e evolução da hamburgueria | ⬜ |
| 6 | Funcionários | ⬜ |
| 7 | Missões, conquistas, combos e eventos | ⬜ |
| 8 | Som, efeitos e acabamento | ⬜ |
| 9 | Tutorial, celular, configurações e save | ⬜ |
| 10 | Balanceamento e revisão geral | ⬜ |
| 11 | Publicação na internet | ⬜ |

### Estado atual (fim da Etapa 1)
Tela inicial (Continuar / Novo jogo / Configurações), cozinha com HUD, balcão (3 clientes, balão do pedido, barra de paciência), bancada com 6 bandejas, Descartar e Entregar, pausa, resumo de fim de turno e save no navegador.
Notas para as próximas etapas:
- Na etapa 1 o turno termina em 180 s reais e o "Próximo dia" só incrementa o dia (sem estoque ainda — etapa 3).
- Todas as receitas têm `unlockLevel: 1`; a seleção por nível já existe em `unlockedRecipes` (etapa 4).
- Receitas são listas ordenadas de ingredientes; o preço sai do custo dos ingredientes × `ECONOMY.priceMarkup`.

## Regras de trabalho (valem para todas as etapas)
- Toda regra nova do jogo fica no engine e ganha teste no Vitest.
- Ao terminar cada etapa: rodar testes, typecheck e build; corrigir todos os erros; atualizar o status neste arquivo; fazer commit com mensagem clara; dizer ao usuário em poucas linhas o que mudou e como testar no navegador.
- Interface toda em português do Brasil.
- Não quebrar o que já funciona. Se precisar de uma mudança grande na estrutura, avisar antes.
- Sem números mágicos: balanceamento vai em `src/game/config`.
