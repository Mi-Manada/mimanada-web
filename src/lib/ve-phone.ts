/** Celulares VE: 412/422/414/424/416/426 + 7 dígitos */
const VE_MOBILE_RE = /^(412|422|414|424|416|426)\d{7}$/;

export function toLocalVePhone(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("58")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function isValidVeMobile(localOrFull: string) {
  return VE_MOBILE_RE.test(toLocalVePhone(localOrFull));
}

export function veMobileErrorMessage() {
  return "El celular debe iniciar con 412, 422, 414, 424, 416 o 426 y tener 7 dígitos más.";
}

export function focusFormField(id: string) {
  if (typeof document === "undefined") return;
  window.requestAnimationFrame(() => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable = el.querySelector<HTMLElement>(
      "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])",
    );
    focusable?.focus({ preventScroll: true });
  });
}
