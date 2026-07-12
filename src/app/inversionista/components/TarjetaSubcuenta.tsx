import { Ionicons } from '@/components/Icono';
import { Text, Touchable, View } from '@/components/rn';

import EstadoBadge from '@/components/shared/EstadoBadge';
import { porcentaje, puntos, usd } from '@/utils/formato';

import { COLOR_PERFIL } from './BarraCapital';
import type { Subcuenta } from '../types/inversionista';

interface Props {
  subcuenta: Subcuenta;
  onPress: () => void;
}

/**
 * Una subcuenta en la lista del Home: nombre, USD, perfil, en qué está invertida y en
 * qué punto de la revisión va. Todos los números vienen servidos por el backend.
 */
export default function TarjetaSubcuenta({ subcuenta, onPress }: Props) {
  const color = COLOR_PERFIL[subcuenta.perfil];

  return (
    <Touchable
      onPress={onPress}
      className="gap-3 rounded-2xl border border-surface-border bg-surface-background p-5"
    >
      <View className="flex-row items-start gap-3">
        <View className="mt-1.5 h-3 w-3 rounded-full" style={{ backgroundColor: color }} />

        <View className="flex-1 gap-1">
          <Text className="text-body-md font-bold text-text-primary" numberOfLines={1}>
            {subcuenta.nombre}
          </Text>
          <Text className="text-display font-bold text-text-primary">
            {usd(subcuenta.monto)}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={20} color="#A1A1AA" />
      </View>

      <View className="flex-row flex-wrap items-center gap-2">
        <View className="rounded-full px-3 py-1" style={{ backgroundColor: `${color}1A` }}>
          <Text className="text-caption font-bold capitalize" style={{ color }}>
            {subcuenta.perfil} · {puntos(subcuenta.puntaje, subcuenta.puntaje_max)}
          </Text>
        </View>

        {/* Null mientras el cliente no haya abierto su propuesta. */}
        {subcuenta.estado ? (
          <EstadoBadge estado={subcuenta.estado} />
        ) : (
          <View className="rounded-full bg-surface-secondary px-3 py-1">
            <Text className="text-caption font-bold text-text-secondary">Sin propuesta</Text>
          </View>
        )}
      </View>

      {subcuenta.instrumento_principal ? (
        <Text className="text-caption text-text-secondary" numberOfLines={1}>
          Principalmente en {subcuenta.instrumento_principal}
          {subcuenta.retorno_esperado_anual != null
            ? ` · ${porcentaje(subcuenta.retorno_esperado_anual)} anual estimado`
            : ''}
        </Text>
      ) : null}
    </Touchable>
  );
}
