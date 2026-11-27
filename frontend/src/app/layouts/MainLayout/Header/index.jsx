// Import Dependencies
import clsx from "clsx";
import { useNavigate, useLocation } from "react-router";

// Local Imports
import { SidebarToggleBtn } from "components/shared/SidebarToggleBtn";
import { useThemeContext } from "app/contexts/theme/context";
import { getStoredUserName, getStoredUserRole } from "utils/authUser";
import { History } from "lucide-react";

// ----------------------------------------------------------------------

export function Header() {
  const { cardSkin } = useThemeContext();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const role = String(getStoredUserRole() || "").trim().toLowerCase();
  const currentUserName = getStoredUserName() || "ADMIN";
  const showDashboardActions = pathname.startsWith("/dashboards");

  if (pathname === "/dashboards/home" || pathname === "/dashboards/listing") {
    return null;
  }

  return (
    <header
      className={clsx(
        "app-header transition-content sticky top-0 z-20 flex h-[65px] shrink-0 items-center justify-between border-b border-gray-200 bg-white/80 px-(--margin-x) backdrop-blur-sm backdrop-saturate-150 dark:border-dark-600",
        cardSkin === "shadow" ? "dark:bg-dark-750/80" : "dark:bg-dark-900/80",
      )}
    >
      <SidebarToggleBtn />

      {showDashboardActions ? (
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboards/home?view=history")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <History size={15} />
            History
          </button>
          <button
            onClick={() => navigate("/dashboards/home?view=daily-update")}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <History size={15} />
            Daily Update
          </button>
          <div className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold tracking-wide text-slate-600 shadow-sm">
            {role === "admin" ? "ADMIN" : currentUserName}
          </div>
        </div>
      ) : null}
    </header>
  );
}
