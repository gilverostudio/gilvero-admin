import { aboutEditors, academyEditors, careersEditors, faqEditors, servicesEditors } from "./editors-pages";
import type { Field } from "./schema";

/**
 * Where an editor part reads from and writes to. The server only ever acts on
 * parts looked up from this registry by id — table names never come from the browser.
 */
export type Part =
  | { kind: "section"; key: string; title?: string; fields: Field[] }
  | {
      kind: "collection";
      table:
        | "clients"
        | "films"
        | "stats"
        | "testimonials"
        | "awards"
        | "courses"
        | "service_categories"
        | "engagement_tiers"
        | "process_steps"
        | "team_members"
        | "timeline_entries"
        | "open_roles"
        | "faqs";
      /** Fixed column values for this list (e.g. testimonials placement). */
      scope?: Record<string, string>;
      /** Extra ordering columns computed on save (FAQ topic / homepage order). */
      derive?: "faq";
      title?: string;
      list: Extract<Field, { type: "list" }>;
    }
  | { kind: "pageCta"; slug: string; title?: string; fields: Field[] }
  | { kind: "settings"; title?: string; fields: Field[] }
  | { kind: "navigation"; key: string; title?: string; fields: Field[]; /** data is an array stored under this field */ arrayField?: string };

export type Editor = {
  id: string;
  title: string;
  description: string;
  parts: Part[];
  /** Website path to preview the result. */
  preview?: string;
};

// ---------------------------------------------------------------------------
// Reusable field sets
// ---------------------------------------------------------------------------

const eyebrow: Field = { type: "text", name: "eyebrow", label: "Eyebrow", hint: "Small gold label above the heading.", max: 80 };
const title: Field = { type: "text", name: "title", label: "Heading", max: 200 };
const copy: Field = { type: "textarea", name: "copy", label: "Intro text", rows: 3, max: 600 };
const linkFields: Field[] = [
  { type: "text", name: "label", label: "Label", max: 80, required: true },
  { type: "url", name: "href", label: "Link", placeholder: "/services", required: true },
];
const linkList = (name: string, label: string, itemLabel = "Link", max = 20): Field => ({
  type: "list",
  name,
  label,
  itemLabel,
  titleField: "label",
  columns: 2,
  max,
  fields: linkFields,
});
const visible: Field = { type: "switch", name: "is_visible", label: "Show on site" };

// ---------------------------------------------------------------------------
// Homepage (in page order)
// ---------------------------------------------------------------------------

export const homepageEditors: Editor[] = [
  {
    id: "hero",
    title: "Hero",
    description: "The full-screen opening: headline, intro, background and buttons.",
    preview: "/",
    parts: [
      {
        kind: "section",
        key: "home.hero",
        fields: [
          eyebrow,
          { type: "lines", name: "headline", label: "Headline", lineLabels: ["Line 1", "Line 2 (gold)"], max: 60 },
          { type: "textarea", name: "description", label: "Intro text", rows: 3, max: 400 },
          { type: "image", name: "image_id", label: "Background image", aspect: "16 / 9" },
          { type: "text", name: "imageAlt", label: "Image alt text", max: 200 },
          {
            type: "list",
            name: "actions",
            label: "Buttons",
            itemLabel: "Button",
            titleField: "label",
            columns: 3,
            max: 4,
            fields: [
              ...linkFields,
              {
                type: "select",
                name: "variant",
                label: "Style",
                options: [
                  { value: "gold", label: "Gold (primary)" },
                  { value: "hero", label: "Glass with play icon" },
                  { value: "quiet", label: "Outline" },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "brands",
    title: "Brand marquee",
    description: "Client names scrolling under the hero. Also used for the About page client list.",
    parts: [
      {
        kind: "collection",
        table: "clients",
        list: {
          type: "list",
          name: "items",
          label: "Brands",
          itemLabel: "Brand",
          titleField: "name",
          columns: 2,
          max: 60,
          fields: [{ type: "text", name: "name", label: "Name", max: 60, required: true }, visible],
        },
      },
    ],
  },
  {
    id: "services",
    title: "Services overview",
    description: "“Four disciplines. One standard.” — the image cards.",
    parts: [
      {
        kind: "section",
        key: "home.services",
        fields: [
          eyebrow,
          title,
          copy,
          { type: "text", name: "linkLabel", label: "Button label", placeholder: "All Services", max: 40 },
          {
            type: "list",
            name: "cards",
            label: "Cards",
            itemLabel: "Card",
            titleField: "title",
            max: 8,
            fields: [
              { type: "text", name: "title", label: "Title", max: 80, required: true },
              { type: "textarea", name: "copy", label: "Text", rows: 2, max: 300 },
              { type: "image", name: "image_id", label: "Image", aspect: "16 / 11" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "featured",
    title: "Recent commissions",
    description: "Heading for the featured projects. Choose and order the projects in Portfolio.",
    parts: [
      {
        kind: "section",
        key: "home.featured",
        fields: [eyebrow, title, copy, { type: "text", name: "linkLabel", label: "Button label", placeholder: "Full Portfolio", max: 40 }],
      },
    ],
  },
  {
    id: "films",
    title: "Latest films",
    description: "Film cards with play buttons. Add a video link to make a card clickable.",
    parts: [
      { kind: "section", key: "home.films", fields: [eyebrow, title] },
      {
        kind: "collection",
        table: "films",
        list: {
          type: "list",
          name: "items",
          label: "Films",
          itemLabel: "Film",
          titleField: "title",
          max: 12,
          fields: [
            { type: "text", name: "title", label: "Title", max: 140, required: true },
            { type: "text", name: "duration", label: "Duration", placeholder: "04:11", max: 20 },
            { type: "url", name: "video_url", label: "Video link", placeholder: "https://youtube.com/…", hint: "Optional — YouTube, Vimeo, etc." },
            { type: "image", name: "thumbnail_id", label: "Thumbnail", aspect: "16 / 9" },
            visible,
          ],
        },
      },
    ],
  },
  {
    id: "academy",
    title: "Academy preview",
    description: "Image, intro, student quotes and buttons.",
    parts: [
      {
        kind: "section",
        key: "home.academy",
        fields: [
          eyebrow,
          title,
          copy,
          { type: "image", name: "image_id", label: "Image", aspect: "16 / 10" },
          { type: "text", name: "imageAlt", label: "Image alt text", max: 200 },
          { type: "group", name: "primary", label: "Primary button", columns: 2, fields: linkFields },
          { type: "group", name: "secondary", label: "Secondary button", columns: 2, fields: linkFields },
        ],
      },
      {
        kind: "collection",
        table: "testimonials",
        scope: { placement: "academy_home" },
        title: "Student quotes",
        list: {
          type: "list",
          name: "items",
          label: "Quotes",
          itemLabel: "Quote",
          titleField: "author",
          max: 6,
          fields: [
            { type: "textarea", name: "quote", label: "Quote", rows: 2, max: 400 },
            { type: "text", name: "author", label: "Attribution", placeholder: "Ahsan Raza · Class of 2024", max: 120, required: true },
            visible,
          ],
        },
      },
    ],
  },
  {
    id: "store",
    title: "Print atelier preview",
    description: "Image and headline products for the print store.",
    parts: [
      {
        kind: "section",
        key: "home.store",
        fields: [
          eyebrow,
          title,
          copy,
          { type: "text", name: "linkLabel", label: "Button label", placeholder: "Shop Prints", max: 40 },
          { type: "image", name: "image_id", label: "Image", aspect: "16 / 10" },
          { type: "text", name: "imageAlt", label: "Image alt text", max: 200 },
          {
            type: "list",
            name: "products",
            label: "Products",
            itemLabel: "Product",
            titleField: "name",
            columns: 2,
            max: 8,
            fields: [
              { type: "text", name: "name", label: "Name", max: 80, required: true },
              { type: "text", name: "price", label: "Price", placeholder: "from PKR 450", max: 40 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "stats",
    title: "Stats",
    description: "The four counters that animate on scroll.",
    parts: [
      {
        kind: "collection",
        table: "stats",
        list: {
          type: "list",
          name: "items",
          label: "Stats",
          itemLabel: "Stat",
          titleField: "label",
          columns: 3,
          max: 8,
          fields: [
            { type: "number", name: "value", label: "Number", min: 0, max: 100000000 },
            { type: "text", name: "suffix", label: "Suffix", placeholder: "+", max: 6 },
            { type: "text", name: "label", label: "Label", max: 60, required: true },
          ],
        },
      },
    ],
  },
  {
    id: "testimonials",
    title: "Client testimonials",
    description: "“What they said afterwards.”",
    parts: [
      { kind: "section", key: "home.testimonials", fields: [eyebrow, title] },
      {
        kind: "collection",
        table: "testimonials",
        scope: { placement: "home" },
        list: {
          type: "list",
          name: "items",
          label: "Testimonials",
          itemLabel: "Testimonial",
          titleField: "author",
          max: 12,
          fields: [
            { type: "textarea", name: "quote", label: "Quote", rows: 3, max: 500 },
            { type: "text", name: "author", label: "Name", max: 80, required: true },
            { type: "text", name: "role", label: "Role", placeholder: "Brand Director, Aurum", max: 120 },
            visible,
          ],
        },
      },
    ],
  },
  {
    id: "recognition",
    title: "Awards & behind the scenes",
    description: "Awards list (also on the About page) beside the studio image grid.",
    parts: [
      {
        kind: "section",
        key: "home.recognition",
        fields: [
          { type: "text", name: "awardsEyebrow", label: "Awards eyebrow", max: 80 },
          { type: "text", name: "awardsTitle", label: "Awards heading", max: 120 },
          { type: "text", name: "btsEyebrow", label: "Studio eyebrow", max: 80 },
          { type: "text", name: "btsTitle", label: "Studio heading", max: 120 },
          { type: "text", name: "btsImageAlt", label: "Studio image alt text", max: 200 },
        ],
      },
      {
        kind: "collection",
        table: "awards",
        title: "Awards",
        list: {
          type: "list",
          name: "items",
          label: "Awards",
          itemLabel: "Award",
          titleField: "name",
          columns: 3,
          max: 30,
          fields: [
            { type: "text", name: "year", label: "Year", max: 10, required: true },
            { type: "text", name: "name", label: "Award", max: 120, required: true },
            { type: "text", name: "body", label: "Awarded by", max: 120 },
          ],
        },
      },
      { kind: "section", key: "home.bts", title: "Studio images", fields: [{ type: "images", name: "image_ids", label: "Images", max: 8 }] },
    ],
  },
  {
    id: "instagram",
    title: "Instagram grid",
    description: "Tiles link to the Instagram profile set in Settings.",
    parts: [
      {
        kind: "section",
        key: "home.instagram",
        fields: [
          eyebrow,
          title,
          copy,
          { type: "images", name: "image_ids", label: "Images", hint: "12 fills two rows on desktop.", max: 24 },
          { type: "text", name: "imageAlt", label: "Image alt text", max: 200 },
        ],
      },
    ],
  },
  {
    id: "journal-faq",
    title: "Journal & FAQ headings",
    description: "Headings above the latest articles and common questions.",
    parts: [
      {
        kind: "section",
        key: "home.journal-faq",
        fields: [
          { type: "text", name: "journalEyebrow", label: "Journal eyebrow", max: 80 },
          { type: "text", name: "journalTitle", label: "Journal heading", max: 120 },
          { type: "text", name: "faqEyebrow", label: "FAQ eyebrow", max: 80 },
          { type: "text", name: "faqTitle", label: "FAQ heading", max: 120 },
          { type: "group", name: "faqLink", label: "FAQ button", columns: 2, fields: linkFields },
        ],
      },
    ],
  },
  {
    id: "cta",
    title: "Closing call to action",
    description: "The band at the bottom of the homepage.",
    parts: [
      {
        kind: "pageCta",
        slug: "home",
        fields: [
          title,
          copy,
          { type: "group", name: "primary", label: "Primary button", columns: 2, fields: linkFields },
          { type: "group", name: "secondary", label: "Secondary button", columns: 2, fields: linkFields },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export const settingsEditors: Editor[] = [
  {
    id: "identity",
    title: "Brand & search",
    description: "Studio name, browser title and how the site appears on Google and when shared.",
    parts: [
      {
        kind: "settings",
        fields: [
          { type: "text", name: "name", label: "Brand name", max: 40, required: true },
          { type: "text", name: "legal_name", label: "Legal name", hint: "Shown in the footer copyright.", max: 120, required: true },
          { type: "text", name: "tagline", label: "Tagline", max: 80, required: true },
          { type: "url", name: "url", label: "Website address", required: true },
          { type: "text", name: "title", label: "Default page title", max: 120, required: true },
          { type: "textarea", name: "description", label: "Default description", rows: 3, max: 300 },
          {
            type: "group",
            name: "seo",
            label: "Social sharing & structured data",
            fields: [
              { type: "text", name: "ogTitle", label: "Share title", max: 120 },
              { type: "textarea", name: "ogDescription", label: "Share description", rows: 2, max: 300 },
              { type: "textarea", name: "organizationDescription", label: "Organisation description (Google)", rows: 2, max: 400 },
              { type: "text", name: "addressLocality", label: "City", max: 60 },
              { type: "text", name: "addressCountry", label: "Country code", placeholder: "PK", max: 4 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "contact",
    title: "Contact & social",
    description: "Used in the footer, contact page, booking page and floating buttons.",
    parts: [
      {
        kind: "settings",
        fields: [
          { type: "text", name: "phone", label: "Phone", max: 40, required: true },
          { type: "url", name: "whatsapp", label: "WhatsApp link", placeholder: "https://wa.me/923000000000", required: true },
          { type: "text", name: "email", label: "Email", max: 120, required: true },
          { type: "text", name: "address", label: "Address", max: 200, required: true },
          { type: "text", name: "hours", label: "Opening hours", max: 80, required: true },
          {
            type: "group",
            name: "social",
            label: "Social profiles",
            hint: "Leave a profile as # to hide its icon.",
            fields: [
              { type: "url", name: "instagram", label: "Instagram" },
              { type: "url", name: "youtube", label: "YouTube" },
              { type: "url", name: "linkedin", label: "LinkedIn" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "main-nav",
    title: "Header menu",
    description: "Top navigation links. The link that matches the mega menu's button opens the mega menu.",
    parts: [
      { kind: "navigation", key: "main", arrayField: "items", fields: [linkList("items", "Links", "Link", 12)] },
      {
        kind: "navigation",
        key: "mobile",
        arrayField: "items",
        title: "Extra links in the mobile menu",
        fields: [linkList("items", "Links", "Link", 12)],
      },
      {
        kind: "section",
        key: "global.header",
        title: "Header button",
        fields: [
          { type: "text", name: "bookLabel", label: "Button label", max: 40, required: true },
          { type: "url", name: "bookHref", label: "Button link", required: true },
        ],
      },
    ],
  },
  {
    id: "mega",
    title: "Services mega menu",
    description: "The panel that opens under “Services”.",
    parts: [
      {
        kind: "navigation",
        key: "mega",
        fields: [
          {
            type: "group",
            name: "intro",
            label: "Intro",
            fields: [
              eyebrow,
              { type: "textarea", name: "description", label: "Text", rows: 2, max: 300 },
              { type: "group", name: "cta", label: "Button", columns: 2, fields: linkFields },
            ],
          },
          {
            type: "list",
            name: "columns",
            label: "Columns",
            itemLabel: "Column",
            titleField: "title",
            max: 4,
            fields: [{ type: "text", name: "title", label: "Column title", max: 60, required: true }, linkList("links", "Links", "Link", 12)],
          },
        ],
      },
    ],
  },
  {
    id: "footer",
    title: "Footer",
    description: "Footer text and link columns.",
    parts: [
      {
        kind: "section",
        key: "global.footer",
        fields: [
          { type: "textarea", name: "blurb", label: "Studio description", rows: 2, max: 300 },
          { type: "text", name: "contactTitle", label: "Contact column title", max: 40 },
          { type: "text", name: "privacyLabel", label: "Privacy link label", max: 40 },
          { type: "text", name: "termsLabel", label: "Terms link label", max: 40 },
        ],
      },
      {
        kind: "navigation",
        key: "footer",
        arrayField: "items",
        title: "Link columns",
        fields: [
          {
            type: "list",
            name: "items",
            label: "Columns",
            itemLabel: "Column",
            titleField: "title",
            max: 4,
            fields: [{ type: "text", name: "title", label: "Column title", max: 60, required: true }, linkList("links", "Links", "Link", 10)],
          },
        ],
      },
      {
        kind: "section",
        key: "global.newsletter",
        title: "Newsletter",
        fields: [
          { type: "text", name: "placeholder", label: "Email placeholder", max: 60 },
          { type: "text", name: "toastMessage", label: "Thank-you message", max: 160 },
        ],
      },
    ],
  },
  {
    id: "search",
    title: "Search & small print",
    description: "Search dialog quick links, floating WhatsApp button and the 404 page.",
    parts: [
      {
        kind: "section",
        key: "global.search",
        fields: [
          { type: "text", name: "title", label: "Dialog title", max: 60 },
          { type: "text", name: "placeholder", label: "Placeholder", max: 80 },
          { type: "text", name: "empty", label: "No results message", max: 80 },
        ],
      },
      { kind: "navigation", key: "search", arrayField: "items", title: "Quick links", fields: [linkList("items", "Links", "Link", 30)] },
      {
        kind: "section",
        key: "global.floating",
        title: "Floating WhatsApp button",
        fields: [{ type: "text", name: "whatsappLabel", label: "Button label", max: 30 }],
      },
      {
        kind: "section",
        key: "global.not-found",
        title: "404 page",
        fields: [
          { type: "text", name: "eyebrow", label: "Eyebrow", max: 40 },
          { type: "text", name: "title", label: "Message", max: 120 },
          { type: "textarea", name: "copy", label: "Text", rows: 2, max: 300 },
          { type: "text", name: "homeLabel", label: "Home button label", max: 40 },
          { type: "text", name: "portfolioLabel", label: "Portfolio button label", max: 40 },
        ],
      },
    ],
  },
];

const allEditors = [
  ...homepageEditors,
  ...settingsEditors,
  ...academyEditors,
  ...servicesEditors,
  ...aboutEditors,
  ...careersEditors,
  ...faqEditors,
];
const registry = new Map(allEditors.map((e) => [e.id, e]));
if (registry.size !== allEditors.length) throw new Error("Duplicate editor id in lib/content/editors");

export function getEditorPart(editorId: string, partIndex: number): Part | undefined {
  return registry.get(editorId)?.parts[partIndex];
}
