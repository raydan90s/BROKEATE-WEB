import http from '@/services/http';

import type {
  LoginPayload,
  MensajeResponse,
  RegisterPayload,
  ResetPasswordPayload,
  TokenResponse,
  VerificarCorreoPayload,
} from '../types/auth';

export function login(payload: LoginPayload): Promise<TokenResponse> {
  return http.post<TokenResponse>('/api/auth/login', payload);
}

/** Self-signup: el backend fuerza role='investor', no viaja en el body. */
export function register(payload: RegisterPayload): Promise<TokenResponse> {
  return http.post<TokenResponse>('/api/auth/register', payload);
}

/** Canjea el código de 6 dígitos por el token: acá empieza la sesión. */
export function verificarCorreo(payload: VerificarCorreoPayload): Promise<TokenResponse> {
  return http.post<TokenResponse>('/api/auth/verify-email', payload);
}

/** Reenvía el código de verificación. */
export function reenviarCodigo(email: string): Promise<MensajeResponse> {
  return http.post<MensajeResponse>('/api/auth/resend-code', { email });
}

/**
 * Pide el código para cambiar la contraseña.
 *
 * Contesta lo mismo exista o no la cuenta: el front NO debe interpretar la respuesta
 * como "ese correo está registrado", porque el backend se cuida de no decirlo.
 */
export function olvideContrasena(email: string): Promise<MensajeResponse> {
  return http.post<MensajeResponse>('/api/auth/forgot-password', { email });
}

/** Cambia la contraseña con el código del correo y deja al usuario logueado. */
export function restablecerContrasena(
  payload: ResetPasswordPayload,
): Promise<TokenResponse> {
  return http.post<TokenResponse>('/api/auth/reset-password', payload);
}
