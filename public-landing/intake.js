const API_URL = "https://app.corion.app/api/client/submit-request";
const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 50 * 1024 * 1024;

const form = document.querySelector("#agent-form");
const conversation = document.querySelector("#conversation");
const message = document.querySelector("#message");
const fileInput = document.querySelector("#files");
const fileList = document.querySelector("#file-list");
const status = document.querySelector("#status");
const quickActions = document.querySelector("#quick-actions");
const contactStep = document.querySelector("#contact-step");
const composer = document.querySelector("#composer");
const submitRequest = document.querySelector("#submit-request");

let state;

function resetConversation() {
  state = { stage: "problem", description: "", files: [], transcript: [] };
  conversation.replaceChildren();
  contactStep.hidden = true;
  composer.hidden = false;
  quickActions.hidden = false;
  quickActions.innerHTML = '<button type="button" data-action="photos">Fotos hinzufügen</button><button type="button" data-action="describe">Schaden beschreiben</button>';
  message.value = "";
  fileInput.value = "";
  fileList.textContent = "";
  status.textContent = "";
  status.className = "status";
  addMessage("assistant", "Hallo, ich bin der digitale Empfang von Corion. Beschreiben Sie kurz den Schaden – oder senden Sie direkt Fotos vom Handy.");
}

function addMessage(role, text) {
  state.transcript.push({ role, content: text });
  const bubble = document.createElement("p");
  bubble.className = `bubble ${role}`;
  bubble.textContent = text;
  conversation.append(bubble);
  conversation.scrollTop = conversation.scrollHeight;
}

function validateFiles(files) {
  if (files.length > MAX_FILES) return `Maximal ${MAX_FILES} Dateien erlaubt.`;
  if (files.some((file) => file.size > MAX_FILE_SIZE)) return "Eine Datei ist größer als 10 MB.";
  if (files.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_SIZE) return "Die Dateien sind zusammen größer als 50 MB.";
  return null;
}

function updateFiles(files) {
  const error = validateFiles(files);
  if (error) {
    fileList.textContent = error;
    fileList.className = "file-list error";
    return false;
  }
  state.files = files;
  fileList.className = "file-list";
  fileList.textContent = files.length ? `${files.length} Datei(en) bereit zum Senden: ${files.map((file) => file.name).join(", ")}` : "";
  if (files.length) {
    addMessage("user", `${files.length} Foto/Datei(en) hinzugefügt`);
    if (state.stage === "problem") {
      addMessage("assistant", "Danke. Schreiben Sie bitte noch in einem Satz, was passiert ist. Danach brauche ich nur einen Kontakt für die Rückmeldung.");
    } else if (state.stage === "photos") {
      openContactStep();
    }
  }
  return true;
}

function openContactStep() {
  state.stage = "contact";
  quickActions.hidden = true;
  contactStep.hidden = false;
  addMessage("assistant", "Fast geschafft. Wohin dürfen wir unsere Einschätzung senden? E-Mail oder Telefon / WhatsApp genügt.");
  document.querySelector("#customer-contact").focus();
}

function continueWithoutPhoto() {
  if (state.stage === "photos") openContactStep();
}

async function toBase64File(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, type: file.type || "application/octet-stream", size: file.size, data: String(reader.result).split(",")[1] || "" });
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function readContact(value) {
  const trimmed = value.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return { email: trimmed, phone: undefined, preferredContact: "email" };
  if (trimmed.length >= 3) return { email: undefined, phone: trimmed, preferredContact: "whatsapp" };
  return null;
}

quickActions.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  if (button.dataset.action === "photos") fileInput.click();
  else message.focus();
});

fileInput.addEventListener("change", () => updateFiles(Array.from(fileInput.files || [])));

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  status.className = "status";
  status.textContent = "";

  if (state.stage !== "contact") {
    const text = message.value.trim();
    if (text.length < 5) {
      status.className = "status error";
      status.textContent = "Bitte beschreiben Sie den Schaden kurz in einem Satz.";
      return;
    }
    addMessage("user", text);
    state.description = text;
    message.value = "";
    state.stage = "photos";
    addMessage("assistant", "Danke. Wenn Sie Fotos haben, fügen Sie sie jetzt direkt hinzu – eine Übersicht und eine Nahaufnahme helfen besonders.");
    quickActions.hidden = false;
    quickActions.innerHTML = '<button type="button" data-action="photos">Fotos hinzufügen</button><button type="button" data-action="continue">Ohne Fotos fortfahren</button>';
    return;
  }

  const contact = readContact(document.querySelector("#customer-contact").value);
  if (!contact) {
    status.className = "status error";
    status.textContent = "Bitte geben Sie eine gültige E-Mail-Adresse oder Telefonnummer an.";
    return;
  }
  if (!document.querySelector("#privacy").checked) {
    status.className = "status error";
    status.textContent = "Bitte stimmen Sie der Verarbeitung für diese Anfrage zu.";
    return;
  }
  const fileError = validateFiles(state.files);
  if (fileError) {
    status.className = "status error";
    status.textContent = fileError;
    return;
  }

  submitRequest.disabled = true;
  submitRequest.textContent = "Anfrage wird angelegt …";
  try {
    const files = await Promise.all(state.files.map(toBase64File));
    const name = document.querySelector("#customer-name").value.trim() || "Unbekannt";
    const vehicleMake = document.querySelector("#vehicle-make").value.trim();
    const vehicleModel = document.querySelector("#vehicle-model").value.trim();
    const vehiclePlate = document.querySelector("#vehicle-plate").value.trim();
    addMessage("user", `Kontakt für Rückmeldung: ${contact.email || contact.phone}`);
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName: name,
        customerEmail: contact.email,
        customerPhone: contact.phone,
        vehicleMake: vehicleMake || undefined,
        vehicleModel: vehicleModel || undefined,
        vehiclePlate: vehiclePlate || undefined,
        damageDescription: state.description,
        journeyType: "landing_agent",
        preferredContact: contact.preferredContact,
        conversationTranscript: state.transcript,
        files,
      }),
    });
    const result = await response.json().catch(() => ({}));
    const reference = result.order?.referenceNumber || result.intakeResult?.referenceNumber;
    if (!response.ok && !result.partial) throw new Error(result.message || "Die Anfrage konnte nicht gesendet werden.");
    if (!reference) throw new Error("Die Anfrage wurde nicht eindeutig bestätigt. Bitte kontaktieren Sie uns direkt.");
    const partial = Boolean(result.partial) || Number(result.intakeResult?.attachmentsCreated || 0) < state.files.length;
    if (partial) {
      status.className = "status warning";
      status.textContent = `Ihre Anfrage ${reference} wurde angelegt; nicht alle Dateien konnten bestätigt werden. Bitte nennen Sie uns diese Referenz.`;
      return;
    }
    addMessage("assistant", `Danke. Ihre Anfrage ${reference} ist bei Corion eingegangen. Unser Team prüft sie und meldet sich über Ihren gewünschten Kontakt.`);
    contactStep.hidden = true;
    composer.hidden = true;
    fileList.textContent = "";
    status.className = "status success";
    status.textContent = `Referenz: ${reference}`;
  } catch (error) {
    status.className = "status error";
    status.textContent = error.message || "Die Anfrage konnte nicht gesendet werden.";
  } finally {
    submitRequest.disabled = false;
    submitRequest.textContent = "Anfrage verbindlich senden";
  }
});

quickActions.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action='continue']");
  if (button) continueWithoutPhoto();
});
document.querySelector("#restart").addEventListener("click", resetConversation);
const agentChannel = document.querySelector("[data-channel='agent']");
if (agentChannel) agentChannel.addEventListener("click", () => {
  message.focus();
  message.scrollIntoView({ behavior: "smooth", block: "center" });
});
const channelTrigger = document.querySelector("#channel-trigger");
const channelPanel = document.querySelector("#channel-panel");
const channelClose = document.querySelector("#channel-close");
function setChannelPanel(open) {
  if (!channelPanel || !channelTrigger) return;
  channelPanel.hidden = !open;
  channelTrigger.setAttribute("aria-expanded", String(open));
}
if (channelTrigger) channelTrigger.addEventListener("click", () => setChannelPanel(channelPanel?.hidden));
if (channelClose) channelClose.addEventListener("click", () => setChannelPanel(false));
if (typeof window !== "undefined" && window.matchMedia?.("(max-width: 800px)").matches) {
  setChannelPanel(false);
}
resetConversation();
