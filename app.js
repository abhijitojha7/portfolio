/* Runtime data is intentionally limited to the generated public artifact. */
/* Diagram styling uses the --edge-width token defined in styles.css. */
const state = { data: null, scenarioId: null, componentId: null, filter: "All", query: "" };
const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizeBundle(bundle) {
  const records = Array.isArray(bundle?.records) ? bundle.records : [];
  const profileRecord = records.find((record) => record.kind === "profile");
  const projects = records
    .filter((record) => record.kind === "project")
    .map((record) => ({
      ...record,
      eyebrow: record.domain || "Engineering project",
      challenge: record.challenge || record.overview,
      role: record.role || "Architecture and engineering delivery",
      technologies: Array.isArray(record.technologies) ? record.technologies : [],
      architecture: record.architecture || "A documented public architecture view.",
      impact: Array.isArray(record.impact) ? record.impact.join(" ") : record.impact || "",
      employer: record.employer
        ? `Completed at ${record.employer}`
        : "Enterprise delivery experience",
      references: Array.isArray(record.references) ? record.references : [],
    }));
  const architectures = records
    .filter((record) => record.kind === "architecture")
    .map((record) => {
      const labels = new Map((record.nodes || []).map((node) => [node.id, node.label]));
      const relationships = (record.edges || []).map((edge) => {
        const [from, to] = Array.isArray(edge) ? edge : [edge.from, edge.to];
        return {
          from,
          to,
          label: Array.isArray(edge) ? "documented flow" : edge.label || "documented flow",
        };
      });
      const validRelationships = relationships.filter(
        (edge) => labels.has(edge.from) && labels.has(edge.to),
      );
      return {
        id: record.id,
        title: record.title,
        summary: record.summary,
        flowLabel: record.scenario || "Explore the documented flow",
        textEquivalent: `${record.summary} ${validRelationships.map((edge) => `Relationship: ${labels.get(edge.from)} -> ${labels.get(edge.to)} (${edge.label}).`).join(" ")} ${(record.nodes || []).map((node) => `${node.label}: ${node.purpose}`).join(" ")}`,
        components: (record.nodes || []).map((node) => ({
          ...node,
          name: node.label,
          type: node.id === "broker" ? "messaging" : "component",
          rationale:
            node.whySelected || "Selected because it makes a documented responsibility visible.",
          technologies: node.technologies || [],
          relatedProjects: node.relatedProjects || [],
          relatedDecisions: node.relatedDecisions || [],
          relatedNotes: node.relatedNotes || [],
        })),
        relationships: validRelationships,
      };
    });
  return {
    profile: bundle?.profile || profileRecord?.profile,
    projects,
    architectures,
    decisions: records
      .filter((record) => record.kind === "decision")
      .map((record) => ({ ...record, slug: record.id })),
    notes: records
      .filter((record) => record.kind === "note")
      .map((record) => ({ ...record, slug: record.id })),
  };
}

function list(items, className = "") {
  return Array.isArray(items) && items.length
    ? `<ul class="${className}">${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`
    : "";
}
function announce(message) {
  const live = $("#live-region");
  live.textContent = "";
  window.setTimeout(() => {
    live.textContent = message;
  }, 20);
}

function renderProfile(profile) {
  if (!profile) return;
  $("#profile-name").textContent = profile.name;
  $("#profile-role").textContent = profile.role;
  $("#profile-headline").textContent = profile.headline;
  $("#profile-introduction").textContent = profile.introduction;
  $("#profile-supporting").textContent = profile.supportingCopy;
  $("#availability").textContent = profile.availability;
  $("#location").textContent = profile.location;
  $("#career-highlights").innerHTML = (profile.careerHighlights || [])
    .map((name) => `<span class="highlight-pill">${escapeHtml(name)}</span>`)
    .join("");
  $("#value-pillars").innerHTML = (profile.valuePillars || [])
    .map(
      (pillar, index) =>
        `<article class="pillar reveal" style="--reveal-delay:${index * 70}ms"><p class="eyebrow">${escapeHtml(pillar.eyebrow)}</p><h3>${escapeHtml(pillar.title)}</h3><p>${escapeHtml(pillar.copy)}</p></article>`,
    )
    .join("");
}

function visibleProjects() {
  const query = state.query.trim().toLowerCase();
  return state.data.projects.filter((project) => {
    const matchesFilter =
      state.filter === "All" ||
      project.employer.includes(state.filter) ||
      project.domain === state.filter;
    const matchesQuery =
      !query ||
      [
        project.title,
        project.domain,
        project.employer,
        project.challenge,
        ...(project.technologies || []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    return matchesFilter && matchesQuery;
  });
}

function renderFilters() {
  const values = [
    "All",
    ...new Set(
      state.data.projects.map((project) => project.employer.replace(/^Completed at /, "")),
    ),
  ];
  $("#project-filters").innerHTML = values
    .map(
      (value) =>
        `<button class="filter-button" type="button" data-filter="${escapeHtml(value)}" aria-pressed="${state.filter === value}">${escapeHtml(value)}</button>`,
    )
    .join("");
}

function renderProjects() {
  const projects = visibleProjects();
  $("#projects-grid").innerHTML = projects.length
    ? projects
        .map(
          (project, index) =>
            `<article class="project-card reveal" style="--reveal-delay:${index * 45}ms"><div class="card-topline"><span class="eyebrow">${escapeHtml(project.eyebrow)}</span><span class="card-index">${String(index + 1).padStart(2, "0")}</span></div><h3>${escapeHtml(project.title)}</h3><p class="project-challenge">${escapeHtml(project.challenge)}</p><dl class="project-meta"><div><dt>Role</dt><dd>${escapeHtml(project.role)}</dd></div><div><dt>Impact</dt><dd>${escapeHtml(project.impact)}</dd></div></dl><div class="tag-row">${project.technologies
              .slice(0, 5)
              .map((item) => `<span>${escapeHtml(item)}</span>`)
              .join(
                "",
              )}</div><p class="project-employer">${escapeHtml(project.employer)}</p><button class="card-action" type="button" data-project="${escapeHtml(project.id)}">Read the full preview <span aria-hidden="true">↗</span></button></article>`,
        )
        .join("")
    : `<p class="loading-copy">No projects match that view. Try another filter.</p>`;
  setupReveal();
}

function renderPreviews() {
  $("#decision-grid").innerHTML = state.data.decisions
    .map(
      (item, index) =>
        `<article class="preview-card reveal" style="--reveal-delay:${index * 70}ms"><span class="eyebrow">Decision journal / 0${index + 1}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.problem)}</p><button type="button" class="text-button" data-decision="${escapeHtml(item.slug)}">Open the reasoning ↗</button></article>`,
    )
    .join("");
  $("#notes-grid").innerHTML = state.data.notes
    .map(
      (item, index) =>
        `<article class="preview-card note-card reveal" style="--reveal-delay:${index * 70}ms"><span class="eyebrow">Technical note / 0${index + 1}</span><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.overview)}</p><button type="button" class="text-button" data-note="${escapeHtml(item.slug)}">Read the preview ↗</button></article>`,
    )
    .join("");
  setupReveal();
}

function renderScenarioNav() {
  $("#scenario-nav").innerHTML = state.data.architectures
    .map(
      (scenario) =>
        `<button type="button" class="scenario-button ${scenario.id === state.scenarioId ? "is-active" : ""}" data-scenario="${escapeHtml(scenario.id)}" aria-controls="architecture-detail" aria-pressed="${scenario.id === state.scenarioId}"><span class="scenario-dot" aria-hidden="true"></span><span><strong>${escapeHtml(scenario.title)}</strong><small>${escapeHtml(scenario.flowLabel)}</small></span></button>`,
    )
    .join("");
}

function edgeGeometry(from, to, count) {
  if (from === undefined || to === undefined) return [];
  const x1 = 12 + (from * 76) / Math.max(1, count - 1);
  const x2 = 12 + (to * 76) / Math.max(1, count - 1);
  const y1 = from % 2 ? 64 : 40;
  const y2 = to % 2 ? 64 : 40;
  return [x1, y1, x2, y2];
}

function renderDiagram(scenario) {
  const diagram = $("#diagram");
  const count = scenario.components.length;
  const edges = scenario.relationships
    .map((edge, index) => {
      const fromIndex = scenario.components.findIndex((item) => item.id === edge.from);
      const toIndex = scenario.components.findIndex((item) => item.id === edge.to);
      const points = edgeGeometry(
        fromIndex < 0 ? undefined : fromIndex,
        toIndex < 0 ? undefined : toIndex,
        count,
      );
      return points.length ? { points, from: edge.from, to: edge.to } : null;
    })
    .filter(Boolean);
  const lines = edges
    .map(
      ({ points: [x1, y1, x2, y2], from, to }) =>
        `<line class="flow-edge" data-from="${escapeHtml(from)}" data-to="${escapeHtml(to)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" />`,
    )
    .join("");
  diagram.innerHTML = `<svg viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="flow-gradient" x1="0" x2="1"><stop stop-color="#53f4d2"/><stop offset="1" stop-color="#4d86ff"/></linearGradient></defs>${lines}</svg>${scenario.components
    .map((component, index) => {
      const left = 4 + (index * 92) / Math.max(1, count - 1);
      const top = index % 2 ? 58 : 22;
      return `<button class="diagram-node" type="button" data-component="${escapeHtml(component.id)}" style="left:${left}%;top:${top}%" aria-label="Focus ${escapeHtml(component.name)}"><span class="node-label">${escapeHtml(component.name)}</span><span class="node-type">${escapeHtml(component.type)}</span></button>`;
    })
    .join("")}`;
  $("#diagram-text").textContent = scenario.textEquivalent;
  applyFocusMode();
}

function selectScenario(id) {
  const scenario =
    state.data.architectures.find((item) => item.id === id) || state.data.architectures[0];
  if (!scenario) return;
  state.scenarioId = scenario.id;
  state.componentId = null;
  $("#scenario-flow").textContent = scenario.flowLabel;
  $("#scenario-title").textContent = scenario.title;
  $("#scenario-summary").textContent = scenario.summary;
  $("#detail-eyebrow").textContent = "Architecture overview";
  $("#detail-title").textContent = "Choose a component";
  $("#detail-purpose").textContent =
    "Select a node to see its purpose, trade-offs, and related work.";
  $("#breadcrumb").textContent = "Architecture overview";
  $("#detail-content").innerHTML =
    `<p class="detail-lede">Focus Mode keeps the system legible while revealing the engineering decision underneath.</p>`;
  renderScenarioNav();
  renderDiagram(scenario);
}

function relatedLinks(ids, attribute, label) {
  return (ids || [])
    .map(
      (id) =>
        `<button class="text-button" type="button" data-${attribute}="${escapeHtml(id)}">${label} ↗</button>`,
    )
    .join("");
}

function renderReferences(values) {
  if (!Array.isArray(values) || !values.length) return "Not published";
  return values
    .map((value) => {
      const text = String(value ?? "");
      if (text.toLowerCase().startsWith("https://")) {
        const safeUrl = escapeHtml(text);
        return `<a href="${safeUrl}" target="_blank" rel="noreferrer">${safeUrl}</a>`;
      }
      return escapeHtml(text);
    })
    .join(" · ");
}

function selectComponent(id) {
  const scenario = state.data.architectures.find((item) => item.id === state.scenarioId);
  const component = scenario?.components.find((item) => item.id === id);
  if (!scenario || !component) return;
  state.componentId = component.id;
  $("#detail-eyebrow").textContent = `${scenario.title} / Focus mode`;
  $("#detail-title").textContent = component.name;
  $("#detail-purpose").textContent = component.purpose;
  $("#breadcrumb").textContent = `${scenario.title} → ${component.type} → ${component.name}`;
  $("#detail-content").innerHTML =
    `<div class="detail-sections"><details open><summary>Responsibilities</summary>${list(component.responsibilities)}</details><details open><summary>Trade-offs</summary>${list(component.tradeoffs)}</details><details open><summary>Why selected</summary><p>${escapeHtml(component.rationale)}</p></details><details><summary>Related technologies</summary><div class="tag-row">${component.technologies.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></details><div class="detail-links">${relatedLinks(component.relatedProjects, "project", "Related project")}${relatedLinks(component.relatedDecisions, "decision", "Decision preview")}${relatedLinks(component.relatedNotes, "note", "Technical note")}</div></div>`;
  applyFocusMode();
  announce(`${component.name} focused. Related components are dimmed.`);
}

function applyFocusMode() {
  const selected = state.componentId;
  $$(".diagram-node").forEach((node) => {
    node.classList.toggle("is-selected", Boolean(selected && node.dataset.component === selected));
    node.classList.toggle("is-dimmed", Boolean(selected && node.dataset.component !== selected));
  });
  $$(".flow-edge").forEach((edge) => {
    const connected = !selected || edge.dataset.from === selected || edge.dataset.to === selected;
    edge.classList.toggle("is-dimmed", !connected);
    edge.classList.toggle("is-active", Boolean(selected && connected));
  });
}
function clearFocus() {
  if (!state.componentId) return;
  state.componentId = null;
  selectScenario(state.scenarioId);
  announce("Architecture overview restored.");
}

function showPreview(type, id) {
  const item = (
    type === "project"
      ? state.data.projects
      : type === "decision"
        ? state.data.decisions
        : state.data.notes
  ).find((entry) => (entry.id || entry.slug) === id);
  if (!item) return;
  const join = (values) => (Array.isArray(values) ? values.join(" · ") : values || "Not published");
  const body =
    type === "project"
      ? `<p>${escapeHtml(item.challenge)}</p><dl class="preview-detail"><div><dt>Business challenge</dt><dd>${escapeHtml(item.challenge)}</dd></div><div><dt>Role</dt><dd>${escapeHtml(item.role)}</dd></div><div><dt>Solution</dt><dd>${escapeHtml(item.solution)}</dd></div><div><dt>Architecture</dt><dd>${escapeHtml(item.architecture)}</dd></div><div><dt>Engineering impact</dt><dd>${escapeHtml(item.impact)}</dd></div><div><dt>Public references</dt><dd>${renderReferences(item.references)}</dd></div></dl><p class="project-employer">${escapeHtml(item.employer)}</p>`
      : type === "decision"
        ? `<p>${escapeHtml(item.problem)}</p><dl class="preview-detail"><div><dt>Constraints</dt><dd>${escapeHtml(join(item.constraints))}</dd></div><div><dt>Options considered</dt><dd>${escapeHtml(join(item.options))}</dd></div><div><dt>Final decision</dt><dd>${escapeHtml(item.decision)}</dd></div><div><dt>Trade-offs</dt><dd>${escapeHtml(join(item.tradeoffs))}</dd></div><div><dt>Outcome</dt><dd>${escapeHtml(item.outcome)}</dd></div><div><dt>Lessons learned</dt><dd>${escapeHtml(item.lesson)}</dd></div></dl>`
        : `<p>${escapeHtml(item.overview)}</p><dl class="preview-detail"><div><dt>Executive overview</dt><dd>${escapeHtml(item.overview)}</dd></div><div><dt>Technology stack</dt><dd>${escapeHtml(join(item.stack))}</dd></div><div><dt>Engineering challenges</dt><dd>${escapeHtml(join(item.challenges))}</dd></div><div><dt>High-level design decisions</dt><dd>${escapeHtml(join(item.decisions))}</dd></div><div><dt>Public references</dt><dd>${renderReferences(item.references)}</dd></div></dl>`;
  $("#preview-title").textContent = item.title;
  $("#preview-body").innerHTML = body;
  $("#preview-dialog").showModal();
}

function handleHash() {
  let decodedHash;
  try {
    decodedHash = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return;
  }
  const parts = decodedHash.split("/").filter(Boolean);
  const target = document.getElementById(parts[0]);
  if (!target) return;
  if (parts[0] === "architecture" && state.data) {
    if (parts[1]) selectScenario(parts[1]);
    if (parts[2]) selectComponent(parts[2]);
  }
  target.scrollIntoView({ behavior: reduceMotion?.matches ? "auto" : "smooth" });
}
function setupReveal() {
  const items = $$(".reveal:not(.is-visible)");
  if (reduceMotion?.matches || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) =>
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }),
    { threshold: 0.12, rootMargin: "0px 0px -5%" },
  );
  items.forEach((item) => observer.observe(item));
}

function setupInteractions() {
  $("#project-search").addEventListener("input", (event) => {
    state.query = event.target.value;
    renderProjects();
  });
  $("#project-filters").addEventListener("click", (event) => {
    const button = event.target.closest("[data-filter]");
    if (!button) return;
    state.filter = button.dataset.filter;
    renderFilters();
    renderProjects();
  });
  $("#scenario-nav").addEventListener("click", (event) => {
    const button = event.target.closest("[data-scenario]");
    if (button) selectScenario(button.dataset.scenario);
  });
  document.addEventListener("click", (event) => {
    const node = event.target.closest(".diagram-node");
    if (node) {
      selectComponent(node.dataset.component);
      return;
    }
    const target = event.target.closest("[data-project], [data-decision], [data-note]");
    if (!target) return;
    if (target.dataset.project) showPreview("project", target.dataset.project);
    if (target.dataset.decision) showPreview("decision", target.dataset.decision);
    if (target.dataset.note) showPreview("note", target.dataset.note);
  });
  $("#clear-focus").addEventListener("click", clearFocus);
  $("#preview-close").addEventListener("click", () => $("#preview-dialog").close());
  $("#preview-dialog").addEventListener("click", (event) => {
    if (event.target === $("#preview-dialog")) $("#preview-dialog").close();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.componentId) clearFocus();
    if ((event.key === "Enter" || event.key === " ") && event.target.matches(".diagram-node")) {
      event.preventDefault();
      selectComponent(event.target.dataset.component);
    }
  });
  window.addEventListener("hashchange", handleHash);
}

async function load() {
  try {
    const artifactUrl = new URL("public-data/portfolio.json", document.baseURI).href;
    const response = await fetch(artifactUrl, {
      headers: { Accept: "application/json" },
    });
    if (!response.ok) throw new Error(`Artifact request failed (${response.status}).`);
    state.data = normalizeBundle(await response.json());
    renderProfile(state.data.profile);
    renderFilters();
    renderProjects();
    renderPreviews();
    selectScenario(state.data.architectures[0]?.id);
    $("#status").textContent =
      `${state.data.projects.length} sanitized projects · publication-approved`;
    setupReveal();
    handleHash();
  } catch (error) {
    $("#status").textContent = "Public content is temporarily unavailable.";
    console.error(error);
  }
}

setupInteractions();
load();
