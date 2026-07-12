import { IoInformationCircle } from 'react-icons/io5';

import { Text, View } from '@/components/rn';
import { useColores } from '@/context/ThemeContext';

/**
 * HU2, criterio 3: la app **no ejecuta operaciones ni promete rendimientos**.
 *
 * No es descartable a propósito: si el usuario pudiera cerrarlo, existiría una pantalla
 * con una propuesta de inversión y sin la advertencia. No agregues un botón de cerrar.
 */
export default function DisclaimerBanner() {
  const colores = useColores();

  return (
    <View className="flex-row gap-3 rounded-2xl bg-stateAlpha-warningSoft p-4">
      <View className="pt-0.5">
        <IoInformationCircle size={20} color={colores.advertencia} />
      </View>
      <Text className="flex-1 text-caption leading-4 text-text-primary">
        Esta es una <Text className="font-bold">propuesta referencial</Text> sujeta a la
        revisión de un asesor. No constituye una orden de inversión, no se ejecuta
        automáticamente y no garantiza rendimientos. Los retornos mostrados son estimados.
      </Text>
    </View>
  );
}
