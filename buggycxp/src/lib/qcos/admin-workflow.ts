export interface CxpWorkflowStep {
  number: number;
  route: string;
  title: string;
  shortTitle: string;
  group: "Prepare" | "Build" | "Deliver" | "Learn";
  purpose: string;
  prerequisite: string;
  completion: string;
}

export const cxpWorkflow: CxpWorkflowStep[] = [
  {
    number: 1,
    route: "/admin/media",
    title: "Prepare media and assets",
    shortTitle: "Media & Assets",
    group: "Prepare",
    purpose: "Register approved images, video, animation, fonts, and audio before using them in an experience.",
    prerequisite: "Have an HTTPS CDN URL, file details, and an accessibility description.",
    completion: "Every required asset is active, accessible, and previewable.",
  },
  {
    number: 2,
    route: "/admin/themes",
    title: "Create the visual theme",
    shortTitle: "Themes",
    group: "Prepare",
    purpose: "Set safe colours, spacing, typography, motion, and imagery while previewing the real mobile component system.",
    prerequisite: "Register hero media first when the theme uses an image or animation.",
    completion: "Contrast passes and the theme is saved for Experience Studio.",
  },
  {
    number: 3,
    route: "/admin/flavour-fest",
    title: "Manage FlavourFest & festive cards",
    shortTitle: "FlavourFest Cards",
    group: "Prepare",
    purpose: "Configure dynamic offer cards, custom gradients, mascots, graphics, and filters for FlavourFest banner.",
    prerequisite: "Active grocery module or campaign.",
    completion: "Cards, colors, and graphics are saved and active.",
  },
  {
    number: 4,
    route: "/admin/festivals",
    title: "Configure festival & campaign themes",
    shortTitle: "Festival Themes",
    group: "Prepare",
    purpose: "Configure admin-defined festival overrides, permissions, backgrounds, watermarks, and campaign schedules.",
    prerequisite: "Have an active base theme and any required cultural assets or fonts.",
    completion: "Festival theme permissions and schedule are saved and verified in live preview.",
  },
  {
    number: 4,
    route: "/admin/localization",
    title: "Prepare customer language",
    shortTitle: "Languages",
    group: "Prepare",
    purpose: "Create English, Telugu + English, and Hindi + English customer-facing copy with independent review.",
    prerequisite: "Know the page, section, or widget ID and the exact customer-facing field.",
    completion: "Required translations are independently approved and ready for SDUI compilation.",
  },
  {
    number: 5,
    route: "/admin/audiences",
    title: "Define who may see content",
    shortTitle: "Audiences",
    group: "Prepare",
    purpose: "Create privacy-bounded reusable groups using market, city, language, module, login, or network context.",
    prerequisite: "Document the business reason and use only approved non-sensitive context fields.",
    completion: "Audience rules are understandable, testable, and active only when needed.",
  },
  {
    number: 6,
    route: "/admin/experience",
    title: "Build and preview the experience",
    shortTitle: "Experience Studio",
    group: "Build",
    purpose: "Compose registered mobile widgets, validate their contracts, and save an immutable page version.",
    prerequisite: "Prepare media, theme, language, and audience inputs required by the design.",
    completion: "The document validates, the simulator is correct, and an immutable draft is saved.",
  },
  {
    number: 7,
    route: "/admin/campaigns",
    title: "Add campaigns and targeting",
    shortTitle: "Campaigns & Rules",
    group: "Build",
    purpose: "Apply time windows, approved audiences, and controlled experience rules without changing commerce authority.",
    prerequisite: "Have a validated experience, campaign assets, dates, and success metric.",
    completion: "Rules are bounded, scheduled, measurable, and have an expiry or owner.",
  },
  {
    number: 8,
    route: "/admin/releases",
    title: "Review and publish",
    shortTitle: "Publish Experiences",
    group: "Deliver",
    purpose: "Move one exact page version to Development, QA, Staging, or Production with visible safety gates.",
    prerequisite: "Validate the immutable version; staging and production require an independent reviewer.",
    completion: "The intended version is active for the selected environment and audience only.",
  },
  {
    number: 9,
    route: "/admin/schedules",
    title: "Schedule controlled publishing",
    shortTitle: "Scheduled Publishing",
    group: "Deliver",
    purpose: "Publish an approved version at a future time with a recorded reason and rollout percentage.",
    prerequisite: "Confirm timezone, approved version, destination, monitoring owner, and rollback plan.",
    completion: "The schedule is visible, auditable, and owned until execution or cancellation.",
  },
  {
    number: 10,
    route: "/admin/analytics",
    title: "Measure and audit",
    shortTitle: "Analytics & Audit",
    group: "Learn",
    purpose: "Review delivery health, customer interaction, administrative changes, and release outcomes.",
    prerequisite: "Define the success and guardrail metrics before publishing.",
    completion: "Results are reviewed and the next keep, improve, or rollback decision is recorded.",
  },
];

export function workflowStepForPath(pathname: string): CxpWorkflowStep | undefined {
  return cxpWorkflow.find((step) => pathname === step.route || pathname.startsWith(`${step.route}/`));
}
