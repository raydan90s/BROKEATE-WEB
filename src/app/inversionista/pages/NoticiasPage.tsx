import FeedNoticias from '@/app/inversionista/components/FeedNoticias';
import { ScrollView, View } from '@/components/rn';

/**
 * El tab de noticias del inversionista. Es una envoltura fina: todo el trabajo
 * (temas, tarjetas, respaldo) vive en `FeedNoticias`, que también puede montarse
 * dentro de otras pantallas sin duplicar lógica.
 */
export default function NoticiasPage() {
  return (
    <View className="flex-1 bg-surface-canvas">
      <ScrollView className="flex-1 px-4" contentContainerClassName="py-4">
        <FeedNoticias />
      </ScrollView>
    </View>
  );
}
