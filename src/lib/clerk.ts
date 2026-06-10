// Clerk env-gated. Sin VITE_CLERK_PUBLISHABLE_KEY la app sigue en modo local
// (sin login). Con la key se activa el login obligatorio con Clerk (Google + correo).
// La publishable key (pk_test_… / pk_live_…) es PÚBLICA por diseño: segura de
// embeber en el cliente. El secret key (sk_…) NUNCA va al frontend.
export const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as
  | string
  | undefined;

export const clerkEnabled = Boolean(clerkPublishableKey);
