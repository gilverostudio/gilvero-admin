import type { Editor, Part } from "./editors";
import type { Field } from "./schema";

/** Editors for the Print Store and for every page's SEO, header, closing banner and page-specific copy. */

const eyebrow: Field = { type: "text", name: "eyebrow", label: "Eyebrow", max: 80 };
const title: Field = { type: "text", name: "title", label: "Heading", max: 200 };
const linkFields: Field[] = [
  { type: "text", name: "label", label: "Label", max: 80, required: true },
  { type: "url", name: "href", label: "Link", placeholder: "/booking", required: true },
];
const visible: Field = { type: "switch", name: "is_visible", label: "Show on site" };
const labelPlaceholder = (label: string, placeholderHint = true): Field => ({
  type: "group",
  name: label,
  label: label[0].toUpperCase() + label.slice(1),
  columns: 2,
  fields: [
    { type: "text", name: "label", label: "Label", max: 80 },
    ...(placeholderHint ? [{ type: "text", name: "placeholder", label: "Placeholder", max: 120 } as Field] : []),
  ],
});

// ---------------------------------------------------------------------------
// Page SEO / header / closing banner
// ---------------------------------------------------------------------------

type PageOptions = {
  header?: "full" | "image";
  actions?: boolean;
  actionLabel?: boolean;
  cta?: boolean;
  /** Placeholders available in detail-page templates. */
  placeholders?: string;
};

function pagePart(slug: string, o: PageOptions): Part {
  const templateHint = o.placeholders ? `Template — use ${o.placeholders}. Items with their own SEO text override this.` : undefined;
  const fields: Field[] = [
    { type: "text", name: "seo_title", label: "Search title", hint: templateHint ?? "Shown in browser tabs and Google results.", max: 160 },
    { type: "textarea", name: "seo_description", label: "Search description", hint: templateHint ?? "About 150 characters works best.", rows: 2, max: 320 },
  ];
  if (o.header === "full") {
    fields.push({
      type: "group",
      name: "header",
      label: "Page header",
      fields: [
        eyebrow,
        title,
        { type: "textarea", name: "copy", label: "Intro text", rows: 2, max: 400 },
        { type: "text", name: "crumb", label: "Breadcrumb label", max: 60 },
        { type: "image", name: "image_id", label: "Background image", aspect: "16 / 7" },
        ...(o.actionLabel ? [{ type: "text", name: "actionLabel", label: "Button label", max: 40 } as Field] : []),
        ...(o.actions
          ? [
              {
                type: "list",
                name: "actions",
                label: "Buttons",
                itemLabel: "Button",
                titleField: "label",
                columns: 3,
                max: 3,
                fields: [
                  ...linkFields,
                  {
                    type: "select",
                    name: "variant",
                    label: "Style",
                    options: [
                      { value: "gold", label: "Gold" },
                      { value: "quiet", label: "Outline" },
                    ],
                  },
                ],
              } as Field,
            ]
          : []),
      ],
    });
  } else if (o.header === "image") {
    fields.push({
      type: "group",
      name: "header",
      label: "Page header",
      hint: "Title and intro come from each item.",
      columns: 2,
      fields: [
        { type: "text", name: "crumb", label: "Breadcrumb label", max: 60 },
        { type: "image", name: "image_id", label: "Default background image", aspect: "16 / 7" },
      ],
    });
  }
  if (o.cta) {
    fields.push({
      type: "group",
      name: "cta",
      label: "Closing banner",
      fields: [
        { type: "text", name: "title", label: "Heading", max: 160 },
        { type: "textarea", name: "copy", label: "Text", rows: 2, max: 300 },
        { type: "group", name: "primary", label: "Primary button", columns: 2, fields: linkFields },
        { type: "group", name: "secondary", label: "Secondary button", columns: 2, fields: linkFields },
      ],
    });
  }
  return { kind: "page", slug, title: "SEO, header & banner", fields };
}

// ---------------------------------------------------------------------------
// Legal documents
// ---------------------------------------------------------------------------

const legalFields: Field[] = [
  { type: "text", name: "updated", label: "“Last updated” line", placeholder: "Last updated · January 2026", max: 80 },
  { type: "textarea", name: "intro", label: "Introduction", rows: 3, max: 2000 },
  {
    type: "list",
    name: "sections",
    label: "Sections",
    itemLabel: "Section",
    titleField: "heading",
    max: 40,
    fields: [
      { type: "text", name: "heading", label: "Heading", max: 160, required: true },
      { type: "textlist", name: "paragraphs", label: "Paragraphs", itemLabel: "Paragraph", multiline: true, max: 20, maxLength: 4000 },
      { type: "textlist", name: "bullets", label: "Bullet points (optional)", itemLabel: "Bullet", max: 30, maxLength: 1000 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Pages & SEO — one editor per page, in site order
// ---------------------------------------------------------------------------

export const pagesEditors: Editor[] = [
  { id: "page-home", title: "Homepage", description: "Search text and closing banner. Sections are edited under Homepage.", preview: "/", parts: [pagePart("home", { cta: true })] },
  { id: "page-about", title: "About", description: "/about", preview: "/about", parts: [pagePart("about", { header: "full", cta: true })] },
  { id: "page-services", title: "Services", description: "/services", preview: "/services", parts: [pagePart("services", { header: "full", actions: true, cta: true })] },
  { id: "page-portfolio", title: "Portfolio", description: "/portfolio", preview: "/portfolio", parts: [pagePart("portfolio", { header: "full", cta: true })] },
  {
    id: "page-portfolio-detail",
    title: "Case study pages",
    description: "Template for every /portfolio/… page.",
    parts: [pagePart("portfolio-detail", { cta: true, placeholders: "{title}, {category}, {client}, {story}" })],
  },
  { id: "page-academy", title: "Academy", description: "/academy", preview: "/academy", parts: [pagePart("academy", { header: "full", actions: true, cta: true })] },
  {
    id: "page-academy-detail",
    title: "Course pages",
    description: "Template for every /academy/… page.",
    parts: [pagePart("academy-detail", { header: "image", placeholders: "{title}, {summary}, {level}, {duration}" })],
  },
  { id: "page-blog", title: "Journal", description: "/blog", preview: "/blog", parts: [pagePart("blog", { header: "full", cta: true })] },
  {
    id: "page-blog-detail",
    title: "Article pages",
    description: "Template for every /blog/… page.",
    parts: [pagePart("blog-detail", { header: "image", cta: true, placeholders: "{title}, {excerpt}, {category}" })],
  },
  { id: "page-store", title: "Print Store", description: "/store — products and options are under Print Store.", preview: "/store", parts: [pagePart("store", { header: "full", actionLabel: true, cta: true })] },
  {
    id: "page-booking",
    title: "Booking",
    description: "/booking — header, form labels, dropdown options and next steps.",
    preview: "/booking",
    parts: [
      pagePart("booking", { header: "full" }),
      {
        kind: "section",
        key: "booking.form",
        title: "Booking form",
        fields: [
          labelPlaceholder("service"),
          { type: "strings", name: "services", label: "Service options", placeholder: "Type an option and press Enter", max: 40 },
          labelPlaceholder("date"),
          labelPlaceholder("city"),
          { type: "strings", name: "cities", label: "City options", placeholder: "Type an option and press Enter", max: 40 },
          labelPlaceholder("budget"),
          { type: "strings", name: "budgets", label: "Budget options", placeholder: "Type an option and press Enter", max: 20 },
          labelPlaceholder("name", false),
          labelPlaceholder("phone", false),
          labelPlaceholder("email", false),
          {
            type: "group",
            name: "reference",
            label: "Reference upload",
            columns: 2,
            fields: [
              { type: "text", name: "label", label: "Label", max: 80 },
              { type: "text", name: "prompt", label: "Prompt", max: 160 },
            ],
          },
          labelPlaceholder("message"),
          { type: "text", name: "submitLabel", label: "Submit button", max: 40 },
          { type: "text", name: "whatsappLabel", label: "WhatsApp button", max: 40 },
          { type: "text", name: "toastMessage", label: "Thank-you message", max: 200 },
        ],
      },
      {
        kind: "section",
        key: "booking.aside",
        title: "What happens next",
        fields: [
          eyebrow,
          { type: "textlist", name: "steps", label: "Steps", itemLabel: "Step", max: 8, maxLength: 200 },
          { type: "text", name: "talkPrompt", label: "Phone prompt", max: 80 },
        ],
      },
    ],
  },
  {
    id: "page-contact",
    title: "Contact",
    description: "/contact — header, enquiry form, contact cards, gallery and map.",
    preview: "/contact",
    parts: [
      pagePart("contact", { header: "full" }),
      {
        kind: "section",
        key: "contact.form",
        title: "Enquiry form",
        fields: [
          eyebrow,
          title,
          {
            type: "group",
            name: "fields",
            label: "Field labels",
            columns: 2,
            fields: [
              { type: "text", name: "name", label: "Name", max: 60 },
              { type: "text", name: "phone", label: "Phone", max: 60 },
              { type: "text", name: "email", label: "Email", max: 60 },
              { type: "text", name: "message", label: "Message", max: 60 },
            ],
          },
          { type: "text", name: "submitLabel", label: "Submit button", max: 40 },
          { type: "text", name: "whatsappLabel", label: "WhatsApp button", max: 40 },
          { type: "text", name: "toastMessage", label: "Thank-you message", max: 200 },
        ],
      },
      {
        kind: "section",
        key: "contact.channels",
        title: "Contact cards",
        fields: [
          {
            type: "list",
            name: "items",
            label: "Cards",
            itemLabel: "Card",
            titleField: "label",
            columns: 2,
            max: 8,
            hint: "Values come from Settings → Contact.",
            fields: [
              { type: "text", name: "label", label: "Label", max: 40, required: true },
              {
                type: "select",
                name: "field",
                label: "Shows",
                options: [
                  { value: "address", label: "Address" },
                  { value: "phone", label: "Phone" },
                  { value: "email", label: "Email" },
                  { value: "whatsapp", label: "WhatsApp link" },
                  { value: "hours", label: "Opening hours" },
                ],
              },
              {
                type: "select",
                name: "icon",
                label: "Icon",
                options: [
                  { value: "map-pin", label: "Pin" },
                  { value: "phone", label: "Phone" },
                  { value: "mail", label: "Mail" },
                  { value: "message-circle", label: "Chat" },
                  { value: "clock", label: "Clock" },
                ],
              },
              { type: "text", name: "text", label: "Custom text", hint: "Optional — replaces the value (e.g. “Message the studio”).", max: 80 },
            ],
          },
        ],
      },
      {
        kind: "section",
        key: "contact.gallery",
        title: "Studio gallery",
        fields: [
          title,
          {
            type: "list",
            name: "items",
            label: "Photos",
            itemLabel: "Photo",
            titleField: "caption",
            columns: 2,
            max: 20,
            fields: [
              { type: "image", name: "image_id", label: "Image", aspect: "4 / 5" },
              { type: "text", name: "caption", label: "Caption", max: 120 },
            ],
          },
        ],
      },
      {
        kind: "section",
        key: "contact.map",
        title: "Map",
        fields: [
          title,
          { type: "url", name: "src", label: "Google Maps embed link", hint: "Google Maps → Share → Embed a map → copy the src link.", required: true },
          { type: "text", name: "iframeTitle", label: "Accessible map title", max: 120 },
        ],
      },
    ],
  },
  { id: "page-careers", title: "Careers", description: "/careers", preview: "/careers", parts: [pagePart("careers", { header: "full", cta: true })] },
  { id: "page-faq", title: "FAQ", description: "/faq", preview: "/faq", parts: [pagePart("faq", { header: "full", cta: true })] },
  {
    id: "page-client-area",
    title: "Client Area",
    description: "/client-area — header, sign-in panel and feature list.",
    preview: "/client-area",
    parts: [
      pagePart("client-area", { header: "full" }),
      {
        kind: "section",
        key: "client-area.sign-in",
        title: "Sign-in panel",
        fields: [
          title,
          { type: "textarea", name: "copy", label: "Text", rows: 2, max: 300 },
          {
            type: "group",
            name: "fields",
            label: "Field labels",
            columns: 2,
            fields: [
              { type: "text", name: "code", label: "Code field", max: 60 },
              { type: "text", name: "password", label: "Password field", max: 60 },
            ],
          },
          { type: "text", name: "submitLabel", label: "Button", max: 40 },
          { type: "text", name: "toastMessage", label: "Message after sign-in attempt", max: 200 },
        ],
      },
      {
        kind: "section",
        key: "client-area.features",
        title: "Features",
        fields: [
          {
            type: "list",
            name: "items",
            label: "Features",
            itemLabel: "Feature",
            titleField: "title",
            max: 8,
            fields: [
              {
                type: "select",
                name: "icon",
                label: "Icon",
                options: [
                  { value: "images", label: "Images" },
                  { value: "file-text", label: "Document" },
                  { value: "download", label: "Download" },
                  { value: "lock", label: "Lock" },
                ],
              },
              { type: "text", name: "title", label: "Title", max: 60, required: true },
              { type: "textarea", name: "copy", label: "Text", rows: 2, max: 200 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "page-privacy",
    title: "Privacy Policy",
    description: "/privacy",
    preview: "/privacy",
    parts: [
      pagePart("privacy", { header: "full" }),
      { kind: "legal", slug: "privacy", title: "Policy text", fields: legalFields },
    ],
  },
  {
    id: "page-terms",
    title: "Terms of Service",
    description: "/terms",
    preview: "/terms",
    parts: [
      pagePart("terms", { header: "full" }),
      { kind: "legal", slug: "terms", title: "Terms text", fields: legalFields },
    ],
  },
];

// ---------------------------------------------------------------------------
// Print store
// ---------------------------------------------------------------------------

export const storeEditors: Editor[] = [
  {
    id: "store-products",
    title: "Products",
    description: "Product cards on the store page.",
    preview: "/store",
    parts: [
      { kind: "section", key: "store.products", fields: [eyebrow, title, { type: "text", name: "addToBasketLabel", label: "Card button label", max: 40 }] },
      {
        kind: "collection",
        table: "store_products",
        title: "Products",
        list: {
          type: "list",
          name: "items",
          label: "Products",
          itemLabel: "Product",
          titleField: "name",
          columns: 2,
          max: 60,
          fields: [
            { type: "text", name: "name", label: "Name", max: 80, required: true },
            { type: "text", name: "price_from", label: "Price", placeholder: "PKR 450", max: 40 },
            { type: "text", name: "note", label: "Note", placeholder: "Museum matte, 310gsm", max: 120 },
            visible,
            { type: "image", name: "image_id", label: "Image", aspect: "16 / 10" },
          ],
        },
      },
    ],
  },
  {
    id: "print-options",
    title: "Print options",
    description: "Sizes, papers and frames in the print configurator.",
    preview: "/store",
    parts: [
      {
        kind: "collection",
        table: "print_options",
        scope: { kind: "size" },
        title: "Sizes",
        list: {
          type: "list",
          name: "items",
          label: "Sizes",
          itemLabel: "Size",
          titleField: "name",
          columns: 2,
          max: 40,
          hint: "Tick one as the size selected when the page opens.",
          fields: [
            { type: "text", name: "name", label: "Size", placeholder: "8×10", max: 40, required: true },
            { type: "switch", name: "is_default", label: "Selected by default" },
          ],
        },
      },
      {
        kind: "collection",
        table: "print_options",
        scope: { kind: "paper" },
        title: "Papers",
        list: {
          type: "list",
          name: "items",
          label: "Papers",
          itemLabel: "Paper",
          titleField: "name",
          max: 20,
          fields: [{ type: "text", name: "name", label: "Paper", placeholder: "Museum Matte 310gsm", max: 80, required: true }],
        },
      },
      {
        kind: "collection",
        table: "print_options",
        scope: { kind: "frame" },
        title: "Frames",
        list: {
          type: "list",
          name: "items",
          label: "Frames",
          itemLabel: "Frame",
          titleField: "name",
          columns: 2,
          max: 20,
          fields: [
            { type: "text", name: "name", label: "Frame", max: 60, required: true },
            { type: "text", name: "note", label: "Note", placeholder: "Oak, walnut, matte black", max: 120 },
          ],
        },
      },
    ],
  },
  {
    id: "store-copy",
    title: "Configurator, upload & tracking",
    description: "Headings, labels and messages for the order section.",
    preview: "/store",
    parts: [
      {
        kind: "section",
        key: "store.configurator",
        title: "Configurator",
        fields: [
          eyebrow,
          title,
          { type: "textarea", name: "copy", label: "Intro text", rows: 2, max: 300 },
          { type: "text", name: "size", label: "Size label", max: 30 },
          { type: "text", name: "paper", label: "Paper label", max: 30 },
          { type: "text", name: "frame", label: "Frame label", max: 30 },
          { type: "text", name: "checkoutLabel", label: "Checkout button", max: 30 },
        ],
      },
      {
        kind: "section",
        key: "store.upload",
        title: "Upload panel",
        fields: [
          { type: "text", name: "title", label: "Title", max: 80 },
          { type: "textarea", name: "copy", label: "Text", rows: 2, max: 200 },
          { type: "text", name: "action", label: "Button", max: 40 },
        ],
      },
      {
        kind: "section",
        key: "store.tracking",
        title: "Order tracking",
        fields: [
          eyebrow,
          title,
          { type: "textlist", name: "steps", label: "Steps", itemLabel: "Step", max: 8, maxLength: 60 },
          { type: "text", name: "note", label: "Note under the steps", max: 200 },
          { type: "text", name: "noteLinkLabel", label: "Client Area link label", max: 40 },
        ],
      },
      {
        kind: "section",
        key: "store.toasts",
        title: "Messages",
        fields: [
          { type: "text", name: "shopNow", label: "After “Shop Now”", max: 160 },
          { type: "text", name: "addToBasket", label: "After adding a product", hint: "{name} is replaced with the product name.", max: 160 },
          { type: "text", name: "chooseFile", label: "After “Choose File”", max: 200 },
          { type: "text", name: "checkout", label: "After checkout", max: 160 },
        ],
      },
    ],
  },
];
