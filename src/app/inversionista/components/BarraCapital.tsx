import { Text, View } from '@/components/rn';

import { useTema } from '@/context/ThemeContext';
import { usd } from '@/utils/formato';

import type { PerfilRiesgo, Subcuenta } from '../types/inversionista';

/**
 * Un color por perfil de riesgo. El mismo en la barra y en los badges.
 *
 * En oscuro son los mismos tonos subidos de luminosidad. NO es cosmético: el
 * `#1E3A8A` de "moderado" es un azul marino, y sobre la tarjeta oscura (#121B2B)
 * su chip quedaba en 1,4:1 — literalmente ilegible. Por eso esto es un hook y no
 * la constante que era: tiene que repintarse al alternar el tema.
 */
const PALETA_PERFIL: Record<'light' | 'dark', Record<PerfilRiesgo, string>> = {
  light: {
    conservador: '#0891B2',
    moderado: '#1E3A8A',
    agresivo: '#D97706',
  },
  // Más saturados que sus gemelos claros, no solo más luminosos. Un tono pastel sobre el
  // lienzo oscuro se lee como "descolorido", y dos pasteles vecinos en la barra se funden
  // en una sola mancha: entre el cian y el azul de antes había 1,05:1 de diferencia de
  // luminancia — el mismo brillo con distinto matiz, que es justo lo que el ojo no separa.
  dark: {
    conservador: '#22D3EE',
    moderado: '#5B9DF9',
    agresivo: '#FBBF24',
  },
};

/** El color del perfil en el tema activo. Lo usan la barra y las tarjetas de subcuenta. */
export function useColorPerfil(): Record<PerfilRiesgo, string> {
  return PALETA_PERFIL[useTema().tema];
}

interface Props {
  capitalTotal: number | null;
  asignado: number;
  sinAsignar: number | null;
  subcuentas: Subcuenta[];
}

function Cifra({
  etiqueta,
  valor,
  color,
}: {
  etiqueta: string;
  valor: number | null;
  color: string;
}) {
  return (
    <View className="flex-1 gap-1">
      <Text className="text-caption uppercase text-text-muted">{etiqueta}</Text>
      <Text className={`text-body-md font-bold ${color}`}>{usd(valor)}</Text>
    </View>
  );
}

/**
 * Cómo está repartido el capital del cliente: un segmento por subcuenta, coloreado por
 * perfil, y el hueco gris de lo que no está invertido.
 *
 * **La barra no se normaliza.** Los segmentos son proporcionales al capital total, no a
 * la suma de las subcuentas: si el cliente declaró USD 40.000 y solo asignó 30.000, la
 * barra se ve incompleta a propósito. Una barra que se autocompleta esconde justo el
 * dato accionable — que hay USD 10.000 quietos.
 */
export default function BarraCapital({
  capitalTotal,
  asignado,
  sinAsignar,
  subcuentas,
}: Props) {
  const colorPerfil = useColorPerfil();
  const hueco = sinAsignar != null && sinAsignar > 0 ? sinAsignar : 0;
  const conMonto = subcuentas.filter((s) => s.monto > 0);
  const vacia = conMonto.length === 0 && hueco === 0;

  return (
    <View className="gap-4">
      <View className="flex-row gap-3">
        <Cifra etiqueta="Capital total" valor={capitalTotal} color="text-text-primary" />
        <Cifra etiqueta="Asignado" valor={asignado} color="text-brand-primary" />
        <Cifra
          etiqueta="Sin asignar"
          valor={sinAsignar}
          color={hueco > 0 ? 'text-state-warning' : 'text-text-secondary'}
        />
      </View>

      {vacia ? (
        <View className="h-3 rounded-full bg-surface-secondary" />
      ) : (
        // El hilo de separación (`gap`) hace por la barra lo que el color no puede: dos
        // subcuentas del mismo perfil son el mismo tono, y pegadas se leían como un único
        // segmento gordo. Con el hilo se cuentan.
        <View className="h-3 flex-row gap-[3px] overflow-hidden rounded-full bg-surface-secondary">
          {conMonto.map((s) => (
            <View
              key={s.session_id}
              className="rounded-full"
              style={{ flexGrow: s.monto, flexShrink: 1, flexBasis: 0, backgroundColor: colorPerfil[s.perfil] }}
            />
          ))}
          {/* El hueco: lo que el cliente tiene declarado y no invertido. */}
          {hueco > 0 ? (
            <View
              style={{ flexGrow: hueco, flexShrink: 1, flexBasis: 0 }}
              className="rounded-full bg-surface-divider"
            />
          ) : null}
        </View>
      )}

      {capitalTotal == null ? (
        <Text className="text-caption text-text-muted">
          Declara tu capital total para ver cuánto te queda sin asignar.
        </Text>
      ) : null}
    </View>
  );
}
