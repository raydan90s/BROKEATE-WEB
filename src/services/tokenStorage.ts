const TOKEN_KEY = 'user_token';

/**
 * En la app nativa esto elegía entre el keychain (expo-secure-store) y AsyncStorage.
 * En web solo existe `localStorage`, así que no hay nada que elegir.
 *
 * Las funciones siguen siendo `async` aunque `localStorage` sea síncrono: mantienen la
 * firma que ya esperan `AuthContext` y `http.ts`, y así ese código se copió sin tocarlo.
 *
 * Ojo con lo que esto implica y no implicaba en nativo: el token queda legible por
 * cualquier JS de este origen. Es lo que hay en una SPA — la mitigación real es que el
 * backend lo revalida y lo expira, no esconderlo del navegador.
 */
export async function getToken(): Promise<string | null> {
  return localStorage.getItem(TOKEN_KEY);
}

export async function saveToken(token: string): Promise<void> {
  localStorage.setItem(TOKEN_KEY, token);
}

export async function deleteToken(): Promise<void> {
  localStorage.removeItem(TOKEN_KEY);
}
