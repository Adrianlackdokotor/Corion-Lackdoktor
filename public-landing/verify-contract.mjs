import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const handlers = new Map();
function on(id, type, handler) {
  const key = `${id}:${type}`;
  handlers.set(key, [...(handlers.get(key) || []), handler]);
}
async function fire(id, type, event) {
  for (const handler of handlers.get(`${id}:${type}`) || []) await handler(event);
}

function element(id) {
  return {
    id, files: [], textContent: "", className: "", disabled: false, hidden: false,
    value: "", checked: false, innerHTML: "", children: [],
    classList: { toggle() {} },
    addEventListener(type, handler) { on(id, type, handler); },
    append(child) { this.children.push(child); },
    replaceChildren() { this.children = []; },
    focus() {}, click() {}, scrollIntoView() {},
  };
}

const selectors = [
  "#agent-form", "#conversation", "#message", "#files", "#file-list", "#status",
  "#quick-actions", "#contact-step", "#composer", "#submit-request", "#restart",
  "#customer-name", "#customer-contact", "#vehicle-make", "#vehicle-model", "#vehicle-plate", "#privacy", "[data-channel='agent']",
];
const elements = new Map(selectors.map((selector) => [selector, element(selector)]));
const pngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z8uQAAAAASUVORK5CYII=";
elements.get("#files").files = [{
  name: "damage.png", type: "image/png", size: Buffer.from(pngBase64, "base64").length, base64: pngBase64,
}];

let capturedRequest;
let responseBody = { order: { id: "order-test", referenceNumber: "WO-CONTRACT-TEST" }, intakeResult: { orderId: "order-test", referenceNumber: "WO-CONTRACT-TEST", attachmentsCreated: 1 } };
class FakeFileReader {
  readAsDataURL(file) { this.result = `data:${file.type};base64,${file.base64}`; this.onload(); }
}

const context = {
  document: {
    querySelector: (selector) => elements.get(selector),
    createElement: () => element("bubble"),
  },
  FileReader: FakeFileReader,
  fetch: async (url, options) => { capturedRequest = { url, options }; return { ok: true, json: async () => responseBody }; },
  console,
};

vm.runInNewContext(fs.readFileSync(new URL("./intake.js", import.meta.url), "utf8"), context);

// Customer describes the issue, sends a photo, chooses to continue, then
// supplies contact/consent. This mirrors the progressive public journey.
elements.get("#message").value = "Visible scratch on the rear bumper.";
await fire("#agent-form", "submit", { preventDefault() {} });
await fire("#files", "change", {});
await fire("#quick-actions", "click", { target: { closest: () => ({ dataset: { action: "continue" } }) } });
elements.get("#customer-name").value = "Contract Test";
elements.get("#customer-contact").value = "contract@example.invalid";
elements.get("#vehicle-make").value = "TestMake";
elements.get("#vehicle-model").value = "TestModel";
elements.get("#vehicle-plate").value = "TEST-1";
elements.get("#privacy").checked = true;
await fire("#agent-form", "submit", { preventDefault() {} });

const payload = JSON.parse(capturedRequest.options.body);
assert.equal(capturedRequest.url, "https://app.corion.app/api/client/submit-request");
assert.equal(capturedRequest.options.method, "POST");
assert.equal(payload.customerEmail, "contract@example.invalid");
assert.equal(payload.damageDescription, "Visible scratch on the rear bumper.");
assert.equal(payload.journeyType, "landing_agent");
assert.equal(payload.preferredContact, "email");
assert.equal(payload.files.length, 1);
assert.equal(payload.conversationTranscript.some((entry) => entry.content.includes("Visible scratch")), true);
assert.deepEqual(payload.files[0], { name: "damage.png", type: "image/png", size: Buffer.from(pngBase64, "base64").length, data: pngBase64 });
assert.match(elements.get("#status").textContent, /WO-CONTRACT-TEST/);
assert.equal(elements.get("#status").className, "status success");

console.log("public-landing conversational contract verification passed");
