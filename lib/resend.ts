import { Resend } from "resend";

let _resend: Resend | null = null;

/** Lazily instantiated Resend client — avoids build-time errors when the
 *  API key isn't present during `next build`. */
export const resend = new Proxy({} as Resend, {
  get(_target, prop) {
    if (!_resend) {
      _resend = new Resend(process.env.RESEND_API_KEY ?? "re_placeholder");
    }
    return Reflect.get(_resend, prop, _resend);
  },
});

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "Elleva <noreply@elleva.app>";
