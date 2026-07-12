import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { Ionicons } from '@/components/Icono';
import { ActivityIndicator, Text, Touchable, View } from '@/components/rn';
import { useAuth } from '@/context/AuthContext';
import { useColores } from '@/context/ThemeContext';
import { ApiError } from '@/services/http';

import Aviso from '../components/Aviso';
import CampoCodigo, { LARGO_CODIGO } from '../components/CampoCodigo';
import PantallaAuth from '../components/PantallaAuth';
import { useReenvio } from '../hooks/useReenvio';
import { reenviarCodigo, verificarCorreo } from '../services/authApi';

/**
 * El canje: 6 dígitos por una sesión.
 *
 * Se llega acá desde un login con 403 (la cuenta existe pero su correo nunca se probó —
 * en ese caso el backend ya reenvió el código antes de rebotar). En web no hay remonte
 * automático como en React Native: tras `signIn` navegamos a la casa del rol. Si se llega
 * sin correo (recarga directa de la URL), se vuelve al login.
 */
export default function VerificarCorreoPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const colores = useColores();

  const email = (location.state as { email?: string } | null)?.email ?? '';

  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [verificando, setVerificando] = useState(false);

  // Se llega acá con un código recién enviado (por el login que rebotó), así que el
  // cooldown arranca corriendo: reenviar de inmediato mataría el que va en camino.
  const envio = useReenvio(() => reenviarCodigo(email));
  const iniciarEspera = envio.iniciarEspera;
  useEffect(() => {
    iniciarEspera();
  }, [iniciarEspera]);

  // Sin correo no hay código que verificar: de vuelta al login.
  if (!email) return <Navigate to="/login" replace />;

  const completo = codigo.length === LARGO_CODIGO;

  async function onVerificar(valor: string = codigo) {
    if (valor.length !== LARGO_CODIGO || verificando) return;
    setVerificando(true);
    setError(null);
    envio.limpiarAviso();
    try {
      const sesion = await verificarCorreo({ email, codigo: valor });
      await signIn(sesion);
      navigate(sesion.role === 'advisor' ? '/asesor/cola' : '/', { replace: true });
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'No se pudo verificar el código. Intenta de nuevo.',
      );
      // El código quemado ya no sirve: se limpia para que el usuario no reintente el mismo.
      setCodigo('');
      setVerificando(false);
    }
  }

  return (
    <PantallaAuth
      atras
      titulo="Verifica tu correo"
      bajada={`Escribe el código de 6 dígitos que enviamos a ${email}. Vence en 15 minutos.`}
    >
      <CampoCodigo
        valor={codigo}
        onCambiar={(v) => {
          setCodigo(v);
          if (error) setError(null);
        }}
        // Al sexto dígito verifica solo: buscar el botón después de tipear el código es
        // un paso que nadie quiere dar.
        onCompleto={onVerificar}
        conError={!!error}
        editable={!verificando}
      />

      {error ? <Aviso texto={error} /> : null}
      {envio.error ? <Aviso texto={envio.error} /> : null}
      {envio.aviso && !error ? <Aviso texto={envio.aviso} tipo="info" /> : null}

      <Touchable
        onPress={() => onVerificar()}
        disabled={!completo || verificando}
        className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl ${
          completo && !verificando ? 'bg-brand-primary' : 'bg-surface-secondary'
        }`}
      >
        {verificando ? (
          <ActivityIndicator color={colores.textoSobrePrimario} />
        ) : (
          <>
            <Text
              className={`text-body-md font-bold ${
                completo ? 'text-text-onPrimary' : 'text-text-muted'
              }`}
            >
              Verificar y entrar
            </Text>
            <Ionicons
              name="checkmark"
              size={18}
              color={completo ? colores.textoSobrePrimario : colores.textoMuted}
            />
          </>
        )}
      </Touchable>

      <View className="items-center gap-1">
        <Text className="text-body text-text-secondary">¿No te llegó? Revisa el spam.</Text>
        <Touchable
          onPress={envio.reenviar}
          disabled={envio.restante > 0 || envio.enviando || verificando}
        >
          <Text
            className={`text-body font-bold ${
              envio.restante > 0 ? 'text-text-muted' : 'text-brand-mid'
            }`}
          >
            {envio.enviando
              ? 'Enviando…'
              : envio.restante > 0
                ? `Reenviar código en ${envio.restante}s`
                : 'Reenviar código'}
          </Text>
        </Touchable>
      </View>
    </PantallaAuth>
  );
}
