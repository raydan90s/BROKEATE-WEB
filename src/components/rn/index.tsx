import type { CSSProperties, ReactNode } from 'react'

/**
 * Las primitivas de React Native, en HTML.
 *
 * NO es react-native-web: son envoltorios finos sobre `div` / `span` / `button` / `input`
 * que aceptan `className` y traducen las props de RN (`onPress`, `onChangeText`,
 * `numberOfLines`). Existen para que portar las 40 pantallas sea cambiar el import y poco
 * más, en vez de reescribir 6.163 líneas de JSX a mano.
 *
 * El layout base (flex column, no encoger) vive en `.rn-vista` / `.rn-tactil` en
 * `index.css`; lee el comentario de ahí antes de tocar nada.
 */

interface Base {
  className?: string
  style?: CSSProperties
  children?: ReactNode
}

/** <View> → <div>. Ojo: `.rn-vista` es lo que le devuelve el `flex-direction: column`. */
export function View({ className = '', style, children }: Base) {
  return (
    <div className={`rn-vista ${className}`} style={style}>
      {children}
    </div>
  )
}

/**
 * Las clases van escritas enteras y NO construidas con plantilla (`line-clamp-${n}`): el
 * JIT de Tailwind escanea el código como texto plano, así que una clase que solo existe
 * al ejecutarse jamás llega al CSS. Falla en silencio y el recorte simplemente no ocurre.
 */
const RECORTE: Record<number, string> = {
  1: 'truncate',
  2: 'line-clamp-2',
  3: 'line-clamp-3',
  4: 'line-clamp-4',
  5: 'line-clamp-5',
}

/** <Text> → <span>. `numberOfLines` se traduce a `line-clamp`. */
export function Text({
  className = '',
  style,
  numberOfLines,
  children,
}: Base & { numberOfLines?: number }) {
  const recorte = numberOfLines ? (RECORTE[numberOfLines] ?? '') : ''

  return (
    <span className={`${recorte} ${className}`} style={style}>
      {children}
    </span>
  )
}

/**
 * <ScrollView> → un div con overflow.
 *
 * `contentContainerClassName` reemplaza al `contentContainerStyle` de RN: en RN el
 * contenido vive en un contenedor aparte del scroller, y las pantallas le pasan el
 * padding y el `gap` ahí. Si se colapsan los dos divs en uno, el padding inferior se
 * pierde al hacer scroll.
 */
export function ScrollView({
  className = '',
  contentContainerClassName = '',
  horizontal = false,
  children,
}: Base & { contentContainerClassName?: string; horizontal?: boolean }) {
  if (horizontal) {
    // Fila que desliza en X. El contenido va en flex-row y sin encoger, para que las
    // tarjetas conserven su ancho (w-36 del ticker) en vez de comprimirse.
    return (
      <div className={`overflow-x-auto ${className}`}>
        <div className={`flex flex-row [&>*]:flex-shrink-0 ${contentContainerClassName}`}>
          {children}
        </div>
      </div>
    )
  }
  return (
    <div className={`flex-1 overflow-y-auto ${className}`}>
      <div className={`rn-vista ${contentContainerClassName}`}>{children}</div>
    </div>
  )
}

/**
 * <TouchableOpacity> / <Pressable> → <button>.
 *
 * `activeOpacity` y `hitSlop` de RN no se replican: en web el `:hover` y el área del
 * botón ya cumplen ese papel. Se aceptan y se ignoran para no tener que borrarlos de las
 * 165 llamadas al portar.
 */
export function Touchable({
  className = '',
  style,
  onPress,
  disabled = false,
  accessibilityLabel,
  children,
}: Base & {
  onPress?: () => void
  disabled?: boolean
  accessibilityLabel?: string
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={accessibilityLabel}
      style={style}
      className={`rn-tactil transition-opacity hover:opacity-85 disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  )
}

/** Alias: en las pantallas conviven `TouchableOpacity` y `Pressable`. */
export const Pressable = Touchable

/** <ActivityIndicator> → spinner CSS. Misma API: `size` y `color`. */
export function ActivityIndicator({
  size = 'small',
  color = '#14375E',
}: {
  size?: 'small' | 'large'
  color?: string
}) {
  const lado = size === 'large' ? 'h-9 w-9 border-[3px]' : 'h-5 w-5 border-2'
  return <span className={`spinner ${lado}`} style={{ borderTopColor: color }} />
}

/**
 * <SafeAreaView> → un View que ocupa el alto disponible.
 *
 * En web no hay notch que esquivar, pero las pantallas lo usan como raíz con `flex-1`,
 * así que se conserva para no tocar su estructura.
 */
export function SafeArea({ className = '', children }: Base) {
  return <View className={`min-h-full flex-1 ${className}`}>{children}</View>
}

type TipoTeclado = 'default' | 'numeric' | 'decimal-pad' | 'number-pad' | 'email-address'

/**
 * <TextInput> → <input> / <textarea>.
 *
 * La diferencia que importa: RN entrega el texto (`onChangeText(valor)`), el DOM entrega
 * el evento. Traducirlo acá evita tocar los 21 sitios donde se usa.
 */
export function TextInput({
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  secureTextEntry = false,
  multiline = false,
  editable = true,
  maxLength,
  autoFocus = false,
  className = '',
  onSubmitEditing,
  onFocus,
  onBlur,
}: {
  value: string
  onChangeText: (texto: string) => void
  placeholder?: string
  keyboardType?: TipoTeclado
  secureTextEntry?: boolean
  multiline?: boolean
  editable?: boolean
  maxLength?: number
  autoFocus?: boolean
  className?: string
  onSubmitEditing?: () => void
  onFocus?: () => void
  onBlur?: () => void
}) {
  const comun = {
    value,
    placeholder,
    maxLength,
    autoFocus,
    disabled: !editable,
    onFocus,
    onBlur,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChangeText(e.target.value),
    className: `outline-none placeholder:text-text-muted focus:border-brand-primary ${className}`,
  }

  if (multiline) {
    return <textarea {...comun} rows={4} />
  }

  // `inputMode` es lo que saca el teclado numérico en el móvil; `type` se queda en "text"
  // porque `type=number` trae flechas y bloquea la coma decimal ecuatoriana que usan
  // `montoConSeparadores` / `montoANumero`.
  const inputMode =
    keyboardType === 'numeric' || keyboardType === 'number-pad'
      ? 'numeric'
      : keyboardType === 'decimal-pad'
        ? 'decimal'
        : keyboardType === 'email-address'
          ? 'email'
          : undefined

  return (
    <input
      {...comun}
      type={secureTextEntry ? 'password' : keyboardType === 'email-address' ? 'email' : 'text'}
      inputMode={inputMode}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onSubmitEditing) onSubmitEditing()
      }}
    />
  )
}

/**
 * <Modal> → overlay fijo.
 *
 * No usa <dialog> a propósito: `showModal()` es imperativo y habría que sincronizarlo con
 * el `visible` que ya usan las pantallas. Esto respeta la misma API declarativa de RN.
 */
export function Modal({
  visible,
  onRequestClose,
  children,
}: {
  visible: boolean
  onRequestClose?: () => void
  children: ReactNode
}) {
  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onRequestClose}
    >
      {/* El clic dentro del panel no debe cerrarlo. */}
      <div
        className="rn-vista max-h-[90dvh] w-full max-w-[480px] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

/** `Linking.openURL` → `window.open`. `noopener` no es opcional: sin él, la página
 *  abierta puede manipular a la nuestra vía `window.opener`. */
export function abrirEnlace(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
