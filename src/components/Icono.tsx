import {
  IoAdd,
  IoAddCircleOutline,
  IoAlertCircle,
  IoAlertCircleOutline,
  IoArrowBack,
  IoArrowForward,
  IoArrowUp,
  IoCalculatorOutline,
  IoCaretDown,
  IoCaretUp,
  IoChatbubbleEllipsesOutline,
  IoCheckmarkCircle,
  IoChevronBack,
  IoChevronDown,
  IoChevronForward,
  IoChevronUp,
  IoClose,
  IoCloseCircle,
  IoCreateOutline,
  IoDocumentTextOutline,
  IoEllipse,
  IoEyeOffOutline,
  IoEyeOutline,
  IoFlag,
  IoHardwareChipOutline,
  IoHelpCircleOutline,
  IoInformationCircle,
  IoInformationCircleOutline,
  IoKeyOutline,
  IoLayersOutline,
  IoLockClosedOutline,
  IoLogOutOutline,
  IoLogoWhatsapp,
  IoMailOutline,
  IoRadioButtonOff,
  IoRadioButtonOn,
  IoRefresh,
  IoSearch,
  IoShieldCheckmark,
  IoShieldCheckmarkOutline,
  IoSparkles,
  IoSwapHorizontalOutline,
  IoTimeOutline,
  IoTrendingUpOutline,
  IoUnlinkOutline,
  IoWarning,
} from 'react-icons/io5'
import type { IconType } from 'react-icons'

/**
 * `Ionicons` de @expo/vector-icons, reimplementado sobre react-icons/io5 — que ES la
 * misma familia (mismos glifos, mismos nombres en kebab-case). Existe para que portar las
 * pantallas sea cambiar UN import: `@expo/vector-icons` → `@/components/Icono`, y nada del
 * JSX `<Ionicons name="..." size color />` se toca.
 */
const MAPA: Record<string, IconType> = {
  add: IoAdd,
  'add-circle-outline': IoAddCircleOutline,
  'alert-circle': IoAlertCircle,
  'alert-circle-outline': IoAlertCircleOutline,
  'arrow-back': IoArrowBack,
  'arrow-forward': IoArrowForward,
  'arrow-up': IoArrowUp,
  'calculator-outline': IoCalculatorOutline,
  'caret-down': IoCaretDown,
  'caret-up': IoCaretUp,
  'chatbubble-ellipses-outline': IoChatbubbleEllipsesOutline,
  'checkmark-circle': IoCheckmarkCircle,
  'chevron-back': IoChevronBack,
  'chevron-down': IoChevronDown,
  'chevron-forward': IoChevronForward,
  'chevron-up': IoChevronUp,
  close: IoClose,
  'close-circle': IoCloseCircle,
  'create-outline': IoCreateOutline,
  'document-text-outline': IoDocumentTextOutline,
  ellipse: IoEllipse,
  'eye-off-outline': IoEyeOffOutline,
  'eye-outline': IoEyeOutline,
  flag: IoFlag,
  'hardware-chip-outline': IoHardwareChipOutline,
  'help-circle-outline': IoHelpCircleOutline,
  'information-circle': IoInformationCircle,
  'information-circle-outline': IoInformationCircleOutline,
  'key-outline': IoKeyOutline,
  'layers-outline': IoLayersOutline,
  'lock-closed-outline': IoLockClosedOutline,
  'log-out-outline': IoLogOutOutline,
  'logo-whatsapp': IoLogoWhatsapp,
  'mail-outline': IoMailOutline,
  'radio-button-off': IoRadioButtonOff,
  'radio-button-on': IoRadioButtonOn,
  refresh: IoRefresh,
  search: IoSearch,
  'shield-checkmark': IoShieldCheckmark,
  'shield-checkmark-outline': IoShieldCheckmarkOutline,
  sparkles: IoSparkles,
  'swap-horizontal-outline': IoSwapHorizontalOutline,
  'time-outline': IoTimeOutline,
  'trending-up-outline': IoTrendingUpOutline,
  'unlink-outline': IoUnlinkOutline,
  warning: IoWarning,
}

export function Ionicons({
  name,
  size = 24,
  color = 'currentColor',
  className,
}: {
  name: string
  size?: number
  color?: string
  className?: string
}) {
  const Glifo = MAPA[name] ?? IoEllipse
  return <Glifo size={size} color={color} className={className} />
}

// Algunas pantallas tipan props como `keyof typeof Ionicons.glyphMap`. Se expone un
// objeto con esa forma para que ese tipo siga resolviendo sin tocar las pantallas.
Ionicons.glyphMap = MAPA as unknown as Record<string, number>

export default Ionicons
