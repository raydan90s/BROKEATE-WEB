import { useCallback, useEffect, useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { ScrollView, Text, TextInput, Touchable, View } from '@/components/rn';
import { useNavigation, useRoute } from '@/routes/navegacion';

import { recomendarSimulacion } from '@/app/agente/services/agentApi';
import type { SimuladorResponse } from '@/app/agente/services/agentApi';
import Calificacion from '@/components/shared/Calificacion';
import { Cargando, ErrorEstado } from '@/components/shared/Estados';
import Tarjeta from '@/components/shared/Tarjeta';
import { COLORES } from '@/constants/colores';
import { ApiError } from '@/services/http';
import { montoANumero, montoConSeparadores, porcentaje, usd } from '@/utils/formato';

import RecomendacionIA from '../components/RecomendacionIA';
import { getTasas } from '../services/catalogApi';
import type { CatalogoTasas, TasaInstrumento } from '../types/catalogo';

/** Filtro por plazo. `undefined` = todos los productos del catálogo. */
const PLAZOS: { etiqueta: string; dias?: number }[] = [
  { etiqueta: 'Todos' },
  { etiqueta: '180 días', dias: 180 },
  { etiqueta: '360 días', dias: 360 },
  { etiqueta: '720 días', dias: 720 },
];

const MONTOS_RAPIDOS = [1000, 5000, 10000, 20000, 50000];

const NOMBRE_PERFIL: Record<string, string> = {
  conservador: 'Conservador',
  moderado: 'Moderado',
  agresivo: 'Agresivo',
};

/**
 * HU2: el catálogo aprobado, ordenado por calificación y con la regla de elegibilidad
 * **a la vista**. Los no elegibles no se esconden: salen en gris con el `rationale`.
 * El monto es opcional; con él, Postgres devuelve interés e importe final y se habilita la IA.
 */
export default function ComparadorPage() {
  const navigation = useNavigation();
  const { params } = useRoute<{ monto?: number }>();

  const [montoTexto, setMontoTexto] = useState(
    params.monto != null && !Number.isNaN(params.monto)
      ? montoConSeparadores(String(params.monto))
      : '',
  );
  const [plazo, setPlazo] = useState<number | undefined>(undefined);
  const [datos, setDatos] = useState<CatalogoTasas | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [recomendacion, setRecomendacion] = useState<SimuladorResponse | null>(null);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [errorIA, setErrorIA] = useState<string | null>(null);

  const monto = montoANumero(montoTexto);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      setDatos(await getTasas({ monto: monto > 0 ? monto : undefined, plazoDias: plazo }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudieron cargar las tasas.');
    }
  }, [monto, plazo]);

  // Debounce: se recarga 400 ms después de la última tecla del monto.
  useEffect(() => {
    const timer = setTimeout(() => void cargar(), 400);
    return () => clearTimeout(timer);
  }, [cargar]);

  useEffect(() => {
    setRecomendacion(null);
    setErrorIA(null);
  }, [monto, plazo]);

  const pedirRecomendacion = useCallback(async () => {
    setCargandoIA(true);
    setErrorIA(null);
    try {
      setRecomendacion(
        await recomendarSimulacion({
          monto,
          ...(plazo != null ? { plazo_dias: plazo } : {}),
          todos_los_plazos: false,
        }),
      );
    } catch (e) {
      setErrorIA(
        e instanceof ApiError ? e.message : 'El asistente no pudo responder. Intenta otra vez.',
      );
    } finally {
      setCargandoIA(false);
    }
  }, [monto, plazo]);

  return (
    <View className="flex-1 bg-surface-canvas">
      {/* Header */}
      <View className="flex-row items-center gap-3 border-b border-surface-border bg-surface-background px-4 py-3">
        <Touchable
          onPress={() => navigation.goBack()}
          className="h-8 w-8 items-center justify-center rounded-xl"
        >
          <Ionicons name="chevron-back" size={22} color={COLORES.primario} />
        </Touchable>
        <View className="flex-1">
          <Text className="text-title font-bold text-text-primary">Comparador de tasas</Text>
          <Text className="text-caption text-text-muted">
            {monto > 0 ? `Para ${usd(monto)} · ` : ''}Tasas referenciales del catálogo
          </Text>
        </View>
        {datos?.perfil ? (
          <View className="rounded-lg bg-brandAlpha-primarySoft px-2 py-1">
            <Text className="text-caption font-bold text-brand-mid">
              {NOMBRE_PERFIL[datos.perfil] ?? datos.perfil}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Filtro por plazo */}
      <View className="flex-row gap-2 border-b border-surface-border bg-surface-elevated px-4 py-2">
        {PLAZOS.map((p) => {
          const activo = plazo === p.dias;
          return (
            <Touchable
              key={p.etiqueta}
              onPress={() => setPlazo(p.dias)}
              className={`flex-1 items-center rounded-xl py-2 ${
                activo ? 'bg-brand-primary' : 'bg-transparent'
              }`}
            >
              <Text
                className={`text-caption font-bold ${
                  activo ? 'text-text-onPrimary' : 'text-text-muted'
                }`}
              >
                {p.etiqueta}
              </Text>
            </Touchable>
          );
        })}
      </View>

      {error ? (
        <ErrorEstado mensaje={error} onReintentar={cargar} />
      ) : !datos ? (
        <Cargando mensaje="Cargando las tasas…" />
      ) : (
        <ScrollView className="px-4" contentContainerClassName="gap-3 py-4">
          <Tarjeta className="gap-3">
            <View className="flex-row items-center justify-between">
              <Text className="text-body font-bold text-text-primary">Monto</Text>
              <Text className="text-caption text-text-muted">Opcional</Text>
            </View>
            <TextInput
              value={montoTexto}
              onChangeText={(texto) => setMontoTexto(montoConSeparadores(texto))}
              keyboardType="number-pad"
              placeholder="Ej. 10.000"
              className="w-full rounded-xl border border-surface-border bg-surface-secondary px-4 py-3 text-body-md text-text-primary"
            />
            <View className="flex-row flex-wrap gap-2">
              {MONTOS_RAPIDOS.map((m) => (
                <Touchable
                  key={m}
                  onPress={() => setMontoTexto(montoConSeparadores(String(m)))}
                  className={`rounded-xl px-3 py-2 ${
                    monto === m ? 'bg-brand-primary' : 'bg-brandAlpha-primarySoft'
                  }`}
                >
                  <Text
                    className={`text-caption font-bold ${
                      monto === m ? 'text-text-onPrimary' : 'text-brand-mid'
                    }`}
                  >
                    {usd(m)}
                  </Text>
                </Touchable>
              ))}
            </View>
            <Text className="text-caption text-text-muted">
              Con un monto, el catálogo dice además qué mínimos alcanzas y cuánto rendiría cada
              opción.
            </Text>
          </Tarjeta>

          <RecomendacionIA
            recomendacion={recomendacion}
            cargando={cargandoIA}
            error={errorIA}
            habilitado={monto > 0 && datos.tasas.length > 0}
            pista={
              monto > 0
                ? 'No hay tasas que comparar con este filtro.'
                : 'Escribe un monto arriba para que el asistente pueda recomendarte.'
            }
            onPedir={() => void pedirRecomendacion()}
          />

          <Tarjeta className="gap-0 p-0">
            {datos.tasas.map((tasa, i) => (
              <FilaTasa key={tasa.code} tasa={tasa} esPrimera={i === 0} />
            ))}
          </Tarjeta>

          <View className="flex-row gap-2 rounded-2xl border border-surface-border bg-brandAlpha-primarySoft p-4">
            <Ionicons name="information-circle-outline" size={16} color={COLORES.azulMedio} />
            <Text className="flex-1 text-caption leading-4 text-text-muted">
              <Text className="font-bold text-text-secondary">A mayor tasa, mayor riesgo. </Text>
              La mejor tasa del catálogo viene de la institución con la calificación más baja:
              esa es la decisión que estás tomando.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function FilaTasa({ tasa, esPrimera }: { tasa: TasaInstrumento; esPrimera: boolean }) {
  const bloqueada = tasa.elegible === false;

  return (
    <View
      className={`gap-2 p-4 ${esPrimera ? '' : 'border-t border-surface-border'} ${
        bloqueada ? 'opacity-60' : ''
      }`}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="text-body font-bold text-text-primary" numberOfLines={1}>
            {tasa.producto}
          </Text>
          <Calificacion
            institucion={tasa.institucion}
            calificacion={tasa.calificacion}
            fuente={tasa.fuente_calificacion}
            fecha={tasa.fecha_calificacion}
          />
        </View>
        <View className="items-end">
          <Text
            className={`text-heading font-bold ${
              bloqueada ? 'text-text-muted' : 'text-brand-primary'
            }`}
          >
            {porcentaje(tasa.tasa_anual)}
          </Text>
          <Text className="text-caption text-text-muted">
            {tasa.plazo_dias != null ? `anual · ${tasa.plazo_dias} días` : 'anual · sin plazo'}
          </Text>
          {tasa.monto_minimo != null ? (
            <Text className="text-caption text-text-muted">desde {usd(tasa.monto_minimo)}</Text>
          ) : null}
        </View>
      </View>

      {bloqueada && tasa.motivo_no_elegible ? (
        <View className="flex-row gap-2 rounded-xl bg-stateAlpha-warningSoft p-3">
          <Ionicons name="lock-closed-outline" size={14} color={COLORES.advertencia} />
          <Text className="flex-1 text-caption leading-4 text-text-secondary">
            <Text className="font-bold">No disponible para tu perfil. </Text>
            {tasa.motivo_no_elegible}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
