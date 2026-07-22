/* Runtime data is intentionally limited to the generated public artifact. */
/* Diagram styling uses the --edge-width token defined in styles.css. */
const state = {
  data: null,
  scenarioId: null,
  componentId: null,
  expertiseId: null,
  filter: "All",
  query: "",
};
const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const SELF_DEVELOPED_LABEL = "Self-developed projects";
const COMPANY_HISTORY_LABEL = "Company history";

function isSelfDevelopedProject(project) {
  const employer = typeof project?.employer === "string" ? project.employer : "";
  return /enterprise engineering engagement|self-developed/i.test(employer);
}

const EXPERTISE_ITEMS = Object.freeze([
  {
    id: "distributed-systems",
    name: "Distributed Systems",
    description: "Designing scalable enterprise systems.",
  },
  {
    id: "project-architect",
    name: "Project Architect",
    description: "Building maintainable and extensible software architectures.",
  },
  {
    id: "dotnet-csharp",
    name: ".NET & C#",
    description: "13+ years developing enterprise applications.",
  },
  {
    id: "microservices",
    name: "Microservices",
    description: "Designing resilient service-oriented platforms.",
  },
  {
    id: "aws-cloud",
    name: "AWS Cloud",
    description: "Cloud-native application design and deployment.",
  },
  {
    id: "performance-engineering",
    name: "Performance Engineering",
    description: "Optimizing reliability, scalability and throughput.",
  },
  {
    id: "healthcare-interoperability",
    name: "Healthcare Interoperability",
    description: "DICOM, HL7/FHIR and enterprise healthcare platforms.",
  },
  {
    id: "technical-leadership",
    name: "Technical Leadership",
    description: "Leading teams through architecture and execution.",
  },
  {
    id: "team-management",
    name: "Team Management",
    description: "Mentoring teams through planning, feedback and execution.",
  },
  {
    id: "product-thinking",
    name: "Product Thinking",
    description: "Engineering with customer and business impact in mind.",
  },
  {
    id: "delivery-excellence",
    name: "Delivery Excellence",
    description: "Driving predictable, high-quality software delivery.",
  },
  {
    id: "reliability-engineering",
    name: "Reliability Engineering",
    description: "Designing systems that remain dependable under scale.",
  },
]);

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
    .map((record) => {
      const employer = typeof record.employer === "string" ? record.employer.trim() : "";
      const isSelfDeveloped = isSelfDevelopedProject({ employer });
      return {
        ...record,
        eyebrow: record.domain || "Engineering project",
        challenge: record.challenge || record.overview,
        role: record.role || "Architecture and engineering delivery",
        technologies: Array.isArray(record.technologies) ? record.technologies : [],
        architecture: record.architecture || "A documented public architecture view.",
        impact: Array.isArray(record.impact) ? record.impact.join(" ") : record.impact || "",
        employer: isSelfDeveloped
          ? SELF_DEVELOPED_LABEL
          : employer
            ? `Completed at ${employer}`
            : "Enterprise delivery experience",
        references: Array.isArray(record.references) ? record.references : [],
      };
    });
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
          type: node.type || (node.id === "broker" ? "messaging" : "component"),
          position: node.position || null,
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

function renderAnimatedName(name) {
  return [...String(name ?? "")]
    .map((character, index) => {
      const content = character === " " ? "&nbsp;" : escapeHtml(character);
      if (character === " ") {
        return `<span class="hero-letter hero-letter-space" aria-hidden="true">${content}</span>`;
      }
      const glyphClass =
        character.toLowerCase() === "j" ? "hero-letter hero-letter-j" : "hero-letter";
      return `<span class="${glyphClass}" data-glyph="${content}" aria-hidden="true" style="--letter-index:${index}"><span class="hero-letter-outline" aria-hidden="true">${content}</span><span class="hero-letter-face">${content}</span></span>`;
    })
    .join("");
}

function formatExperienceDuration(startMonth, now = new Date()) {
  if (typeof startMonth !== "string" || !/^\d{4}-\d{2}$/.test(startMonth)) return "";
  const [startYear, startMonthNumber] = startMonth.split("-").map(Number);
  const current = now instanceof Date ? now : new Date(now);
  if (
    !Number.isInteger(startYear) ||
    !Number.isInteger(startMonthNumber) ||
    startYear < 1900 ||
    startMonthNumber < 1 ||
    startMonthNumber > 12 ||
    Number.isNaN(current.getTime())
  ) {
    return "";
  }
  const months =
    (current.getUTCFullYear() - startYear) * 12 + (current.getUTCMonth() + 1 - startMonthNumber);
  if (months < 0) return "";
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  const parts = [];
  if (years) parts.push(`${years} ${years === 1 ? "year" : "years"}`);
  if (remainingMonths)
    parts.push(`${remainingMonths} ${remainingMonths === 1 ? "month" : "months"}`);
  return parts.join(", ") || "less than a month";
}

function organizationHref(name) {
  const highlights = state.data?.profile?.careerHighlights;
  const entry = (Array.isArray(highlights) ? highlights : []).find((item) =>
    typeof item === "string" ? item === name : item?.name === name,
  );
  const href = typeof entry === "object" && entry !== null ? entry.url : "";
  return typeof href === "string" && href.toLowerCase().startsWith("https://") ? href : "";
}

function organizationLink(name, className) {
  const href = organizationHref(name);
  const classAttribute = className ? ` class="${escapeHtml(className)}"` : "";
  if (!href) return `<span${classAttribute}>${escapeHtml(name)}</span>`;
  return `<a${classAttribute} href="${escapeHtml(href)}" target="_blank" rel="noreferrer">${escapeHtml(name)} <span aria-hidden="true">↗</span></a>`;
}

function renderProfile(profile) {
  if (!profile) return;
  const experience = formatExperienceDuration(profile.careerStartMonth);
  const introduction = String(profile.introduction ?? "");
  const dynamicIntroduction = experience
    ? introduction.replace(/\b\d+\+?\s+years?\b/i, experience)
    : introduction;
  const profileName = $("#profile-name");
  profileName.setAttribute("aria-label", profile.name);
  profileName.innerHTML = renderAnimatedName(profile.name);
  $("#profile-role").textContent = profile.role;
  $("#profile-headline").textContent = profile.headline;
  $("#profile-introduction").textContent = dynamicIntroduction;
  $("#profile-supporting").textContent = profile.supportingCopy;
  $("#availability").textContent = profile.availability;
  $("#location").textContent = profile.location;
  const experienceBadge = $("#experience-badge");
  if (experienceBadge) {
    const label = experience ? `${experience} of experience` : "Experience timeline";
    experienceBadge.textContent = label;
    experienceBadge.setAttribute("aria-label", label);
  }
  $("#career-highlights").innerHTML = (profile.careerHighlights || [])
    .map((entry) => {
      const name = typeof entry === "string" ? entry : entry?.name;
      return name ? organizationLink(name, "highlight-pill") : "";
    })
    .join("");
  $("#value-pillars").innerHTML = (profile.valuePillars || [])
    .map(
      (pillar, index) =>
        `<article class="pillar reveal" style="--reveal-delay:${index * 70}ms"><p class="eyebrow">${escapeHtml(pillar.eyebrow)}</p><h3>${escapeHtml(pillar.title)}</h3><p>${escapeHtml(pillar.copy)}</p></article>`,
    )
    .join("");
}

function renderExpertiseOrbit() {
  const target = $("#expertise-spheres");
  const paths = $("#expertise-paths");
  if (!target || !paths) return;
  const radius = 38;
  const points = EXPERTISE_ITEMS.map((item, index) => {
    const angle = -90 + index * (360 / EXPERTISE_ITEMS.length);
    const radians = (angle * Math.PI) / 180;
    return {
      ...item,
      x: 50 + Math.cos(radians) * radius,
      y: 50 + Math.sin(radians) * radius,
    };
  });
  paths.innerHTML = points
    .map((item) => `<line x1="50" y1="50" x2="${item.x.toFixed(2)}" y2="${item.y.toFixed(2)}" />`)
    .join("");
  target.innerHTML = points
    .map((item, index) => {
      const tooltipSide =
        item.x > 64 ? "left" : item.x < 36 ? "right" : item.y < 36 ? "bottom" : "top";
      return `<button class="expertise-sphere" type="button" data-expertise="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.name)}: ${escapeHtml(item.description)}" aria-pressed="false" style="--sphere-x:${item.x.toFixed(2)}%;--sphere-y:${item.y.toFixed(2)}%;--expertise-delay:${index * -0.45}s"><span class="expertise-sphere-surface"><strong>${escapeHtml(item.name)}</strong><span class="expertise-tooltip expertise-tooltip-${tooltipSide}" role="tooltip"><strong class="expertise-tooltip-title">${escapeHtml(item.name)}</strong><span class="expertise-tooltip-description">${escapeHtml(item.description)}</span></span></span></button>`;
    })
    .join("");
}

function setExpertiseActive(id) {
  const item = EXPERTISE_ITEMS.find((entry) => entry.id === id);
  const active = item ? id : null;
  state.expertiseId = active;
  $$(".expertise-sphere").forEach((button) => {
    const isActive = button.dataset.expertise === active;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  const liveRegion = $("#expertise-live-region");
  if (liveRegion) {
    liveRegion.textContent = item ? `${item.name}. ${item.description}` : "Expertise overview.";
  }
}

function toggleExpertise(id) {
  setExpertiseActive(id === state.expertiseId ? null : id);
}

function visibleProjects() {
  const query = state.query.trim().toLowerCase();
  return state.data.projects
    .filter((project) => {
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
    })
    .sort((first, second) => {
      const firstSelf = Number(isSelfDevelopedProject(first));
      const secondSelf = Number(isSelfDevelopedProject(second));
      return firstSelf - secondSelf;
    });
}

function renderFilters() {
  const employers = [
    ...new Set(
      state.data.projects.map((project) => project.employer.replace(/^Completed at /, "")),
    ),
  ];
  const values = [
    "All",
    ...employers.filter(
      (value) => !/self-developed|enterprise engineering engagement/i.test(value),
    ),
    ...employers.filter((value) => /self-developed|enterprise engineering engagement/i.test(value)),
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
              )}</div><p class="project-employer">${escapeHtml(project.employer)}</p><button class="card-action" type="button" data-project="${escapeHtml(project.id)}">Read the full review <span aria-hidden="true">↗</span></button></article>`,
        )
        .join("")
    : `<p class="loading-copy">No projects match that view. Try another filter.</p>`;
  setupReveal();
}

function timelineYears(value) {
  const years = [...String(value ?? "").matchAll(/(?:19|20)\d{2}/g)].map((match) =>
    Number(match[0]),
  );
  return years.length ? years : [0];
}

function splitCareerGroups(projects) {
  const companies = new Map();
  const selfDeveloped = [];
  (Array.isArray(projects) ? projects : []).forEach((project, index) => {
    if (!project || typeof project !== "object" || !project.id || !project.title) return;
    const employer =
      typeof project.employer === "string" && project.employer.trim()
        ? project.employer.replace(/^Completed at\s+/i, "").trim()
        : "";
    const entry = { ...project, _order: index };
    if (!employer || isSelfDevelopedProject({ employer })) {
      selfDeveloped.push(entry);
      return;
    }
    if (!companies.has(employer)) companies.set(employer, { projects: [], order: index });
    companies.get(employer).projects.push(entry);
  });
  return { companies: [...companies.entries()], selfDeveloped };
}

function renderTimelineProject(project, projectIndex, nestedProjects = []) {
  const nestedMarkup = nestedProjects.length
    ? `<ol class="timeline-subprojects" aria-label="Capabilities within ${escapeHtml(project.title)}">${nestedProjects
        .map((child, childIndex) => renderTimelineProject(child, childIndex))
        .join("")}</ol>`
    : "";
  return `<li class="timeline-project${nestedProjects.length ? " timeline-project-parent" : ""}" style="--timeline-delay:${projectIndex * 70}ms"><button class="timeline-node" type="button" data-project="${escapeHtml(project.id)}" aria-label="Open ${escapeHtml(project.title)} project review"><span class="timeline-node-index">${String(projectIndex + 1).padStart(2, "0")}</span><span class="timeline-node-copy"><strong>${escapeHtml(project.title)}</strong><small>${escapeHtml(project.role || "Engineering delivery")} · ${escapeHtml(project.domain || "Engineering project")} · ${escapeHtml(project.dates || "Project preview")}</small></span><span class="timeline-node-arrow" aria-hidden="true">↗</span></button>${nestedMarkup}</li>`;
}

function nestTimelineChildren(target, projects) {
  const projectById = new Map(projects.map((project) => [project.id, project]));
  const buttons = new Map(
    $$(".timeline-node", target).map((button) => [button.dataset.project, button]),
  );
  projects.forEach((project) => {
    const parent = project.parentProjectId && projectById.get(project.parentProjectId);
    const childItem = buttons.get(project.id)?.closest(".timeline-project");
    const parentItem = parent && buttons.get(parent.id)?.closest(".timeline-project");
    if (!parent || !childItem || !parentItem) return;
    const childIndex = [...childItem.parentElement.children].indexOf(childItem);
    const template = document.createElement("template");
    template.innerHTML = renderTimelineProject(project, childIndex);
    const renderedChild = template.content.firstElementChild;
    if (!renderedChild) return;
    childItem.replaceWith(renderedChild);
    let nested = $(".timeline-subprojects", parentItem);
    if (!nested) {
      nested = document.createElement("ol");
      nested.className = "timeline-subprojects";
      nested.setAttribute("aria-label", `Capabilities within ${parent.title}`);
      parentItem.append(nested);
    }
    nested.append(renderedChild);
  });
}

function renderTimeline(projects) {
  const target = $("#career-timeline");
  if (!target) return;
  const { companies, selfDeveloped } = splitCareerGroups(projects);
  const orderedGroups = companies.sort(([, first], [, second]) => {
    const firstYear = Math.max(
      ...first.projects.flatMap((project) => timelineYears(project.dates)),
      0,
    );
    const secondYear = Math.max(
      ...second.projects.flatMap((project) => timelineYears(project.dates)),
      0,
    );
    return secondYear - firstYear || first.order - second.order;
  });
  if (!orderedGroups.length && !selfDeveloped.length) {
    target.innerHTML = '<li class="loading-copy">No public timeline entries are available.</li>';
    return;
  }
  const companyMarkup = orderedGroups
    .map(([employer, group], groupIndex) => {
      const projectIds = new Set(group.projects.map((project) => project.id));
      const childrenByParent = new Map();
      group.projects.forEach((project) => {
        if (!project.parentProjectId || !projectIds.has(project.parentProjectId)) return;
        const children = childrenByParent.get(project.parentProjectId) || [];
        children.push(project);
        childrenByParent.set(project.parentProjectId, children);
      });
      const projectsForEmployer = group.projects
        .filter((project) => !project.parentProjectId || !projectIds.has(project.parentProjectId))
        .sort((first, second) => first._order - second._order);
      return `<li class="timeline-company reveal" data-career-group="company" style="--reveal-delay:${groupIndex * 75}ms"><div class="timeline-company-marker" aria-hidden="true"><span></span></div><div class="timeline-company-body"><div class="timeline-company-heading"><div><p class="eyebrow">${String(groupIndex + 1).padStart(2, "0")} / ${COMPANY_HISTORY_LABEL}</p><h3>${organizationLink(employer, "timeline-company-link")}</h3></div><span class="timeline-date">${escapeHtml(projectsForEmployer[0]?.dates || "Project portfolio")}</span></div><ol class="timeline-projects" aria-label="Projects at ${escapeHtml(employer)}">${projectsForEmployer
        .map((project, projectIndex) =>
          renderTimelineProject(project, projectIndex, childrenByParent.get(project.id) || []),
        )
        .join("")}</ol></div></li>`;
    })
    .join("");
  const orderedSelfDeveloped = selfDeveloped.sort((first, second) => first._order - second._order);
  const selfDevelopedMarkup = selfDeveloped.length
    ? `<li class="timeline-company timeline-company-self reveal" data-career-group="self-developed" style="--reveal-delay:${orderedGroups.length * 75}ms"><div class="timeline-company-marker" aria-hidden="true"><span></span></div><div class="timeline-company-body"><div class="timeline-company-heading"><div><p class="eyebrow">${String(orderedGroups.length + 1).padStart(2, "0")} / Independent practice</p><h3>${SELF_DEVELOPED_LABEL}</h3></div><span class="timeline-date">Self-directed</span></div><p class="timeline-group-note">Independent engineering patterns developed outside an employer context.</p><ol class="timeline-projects" aria-label="${SELF_DEVELOPED_LABEL}">${orderedSelfDeveloped
        .map((project, projectIndex) => renderTimelineProject(project, projectIndex))
        .join("")}</ol></div></li>`
    : "";
  target.innerHTML = companyMarkup + selfDevelopedMarkup;
  nestTimelineChildren(target, projects);
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

const NODE_ICON_MAP = Object.freeze({
  modality:
    '<svg class="node-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 4h14v11H5z"/><path d="M8 19h8M12 15v4M8 8h8M8 11h5"/></svg>',
  integration:
    '<svg class="node-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 7h6v4H4zM14 13h6v4h-6z"/><path d="M10 9h4v6M8 19h8M12 11v2"/></svg>',
  pacs: '<svg class="node-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/></svg>',
  archive:
    '<svg class="node-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 5h14v4H5zM6 9h12v10H6zM9 13h6"/></svg>',
  deployment:
    '<svg class="node-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M7 17h10a4 4 0 0 0 .4-8 6 6 0 0 0-11.6 1A3.5 3.5 0 0 0 7 17Z"/><path d="M9 20h6"/></svg>',
  viewer:
    '<svg class="node-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="4" y="5" width="16" height="12" rx="1"/><path d="M8 20h8M12 17v3"/></svg>',
  component:
    '<svg class="node-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 9h6v6H9z"/></svg>',
});

function nodeIconKey(component) {
  const id = String(component?.id || "").toLowerCase();
  if (id === "modality") return "modality";
  if (id.includes("dicom") || id.includes("integration")) return "integration";
  if (id.includes("pacs")) return "pacs";
  if (id.includes("archive")) return "archive";
  if (component?.type === "deployment" || id.includes("deployment")) return "deployment";
  if (id.includes("viewer")) return "viewer";
  return "component";
}

function nodeIcon(component) {
  return NODE_ICON_MAP[nodeIconKey(component)] || NODE_ICON_MAP.component;
}

const DIAGRAM_LAYOUT = Object.freeze({
  left: 18,
  right: 82,
  top: 28,
  bottom: 64,
});
const COMPACT_DIAGRAM_LAYOUT = Object.freeze({
  left: 26,
  right: 74,
  top: 14,
  bottom: 86,
});
const UML_PRIMARY_LANE = Object.freeze({
  modality: { x: 10, y: 46 },
  "dicom-integration": { x: 28, y: 46 },
  pacs: { x: 46, y: 46 },
  "enterprise-archive": { x: 64, y: 46 },
  "clinical-viewers": { x: 86, y: 46 },
});
const UML_DEPLOYMENT_LANE = Object.freeze({
  "on-premises": { x: 56, y: 76 },
  cloud: { x: 72, y: 76 },
});
const UML_NODE_POSITIONS = Object.freeze({ ...UML_PRIMARY_LANE, ...UML_DEPLOYMENT_LANE });

function isCompactDiagram() {
  return Boolean(
    typeof window !== "undefined" && window.matchMedia?.("(max-width: 760px)")?.matches,
  );
}

function compactDiagramAnchor(index, count) {
  const row = Math.floor(index / 2);
  const rowCount = Math.ceil(count / 2);
  const rowProgress = rowCount > 1 ? row / (rowCount - 1) : 0.5;
  return {
    x: index % 2 ? COMPACT_DIAGRAM_LAYOUT.right : COMPACT_DIAGRAM_LAYOUT.left,
    y:
      COMPACT_DIAGRAM_LAYOUT.top +
      rowProgress * (COMPACT_DIAGRAM_LAYOUT.bottom - COMPACT_DIAGRAM_LAYOUT.top),
  };
}

function diagramAnchor(index, count) {
  if (isCompactDiagram()) return compactDiagramAnchor(index, count);
  const ratio = index / Math.max(1, count - 1);
  return {
    x: DIAGRAM_LAYOUT.left + ratio * (DIAGRAM_LAYOUT.right - DIAGRAM_LAYOUT.left),
    y: index % 2 ? DIAGRAM_LAYOUT.bottom : DIAGRAM_LAYOUT.top,
  };
}

function componentAnchor(component, index, count) {
  if (isCompactDiagram()) return diagramAnchor(index, count);
  const umlPosition = UML_NODE_POSITIONS[component?.id];
  if (umlPosition) return umlPosition;
  const position = component?.position;
  if (position && Number.isFinite(Number(position.x)) && Number.isFinite(Number(position.y))) {
    return {
      x: Math.min(92, Math.max(8, Number(position.x))),
      y: Math.min(84, Math.max(16, Number(position.y))),
    };
  }
  return diagramAnchor(index, count);
}

function edgeGeometry(from, to, count, components = []) {
  if (from === undefined || to === undefined) return [];
  const fromAnchor = diagramAnchor(from, count);
  const toAnchor = diagramAnchor(to, count);
  const fromPosition = components.length
    ? componentAnchor(components[from], from, count)
    : fromAnchor;
  const toPosition = components.length ? componentAnchor(components[to], to, count) : toAnchor;
  return [fromPosition.x, fromPosition.y, toPosition.x, toPosition.y];
}

function umlEdgePath(from, to, points) {
  const [x1, y1, x2, y2] = points;
  const deploymentTarget = to === "on-premises" || to === "cloud";
  const viewerTarget = to === "clinical-viewers" && from !== "enterprise-archive";
  if (from === "enterprise-archive" && deploymentTarget) {
    return `M ${x1} ${y1} V 62 H ${x2} V ${y2}`;
  }
  if (viewerTarget) {
    return `M ${x1} ${y1} V 88 H ${x2} V ${y2}`;
  }
  if (y1 === y2) return `M ${x1} ${y1} H ${x2}`;
  return `M ${x1} ${y1} L ${x2} ${y2}`;
}

function renderDiagram(scenario) {
  const diagram = $("#diagram");
  const count = scenario.components.length;
  const edges = scenario.relationships
    .map((edge) => {
      const fromIndex = scenario.components.findIndex((item) => item.id === edge.from);
      const toIndex = scenario.components.findIndex((item) => item.id === edge.to);
      const points = edgeGeometry(
        fromIndex < 0 ? undefined : fromIndex,
        toIndex < 0 ? undefined : toIndex,
        count,
        scenario.components,
      );
      return points.length
        ? {
            points,
            from: edge.from,
            to: edge.to,
            path: umlEdgePath(edge.from, edge.to, points),
          }
        : null;
    })
    .filter(Boolean);
  const lines = edges
    .map(
      ({ from, to, path }, index) =>
        `<path class="flow-edge" id="flow-path-${index}" data-path-id="flow-path-${index}" data-from="${escapeHtml(from)}" data-to="${escapeHtml(to)}" marker-end="url(#flow-arrow)" d="${path}" />`,
    )
    .join("");
  const packetKeyframes = Object.freeze({ duration: 5.4, stagger: 0.24 });
  const packets = edges
    .map(({ points: [x1, y1], from, to }, index) => {
      const packetMotion = reduceMotion?.matches
        ? ""
        : `<animateMotion dur="${packetKeyframes.duration}s" begin="${(index * packetKeyframes.stagger).toFixed(2)}s" repeatCount="indefinite" rotate="auto"><mpath href="#flow-path-${index}" /></animateMotion>`;
      return `<circle class="flow-packet" data-path-id="flow-path-${index}" data-from="${escapeHtml(from)}" data-to="${escapeHtml(to)}" cx="${x1}" cy="${y1}" r="1.6" style="--packet-delay:${index * 160}ms">${packetMotion}</circle>`;
    })
    .join("");
  diagram.innerHTML = `<svg class="diagram-edges" viewBox="0 0 100 100" aria-hidden="true"><defs><linearGradient id="flow-gradient" x1="0" x2="1"><stop stop-color="#53f4d2"/><stop offset="1" stop-color="#4d86ff"/></linearGradient><marker id="flow-arrow" markerWidth="6" markerHeight="6" refX="5.5" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M 0 0 L 6 3 L 0 6 z" fill="#245edb" /></marker></defs>${lines}${packets}</svg>${scenario.components
    .map((component, index) => {
      const anchor = componentAnchor(component, index, count);
      const deploymentClass = component.type === "deployment" ? " is-deployment" : "";
      return `<button class="diagram-node${deploymentClass}" type="button" data-component="${escapeHtml(component.id)}" data-node-type="${escapeHtml(component.type)}" style="left:${anchor.x}%;top:${anchor.y}%;" aria-label="Focus ${escapeHtml(component.name)}">${nodeIcon(component)}<span class="node-label">${escapeHtml(component.name)}</span><span class="node-type">${escapeHtml(component.type)}</span></button>`;
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
  $$(".flow-packet").forEach((packet) => {
    const connected =
      !selected || packet.dataset.from === selected || packet.dataset.to === selected;
    packet.classList.toggle("is-dimmed", !connected);
    packet.classList.toggle("is-active", Boolean(selected && connected));
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
  const reviewSection = (index, label, value, isHtml = false) =>
    `<section class="review-section" data-reveal-delay="${index * 70}ms" style="--review-delay:${index * 70}ms"><div class="review-section-number" aria-hidden="true">${String(index).padStart(2, "0")}</div><div><h3 class="review-section-label">${escapeHtml(label)}</h3><div class="review-section-copy">${isHtml ? value : escapeHtml(value || "Not published")}</div></div></section>`;
  const join = (values) => (Array.isArray(values) ? values.join(" · ") : values || "Not published");
  const body =
    type === "project"
      ? `<div class="review-hero"><div class="review-hero-mark" aria-hidden="true">↗</div><div><p class="eyebrow">${escapeHtml(item.title || "Project")} / full review</p><p class="review-hero-lede">${escapeHtml(item.challenge || "A public engineering project preview.")}</p><div class="review-chip-row"><span class="review-chip">${escapeHtml(item.employer || "Enterprise engineering")}</span><span class="review-chip">${escapeHtml(item.dates || "Project preview")}</span><span class="review-chip">${escapeHtml(item.domain || "Engineering project")}</span></div></div></div><div class="review-grid">${reviewSection(1, "Business challenge", item.challenge)}${reviewSection(2, "Role", item.role)}${reviewSection(3, "Solution", item.solution)}${reviewSection(4, "Architecture", item.architecture)}${reviewSection(5, "Engineering impact", item.impact)}${reviewSection(6, "Public references", renderReferences(item.references), true)}</div>`
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
  $("#expertise-spheres")?.addEventListener("click", (event) => {
    const button = event.target.closest(".expertise-sphere");
    if (button) toggleExpertise(button.dataset.expertise);
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
    if (event.key === "Escape" && state.expertiseId) setExpertiseActive(null);
    if (event.target.matches(".expertise-sphere")) {
      const spheres = $$(".expertise-sphere");
      const currentIndex = spheres.indexOf(event.target);
      if (event.key === "Escape") {
        event.preventDefault();
        setExpertiseActive(null);
      } else if (["ArrowRight", "ArrowDown"].includes(event.key)) {
        event.preventDefault();
        spheres[(currentIndex + 1) % spheres.length]?.focus();
      } else if (["ArrowLeft", "ArrowUp"].includes(event.key)) {
        event.preventDefault();
        spheres[(currentIndex - 1 + spheres.length) % spheres.length]?.focus();
      }
    }
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
    renderTimeline(state.data.projects);
    renderPreviews();
    selectScenario(state.data.architectures[0]?.id);
    $("#status").textContent =
      `${state.data.projects.length} sanitized projects · publication-approved`;
    setupReveal();
    handleHash();
  } catch (error) {
    $("#status").textContent = "Public content is temporarily unavailable.";
    const experienceBadge = $("#experience-badge");
    if (experienceBadge) {
      experienceBadge.textContent = "Experience timeline";
      experienceBadge.setAttribute("aria-label", "Experience timeline");
    }
    console.error(error);
  }
}

function loadVisitorCount() {
  const visitorCount = $("#visitor-count");
  if (!visitorCount) return;

  visitorCount.textContent = "Visitor count unavailable";
  const counter = window.PdepVisitorCounter;
  const href = typeof window.location?.href === "string" ? window.location.href : "";
  if (counter?.isDemoMode?.(href) === true && typeof counter.demoCount === "function") {
    visitorCount.textContent = `Demo visitors today: ${counter.demoCount()}`;
    return;
  }
  const endpoint = visitorCount.dataset.visitorCounterEndpoint || "";
  if (!endpoint || !counter || typeof counter.fetchCount !== "function") return;

  Promise.resolve()
    .then(() => window.PdepVisitorCounter.fetchCount(endpoint))
    .then((count) => {
      visitorCount.textContent =
        Number.isSafeInteger(count) && count >= 0
          ? `Visitors today: ${count}`
          : "Visitor count unavailable";
    })
    .catch(() => {
      visitorCount.textContent = "Visitor count unavailable";
    });
}

setupInteractions();
renderExpertiseOrbit();
void loadVisitorCount();
load();
