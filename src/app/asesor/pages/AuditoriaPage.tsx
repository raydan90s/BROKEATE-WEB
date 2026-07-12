import { useCallback, useMemo, useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { ScrollView, Text, TextInput, Touchable, View } from '@/components/rn';
import { useFocusEffect, useNavigation } from '@/routes/navegacion';

import { Cargando, ErrorEstado, Vacio } from '@/components/shared/Estados';
import { ApiError } from '@/services/http';
import { fechaHora } from '@/utils/formato';

import EventoAuditoriaModal from '../components/EventoAuditoriaModal';
import { getAuditoria } from '../services/advisorApi';
import type { EventoAuditoria } from '../types/asesor';

/**
 * `audit_log` guarda el par (`entity_type`, `action`). Si aparece un par que no está acá,
 * se muestra el código crudo: prefiere un `foo/bar` feo antes que una etiqueta inventada.
 */
const EVENTOS: Record<string, { etiqueta: string; chip: string; color: string }> = {
  'proposal/created': { etiqueta: 'Propuesta generada', chip: 'Generadas', color: 'bg-brand-mid' },
  'proposal/approved': { etiqueta: 'Propuesta aprobada', chip: 'Aprobadas', color: 'bg-brand-accent' },
  'proposal/edited': { etiqueta: 'Asignación editada por el asesor', chip: 'Editadas', color: 'bg-brand-primary' },
  'proposal/rejected': { etiqueta: 'Propuesta rechazada', chip: 'Rechazadas', color: 'bg-state-error' },
  'advisor_review/approved': { etiqueta: 'Propuesta aprobada', chip: 'Aprobadas', color: 'bg-brand-accent' },
  'advisor_review/edited': { etiqueta: 'Asignación editada por el asesor', chip: 'Editadas', color: 'bg-brand-primary' },
  'advisor_review/rejected': { etiqueta: 'Propuesta rechazada', chip: 'Rechazadas', color: 'bg-state-error' },
};

/** Las acciones que esta pantalla lista: **las que ya se decidieron.** */
const DECIDIDAS = ['approved', 'edited', 'rejected'];

/** Las dos entidades cuyo `entity_id` es un `proposal_id`. */
const ENTIDADES_PROPUESTA = ['proposal', 'advisor_review'];

const clave = (e: EventoAuditoria) => `${e.entity_type}/${e.action}`;
const etiquetaDe = (e: EventoAuditoria) => EVENTOS[clave(e)]?.etiqueta ?? clave(e);
const chipDe = (e: EventoAuditoria) => EVENTOS[clave(e)]?.chip ?? clave(e);

function textoBuscable(e: EventoAuditoria): string {
  return [
    etiquetaDe(e),
    e.actor_nombre,
    e.actor_rol,
    e.entity_type,
    e.entity_id,
    e.action,
    e.platform,
    e.metadata ? JSON.stringify(e.metadata) : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/**
 * HU3, criterio 3: **fecha, versión de reglas y responsable de cada decisión.**
 *
 * Es `v_audit_timeline` restringido a las decisiones. Los filtros son de vista, no de
 * consulta: el contador dice siempre cuántas de cuántas se ven.
 */
export default function AuditoriaPage() {
  const navigation = useNavigation();

  const [eventos, setEventos] = useState<EventoAuditoria[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [filtro, setFiltro] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState<EventoAuditoria | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    try {
      setEventos(await getAuditoria());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cargar la auditoría.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargar();
    }, [cargar]),
  );

  const decisiones = useMemo(
    () => (eventos ?? []).filter((e) => DECIDIDAS.includes(e.action)),
    [eventos],
  );

  const chips = useMemo(() => {
    const vistos = new Map<string, number>();
    for (const evento of decisiones) {
      const texto = chipDe(evento);
      vistos.set(texto, (vistos.get(texto) ?? 0) + 1);
    }
    return [...vistos.entries()].map(([texto, total]) => ({ texto, total }));
  }, [decisiones]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return decisiones.filter(
      (e) =>
        (filtro === null || chipDe(e) === filtro) &&
        (texto === '' || textoBuscable(e).includes(texto)),
    );
  }, [decisiones, filtro, busqueda]);

  const filtrando = filtro !== null || busqueda.trim() !== '';

  return (
    <View className="flex-1 bg-surface-background">
      <View className="gap-3 border-b border-surface-border px-5 pb-4 pt-4">
        <View className="gap-1">
          <Text className="text-heading font-bold text-text-primary">Auditoría</Text>
          <Text className="text-caption text-text-secondary">
            Cada decisión ya tomada, con su fecha, su responsable y la versión de reglas
            vigente. Las propuestas que todavía esperan revisión están en la Cola.
          </Text>
        </View>

        {decisiones.length > 0 ? (
          <>
            <View className="flex-row items-center gap-2 rounded-2xl bg-surface-canvas px-4 py-2.5">
              <Ionicons name="search" size={16} color="#6B7280" />
              <View className="flex-1">
                <TextInput
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder="Buscar por responsable, entidad o versión"
                  className="w-full bg-transparent text-body text-text-primary"
                />
              </View>
              {busqueda !== '' ? (
                <Touchable onPress={() => setBusqueda('')} accessibilityLabel="Limpiar la búsqueda">
                  <Ionicons name="close-circle" size={16} color="#6B7280" />
                </Touchable>
              ) : null}
            </View>

            <ScrollView horizontal contentContainerClassName="gap-2 pr-5">
              <Touchable
                onPress={() => setFiltro(null)}
                className={`rounded-full border px-3.5 py-1.5 ${
                  filtro === null
                    ? 'border-brand-primary bg-brand-primary'
                    : 'border-surface-border bg-surface-background'
                }`}
              >
                <Text
                  className={`text-caption font-bold ${
                    filtro === null ? 'text-text-onPrimary' : 'text-text-secondary'
                  }`}
                >
                  Todas · {decisiones.length}
                </Text>
              </Touchable>

              {chips.map((chip) => {
                const activo = filtro === chip.texto;
                return (
                  <Touchable
                    key={chip.texto}
                    onPress={() => setFiltro(activo ? null : chip.texto)}
                    className={`rounded-full border px-3.5 py-1.5 ${
                      activo
                        ? 'border-brand-primary bg-brand-primary'
                        : 'border-surface-border bg-surface-background'
                    }`}
                  >
                    <Text
                      className={`text-caption font-bold ${
                        activo ? 'text-text-onPrimary' : 'text-text-secondary'
                      }`}
                    >
                      {chip.texto} · {chip.total}
                    </Text>
                  </Touchable>
                );
              })}
            </ScrollView>
          </>
        ) : null}
      </View>

      {error ? (
        <ErrorEstado mensaje={error} onReintentar={cargar} />
      ) : !eventos ? (
        <Cargando mensaje="Cargando la auditoría…" />
      ) : decisiones.length === 0 ? (
        <Vacio titulo="Todavía no se ha decidido ninguna propuesta" />
      ) : (
        <ScrollView className="bg-surface-canvas" contentContainerClassName="px-5 py-5 gap-3">
          <Text className="text-caption text-text-muted">
            {filtrando
              ? `${filtrados.length} de ${decisiones.length} decisiones`
              : `${decisiones.length} decisiones · de la más reciente a la más antigua`}
          </Text>

          {filtrados.length === 0 ? (
            <View className="items-center gap-2 rounded-2xl border border-surface-border bg-surface-background p-8">
              <Text className="text-body-md font-bold text-text-primary">
                Ninguna decisión coincide
              </Text>
              <Text className="text-center text-caption text-text-secondary">
                El filtro no cambia lo registrado: las {decisiones.length} decisiones siguen ahí.
              </Text>
              <Touchable
                onPress={() => {
                  setFiltro(null);
                  setBusqueda('');
                }}
                className="mt-1 rounded-2xl bg-brand-primary px-5 py-2.5"
              >
                <Text className="text-body font-bold text-text-onPrimary">Quitar los filtros</Text>
              </Touchable>
            </View>
          ) : (
            filtrados.map((evento) => {
              const k = clave(evento);
              const version = evento.metadata?.rules_version;

              return (
                <Touchable
                  key={evento.id}
                  onPress={() => setAbierto(evento)}
                  className="flex-row items-center gap-3 rounded-2xl border border-surface-border bg-surface-background p-5"
                >
                  <View
                    className={`mt-1.5 h-2.5 w-2.5 self-start rounded-full ${
                      EVENTOS[k]?.color ?? 'bg-surface-divider'
                    }`}
                  />

                  <View className="flex-1 gap-1">
                    <Text className="text-body font-bold text-text-primary">
                      {EVENTOS[k]?.etiqueta ?? k}
                    </Text>
                    <Text className="text-caption text-text-secondary">
                      {fechaHora(evento.created_at)}
                      {evento.actor_nombre ? ` · ${evento.actor_nombre}` : ''}
                      {evento.actor_rol ? ` (${evento.actor_rol})` : ''}
                    </Text>
                    <Text className="text-caption text-text-muted">
                      {evento.entity_type} · {evento.platform}
                      {typeof version === 'string' ? ` · reglas ${version}` : ''}
                    </Text>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
                </Touchable>
              );
            })
          )}

          <View className="h-4" />
        </ScrollView>
      )}

      <EventoAuditoriaModal
        evento={abierto}
        etiqueta={abierto ? etiquetaDe(abierto) : ''}
        esPropuesta={abierto !== null && ENTIDADES_PROPUESTA.includes(abierto.entity_type)}
        onCerrar={() => setAbierto(null)}
        onVerPropuesta={
          abierto && ENTIDADES_PROPUESTA.includes(abierto.entity_type)
            ? () => {
                const proposalId = abierto.entity_id;
                setAbierto(null);
                navigation.navigate('DetallePropuesta', { proposalId });
              }
            : undefined
        }
      />
    </View>
  );
}
