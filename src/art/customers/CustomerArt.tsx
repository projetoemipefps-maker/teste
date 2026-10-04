import type { CustomerTypeId } from '@/game/config'
import type { CustomerLook, Mood } from '@/game/engine'
import { INK } from '../palette'
import { ACCESSORIES, HAIR_COLORS, HAIR_STYLES, OUTFITS, OUTFIT_COLORS, SKIN_TONES } from './parts'

const TORSO = 'M10 150 Q10 106 60 102 Q110 106 110 150Z'
const S = { stroke: INK, strokeWidth: 4, strokeLinejoin: 'round' as const }

const at = <T,>(list: readonly T[], i: number): T => list[((i % list.length) + list.length) % list.length]!

/** Cor de um acessório de destaque, diferente da roupa. */
const accent = (outfitColor: number) => at(OUTFIT_COLORS, outfitColor + 4)

function Outfit({ look, skin }: { look: CustomerLook; skin: string }) {
  const color = at(OUTFIT_COLORS, look.outfitColor)
  const kind = at(OUTFITS, look.outfit)
  switch (kind) {
    case 'polo':
      return (
        <g {...S}>
          <path d={TORSO} fill={color} />
          <path d="M42 104 L56 120 L60 104Z M78 104 L64 120 L60 104Z" fill="#FFFFFF" strokeWidth="3" />
          <path d="M60 112 V148" stroke={INK} strokeWidth="2.5" fill="none" />
        </g>
      )
    case 'hoodie':
      return (
        <g {...S}>
          <path d="M28 108 Q60 80 92 108 L94 124 Q60 134 26 124Z" fill={color} />
          <path d={TORSO} fill={color} />
          <path d="M46 104 Q60 120 74 104" fill="none" strokeWidth="3" />
          <path d="M52 114 V132 M68 114 V132" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
        </g>
      )
    case 'striped':
      return (
        <g {...S}>
          <path d={TORSO} fill={color} />
          <g fill="#fff" fillOpacity=".4" stroke="none">
            <path d="M12 118 Q60 108 108 118 V126 Q60 116 12 126Z" />
            <path d="M11 134 Q60 124 109 134 V142 Q60 132 11 142Z" />
          </g>
          <path d="M46 104 Q60 118 74 104" fill="none" strokeWidth="3" />
        </g>
      )
    case 'jacket':
      return (
        <g {...S}>
          <path d={TORSO} fill="#F5F0E6" />
          <path d="M10 150 Q10 108 42 103 L52 150Z" fill={color} />
          <path d="M110 150 Q110 108 78 103 L68 150Z" fill={color} />
          <path d="M46 104 Q60 120 74 104" fill="none" strokeWidth="3" />
        </g>
      )
    case 'overalls':
      return (
        <g {...S}>
          <path d={TORSO} fill="#F5F0E6" />
          <path d="M36 150 V124 Q36 118 44 118 H76 Q84 118 84 124 V150Z" fill={color} />
          <path d="M44 118 L40 103 M76 118 L80 103" fill="none" strokeWidth="5" stroke={color} />
          <path d="M44 118 L40 103 M76 118 L80 103" fill="none" strokeWidth="2" stroke={INK} opacity=".4" />
          <circle cx="46" cy="124" r="2.6" fill="#FFD866" strokeWidth="2" />
          <circle cx="74" cy="124" r="2.6" fill="#FFD866" strokeWidth="2" />
        </g>
      )
    case 'tank':
      return (
        <g {...S}>
          <path d={TORSO} fill={skin} />
          <path d="M24 150 Q24 114 44 104 L50 112 Q60 122 70 112 L76 104 Q96 114 96 150Z" fill={color} />
        </g>
      )
    case 'suit':
      return (
        <g {...S}>
          <path d={TORSO} fill="#2F3340" />
          <path d="M45 103 L60 130 L75 103Z" fill="#fff" strokeWidth="3" />
          <path d="M44 104 L56 134 L48 150 M76 104 L64 134 L72 150" fill="none" strokeWidth="3" />
          <path d="M57 116 L63 116 L65 140 L60 146 L55 140Z" fill={color} strokeWidth="2.5" />
        </g>
      )
    case 'tee':
    default:
      return (
        <g {...S}>
          <path d={TORSO} fill={color} />
          <path d="M46 103 Q60 118 74 103" fill="#fff" fillOpacity=".35" strokeWidth="3" />
        </g>
      )
  }
}

function HairBack({ look }: { look: CustomerLook }) {
  const hair = at(HAIR_COLORS, look.hairColor)
  const style = at(HAIR_STYLES, look.hairStyle)
  if (style === 'long') return <path d="M22 70 Q12 16 60 14 Q108 16 98 70 L100 106 Q60 116 20 106Z" fill={hair} {...S} />
  if (style === 'bob') return <path d="M24 66 Q18 18 60 16 Q102 18 96 66 L96 88 Q90 94 82 86 L38 86 Q30 94 24 88Z" fill={hair} {...S} />
  if (style === 'ponytail') return <path d="M88 38 Q114 40 110 70 Q106 96 94 90 Q100 72 90 56Z" fill={hair} {...S} />
  return null
}

function HairFront({ look }: { look: CustomerLook }) {
  const hair = at(HAIR_COLORS, look.hairColor)
  const style = at(HAIR_STYLES, look.hairStyle)
  const fringe = 'M26 54 Q22 18 60 18 Q98 18 94 54 Q86 36 60 36 Q34 36 26 54Z'
  switch (style) {
    case 'bald':
      return <path d="M46 34 Q56 28 66 30" fill="none" stroke="#fff" strokeOpacity=".55" strokeWidth="4" strokeLinecap="round" />
    case 'cap': {
      const cap = at(OUTFIT_COLORS, look.outfitColor + 2)
      return (
        <g fill={cap} {...S}>
          <path d="M24 50 Q26 14 60 14 Q94 14 96 50Z" />
          <path d="M18 50 H102 Q108 56 98 58 H22 Q12 56 18 50Z" />
          <path d="M44 24 Q54 18 66 20" fill="none" stroke="#fff" strokeOpacity=".5" strokeLinecap="round" />
        </g>
      )
    }
    case 'curly':
      return (
        <g fill={hair} {...S}>
          {[28, 40, 54, 68, 82, 92].map((x, i) => (
            <circle key={x} cx={x} cy={i % 2 ? 22 : 26} r="13" />
          ))}
          <path d="M28 46 Q30 32 60 32 Q90 32 92 46 Q80 38 60 38 Q40 38 28 46Z" />
        </g>
      )
    case 'bun':
      return (
        <g fill={hair} {...S}>
          <circle cx="60" cy="12" r="13" />
          <path d={fringe} />
        </g>
      )
    case 'spiky':
      return <path d="M28 50 L24 28 L38 36 L44 12 L56 30 L66 8 L74 30 L88 12 L90 36 L100 26 L94 52 Q84 36 60 36 Q36 36 28 50Z" fill={hair} {...S} />
    case 'short':
    case 'long':
    case 'bob':
    case 'ponytail':
    default:
      return <path d={fringe} fill={hair} {...S} />
  }
}

function Eyes({ mood }: { mood: Mood }) {
  if (mood === 'happy') {
    return (
      <g fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round">
        <path d="M37 64 Q44 55 51 64" />
        <path d="M69 64 Q76 55 83 64" />
      </g>
    )
  }
  if (mood === 'impatient') {
    return (
      <g>
        <circle cx="45" cy="63" r="7.5" fill="#fff" stroke={INK} strokeWidth="2.5" />
        <circle cx="75" cy="63" r="7.5" fill="#fff" stroke={INK} strokeWidth="2.5" />
        <circle cx="48.5" cy="64" r="3.6" fill={INK} />
        <circle cx="78.5" cy="64" r="3.6" fill={INK} />
      </g>
    )
  }
  return (
    <g>
      <ellipse cx="45" cy="63" rx="5.5" ry="7.5" fill={INK} />
      <ellipse cx="75" cy="63" rx="5.5" ry="7.5" fill={INK} />
      <circle cx="47" cy="60" r="2" fill="#fff" />
      <circle cx="77" cy="60" r="2" fill="#fff" />
    </g>
  )
}

function Mouth({ mood }: { mood: Mood }) {
  switch (mood) {
    case 'happy':
      return (
        <g>
          <path d="M44 76 Q60 100 76 76 Z" fill="#8A2420" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M52 88 Q60 82 68 88 Q60 94 52 88Z" fill="#FF7D7D" />
        </g>
      )
    case 'angry':
      return <path d="M48 87 Q60 76 72 87" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
    case 'impatient':
      return <path d="M48 84 Q54 80 60 84 T72 84" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" />
    default:
      return <path d="M51 82 Q60 87 69 82" fill="none" stroke={INK} strokeWidth="4.5" strokeLinecap="round" />
  }
}

function Brows({ mood }: { mood: Mood }) {
  if (mood === 'angry') {
    return (
      <g stroke={INK} strokeWidth="5" strokeLinecap="round">
        <path d="M34 49 L54 56" />
        <path d="M86 49 L66 56" />
      </g>
    )
  }
  if (mood === 'impatient') {
    return (
      <g stroke={INK} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M36 50 Q45 44 54 50" />
        <path d="M66 54 H84" />
      </g>
    )
  }
  return null
}

function Accessory({ look, skin }: { look: CustomerLook; skin: string }) {
  const hair = at(HAIR_COLORS, look.hairColor)
  switch (at(ACCESSORIES, look.accessory)) {
    case 'glasses':
      return (
        <g fill="#fff" fillOpacity=".3" stroke={INK} strokeWidth="3.5">
          <circle cx="45" cy="63" r="12" />
          <circle cx="75" cy="63" r="12" />
          <path d="M57 63 H63" fill="none" />
        </g>
      )
    case 'sunglasses':
      return (
        <g stroke={INK} strokeWidth="3.5" strokeLinejoin="round">
          <path d="M31 54 H57 V68 Q57 76 49 76 H39 Q31 76 31 68Z" fill="#1E1E24" />
          <path d="M63 54 H89 V68 Q89 76 81 76 H71 Q63 76 63 68Z" fill="#1E1E24" />
          <path d="M57 58 H63" fill="none" />
          <path d="M36 59 L44 59 M68 59 L76 59" stroke="#fff" strokeOpacity=".6" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        </g>
      )
    case 'headphones':
      return (
        <g {...S}>
          <path d="M26 58 Q26 12 60 12 Q94 12 94 58" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
          <path d="M26 58 Q26 12 60 12 Q94 12 94 58" fill="none" stroke={accent(look.outfitColor)} strokeWidth="4.5" strokeLinecap="round" />
          <rect x="16" y="54" width="14" height="24" rx="6" fill={accent(look.outfitColor)} />
          <rect x="90" y="54" width="14" height="24" rx="6" fill={accent(look.outfitColor)} />
        </g>
      )
    case 'mustache':
      return <path d="M44 79 Q52 72 60 77 Q68 72 76 79 Q68 83 60 80 Q52 83 44 79Z" fill={hair} stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
    case 'beard':
      return (
        <path d="M30 70 Q32 106 60 110 Q88 106 90 70 Q86 92 60 92 Q34 92 30 70Z" fill={hair} stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />
      )
    case 'scarf':
      return (
        <g fill={accent(look.outfitColor)} {...S}>
          <path d="M36 98 Q60 112 84 98 L88 114 Q60 128 32 114Z" />
          <path d="M70 112 L78 136 L64 134Z" />
        </g>
      )
    case 'freckles':
      return (
        <g fill={skin === SKIN_TONES[0]!.base ? '#C8734A' : '#6B3A22'} opacity=".7">
          {[[36, 74], [42, 78], [48, 74], [72, 74], [78, 78], [84, 74]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="1.8" />
          ))}
        </g>
      )
    case 'none':
    default:
      return null
  }
}

/** Uma pessoa: roupa, cabeça, cabelo, rosto e acessório, tudo gerado das partes do visual. */
function Person({ look, mood, type }: { look: CustomerLook; mood: Mood; type: CustomerTypeId }) {
  const tone = at(SKIN_TONES, look.skin)
  const accessory = at(ACCESSORIES, look.accessory)
  return (
    <g>
      <HairBack look={look} />
      <Outfit look={look} skin={tone.base} />
      <rect x="49" y="86" width="22" height="20" rx="6" fill={tone.shade} stroke={INK} strokeWidth="4" />
      <circle cx="25" cy="64" r="7" fill={tone.base} stroke={INK} strokeWidth="4" />
      <circle cx="95" cy="64" r="7" fill={tone.base} stroke={INK} strokeWidth="4" />
      <ellipse cx="60" cy="62" rx="34" ry="36" fill={tone.base} stroke={INK} strokeWidth="4" />
      {accessory === 'beard' && <Accessory look={look} skin={tone.base} />}
      {mood === 'happy' && (
        <g fill="#FF8F8F" opacity=".6">
          <ellipse cx="36" cy="76" rx="7" ry="4.5" />
          <ellipse cx="84" cy="76" rx="7" ry="4.5" />
        </g>
      )}
      {mood === 'angry' && (
        <g fill="#E63B2E" opacity=".28">
          <ellipse cx="36" cy="74" rx="9" ry="6" />
          <ellipse cx="84" cy="74" rx="9" ry="6" />
        </g>
      )}
      <HairFront look={look} />
      <Eyes mood={mood} />
      <Brows mood={mood} />
      <Mouth mood={mood} />
      {accessory !== 'beard' && <Accessory look={look} skin={tone.base} />}
      {mood === 'impatient' && (
        <path d="M98 34 Q104 44 98 50 Q92 44 98 34Z" fill="#7CC6F2" stroke={INK} strokeWidth="2.5" strokeLinejoin="round" />
      )}
      {type === 'hurried' && (
        <g stroke={INK} strokeWidth="3" strokeLinecap="round" opacity=".4">
          <path d="M6 52 H17 M2 62 H15 M6 72 H17" />
        </g>
      )}
      {type === 'critic' && (
        <g {...S} strokeWidth="3">
          <rect x="78" y="118" width="32" height="28" rx="3" fill="#FFFDF5" />
          <path d="M84 126 H104 M84 133 H104 M84 140 H98" stroke={INK} strokeWidth="2" fill="none" />
        </g>
      )}
      {type === 'influencer' && (
        <g {...S} strokeWidth="3">
          <rect x="88" y="66" width="20" height="34" rx="4" fill="#1E1E24" />
          <rect x="91" y="70" width="14" height="22" rx="2" fill="#7CC6F2" stroke="none" />
          <circle cx="86" cy="104" r="6" fill={tone.base} />
        </g>
      )}
    </g>
  )
}

interface Props {
  look: CustomerLook
  type?: CustomerTypeId
  mood: Mood
  /** Segunda pessoa (família): desenhada ao lado, menor. */
  companion?: CustomerLook | null
  className?: string
}

/** Cliente gerado por partes (tom de pele, cabelo, roupa e acessórios) com expressão feliz, neutra, impaciente ou brava. */
export function CustomerArt({ look, type = 'normal', mood, companion = null, className }: Props) {
  const kidScale = type === 'kid' ? 0.84 : 1
  const wide = companion !== null
  return (
    <svg viewBox={wide ? '0 0 172 150' : '0 0 120 150'} className={className} aria-hidden>
      {wide ? (
        <>
          <g transform="translate(58 38) scale(.72)">
            <Person look={companion!} mood={mood} type="kid" />
          </g>
          <Person look={look} mood={mood} type={type} />
        </>
      ) : (
        <g transform={`translate(60 150) scale(${kidScale}) translate(-60 -150)`}>
          <Person look={look} mood={mood} type={type} />
        </g>
      )}
    </svg>
  )
}
