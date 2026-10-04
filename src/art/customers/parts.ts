/** Peças do visual dos clientes. Cada tabela tem o tamanho definido em `LOOK_PARTS` (config/looks.ts). */

export interface SkinTone {
  base: string
  shade: string
}

export const SKIN_TONES: readonly SkinTone[] = [
  { base: '#FBD9BC', shade: '#EFBC95' },
  { base: '#F6C79A', shade: '#E8A874' },
  { base: '#E9B58A', shade: '#D79A68' },
  { base: '#D49A6A', shade: '#BC7E4E' },
  { base: '#C98B5B', shade: '#B3703F' },
  { base: '#A66A43', shade: '#8E5430' },
  { base: '#8D5A3A', shade: '#744526' },
  { base: '#6B4228', shade: '#563219' },
]

export const HAIR_COLORS: readonly string[] = ['#1E1410', '#4A2A12', '#7A4A22', '#D9892B', '#E8C468', '#B7B7B7', '#E6573F', '#5B6CC9']

export const OUTFIT_COLORS: readonly string[] = [
  '#3E86D6', '#E6573F', '#7B5BC4', '#F2A83B', '#3FAE6B', '#2F9E9E', '#E86FA0', '#6B7280', '#9BD13D', '#2F3E8C',
]

export const HAIR_STYLES = ['short', 'long', 'bun', 'curly', 'cap', 'bald', 'ponytail', 'bob', 'spiky'] as const
export type HairStyle = (typeof HAIR_STYLES)[number]

/** O terno (índice 7) é a roupa do crítico gastronômico. */
export const OUTFITS = ['tee', 'polo', 'hoodie', 'striped', 'jacket', 'overalls', 'tank', 'suit'] as const
export type Outfit = (typeof OUTFITS)[number]

/** Óculos (1) e óculos escuros (2) são marcas do crítico e do influenciador. */
export const ACCESSORIES = ['none', 'glasses', 'sunglasses', 'headphones', 'mustache', 'beard', 'scarf', 'freckles'] as const
export type Accessory = (typeof ACCESSORIES)[number]

export const LOOKS_COUNTS = {
  skin: SKIN_TONES.length,
  hairStyle: HAIR_STYLES.length,
  hairColor: HAIR_COLORS.length,
  outfit: OUTFITS.length,
  outfitColor: OUTFIT_COLORS.length,
  accessory: ACCESSORIES.length,
} as const
