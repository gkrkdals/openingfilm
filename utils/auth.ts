// For Edge-compatible token signing and verification (Web Crypto API)
// 이 파일은 Edge Runtime(미들웨어)과 Node.js 양쪽에서 실행될 수 있도록 Node.js 전용 내장 모듈(crypto 등)을 수입(import)하지 않습니다.
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-at-least-32-chars-long";

async function getCryptoKey(secret: string) {
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createToken(payload: Record<string, any>): Promise<string> {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const dataPayload = btoa(JSON.stringify(payload));
  const message = `${header}.${dataPayload}`;
  
  const key = await getCryptoKey(JWT_SECRET);
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  
  const signature = btoa(String.fromCharCode(...signatureArray))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, ""); // base64url encoding
    
  return `${message}.${signature}`;
}

export async function verifyToken(token: string): Promise<Record<string, any> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  
  const [header, payload, signature] = parts;
  const message = `${header}.${payload}`;
  
  try {
    const key = await getCryptoKey(JWT_SECRET);
    const encoder = new TextEncoder();
    
    // Reconstruct binary signature from base64url
    const base64 = signature.replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const paddedBase64 = pad ? base64 + "=".repeat(4 - pad) : base64;
    const binarySignStr = atob(paddedBase64);
    const signatureBytes = new Uint8Array(binarySignStr.length);
    for (let i = 0; i < binarySignStr.length; i++) {
      signatureBytes[i] = binarySignStr.charCodeAt(i);
    }
    
    const isValid = await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(message));
    if (!isValid) return null;
    
    // Decode payload
    const decodedPayloadStr = atob(payload);
    const parsedPayload = JSON.parse(decodedPayloadStr);
    
    // Check expiration
    if (parsedPayload.exp && Date.now() > parsedPayload.exp) {
      return null;
    }
    
    return parsedPayload;
  } catch (err) {
    console.error("Token verification error:", err);
    return null;
  }
}
