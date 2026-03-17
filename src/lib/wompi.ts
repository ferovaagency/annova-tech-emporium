export const WOMPI_PUBLIC_KEY = "pub_prod_eAdkqUXV8IfZ08V8ZnIn1nU5EkIQO0gC";
export const WOMPI_INTEGRITY_SECRET = "prod_integrity_ZGEMtqwAPJ3LUmRrVdqLFDKBmh9weDTj";
export const WOMPI_REDIRECT_URL = "https://annova-tech-emporium.lovable.app/pago-resultado";

export async function generateWompiSignature(
  reference: string,
  amountInCents: number,
  currency: string = "COP"
): Promise<string> {
  const data = `${reference}${amountInCents}${currency}${WOMPI_INTEGRITY_SECRET}`;
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export function generateOrderReference(): string {
  return `ANNOVA-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

export async function buildWompiCheckoutUrl(params: {
  reference: string;
  amountInCents: number;
  currency?: string;
  customerEmail: string;
  customerFullName: string;
  customerPhoneNumber: string;
}): Promise<string> {
  const { reference, amountInCents, currency = "COP", customerEmail, customerFullName, customerPhoneNumber } = params;
  const signature = await generateWompiSignature(reference, amountInCents, currency);
  const url = new URL("https://checkout.wompi.co/p/");
  url.searchParams.set("public-key", WOMPI_PUBLIC_KEY);
  url.searchParams.set("currency", currency);
  url.searchParams.set("amount-in-cents", amountInCents.toString());
  url.searchParams.set("reference", reference);
  url.searchParams.set("signature:integrity", signature);
  url.searchParams.set("redirect-url", WOMPI_REDIRECT_URL);
  url.searchParams.set("customer-data:email", customerEmail);
  url.searchParams.set("customer-data:full-name", customerFullName);
  url.searchParams.set("customer-data:phone-number", customerPhoneNumber.replace(/\D/g, ""));
  url.searchParams.set("customer-data:phone-number-prefix", "+57");
  return url.toString();
}

export async function getTransactionByReference(reference: string) {
  try {
    const res = await fetch(`https://production.wompi.co/v1/transactions?reference=${reference}`, {
      headers: { Authorization: `Bearer ${WOMPI_PUBLIC_KEY}` },
    });
    const data = await res.json();
    return data?.data?.[0] || null;
  } catch { return null; }
}
