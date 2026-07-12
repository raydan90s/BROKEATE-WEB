import { useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { Text, Touchable, View, abrirEnlace } from '@/components/rn';
import { useColores } from '@/context/ThemeContext';

import type { SourceChip } from '../services/agentApi';

/**
 * Los "source chips": debajo de cada respuesta del asistente, de dónde salió cada dato.
 *
 * Es el diferenciador del proyecto y la respuesta visual al criterio de antialucinación:
 * cada afirmación de la IA se puede verificar con un tap.
 */

const FUENTE: Record<string, string> = {
  proposal_items: 'De tu propuesta',
  scoring_rules: 'De las reglas de tu perfil',
  instruments: 'Del catálogo de productos',
  institutions: 'Del catálogo de emisores',
  alpha_vantage: 'De Alpha Vantage (mercado externo, no es del banco)',
  // Noticias (Ruta D): titular de un medio externo. El chip abre la nota original.
  gnews: 'Noticia — abre la fuente',
};

const esFuenteExterna = (table: string) => table === 'alpha_vantage';

// Los chips de noticia NO abren un detalle: llevan directo a la nota original.
const esNoticia = (table: string) => table === 'gnews';

export default function SourceChips({ sources }: { sources: SourceChip[] }) {
  const colores = useColores();
  const [abierto, setAbierto] = useState<string | null>(null);

  if (!sources.length) return null;

  return (
    <View className="mt-2 gap-2">
      <View className="flex-row flex-wrap gap-1.5">
        {sources.map((s) => {
          const activo = abierto === s.record_id;
          const externa = esFuenteExterna(s.table);
          const noticia = esNoticia(s.table);
          const abrir = () => {
            // Una noticia lleva directo a su fuente; el resto abre el detalle inline.
            if (noticia && s.record_id.startsWith('http')) {
              abrirEnlace(s.record_id);
            } else {
              setAbierto(activo ? null : s.record_id);
            }
          };
          return (
            <Touchable
              key={`${s.table}-${s.record_id}`}
              onPress={abrir}
              className={`flex-row items-center gap-1 rounded-full border px-2.5 py-1 ${
                externa
                  ? 'border-state-warning bg-stateAlpha-warningSoft'
                  : activo
                    ? 'border-brand-primary bg-brandAlpha-primaryMedium'
                    : 'border-brandAlpha-primaryMedium bg-brandAlpha-primarySoft'
              }`}
            >
              <Ionicons
                name={
                  noticia ? 'open-outline' : externa ? 'trending-up-outline' : 'document-text-outline'
                }
                size={11}
                color={externa ? colores.advertencia : colores.primario}
              />
              <Text
                className={`text-caption font-semibold ${externa ? 'text-state-warning' : 'text-brand-primary'}`}
              >
                {s.label}
              </Text>
            </Touchable>
          );
        })}
      </View>

      {abierto
        ? sources
            .filter((s) => s.record_id === abierto)
            .map((s) => (
              <View
                key={`detalle-${s.table}-${s.record_id}`}
                className="gap-1 rounded-xl border border-surface-border bg-surface-elevated p-3"
              >
                <View className="flex-row items-center gap-1.5">
                  <Ionicons name="shield-checkmark-outline" size={13} color={colores.exito} />
                  <Text className="text-caption font-bold uppercase text-text-secondary">
                    {FUENTE[s.table] ?? 'Dato verificado'}
                  </Text>
                </View>
                <Text className="text-body text-text-primary">{s.label}</Text>
                <Text className="text-caption text-text-muted">
                  Fuente: {s.table} · {s.record_id}
                </Text>
              </View>
            ))
        : null}
    </View>
  );
}
