import { useEffect, useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { ActivityIndicator, ScrollView, Text, Touchable, View } from '@/components/rn';
import { fechaHoraLarga, porcentaje, usd } from '@/utils/formato';

import { getPropuesta } from '../services/advisorApi';
import type { EventoAuditoria, PropuestaDetalle } from '../types/asesor';

/**
 * El detalle crudo de un evento. No interpreta el par (`entity_type`, `action`) ni resume
 * el `metadata`: muestra **todas** sus claves. Lo único que hace es resolver identificadores
 * a nombres (uuid de la propuesta → cliente; código del instrumento → nombre).
 */

const CLAVES: Record<string, string> = {
  rules_version: 'Versión de reglas',
  comments: 'Comentario del asesor',
  puntaje: 'Puntaje del cuestionario',
  monto: 'Monto declarado',
  decision: 'Decisión',
  edited_allocation: 'Asignación guardada',
};

const OCULTAS = ['review_id'];

function valorLegible(clave: string, valor: unknown): string {
  if (clave === 'monto' && typeof valor === 'number') return usd(valor);
  if (typeof valor === 'string' || typeof valor === 'number') return String(valor);
  if (typeof valor === 'boolean') return valor ? 'Sí' : 'No';
  return JSON.stringify(valor);
}

function esAsignacion(
  valor: unknown,
): valor is { instrumento_code: string; porcentaje: number }[] {
  return (
    Array.isArray(valor) &&
    valor.length > 0 &&
    valor.every(
      (linea) =>
        typeof linea === 'object' &&
        linea !== null &&
        'instrumento_code' in linea &&
        'porcentaje' in linea,
    )
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View className="gap-0.5 border-t border-surface-border pt-3">
      <Text className="text-caption uppercase text-text-muted">{etiqueta}</Text>
      <Text className="text-body text-text-primary">{valor}</Text>
    </View>
  );
}

export default function EventoAuditoriaModal({
  evento,
  etiqueta,
  esPropuesta,
  onCerrar,
  onVerPropuesta,
}: {
  evento: EventoAuditoria | null;
  etiqueta: string;
  esPropuesta: boolean;
  onCerrar: () => void;
  onVerPropuesta?: () => void;
}) {
  const [propuesta, setPropuesta] = useState<PropuestaDetalle | null>(null);

  const entityId = evento?.entity_id;

  useEffect(() => {
    setPropuesta(null);
    if (!entityId || !esPropuesta) return;

    let vigente = true;
    getPropuesta(entityId)
      .then((detalle) => {
        if (vigente) setPropuesta(detalle);
      })
      .catch(() => undefined);

    return () => {
      vigente = false;
    };
  }, [entityId, esPropuesta]);

  const metadata = Object.entries(evento?.metadata ?? {}).filter(
    ([clave, valor]) => !OCULTAS.includes(clave) && valor !== null && valor !== undefined,
  );

  const nombreDe = (code: string) =>
    propuesta?.allocations.find((l) => l.instrumento_code === code)?.nombre ?? code;

  if (!evento) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/40" onClick={onCerrar}>
      <div
        className="mt-auto flex max-h-[85dvh] w-full max-w-[480px] flex-col rounded-t-3xl bg-surface-background"
        onClick={(e) => e.stopPropagation()}
      >
        <View className="flex-row items-start gap-3 border-b border-surface-border px-5 py-4">
          <View className="flex-1 gap-1">
            <Text className="text-heading font-bold text-text-primary">{etiqueta}</Text>
            <Text className="text-caption text-text-secondary">
              {fechaHoraLarga(evento.created_at)}
            </Text>
          </View>
          <Touchable onPress={onCerrar} accessibilityLabel="Cerrar el detalle">
            <Ionicons name="close" size={24} color="#6B7280" />
          </Touchable>
        </View>

        <ScrollView contentContainerClassName="gap-3 px-5 py-5">
          <Fila
            etiqueta="Responsable"
            valor={
              evento.actor_nombre
                ? `${evento.actor_nombre}${evento.actor_rol ? ` · ${evento.actor_rol}` : ''}`
                : 'Sin responsable registrado'
            }
          />

          {/* Entidad: el cliente cuya propuesta se auditó, no su uuid. */}
          <View className="gap-0.5 border-t border-surface-border pt-3">
            <Text className="text-caption uppercase text-text-muted">Entidad</Text>
            {esPropuesta && !propuesta ? (
              <View className="flex-row items-center gap-2 py-0.5">
                <ActivityIndicator size="small" color="#6B7280" />
                <Text className="text-body text-text-muted">Resolviendo la propuesta…</Text>
              </View>
            ) : (
              <Text className="text-body text-text-primary">
                {propuesta
                  ? `Propuesta de ${propuesta.investor_nombre}${
                      propuesta.monto_total != null ? ` · ${usd(propuesta.monto_total)}` : ''
                    }`
                  : evento.entity_id}
              </Text>
            )}
          </View>

          <Fila etiqueta="Acción registrada" valor={`${evento.entity_type} / ${evento.action}`} />
          <Fila etiqueta="Plataforma" valor={evento.platform} />

          {metadata.length > 0 ? (
            <View className="gap-3 pt-2">
              <Text className="text-caption font-bold uppercase text-text-secondary">
                Metadata registrada
              </Text>

              {metadata.map(([clave, valor]) =>
                esAsignacion(valor) ? (
                  <View key={clave} className="gap-2 border-t border-surface-border pt-3">
                    <Text className="text-caption uppercase text-text-muted">
                      {CLAVES[clave] ?? clave}
                    </Text>
                    {valor.map((linea) => (
                      <View
                        key={linea.instrumento_code}
                        className="flex-row items-center justify-between gap-3 rounded-xl bg-surface-canvas px-3 py-2"
                      >
                        <Text className="flex-1 text-body text-text-primary" numberOfLines={2}>
                          {nombreDe(linea.instrumento_code)}
                        </Text>
                        <Text className="text-body font-bold text-text-primary">
                          {porcentaje(linea.porcentaje)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : (
                  <Fila
                    key={clave}
                    etiqueta={CLAVES[clave] ?? clave}
                    valor={valorLegible(clave, valor)}
                  />
                ),
              )}
            </View>
          ) : (
            <Text className="pt-2 text-caption text-text-muted">
              Este evento se registró sin metadata.
            </Text>
          )}

          {onVerPropuesta ? (
            <Touchable
              onPress={onVerPropuesta}
              className="mt-2 flex-row items-center justify-between rounded-2xl bg-surface-canvas px-4 py-3"
            >
              <Text className="text-body font-bold text-brand-primary">
                Ver la propuesta auditada
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#14375E" />
            </Touchable>
          ) : null}

          <View className="h-6" />
        </ScrollView>
      </div>
    </div>
  );
}
