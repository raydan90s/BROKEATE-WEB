import { useCallback, useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { ScrollView, Text, Touchable, View } from '@/components/rn';
import { useFocusEffect, useNavigation } from '@/routes/navegacion';

import BotonTema from '@/components/shared/BotonTema';
import { Cargando, ErrorEstado, Vacio } from '@/components/shared/Estados';
import { useAuth } from '@/context/AuthContext';
import { useColores } from '@/context/ThemeContext';
import { ApiError } from '@/services/http';
import { fechaHora, usd } from '@/utils/formato';

import { getCola } from '../services/advisorApi';
import type { ColaItem } from '../types/asesor';

/**
 * HU3: la cola de propuestas que esperan decisión.
 *
 * La vista `v_advisor_review_queue` solo lista `pending_review`, así que decidir una
 * propuesta la saca de acá sola. Se relee al volver a la pantalla.
 */
export default function ColaRevisionPage() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();
  const colores = useColores();

  const [cola, setCola] = useState<ColaItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      setCola(await getCola());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cargar la cola.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  async function refrescar() {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }

  return (
    <View className="flex-1 bg-surface-background">
      <View className="flex-row items-center justify-between border-b border-surface-border px-5 py-4">
        <View className="flex-1 pr-3">
          <Text className="text-heading font-bold text-text-primary">Cola de revisión</Text>
          <Text className="text-caption text-text-secondary">{user?.name} · Asesor</Text>
        </View>
        <View className="flex-row items-center gap-4">
          <BotonTema />
          {/* En web no hay "pull to refresh": un botón explícito. */}
          <Touchable onPress={refrescar} accessibilityLabel="Actualizar" disabled={refrescando}>
            <Ionicons name="refresh" size={20} color={colores.primario} />
          </Touchable>
          <Touchable onPress={() => void logout()}>
            <Text className="text-body font-bold text-brand-primary">Salir</Text>
          </Touchable>
        </View>
      </View>

      {error ? (
        <ErrorEstado mensaje={error} onReintentar={cargar} />
      ) : !cola ? (
        <Cargando mensaje="Cargando la cola…" />
      ) : cola.length === 0 ? (
        <Vacio
          titulo="No hay propuestas pendientes"
          detalle="Cuando un cliente se perfile, su propuesta aparecerá acá para tu revisión."
        />
      ) : (
        <ScrollView
          className="bg-surface-canvas"
          contentContainerClassName="px-5 py-6 gap-4 max-w-6xl"
        >
          <Text className="text-body text-text-secondary">
            {cola.length} propuesta{cola.length > 1 ? 's' : ''} esperando tu decisión. Ninguna
            se ejecuta hasta que la apruebes.
          </Text>

          {/* En pantalla ancha la cola se reparte en columnas en vez de una tarjeta por fila. */}
          <View className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cola.map((item) => (
            <Touchable
              key={item.proposal_id}
              onPress={() =>
                navigation.navigate('DetallePropuesta', { proposalId: item.proposal_id })
              }
              className="gap-3 rounded-2xl border border-surface-border bg-surface-background p-5"
            >
              <View className="flex-row items-start justify-between gap-3">
                <View className="flex-1 gap-1">
                  <Text className="text-body-md font-bold text-text-primary">
                    {item.investor_nombre}
                  </Text>
                  <Text className="text-caption text-text-muted">
                    {item.cedula_ruc ?? 'Sin cédula registrada'} · {fechaHora(item.creada_en)}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colores.textoMuted} />
              </View>

              <View className="flex-row items-center gap-2">
                <View className="rounded-full bg-brandAlpha-primarySoft px-3 py-1">
                  <Text className="text-caption font-bold capitalize text-brand-primary">
                    {item.perfil_riesgo ?? 'sin perfil'}
                  </Text>
                </View>
                {item.puntaje != null ? (
                  <Text className="text-caption text-text-secondary">
                    {item.puntaje} / 15 puntos
                  </Text>
                ) : null}
              </View>

              <Text className="text-display font-bold text-text-primary">
                {usd(item.monto_total)}
              </Text>
            </Touchable>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
