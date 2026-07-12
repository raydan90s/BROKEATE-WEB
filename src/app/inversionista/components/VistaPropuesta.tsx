import { useCallback, useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { ActivityIndicator, ScrollView, Text, TextInput, Touchable, View } from '@/components/rn';
import { useFocusEffect, useNavigation } from '@/routes/navegacion';

import BotonAtras from '@/components/shared/BotonAtras';
import Calificacion from '@/components/shared/Calificacion';
import DisclaimerBanner from '@/components/shared/DisclaimerBanner';
import EstadoBadge from '@/components/shared/EstadoBadge';
import { Cargando, ErrorEstado } from '@/components/shared/Estados';
import ExplicacionIA from '@/components/shared/ExplicacionIA';
import SelectorInstrumento from '@/components/shared/SelectorInstrumento';
import { useColores } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/http';
import { plazo, porcentaje, puntos, usd } from '@/utils/formato';

import DonutPortafolio, { useColoresDonut } from './DonutPortafolio';
import { getTasas } from '../services/catalogApi';
import { editarAsignacion, getPropuesta } from '../services/investorApi';
import type { TasaInstrumento } from '../types/catalogo';
import type { AssetAllocation, PortfolioProposal } from '../types/inversionista';

/** Una línea mientras se edita: el % es texto porque lo está escribiendo el usuario. */
interface LineaEnEdicion {
  code: string;
  nombre: string;
  detalle: string;
  porcentaje: string;
}

const RIESGO: Record<string, string> = {
  bajo: 'Riesgo bajo',
  medio: 'Riesgo medio',
  alto: 'Riesgo alto',
};

function TarjetaProducto({ linea, color }: { linea: AssetAllocation; color: string }) {
  return (
    <View className="gap-3 rounded-2xl border border-surface-border bg-surface-background p-5">
      <View className="flex-row items-start gap-3">
        <View className="mt-1.5 h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <View className="flex-1 gap-1">
          <Text className="text-body-md font-bold text-text-primary">{linea.nombre}</Text>
          <Text className="text-caption text-text-muted">
            {RIESGO[linea.riesgo] ?? linea.riesgo} · {plazo(linea.plazo_dias)}
          </Text>
        </View>
      </View>

      {/* El % y los USD, juntos. Los USD los calculó Postgres, no el LLM ni el front. */}
      <View className="flex-row items-baseline gap-2 rounded-2xl bg-surface-canvas px-4 py-3">
        <Text className="text-display font-bold text-text-primary">
          {porcentaje(linea.porcentaje)}
        </Text>
        <Text className="text-body-md text-text-secondary">· {usd(linea.monto_asignado)}</Text>
      </View>

      <Calificacion
        institucion={linea.institucion}
        calificacion={linea.calificacion}
        fuente={linea.calificacion_fuente}
        fecha={linea.calificacion_fecha}
      />

      {linea.retorno_esperado != null ? (
        <Text className="text-caption text-text-muted">
          Retorno estimado referencial: {porcentaje(linea.retorno_esperado)} anual. No es un
          rendimiento garantizado.
        </Text>
      ) : null}
    </View>
  );
}

/** Las salidas al pie de la propuesta: mismo alto, mismo chevron, misma jerarquía. */
function FilaAccion({
  icono,
  titulo,
  detalle,
  onPress,
}: {
  icono: string;
  titulo: string;
  detalle: string;
  onPress: () => void;
}) {
  const colores = useColores();

  return (
    <Touchable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-2xl border border-brand-primary bg-surface-background px-5 py-4"
    >
      <Ionicons name={icono} size={20} color={colores.primario} />
      <View className="flex-1">
        <Text className="text-body-md font-bold text-brand-primary">{titulo}</Text>
        <Text className="text-caption text-text-secondary">{detalle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colores.primario} />
    </Touchable>
  );
}

interface Props {
  /** La subcuenta a mostrar. Sin él, la propuesta de la sesión más reciente. */
  sessionId?: string;
  titulo?: string;
}

/**
 * HU2: la propuesta. Donut + una tarjeta por producto con emisor, calificación (con su
 * fuente), el % y los USD, y el texto que redactó Gemini.
 *
 * La usan dos rutas: `Propuesta` (cartera única, sin `sessionId`) y `SubcuentaDetalle`.
 * Nunca muestra un número que el LLM haya inventado.
 */
export default function VistaPropuesta({ sessionId, titulo = 'Tu propuesta' }: Props) {
  const colores = useColores();
  const COLORES_DONUT = useColoresDonut();
  const navigation = useNavigation();
  const { user } = useAuth();
  const [propuesta, setPropuesta] = useState<PortfolioProposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Edición: el cliente agrega/quita fondos; el servidor valida y recalcula ---
  const [editando, setEditando] = useState(false);
  const [lineas, setLineas] = useState<LineaEnEdicion[]>([]);
  const [catalogo, setCatalogo] = useState<TasaInstrumento[] | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!user) return;
    setError(null);
    try {
      setPropuesta(await getPropuesta(user.id, sessionId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cargar tu propuesta.');
    }
  }, [user, sessionId]);

  // Al foco: si el cliente corrigió su perfil en "Cómo se calculó", el servidor rehizo
  // esta propuesta. El GET no regenera nada: lee lo guardado.
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  async function abrirEdicion(p: PortfolioProposal) {
    setLineas(
      p.allocations.map((l) => ({
        code: l.instrumento_code,
        nombre: l.nombre,
        detalle: l.institucion ? `${l.institucion} · ${l.calificacion ?? ''}` : '',
        porcentaje: String(l.porcentaje),
      })),
    );
    setErrorEdicion(null);
    setEditando(true);
    if (!catalogo) {
      try {
        setCatalogo((await getTasas()).tasas);
      } catch {
        setCatalogo([]);
      }
    }
  }

  const suma = lineas.reduce(
    (total, l) => total + (Number(l.porcentaje.replace(',', '.')) || 0),
    0,
  );
  const sumaValida = Math.abs(suma - 100) < 0.005 && lineas.length > 0;

  async function guardarEdicion(p: PortfolioProposal) {
    if (!sumaValida || guardando) return;
    setErrorEdicion(null);
    setGuardando(true);
    try {
      const actualizada = await editarAsignacion(
        p.proposal_id,
        lineas.map((l) => ({
          instrumento_code: l.code,
          porcentaje: Number(l.porcentaje.replace(',', '.')),
        })),
      );
      setPropuesta(actualizada);
      setEditando(false);
    } catch (e) {
      setErrorEdicion(e instanceof ApiError ? e.message : 'No se pudo guardar tu asignación.');
    } finally {
      setGuardando(false);
    }
  }

  if (error) {
    return (
      <View className="flex-1 bg-surface-background">
        <ErrorEstado mensaje={error} onReintentar={cargar} />
      </View>
    );
  }

  if (!propuesta) {
    return (
      <View className="flex-1 bg-surface-background">
        <Cargando mensaje="Armando tu propuesta…" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface-background">
      <View className="flex-row items-center gap-3 border-b border-surface-border px-5 py-4">
        {navigation.canGoBack() ? <BotonAtras onPress={navigation.goBack} /> : null}
        <Text className="flex-1 text-heading font-bold text-text-primary" numberOfLines={1}>
          {titulo}
        </Text>
      </View>

      <ScrollView
        className="bg-surface-canvas"
        contentContainerClassName="px-5 py-6 gap-4 max-w-4xl"
      >
        {/* HU2-3: fijo, no descartable. */}
        <DisclaimerBanner />

        <View className="gap-4 rounded-2xl border border-surface-border bg-surface-background p-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="gap-1">
              <Text className="text-caption font-bold uppercase text-text-secondary">
                Perfil {propuesta.perfil_riesgo}
              </Text>
              <Text className="text-caption text-text-muted">
                {puntos(propuesta.puntaje, propuesta.puntaje_max)} ·{' '}
                {RIESGO[propuesta.riesgo_esperado] ?? propuesta.riesgo_esperado}
              </Text>
            </View>
            <EstadoBadge estado={propuesta.estado} />
          </View>

          <DonutPortafolio
            allocations={propuesta.allocations}
            centro={usd(propuesta.monto_total)}
            etiquetaCentro="Total"
          />

          {propuesta.retorno_esperado_anual != null ? (
            <Text className="text-center text-caption text-text-muted">
              Retorno estimado del portafolio: {porcentaje(propuesta.retorno_esperado_anual)}{' '}
              anual (referencial).
            </Text>
          ) : null}
        </View>

        {/* El único texto del LLM en toda la pantalla. */}
        {propuesta.explicacion ? <ExplicacionIA texto={propuesta.explicacion} /> : null}

        <View className="mt-2 flex-row items-center justify-between">
          <Text className="text-caption font-bold uppercase text-text-secondary">
            Productos
          </Text>
          {/* Solo mientras el asesor no ha decidido: una decisión no se pisa (HU3). */}
          {propuesta.estado === 'pending_review' && !editando ? (
            <Touchable
              onPress={() => void abrirEdicion(propuesta)}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="create-outline" size={16} color={colores.primario} />
              <Text className="text-body font-bold text-brand-primary">Editar mi mezcla</Text>
            </Touchable>
          ) : null}
        </View>

        {!editando ? (
          // En pantalla ancha los productos van en dos columnas.
          <View className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {propuesta.allocations.map((linea, i) => (
              <TarjetaProducto
                key={linea.instrumento_code}
                linea={linea}
                color={COLORES_DONUT[i % COLORES_DONUT.length]}
              />
            ))}
          </View>
        ) : (
          <>
            {lineas.map((linea) => (
              <View
                key={linea.code}
                className="gap-3 rounded-2xl border border-surface-border bg-surface-background p-4"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-body-md font-bold text-text-primary">
                      {linea.nombre}
                    </Text>
                    {linea.detalle ? (
                      <Text className="text-caption text-text-muted">{linea.detalle}</Text>
                    ) : null}
                  </View>
                  <Touchable
                    onPress={() =>
                      setLineas((prev) => prev.filter((l) => l.code !== linea.code))
                    }
                    className="h-8 w-8 items-center justify-center rounded-xl bg-stateAlpha-errorSoft"
                  >
                    <Ionicons name="close" size={18} color={colores.error} />
                  </Touchable>
                </View>
                <View className="flex-row items-center gap-3">
                  <View className="w-24">
                    <TextInput
                      value={linea.porcentaje}
                      onChangeText={(texto) =>
                        setLineas((prev) =>
                          prev.map((l) =>
                            l.code === linea.code ? { ...l, porcentaje: texto } : l,
                          ),
                        )
                      }
                      keyboardType="decimal-pad"
                      className="w-full rounded-xl border border-surface-border bg-surface-elevated px-3 py-2 text-body-md font-bold text-text-primary"
                    />
                  </View>
                  <Text className="flex-1 text-body text-text-secondary">
                    % — los USD los recalcula el sistema
                  </Text>
                </View>
              </View>
            ))}

            <View
              className={`rounded-2xl px-5 py-3 ${
                sumaValida ? 'bg-stateAlpha-successSoft' : 'bg-stateAlpha-errorSoft'
              }`}
            >
              <Text
                className={`text-body font-bold ${
                  sumaValida ? 'text-state-success' : 'text-state-error'
                }`}
              >
                Suma: {porcentaje(suma)}
                {sumaValida ? ' — válida' : ' — debe ser exactamente 100%'}
              </Text>
            </View>

            <Text className="mt-1 text-caption font-bold uppercase text-text-secondary">
              Agregar del catálogo
            </Text>
            {catalogo === null ? (
              <ActivityIndicator color={colores.primario} />
            ) : (
              <SelectorInstrumento
                tasas={catalogo}
                excluir={lineas.map((l) => l.code)}
                onAgregar={(tasa) =>
                  setLineas((prev) => [
                    ...prev,
                    {
                      code: tasa.code,
                      nombre: tasa.producto,
                      detalle: `${tasa.institucion} · ${tasa.calificacion}`,
                      porcentaje: '',
                    },
                  ])
                }
              />
            )}

            {errorEdicion ? (
              <View className="rounded-2xl bg-stateAlpha-errorSoft px-4 py-3">
                <Text className="text-body text-state-error">{errorEdicion}</Text>
              </View>
            ) : null}

            <Touchable
              onPress={() => void guardarEdicion(propuesta)}
              disabled={!sumaValida || guardando}
              className={`items-center rounded-2xl py-4 ${
                sumaValida ? 'bg-brand-primary' : 'bg-surface-secondary'
              }`}
            >
              {guardando ? (
                <ActivityIndicator color={colores.textoSobrePrimario} />
              ) : (
                <Text
                  className={`text-body-md font-bold ${
                    sumaValida ? 'text-text-onPrimary' : 'text-text-muted'
                  }`}
                >
                  Guardar mi mezcla
                </Text>
              )}
            </Touchable>

            <Touchable onPress={() => setEditando(false)} disabled={guardando} className="items-center py-2">
              <Text className="text-body text-text-secondary">Cancelar la edición</Text>
            </Touchable>

            <Text className="text-caption text-text-muted">
              Tu mezcla sigue siendo una propuesta: un asesor la revisa antes de que exista
              cualquier efecto, y solo puedes usar productos admitidos para tu perfil.
            </Text>
          </>
        )}

        <View className="mt-2 gap-3">
          {/* HU1-3: el usuario tiene que poder ver cómo se llegó a su perfil. */}
          <FilaAccion
            icono="help-circle-outline"
            titulo="¿Cómo se calculó mi perfil?"
            detalle="Respuesta por respuesta, con las reglas a la vista."
            onPress={() =>
              navigation.navigate('ComoSeCalculo', { sessionId: propuesta.session_id })
            }
          />

          <FilaAccion
            icono="swap-horizontal-outline"
            titulo="Comparar con el catálogo"
            detalle={
              propuesta.monto_total != null
                ? `Qué tasa daría ${usd(propuesta.monto_total)} en cada producto.`
                : 'Las tasas aprobadas, y cuáles admite tu perfil.'
            }
            onPress={() =>
              navigation.navigate('Comparador', {
                monto: propuesta.monto_total ?? undefined,
              })
            }
          />
        </View>

        <View className="h-4" />
      </ScrollView>
    </View>
  );
}
