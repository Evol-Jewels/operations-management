export interface StatusTone {
  dot: string;
  badge: string;
  surface: string;
}

const TONES = {
  slate: {
    dot: "bg-slate-400 dark:bg-slate-500",
    badge:
      "border-slate-500/20 bg-slate-500/10 text-slate-600 dark:text-slate-300",
    surface: "bg-slate-500/[0.06] dark:bg-slate-400/[0.08]",
  },
  sky: {
    dot: "bg-sky-500",
    badge: "border-sky-500/20 bg-sky-500/10 text-sky-700 dark:text-sky-300",
    surface: "bg-sky-500/[0.06] dark:bg-sky-400/[0.08]",
  },
  violet: {
    dot: "bg-violet-500",
    badge:
      "border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300",
    surface: "bg-violet-500/[0.06] dark:bg-violet-400/[0.08]",
  },
  amber: {
    dot: "bg-amber-500",
    badge:
      "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    surface: "bg-amber-500/[0.06] dark:bg-amber-400/[0.08]",
  },
  orange: {
    dot: "bg-orange-500",
    badge:
      "border-orange-500/20 bg-orange-500/10 text-orange-700 dark:text-orange-300",
    surface: "bg-orange-500/[0.06] dark:bg-orange-400/[0.08]",
  },
  teal: {
    dot: "bg-teal-500",
    badge: "border-teal-500/20 bg-teal-500/10 text-teal-700 dark:text-teal-300",
    surface: "bg-teal-500/[0.06] dark:bg-teal-400/[0.08]",
  },
  fuchsia: {
    dot: "bg-fuchsia-500",
    badge:
      "border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300",
    surface: "bg-fuchsia-500/[0.06] dark:bg-fuchsia-400/[0.08]",
  },
  indigo: {
    dot: "bg-indigo-500",
    badge:
      "border-indigo-500/20 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300",
    surface: "bg-indigo-500/[0.06] dark:bg-indigo-400/[0.08]",
  },
  emerald: {
    dot: "bg-emerald-500",
    badge:
      "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    surface: "bg-emerald-500/[0.06] dark:bg-emerald-400/[0.08]",
  },
  rose: {
    dot: "bg-rose-400",
    badge: "border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300",
    surface: "bg-rose-500/[0.05] dark:bg-rose-400/[0.07]",
  },
} satisfies Record<string, StatusTone>;

const STATUS_TONES: Record<string, keyof typeof TONES> = {
  Enquiry: "slate",
  New: "sky",
  "In Progress": "sky",
  Estimation: "amber",
  Estimated: "amber",
  Converted: "emerald",
  "Order Confirmed": "emerald",
  "CAD Design": "violet",
  "In Production": "amber",
  Certification: "orange",
  "At Store": "teal",
  "In Photoshoot": "fuchsia",
  Editing: "fuchsia",
  "Post Editing": "fuchsia",
  "Website Upload": "indigo",
  "In Transit": "indigo",
  Delivered: "emerald",
  Closed: "slate",
  Cancelled: "rose",
};

export function getStatusTone(status: string): StatusTone {
  return TONES[STATUS_TONES[status] ?? "slate"];
}
