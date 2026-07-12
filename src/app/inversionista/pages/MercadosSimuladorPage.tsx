import { useCallback, useEffect, useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { ActivityIndicator, ScrollView, Text, Touchable, View } from '@/components/rn';
import { useNavigation } from '@/routes/navegacion';

import { enviarMensaje } from '@/app/agente/services/agentApi';
import type { AgentChatResponse } from '@/app/agente/services/agentApi';
import SourceChips from '@/app/agente/components/SourceChips';
import { Cargando, ErrorEstado } from '@/components/shared/Estados';
import LineChart from '@/components/shared/LineChart';
import Tarjeta from '@/components/shared/Tarjeta';
import { useColores } from '@/context/ThemeContext';
import { ApiError } from '@/services/http';

import { getCotizaciones, getHistorico } from '../services/marketApi';
import type { HistoricalSeries, MarketQuote } from '../services/marketApi';

/**
 * Simulador de mercados GLOBALES — separado del bancario. Todo viene de Alpha Vantage:
 * instrumentos de referencia, no ejecutables, nunca mezclados con una propuesta real.
 */

const ACTIVOS: { symbol: string; etiqueta: string }[] = [
  { symbol: 'BTCUSD', etiqueta: 'Bitcoin' },
  { symbol: 'SPY', etiqueta: 'S&P 500' },
  { symbol: 'EURUSD', etiqueta: 'EUR/USD' },
  { symbol: 'XAUUSD', etiqueta: 'Oro' },
];

function formatearPrecio(precio: number): string {
  const decimales = precio < 10 ? 4 : precio > 1000 ? 0 : 2;
  const partes = precio.toFixed(decimales).split('.');
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `USD ${partes.join(',')}`;
}

/** "2026-06-30" → "30-jun". */
function fechaEje(iso: string): string {
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const [, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}-${meses[m - 1]}`;
}

function TarjetaRecomendacion({ respuesta }: { respuesta: AgentChatResponse }) {
  const colores = useColores();
  return (
    <View className="gap-2 rounded-2xl border border-state-warning bg-stateAlpha-warningSoft p-4">
      <View className="flex-row items-center gap-1.5">
        <Ionicons name="alert-circle" size={13} color={colores.advertencia} />
        <Text className="text-caption font-bold uppercase text-state-warning">
          Simulación educativa · fuera del banco
        </Text>
      </View>
      <Text className="text-body whitespace-pre-line text-text-primary">{respuesta.texto}</Text>
      {respuesta.sources.length ? <SourceChips sources={respuesta.sources} /> : null}
    </View>
  );
}

export default function MercadosSimuladorPage() {
  const colores = useColores();
  const navigation = useNavigation();

  const [activo, setActivo] = useState(ACTIVOS[0].symbol);
  const [cotizacion, setCotizacion] = useState<MarketQuote | null>(null);
  const [historico, setHistorico] = useState<HistoricalSeries | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [recomendacion, setRecomendacion] = useState<AgentChatResponse | null>(null);
  const [cargandoIA, setCargandoIA] = useState(false);
  const [errorIA, setErrorIA] = useState<string | null>(null);

  const cargar = useCallback(async (symbol: string) => {
    setCargando(true);
    setError(null);
    try {
      const [cotizaciones, serie] = await Promise.all([
        getCotizaciones([symbol]),
        getHistorico(symbol, 30),
      ]);
      setCotizacion(cotizaciones[0] ?? null);
      setHistorico(serie);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cargar el mercado.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargar(activo);
    setRecomendacion(null);
    setErrorIA(null);
  }, [activo, cargar]);

  const pedirRecomendacion = useCallback(async () => {
    setCargandoIA(true);
    setErrorIA(null);
    try {
      // `symbols` fuerza la Ruta C (100% Alpha Vantage) sin depender del texto.
      setRecomendacion(
        await enviarMensaje(
          `Analiza brevemente la cotización y la tendencia reciente de ${activo}.`,
          undefined,
          undefined,
          [activo],
        ),
      );
    } catch (e) {
      setErrorIA(
        e instanceof ApiError ? e.message : 'El asistente no pudo responder. Intenta otra vez.',
      );
    } finally {
      setCargandoIA(false);
    }
  }, [activo]);

  const activoActual = ACTIVOS.find((a) => a.symbol === activo)!;
  const sube = (cotizacion?.change_percent ?? 0) > 0;
  const baja = (cotizacion?.change_percent ?? 0) < 0;

  return (
    <View className="flex-1 bg-surface-canvas">
      <View className="flex-row items-center gap-3 border-b border-surface-border bg-surface-background px-4 py-3">
        <Touchable
          onPress={() => navigation.goBack()}
          className="h-8 w-8 items-center justify-center rounded-xl"
        >
          <Ionicons name="chevron-back" size={22} color={colores.primario} />
        </Touchable>
        <View className="flex-1">
          <Text className="text-title font-bold text-text-primary">Mercados globales</Text>
          <Text className="text-caption text-text-muted">
            Acciones, forex, cripto — fuera del catálogo del banco
          </Text>
        </View>
      </View>

      <ScrollView className="px-4" contentContainerClassName="gap-3 py-4">
        {/* Aviso permanente de la simulación de mercados externos, sin botón de cerrar. */}
        <View className="flex-row gap-3 rounded-2xl bg-stateAlpha-warningSoft p-4">
          <Ionicons name="warning" size={20} color={colores.advertencia} />
          <Text className="flex-1 text-caption leading-4 text-text-primary">
            <Text className="font-bold">Simulación educativa.</Text> Estos activos globales no
            forman parte del catálogo institucional ni son ejecutables.
          </Text>
        </View>

        {/* Selector de activo */}
        <View className="flex-row flex-wrap gap-2">
          {ACTIVOS.map((a) => (
            <Touchable
              key={a.symbol}
              onPress={() => setActivo(a.symbol)}
              className={`rounded-xl px-3.5 py-2 ${
                activo === a.symbol ? 'bg-brand-primary' : 'bg-brandAlpha-primarySoft'
              }`}
            >
              <Text
                className={`text-caption font-bold ${
                  activo === a.symbol ? 'text-text-onPrimary' : 'text-brand-mid'
                }`}
              >
                {a.etiqueta}
              </Text>
            </Touchable>
          ))}
        </View>

        {cargando ? (
          <Cargando />
        ) : error ? (
          <ErrorEstado mensaje={error} onReintentar={() => cargar(activo)} />
        ) : (
          <>
            <Tarjeta className="gap-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-caption font-bold uppercase text-text-secondary">
                    {activoActual.symbol}
                  </Text>
                  <Text className="text-heading font-bold text-text-primary">
                    {cotizacion ? formatearPrecio(cotizacion.price) : '—'}
                  </Text>
                </View>
                {cotizacion && cotizacion.change_percent !== 0 ? (
                  <View className="flex-row items-center gap-1">
                    <Ionicons
                      name={sube ? 'caret-up' : 'caret-down'}
                      size={14}
                      color={sube ? colores.exito : colores.error}
                    />
                    <Text
                      className="text-body-md font-bold"
                      style={{
                        color: sube ? colores.exito : baja ? colores.error : colores.textoMuted,
                      }}
                    >
                      {Math.abs(cotizacion.change_percent).toFixed(2)}%
                    </Text>
                  </View>
                ) : null}
              </View>

              {historico ? (
                <LineChart
                  points={historico.points.map((p) => ({
                    label: fechaEje(p.date),
                    value: p.close,
                  }))}
                  color={colores.primario}
                  formatValue={formatearPrecio}
                />
              ) : null}

              {cotizacion?.source === 'mock' || historico?.source === 'mock' ? (
                <Text className="text-caption text-text-muted">
                  Cotización de referencia simulada (cuota de Alpha Vantage agotada o símbolo
                  sin datos en vivo).
                </Text>
              ) : (
                <Text className="text-caption text-text-muted">
                  Datos en vivo de Alpha Vantage · 30 días.
                </Text>
              )}
            </Tarjeta>

            <Touchable
              onPress={pedirRecomendacion}
              disabled={cargandoIA}
              className={`flex-row items-center justify-center gap-2 rounded-2xl py-3.5 ${
                cargandoIA ? 'bg-surface-divider' : 'bg-brand-primary'
              }`}
            >
              {cargandoIA ? (
                <ActivityIndicator color={colores.textoSobrePrimario} />
              ) : (
                <>
                  <Ionicons name="sparkles" size={16} color={colores.textoSobrePrimario} />
                  <Text className="text-body-md font-bold text-text-onPrimary">
                    Recomendación de Mercados (IA)
                  </Text>
                </>
              )}
            </Touchable>

            {errorIA ? <Text className="text-caption text-state-error">{errorIA}</Text> : null}

            {recomendacion ? <TarjetaRecomendacion respuesta={recomendacion} /> : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}
