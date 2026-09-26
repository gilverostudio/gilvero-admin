/**
 * Copy that is currently hard-coded inside the website's JSX (page files and
 * section components) rather than in `src/content`. Transcribed verbatim so the
 * database holds EVERYTHING the live site shows. Image values are legacy
 * ImageKeys and are resolved to media ids by the seed.
 */

type Link = { label: string; href: string };

export type PageSeed = {
  slug: string;
  seo_title: string;
  seo_description: string;
  header: {
    eyebrow?: string;
    title?: string;
    copy?: string;
    image: string;
    crumb?: string;
    actions?: (Link & { variant: "gold" | "quiet" })[];
  } | null;
  cta: { title?: string; copy?: string; primary?: Link; secondary?: Link } | null;
};

/** The defaults of <CtaBand /> — used wherever a page renders it without props. */
export const defaultCta = {
  title: "Let's make something worth keeping.",
  copy: "Tell us about the project. You will hear back from a producer within one working day.",
  primary: { label: "Book a Shoot", href: "/booking" },
  secondary: { label: "Get a Quote", href: "/contact" },
};

/**
 * Header text that already lives in `src/content` is merged in by the seed
 * (see `headerFromContent`); only what exists solely in JSX is written here.
 */
export const pages: PageSeed[] = [
  {
    slug: "home",
    seo_title: "GILVERO — Capture. Create. Inspire. | Photography, Film & Design",
    seo_description:
      "Gilvero is a luxury creative media company: cinematic photography, film production, brand design, a professional academy and archival fine-art printing.",
    header: null,
    cta: defaultCta,
  },
  {
    slug: "about",
    seo_title: "About Gilvero — Creative Media House in Lahore",
    seo_description:
      "The story, team, studio and equipment behind Gilvero — a premium creative media company built on craft, restraint and repeat clients.",
    header: { image: "studio" },
    cta: { ...defaultCta, title: "Work with the studio." },
  },
  {
    slug: "services",
    seo_title: "Services — Photography, Film & Creative Studio | Gilvero",
    seo_description:
      "Wedding, corporate, product, food, architecture and fashion photography, cinema-grade film production, drone work, branding, design and post production.",
    header: {
      eyebrow: "Services",
      title: "Everything from the first frame to the framed print.",
      copy: "Three disciplines, seventy specialisms, one accountable producer per project.",
      image: "product",
      crumb: "Services",
      actions: [
        { label: "Get a Quote", href: "/booking", variant: "gold" },
        { label: "See the Work", href: "/portfolio", variant: "quiet" },
      ],
    },
    cta: { ...defaultCta, title: "Tell us what you're making." },
  },
  {
    slug: "portfolio",
    seo_title: "Portfolio — Selected Work | Gilvero",
    seo_description:
      "Weddings, campaigns, hospitality, property, fashion and film — selected Gilvero commissions with full case studies.",
    header: {
      eyebrow: "Portfolio",
      title: "Selected work, with the reasoning intact.",
      copy: "Each case study includes the brief, the constraint, the approach and the result.",
      image: "wedding",
      crumb: "Portfolio",
    },
    cta: { ...defaultCta, title: "Your project could be next." },
  },
  {
    slug: "portfolio-detail",
    seo_title: "{title} — {category} Case Study | Gilvero",
    seo_description: "{story}",
    header: null,
    cta: defaultCta,
  },
  {
    slug: "academy",
    seo_title: "Gilvero Academy — Photography, Film & Design Courses",
    seo_description:
      "A professional creative institute: photography, cinematography, editing, design, drone and freelancing courses with certification and placement support.",
    header: {
      eyebrow: "Gilvero Academy",
      title: "Learn the craft inside a working studio.",
      copy: "Small cohorts, real client briefs, industry trainers and a graded portfolio review at the end of every course.",
      image: "academy",
      crumb: "Academy",
      actions: [
        { label: "Enroll Now", href: "/academy", variant: "gold" },
        { label: "Talk to an Advisor", href: "/contact", variant: "quiet" },
      ],
    },
    cta: {
      title: "Applications for the next cohort are open.",
      copy: "Send an application and our academy team will call you within one working day.",
      primary: { label: "Enroll Now", href: "/academy/photography-mastery" },
      secondary: { label: "Contact Academy", href: "/contact" },
    },
  },
  {
    slug: "academy-detail",
    seo_title: "{title} — Gilvero Academy",
    seo_description: "{summary}",
    header: { image: "academy", crumb: "Academy" },
    cta: null,
  },
  {
    slug: "blog",
    seo_title: "Journal — Photography, Editing & Creative Business | Gilvero",
    seo_description:
      "Photography tips, camera reviews, editing technique, pricing and creative business writing from the Gilvero studio.",
    header: {
      eyebrow: "Journal",
      title: "Notes from inside the studio.",
      copy: "Technique, gear, pricing and the occasional set diary — written by the people doing the work.",
      image: "studio",
      crumb: "Journal",
    },
    cta: {
      title: "Want this in your inbox?",
      copy: "One considered email a month — technique, gear and studio notes.",
      primary: { label: "Contact the Studio", href: "/contact" },
      secondary: { label: "Visit the Academy", href: "/academy" },
    },
  },
  {
    slug: "blog-detail",
    seo_title: "{title} — Gilvero Journal",
    seo_description: "{excerpt}",
    header: { image: "academy", crumb: "Journal" },
    cta: defaultCta,
  },
  {
    slug: "store",
    seo_title: "Print Store — Fine Art Prints, Frames & Albums | Gilvero",
    seo_description:
      "Archival photo prints, canvas, acrylic, luxury frames, albums and passport photos. Upload your image, choose size, paper and frame.",
    header: { image: "store", crumb: "Print Store" },
    cta: null, // from content: store.storeCta
  },
  {
    slug: "booking",
    seo_title: "Book a Shoot — Gilvero Creative Media",
    seo_description:
      "Book photography, film or design work with Gilvero. Choose service, date, city and budget — a producer replies within one working day.",
    header: { image: "wedding" },
    cta: null,
  },
  {
    slug: "contact",
    seo_title: "Contact Gilvero — Studio in Lahore | Enquiries & Quotes",
    seo_description:
      "Call, WhatsApp, email or visit the Gilvero Creative House in Lahore. Written quotes within one working day.",
    header: { image: "studio" },
    cta: null,
  },
  {
    slug: "careers",
    seo_title: "Careers — Join the Gilvero Team",
    seo_description:
      "Open roles at Gilvero Creative House in Lahore — photographers, cinematographers, retouchers, producers and Academy trainers. Send a portfolio and join the credits.",
    header: { image: "studio", crumb: "Careers" },
    cta: {
      title: "Don't see your role?",
      copy: "We keep a shortlist for every discipline. Send a portfolio, tell us what you'd own, and we will reach out when the seat opens.",
      primary: { label: "Contact the Studio", href: "/contact" },
      secondary: { label: "About Gilvero", href: "/about" },
    },
  },
  {
    slug: "faq",
    seo_title: "FAQ — Studio, Academy & Print Questions | Gilvero",
    seo_description:
      "Answers to the questions we hear most — engagement pricing, travel, delivery timelines, RAW files, Academy courses, certificates, print orders and client galleries.",
    header: { image: "studio", crumb: "FAQ" },
    cta: {
      title: "Still weighing something up?",
      copy: "If your question isn't answered here, a producer will answer it directly — usually within one working day.",
      primary: { label: "Book a Shoot", href: "/booking" },
      secondary: { label: "Ask the Studio", href: "/contact" },
    },
  },
  {
    slug: "client-area",
    seo_title: "Client Area — Private Galleries & Downloads | Gilvero",
    seo_description:
      "Sign in to view private galleries, approve selects, download final files and track print orders.",
    header: { image: "studio" },
    cta: null,
  },
  {
    slug: "privacy",
    seo_title: "Privacy Policy | Gilvero",
    seo_description:
      "How Gilvero Creative Media collects, uses and protects your information — bookings, client galleries, Academy enrolment, print orders and your rights over your data.",
    header: { image: "studio" },
    cta: null,
  },
  {
    slug: "terms",
    seo_title: "Terms of Service | Gilvero",
    seo_description:
      "The terms that govern Gilvero engagements — bookings and retainers, payments, delivery timelines, image rights and usage licences, Academy enrolment and print orders.",
    header: { image: "studio" },
    cta: null,
  },
];

/** Section headings / labels / alt text hard-coded in section components. */
export const componentCopy: { key: string; page: string; label: string; data: Record<string, unknown> }[] = [
  {
    key: "global.header",
    page: "global",
    label: "Header & mobile menu",
    data: { bookLabel: "Book a Shoot", bookHref: "/booking" },
  },
  {
    key: "global.search",
    page: "global",
    label: "Search dialog",
    data: {
      title: "Search Gilvero",
      placeholder: "Services, courses, prints, projects…",
      empty: "Nothing found.",
    },
  },
  {
    key: "global.newsletter",
    page: "global",
    label: "Footer newsletter",
    data: {
      placeholder: "Email address",
      toastMessage: "Subscribed — welcome to the Gilvero journal.",
    },
  },
  {
    key: "global.footer",
    page: "global",
    label: "Footer",
    data: {
      blurb:
        "A premium creative media house — photography, film, design, education and archival print, under one roof.",
      contactTitle: "Studio",
      privacyLabel: "Privacy",
      termsLabel: "Terms",
    },
  },
  {
    key: "global.floating",
    page: "global",
    label: "Floating WhatsApp button",
    data: { whatsappLabel: "WhatsApp" },
  },
  {
    key: "global.not-found",
    page: "global",
    label: "404 page",
    data: {
      eyebrow: "Error 404",
      title: "This frame doesn't exist.",
      copy: "The page has been moved, retired, or never made the final cut. Let's get you back to the work.",
      homeLabel: "Back to Home",
      portfolioLabel: "View Portfolio",
    },
  },
  {
    key: "global.seo",
    page: "global",
    label: "Default social sharing",
    data: {
      ogTitle: "GILVERO — Capture. Create. Inspire.",
      ogDescription: "Capture. Create. Inspire. Photography, film, design, academy and print.",
      organizationDescription:
        "Premium creative media company offering photography, cinematography, design, creative education and professional printing.",
      addressLocality: "Lahore",
      addressCountry: "PK",
    },
  },
  {
    key: "home.hero",
    page: "home",
    label: "Hero headline & buttons",
    data: {
      headline: ["Capture. Create.", "Inspire."],
      image: "hero",
      imageAlt: "Gilvero cinematographer on set in a darkened studio",
      actions: [
        { label: "Book a Shoot", href: "/booking", variant: "gold" },
        { label: "View Portfolio", href: "/portfolio", variant: "hero" },
        { label: "Join Academy", href: "/academy", variant: "quiet" },
        { label: "Shop Prints", href: "/store", variant: "quiet" },
      ],
    },
  },
  {
    key: "home.academy",
    page: "home",
    label: "Academy preview buttons",
    data: {
      image: "academy",
      primary: { label: "Enroll Now", href: "/academy" },
      secondary: { label: "View Courses", href: "/academy" },
    },
  },
  { key: "home.services", page: "home", label: "Services overview", data: { linkLabel: "All Services", cardLinkLabel: "Explore" } },
  { key: "home.featured", page: "home", label: "Recent commissions", data: { linkLabel: "Full Portfolio" } },
  { key: "home.store", page: "home", label: "Print atelier preview", data: { linkLabel: "Shop Prints" } },
  {
    key: "home.recognition",
    page: "home",
    label: "Awards & behind the scenes headings",
    data: {
      awardsEyebrow: "Recognition",
      awardsTitle: "Awards & features",
      btsEyebrow: "Behind the scenes",
      btsTitle: "Inside the studio",
      btsImageAlt: "Behind the scenes at Gilvero",
    },
  },
  {
    key: "home.journal-faq",
    page: "home",
    label: "Journal & FAQ headings",
    data: {
      journalEyebrow: "Journal",
      journalTitle: "Latest writing",
      faqEyebrow: "Questions",
      faqTitle: "Before you enquire",
      faqLink: { label: "All FAQs", href: "/faq" },
    },
  },
  {
    key: "home.instagram",
    page: "home",
    label: "Instagram image alt",
    data: { imageAlt: "Instagram post" },
  },
  {
    key: "about.headings",
    page: "about",
    label: "Section headings",
    data: {
      story_image: "studio",
      storyImageAlt: "Gilvero studio interior",
      values: { eyebrow: "Core values", title: "Four things we don't negotiate" },
      team: { eyebrow: "The team", title: "Twenty-two people. No freelance roulette." },
      studioTour: { eyebrow: "Studio tour", title: "Where the work happens" },
      timeline: { eyebrow: "Timeline", title: "Ten years, briefly" },
      equipment: { eyebrow: "Equipment", title: "Owned, not rented" },
      achievements: { eyebrow: "Achievements" },
      clients: { eyebrow: "Clients", title: "Selected client list" },
    },
  },
  {
    key: "academy.detail",
    page: "academy",
    label: "Course page headings",
    data: {
      curriculum: "Curriculum",
      certification: "Certification & careers",
      studentProjects: "Student projects",
      applyEyebrow: "Apply",
      applyTitle: "Reserve a seat",
      applyToast: "Application received. Our academy team will call you shortly.",
      backLabel: "Back to Courses",
      outcomes_image: "academy",
      outcomesImageAlt: "Academy studio session",
    },
  },
  {
    key: "blog.detail",
    page: "blog",
    label: "Article page links",
    data: {
      allLabel: "All articles",
      academyLabel: "Learn this at the Academy",
    },
  },
  {
    key: "portfolio.detail",
    page: "portfolio",
    label: "Case study headings",
    data: { galleryTitle: "Gallery", moreTitle: "More work", allLabel: "All projects", backLabel: "Portfolio" },
  },
  {
    key: "services.headings",
    page: "services",
    label: "Tiers & process headings",
    data: {
      tiers: {
        eyebrow: "Engagement",
        title: "Three ways to work with us",
        copy: "Indicative structures only — every project is quoted on scope, crew and delivery.",
        actionLabel: "Get a Quote",
        featuredLabel: "Most chosen",
      },
      process: { eyebrow: "Process", title: "How a Gilvero project runs" },
    },
  },
  { key: "careers.intro", page: "careers", label: "Open roles intro", data: { applyLabel: "Apply for this role" } },
  {
    key: "store.configurator",
    page: "store",
    label: "Configurator labels",
    data: { size: "Size", paper: "Paper", frame: "Frame", checkoutLabel: "Checkout" },
  },
  { key: "store.products", page: "store", label: "Products heading", data: { addToBasketLabel: "Add to Basket" } },
  {
    key: "store.tracking",
    page: "store",
    label: "Order tracking",
    data: { note: "Existing customers can track live status inside the", noteLinkLabel: "Client Area" },
  },
  { key: "booking.form", page: "booking", label: "Booking form", data: { name: { label: "Name" } } },
  {
    key: "academy.detail",
    page: "academy",
    label: "Course page copy",
    data: {
      applyFields: {
        name: "Full name",
        phone: "Phone",
        email: "Email",
        message: "Anything we should know?",
        submit: "Submit Application",
      },
    },
  },
];

/** Extra links appended to the main nav in the mobile menu (hard-coded in mobile-menu.tsx). */
export const mobileExtraLinks = [
  { label: "Booking", href: "/booking" },
  { label: "Client Area", href: "/client-area" },
  { label: "FAQ", href: "/faq" },
  { label: "Careers", href: "/careers" },
];
