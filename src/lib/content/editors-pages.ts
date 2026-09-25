import type { Editor } from "./editors";
import type { Field } from "./schema";

/** Editors for the Academy, Services, About, Careers and FAQ pages. */

const eyebrow: Field = { type: "text", name: "eyebrow", label: "Eyebrow", hint: "Small gold label above the heading.", max: 80 };
const title: Field = { type: "text", name: "title", label: "Heading", max: 200 };
const copy: Field = { type: "textarea", name: "copy", label: "Intro text", rows: 3, max: 600 };
const visible: Field = { type: "switch", name: "is_visible", label: "Show on site" };
const headingGroup = (name: string, label: string): Field => ({
  type: "group",
  name,
  label,
  columns: 2,
  fields: [eyebrow, title],
});

// ---------------------------------------------------------------------------
// Academy
// ---------------------------------------------------------------------------

export const academyEditors: Editor[] = [
  {
    id: "courses",
    title: "Courses",
    description: "Each course gets its own page at /academy/<url>. Drafts are hidden from the site.",
    preview: "/academy",
    parts: [
      {
        kind: "collection",
        table: "courses",
        list: {
          type: "list",
          name: "items",
          label: "Courses",
          itemLabel: "Course",
          titleField: "title",
          columns: 2,
          max: 40,
          fields: [
            { type: "text", name: "title", label: "Title", max: 120, required: true },
            { type: "slug", name: "slug", label: "URL", prefix: "/academy/" },
            { type: "text", name: "level", label: "Level", placeholder: "Beginner → Pro", max: 60 },
            { type: "text", name: "duration", label: "Duration", placeholder: "16 weeks", max: 60 },
            { type: "text", name: "fee", label: "Fee", placeholder: "Fee on request", max: 60 },
            { type: "text", name: "batch", label: "Batch timing", placeholder: "Mon / Wed / Fri · 6–9 PM", max: 80 },
            { type: "text", name: "trainer", label: "Trainer", max: 80 },
            {
              type: "select",
              name: "status",
              label: "Status",
              options: [
                { value: "published", label: "Published" },
                { value: "draft", label: "Draft (hidden)" },
              ],
            },
            { type: "textarea", name: "summary", label: "Summary", rows: 3, max: 400 },
            { type: "textlist", name: "curriculum", label: "Curriculum", itemLabel: "Module", max: 30, maxLength: 120 },
            { type: "strings", name: "careers", label: "Career routes", placeholder: "Type a role and press Enter", max: 12 },
            {
              type: "image",
              name: "cover_id",
              label: "Page header image",
              hint: "Optional — defaults to the academy image.",
              aspect: "16 / 9",
            },
          ],
        },
      },
    ],
  },
  {
    id: "academy-intro",
    title: "Highlights & course list heading",
    description: "The three highlight cards and the heading above the course grid.",
    preview: "/academy",
    parts: [
      {
        kind: "section",
        key: "academy.highlights",
        title: "Highlights",
        fields: [
          {
            type: "list",
            name: "items",
            label: "Highlights",
            itemLabel: "Highlight",
            titleField: "title",
            max: 6,
            fields: [
              {
                type: "select",
                name: "icon",
                label: "Icon",
                options: [
                  { value: "users", label: "People" },
                  { value: "award", label: "Award" },
                  { value: "clock", label: "Clock" },
                ],
              },
              { type: "text", name: "title", label: "Title", max: 60, required: true },
              { type: "textarea", name: "copy", label: "Text", rows: 2, max: 200 },
            ],
          },
        ],
      },
      { kind: "section", key: "academy.courses", title: "Course list heading", fields: [eyebrow, title, copy] },
    ],
  },
  {
    id: "outcomes",
    title: "Student outcomes",
    description: "Heading and student quotes beside the academy image.",
    preview: "/academy",
    parts: [
      { kind: "section", key: "academy.outcomes", fields: [eyebrow, title] },
      {
        kind: "collection",
        table: "testimonials",
        scope: { placement: "academy_outcomes" },
        title: "Quotes",
        list: {
          type: "list",
          name: "items",
          label: "Quotes",
          itemLabel: "Quote",
          titleField: "author",
          max: 8,
          fields: [
            { type: "textarea", name: "quote", label: "Quote", rows: 2, max: 400 },
            { type: "text", name: "author", label: "Attribution", placeholder: "Fatima Noor · Design, 2025", max: 120, required: true },
            visible,
          ],
        },
      },
    ],
  },
  {
    id: "course-page",
    title: "Course page text",
    description: "Headings and shared copy used on every course page, plus the outcomes image.",
    preview: "/academy/photography-mastery",
    parts: [
      {
        kind: "section",
        key: "academy.detail",
        fields: [
          { type: "text", name: "curriculum", label: "Curriculum heading", max: 60 },
          { type: "text", name: "certification", label: "Certification heading", max: 60 },
          { type: "textarea", name: "certificationCopy", label: "Certification text", rows: 3, max: 600 },
          { type: "text", name: "studentProjects", label: "Student projects heading", max: 60 },
          { type: "textarea", name: "studentProjectsCopy", label: "Student projects text", rows: 3, max: 600 },
          { type: "image", name: "outcomes_image_id", label: "Student outcomes image", aspect: "16 / 10" },
          { type: "text", name: "outcomesImageAlt", label: "Image alt text", max: 200 },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------

export const servicesEditors: Editor[] = [
  {
    id: "service-categories",
    title: "Service catalogue",
    description: "The tabs on the Services page and the services listed under each.",
    preview: "/services",
    parts: [
      {
        kind: "collection",
        table: "service_categories",
        list: {
          type: "list",
          name: "items",
          label: "Categories",
          itemLabel: "Category",
          titleField: "title",
          max: 10,
          fields: [
            { type: "text", name: "title", label: "Title", max: 60, required: true },
            { type: "slug", name: "slug", label: "Anchor", prefix: "/services#", hint: "Used for links straight to this tab." },
            { type: "textarea", name: "intro", label: "Intro", rows: 2, max: 400 },
            { type: "strings", name: "items", label: "Services", placeholder: "Type a service and press Enter", max: 80 },
          ],
        },
      },
    ],
  },
  {
    id: "tiers",
    title: "Engagement tiers",
    description: "The pricing structures.",
    preview: "/services",
    parts: [
      {
        kind: "section",
        key: "services.headings",
        fields: [
          {
            type: "group",
            name: "tiers",
            label: "Heading",
            columns: 2,
            fields: [
              eyebrow,
              title,
              { type: "textarea", name: "copy", label: "Intro text", rows: 2, max: 300 },
              { type: "text", name: "actionLabel", label: "Button label", max: 40 },
              { type: "text", name: "featuredLabel", label: "Featured badge", max: 30 },
            ],
          },
        ],
      },
      {
        kind: "collection",
        table: "engagement_tiers",
        title: "Tiers",
        list: {
          type: "list",
          name: "items",
          label: "Tiers",
          itemLabel: "Tier",
          titleField: "name",
          columns: 2,
          max: 6,
          fields: [
            { type: "text", name: "name", label: "Name", max: 60, required: true },
            { type: "text", name: "audience", label: "For", placeholder: "Most commissions", max: 80 },
            { type: "text", name: "price", label: "Price", placeholder: "Quote in 24h", max: 60 },
            { type: "switch", name: "is_featured", label: "Highlight this tier" },
            { type: "textlist", name: "items", label: "Included", itemLabel: "Item", max: 15, maxLength: 120 },
          ],
        },
      },
    ],
  },
  {
    id: "process",
    title: "Process steps",
    description: "“How a Gilvero project runs.”",
    preview: "/services",
    parts: [
      { kind: "section", key: "services.headings", fields: [headingGroup("process", "Heading")] },
      {
        kind: "collection",
        table: "process_steps",
        title: "Steps",
        list: {
          type: "list",
          name: "items",
          label: "Steps",
          itemLabel: "Step",
          titleField: "title",
          max: 8,
          fields: [
            { type: "text", name: "title", label: "Title", max: 60, required: true },
            { type: "textarea", name: "copy", label: "Text", rows: 2, max: 300 },
          ],
        },
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------

export const aboutEditors: Editor[] = [
  {
    id: "story",
    title: "Story, mission & vision",
    description: "The opening story, the two pillar cards and the studio photo.",
    preview: "/about",
    parts: [
      {
        kind: "section",
        key: "about.story",
        fields: [eyebrow, title, { type: "textlist", name: "paragraphs", label: "Paragraphs", itemLabel: "Paragraph", multiline: true, max: 8 }],
      },
      {
        kind: "section",
        key: "about.headings",
        title: "Studio photo",
        fields: [
          { type: "image", name: "story_image_id", label: "Image", aspect: "4 / 3" },
          { type: "text", name: "storyImageAlt", label: "Image alt text", max: 200 },
        ],
      },
      {
        kind: "section",
        key: "about.mission-vision",
        title: "Mission & vision",
        fields: [
          {
            type: "list",
            name: "items",
            label: "Cards",
            itemLabel: "Card",
            titleField: "title",
            max: 4,
            fields: [
              { type: "text", name: "title", label: "Title", max: 40, required: true },
              { type: "textarea", name: "copy", label: "Text", rows: 2, max: 300 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "values",
    title: "Core values",
    description: "The numbered values on the charcoal band.",
    preview: "/about",
    parts: [
      { kind: "section", key: "about.headings", fields: [headingGroup("values", "Heading")] },
      {
        kind: "section",
        key: "about.values",
        title: "Values",
        fields: [
          {
            type: "list",
            name: "items",
            label: "Values",
            itemLabel: "Value",
            titleField: "title",
            max: 8,
            fields: [
              { type: "text", name: "title", label: "Title", max: 60, required: true },
              { type: "textarea", name: "copy", label: "Text", rows: 2, max: 300 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "founder",
    title: "Founder",
    description: "Portrait, quote and short bio.",
    preview: "/about",
    parts: [
      {
        kind: "section",
        key: "about.founder",
        fields: [
          eyebrow,
          { type: "text", name: "name", label: "Name", max: 80, required: true },
          { type: "text", name: "role", label: "Role", max: 80 },
          { type: "textarea", name: "quote", label: "Quote", rows: 3, max: 500 },
          { type: "textarea", name: "bio", label: "Bio", rows: 3, max: 600 },
          { type: "image", name: "image_id", label: "Portrait", aspect: "4 / 5" },
          { type: "text", name: "imageAlt", label: "Portrait alt text", max: 200 },
        ],
      },
    ],
  },
  {
    id: "team",
    title: "Team",
    description: "Department leads with photos.",
    preview: "/about",
    parts: [
      { kind: "section", key: "about.headings", fields: [headingGroup("team", "Heading")] },
      {
        kind: "collection",
        table: "team_members",
        title: "People",
        list: {
          type: "list",
          name: "items",
          label: "People",
          itemLabel: "Person",
          titleField: "name",
          columns: 2,
          max: 40,
          fields: [
            { type: "text", name: "name", label: "Name", max: 80, required: true },
            { type: "text", name: "role", label: "Role", max: 120 },
            { type: "image", name: "photo_id", label: "Photo", aspect: "4 / 3" },
            visible,
          ],
        },
      },
    ],
  },
  {
    id: "studio-tour",
    title: "Studio tour",
    description: "Captioned gallery of the Creative House.",
    preview: "/about",
    parts: [
      { kind: "section", key: "about.headings", fields: [headingGroup("studioTour", "Heading")] },
      {
        kind: "section",
        key: "about.studio-tour",
        title: "Photos",
        fields: [
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
    ],
  },
  {
    id: "timeline",
    title: "Timeline & equipment",
    description: "Studio history beside the equipment list. Awards are edited on the Homepage.",
    preview: "/about",
    parts: [
      {
        kind: "section",
        key: "about.headings",
        fields: [
          headingGroup("timeline", "Timeline heading"),
          headingGroup("equipment", "Equipment heading"),
          { type: "group", name: "achievements", label: "Awards list", fields: [eyebrow] },
        ],
      },
      {
        kind: "collection",
        table: "timeline_entries",
        title: "Timeline",
        list: {
          type: "list",
          name: "items",
          label: "Milestones",
          itemLabel: "Milestone",
          titleField: "year",
          max: 30,
          fields: [
            { type: "text", name: "year", label: "Year", max: 10, required: true },
            { type: "textarea", name: "text", label: "What happened", rows: 2, max: 300 },
          ],
        },
      },
      {
        kind: "section",
        key: "about.equipment",
        title: "Equipment",
        fields: [{ type: "textlist", name: "items", label: "Equipment", itemLabel: "Item", max: 20, maxLength: 120 }],
      },
    ],
  },
  {
    id: "clients-heading",
    title: "Client list heading",
    description: "The client names themselves are the Brand marquee on the Homepage.",
    preview: "/about",
    parts: [{ kind: "section", key: "about.headings", fields: [headingGroup("clients", "Heading")] }],
  },
];

// ---------------------------------------------------------------------------
// Careers & FAQ
// ---------------------------------------------------------------------------

export const careersEditors: Editor[] = [
  {
    id: "roles",
    title: "Open roles",
    description: "Closed roles are hidden. Applications go to the studio email from Settings.",
    preview: "/careers",
    parts: [
      {
        kind: "section",
        key: "careers.intro",
        fields: [eyebrow, title, copy, { type: "text", name: "applyLabel", label: "Apply link label", max: 40 }],
      },
      {
        kind: "collection",
        table: "open_roles",
        title: "Roles",
        list: {
          type: "list",
          name: "items",
          label: "Roles",
          itemLabel: "Role",
          titleField: "title",
          columns: 2,
          max: 40,
          fields: [
            { type: "text", name: "title", label: "Title", max: 80, required: true },
            { type: "text", name: "team", label: "Team", max: 60 },
            { type: "text", name: "location", label: "Location", placeholder: "Lahore · On-site", max: 60 },
            { type: "text", name: "type", label: "Type", placeholder: "Full-time", max: 40 },
            {
              type: "select",
              name: "status",
              label: "Status",
              options: [
                { value: "published", label: "Open (shown)" },
                { value: "draft", label: "Closed (hidden)" },
              ],
            },
            { type: "textarea", name: "summary", label: "Summary", rows: 3, max: 600 },
          ],
        },
      },
    ],
  },
];

export const faqEditors: Editor[] = [
  {
    id: "faqs",
    title: "Questions",
    description:
      "Grouped by topic on the FAQ page in this order. Ticked questions also appear on the homepage, in the same order.",
    preview: "/faq",
    parts: [
      {
        kind: "collection",
        table: "faqs",
        derive: "faq",
        list: {
          type: "list",
          name: "items",
          label: "Questions",
          itemLabel: "Question",
          titleField: "question",
          columns: 2,
          max: 100,
          fields: [
            { type: "text", name: "topic", label: "Topic", placeholder: "Studio & Delivery", max: 60, required: true },
            { type: "switch", name: "show_on_home", label: "Also on homepage" },
            { type: "text", name: "question", label: "Question", max: 200, required: true },
            { type: "switch", name: "is_visible", label: "Show on site" },
            { type: "textarea", name: "answer", label: "Answer", rows: 4, max: 1500 },
          ],
        },
      },
    ],
  },
];
