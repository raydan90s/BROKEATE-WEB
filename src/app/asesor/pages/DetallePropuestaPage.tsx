import { useCallback, useEffect, useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { ActivityIndicator, ScrollView, Text, TextInput, Touchable, View } from '@/components/rn';
import { useNavigation, useRoute } from '@/routes/navegacion';

import { getTasas } from '@/app/inversionista/services/catalogApi';
import type { TasaInstrumento } from '@/app/inversionista/types/catalogo';
import BotonAtras from '@/components/shared/BotonAtras';
import Calificacion from '@/components/shared/Calificacion';
import EstadoBadge from '@/components/shared/EstadoBadge';
import { Cargando, ErrorEstado } from '@/components/shared/Estados';
import ExplicacionIA from '@/components/shared/ExplicacionIA';
import SelectorInstrumento from '@/components/shared/SelectorInstrumento';
import { COLORES } from '@/constants/colores';
import { ApiError } from '@/services/http';
import { fechaHora, plazo, porcentaje, usd } from '@/utils/formato';

import { getPropuesta, revisarPropuesta } from '../services/advisorApi';
import type { Decision, PropuestaDetalle } from '../types/asesor';

/** Una línea mientras el asesor la edita: el % es texto porque lo está escribiendo. */
interface LineaEdicion {
  code: string;
  nombre: string;
  detalle: string;
  porcentaje: string;
}

const DECISIONES: Record<Decision, string> = {
  approved: 'aprobada',
  edited: 'editada',
  rejected: 'rechazada',
};

/**
 * HU3: lo que ve el asesor antes de decidir, y las tres decisiones.
 *
 * La suma en vivo es una cortesía; **quien valida es el servidor**, y una propuesta se
 * decide una sola vez (409 si alguien más ya lo hizo). Los USD los recalcula Postgres.
 */
export default function DetallePropuestaPage() {
  const navigation = useNavigation();
  const { params } = useRoute<{ proposalId: string }>();
  const { proposalId } = params;

  const [detalle, setDetalle] = useState<PropuestaDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [comentario, setComentario] = useState('');
  const [editando, setEditando] = useState(false);
  const [lineasEdicion, setLineasEdicion] = useState<LineaEdicion[]>([]);
  const [catalogo, setCatalogo] = useState<TasaInstrumento[] | null>(null);

  const [enviando, setEnviando] = useState<Decision | null>(null);
  const [errorDecision, setErrorDecision] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    setDetalle(null);
    try {
      setDetalle(await getPropuesta(proposalId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cargar la propuesta.');
    }
  }, [proposalId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function abrirEdicion(d: PropuestaDetalle) {
    setLineasEdicion(
      d.allocations.map((l) => ({
        code: l.instrumento_code,
        nombre: l.nombre,
        detalle: `${l.institucion} · ${l.calificacion}`,
        porcentaje: String(l.porcentaje),
      })),
    );
    setEditando(true);
    // El catálogo completo: el asesor puede usar cualquier producto aprobado.
    if (!catalogo) {
      try {
        setCatalogo((await getTasas()).tasas);
      } catch {
        setCatalogo([]);
      }
    }
  }

  const sumaEditada = lineasEdicion.reduce(
    (total, linea) => total + (Number(linea.porcentaje.replace(',', '.')) || 0),
    0,
  );

  async function decidir(decision: Decision) {
    if (!detalle || enviando) return;
    setErrorDecision(null);
    setEnviando(decision);
    try {
      await revisarPropuesta(proposalId, {
        decision,
        comments: comentario.trim() || undefined,
        edited_allocation:
          decision === 'edited'
            ? lineasEdicion.map((l) => ({
                instrumento_code: l.code,
                porcentaje: Number(l.porcentaje.replace(',', '.')),
              }))
            : undefined,
      });
      navigation.goBack();
    } catch (e) {
      setErrorDecision(e instanceof ApiError ? e.message : 'No se pudo registrar la decisión.');
      setEnviando(null);
    }
  }

  if (error) {
    return (
      <View className="flex-1 bg-surface-background">
        <ErrorEstado mensaje={error} onReintentar={cargar} />
      </View>
    );
  }

  if (!detalle) {
    return (
      <View className="flex-1 bg-surface-background">
        <Cargando mensaje="Cargando la propuesta…" />
      </View>
    );
  }

  const yaDecidida = detalle.estado !== 'pending_review';
  const rechazoSinComentario = comentario.trim().length === 0;
  const edicionValida = Math.abs(sumaEditada - 100) < 0.005 && lineasEdicion.length > 0;

  return (
    <View className="flex-1 bg-surface-background">
      <View className="flex-row items-center gap-3 border-b border-surface-border px-5 py-4">
        <BotonAtras onPress={navigation.goBack} />
        <Text className="flex-1 text-heading font-bold text-text-primary" numberOfLines={1}>
          {detalle.investor_nombre}
        </Text>
      </View>

      <ScrollView className="bg-surface-canvas" contentContainerClassName="px-5 py-6 gap-4">
        {/* Ficha del cliente */}
        <View className="gap-3 rounded-2xl border border-surface-border bg-surface-background p-5">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-caption text-text-muted">
                {detalle.investor_email ?? 'Sin correo'} · {detalle.cedula_ruc ?? 'Sin cédula'}
              </Text>
              <Text className="text-display font-bold text-text-primary">
                {usd(detalle.monto_total)}
              </Text>
              <Text className="text-body text-text-secondary">
                Perfil <Text className="font-bold capitalize">{detalle.perfil_riesgo}</Text>
                {detalle.puntaje != null ? ` · ${detalle.puntaje} / 15 puntos` : ''}
              </Text>
            </View>
            <EstadoBadge estado={detalle.estado} />
          </View>

          <Text className="text-caption text-text-muted">
            Creada el {fechaHora(detalle.creada_en)}
          </Text>

          <Touchable
            onPress={() =>
              navigation.navigate('ComoSeCalculo', {
                investorId: detalle.investor_id,
                sessionId: detalle.session_id,
              })
            }
            className="flex-row items-center justify-between rounded-2xl bg-surface-canvas px-4 py-3"
          >
            <Text className="text-body font-bold text-brand-primary">
              Ver cómo se calculó su perfil
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#14375E" />
          </Touchable>
        </View>

        {/* Banderas: comparaciones contra la base, sin IA. */}
        {detalle.banderas.length > 0 ? (
          <View className="gap-2 rounded-2xl bg-stateAlpha-warningSoft p-5">
            <View className="flex-row items-center gap-2">
              <Ionicons name="flag" size={16} color="#C77700" />
              <Text className="text-caption font-bold uppercase text-text-primary">
                Puntos de atención
              </Text>
            </View>
            {detalle.banderas.map((bandera) => (
              <Text key={bandera} className="text-body leading-5 text-text-primary">
                • {bandera}
              </Text>
            ))}
            <Text className="text-caption text-text-secondary">
              Detectados por comparación directa contra el catálogo y las reglas. No intervino
              el modelo de lenguaje.
            </Text>
          </View>
        ) : null}

        {/* Productos */}
        <Text className="mt-2 text-caption font-bold uppercase text-text-secondary">
          Asignación propuesta
        </Text>

        {!editando
          ? detalle.allocations.map((linea) => (
              <View
                key={linea.instrumento_code}
                className="gap-3 rounded-2xl border border-surface-border bg-surface-background p-5"
              >
                <View className="gap-1">
                  <Text className="text-body-md font-bold text-text-primary">{linea.nombre}</Text>
                  <Text className="text-caption text-text-muted">
                    {linea.instrumento_code} · {plazo(linea.plazo_dias)}
                    {linea.monto_minimo != null
                      ? ` · mínimo de acceso ${usd(linea.monto_minimo)}`
                      : ''}
                  </Text>
                </View>

                <Calificacion
                  institucion={linea.institucion}
                  calificacion={linea.calificacion}
                  fuente={linea.calificacion_fuente}
                  fecha={linea.calificacion_fecha}
                />

                <View className="flex-row items-baseline gap-2 rounded-2xl bg-surface-canvas px-4 py-3">
                  <Text className="text-title font-bold text-text-primary">
                    {porcentaje(linea.porcentaje)}
                  </Text>
                  <Text className="text-body text-text-secondary">
                    · {usd(linea.monto_asignado)}
                  </Text>
                </View>
              </View>
            ))
          : lineasEdicion.map((linea) => (
              <View
                key={linea.code}
                className="gap-3 rounded-2xl border border-surface-border bg-surface-background p-4"
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-body-md font-bold text-text-primary">
                      {linea.nombre}
                    </Text>
                    <Text className="text-caption text-text-muted">{linea.detalle}</Text>
                  </View>
                  <Touchable
                    onPress={() =>
                      setLineasEdicion((prev) => prev.filter((l) => l.code !== linea.code))
                    }
                    className="h-8 w-8 items-center justify-center rounded-xl bg-stateAlpha-errorSoft"
                  >
                    <Ionicons name="close" size={18} color={COLORES.error} />
                  </Touchable>
                </View>
                <View className="flex-row items-center gap-3">
                  <View className="w-24">
                    <TextInput
                      value={linea.porcentaje}
                      onChangeText={(texto) =>
                        setLineasEdicion((prev) =>
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

        {editando ? (
          <>
            <View
              className={`rounded-2xl px-5 py-3 ${
                edicionValida ? 'bg-stateAlpha-successSoft' : 'bg-stateAlpha-errorSoft'
              }`}
            >
              <Text
                className={`text-body font-bold ${
                  edicionValida ? 'text-state-success' : 'text-state-error'
                }`}
              >
                Suma: {porcentaje(sumaEditada)}
                {edicionValida ? ' — válida' : ' — debe ser exactamente 100%'}
              </Text>
            </View>

            <Text className="mt-1 text-caption font-bold uppercase text-text-secondary">
              Agregar del catálogo
            </Text>
            {catalogo === null ? (
              <ActivityIndicator color={COLORES.primario} />
            ) : (
              <SelectorInstrumento
                tasas={catalogo}
                excluir={lineasEdicion.map((l) => l.code)}
                onAgregar={(tasa) =>
                  setLineasEdicion((prev) => [
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
          </>
        ) : null}

        {/* El texto del LLM, marcado como tal. Al expandir aparece íntegro. */}
        {detalle.explicacion ? (
          <ExplicacionIA
            texto={detalle.explicacion}
            titulo="Explicación que vio el cliente"
            conservarDisclaimer
          />
        ) : null}

        {/* Historial: fecha · versión de reglas · responsable. */}
        {detalle.revisiones.length > 0 ? (
          <View className="gap-3 rounded-2xl border border-surface-border bg-surface-background p-5">
            <Text className="text-caption font-bold uppercase text-text-secondary">
              Historial de revisión
            </Text>
            {detalle.revisiones.map((r) => (
              <View key={r.review_id} className="gap-1 border-t border-surface-border pt-3">
                <Text className="text-body font-bold capitalize text-text-primary">
                  {DECISIONES[r.decision]} por {r.advisor_nombre ?? 'un asesor'}
                </Text>
                <Text className="text-caption text-text-muted">
                  {fechaHora(r.decided_at)} · reglas {r.rules_version ?? '—'}
                </Text>
                {r.comments ? (
                  <Text className="text-body text-text-secondary">{r.comments}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ) : null}

        {/* Decisión */}
        {yaDecidida ? (
          <View className="rounded-2xl border border-surface-border bg-surface-background p-5">
            <Text className="text-body text-text-secondary">
              Esta propuesta ya fue decidida. Una decisión no se sobrescribe: si hace falta
              cambiarla, el cliente debe perfilarse de nuevo.
            </Text>
          </View>
        ) : (
          <View className="gap-3">
            <Text className="mt-2 text-caption font-bold uppercase text-text-secondary">
              Tu decisión
            </Text>

            <TextInput
              value={comentario}
              onChangeText={setComentario}
              placeholder="Comentario (obligatorio si rechazas)"
              multiline
              className="min-h-20 w-full rounded-2xl border border-surface-border bg-surface-background px-4 py-3 text-body text-text-primary"
            />

            {errorDecision ? (
              <View className="rounded-2xl bg-stateAlpha-errorSoft px-4 py-3">
                <Text className="text-body text-state-error">{errorDecision}</Text>
              </View>
            ) : null}

            {editando ? (
              <>
                <Touchable
                  onPress={() => decidir('edited')}
                  disabled={!edicionValida || enviando !== null}
                  className={`items-center rounded-2xl py-4 ${
                    edicionValida ? 'bg-brand-primary' : 'bg-surface-secondary'
                  }`}
                >
                  {enviando === 'edited' ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      className={`text-body-md font-bold ${
                        edicionValida ? 'text-text-onPrimary' : 'text-text-muted'
                      }`}
                    >
                      Guardar asignación editada
                    </Text>
                  )}
                </Touchable>

                <Touchable onPress={() => setEditando(false)} className="items-center py-2">
                  <Text className="text-body text-text-secondary">Cancelar la edición</Text>
                </Touchable>
              </>
            ) : (
              <>
                <Touchable
                  onPress={() => decidir('approved')}
                  disabled={enviando !== null}
                  className="items-center rounded-2xl bg-brand-accent py-4"
                >
                  {enviando === 'approved' ? (
                    <ActivityIndicator color="#18181B" />
                  ) : (
                    <Text className="text-body-md font-bold text-text-onAccent">Aprobar</Text>
                  )}
                </Touchable>

                <Touchable
                  onPress={() => void abrirEdicion(detalle)}
                  disabled={enviando !== null}
                  className="items-center rounded-2xl border border-brand-primary py-4"
                >
                  <Text className="text-body-md font-bold text-brand-primary">
                    Editar la asignación
                  </Text>
                </Touchable>

                <Touchable
                  onPress={() => decidir('rejected')}
                  disabled={rechazoSinComentario || enviando !== null}
                  className={`items-center rounded-2xl py-4 ${
                    rechazoSinComentario ? 'bg-surface-secondary' : 'bg-state-error'
                  }`}
                >
                  {enviando === 'rejected' ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      className={`text-body-md font-bold ${
                        rechazoSinComentario ? 'text-text-muted' : 'text-text-onPrimary'
                      }`}
                    >
                      {rechazoSinComentario ? 'Rechazar (escribe un comentario)' : 'Rechazar'}
                    </Text>
                  )}
                </Touchable>
              </>
            )}
          </View>
        )}

        <View className="h-4" />
      </ScrollView>
    </View>
  );
}
