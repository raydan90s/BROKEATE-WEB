import { useCallback, useEffect, useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { ActivityIndicator, Text, Touchable, View } from '@/components/rn';

import ProviderSelector from '@/app/agente/components/ProviderSelector';
import SourceChips from '@/app/agente/components/SourceChips';
import { getProviders } from '@/app/agente/services/agentApi';
import type { ProviderInfo, SimuladorResponse } from '@/app/agente/services/agentApi';
import { COLORES } from '@/constants/colores';

interface Props {
  recomendacion: SimuladorResponse | null;
  cargando: boolean;
  error: string | null;
  /** Deshabilitado mientras no haya un monto válido que simular. */
  habilitado: boolean;
  /** Qué le falta al usuario para poder pedirla. Solo se ve con `habilitado` en false. */
  pista?: string;
  /** Pide la recomendación. `provider` = el motor de IA elegido (undefined = el default). */
  onPedir: (provider?: string) => void;
}

/**
 * La recomendación de IA sobre el catálogo. La comparten el simulador y el comparador.
 * **El motor elige y la IA explica**: la opción recomendada la marca el backend. No se
 * pide sola (es un botón), y quien la usa la borra en cuanto cambian monto/plazo/selección.
 */
export default function RecomendacionIA({
  recomendacion,
  cargando,
  error,
  habilitado,
  pista,
  onPedir,
}: Props) {
  // El motor de IA con el que se (re)genera esta recomendación. Mismo patrón que el
  // selector del chat: se puede correr la MISMA recomendación con otro motor.
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [proveedor, setProveedor] = useState<string | null>(null);

  const cargarProviders = useCallback(() => {
    getProviders()
      .then((lista) => {
        setProviders(lista);
        setProveedor((actual) => {
          if (actual && lista.some((p) => p.id === actual && p.disponible)) return actual;
          const def =
            lista.find((p) => p.es_default && p.disponible) ?? lista.find((p) => p.disponible);
          return def?.id ?? null;
        });
      })
      .catch(() => {
        /* si falla, el combo no aparece y se usa el default del backend */
      });
  }, []);

  useEffect(() => {
    cargarProviders();
  }, [cargarProviders]);

  // Cambiar de motor RE-EJECUTA la misma recomendación con ese motor (los datos no cambian).
  const cambiarMotor = (id: string) => {
    setProveedor(id);
    onPedir(id);
  };

  if (cargando) {
    return (
      <View className="flex-row items-center gap-3 rounded-2xl bg-brandAlpha-primarySoft p-5">
        <ActivityIndicator color={COLORES.primario} />
        <Text className="text-body text-text-secondary">
          Analizando las opciones del catálogo…
        </Text>
      </View>
    );
  }

  if (!recomendacion) {
    return (
      <View className="gap-3 rounded-2xl bg-brandAlpha-primarySoft p-5">
        <View className="flex-row items-center gap-2">
          <Ionicons name="sparkles" size={16} color={COLORES.primario} />
          <Text className="text-caption font-bold uppercase text-brand-primary">
            Recomendación con IA
          </Text>
        </View>
        <Text className="text-body leading-5 text-text-secondary">
          El asistente compara las opciones de abajo con tu monto y tu perfil, y te explica
          cuál conviene y por qué.
        </Text>

        {error ? (
          <View className="rounded-xl bg-stateAlpha-errorSoft px-3 py-2">
            <Text className="text-caption text-state-error">{error}</Text>
          </View>
        ) : null}

        <Touchable
          onPress={() => onPedir(proveedor ?? undefined)}
          disabled={!habilitado}
          className={`flex-row items-center justify-center gap-2 rounded-xl py-3 ${
            habilitado ? 'bg-brand-primary' : 'bg-surface-secondary'
          }`}
        >
          <Ionicons name="sparkles" size={15} color={habilitado ? '#FFFFFF' : COLORES.textoMuted} />
          <Text
            className={`text-body font-bold ${
              habilitado ? 'text-text-onPrimary' : 'text-text-muted'
            }`}
          >
            {error ? 'Reintentar' : 'Recomiéndame una opción'}
          </Text>
        </Touchable>

        {!habilitado && pista ? (
          <Text className="text-center text-caption text-text-muted">{pista}</Text>
        ) : null}
      </View>
    );
  }

  const esPlantilla = recomendacion.modelo === 'plantilla-determinista';
  const parrafos = recomendacion.texto.split('\n').filter((l) => l.trim().length > 0);

  return (
    <View className="gap-3 rounded-2xl bg-brandAlpha-primarySoft p-5">
      <View className="flex-row flex-wrap items-center gap-2">
        <Ionicons name="sparkles" size={16} color={COLORES.primario} />
        <Text className="flex-1 text-caption font-bold uppercase text-brand-primary">
          Recomendación con IA
        </Text>
        {/* Combo de motor: correr la MISMA recomendación con otro modelo de IA. */}
        {providers.length ? (
          <ProviderSelector
            providers={providers}
            value={proveedor}
            onChange={cambiarMotor}
            onOpen={cargarProviders}
          />
        ) : null}
        <Touchable
          onPress={() => onPedir(proveedor ?? undefined)}
          className="flex-row items-center gap-1"
        >
          <Ionicons name="refresh" size={13} color={COLORES.primario} />
          <Text className="text-caption font-bold text-brand-primary">Otra vez</Text>
        </Touchable>
      </View>

      {parrafos.map((linea, i) => (
        <Text key={i} className="text-body leading-5 text-text-primary">
          {linea}
        </Text>
      ))}

      <SourceChips sources={recomendacion.sources} />

      <View className="flex-row items-center gap-1.5 border-t border-brandAlpha-primaryMedium pt-2">
        <Ionicons
          name={recomendacion.guardrail_passed ? 'shield-checkmark' : 'alert-circle'}
          size={12}
          color={recomendacion.guardrail_passed ? COLORES.exito : COLORES.advertencia}
        />
        <Text className="flex-1 text-caption text-text-muted">
          {recomendacion.guardrail_passed
            ? 'Cada cifra citada existe en el catálogo: el validador del banco revisó el texto.'
            : 'El texto no pasó el validador del banco.'}
          {esPlantilla ? ' Lo escribió el motor, no el modelo.' : ''}
        </Text>
      </View>
    </View>
  );
}
