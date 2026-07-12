import { Text, View } from '@/components/rn';
import { useColores } from '@/context/ThemeContext';

/**
 * Gráfico de líneas genérico, a mano con SVG (mismo enfoque que `DonutPortafolio`).
 *
 * En RN medía su ancho con `onLayout`; en web se usa un `viewBox` fijo y `width="100%"`,
 * así el SVG escala solo al contenedor sin necesidad de medir. Las coordenadas se calculan
 * contra ese sistema virtual (VBW × height).
 */

export interface LineChartPoint {
  /** Eje X: ya viene formateado para mostrar. */
  label: string;
  value: number;
}

interface Props {
  points: LineChartPoint[];
  color?: string;
  height?: number;
  formatValue?: (valor: number) => string;
}

const ALTURA_DEFAULT = 160;
const PADDING_VERTICAL = 14;
/** Ancho del sistema de coordenadas virtual del viewBox (el SVG se estira a 100%). */
const VBW = 320;

export default function LineChart({
  points,
  color,
  height = ALTURA_DEFAULT,
  formatValue = (v) => v.toFixed(2),
}: Props) {
  // Sin `color` explícito, la línea es la de marca DEL TEMA ACTIVO. Era un `#14375E` fijo,
  // y ese azul marino sobre el lienzo oscuro no se distinguía del fondo.
  const colores = useColores();
  const trazo = color ?? colores.primario;

  if (points.length < 2) {
    return (
      <View style={{ height }} className="items-center justify-center">
        <Text className="text-caption text-text-muted">
          Sin datos suficientes para graficar.
        </Text>
      </View>
    );
  }

  const valores = points.map((p) => p.value);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const rango = max - min || 1;

  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * VBW,
    y: PADDING_VERTICAL + (1 - (p.value - min) / rango) * (height - PADDING_VERTICAL * 2),
  }));

  const linea = coords
    .map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)},${c.y.toFixed(1)}`)
    .join(' ');
  const ultimoPunto = coords[coords.length - 1];
  const area = `${linea} L${ultimoPunto.x.toFixed(1)},${height} L0,${height} Z`;

  const primero = points[0];
  const ultimo = points[points.length - 1];
  const subio = ultimo.value >= primero.value;

  return (
    <View>
      <View className="flex-row items-baseline justify-between px-1 pb-2">
        <Text className="text-caption text-text-muted">{primero.label}</Text>
        <Text className="text-caption text-text-muted">{ultimo.label}</Text>
      </View>

      <div style={{ height }}>
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${VBW} ${height}`}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="lineChartArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={trazo} stopOpacity={0.18} />
              <stop offset="1" stopColor={trazo} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={area} fill="url(#lineChartArea)" stroke="none" />
          <path
            d={linea}
            stroke={trazo}
            strokeWidth={2.5}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
          <circle cx={ultimoPunto.x} cy={ultimoPunto.y} r={4} fill={trazo} />
        </svg>
      </div>

      <View className="flex-row items-baseline justify-between px-1 pt-2">
        <Text className="text-caption text-text-muted">Mín. {formatValue(min)}</Text>
        <Text
          className={`text-caption font-bold ${subio ? 'text-state-success' : 'text-state-error'}`}
        >
          Máx. {formatValue(max)}
        </Text>
      </View>
    </View>
  );
}
