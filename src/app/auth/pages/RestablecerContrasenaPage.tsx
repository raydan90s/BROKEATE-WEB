import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

import { Ionicons } from '@/components/Icono';
import { ActivityIndicator, Text, Touchable, View } from '@/components/rn';
import { useAuth } from '@/context/AuthContext';
import { useColores } from '@/context/ThemeContext';
import { ApiError } from '@/services/http';

import Aviso from '../components/Aviso';
import CampoCodigo, { LARGO_CODIGO } from '../components/CampoCodigo';
import CampoTexto from '../components/CampoTexto';
import PantallaAuth from '../components/PantallaAuth';
import { useReenvio } from '../hooks/useReenvio';
import { olvideContrasena, restablecerContrasena } from '../services/authApi';

const MIN_PASSWORD = 8;

/**
 * Paso 2 de la recuperación: el código del correo + la contraseña nueva.
 *
 * No se pide la contraseña anterior: quien la olvidó no la tiene. Lo que autoriza el
 * cambio es haber leído el buzón — el mismo hecho con el que nació la cuenta.
 *
 * El backend devuelve el token: cambiar la contraseña deja al usuario adentro. En web no
 * hay remonte automático del árbol como en React Native, así que tras `signIn` navegamos
 * a la casa del rol. Si se llega sin correo (recarga directa de la URL), se vuelve al paso 1.
 */
export default function RestablecerContrasenaPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const colores = useColores();

  const email = (location.state as { email?: string } | null)?.email ?? '';

  const [codigo, setCodigo] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Se llega acá con un código recién enviado, así que el cooldown arranca corriendo:
  // reenviar de inmediato invalidaría el que va en camino (cada envío mata al anterior).
  const envio = useReenvio(() => olvideContrasena(email));
  const iniciarEspera = envio.iniciarEspera;
  useEffect(() => {
    iniciarEspera();
  }, [iniciarEspera]);

  // Sin correo no hay nada que hacer acá: el código va atado a un buzón concreto.
  if (!email) return <Navigate to="/olvide-contrasena" replace />;

  const puedeEnviar =
    codigo.length === LARGO_CODIGO &&
    password.length >= MIN_PASSWORD &&
    password === confirmacion &&
    !enviando;

  function validar(): string | null {
    if (codigo.length !== LARGO_CODIGO) return 'Escribe el código de 6 dígitos.';
    if (password.length < MIN_PASSWORD)
      return `La contraseña necesita al menos ${MIN_PASSWORD} caracteres.`;
    if (password !== confirmacion) return 'Las dos contraseñas no coinciden.';
    return null;
  }

  async function onSubmit() {
    const problema = validar();
    if (problema) {
      setError(problema);
      return;
    }

    setEnviando(true);
    setError(null);
    envio.limpiarAviso();
    try {
      const sesion = await restablecerContrasena({ email, codigo, password });
      await signIn(sesion);
      navigate(sesion.role === 'advisor' ? '/asesor/cola' : '/', { replace: true });
    } catch (e) {
      setError(
        e instanceof ApiError
          ? e.message
          : 'No se pudo cambiar la contraseña. Intenta de nuevo.',
      );
      setEnviando(false);
    }
  }

  return (
    <PantallaAuth
      atras
      titulo="Elige una contraseña nueva"
      bajada={`Escribe el código que enviamos a ${email} y tu contraseña nueva.`}
    >
      <View className="gap-4">
        <CampoCodigo
          valor={codigo}
          onCambiar={(v) => {
            setCodigo(v);
            if (error) setError(null);
          }}
          conError={!!error}
          editable={!enviando}
        />

        <CampoTexto
          etiqueta="Contraseña nueva"
          icono="lock-closed-outline"
          esPassword
          value={password}
          onChangeText={(v) => {
            setPassword(v);
            if (error) setError(null);
          }}
          placeholder="••••••••"
          editable={!enviando}
          conError={!!error}
          ayuda={`Mínimo ${MIN_PASSWORD} caracteres.`}
        />

        <CampoTexto
          etiqueta="Repite la contraseña"
          icono="lock-closed-outline"
          esPassword
          value={confirmacion}
          onChangeText={(v) => {
            setConfirmacion(v);
            if (error) setError(null);
          }}
          placeholder="••••••••"
          onSubmitEditing={onSubmit}
          editable={!enviando}
          conError={!!error}
        />
      </View>

      {error ? <Aviso texto={error} /> : null}
      {envio.error ? <Aviso texto={envio.error} /> : null}
      {envio.aviso && !error ? <Aviso texto={envio.aviso} tipo="info" /> : null}

      <Touchable
        onPress={onSubmit}
        disabled={!puedeEnviar}
        className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl ${
          puedeEnviar ? 'bg-brand-primary' : 'bg-surface-secondary'
        }`}
      >
        {enviando ? (
          <ActivityIndicator color={colores.textoSobrePrimario} />
        ) : (
          <>
            <Text
              className={`text-body-md font-bold ${
                puedeEnviar ? 'text-text-onPrimary' : 'text-text-muted'
              }`}
            >
              Cambiar contraseña y entrar
            </Text>
            <Ionicons
              name="checkmark"
              size={18}
              color={puedeEnviar ? colores.textoSobrePrimario : colores.textoMuted}
            />
          </>
        )}
      </Touchable>

      <View className="items-center gap-1">
        <Text className="text-body text-text-secondary">¿No te llegó? Revisa el spam.</Text>
        <Touchable
          onPress={envio.reenviar}
          disabled={envio.restante > 0 || envio.enviando || enviando}
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
