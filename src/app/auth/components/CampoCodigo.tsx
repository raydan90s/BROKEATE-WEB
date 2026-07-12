import { Text, TextInput, View } from '@/components/rn';

interface CampoCodigoProps {
  valor: string;
  onCambiar: (codigo: string) => void;
  conError?: boolean;
  editable?: boolean;
  /** Se dispara al completar los 6 dígitos: el usuario no tiene que buscar el botón. */
  onCompleto?: (codigo: string) => void;
}

export const LARGO_CODIGO = 6;

/**
 * El campo de los 6 dígitos.
 *
 * Un solo `TextInput` grande y no seis cajitas: seis inputs con foco encadenado se pelean
 * con el autocompletado del correo y rompen el pegado (`Ctrl+V` mete los 6 dígitos en la
 * primera). Este acepta pegar, filtra lo que no sea dígito y corta en 6.
 */
export default function CampoCodigo({
  valor,
  onCambiar,
  conError = false,
  editable = true,
  onCompleto,
}: CampoCodigoProps) {
  function alEscribir(texto: string) {
    // Al pegar puede venir con espacios y guiones: se filtran.
    const limpio = texto.replace(/\D/g, '').slice(0, LARGO_CODIGO);
    onCambiar(limpio);
    if (limpio.length === LARGO_CODIGO) onCompleto?.(limpio);
  }

  return (
    <View className="gap-2">
      <Text className="text-caption font-bold uppercase text-text-secondary">
        Código de 6 dígitos
      </Text>
      <TextInput
        value={valor}
        onChangeText={alEscribir}
        editable={editable}
        placeholder="––––––"
        keyboardType="number-pad"
        maxLength={LARGO_CODIGO}
        className={`w-full rounded-2xl border bg-surface-elevated py-4 text-center text-display font-bold tracking-[12px] text-text-primary ${
          conError ? 'border-state-error' : 'border-surface-border'
        }`}
      />
    </View>
  );
}
