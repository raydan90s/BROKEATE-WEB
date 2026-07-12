import { useCallback, useEffect, useRef, useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { ScrollView, Text, Touchable, View, abrirEnlace } from '@/components/rn';
import { useFocusEffect, useNavigation } from '@/routes/navegacion';

import BotonAtras from '@/components/shared/BotonAtras';
import { Cargando, ErrorEstado } from '@/components/shared/Estados';
import { ApiError } from '@/services/http';

import {
  desvincular,
  getEstado,
  pedirCodigo,
  type LinkCode,
  type WhatsAppStatus,
} from '../services/whatsappApi';

/** El número del bot (para prellenar el mensaje). Sin él, el usuario copia el código a mano. */
const NUMERO_BOT = import.meta.env.VITE_WHATSAPP_NUMERO ?? '';

function mmss(segundos: number): string {
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** El código, en grande y con su cuenta regresiva (muere a los 10 minutos, lo impone el backend). */
function CodigoVivo({ codigo, onExpirar }: { codigo: LinkCode; onExpirar: () => void }) {
  const [restante, setRestante] = useState(codigo.expira_en_segundos);
  const alExpirar = useRef(onExpirar);
  alExpirar.current = onExpirar;

  useEffect(() => {
    setRestante(codigo.expira_en_segundos);
    const id = setInterval(() => {
      setRestante((s) => {
        if (s <= 1) {
          clearInterval(id);
          alExpirar.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [codigo]);

  const urgente = restante <= 60;

  return (
    <View className="items-center gap-2 rounded-2xl border border-surface-border bg-surface-elevated p-6">
      <Text className="text-caption uppercase tracking-widest text-text-muted">Tu código</Text>
      <Text className="text-display font-bold tracking-[8px] text-brand-primary">
        {codigo.code}
      </Text>
      <Text className={`text-caption ${urgente ? 'text-state-error' : 'text-text-muted'}`}>
        {restante > 0 ? `Vence en ${mmss(restante)}` : 'Venció. Genera uno nuevo.'}
      </Text>
    </View>
  );
}

/**
 * Vincular WhatsApp con la cuenta. Un número de teléfono no prueba nada: el vínculo nace
 * de un código que solo se lee estando autenticado acá, y que el usuario devuelve por el
 * propio canal.
 */
export default function VincularWhatsAppPage() {
  const navigation = useNavigation();
  const [estado, setEstado] = useState<WhatsAppStatus | null>(null);
  const [codigo, setCodigo] = useState<LinkCode | null>(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setEstado(await getEstado());
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'No se pudo consultar el estado de WhatsApp.',
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  async function generar() {
    if (ocupado) return;
    setOcupado(true);
    setError(null);
    try {
      setCodigo(await pedirCodigo());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo generar el código.');
    } finally {
      setOcupado(false);
    }
  }

  async function quitar() {
    if (ocupado) return;
    setOcupado(true);
    setError(null);
    try {
      setEstado(await desvincular());
      setCodigo(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo desvincular.');
    } finally {
      setOcupado(false);
    }
  }

  function abrirWhatsApp(instruccion: string) {
    const url = NUMERO_BOT
      ? `https://wa.me/${NUMERO_BOT.replace(/\D/g, '')}?text=${encodeURIComponent(instruccion)}`
      : `https://wa.me/?text=${encodeURIComponent(instruccion)}`;
    abrirEnlace(url);
  }

  return (
    <View className="flex-1 bg-surface-background">
      <View className="flex-row items-center gap-3 border-b border-surface-border px-5 py-4">
        <BotonAtras onPress={() => navigation.goBack()} />
        <View className="flex-1">
          <Text className="text-body-md font-bold text-text-primary">Asistente por WhatsApp</Text>
          <Text className="text-caption text-text-muted">
            Pregunta por tus inversiones desde el chat
          </Text>
        </View>
        <Ionicons name="logo-whatsapp" size={24} color="#1B8A5A" />
      </View>

      {cargando ? (
        <Cargando />
      ) : error && !estado ? (
        <ErrorEstado mensaje={error} onReintentar={cargar} />
      ) : (
        <ScrollView className="bg-surface-canvas" contentContainerClassName="px-5 py-6 gap-4">
          {estado?.vinculado ? (
            <>
              <View className="gap-3 rounded-2xl border border-surface-border bg-surface-background p-5">
                <View className="flex-row items-center gap-2">
                  <Ionicons name="checkmark-circle" size={20} color="#1B8A5A" />
                  <Text className="text-body-md font-bold text-text-primary">
                    WhatsApp vinculado
                  </Text>
                </View>
                <Text className="text-body text-text-secondary">
                  El número {estado.telefono} puede preguntarme por tu perfil, tus subcuentas y
                  qué productos del catálogo te convienen. Escríbeme{' '}
                  <Text className="font-bold">AYUDA</Text> por el chat para ver ejemplos.
                </Text>
              </View>

              <Touchable
                onPress={quitar}
                disabled={ocupado}
                className="flex-row items-center justify-center gap-2 rounded-2xl border border-surface-border py-4"
              >
                <Ionicons name="unlink-outline" size={18} color="#C0362C" />
                <Text className="text-body font-bold text-state-error">
                  Desvincular este número
                </Text>
              </Touchable>

              {error ? <Text className="text-caption text-state-error">{error}</Text> : null}
            </>
          ) : (
            <>
              <View className="gap-3 rounded-2xl border border-surface-border bg-surface-background p-5">
                <Text className="text-display font-bold text-text-primary">
                  Habla con tu asesor por WhatsApp
                </Text>
                <Text className="text-body leading-5 text-text-secondary">
                  Pregúntale qué inversiones tienes, por qué te asignaron cada producto o cuál
                  del catálogo te conviene a un plazo. Responde con los datos de tu cuenta, no
                  con suposiciones.
                </Text>
                <Text className="text-caption leading-4 text-text-muted">
                  Como el bot habla de tu dinero, primero necesita saber que ese número es tuyo:
                  generas un código, se lo escribes por el chat, y queda vinculado. Vence a los
                  diez minutos y sirve una sola vez.
                </Text>
              </View>

              {codigo ? (
                <>
                  <CodigoVivo codigo={codigo} onExpirar={() => setCodigo(null)} />

                  <View className="gap-2 rounded-2xl border border-surface-border bg-surface-background p-5">
                    <Text className="text-body font-bold text-text-primary">
                      Escríbele al asistente:
                    </Text>
                    <View className="rounded-xl bg-surface-secondary px-4 py-3">
                      <Text className="text-body-md font-bold text-text-primary">
                        {codigo.instruccion}
                      </Text>
                    </View>
                    <Text className="text-caption text-text-muted">
                      Te contesta apenas lo reciba y, desde ahí, ya puedes preguntarle lo que
                      quieras.
                    </Text>
                  </View>

                  <Touchable
                    onPress={() => abrirWhatsApp(codigo.instruccion)}
                    className="flex-row items-center justify-center gap-2 rounded-2xl bg-state-success py-4"
                  >
                    <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
                    <Text className="text-body-md font-bold text-text-onPrimary">
                      Abrir WhatsApp con el mensaje listo
                    </Text>
                  </Touchable>

                  <Touchable onPress={generar} disabled={ocupado} className="items-center py-2">
                    <Text className="text-body font-bold text-brand-primary">
                      Generar otro código
                    </Text>
                  </Touchable>
                </>
              ) : (
                <Touchable
                  onPress={generar}
                  disabled={ocupado}
                  className={`flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
                    ocupado ? 'bg-brandAlpha-primaryMedium' : 'bg-brand-primary'
                  }`}
                >
                  <Ionicons name="key-outline" size={20} color="#FFFFFF" />
                  <Text className="text-body-md font-bold text-text-onPrimary">
                    Generar código de vinculación
                  </Text>
                </Touchable>
              )}

              {error ? <Text className="text-caption text-state-error">{error}</Text> : null}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}
