(() => {
  const stylesheet = document.createElement("link");
  stylesheet.rel = "stylesheet";
  stylesheet.href = "./mobile-channels.css?v=202607130151";
  document.head.append(stylesheet);

  const headerContent = document.querySelector(".agent-head > div");
  if (!headerContent || document.querySelector(".mobile-channels")) return;

  const channels = [
    ["wa", "WhatsApp", "https://wa.me/4917683458274?text=Hallo%20Corion%2C%20ich%20m%C3%B6chte%20einen%20Schaden%20zeigen.", true],
    ["mail", "E-Mail", "mailto:info@corion.gmbh?subject=Reparaturanfrage%20%C3%BCber%20corion.app", false],
    ["tg", "Telegram", "https://t.me/+4917647794879?text=Hallo%20Corion%2C%20ich%20m%C3%B6chte%20einen%20Schaden%20zeigen.", true],
    ["phone", "Anrufen", "tel:+4917683458274", false],
  ];

  const container = document.createElement("div");
  container.className = "mobile-channels";
  container.setAttribute("aria-label", "Direkte Kontaktwege");
  container.innerHTML = channels.map(([className, label, href, external]) =>
    `<a class="${className}" href="${href}"${external ? ' target="_blank" rel="noopener noreferrer"' : ""}>${label}</a>`
  ).join("");
  headerContent.append(container);
})();
