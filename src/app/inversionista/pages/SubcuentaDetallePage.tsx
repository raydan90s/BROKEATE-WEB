import { View } from '@/components/rn';
import { useRoute } from '@/routes/navegacion';

import AgenteFab from '@/app/agente/components/AgenteFab';

import VistaPropuesta from '../components/VistaPropuesta';

/**
 * El detalle de una subcuenta **es** su propuesta: mismo donut, mismos productos, misma
 * explicación. Lo único que cambia es de qué sesión se lee.
 *
 * El asistente flota encima con el `sessionId` de ESTA subcuenta.
 */
export default function SubcuentaDetallePage() {
  const { params } = useRoute<{ sessionId: string; nombre?: string }>();
  const { sessionId, nombre } = params;
  return (
    <View className="flex-1">
      <VistaPropuesta sessionId={sessionId} titulo={nombre ?? 'Tu subcuenta'} />
      <AgenteFab sessionId={sessionId} />
    </View>
  );
}
