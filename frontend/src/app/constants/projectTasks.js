import { sidebarProjects } from "app/constants/projects";

const fallbackTasks = ["Task 1", "Task 2", "Task 3"];

export const projectTasks = sidebarProjects.reduce((acc, project) => {
  acc[project] = fallbackTasks;
  return acc;
}, {});

projectTasks["Polystox"] = [
  "Forefully login disable",
  "Boarding page",
  "Admin panel line chart",
];
projectTasks["TheprivyPursuit"] = [
  "Landing hero refresh",
  "Pricing cards",
  "Signup flow",
  "Testimonials section",
];
projectTasks["Three ships"] = [
  "Homepage redesign",
  "About section",
  "CTA banner",
];
projectTasks["Kailtech"] = [
  "Inventory module",
  "Billing view",
  "Reports export",
];
projectTasks["Kishan trade"] = [
  "Vendor onboarding",
  "Order tracking",
  "Ledger view",
];
projectTasks["kailtech 2.0"] = [
  "Upgrade checklist",
  "New dashboard widgets",
  "Permissions update",
];
