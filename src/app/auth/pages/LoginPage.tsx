import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Ionicons } from '@/components/Icono';
import { ActivityIndicator, ScrollView, Text, TextInput, Touchable, View } from '@/components/rn';
import { useAuth } from '@/context/AuthContext';
import { ApiError } from '@/services/http';

import { login } from '../services/authApi';

// El logo vive en public/, así que se referencia por su ruta pública (no se importa).
const logo = '/logo.png';

type Campo = 'email' | 'password';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [enfocado, setEnfocado] = useState<Campo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const puedeEnviar = email.trim().length > 0 && password.length > 0 && !enviando;

  async function onSubmit() {
    if (!puedeEnviar) return;
    setEnviando(true);
    setError(null);
    try {
      // El rol viene en la respuesta. En React Native el árbol se remontaba solo al
      // cambiar la sesión; en web las rutas son URLs y nadie nos saca de /login, así que
      // navegamos explícitamente a la casa de cada rol (o de vuelta a donde iba el asesor
      // / inversionista antes de que el guard lo mandara a login).
      const sesion = await login({ email: email.trim(), password });
      await signIn(sesion);
      const desde = (location.state as { desde?: string } | null)?.desde;
      const casa = sesion.role === 'advisor' ? '/asesor/cola' : '/';
      navigate(desde && desde !== '/login' ? desde : casa, { replace: true });
    } catch (e) {
      setError(
        e instanceof ApiError ? e.message : 'No se pudo iniciar sesión. Intenta de nuevo.',
      );
      setEnviando(false);
    }
  }

  // El borde del campo enfocado se tiñe de marca; si hubo error, los dos campos
  // quedan en rojo porque el backend no dice cuál de los dos falló.
  function claseCampo(campo: Campo) {
    const borde = error
      ? 'border-state-error'
      : enfocado === campo
        ? 'border-brand-primary bg-surface-background'
        : 'border-surface-border bg-surface-elevated';
    return `flex-row items-center gap-3 rounded-2xl border px-4 ${borde}`;
  }

  return (
    <ScrollView
      className="bg-surface-background"
      contentContainerClassName="grow justify-center px-6 py-8 gap-6"
    >
      {/* La columna de lectura por defecto es ancha (768px); un formulario de login se ve
          mejor angosto, así que el logo y el formulario se centran en ~28rem. */}
      <View className="mx-auto w-full max-w-md items-center">
        <img src={logo} alt="Brokeate" className="h-56 w-56 object-contain" />
      </View>

      <View className="mx-auto w-full max-w-md gap-5">
        <View className="gap-1">
          <Text className="text-display font-bold text-text-primary">Inicia sesión</Text>
          <Text className="text-body text-text-secondary">
            Entra para ver tu propuesta de inversión, o para revisar la cola de propuestas
            si eres asesor.
          </Text>
        </View>

        <View className="gap-4">
          <View className="gap-2">
            <Text className="text-caption font-bold uppercase text-text-secondary">
              Correo
            </Text>
            <View className={claseCampo('email')}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={enfocado === 'email' ? '#1E3A8A' : '#A1A1AA'}
              />
              <View className="flex-1">
                <TextInput
                  value={email}
                  onChangeText={(v) => {
                    setEmail(v);
                    if (error) setError(null);
                  }}
                  placeholder="tu@correo.ec"
                  keyboardType="email-address"
                  editable={!enviando}
                  onFocus={() => setEnfocado('email')}
                  onBlur={() => setEnfocado(null)}
                  className="w-full bg-transparent py-4 text-body-md text-text-primary"
                />
              </View>
            </View>
          </View>

          <View className="gap-2">
            <Text className="text-caption font-bold uppercase text-text-secondary">
              Contraseña
            </Text>
            <View className={claseCampo('password')}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={enfocado === 'password' ? '#1E3A8A' : '#A1A1AA'}
              />
              <View className="flex-1">
                <TextInput
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (error) setError(null);
                  }}
                  placeholder="••••••••"
                  secureTextEntry={!verPassword}
                  editable={!enviando}
                  onFocus={() => setEnfocado('password')}
                  onBlur={() => setEnfocado(null)}
                  onSubmitEditing={onSubmit}
                  className="w-full bg-transparent py-4 text-body-md text-text-primary"
                />
              </View>
              <Touchable
                onPress={() => setVerPassword((v) => !v)}
                accessibilityLabel={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                <Ionicons
                  name={verPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#71717A"
                />
              </Touchable>
            </View>
          </View>
        </View>

        {error ? (
          <View className="flex-row items-center gap-2 rounded-2xl bg-stateAlpha-errorSoft px-4 py-3">
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text className="flex-1 text-body text-state-error">{error}</Text>
          </View>
        ) : null}

        <Touchable
          onPress={onSubmit}
          disabled={!puedeEnviar}
          className={`h-14 flex-row items-center justify-center gap-2 rounded-2xl ${
            puedeEnviar ? 'bg-brand-primary' : 'bg-surface-secondary'
          }`}
        >
          {enviando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text
                className={`text-body-md font-bold ${
                  puedeEnviar ? 'text-text-onPrimary' : 'text-text-muted'
                }`}
              >
                Iniciar sesión
              </Text>
              <Ionicons
                name="arrow-forward"
                size={18}
                color={puedeEnviar ? '#FFFFFF' : '#A1A1AA'}
              />
            </>
          )}
        </Touchable>
      </View>

      <Text className="text-center text-caption text-text-muted">
        Brokeate no ejecuta órdenes ni maneja tu dinero. Las propuestas son referenciales y
        las revisa un asesor.
      </Text>
    </ScrollView>
  );
}
