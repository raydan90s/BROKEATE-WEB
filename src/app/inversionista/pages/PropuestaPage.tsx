import { View } from '@/components/rn';

import AgenteFab from '@/app/agente/components/AgenteFab';

import VistaPropuesta from '../components/VistaPropuesta';

/**
 * La propuesta de la cartera única: sin `sessionId`, el backend devuelve la sesión más
 * reciente del usuario del token.
 *
 * El asistente flota encima: sin `sessionId` conversa sobre la sesión más reciente, que
 * es justo la que muestra esta pantalla.
 */
export default function PropuestaPage() {
  return (
    <View className="flex-1">
      <VistaPropuesta />
      <AgenteFab />
    </View>
  );
}
