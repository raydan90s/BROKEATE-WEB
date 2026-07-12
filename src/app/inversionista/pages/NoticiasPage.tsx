import FeedNoticias from '@/app/inversionista/components/FeedNoticias';
import { ScrollView, Text, View } from '@/components/rn';

/**
 * El tab de noticias del inversionista. Es una envoltura fina: todo el trabajo
 * (temas, tarjetas, respaldo) vive en `FeedNoticias`, que también puede montarse
 * dentro de otras pantallas sin duplicar lógica.
 */
export default function NoticiasPage() {
  return (
    <View className="flex-1 bg-surface-canvas">
      <View className="border-b border-surface-border bg-surface-background px-5 py-4">
        <Text className="text-heading font-bold text-text-primary">Noticias</Text>
        <Text className="text-caption text-text-muted">
          El pulso del mercado, citado con su fuente
        </Text>
      </View>

      <ScrollView className="flex-1 px-4" contentContainerClassName="py-4">
        <FeedNoticias />
      </ScrollView>
    </View>
  );
}
