// Import Dependencies
import PropTypes from "prop-types";
import { NavLink, useLocation, useRouteLoaderData } from "react-router";
import clsx from "clsx";
import { useTranslation } from "react-i18next";

// Local Imports
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useSidebarContext } from "app/contexts/sidebar/context";
import { Badge } from "components/ui";

// ----------------------------------------------------------------------

export function MenuItem({ data }) {
  const { path, transKey, id, showBullet, isStatic, hasTopGap } = data;
  const { t } = useTranslation();
  const location = useLocation();
  const { lgAndDown } = useBreakpointsContext();
  const { close } = useSidebarContext();
  const title = t(transKey) || data.title;

  const info = useRouteLoaderData("root")?.[id]?.info;
  const currentProjectFilter = new URLSearchParams(location.search).get("project") || "";
  const linkProjectFilter = path?.includes("?project=")
    ? new URLSearchParams(path.split("?")[1]).get("project") || ""
    : "";
  const isProjectFilterItem = Boolean(linkProjectFilter);
  const isAllProjectItem = id === "dashboards.allproject";

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
};
