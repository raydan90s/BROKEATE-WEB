import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { ScrollView, Text, View } from '@/components/rn';
import BotonAtras from '@/components/shared/BotonAtras';
import BotonTema from '@/components/shared/BotonTema';

interface PantallaAuthProps {
  titulo: string;
  bajada: string;
  /** Sin `atras` la pantalla no pinta la flecha (queda solo el alternar-tema). */
  atras?: boolean;
  children: ReactNode;
}

/**
 * El chasis de las pantallas de auth en web (gemelo del de RoboAdvisorApp).
 *
 * En vez de SafeArea + KeyboardAvoidingView de RN, aquí basta el `ScrollView` del shim:
 * el navegador ya sube el contenido cuando aparece el teclado. Añade la barra superior
 * (atrás + alternar tema) y el disclaimer al pie, centrado todo en una columna angosta.
 */
export default function PantallaAuth({
  titulo,
  bajada,
  atras = false,
  children,
}: PantallaAuthProps) {
  const navigate = useNavigate();

  return (
    <ScrollView
      className="bg-surface-background"
      contentContainerClassName="grow justify-center px-6 py-8 gap-6"
    >
      <View className="mx-auto w-full max-w-md flex-row items-center justify-between">
        {atras ? <BotonAtras onPress={() => navigate(-1)} /> : <View />}
        <BotonTema />
      </View>

      <View className="mx-auto w-full max-w-md gap-5">
        <View className="gap-1">
          <Text className="text-display font-bold text-text-primary">{titulo}</Text>
          <Text className="text-body text-text-secondary">{bajada}</Text>
        </View>

        {children}
      </View>

      <Text className="mx-auto w-full max-w-md text-center text-caption text-text-muted">
        Brokeate no ejecuta órdenes ni maneja tu dinero. Las propuestas son referenciales y
        las revisa un asesor.
      </Text>
    </ScrollView>
  );
}
