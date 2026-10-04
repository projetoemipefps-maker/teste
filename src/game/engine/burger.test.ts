import { describe, expect, it } from 'vitest'
import { INGREDIENT_IDS, INGREDIENTS, MAX_BURGER_HEIGHT, RECIPES, type IngredientId } from '../config'
import { addIngredient, canAddIngredient, closingFor, isClosed, matchesRecipe } from './burger'

const recipe = (id: string) => RECIPES.find((r) => r.id === id)!

describe('montagem do lanche', () => {
  it('só começa com um pão de baixo (qualquer um dos tipos)', () => {
    for (const id of ['bunBottom', 'briocheBottom', 'australianBottom'] as const) expect(canAddIngredient([], id)).toBe(true)
    for (const id of INGREDIENT_IDS.filter((i) => INGREDIENTS[i].role !== 'base')) expect(canAddIngredient([], id)).toBe(false)
  })

  it('não aceita um segundo pão de baixo', () => {
    expect(canAddIngredient(['bunBottom'], 'bunBottom')).toBe(false)
    expect(canAddIngredient(['bunBottom'], 'briocheBottom')).toBe(false)
  })

  it('o pão de cima precisa combinar com o de baixo', () => {
    expect(closingFor(['bunBottom', 'patty'])).toBe('bunTop')
    expect(closingFor(['briocheBottom'])).toBe('briocheTop')
    expect(closingFor(['australianBottom'])).toBe('australianTop')
    expect(closingFor([])).toBeNull()
    expect(canAddIngredient(['briocheBottom', 'patty'], 'briocheTop')).toBe(true)
    expect(canAddIngredient(['briocheBottom', 'patty'], 'bunTop')).toBe(false)
    expect(canAddIngredient(['bunBottom', 'patty'], 'australianTop')).toBe(false)
  })

  it('o pão de cima fecha o lanche e nada entra depois', () => {
    const closed: IngredientId[] = ['bunBottom', 'patty', 'bunTop']
    expect(isClosed(closed)).toBe(true)
    expect(canAddIngredient(closed, 'patty')).toBe(false)
    expect(canAddIngredient(closed, 'bunTop')).toBe(false)
    expect(isClosed(['bunBottom', 'patty', 'briocheTop'])).toBe(false)
    expect(isClosed(['bunBottom'])).toBe(false)
  })

  it('addIngredient devolve a mesma referência quando inválido', () => {
    const stack = ['bunBottom'] as const
    expect(addIngredient(stack, 'bunBottom')).toBe(stack)
    expect(addIngredient(stack, 'patty')).toEqual(['bunBottom', 'patty'])
  })

  it('respeita a altura máxima e reserva espaço para o pão de cima', () => {
    let stack: readonly IngredientId[] = ['bunBottom']
    while (canAddIngredient(stack, 'cheddar')) stack = addIngredient(stack, 'cheddar')
    expect(stack.length).toBe(MAX_BURGER_HEIGHT - 1)
    expect(canAddIngredient(stack, 'bunTop')).toBe(true)
    expect(addIngredient(stack, 'bunTop').length).toBe(MAX_BURGER_HEIGHT)
  })

  it('compara a pilha com a receita na ordem exata', () => {
    const classico = recipe('classico')
    expect(matchesRecipe([...classico.ingredients], classico)).toBe(true)
    expect(matchesRecipe(['bunBottom', 'patty', 'tomato', 'lettuce', 'bunTop'], classico)).toBe(false)
    expect(matchesRecipe(['bunBottom', 'patty', 'lettuce', 'tomato'], classico)).toBe(false)
    // o tipo de pão faz parte da receita
    expect(matchesRecipe(['briocheBottom', 'patty', 'lettuce', 'tomato', 'briocheTop'], classico)).toBe(false)
  })

  it('toda receita da config é montável passo a passo, cabe na altura máxima e termina fechada', () => {
    for (const r of RECIPES) {
      let stack: readonly IngredientId[] = []
      for (const ing of r.ingredients) {
        expect(canAddIngredient(stack, ing), `${r.name}: ${ing}`).toBe(true)
        stack = [...stack, ing]
      }
      expect(isClosed(stack), r.name).toBe(true)
      expect(r.ingredients.length, r.name).toBeLessThanOrEqual(MAX_BURGER_HEIGHT)
    }
  })

  it('a pilha da assinatura "Brasa Supreme" usa a altura máxima', () => {
    expect(recipe('supreme').ingredients.length).toBe(MAX_BURGER_HEIGHT)
  })
})
