import { dashboards } from "app/navigation/dashboards";

export const sidebarProjects = dashboards.childs
  .filter((item) => item.showBullet && item.title)
  .map((item) => item.title);
