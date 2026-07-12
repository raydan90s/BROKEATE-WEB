import { useState } from 'react';

import { Ionicons } from '@/components/Icono';
import { Text, TextInput, Touchable, View } from '@/components/rn';
import { useColores } from '@/context/ThemeContext';

type TipoTeclado = 'default' | 'email-address' | 'numeric' | 'number-pad' | 'decimal-pad';

interface CampoTextoProps {
  etiqueta: string;
  icono: string;
  value: string;
  onChangeText: (texto: string) => void;
  placeholder?: string;
  keyboardType?: TipoTeclado;
  editable?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  /** Marca el borde en rojo. El texto del error lo pinta la pantalla, no el campo:
   *  un mismo mensaje suele aplicar a varios campos a la vez. */
  conError?: boolean;
  /** Añade el ojito para mostrar/ocultar. Implica campo de contraseña. */
  esPassword?: boolean;
  /** Nota bajo el campo (p. ej. "mínimo 8 caracteres"). Se oculta si hay error. */
  ayuda?: string;
}

/**
 * El campo de texto de las pantallas de auth (gemelo web del de RoboAdvisorApp).
 *
 * Existe porque el login, el código y el reseteo pintan el MISMO campo con el mismo borde
 * que se tiñe al enfocar: varias copias del mismo markup se desincronizan al primer
 * cambio de diseño.
 */
export default function CampoTexto({
  etiqueta,
  icono,
  value,
  onChangeText,
  placeholder,
  keyboardType = 'default',
  editable = true,
  autoFocus = false,
  onSubmitEditing,
  conError = false,
  esPassword = false,
  ayuda,
}: CampoTextoProps) {
  const colores = useColores();
  const [enfocado, setEnfocado] = useState(false);
  const [verTexto, setVerTexto] = useState(false);

  const borde = conError
    ? 'border-state-error'
    : enfocado
      ? 'border-brand-primary bg-surface-background'
      : 'border-surface-border bg-surface-elevated';

  return (
    <View className="gap-2">
      <Text className="text-caption font-bold uppercase text-text-secondary">{etiqueta}</Text>

      <View className={`flex-row items-center gap-3 rounded-2xl border px-4 ${borde}`}>
        <Ionicons
          name={icono}
          size={20}
          color={enfocado ? colores.primario : colores.textoMuted}
        />
        <View className="flex-1">
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            keyboardType={keyboardType}
            secureTextEntry={esPassword && !verTexto}
            editable={editable}
            autoFocus={autoFocus}
            onSubmitEditing={onSubmitEditing}
            onFocus={() => setEnfocado(true)}
            onBlur={() => setEnfocado(false)}
            className="w-full bg-transparent py-4 text-body-md text-text-primary"
          />
        </View>
        {esPassword ? (
          <Touchable
            onPress={() => setVerTexto((v) => !v)}
            accessibilityLabel={verTexto ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Ionicons
              name={verTexto ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={colores.textoSecundario}
            />
          </Touchable>
        ) : null}
      </View>

      {ayuda && !conError ? (
        <Text className="text-caption text-text-muted">{ayuda}</Text>
      ) : null}
    </View>
  );
}
