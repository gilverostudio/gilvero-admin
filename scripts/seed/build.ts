/**
 * Pure transform: website content snapshot  →  ordered table inserts.
 *
 * Guarantees
 *   1. Coverage — every export in content.json must be consumed (or explicitly
 *      listed as derived). An unmapped export aborts the seed.
 *   2. Consistency — data the site currently duplicates (home featured work vs
 *      projects, home journal vs posts, home awards vs about awards…) is checked
 *      to be identical before being collapsed into one table.
 */
import { randomUUID } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import path from "node:path";

import { imageSize } from "image-size";

import { componentCopy, mobileExtraLinks, pages as pageSeeds } from "./page-copy";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Marks a value that must be written to a jsonb column. */
export class Json {
  constructor(public readonly value: unknown) {}
}
const json = (value: unknown) => new Json(value);

export type Row = Record<string, unknown>;
export type TableInsert = { table: string; rows: Row[] };

export type MediaSeed = {
  id: string;
  legacyKey: string;
  localFile: string;
  storagePath: string;
  row: Row;
};

export type SeedPlan = {
  media: MediaSeed[];
  inserts: TableInsert[];
  summary: Record<string, number>;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Any = any;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const MONTHS = [
  "january", "february", "march", "april", "may", "june",
  "july", "august", "september", "october", "november", "december",
];

/** "12 July 2026" → "2026-07-12" */
function parseDisplayDate(value: string): string {
  const [day, month, year] = value.trim().split(/\s+/);
  const m = MONTHS.indexOf(month.toLowerCase());
  if (m < 0 || !day || !year) throw new Error(`Unparseable date: "${value}"`);
  return `${year}-${String(m + 1).padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function assertEqual(label: string, a: unknown, b: unknown) {
  if (JSON.stringify(a) !== JSON.stringify(b)) {
    throw new Error(
      `Seed consistency check failed — ${label}\n  A: ${JSON.stringify(a)}\n  B: ${JSON.stringify(b)}`,
    );
  }
}

const ordered = <T, R extends Row>(items: T[], map: (item: T, index: number) => R): (R & { sort_order: number })[] =>
  items.map((item, index) => ({ ...map(item, index), sort_order: index }));

// ---------------------------------------------------------------------------
// Builder
// ---------------------------------------------------------------------------

export function buildSeedPlan(seedDir: string): SeedPlan {
  const content: Any = JSON.parse(readFileSync(path.join(seedDir, "content.json"), "utf8"));

  // ---- coverage tracking --------------------------------------------------
  const consumed = new Set<string>();
  const take = (moduleName: string, exportName: string): Any => {
    const value = content[moduleName]?.[exportName];
    if (value === undefined) throw new Error(`Missing export ${moduleName}.${exportName}`);
    consumed.add(`${moduleName}.${exportName}`);
    return value;
  };
  /** Exports that are computed from other exports on the site — nothing to store. */
  const derived = [
    "academy.courseSlugs",
    "blog.postSlugs",
    "portfolio.projectSlugs",
    "careers.applyEmail", // = siteConfig.email
  ];
  derived.forEach((key) => consumed.add(key));

  // ---- media --------------------------------------------------------------
  const imagePaths: Record<string, string> = take("images", "images");
  const dims: Record<string, { width: number; height: number }> = take("home", "homeImageDimensions");

  const media: MediaSeed[] = Object.entries(imagePaths).map(([key, publicPath]) => {
    const fileName = path.basename(publicPath);
    const localFile = path.join(seedDir, "images", fileName);
    const buffer = readFileSync(localFile);
    const size = imageSize(buffer);
    assertEqual(`image dimensions for "${key}"`, { width: size.width, height: size.height }, dims[key]);
    const id = randomUUID();
    const storagePath = `library/${fileName}`;
    return {
      id,
      legacyKey: key,
      localFile,
      storagePath,
      row: {
        id,
        storage_path: storagePath,
        file_name: fileName,
        mime_type: "image/jpeg",
        size_bytes: statSync(localFile).size,
        width: size.width,
        height: size.height,
        alt: "",
        legacy_key: key,
      },
    };
  });
  const mediaId = (key: string) => {
    const found = media.find((m) => m.legacyKey === key);
    if (!found) throw new Error(`Unknown image key "${key}"`);
    return found.id;
  };
  const gallery = (items: { key: string; caption: string }[]) =>
    items.map((item) => ({ image_id: mediaId(item.key), caption: item.caption }));

  // ---- settings -----------------------------------------------------------
  const siteConfig = take("site-config", "siteConfig");
  const globalSeo = componentCopy.find((c) => c.key === "global.seo")!.data;
  const settingsRow: Row = {
    id: 1,
    name: siteConfig.name,
    legal_name: siteConfig.legalName,
    tagline: siteConfig.tagline,
    title: siteConfig.title,
    description: siteConfig.description,
    url: siteConfig.url,
    phone: siteConfig.phone,
    whatsapp: siteConfig.whatsapp,
    email: siteConfig.email,
    address: siteConfig.address,
    hours: siteConfig.hours,
    social: json(siteConfig.social),
    seo: json(globalSeo),
  };

  // ---- sections (jsonb copy blocks) --------------------------------------
  const sections = new Map<string, { page: string; label: string; data: Record<string, unknown> }>();
  const section = (key: string, label: string, data: Record<string, unknown>) => {
    const page = key.split(".")[0];
    const existing = sections.get(key);
    if (existing) Object.assign(existing.data, data);
    else sections.set(key, { page, label, data: { ...data } });
  };

  // home
  section("home.hero", "Hero", take("home", "homeHero"));
  const servicesOverview = take("home", "servicesOverview");
  section("home.services", "Services overview", {
    eyebrow: servicesOverview.eyebrow,
    title: servicesOverview.title,
    copy: servicesOverview.copy,
    cards: servicesOverview.cards.map((c: Any) => ({ title: c.title, copy: c.copy, image_id: mediaId(c.image) })),
  });
  const featured = take("home", "featuredWorkSection");
  section("home.featured", "Recent commissions", {
    eyebrow: featured.eyebrow,
    title: featured.title,
    copy: featured.copy,
  });
  const filmsSection = take("home", "filmsSection");
  section("home.films", "Latest films", { eyebrow: filmsSection.eyebrow, title: filmsSection.title });
  const academyPreview = take("home", "academyPreview");
  section("home.academy", "Academy preview", {
    eyebrow: academyPreview.eyebrow,
    title: academyPreview.title,
    copy: academyPreview.copy,
    imageAlt: academyPreview.imageAlt,
  });
  const storePreview = take("home", "storePreview");
  section("home.store", "Print atelier preview", {
    ...storePreview,
    image_id: mediaId("store"),
  });
  const testimonialsSection = take("home", "testimonialsSection");
  section("home.testimonials", "Client testimonials", {
    eyebrow: testimonialsSection.eyebrow,
    title: testimonialsSection.title,
  });
  section("home.bts", "Behind the scenes images", {
    image_ids: (take("home", "btsImages") as string[]).map(mediaId),
  });
  const instagram = take("home", "instagramSection");
  section("home.instagram", "Instagram feed", {
    eyebrow: instagram.eyebrow,
    title: instagram.title,
    copy: instagram.copy,
    image_ids: (instagram.images as string[]).map(mediaId),
  });

  // about
  const aboutHeader = take("about", "aboutHeader");
  section("about.story", "Our story", take("about", "story"));
  section("about.mission-vision", "Mission & vision", { items: take("about", "missionVision") });
  section("about.values", "Core values", { items: take("about", "coreValues") });
  section("about.founder", "Founder", { ...take("about", "founder"), image_id: mediaId("fashion") });
  section("about.studio-tour", "Studio tour", { items: gallery(take("about", "studioTour")) });
  section("about.equipment", "Equipment", { items: take("about", "equipment") });

  // academy
  section("academy.highlights", "Highlights", { items: take("academy", "academyHighlights") });
  section("academy.courses", "Courses heading", take("academy", "coursesHeading"));
  section("academy.outcomes", "Student outcomes heading", take("academy", "studentOutcomesHeading"));
  section("academy.detail", "Course page copy", {
    certificationCopy: take("academy", "certificationCopy"),
    studentProjectsCopy: take("academy", "studentProjectsCopy"),
  });

  // booking
  const bookingHeader = take("booking", "bookingHeader");
  section("booking.form", "Booking form", {
    ...take("booking", "bookingForm"),
    services: take("booking", "services"),
    cities: take("booking", "cities"),
    budgets: take("booking", "budgets"),
  });
  section("booking.aside", "What happens next", {
    ...take("booking", "bookingAside"),
    steps: take("booking", "bookingSteps"),
  });

  // careers
  const careersHeader = take("careers", "careersHeader");
  section("careers.intro", "Open roles intro", take("careers", "careersIntro"));

  // client area
  const clientAreaHeader = take("client-area", "clientAreaHeader");
  section("client-area.sign-in", "Sign-in panel", take("client-area", "signIn"));
  section("client-area.features", "Features", { items: take("client-area", "clientFeatures") });

  // contact — channel values come from site settings, so store which field each shows.
  const contactHeader = take("contact", "contactHeader");
  const channelField: Record<string, keyof typeof siteConfig> = {
    "map-pin": "address",
    phone: "phone",
    mail: "email",
    "message-circle": "whatsapp",
    clock: "hours",
  };
  section("contact.channels", "Contact channels", {
    items: (take("contact", "contactChannels") as Any[]).map((c) => {
      const field = channelField[c.icon];
      // Channels whose visible text is the setting itself vs. a custom label.
      const showsSetting = c.value === siteConfig[field];
      return {
        icon: c.icon,
        label: c.label,
        field,
        ...(showsSetting ? {} : { text: c.value }),
        ...(c.external ? { external: true } : {}),
      };
    }),
  });
  section("contact.form", "Enquiry form", take("contact", "contactForm"));
  section("contact.gallery", "Studio gallery", {
    title: take("contact", "studioGalleryTitle"),
    items: gallery(take("contact", "studioGallery")),
  });
  section("contact.map", "Map", take("contact", "mapSection"));

  // faq
  const faqHeader = take("faq", "faqHeader");

  // store
  const storeHeader = take("store", "storeHeader");
  const storeCta = take("store", "storeCta");
  section("store.products", "Products heading", take("store", "productsHeading"));
  section("store.configurator", "Configurator heading", take("store", "configuratorHeading"));
  section("store.upload", "Upload panel", take("store", "uploadPanel"));
  section("store.tracking", "Order tracking", {
    ...take("store", "trackingHeading"),
    steps: take("store", "trackingSteps"),
  });
  section("store.toasts", "Store messages", take("store", "storeToasts"));

  // JSX-only copy (merges into the same keys where they overlap)
  for (const block of componentCopy) {
    if (block.key === "global.seo") continue; // → site_settings.seo
    const data = { ...block.data };
    for (const [k, v] of Object.entries(data)) {
      // image keys → media ids (`image` → `image_id`, `story_image` → `story_image_id`)
      if ((k === "image" || k.endsWith("_image")) && typeof v === "string") {
        delete data[k];
        data[`${k}_id`] = mediaId(v);
      }
    }
    section(block.key, block.label, data);
  }

  // ---- pages --------------------------------------------------------------
  const legal = {
    privacy: take("legal", "privacyPolicy"),
    terms: take("legal", "termsOfService"),
  };
  const headerFromContent: Record<string, Any> = {
    about: aboutHeader,
    booking: bookingHeader,
    careers: careersHeader,
    "client-area": clientAreaHeader,
    contact: contactHeader,
    faq: faqHeader,
    store: storeHeader,
    privacy: { eyebrow: legal.privacy.eyebrow, title: legal.privacy.title, crumbLabel: legal.privacy.crumb },
    terms: { eyebrow: legal.terms.eyebrow, title: legal.terms.title, crumbLabel: legal.terms.crumb },
  };
  const pageRows: Row[] = pageSeeds.map((p) => {
    let header: Any = null;
    if (p.header) {
      const fromContent = headerFromContent[p.slug] ?? {};
      const { crumbLabel, action, ...rest } = fromContent;
      const { image, ...jsxHeader } = p.header;
      header = {
        ...rest,
        ...(crumbLabel ? { crumb: crumbLabel } : {}),
        ...(action ? { actionLabel: action } : {}),
        ...jsxHeader,
        image_id: mediaId(image),
      };
    }
    const cta = p.slug === "store" ? storeCta : p.cta;
    return {
      slug: p.slug,
      seo_title: p.seo_title,
      seo_description: p.seo_description,
      header: header ? json(header) : null,
      cta: cta ? json(cta) : null,
    };
  });

  // ---- navigation ---------------------------------------------------------
  const navigationRows: Row[] = [
    { key: "main", data: json(take("navigation", "mainNav")) },
    { key: "mega", data: json(take("navigation", "megaMenu")) },
    { key: "footer", data: json(take("navigation", "footerNav")) },
    { key: "search", data: json(take("search", "searchLinks")) },
    { key: "mobile", data: json(mobileExtraLinks) },
  ];

  // ---- portfolio ----------------------------------------------------------
  const categoryNames: string[] = (take("portfolio", "portfolioCategories") as string[]).filter((c) => c !== "All");
  const categoryRows = ordered(categoryNames, (name) => ({ id: randomUUID(), name, slug: slugify(name), is_visible: true }));
  const categoryId = (name: string) => {
    const row = categoryRows.find((c) => c.name === name);
    if (!row) throw new Error(`Project category "${name}" is not in portfolioCategories`);
    return row.id;
  };

  const projectsSrc: Any[] = take("portfolio", "projects");
  const featuredWorks: Any[] = featured.works;
  const projectRows = ordered(projectsSrc, (p) => {
    const featuredIndex = featuredWorks.findIndex((w) => w.slug === p.slug);
    if (featuredIndex >= 0) {
      const w = featuredWorks[featuredIndex];
      assertEqual(
        `home featured work "${p.slug}" vs project`,
        { title: w.title, category: w.category, location: w.location, year: w.year, image: w.image },
        { title: p.title, category: p.category, location: p.location, year: p.year, image: p.image },
      );
    }
    return {
      id: randomUUID(),
      slug: p.slug,
      title: p.title,
      category_id: categoryId(p.category),
      client: p.client,
      location: p.location,
      year: p.year,
      cover_id: mediaId(p.image),
      story: p.story,
      challenge: p.challenge,
      solution: p.solution,
      result: p.result,
      services: p.services,
      testimonial_quote: p.testimonial.quote,
      testimonial_author: p.testimonial.author,
      testimonial_role: p.testimonial.role,
      is_featured: featuredIndex >= 0,
      featured_order: Math.max(featuredIndex, 0),
      status: "published",
    };
  });
  for (const w of featuredWorks) {
    if (!projectsSrc.some((p) => p.slug === w.slug)) throw new Error(`Featured work "${w.slug}" has no project`);
  }
  // The live case-study gallery shows: cover, studio, fashion, architecture, product.
  const projectImageRows: Row[] = projectRows.flatMap((p) =>
    [p.cover_id as string, mediaId("studio"), mediaId("fashion"), mediaId("architecture"), mediaId("product")].map(
      (media_id, i) => ({
        id: randomUUID(),
        project_id: p.id,
        media_id,
        caption: `${p.title} — ${String(i + 1).padStart(2, "0")}`,
        sort_order: i,
      }),
    ),
  );

  // ---- films --------------------------------------------------------------
  const filmRows = ordered(filmsSection.films as Any[], (f) => ({
    id: randomUUID(),
    title: f.title,
    duration: f.duration,
    video_url: null,
    thumbnail_id: mediaId(f.image),
    is_visible: true,
  }));

  // ---- journal ------------------------------------------------------------
  const blogCategoryNames = (take("blog", "blogCategories") as string[]).filter((c) => c !== "All");
  const blogCategoryRows = ordered(blogCategoryNames, (name) => ({ id: randomUUID(), name, slug: slugify(name) }));
  const articleBody = take("blog", "articleBody");
  const journalPreview: Any[] = take("home", "journalPreview");
  const postsSrc: Any[] = take("blog", "posts");
  const postRows: Row[] = postsSrc.map((p) => {
    const cat = blogCategoryRows.find((c) => c.name === p.category);
    if (!cat) throw new Error(`Post category "${p.category}" is not in blogCategories`);
    const preview = journalPreview.find((j) => j.slug === p.slug);
    if (preview) {
      assertEqual(
        `home journal "${p.slug}" vs post`,
        preview,
        { slug: p.slug, title: p.title, category: p.category, date: p.date, read: p.read },
      );
    }
    return {
      id: randomUUID(),
      slug: p.slug,
      title: p.title,
      category_id: cat.id,
      published_on: parseDisplayDate(p.date),
      read_time: p.read,
      excerpt: p.excerpt,
      // The live site renders one shared body for every post; each post gets its own editable copy.
      body: json(articleBody),
      cover_id: mediaId("academy"),
      is_featured: Boolean(preview),
      status: "published",
    };
  });
  for (const j of journalPreview) {
    if (!postsSrc.some((p) => p.slug === j.slug)) throw new Error(`Home journal "${j.slug}" has no post`);
  }

  // ---- academy ------------------------------------------------------------
  const courseRows = ordered(take("academy", "courses") as Any[], (c) => ({
    id: randomUUID(),
    slug: c.slug,
    title: c.title,
    level: c.level,
    duration: c.duration,
    fee: c.fee,
    batch: c.batch,
    trainer: c.trainer,
    summary: c.summary,
    curriculum: c.curriculum,
    careers: c.careers,
    status: "published",
  }));

  // ---- testimonials -------------------------------------------------------
  const testimonialRows: Row[] = [
    ...ordered(testimonialsSection.quotes as Any[], (q) => ({
      id: randomUUID(), placement: "home", quote: q.quote, author: q.author, role: q.role,
    })),
    ...ordered(academyPreview.quotes as Any[], (q) => ({
      id: randomUUID(), placement: "academy_home", quote: q.quote, author: q.attribution, role: "",
    })),
    ...ordered(take("academy", "studentOutcomes") as Any[], (q) => ({
      id: randomUUID(), placement: "academy_outcomes", quote: q.quote, author: q.attribution, role: "",
    })),
  ];

  // ---- faq ----------------------------------------------------------------
  const faqPreview: Any[] = take("home", "faqPreview");
  const faqRows: Row[] = (take("faq", "faqGroups") as Any[]).flatMap((group, topicIndex) =>
    (group.items as Any[]).map((item, i) => {
      const homeIndex = faqPreview.findIndex((f) => f.question === item.question);
      if (homeIndex >= 0) assertEqual(`home FAQ "${item.question}"`, faqPreview[homeIndex], item);
      return {
        id: randomUUID(),
        topic: group.topic,
        question: item.question,
        answer: item.answer,
        sort_order: i,
        topic_order: topicIndex,
        show_on_home: homeIndex >= 0,
        home_order: Math.max(homeIndex, 0),
      };
    }),
  );
  for (const f of faqPreview) {
    if (!faqRows.some((r) => r.question === f.question)) {
      throw new Error(`Home FAQ "${f.question}" is not on the FAQ page`);
    }
  }

  // ---- awards / clients (identical on home + about) ----------------------
  const homeAwards = take("home", "awards");
  const aboutAwards = take("about", "awards");
  assertEqual("home awards vs about awards", homeAwards, aboutAwards);
  const awardRows = ordered(homeAwards as Any[], (a) => ({ id: randomUUID(), year: a.year, name: a.name, body: a.body }));

  const marquee = take("home", "marqueeBrands");
  const aboutClients = take("about", "clients");
  assertEqual("home marquee vs about clients", marquee, aboutClients);
  const clientRows = ordered(marquee as string[], (name) => ({ id: randomUUID(), name, is_visible: true }));

  // ---- stats / team / timeline -------------------------------------------
  const statRows = ordered(take("home", "stats") as Any[], (s) => ({ id: randomUUID(), value: s.value, suffix: s.suffix, label: s.label }));
  const teamRows = ordered(take("about", "team") as Any[], (t) => ({
    id: randomUUID(), name: t.name, role: t.role, photo_id: mediaId("studio"), is_visible: true,
  }));
  const timelineRows = ordered(take("about", "timeline") as Any[], (t) => ({ id: randomUUID(), year: t.year, text: t.text }));

  // ---- services -----------------------------------------------------------
  const serviceCategoryRows = ordered(take("services", "serviceCategories") as Any[], (s) => ({
    id: randomUUID(), slug: s.id, title: s.title, intro: s.intro, items: s.items,
  }));
  const tierRows = ordered(take("services", "engagementTiers") as Any[], (t) => ({
    id: randomUUID(), name: t.name, audience: t.for, price: t.price, items: t.items, is_featured: Boolean(t.featured),
  }));
  const processRows = ordered(take("services", "processSteps") as Any[], (p) => ({ id: randomUUID(), title: p.title, copy: p.copy }));

  // ---- careers ------------------------------------------------------------
  const roleRows = ordered(take("careers", "openRoles") as Any[], (r) => ({
    id: randomUUID(), title: r.title, team: r.team, location: r.location, type: r.type, summary: r.summary, status: "published",
  }));

  // ---- store --------------------------------------------------------------
  const productRows = ordered(take("store", "storeProducts") as Any[], (p) => ({
    id: randomUUID(), name: p.name, price_from: p.from, note: p.note, image_id: mediaId("store"), is_visible: true,
  }));
  const defaultSize = take("store", "defaultPrintSize");
  const printOptionRows: Row[] = [
    ...ordered(take("store", "printSizes") as string[], (name) => ({
      id: randomUUID(), kind: "size", name, note: "", is_default: name === defaultSize,
    })),
    ...ordered(take("store", "paperTypes") as string[], (name) => ({
      id: randomUUID(), kind: "paper", name, note: "", is_default: false,
    })),
    ...ordered(take("store", "frameTypes") as Any[], (f) => ({
      id: randomUUID(), kind: "frame", name: f.name, note: f.note, is_default: false,
    })),
  ];

  // ---- legal --------------------------------------------------------------
  const legalRows: Row[] = Object.entries(legal).map(([slug, doc]: [string, Any]) => ({
    slug,
    eyebrow: doc.eyebrow,
    title: doc.title,
    crumb: doc.crumb,
    updated: doc.updated,
    intro: doc.intro,
    sections: json(doc.sections),
  }));

  // ---- coverage check -----------------------------------------------------
  const allExports = Object.entries(content).flatMap(([moduleName, mod]) =>
    Object.keys(mod as object).map((exp) => `${moduleName}.${exp}`),
  );
  const missed = allExports.filter((key) => !consumed.has(key));
  if (missed.length) {
    throw new Error(`Seed coverage check failed — unmapped content exports:\n  ${missed.join("\n  ")}`);
  }

  // ---- assemble (FK-safe order) ------------------------------------------
  const sectionRows: Row[] = [...sections.entries()].map(([key, s]) => ({
    key, page: s.page, label: s.label, data: json(s.data),
  }));

  const inserts: TableInsert[] = [
    { table: "media", rows: media.map((m) => m.row) },
    { table: "site_settings", rows: [settingsRow] },
    { table: "pages", rows: pageRows },
    { table: "site_sections", rows: sectionRows },
    { table: "navigation", rows: navigationRows },
    { table: "portfolio_categories", rows: categoryRows },
    { table: "projects", rows: projectRows },
    { table: "project_images", rows: projectImageRows },
    { table: "films", rows: filmRows },
    { table: "blog_categories", rows: blogCategoryRows },
    { table: "posts", rows: postRows },
    { table: "courses", rows: courseRows },
    { table: "testimonials", rows: testimonialRows },
    { table: "faqs", rows: faqRows },
    { table: "awards", rows: awardRows },
    { table: "clients", rows: clientRows },
    { table: "stats", rows: statRows },
    { table: "team_members", rows: teamRows },
    { table: "timeline_entries", rows: timelineRows },
    { table: "service_categories", rows: serviceCategoryRows },
    { table: "engagement_tiers", rows: tierRows },
    { table: "process_steps", rows: processRows },
    { table: "open_roles", rows: roleRows },
    { table: "store_products", rows: productRows },
    { table: "print_options", rows: printOptionRows },
    { table: "legal_pages", rows: legalRows },
  ];

  return {
    media,
    inserts,
    summary: Object.fromEntries(inserts.map((i) => [i.table, i.rows.length])),
  };
}

/** Tables the seed owns — cleared by `--reset`. Never touches admin_users or submissions. */
export const CONTENT_TABLES = [
  "project_images", "projects", "portfolio_categories", "films", "posts", "blog_categories",
  "courses", "testimonials", "faqs", "awards", "clients", "stats", "team_members",
  "timeline_entries", "service_categories", "engagement_tiers", "process_steps", "open_roles",
  "store_products", "print_options", "legal_pages", "navigation", "site_sections", "pages",
  "site_settings", "media",
];
