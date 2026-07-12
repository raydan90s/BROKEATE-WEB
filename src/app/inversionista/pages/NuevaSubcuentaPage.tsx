import { useCallback, useEffect, useState } from 'react';

import { ActivityIndicator, ScrollView, Text, TextInput, Touchable, View } from '@/components/rn';
import { useNavigation } from '@/routes/navegacion';

import BotonAtras from '@/components/shared/BotonAtras';
import DisclaimerBanner from '@/components/shared/DisclaimerBanner';
import { Cargando, ErrorEstado } from '@/components/shared/Estados';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/http';
import { montoANumero, montoConSeparadores, porcentaje, puntos, usd } from '@/utils/formato';

import DonutPortafolio from '../components/DonutPortafolio';
import FormularioPreguntas from '../components/FormularioPreguntas';
import { crearPerfil, getPreguntas, getPropuesta, getSubcuentas } from '../services/investorApi';
import type { PortfolioProposal, Pregunta, ResumenCapital } from '../types/inversionista';

type Paso = 1 | 2 | 3;

function Cabecera({ paso, titulo, onAtras }: { paso: Paso; titulo: string; onAtras?: () => void }) {
  return (
    <View className="gap-1 border-b border-surface-border px-5 py-4">
      <View className="flex-row items-center gap-3">
        {onAtras ? <BotonAtras onPress={onAtras} /> : null}
        <Text className="text-heading font-bold text-text-primary">{titulo}</Text>
      </View>
      <Text className="text-caption uppercase text-text-muted">Paso {paso} de 3</Text>
    </View>
  );
}

/**
 * Crear una subcuenta: nombre y monto → las cinco preguntas → la propuesta.
 *
 * El monto se avisa contra `sin_asignar` mientras el usuario escribe, pero **quien decide
 * es el servidor**. Si el backend responde 422, el mensaje que se ve es el suyo.
 */
export default function NuevaSubcuentaPage() {
  const navigation = useNavigation();
  const { user } = useAuth();

  const [paso, setPaso] = useState<Paso>(1);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const [resumen, setResumen] = useState<ResumenCapital | null>(null);
  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null);

  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [respuestas, setRespuestas] = useState<Record<string, string>>({});

  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [propuesta, setPropuesta] = useState<PortfolioProposal | null>(null);

  const cargar = useCallback(async () => {
    if (!user) return;
    setErrorCarga(null);
    try {
      const [r, p] = await Promise.all([getSubcuentas(user.id), getPreguntas()]);
      setResumen(r);
      setPreguntas(p);
    } catch (e) {
      setErrorCarga(e instanceof ApiError ? e.message : 'No se pudo cargar la pantalla.');
    }
  }, [user]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const montoNumero = montoANumero(monto);
  const sinAsignar = resumen?.sin_asignar ?? null;
  const excede = sinAsignar != null && montoNumero > sinAsignar;
  const puedeSeguir = nombre.trim().length > 0 && montoNumero > 0 && !excede;

  const faltan = (preguntas ?? []).filter((p) => !respuestas[p.code]).length;
  const puedeEnviar = preguntas != null && faltan === 0 && !enviando;

  async function crear() {
    if (!puedeEnviar || !user) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const investor = await crearPerfil({
        nombre_subcuenta: nombre.trim(),
        monto: montoNumero,
        respuestas,
      });
      setPropuesta(await getPropuesta(user.id, investor.session_id));
      setPaso(3);
    } catch (e) {
      setErrorEnvio(e instanceof ApiError ? e.message : 'No se pudo crear la subcuenta.');
    } finally {
      setEnviando(false);
    }
  }

  if (errorCarga) {
    return (
      <View className="flex-1 bg-surface-background">
        <ErrorEstado mensaje={errorCarga} onReintentar={cargar} />
      </View>
    );
  }

  if (!resumen || !preguntas) {
    return (
      <View className="flex-1 bg-surface-background">
        <Cargando mensaje="Cargando…" />
      </View>
    );
  }

  // --- Paso 3: la propuesta recién creada ---------------------------------
  if (paso === 3) {
    return (
      <View className="flex-1 bg-surface-background">
        <Cabecera paso={3} titulo={nombre.trim()} />

        {!propuesta ? (
          <Cargando mensaje="Armando tu propuesta…" />
        ) : (
          <ScrollView className="bg-surface-canvas" contentContainerClassName="px-5 py-6 gap-4">
            <DisclaimerBanner />

            <View className="gap-4 rounded-2xl border border-surface-border bg-surface-background p-5">
              <View className="gap-1">
                <Text className="text-caption font-bold uppercase text-text-secondary">
                  Perfil {propuesta.perfil_riesgo}
                </Text>
                <Text className="text-caption text-text-muted">
                  {puntos(propuesta.puntaje, propuesta.puntaje_max)}
                </Text>
              </View>

              <DonutPortafolio
                allocations={propuesta.allocations}
                centro={usd(propuesta.monto_total)}
                etiquetaCentro="Total"
              />

              {propuesta.retorno_esperado_anual != null ? (
                <Text className="text-center text-caption text-text-muted">
                  Retorno estimado del portafolio:{' '}
                  {porcentaje(propuesta.retorno_esperado_anual)} anual (referencial).
                </Text>
              ) : null}
            </View>

            <Text className="text-body text-text-secondary">
              Tu subcuenta quedó en revisión: un asesor humano la aprueba, la edita o la
              rechaza antes de cualquier operación.
            </Text>

            <Touchable
              onPress={() =>
                navigation.replace('SubcuentaDetalle', {
                  sessionId: propuesta.session_id,
                  nombre: nombre.trim(),
                })
              }
              className="items-center rounded-2xl bg-brand-primary py-4"
            >
              <Text className="text-body-md font-bold text-text-onPrimary">
                Ver la propuesta completa
              </Text>
            </Touchable>

            <Touchable onPress={() => navigation.popToTop()} className="items-center py-2">
              <Text className="text-body text-text-secondary">Volver a mis subcuentas</Text>
            </Touchable>
          </ScrollView>
        )}
      </View>
    );
  }

  // --- Pasos 1 y 2 ---------------------------------------------------------
  return (
    <View className="flex-1 bg-surface-background">
      <Cabecera
        paso={paso}
        titulo={paso === 1 ? 'Nueva subcuenta' : nombre.trim()}
        onAtras={paso === 1 ? navigation.goBack : () => setPaso(1)}
      />

      <ScrollView className="bg-surface-canvas" contentContainerClassName="px-5 py-6 gap-6">
        {paso === 1 ? (
          <>
            <Text className="text-body text-text-secondary">
              Cada subcuenta tiene su propio objetivo y su propio monto, y por eso puede
              terminar con un perfil de riesgo distinto al de las otras.
            </Text>

            <View className="gap-2 rounded-2xl border border-surface-border bg-surface-background p-5">
              <Text className="text-caption font-bold uppercase text-text-secondary">Nombre</Text>
              <TextInput
                value={nombre}
                onChangeText={setNombre}
                placeholder="Jubilación"
                maxLength={60}
                className="w-full rounded-2xl border border-surface-border bg-surface-elevated px-4 py-4 text-body-md font-bold text-text-primary"
              />
            </View>

            <View className="gap-2 rounded-2xl border border-surface-border bg-surface-background p-5">
              <Text className="text-caption font-bold uppercase text-text-secondary">
                Monto (USD)
              </Text>
              <TextInput
                value={monto}
                onChangeText={(texto) => setMonto(montoConSeparadores(texto))}
                placeholder="20.000"
                keyboardType="decimal-pad"
                className="w-full rounded-2xl border border-surface-border bg-surface-elevated px-4 py-4 text-display font-bold text-text-primary"
              />

              {sinAsignar != null ? (
                <Text className={`text-caption ${excede ? 'text-state-error' : 'text-text-muted'}`}>
                  {excede
                    ? `Te pasas: solo tienes ${usd(sinAsignar)} sin asignar.`
                    : `Tienes ${usd(sinAsignar)} sin asignar.`}
                </Text>
              ) : (
                <Text className="text-caption text-text-muted">
                  No declaraste un capital total, así que no hay tope contra el cual validar
                  este monto.
                </Text>
              )}
            </View>

            <Touchable
              onPress={() => setPaso(2)}
              disabled={!puedeSeguir}
              className={`items-center rounded-2xl py-4 ${
                puedeSeguir ? 'bg-brand-primary' : 'bg-surface-secondary'
              }`}
            >
              <Text
                className={`text-body-md font-bold ${
                  puedeSeguir ? 'text-text-onPrimary' : 'text-text-muted'
                }`}
              >
                Continuar
              </Text>
            </Touchable>
          </>
        ) : (
          <>
            <Text className="text-body text-text-secondary">
              Cinco preguntas para {nombre.trim()}. Con ellas se calcula el perfil de riesgo
              de esta subcuenta según reglas publicadas — podrás ver exactamente cómo influyó
              cada respuesta.
            </Text>

            <FormularioPreguntas
              preguntas={preguntas}
              respuestas={respuestas}
              onElegir={(preguntaCode, opcionCode) =>
                setRespuestas((prev) => ({ ...prev, [preguntaCode]: opcionCode }))
              }
            />

            {errorEnvio ? (
              <View className="rounded-2xl bg-stateAlpha-errorSoft px-4 py-3">
                <Text className="text-body text-state-error">{errorEnvio}</Text>
              </View>
            ) : null}

            <Touchable
              onPress={crear}
              disabled={!puedeEnviar}
              className={`items-center justify-center rounded-2xl py-4 ${
                puedeEnviar ? 'bg-brand-primary' : 'bg-surface-secondary'
              }`}
            >
              {enviando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text
                  className={`text-body-md font-bold ${
                    puedeEnviar ? 'text-text-onPrimary' : 'text-text-muted'
                  }`}
                >
                  {faltan > 0
                    ? `Faltan ${faltan} respuesta${faltan > 1 ? 's' : ''}`
                    : 'Crear la subcuenta'}
                </Text>
              )}
            </Touchable>

            <Text className="pb-4 text-center text-caption text-text-muted">
              La propuesta pasará por la revisión de un asesor humano antes de cualquier
              operación.
            </Text>
          </>
        )}
      </ScrollView>
    </View>
  );
}
