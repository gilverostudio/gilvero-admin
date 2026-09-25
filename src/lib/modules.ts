import {
  Briefcase,
  Building2,
  CircleHelp,
  FileText,
  GraduationCap,
  House,
  Images,
  Inbox,
  LayoutDashboard,
  Newspaper,
  Printer,
  Settings,
  Sparkles,
  SwatchBook,
  type LucideIcon,
} from "lucide-react";

export type AdminModule = {
  slug: string;
  label: string;
  icon: LucideIcon;
  /** Build phase in which the editor ships. 0 = available now. */
  phase: number;
  description: string;
  /** What the editor will manage — shown on the placeholder page. */
  manages: string[];
  /** Tables whose row counts are shown (proves the seed landed). */
  tables: { table: string; label: string }[];
};

export type ModuleGroup = { label: string; modules: AdminModule[] };

export const moduleGroups: ModuleGroup[] = [
  {
    label: "Overview",
    modules: [
      {
        slug: "",
        label: "Dashboard",
        icon: LayoutDashboard,
        phase: 0,
        description: "Studio overview",
        manages: [],
        tables: [],
      },
    ],
  },
  {
    label: "Content",
    modules: [
      {
        slug: "portfolio",
        label: "Portfolio",
        icon: SwatchBook,
        phase: 1,
        description: "Categories, case studies and their photo galleries.",
        manages: [
          "Add, rename, reorder and hide categories",
          "Create case studies with cover, story, challenge, solution and result",
          "Upload and drag-sort a full gallery per project",
          "Choose which projects appear on the homepage",
          "Draft / publish and per-project SEO",
        ],
        tables: [
          { table: "projects", label: "Projects" },
          { table: "portfolio_categories", label: "Categories" },
          { table: "project_images", label: "Gallery images" },
        ],
      },
      {
        slug: "homepage",
        label: "Homepage",
        icon: House,
        phase: 2,
        description: "Every section of the landing page.",
        manages: [
          "Hero headline, copy, buttons and background",
          "Brand marquee, services cards, stats and awards",
          "Latest films, testimonials and Instagram grid",
          "Academy and print atelier previews",
        ],
        tables: [
          { table: "films", label: "Films" },
          { table: "testimonials", label: "Testimonials" },
          { table: "stats", label: "Stats" },
          { table: "awards", label: "Awards" },
          { table: "clients", label: "Brands" },
        ],
      },
      {
        slug: "journal",
        label: "Journal",
        icon: Newspaper,
        phase: 3,
        description: "Articles and their categories.",
        manages: ["Write articles with a block editor", "Manage categories", "Feature posts on the homepage"],
        tables: [
          { table: "posts", label: "Posts" },
          { table: "blog_categories", label: "Categories" },
        ],
      },
      {
        slug: "academy",
        label: "Academy",
        icon: GraduationCap,
        phase: 3,
        description: "Courses, highlights and student stories.",
        manages: ["Courses with curriculum, fees, batches and trainers", "Highlights and student outcomes"],
        tables: [{ table: "courses", label: "Courses" }],
      },
      {
        slug: "services",
        label: "Services",
        icon: Sparkles,
        phase: 3,
        description: "Service catalogue, engagement tiers and process.",
        manages: ["Service categories and items", "Engagement tiers", "Process steps"],
        tables: [
          { table: "service_categories", label: "Categories" },
          { table: "engagement_tiers", label: "Tiers" },
          { table: "process_steps", label: "Process steps" },
        ],
      },
      {
        slug: "about",
        label: "About",
        icon: Building2,
        phase: 3,
        description: "Story, founder, team and timeline.",
        manages: ["Story, mission and values", "Founder and team", "Timeline, equipment and studio tour"],
        tables: [
          { table: "team_members", label: "Team" },
          { table: "timeline_entries", label: "Timeline" },
        ],
      },
      {
        slug: "careers",
        label: "Careers",
        icon: Briefcase,
        phase: 3,
        description: "Open roles.",
        manages: ["Publish and close open roles"],
        tables: [{ table: "open_roles", label: "Open roles" }],
      },
      {
        slug: "faq",
        label: "FAQ",
        icon: CircleHelp,
        phase: 3,
        description: "Questions grouped by topic.",
        manages: ["Questions and answers by topic", "Choose which appear on the homepage"],
        tables: [{ table: "faqs", label: "Questions" }],
      },
      {
        slug: "store",
        label: "Print Store",
        icon: Printer,
        phase: 5,
        description: "Products and print options.",
        manages: ["Products and prices", "Sizes, papers and frames"],
        tables: [
          { table: "store_products", label: "Products" },
          { table: "print_options", label: "Print options" },
        ],
      },
      {
        slug: "pages",
        label: "Pages & SEO",
        icon: FileText,
        phase: 5,
        description: "Page headers, closing banners, SEO and legal pages.",
        manages: ["Page headers and call-to-action bands", "SEO titles and descriptions", "Privacy policy and terms"],
        tables: [
          { table: "pages", label: "Pages" },
          { table: "site_sections", label: "Section blocks" },
          { table: "legal_pages", label: "Legal pages" },
        ],
      },
    ],
  },
  {
    label: "Studio",
    modules: [
      {
        slug: "inbox",
        label: "Inbox",
        icon: Inbox,
        phase: 4,
        description: "Bookings, enquiries, applications and sign-ups.",
        manages: [
          "Every website form lands here",
          "Email alert for each new submission",
          "Track status: new, in progress, done",
        ],
        tables: [{ table: "submissions", label: "Submissions" }],
      },
      {
        slug: "media",
        label: "Media Library",
        icon: Images,
        phase: 1,
        description: "All photos used across the site.",
        manages: ["Upload images", "Alt text and focal point", "See where an image is used"],
        tables: [{ table: "media", label: "Images" }],
      },
    ],
  },
  {
    label: "System",
    modules: [
      {
        slug: "settings",
        label: "Settings",
        icon: Settings,
        phase: 2,
        description: "Contact details, socials, navigation and admins.",
        manages: ["Phone, WhatsApp, email, address and hours", "Social links", "Header, mega menu and footer links"],
        tables: [
          { table: "site_settings", label: "Settings" },
          { table: "navigation", label: "Menus" },
          { table: "admin_users", label: "Admins" },
        ],
      },
    ],
  },
];

export const allModules = moduleGroups.flatMap((group) => group.modules);

export function getModule(slug: string) {
  return allModules.find((m) => m.slug === slug);
}
