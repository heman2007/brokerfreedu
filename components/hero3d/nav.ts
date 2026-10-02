export type NavItem = { label: string; href: string; accent?: boolean };

// Order matters: item i sits on LABEL_STEPS[i], bottom of the stairs to the top.
export function buildNav(accountLabel: string): NavItem[] {
  return [
    { label: "Find a place", href: "/browse" },
    { label: "Post a flat", href: "/post" },
    { label: "Petition", href: "/petition" },
    { label: "Danger Zone", href: "/danger-zone" },
    { label: "Yellow Zone", href: "/yellow-zone" },
    { label: "Satyagraha", href: "/satyagraha", accent: true },
    { label: accountLabel, href: "/account" },
  ];
}
