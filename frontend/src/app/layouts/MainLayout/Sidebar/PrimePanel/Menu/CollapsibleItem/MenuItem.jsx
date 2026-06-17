// Import Dependencies
import PropTypes from "prop-types";
import clsx from "clsx";
import { NavLink, useRouteLoaderData } from "react-router";

// Local Imports
import { Badge } from "components/ui";
import { useBreakpointsContext } from "app/contexts/breakpoint/context";
import { useSidebarContext } from "app/contexts/sidebar/context";
import { useTranslation } from "react-i18next";

// ----------------------------------------------------------------------

export function MenuItem({ data }) {
  const { transKey, path, id } = data;
  const { lgAndDown } = useBreakpointsContext();
  const { close } = useSidebarContext();
  const { t } = useTranslation();

  const title = t(transKey) || data.title;
  const info = useRouteLoaderData("root")?.[id]?.info;

  const handleMenuItemClick = () => lgAndDown && close();

  return (
    <NavLink
      to={path}
      onClick={handleMenuItemClick}
      id={id}
      className={({ isActive }) =>
        clsx(
          "flex cursor-pointer items-center justify-between rounded-lg px-3 text-sm font-medium tracking-[0.01em] outline-hidden transition-all duration-200 ease-in-out",
          isActive
            ? "bg-blue-600 text-white shadow-sm"
            : "text-gray-700 hover:bg-blue-50 hover:text-blue-700 dark:text-dark-200 dark:hover:bg-dark-600 dark:hover:text-dark-50",
        )
      }
    >
      {({ isActive }) => (
        <div
          data-menu-active={isActive}
          className="flex min-h-10 min-w-0 items-center justify-between"
        >
          <div className="flex min-w-0 items-center space-x-2 ">
            <div
              className={clsx(
                isActive
                  ? "bg-white border-white opacity-100"
                  : "opacity-50 transition-all",
                "size-1.5 rounded-full border border-current",
              )}
            ></div>
            <span className="truncate">{title}</span>
          </div>
          {info && info.val && (
            <Badge
              color={info.color}
              className="h-5 min-w-[1.25rem] shrink-0 rounded-full p-[5px]"
            >
              {info.val}
            </Badge>
          )}
        </div>
      )}
    </NavLink>
  );
}

MenuItem.propTypes = {
  data: PropTypes.object,
};
