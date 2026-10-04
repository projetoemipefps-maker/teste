import { describe, expect, it } from 'vitest'
import { REPUTATION } from '../config'
import { addReview, computeReputation, demandFactorForReputation, patienceFactorForReputation } from './reputation'
import { makeLostReview, makeReview, reviewTheme } from './reviews'
import { REVIEW_TEXTS } from '../config'
import { testPlayer } from './testing'
import type { Review } from './types'

const review = (stars: number, id = String(Math.random())): Review => ({ id, day: 1, stars, text: 't', name: 'n' })

describe('reputação pelas avaliações', () => {
  it('sem avaliações, a reputação é a neutra', () => {
    expect(computeReputation([])).toBe(REPUTATION.priorStars)
  })

  it('avaliações boas sobem e ruins descem, aos poucos', () => {
    expect(computeReputation([review(5)])).toBeGreaterThan(3)
    expect(computeReputation([review(1)])).toBeLessThan(3)
    expect(computeReputation([review(5)])).toBeLessThan(5)
  })

  it('muitas avaliações iguais aproximam a reputação delas', () => {
    const many = Array.from({ length: REPUTATION.window }, () => review(5))
    expect(computeReputation(many)).toBeGreaterThan(4.3)
    expect(computeReputation(Array.from({ length: REPUTATION.window }, () => review(1)))).toBeLessThan(1.7)
  })

  it('só as avaliações recentes contam', () => {
    const recent = Array.from({ length: REPUTATION.window }, () => review(5))
    const old = Array.from({ length: 50 }, () => review(1))
    expect(computeReputation([...recent, ...old])).toBe(computeReputation(recent))
  })

  it('a reputação fica entre 0 e 5', () => {
    const r = computeReputation(Array.from({ length: 30 }, () => review(5)))
    expect(r).toBeLessThanOrEqual(5)
    expect(r).toBeGreaterThanOrEqual(0)
  })

  it('adicionar avaliação guarda a mais nova primeiro, limita o histórico e recalcula', () => {
    let p = testPlayer()
    for (let i = 0; i < REPUTATION.keepReviews + 10; i++) p = addReview(p, review(5, `r${i}`))
    expect(p.reviews).toHaveLength(REPUTATION.keepReviews)
    expect(p.reviews[0]!.id).toBe(`r${REPUTATION.keepReviews + 9}`)
    expect(p.reputation).toBe(computeReputation(p.reviews))
    expect(p.reputation).toBeGreaterThan(4)
  })

  it('reputação maior traz mais clientes e clientes mais pacientes', () => {
    expect(demandFactorForReputation(5)).toBeGreaterThan(demandFactorForReputation(3))
    expect(demandFactorForReputation(3)).toBe(1)
    expect(demandFactorForReputation(1)).toBeLessThan(1)
    expect(patienceFactorForReputation(5)).toBeGreaterThan(patienceFactorForReputation(3))
    expect(patienceFactorForReputation(1)).toBeLessThan(1)
  })
})

describe('textos das avaliações', () => {
  it('escolhe o assunto pela nota, pelos problemas e pelo preço', () => {
    expect(reviewTheme(5, ['pattyPerfect', 'fast'], 1)).toBe('greatPatty')
    expect(reviewTheme(4, ['fast'], 1)).toBe('fast')
    expect(reviewTheme(4, [], 0.8)).toBe('cheap')
    expect(reviewTheme(4, [], 1)).toBe('good')
    expect(reviewTheme(3, [], 1)).toBe('okay')
    expect(reviewTheme(3, [], 1.3)).toBe('pricey')
    expect(reviewTheme(2, ['burgerWrong'], 1)).toBe('wrong')
    expect(reviewTheme(1, ['pattyRaw', 'slow'], 1)).toBe('raw')
    expect(reviewTheme(2, ['slow'], 1)).toBe('slow')
    expect(reviewTheme(2, ['drinkSpilled'], 1)).toBe('drinkSpilled')
    expect(reviewTheme(2, [], 1)).toBe('bad')
    expect(reviewTheme(2, [], 1.4)).toBe('pricey')
  })

  it('a avaliação usa um texto do assunto, é determinística e tem a nota certa', () => {
    const r = makeReview({ customerId: 4, day: 2, stars: 5, notes: ['pattyPerfect'], priceRatio: 1 })
    expect(REVIEW_TEXTS.greatPatty).toContain(r.text)
    expect(r.stars).toBe(5)
    expect(r.id).toBe('2-4')
    expect(makeReview({ customerId: 4, day: 2, stars: 5, notes: ['pattyPerfect'], priceRatio: 1 })).toEqual(r)
  })

  it('quem desiste de esperar deixa uma avaliação de 1 estrela', () => {
    const r = makeLostReview(9, 3)
    expect(r.stars).toBe(REPUTATION.lostStars)
    expect(REVIEW_TEXTS.lost).toContain(r.text)
  })

  it('há variedade de textos em cada assunto', () => {
    for (const texts of Object.values(REVIEW_TEXTS)) expect(texts.length).toBeGreaterThanOrEqual(2)
  })

  it('os textos variam com o cliente', () => {
    const seen = new Set(Array.from({ length: 40 }, (_, i) => makeLostReview(i, 1).text))
    expect(seen.size).toBeGreaterThan(1)
  })
})
