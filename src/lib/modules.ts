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
  description: string;
  /** Tables whose row counts are shown on the dashboard. */
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
        description: "Studio overview",
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
        description: "Categories, case studies and their photo galleries.",
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
        description: "Every section of the landing page.",
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
        description: "Articles and their categories.",
        tables: [
          { table: "posts", label: "Posts" },
          { table: "blog_categories", label: "Categories" },
        ],
      },
      {
        slug: "academy",
        label: "Academy",
        icon: GraduationCap,
        description: "Courses, highlights and student stories.",
        tables: [{ table: "courses", label: "Courses" }],
      },
      {
        slug: "services",
        label: "Services",
        icon: Sparkles,
        description: "Service catalogue, engagement tiers and process.",
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
        description: "Story, founder, team and timeline.",
        tables: [
          { table: "team_members", label: "Team" },
          { table: "timeline_entries", label: "Timeline" },
        ],
      },
      {
        slug: "careers",
        label: "Careers",
        icon: Briefcase,
        description: "Open roles.",
        tables: [{ table: "open_roles", label: "Open roles" }],
      },
      {
        slug: "faq",
        label: "FAQ",
        icon: CircleHelp,
        description: "Questions grouped by topic.",
        tables: [{ table: "faqs", label: "Questions" }],
      },
      {
        slug: "store",
        label: "Print Store",
        icon: Printer,
        description: "Products and print options.",
        tables: [
          { table: "store_products", label: "Products" },
          { table: "print_options", label: "Print options" },
        ],
      },
      {
        slug: "pages",
        label: "Pages & SEO",
        icon: FileText,
        description: "Page headers, closing banners, SEO and legal pages.",
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
        description: "Bookings, enquiries, applications and sign-ups.",
        tables: [{ table: "submissions", label: "Submissions" }],
      },
      {
        slug: "media",
        label: "Media Library",
        icon: Images,
        description: "All photos used across the site.",
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
        description: "Contact details, socials, navigation and admins.",
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
