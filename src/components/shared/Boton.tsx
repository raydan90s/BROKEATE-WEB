import { ActivityIndicator, Text, Touchable } from '@/components/rn'

interface BotonProps {
  titulo: string;
  onPress: () => void;
  /** primario = azul marino sólido; secundario = tinte azul suave (tabs, filtros). */
  variante?: 'primario' | 'secundario';
  deshabilitado?: boolean;
  cargando?: boolean;
}

/** El botón de Brokeate: azul marino, esquinas 2xl, texto en negrita. */
export default function Boton({
  titulo,
  onPress,
  variante = 'primario',
  deshabilitado = false,
  cargando = false,
}: BotonProps) {
  const inactivo = deshabilitado || cargando;
  const fondo =
    variante === 'primario'
      ? inactivo
        ? 'bg-brandAlpha-primaryMedium'
        : 'bg-brand-primary'
      : 'bg-brandAlpha-primarySoft';
  const letra = variante === 'primario' ? 'text-text-onPrimary' : 'text-brand-mid';

  return (
    <Touchable
      onPress={onPress}
      disabled={inactivo}
      className={`items-center justify-center rounded-2xl px-6 py-3.5 ${fondo}`}
    >
      {cargando ? (
        <ActivityIndicator color={variante === 'primario' ? '#FFFFFF' : '#1E5C9B'} />
      ) : (
        <Text className={`text-body-md font-bold ${letra}`}>{titulo}</Text>
      )}
    </Touchable>
  );
}
