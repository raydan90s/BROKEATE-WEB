import { IoArrowBack } from 'react-icons/io5';

import { Touchable } from '@/components/rn';

/**
 * El "Atrás" de todas las cabeceras. Es una flecha, no texto.
 *
 * En RN el área táctil se agrandaba con `hitSlop`/margen negativo porque 24px es un blanco
 * chico para el pulgar. En web el padding + `:hover` del botón ya cumplen ese papel, así
 * que se conserva `-m-1 p-1` pero sin el `hitSlop`.
 */
export default function BotonAtras({ onPress }: { onPress: () => void }) {
  return (
    <Touchable
      onPress={onPress}
      accessibilityLabel="Atrás"
      className="-m-1 w-fit p-1"
    >
      <IoArrowBack size={24} color="#1E3A8A" />
    </Touchable>
  );
}
