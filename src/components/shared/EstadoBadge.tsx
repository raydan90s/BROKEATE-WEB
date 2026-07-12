import { Text, View } from '@/components/rn';

import type { EstadoPropuesta } from '@/app/inversionista/types/inversionista';

/**
 * `proposal_status` de Postgres, en palabras que el cliente entiende.
 *
 * El borde va tintado del mismo color de la letra: en oscuro, el fondo `*-soft` es un tono
 * profundo muy cercano al de la tarjeta, y sin borde el badge no se leía como badge.
 */
const ESTADOS: Record<
  EstadoPropuesta,
  { texto: string; fondo: string; letra: string; borde: string }
> = {
  pending_review: {
    texto: 'En revisión',
    fondo: 'bg-stateAlpha-warningSoft',
    letra: 'text-state-warning',
    borde: 'border-state-warning/35',
  },
  approved: {
    texto: 'Aprobada',
    fondo: 'bg-stateAlpha-successSoft',
    letra: 'text-state-success',
    borde: 'border-state-success/35',
  },
  edited: {
    texto: 'Editada por el asesor',
    fondo: 'bg-brandAlpha-primarySoft',
    letra: 'text-brand-primary',
    borde: 'border-brand-primary/35',
  },
  rejected: {
    texto: 'Rechazada',
    fondo: 'bg-stateAlpha-errorSoft',
    letra: 'text-state-error',
    borde: 'border-state-error/35',
  },
};

export default function EstadoBadge({ estado }: { estado: EstadoPropuesta }) {
  const { texto, fondo, letra, borde } = ESTADOS[estado];

  return (
    <View className={`self-start rounded-full border px-3 py-1 ${fondo} ${borde}`}>
      <Text className={`text-caption font-bold ${letra}`}>{texto}</Text>
    </View>
  );
}
