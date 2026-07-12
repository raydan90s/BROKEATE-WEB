import { useEffect, useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { Text, View } from '@/components/rn';
import { useColores } from '@/context/ThemeContext';

import { getCotizaciones, type MarketQuote } from '../services/marketApi';

/**
 * Ticker de mercados externos (BTCUSD, XAUUSD, JPN225, SPY, EURUSD) para el dashboard
 * del inversionista. Datos de `GET /api/market/quotes` — Alpha Vantage cacheado 1h.
 *
 * Deliberadamente fuera de las tarjetas de subcuentas: estos instrumentos NO están en
 * el catálogo del banco, son solo referencia de mercado.
 */

const ETIQUETA: Record<string, string> = {
  BTCUSD: 'Bitcoin',
  XAUUSD: 'Oro',
  JPN225: 'Nikkei 225',
  SPY: 'S&P 500 (SPY)',
  EURUSD: 'EUR/USD',
};

/** Bitcoin y el Nikkei no llevan decimales legibles con 2 cifras; forex sí necesita 4. */
function formatearPrecio(q: MarketQuote): string {
  const decimales = q.price < 10 ? 4 : q.price > 1000 ? 0 : 2;
  const partes = q.price.toFixed(decimales).split('.');
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `USD ${partes.join(',')}`;
}

function Tarjeta({ cotizacion }: { cotizacion: MarketQuote }) {
  const colores = useColores();
  const sube = cotizacion.change_percent > 0;
  const baja = cotizacion.change_percent < 0;
  const color = sube ? colores.exito : baja ? colores.error : colores.textoMuted;

  return (
    <View className="w-36 shrink-0 gap-1.5 rounded-2xl border border-surface-border bg-surface-background p-3.5 md:w-auto">
      <View className="flex-row items-center justify-between">
        <Text className="text-caption font-bold uppercase text-text-secondary">
          {cotizacion.symbol}
        </Text>
        <Ionicons
          name="ellipse"
          size={6}
          color={cotizacion.source === 'mock' ? colores.textoMuted : colores.exito}
        />
      </View>

      <Text className="text-caption text-text-muted" numberOfLines={1}>
        {ETIQUETA[cotizacion.symbol] ?? cotizacion.symbol}
      </Text>

      <Text className="text-body-md font-bold text-text-primary" numberOfLines={1}>
        {formatearPrecio(cotizacion)}
      </Text>

      {cotizacion.change_percent !== 0 ? (
        <View className="flex-row items-center gap-1">
          <Ionicons name={sube ? 'caret-up' : 'caret-down'} size={11} color={color} />
          <Text className="text-caption font-semibold" style={{ color }}>
            {Math.abs(cotizacion.change_percent).toFixed(2)}%
          </Text>
        </View>
      ) : (
        <Text className="text-caption text-text-muted">—</Text>
      )}
    </View>
  );
}

function TarjetaEsqueleto() {
  return (
    <View className="w-36 shrink-0 gap-2 rounded-2xl border border-surface-border bg-surface-secondary p-3.5 opacity-60 md:w-auto">
      <View className="h-3 w-12 rounded bg-surface-divider" />
      <View className="h-3 w-20 rounded bg-surface-divider" />
      <View className="h-4 w-24 rounded bg-surface-divider" />
    </View>
  );
}

// El caché del backend dura 1h, así que esto no gasta cuota extra de Alpha Vantage.
const INTERVALO_MS = 45_000;

export default function MarketTicker() {
  const [cotizaciones, setCotizaciones] = useState<MarketQuote[] | null>(null);

  useEffect(() => {
    let vivo = true;

    async function cargar() {
      try {
        const datos = await getCotizaciones();
        if (vivo) setCotizaciones(datos);
      } catch {
        // El ticker es informativo, no crítico: si falla, se deja el último dato.
      }
    }

    void cargar();
    const id = setInterval(cargar, INTERVALO_MS);
    return () => {
      vivo = false;
      clearInterval(id);
    };
  }, []);

  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between px-5">
        <Text className="text-caption font-bold uppercase text-text-secondary">
          Mercados externos
        </Text>
        <Text className="text-caption text-text-muted">Alpha Vantage · referencial</Text>
      </View>

      {/* En móvil desliza en horizontal; en pantalla ancha las cinco cotizaciones se
          reparten en rejilla y ocupan todo el ancho, sin el hueco muerto de la derecha. */}
      <div className="flex gap-2.5 overflow-x-auto px-5 md:grid md:grid-cols-5 md:overflow-x-visible">
        {cotizaciones
          ? cotizaciones.map((c) => <Tarjeta key={c.symbol} cotizacion={c} />)
          : Array.from({ length: 5 }).map((_, i) => <TarjetaEsqueleto key={i} />)}
      </div>
    </View>
  );
}
