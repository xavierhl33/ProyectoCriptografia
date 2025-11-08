const inputText = document.getElementById("inputText");
const resultBox = document.getElementById("resultBox");
const btnEncode = document.getElementById("btnEncode");
const btnDecode = document.getElementById("btnDecode");
const btnClear  = document.getElementById("btnClear");

// Manejo UTF-8 básico seguro con btoa/atob
function toBase64(str) {
  return btoa(unescape(encodeURIComponent(str)));
}
function fromBase64(b64) {
  return decodeURIComponent(escape(atob(b64)));
}

btnEncode.addEventListener("click", () => {
  const original = inputText.value;
  try {
    const encoded = toBase64(original);
    resultBox.textContent = encoded;
  } catch (e) {
    resultBox.textContent = "Error al codificar: " + e;
  }
});

btnDecode.addEventListener("click", () => {
  const b64 = inputText.value;
  try {
    const decoded = fromBase64(b64);
    resultBox.textContent = decoded;
  } catch (e) {
    resultBox.textContent = "Error al decodificar: " + e;
  }
});

btnClear.addEventListener("click", () => {
  inputText.value = "";
  resultBox.textContent = "";
});
