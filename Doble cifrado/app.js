// ===== Helpers de texto/Base64/bytes/hex =====
function textToUtf8Bytes(str) {
  return new TextEncoder().encode(str);
}
function utf8BytesToText(bytes) {
  return new TextDecoder().decode(bytes);
}
function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function fromBase64(b64) {
  return decodeURIComponent(escape(atob(b64)));
}
function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hexStr) {
  if (hexStr.length % 2 !== 0) throw new Error("Hex inválido");
  const bytes = new Uint8Array(hexStr.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hexStr.substr(i * 2, 2), 16);
  }
  return bytes;
}

// ===== PBKDF2 -> AES-GCM key derivation =====
async function deriveAesKeyFromPassword(password, saltBytes) {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: saltBytes, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// ===== AES-GCM encrypt/decrypt =====
async function aesEncrypt(plaintextBytes, password) {
  // Salt fijo para demo (guárdalo/júntalo con el mensaje en sistemas reales)
  const salt = textToUtf8Bytes("UPIICSA-SALT");
  const key = await deriveAesKeyFromPassword(password, salt);

  // IV aleatorio de 12 bytes recomendado en GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintextBytes
  );
  return { cipherBytes: new Uint8Array(cipherBuffer), iv };
}

async function aesDecrypt(cipherBytes, ivBytes, password) {
  const salt = textToUtf8Bytes("UPIICSA-SALT");
  const key = await deriveAesKeyFromPassword(password, salt);
  const plainBuffer = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    cipherBytes
  );
  return new Uint8Array(plainBuffer);
}

// ====== Referencias UI ======
const plainText  = document.getElementById("plainText");
const passwordEl = document.getElementById("password");

const base64Box = document.getElementById("base64Box");
const aesBox    = document.getElementById("aesBox");
const ivBox     = document.getElementById("ivBox");
const finalBox  = document.getElementById("finalBox");

const btnEncrypt  = document.getElementById("btnEncrypt");
const btnDecrypt  = document.getElementById("btnDecrypt");
const btnClearAll = document.getElementById("btnClearAll");

// Variables para ida y vuelta
let lastCipherHex = "";
let lastIvHex     = "";

// ===== Eventos =====
btnEncrypt.addEventListener("click", async () => {
  try {
    finalBox.textContent = "";

    // A) original -> Base64
    const original   = plainText.value;
    const base64Data = toBase64(original);
    base64Box.textContent = base64Data;

    // B) Base64 -> bytes -> AES-GCM
    const base64Bytes         = textToUtf8Bytes(base64Data);
    const { cipherBytes, iv } = await aesEncrypt(base64Bytes, passwordEl.value);

    // Guardamos para descifrar después
    lastCipherHex = bytesToHex(cipherBytes);
    lastIvHex     = bytesToHex(iv);

    aesBox.textContent = lastCipherHex;
    ivBox.textContent  = lastIvHex;
  } catch (err) {
    aesBox.textContent = "Error cifrando: " + err;
  }
});

btnDecrypt.addEventListener("click", async () => {
  try {
    const cipherBytes = hexToBytes(lastCipherHex);
    const ivBytes     = hexToBytes(lastIvHex);

    const recoveredBase64Bytes = await aesDecrypt(
      cipherBytes,
      ivBytes,
      passwordEl.value
    );
    const recoveredBase64Str = utf8BytesToText(recoveredBase64Bytes);
    const recoveredPlain     = fromBase64(recoveredBase64Str);

    finalBox.textContent = recoveredPlain;
  } catch (err) {
    finalBox.textContent = "Error descifrando: " + err;
  }
});

btnClearAll.addEventListener("click", () => {
  base64Box.textContent = "";
  aesBox.textContent    = "";
  ivBox.textContent     = "";
  finalBox.textContent  = "";
  lastCipherHex         = "";
  lastIvHex             = "";
});
