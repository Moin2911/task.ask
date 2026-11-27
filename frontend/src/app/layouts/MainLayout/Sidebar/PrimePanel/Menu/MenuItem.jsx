// Import Dependencies
import PropTypes from "prop-types";
import { NavLink, useLocation, useRouteLoaderData } from "react-router";
import clsx from "clsx";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

// Local Imports
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useSidebarContext } from "app/contexts/sidebar/context";
import { Badge } from "components/ui";

// ----------------------------------------------------------------------

export function MenuItem({ data, canManageProjects, onEditProject, onDeleteProject }) {
  const { path, transKey, id, showBullet, isStatic, hasTopGap } = data;
  const { t } = useTranslation();
  const location = useLocation();
  const { lgAndDown } = useBreakpointsContext();
  const { close } = useSidebarContext();
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const projectMenuRef = useRef(null);
  const title = t(transKey) || data.title;

  const info = useRouteLoaderData("root")?.[id]?.info;
  const currentProjectFilter = new URLSearchParams(location.search).get("project") || "";
  const linkProjectFilter = path?.includes("?project=")
    ? new URLSearchParams(path.split("?")[1]).get("project") || ""
    : "";
  const isProjectFilterItem = Boolean(linkProjectFilter);
  const isAllProjectItem = id === "dashboards.allproject";

  useEffect(() => {
    if (!projectMenuOpen) return undefined;
    const closeOnOutsideClick = (event) => {
      if (!projectMenuRef.current?.contains(event.target)) {
        setProjectMenuOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setProjectMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [projectMenuOpen]);

  const handleMenuItemClick = () => lgAndDown && close();
  const normalize = (value) => (value || "").trim().toLowerCase();

  const getIsMenuItemActive = (isActive) => {
    if (isProjectFilterItem) {
      return (
        location.pathname === "/dashboards/allproject" &&
        normalize(currentProjectFilter) === normalize(linkProjectFilter)
      );
    }

    if (isAllProjectItem) {
      return location.pathname === "/dashboards/allproject";
    }

    return isActive;
  };

  // If isStatic is true, render as plain div instead of link
  if (isStatic) {
    return (
      <div
        className="flex h-10 items-center justify-between rounded-lg px-3 text-sm font-medium tracking-[0.01em] text-gray-600 dark:text-dark-200"
      >
        <span className="mr-1 truncate flex items-center gap-2">
          {showBullet && (
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-dark-300 flex-shrink-0" />
          )}
          {title}
        </span>
        {info && info.val && (
          <Badge
            color={info.color}
            variant="soft"
            className="h-4.5 min-w-[1rem] shrink-0 p-[5px] text-tiny-plus"
          >
            {info.val}
          </Badge>
        )}
      </div>
    );
  }

  if (data.project) {
    const active = getIsMenuItemActive(
      location.pathname === path?.split("?")[0],
    );

    return (
      <div className="group/project relative flex min-w-0 items-center gap-1">
        <NavLink
          to={path}
          onClick={handleMenuItemClick}
          className={clsx(
            "min-w-0 flex-1 outline-hidden transition-all duration-200 ease-in-out",
            hasTopGap && "mt-2",
            active
              ? "rounded-lg bg-black text-white shadow-sm"
              : "rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-dark-200 dark:hover:bg-dark-600 dark:hover:text-dark-50",
          )}
        >
          <div className="flex h-10 items-center px-3 text-sm font-medium tracking-[0.01em]">
            <span className="mr-1 flex min-w-0 items-center gap-2 truncate">
              <span
                className={clsx(
                  "inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full",
                  active ? "bg-white" : "bg-gray-400 dark:bg-dark-300",
                )}
              />
              <span className="truncate">{title}</span>
            </span>
          </div>
        </NavLink>

        {canManageProjects ? (
          <div className="relative shrink-0" ref={projectMenuRef}>
            <button
              type="button"
              aria-label={`Manage ${title}`}
              aria-expanded={projectMenuOpen}
              onClick={() => setProjectMenuOpen((open) => !open)}
              className="flex size-8 items-center justify-center rounded-lg text-gray-500 opacity-0 transition hover:bg-gray-100 hover:text-gray-800 group-hover/project:opacity-100 group-focus-within/project:opacity-100 focus:opacity-100 dark:text-dark-300 dark:hover:bg-dark-600 dark:hover:text-dark-50"
            >
              <MoreHorizontal size={18} />
            </button>
            {projectMenuOpen ? (
              <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-dark-600 dark:bg-dark-750">
                <button
                  type="button"
                  onClick={() => {
                    setProjectMenuOpen(false);
                    onEditProject?.(data.project);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50 dark:text-dark-100 dark:hover:bg-dark-600"
                >
                  <Pencil size={15} /> Edit Project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProjectMenuOpen(false);
                    onDeleteProject?.(data.project);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 size={15} /> Delete Project
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <NavLink
      to={path}
      onClick={handleMenuItemClick}
      className={({ isActive }) =>
        (() => {
          const active = getIsMenuItemActive(isActive);
          const activeClass = isProjectFilterItem
            ? "rounded-lg bg-black text-white shadow-sm"
            : "rounded-lg bg-blue-600 text-white shadow-sm";

          return clsx(
            "outline-hidden transition-all duration-200 ease-in-out",
            hasTopGap && "mt-2",
            active
              ? activeClass
              : "rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-dark-200 dark:hover:bg-dark-600 dark:hover:text-dark-50",
          );
        })()
      }
    >
      {({ isActive }) => (
        (() => {
          const active = getIsMenuItemActive(isActive);
          return (
        <div
          data-menu-active={active}
          className="flex h-10 items-center justify-between px-3 text-sm font-medium tracking-[0.01em]"
        >
          <span className="mr-1 truncate flex items-center gap-2">
            {showBullet && (
              <span
                className={clsx(
                  "inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full",
                  active ? "bg-white" : "bg-gray-400 dark:bg-dark-300",
                )}
              />
            )}
            {title}
          </span>
          {info && info.val && (
            <Badge
              color={info.color}
              variant="soft"
              className="h-4.5 min-w-[1rem] shrink-0 p-[5px] text-tiny-plus"
            >
              {info.val}
            </Badge>
          )}
        </div>
          );
        })()
      )}
    </NavLink>
  );
}

MenuItem.propTypes = {
  data: PropTypes.object,
  canManageProjects: PropTypes.bool,
  onEditProject: PropTypes.func,
  onDeleteProject: PropTypes.func,
};
