import { useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { Touchable, View } from '@/components/rn';
import { useNavigation } from '@/routes/navegacion';

import AgentSheet from './AgentSheet';

/**
 * Los botones flotantes del inversionista: el asistente (IA) y, al acercar el cursor, el
 * de WhatsApp que se levanta por encima. El de WhatsApp lleva a la misma pantalla que la
 * sección "Pregúntame por WhatsApp" del Home (`VincularWhatsApp`).
 *
 * En web se anclan al borde derecho del marco de la app (position: fixed, mismo max-w que
 * el Shell) para quedar en la esquina y no —como antes— en medio del contenido, que ahora
 * es mucho más ancho que los 480px de la app móvil.
 */
export default function AgenteFab({
  sessionId,
  bottom = 24,
}: {
  sessionId?: string;
  /** Separación desde abajo. Se sube cuando la pantalla tiene una barra sticky. */
  bottom?: number;
}) {
  const navigation = useNavigation();
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 z-40 mx-auto flex w-full max-w-[1600px] justify-end px-5"
        style={{ bottom }}
      >
        <div className="group pointer-events-auto relative flex flex-col items-center">
          {/* WhatsApp: oculto hasta que el cursor se acerca al grupo; entonces se levanta.
              El envoltorio va absoluto (para no empujar al FAB de IA) y su pb-3 es el puente
              de hover que cubre el espacio entre los dos botones y evita el parpadeo. */}
          <div className="pointer-events-none absolute bottom-full left-1/2 flex -translate-x-1/2 translate-y-3 flex-col items-center pb-3 opacity-0 transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
            <Touchable
              onPress={() => navigation.navigate('VincularWhatsApp')}
              accessibilityLabel="Pregúntame por WhatsApp"
              className="h-12 w-12 items-center justify-center rounded-full bg-state-success shadow-lg"
            >
              <Ionicons name="logo-whatsapp" size={22} color="#FFFFFF" />
            </Touchable>
          </div>

          {/* Asistente (IA): el botón principal, siempre visible. */}
          <Touchable
            onPress={() => setAbierto(true)}
            accessibilityLabel="Abrir el asistente"
            className="h-14 w-14 items-center justify-center rounded-full bg-brand-primary shadow-lg"
          >
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
            {/* Puntito de acento: da la sensación de "vivo". */}
            <View className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border-2 border-brand-primary bg-brand-accent" />
          </Touchable>
        </div>
      </div>

      <AgentSheet visible={abierto} onClose={() => setAbierto(false)} sessionId={sessionId} />
    </>
  );
}
