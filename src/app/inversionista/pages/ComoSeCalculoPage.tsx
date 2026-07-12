import { useCallback, useEffect, useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { ActivityIndicator, ScrollView, Text, Touchable, View } from '@/components/rn';
import { useNavigation, useRoute } from '@/routes/navegacion';

import BotonAtras from '@/components/shared/BotonAtras';
import { Cargando, ErrorEstado } from '@/components/shared/Estados';
import { COLORES } from '@/constants/colores';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/http';
import { usd } from '@/utils/formato';

import FormularioPreguntas from '../components/FormularioPreguntas';
import { editarPerfil, getBreakdown, getPreguntas } from '../services/investorApi';
import type { Pregunta, ProfilingBreakdown } from '../types/inversionista';

/**
 * HU1, criterio 3: **el usuario entiende cómo influyó cada respuesta en su perfil.**
 *
 * Todo lo de esta pantalla sale de `v_profiling_breakdown`. El front no reproduce ni una
 * sola regla. Es también donde el cliente puede **corregir** sus respuestas: guardar
 * re-puntúa en el servidor, regenera la propuesta y la devuelve a la cola del asesor.
 */
export default function ComoSeCalculoPage() {
  const navigation = useNavigation();
  const { params } = useRoute<{ investorId?: string; sessionId?: string }>();
  const { user } = useAuth();

  const sessionId = params.sessionId;
  const investorId = params.investorId ?? user?.id;

  const [datos, setDatos] = useState<ProfilingBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editando, setEditando] = useState(false);
  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null);
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState<string | null>(null);
  const [reenviado, setReenviado] = useState(false);

  const cargar = useCallback(async () => {
    if (!investorId) return;
    setError(null);
    setDatos(null);
    try {
      setDatos(await getBreakdown(investorId, sessionId));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cargar el desglose.');
    }
  }, [investorId, sessionId]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  async function abrirEdicion(actual: ProfilingBreakdown) {
    setRespuestas(
      Object.fromEntries(actual.respuestas.map((r) => [r.question_code, r.option_code])),
    );
    setErrorEdicion(null);
    setReenviado(false);
    setEditando(true);
    if (!preguntas) {
      try {
        setPreguntas(await getPreguntas());
      } catch (e) {
        setErrorEdicion(e instanceof ApiError ? e.message : 'No se pudo cargar el cuestionario.');
      }
    }
  }

  const faltanRespuestas = (preguntas ?? []).filter((p) => !respuestas[p.code]).length;
  const puedeGuardar = preguntas != null && faltanRespuestas === 0 && !guardando;

  async function guardarEdicion(actual: ProfilingBreakdown) {
    if (!puedeGuardar) return;
    setErrorEdicion(null);
    setGuardando(true);
    try {
      setDatos(await editarPerfil(actual.session_id, respuestas));
      setEditando(false);
      setReenviado(true);
    } catch (e) {
      setErrorEdicion(e instanceof ApiError ? e.message : 'No se pudo guardar tu perfil.');
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

  if (!datos) {
    return (
      <View className="flex-1 bg-surface-background">
        <Cargando mensaje="Cargando el desglose…" />
      </View>
    );
  }

  const total = datos.respuestas.reduce((suma, r) => suma + r.puntos, 0);
  const esPropio = datos.investor_id === user?.id;

  return (
    <View className="flex-1 bg-surface-background">
      <View className="flex-row items-center gap-3 border-b border-surface-border px-5 py-4">
        <BotonAtras onPress={navigation.goBack} />
        <Text className="flex-1 text-heading font-bold text-text-primary">
          {editando ? 'Editar mi perfil' : 'Cómo se calculó'}
        </Text>

        {esPropio ? (
          editando ? (
            <Touchable
              onPress={() => {
                setEditando(false);
                setErrorEdicion(null);
              }}
              disabled={guardando}
            >
              <Text className="text-body font-bold text-text-secondary">Cancelar</Text>
            </Touchable>
          ) : (
            <Touchable
              onPress={() => void abrirEdicion(datos)}
              className="flex-row items-center gap-1"
            >
              <Ionicons name="create-outline" size={18} color={COLORES.primario} />
              <Text className="text-body font-bold text-brand-primary">Editar</Text>
            </Touchable>
          )
        ) : null}
      </View>

      <ScrollView className="bg-surface-canvas" contentContainerClassName="px-5 py-6 gap-4">
        {/* La versión de reglas, visible. */}
        <View className="flex-row items-center justify-between rounded-2xl border border-surface-border bg-surface-background px-5 py-4">
          <View className="gap-1">
            <Text className="text-caption uppercase text-text-secondary">
              {esPropio ? 'Tu puntaje' : 'Puntaje del cliente'}
            </Text>
            <Text className="text-hero font-bold text-text-primary">
              {datos.puntaje}
              <Text className="text-body-md font-bold text-text-muted"> / 15</Text>
            </Text>
          </View>
          <View className="items-end gap-1">
            <View className="rounded-full bg-brandAlpha-primarySoft px-3 py-1">
              <Text className="text-caption font-bold text-brand-primary">
                reglas {datos.rules_version}
              </Text>
            </View>
            {datos.monto != null ? (
              <Text className="text-caption text-text-muted">{usd(datos.monto)}</Text>
            ) : null}
          </View>
        </View>

        {reenviado && !editando ? (
          <View className="flex-row items-start gap-3 rounded-2xl bg-stateAlpha-successSoft px-5 py-4">
            <Ionicons name="checkmark-circle" size={20} color={COLORES.exito} />
            <Text className="flex-1 text-body leading-5 text-text-primary">
              Tu perfil quedó actualizado y tu propuesta se regeneró con él. Un asesor la
              revisará de nuevo: vuelve a estar pendiente de revisión.
            </Text>
          </View>
        ) : null}

        {editando ? (
          <>
            <View className="flex-row items-start gap-3 rounded-2xl bg-brandAlpha-primarySoft px-5 py-4">
              <Ionicons name="information-circle" size={20} color={COLORES.primario} />
              <Text className="flex-1 text-body leading-5 text-text-primary">
                Al guardar se recalcula tu puntaje y tu propuesta se rearma según el perfil
                que resulte. Vuelve a quedar pendiente de la revisión de un asesor, incluso
                si ya la habían revisado. Tu monto no cambia.
              </Text>
            </View>

            {preguntas === null ? (
              <ActivityIndicator color={COLORES.primario} />
            ) : (
              <FormularioPreguntas
                preguntas={preguntas}
                respuestas={respuestas}
                onElegir={(preguntaCode, opcionCode) =>
                  setRespuestas((prev) => ({ ...prev, [preguntaCode]: opcionCode }))
                }
              />
            )}

            {errorEdicion ? (
              <View className="rounded-2xl bg-stateAlpha-errorSoft px-4 py-3">
                <Text className="text-body text-state-error">{errorEdicion}</Text>
              </View>
            ) : null}

            <Touchable
              onPress={() => void guardarEdicion(datos)}
              disabled={!puedeGuardar}
              className={`items-center rounded-2xl py-4 ${
                puedeGuardar ? 'bg-brand-primary' : 'bg-surface-secondary'
              }`}
            >
              {guardando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  className={`text-body-md font-bold ${
                    puedeGuardar ? 'text-text-onPrimary' : 'text-text-muted'
                  }`}
                >
                  {faltanRespuestas > 0
                    ? `Faltan ${faltanRespuestas} respuesta${faltanRespuestas > 1 ? 's' : ''}`
                    : 'Guardar y enviar a revisión'}
                </Text>
              )}
            </Touchable>

            <Touchable
              onPress={() => {
                setEditando(false);
                setErrorEdicion(null);
              }}
              disabled={guardando}
              className="items-center py-2 pb-6"
            >
              <Text className="text-body text-text-secondary">
                Cancelar y dejar mi perfil como está
              </Text>
            </Touchable>
          </>
        ) : (
          <>
            {/* Tabla respuesta → puntos. */}
            <View className="overflow-hidden rounded-2xl border border-surface-border bg-surface-background">
              <View className="flex-row justify-between bg-surface-secondary px-5 py-3">
                <Text className="text-caption font-bold uppercase text-text-secondary">
                  {esPropio ? 'Tu respuesta' : 'Respuesta'}
                </Text>
                <Text className="text-caption font-bold uppercase text-text-secondary">
                  Puntos
                </Text>
              </View>

              {datos.respuestas.map((fila) => (
                <View
                  key={fila.question_code}
                  className="flex-row items-center justify-between gap-4 border-t border-surface-border px-5 py-4"
                >
                  <View className="flex-1 gap-1">
                    <Text className="text-caption text-text-muted">{fila.question_text}</Text>
                    <Text className="text-body font-bold text-text-primary">
                      {fila.option_label}
                    </Text>
                  </View>
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-brandAlpha-accentSoft">
                    <Text className="text-body font-bold text-text-primary">+{fila.puntos}</Text>
                  </View>
                </View>
              ))}

              <View className="flex-row items-center justify-between border-t-2 border-surface-divider px-5 py-4">
                <Text className="text-body-md font-bold text-text-primary">Total</Text>
                <Text className="text-body-md font-bold text-text-primary">{total}</Text>
              </View>
            </View>

            {/* El umbral que convirtió el puntaje en perfil. */}
            <View className="gap-2 rounded-2xl bg-brandAlpha-primarySoft p-5">
              <Text className="text-caption font-bold uppercase text-brand-primary">El umbral</Text>
              <Text className="text-body leading-5 text-text-primary">
                Un puntaje entre{' '}
                <Text className="font-bold">
                  {datos.umbral_min} y {datos.umbral_max}
                </Text>{' '}
                corresponde al perfil{' '}
                <Text className="font-bold">{datos.perfil_nombre ?? datos.perfil_code}</Text>. Un
                puntaje de <Text className="font-bold">{datos.puntaje}</Text> cae en ese rango.
              </Text>
            </View>

            {/* La regla de elegibilidad. */}
            {datos.regla_institucion ? (
              <View className="gap-2 rounded-2xl border border-surface-border bg-surface-background p-5">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="shield-checkmark-outline" size={16} color="#14375E" />
                  <Text className="text-caption font-bold uppercase text-text-secondary">
                    Solidez del emisor
                  </Text>
                </View>
                <Text className="text-body leading-5 text-text-primary">
                  {datos.regla_institucion}
                </Text>
                <Text className="text-caption text-text-muted">
                  Por eso tu propuesta solo incluye productos de instituciones que cumplen esa
                  calificación mínima. Las calificaciones son referenciales y se muestran
                  siempre con su calificadora y su fecha.
                </Text>
              </View>
            ) : null}

            {esPropio ? (
              <Touchable
                onPress={() => void abrirEdicion(datos)}
                className="flex-row items-center gap-3 rounded-2xl border border-brand-primary bg-surface-background px-5 py-4"
              >
                <Ionicons name="create-outline" size={20} color={COLORES.primario} />
                <View className="flex-1">
                  <Text className="text-body-md font-bold text-brand-primary">
                    Editar mis respuestas
                  </Text>
                  <Text className="text-caption text-text-secondary">
                    Se recalcula tu perfil y tu propuesta vuelve a revisión.
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={COLORES.primario} />
              </Touchable>
            ) : null}

            <Text className="pb-4 text-center text-caption text-text-muted">
              Estas reglas están publicadas y versionadas ({datos.rules_version}). Ninguna
              cifra de esta pantalla la escribió un modelo de lenguaje.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
