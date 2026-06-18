// Import Dependencies
import { Navigate, useLocation, useOutlet } from "react-router";

// Local Imports
import { useAuthContext } from "app/contexts/auth/context";
import { HOME_PATH, REDIRECT_URL_KEY } from "constants/app.constant";

// ----------------------------------------------------------------------

export default function GhostGuard() {
  const outlet = useOutlet();
  const location = useLocation();
  const { isAuthenticated, user } = useAuthContext();

  const redirect = new URLSearchParams(location.search).get(REDIRECT_URL_KEY);
  const normalizedRedirect = redirect?.trim();

  let defaultPath = HOME_PATH;
  if (user?.role === 'developer') {
    defaultPath = '/dashboards/allproject';
  }

  const targetPath =
    normalizedRedirect &&
    normalizedRedirect !== "null" &&
    normalizedRedirect !== "undefined" &&
    normalizedRedirect.startsWith("/") &&
    normalizedRedirect !== "/"
      ? normalizedRedirect
      : defaultPath;

  if (isAuthenticated) {
    return <Navigate to={targetPath} replace />;
  }

  return <>{outlet}</>;
}
