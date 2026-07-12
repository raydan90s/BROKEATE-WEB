import { useCallback, useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { ActivityIndicator, ScrollView, Text, TextInput, Touchable, View } from '@/components/rn';
import { useFocusEffect, useNavigation } from '@/routes/navegacion';

import AgenteFab from '@/app/agente/components/AgenteFab';
import DisclaimerBanner from '@/components/shared/DisclaimerBanner';
import { Cargando, ErrorEstado } from '@/components/shared/Estados';
import { COLORES } from '@/constants/colores';
import { useAuth } from '@/context/AuthContext';
import HomeHeader from '@/screens/inicio/home/components/HomeHeader';
import { ApiError } from '@/services/http';

import BarraCapital from '../components/BarraCapital';
import MarketTicker from '../components/MarketTicker';
import TarjetaSubcuenta from '../components/TarjetaSubcuenta';
import { fijarCapital, getSubcuentas } from '../services/investorApi';
import type { ResumenCapital } from '../types/inversionista';
import { montoANumero, montoConSeparadores } from '@/utils/formato';

/** Declarar el techo de capital: el número contra el que el servidor validará cada
 *  subcuenta nueva. Se fija una vez y se puede corregir después. */
function EditorCapital({
  capitalActual,
  onGuardado,
}: {
  capitalActual: number | null;
  onGuardado: (resumen: ResumenCapital) => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valor = montoANumero(texto);

  async function guardar() {
    if (valor <= 0 || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      onGuardado(await fijarCapital(valor));
      setAbierto(false);
      setTexto('');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo guardar el capital.');
    } finally {
      setGuardando(false);
    }
  }

  if (!abierto) {
    return (
      <Touchable
        onPress={() => setAbierto(true)}
        className="flex-row items-center gap-2 self-start"
      >
        <Ionicons name="create-outline" size={16} color="#1E3A8A" />
        <Text className="text-body font-bold text-brand-primary">
          {capitalActual == null ? 'Declarar mi capital total' : 'Cambiar capital total'}
        </Text>
      </Touchable>
    );
  }

  return (
    <View className="gap-2">
      <TextInput
        value={texto}
        onChangeText={(nuevo) => setTexto(montoConSeparadores(nuevo))}
        placeholder="40.000"
        keyboardType="decimal-pad"
        autoFocus
        className="w-full rounded-2xl border border-surface-border bg-surface-elevated px-4 py-3 text-body-md font-bold text-text-primary"
      />

      {error ? <Text className="text-caption text-state-error">{error}</Text> : null}

      <View className="flex-row gap-2">
        <Touchable
          onPress={guardar}
          disabled={valor <= 0 || guardando}
          className={`flex-1 items-center rounded-2xl py-3 ${
            valor > 0 ? 'bg-brand-primary' : 'bg-surface-secondary'
          }`}
        >
          {guardando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text
              className={`text-body font-bold ${
                valor > 0 ? 'text-text-onPrimary' : 'text-text-muted'
              }`}
            >
              Guardar
            </Text>
          )}
        </Touchable>

        <Touchable
          onPress={() => {
            setAbierto(false);
            setError(null);
          }}
          className="items-center rounded-2xl border border-surface-border px-5 py-3"
        >
          <Text className="text-body text-text-secondary">Cancelar</Text>
        </Touchable>
      </View>
    </View>
  );
}

/** Comparador y simulador se exploran **sin** haber abierto una cartera, así que su
 *  entrada vive en el Home. */
function AccesoHerramienta({
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
  return (
    <Touchable
      onPress={onPress}
      className="flex-1 gap-1 rounded-2xl border border-surface-border bg-surface-background p-4"
    >
      <Ionicons name={icono} size={20} color={COLORES.primario} />
      <Text className="text-body font-bold text-text-primary">{titulo}</Text>
      <Text className="text-caption leading-4 text-text-muted">{detalle}</Text>
    </Touchable>
  );
}

/**
 * El Home del inversionista: su capital y en qué está repartido.
 *
 * Ningún número de esta pantalla se calcula acá. `capital_total`, `asignado` y
 * `sin_asignar` llegan sumados por SQL.
 */
export default function MisSubcuentasPage() {
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const [resumen, setResumen] = useState<ResumenCapital | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!user) return;
    setCargando(true);
    setError(null);
    try {
      setResumen(await getSubcuentas(user.id));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudieron cargar tus subcuentas.');
    } finally {
      setCargando(false);
    }
  }, [user]);

  // Al volver de crear una subcuenta el reparto cambió: se relee, no se reusa.
  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  return (
    <View className="flex-1 bg-surface-background">
      <HomeHeader
        title={user ? `Hola, ${user.name}` : 'Inicio'}
        subtitle="Tus subcuentas"
        actionIcon="log-out-outline"
        onAction={() => void logout()}
      />

      {cargando ? (
        <Cargando />
      ) : error ? (
        <ErrorEstado mensaje={error} onReintentar={cargar} />
      ) : resumen ? (
        <>
          <ScrollView
            className="bg-surface-canvas"
            contentContainerClassName="px-5 py-6 gap-4 max-w-6xl"
          >
            {/* -mx-5 cancela el padding: el ticker desliza de borde a borde. */}
            <View className="-mx-5">
              <MarketTicker />
            </View>

            <View className="gap-4 rounded-2xl border border-surface-border bg-surface-background p-5">
              <BarraCapital
                capitalTotal={resumen.capital_total}
                asignado={resumen.asignado}
                sinAsignar={resumen.sin_asignar}
                subcuentas={resumen.subcuentas}
              />
              <EditorCapital capitalActual={resumen.capital_total} onGuardado={setResumen} />
            </View>

            <View className="flex-row gap-3">
              <AccesoHerramienta
                icono="swap-horizontal-outline"
                titulo="Comparador"
                detalle="Las tasas del catálogo, y cuáles admite tu perfil."
                onPress={() => navigation.navigate('Comparador')}
              />
              <AccesoHerramienta
                icono="calculator-outline"
                titulo="Simulador"
                detalle="Cuánto rendiría un monto a un plazo."
                onPress={() => navigation.navigate('Simulador')}
              />
            </View>

            {/* Mercados EXTERNOS (Alpha Vantage): fuera de la fila de arriba a propósito. */}
            <View className="flex-row">
              <AccesoHerramienta
                icono="trending-up-outline"
                titulo="Mercados globales"
                detalle="Bitcoin, S&P 500, EUR/USD, oro — cotización, gráfico y análisis de IA."
                onPress={() => navigation.navigate('Mercados')}
              />
            </View>

            {/* El asistente vive también fuera de la app: el mismo agente por WhatsApp. */}
            <Touchable
              onPress={() => navigation.navigate('VincularWhatsApp')}
              className="flex-row items-center gap-3 rounded-2xl border border-surface-border bg-surface-background p-4"
            >
              <Ionicons name="logo-whatsapp" size={24} color={COLORES.exito} />
              <View className="flex-1">
                <Text className="text-body font-bold text-text-primary">
                  Pregúntame por WhatsApp
                </Text>
                <Text className="text-caption leading-4 text-text-muted">
                  Tus inversiones y el catálogo, desde el chat. Vincula tu número.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORES.textoMuted} />
            </Touchable>

            {resumen.subcuentas.length === 0 ? (
              <View className="gap-2 rounded-2xl border border-surface-border bg-surface-background p-5">
                <Text className="text-display font-bold text-text-primary">
                  Todavía no tienes subcuentas
                </Text>
                <Text className="text-body text-text-secondary">
                  Una subcuenta es una cartera con su propio objetivo y su propio monto:
                  contestas las cinco preguntas, y cada una recibe el perfil de riesgo y la
                  propuesta que le corresponden.
                </Text>
              </View>
            ) : (
              // En pantalla ancha las subcuentas se reparten en rejilla en vez de apilarse.
              <View className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {resumen.subcuentas.map((subcuenta) => (
                  <TarjetaSubcuenta
                    key={subcuenta.session_id}
                    subcuenta={subcuenta}
                    onPress={() =>
                      navigation.navigate('SubcuentaDetalle', {
                        sessionId: subcuenta.session_id,
                        nombre: subcuenta.nombre,
                      })
                    }
                  />
                ))}
              </View>
            )}

            <DisclaimerBanner />
          </ScrollView>

          {/* Sticky: la acción principal del Home no se pierde al hacer scroll. */}
          <View className="border-t border-surface-border bg-surface-background px-5 py-4">
            <Touchable
              onPress={() => navigation.navigate('NuevaSubcuenta')}
              className="mx-auto w-full max-w-6xl flex-row items-center justify-center gap-2 rounded-2xl bg-brand-primary py-4"
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text className="text-body-md font-bold text-text-onPrimary">
                Nueva subcuenta
              </Text>
            </Touchable>
          </View>

          <AgenteFab bottom={96} />
        </>
      ) : null}
    </View>
  );
}
