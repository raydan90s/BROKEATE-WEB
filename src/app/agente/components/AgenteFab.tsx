import { useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { Touchable, View } from '@/components/rn';

import AgentSheet from './AgentSheet';

/**
 * El botón flotante que abre el asistente. Autocontenido: se suelta en cualquier
 * pantalla del inversionista y él solo maneja la hoja modal.
 *
 * En web se ancla al viewport (position: fixed) en vez de al contenedor, para que quede
 * dentro del ancho de la app (max-w 480) y no en la esquina del monitor.
 */
export default function AgenteFab({
  sessionId,
  bottom = 24,
}: {
  sessionId?: string;
  /** Separación desde abajo. Se sube cuando la pantalla tiene una barra sticky. */
  bottom?: number;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <div
        className="pointer-events-none fixed inset-x-0 z-40 mx-auto flex w-full max-w-[480px] justify-end px-5"
        style={{ bottom }}
      >
        <Touchable
          onPress={() => setAbierto(true)}
          accessibilityLabel="Abrir el asistente"
          className="pointer-events-auto h-14 w-14 items-center justify-center rounded-full bg-brand-primary shadow-lg"
        >
          <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          {/* Puntito de acento: da la sensación de "vivo". */}
          <View className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full border-2 border-brand-primary bg-brand-accent" />
        </Touchable>
      </div>

      <AgentSheet visible={abierto} onClose={() => setAbierto(false)} sessionId={sessionId} />
    </>
  );
}
