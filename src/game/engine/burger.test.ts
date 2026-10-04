import { describe, expect, it } from 'vitest'
import { MAX_BURGER_HEIGHT, RECIPES } from '../config'
import { addIngredient, canAddIngredient, isClosed, matchesRecipe } from './burger'

describe('montagem do lanche', () => {
  it('só começa com o pão de baixo', () => {
    expect(canAddIngredient([], 'bunBottom')).toBe(true)
    for (const id of ['patty', 'cheese', 'lettuce', 'tomato', 'bunTop'] as const) {
      expect(canAddIngredient([], id)).toBe(false)
    }
  })

  it('não aceita um segundo pão de baixo', () => {
    expect(canAddIngredient(['bunBottom'], 'bunBottom')).toBe(false)
  })

  it('o pão de cima fecha o lanche e nada entra depois', () => {
    const closed = ['bunBottom', 'patty', 'bunTop'] as const
    expect(isClosed(closed)).toBe(true)
    expect(canAddIngredient(closed, 'patty')).toBe(false)
    expect(canAddIngredient(closed, 'bunTop')).toBe(false)
  })

  it('addIngredient devolve a mesma referência quando inválido', () => {
    const stack = ['bunBottom'] as const
    expect(addIngredient(stack, 'bunBottom')).toBe(stack)
    expect(addIngredient(stack, 'patty')).toEqual(['bunBottom', 'patty'])
  })

  it('respeita a altura máxima e reserva espaço para o pão de cima', () => {
    let stack: readonly (typeof RECIPES)[number]['ingredients'][number][] = ['bunBottom']
    while (canAddIngredient(stack, 'patty')) stack = addIngredient(stack, 'patty')
    expect(stack.length).toBe(MAX_BURGER_HEIGHT - 1)
    expect(canAddIngredient(stack, 'bunTop')).toBe(true)
    expect(addIngredient(stack, 'bunTop').length).toBe(MAX_BURGER_HEIGHT)
  })

  it('compara a pilha com a receita na ordem exata', () => {
    const classico = RECIPES.find((r) => r.id === 'classico')!
    expect(matchesRecipe([...classico.ingredients], classico)).toBe(true)
    expect(matchesRecipe(['bunBottom', 'patty', 'tomato', 'lettuce', 'bunTop'], classico)).toBe(false)
    expect(matchesRecipe(['bunBottom', 'patty', 'lettuce', 'tomato'], classico)).toBe(false)
  })

  it('toda receita da config é montável passo a passo', () => {
    for (const r of RECIPES) {
      let stack: readonly string[] = []
      for (const ing of r.ingredients) {
        expect(canAddIngredient(stack as never, ing)).toBe(true)
        stack = [...stack, ing]
      }
    }
  })
})
