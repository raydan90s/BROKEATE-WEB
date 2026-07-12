import { useCallback, useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { ScrollView, Text, Touchable, View } from '@/components/rn';
import { useColores } from '@/context/ThemeContext';
import { useFocusEffect, useNavigation } from '@/routes/navegacion';

import AgenteFab from '@/app/agente/components/AgenteFab';
import DisclaimerBanner from '@/components/shared/DisclaimerBanner';
import { Cargando, ErrorEstado } from '@/components/shared/Estados';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/http';
import { puntos, usd } from '@/utils/formato';

import { getInvestor } from '../services/investorApi';
import type { Investor } from '../types/inversionista';

/**
 * La bifurcación del inversionista: ¿ya se perfiló o no? El backend responde 404 a
 * `GET /api/investor/{id}` cuando no hay sesión completa — eso no es error, es el estado
 * "todavía no te has perfilado".
 */
export default function InicioPage() {
  const colores = useColores();
  const navigation = useNavigation();
  const { user } = useAuth();

  const [perfil, setPerfil] = useState<Investor | null>(null);
  const [sinPerfilar, setSinPerfilar] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!user) return;
    setCargando(true);
    setError(null);
    try {
      setPerfil(await getInvestor(user.id));
      setSinPerfilar(false);
    } catch (e) {
      if (e instanceof ApiError && e.statusCode === 404) {
        setPerfil(null);
        setSinPerfilar(true);
      } else {
        setError(e instanceof ApiError ? e.message : 'No se pudo cargar tu perfil.');
      }
    } finally {
      setCargando(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  return (
    // Saludo y logout viven en la cabecera del layout: son de la sesión, no de la página.
    <View className="flex-1 bg-surface-background">
      {cargando ? (
        <Cargando />
      ) : error ? (
        <ErrorEstado mensaje={error} onReintentar={cargar} />
      ) : (
        <ScrollView className="bg-surface-canvas" contentContainerClassName="px-5 py-6 gap-4">
          {sinPerfilar ? (
            <>
              <View className="gap-2 rounded-2xl border border-surface-border bg-surface-background p-5">
                <Text className="text-display font-bold text-text-primary">
                  Aún no conocemos tu perfil
                </Text>
                <Text className="text-body text-text-secondary">
                  Contesta cinco preguntas y dinos cuánto quieres invertir. Con eso calculamos
                  tu perfil de riesgo con reglas publicadas y te armamos una propuesta con
                  productos de nuestro catálogo aprobado.
                </Text>
              </View>

              <Touchable
                onPress={() => navigation.navigate('Cuestionario')}
                className="items-center rounded-2xl bg-brand-primary py-4"
              >
                <Text className="text-body-md font-bold text-text-onPrimary">
                  Empezar el cuestionario
                </Text>
              </Touchable>
            </>
          ) : perfil ? (
            <>
              <View className="gap-3 rounded-2xl border border-surface-border bg-surface-background p-5">
                <Text className="text-caption font-bold uppercase text-text-secondary">
                  Tu perfil de riesgo
                </Text>
                <Text className="text-hero font-bold capitalize text-text-primary">
                  {perfil.perfil_riesgo}
                </Text>
                <Text className="text-body text-text-secondary">
                  {puntos(perfil.puntaje, perfil.puntaje_max)}
                  {perfil.monto != null ? ` · ${usd(perfil.monto)} a invertir` : ''}
                </Text>
              </View>

              <Touchable
                onPress={() => navigation.navigate('Propuesta')}
                className="flex-row items-center justify-between rounded-2xl bg-brand-primary px-5 py-4"
              >
                <Text className="text-body-md font-bold text-text-onPrimary">Ver mi propuesta</Text>
                <Ionicons name="chevron-forward" size={20} color={colores.textoSobrePrimario} />
              </Touchable>

              <Touchable
                onPress={() => navigation.navigate('ComoSeCalculo', {})}
                className="flex-row items-center justify-between rounded-2xl border border-surface-border bg-surface-background px-5 py-4"
              >
                <Text className="text-body-md font-bold text-brand-primary">
                  ¿Cómo se calculó mi perfil?
                </Text>
                <Ionicons name="chevron-forward" size={20} color={colores.primario} />
              </Touchable>

              <Touchable
                onPress={() => navigation.navigate('Cuestionario')}
                className="items-center py-2"
              >
                <Text className="text-body text-text-secondary">
                  Volver a contestar el cuestionario
                </Text>
              </Touchable>
            </>
          ) : null}

          <DisclaimerBanner />
        </ScrollView>
      )}

      {!cargando && !error && perfil ? <AgenteFab /> : null}
    </View>
  );
}
