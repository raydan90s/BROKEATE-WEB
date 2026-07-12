import { useCallback, useEffect, useRef, useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { Text, TextInput, Touchable, View } from '@/components/rn';
import { ApiError } from '@/services/http';

import { enviarMensaje, getProviders, type ProviderInfo } from '../services/agentApi';
import Burbuja, { type Mensaje } from './Burbuja';
import ProviderSelector from './ProviderSelector';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** Subcuenta sobre la que se conversa. Sin ella, el backend usa la más reciente. */
  sessionId?: string;
}

const SUGERENCIAS = [
  '¿Cómo se calculó mi perfil?',
  '¿Por qué esta distribución?',
  '¿Qué riesgo tiene mi cartera?',
  '¿Cómo está el bitcoin hoy?',
];

const saludo = (): Mensaje => ({
  id: 'saludo',
  role: 'assistant',
  texto:
    'Hola 👋 Soy tu asistente. Puedo explicarte tu perfil de riesgo y tu propuesta ' +
    'de inversión, y mostrarte de dónde sale cada dato. ¿Qué te gustaría saber?',
});

let contador = 0;
const nuevoId = () => `m${++contador}`;

export default function AgentSheet({ visible, onClose, sessionId }: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([saludo()]);
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [providers, setProviders] = useState<ProviderInfo[]>([]);
  const [proveedor, setProveedor] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Baja el scroll al último mensaje cada vez que llega uno.
  useEffect(() => {
    const t = setTimeout(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
    return () => clearTimeout(t);
  }, [mensajes]);

  // Re-consulta el catálogo. Si el proveedor elegido dejó de tener key, salta a uno
  // disponible: nunca se queda uno inválido.
  const cargarProviders = useCallback(() => {
    getProviders()
      .then((lista) => {
        setProviders(lista);
        setProveedor((actual) => {
          if (actual && lista.some((p) => p.id === actual && p.disponible)) return actual;
          const def =
            lista.find((p) => p.es_default && p.disponible) ?? lista.find((p) => p.disponible);
          return def?.id ?? null;
        });
      })
      .catch(() => {
        /* si falla, el selector no aparece y se usa el default del .env */
      });
  }, []);

  useEffect(() => {
    if (visible) cargarProviders();
  }, [visible, cargarProviders]);

  const soloSaludo = mensajes.length === 1;

  async function enviar(texto: string) {
    const t = texto.trim();
    if (!t || enviando) return;

    const pendingId = nuevoId();
    setMensajes((m) => [
      ...m,
      { id: nuevoId(), role: 'user', texto: t },
      { id: pendingId, role: 'assistant', texto: '', pending: true },
    ]);
    setInput('');
    setEnviando(true);

    try {
      const r = await enviarMensaje(t, sessionId, proveedor ?? undefined);
      setMensajes((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? {
                id: pendingId,
                role: 'assistant',
                texto: r.texto,
                sources: r.sources,
                modelo: r.modelo,
                ruta: r.ruta,
              }
            : msg,
        ),
      );
    } catch (e) {
      const textoErr =
        e instanceof ApiError ? e.message : 'No pude responder ahora. Intenta de nuevo.';
      setMensajes((m) =>
        m.map((msg) =>
          msg.id === pendingId
            ? { id: pendingId, role: 'assistant', texto: textoErr, error: true }
            : msg,
        ),
      );
    } finally {
      setEnviando(false);
    }
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center bg-black/45"
      onClick={onClose}
    >
      <div
        className="mt-auto flex h-[88dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl bg-surface-background"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + header */}
        <View className="items-center pt-2.5">
          <View className="h-1 w-10 rounded-full bg-surface-divider" />
        </View>
        <View className="flex-row items-center justify-between border-b border-surface-border px-4 py-3">
          <View className="flex-1 flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-brandAlpha-primarySoft">
              <Ionicons name="sparkles" size={18} color="#1E3A8A" />
            </View>
            <Text className="text-body-md font-bold text-text-primary">Asistente</Text>
          </View>

          <View className="flex-row items-center gap-2">
            <ProviderSelector
              providers={providers}
              value={proveedor}
              onChange={setProveedor}
              onOpen={cargarProviders}
            />
            <Touchable
              onPress={onClose}
              className="h-8 w-8 items-center justify-center rounded-xl bg-surface-secondary"
            >
              <Ionicons name="close" size={18} color="#71717A" />
            </Touchable>
          </View>
        </View>

        {/* Mensajes */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-surface-canvas px-4 py-4">
          {mensajes.map((m) => (
            <Burbuja key={m.id} mensaje={m} />
          ))}

          {soloSaludo ? (
            <View className="mt-1 gap-2">
              {SUGERENCIAS.map((s) => (
                <Touchable
                  key={s}
                  onPress={() => enviar(s)}
                  className="flex-row items-center gap-2 self-start rounded-full border border-brandAlpha-primaryMedium bg-surface-background px-3.5 py-2"
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={13} color="#1E3A8A" />
                  <Text className="text-body text-brand-primary">{s}</Text>
                </Touchable>
              ))}
            </View>
          ) : null}
        </div>

        {/* Barra de entrada */}
        <View className="flex-row items-end gap-2 border-t border-surface-border bg-surface-background px-4 py-3">
          <View className="flex-1">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Pregunta sobre tu propuesta…"
              onSubmitEditing={() => enviar(input)}
              className="max-h-24 w-full rounded-2xl bg-surface-secondary px-4 py-2.5 text-body text-text-primary"
            />
          </View>
          <Touchable
            onPress={() => enviar(input)}
            disabled={!input.trim() || enviando}
            className={`h-11 w-11 items-center justify-center rounded-2xl ${
              !input.trim() || enviando ? 'bg-surface-divider' : 'bg-brand-primary'
            }`}
          >
            <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
          </Touchable>
        </View>
      </div>
    </div>
  );
}
