/** Textos das avaliações dos clientes (curtos). */
export const REVIEW_NAMES = ['Marina', 'Seu Zé', 'Bia', 'Carlão', 'Dona Rosa', 'Léo', 'Tavinho', 'Duda', 'Jão', 'Lu']

export type ReviewTheme =
  | 'greatPatty'
  | 'fast'
  | 'cheap'
  | 'good'
  | 'okay'
  | 'pricey'
  | 'wrong'
  | 'raw'
  | 'dry'
  | 'friesMissing'
  | 'friesStale'
  | 'drinkMissing'
  | 'drinkSpilled'
  | 'drinkLow'
  | 'slow'
  | 'bad'
  | 'lost'

export const REVIEW_TEXTS: Record<ReviewTheme, readonly string[]> = {
  greatPatty: ['Melhor smash da cidade!', 'Carne no ponto, perfeita!', 'Esse hambúrguer é um espetáculo!', 'Nota mil, sem dúvida.'],
  fast: ['Rápido e delicioso!', 'Atendimento voando, adorei!', 'Pedi e já chegou. Show!'],
  cheap: ['Barato e muito bom!', 'Preço camarada, voltarei!', 'Cabe no bolso e é gostoso.'],
  good: ['Gostei muito, voltarei!', 'Lanche bem feito.', 'Que delícia, recomendo!', 'Bom demais!'],
  okay: ['Foi ok.', 'Nada demais, mas matou a fome.', 'Cumpriu o prometido.'],
  pricey: ['Muito caro pelo que é.', 'Salgado o preço...', 'Achei caro pro tamanho.'],
  wrong: ['Veio o lanche errado.', 'Não era isso que eu pedi...', 'Pedi uma coisa, veio outra.'],
  raw: ['Carne crua, que perigo!', 'A carne veio rosada demais.'],
  dry: ['Carne seca demais.', 'Passou do ponto...', 'A carne estava ressecada.'],
  friesMissing: ['Esqueceram minha batata!', 'Cadê as batatas?'],
  friesStale: ['Batata murcha...', 'As batatas estavam frias.'],
  drinkMissing: ['Cadê meu refri?', 'Faltou a bebida.'],
  drinkSpilled: ['Refri derramado, que bagunça.', 'O copo veio molhado de refri.'],
  drinkLow: ['Refri pela metade!', 'Copo meio vazio...'],
  slow: ['Esperei demais...', 'Demorou uma eternidade.', 'Serviço lento.'],
  bad: ['Podia ser bem melhor.', 'Não volto tão cedo.', 'Decepcionante.'],
  lost: ['Esperei demais... fui embora.', 'Desisti, a fila não anda.', 'Ninguém me atendeu!'],
}
