// Import Dependencies
import { Navigate, useLocation, useOutlet } from "react-router";

// Local Imports
import { useAuthContext } from "app/contexts/auth/context";
import { HOME_PATH, REDIRECT_URL_KEY } from "constants/app.constant";

// ----------------------------------------------------------------------

export default function GhostGuard() {
  const outlet = useOutlet();
  const location = useLocation();
  const { isAuthenticated } = useAuthContext();

  const redirect = new URLSearchParams(location.search).get(REDIRECT_URL_KEY);
  const normalizedRedirect = redirect?.trim();

  const targetPath =
    normalizedRedirect &&
    normalizedRedirect !== "null" &&
    normalizedRedirect !== "undefined" &&
    normalizedRedirect.startsWith("/") &&
    normalizedRedirect !== "/"
      ? normalizedRedirect
      : HOME_PATH;

  if (isAuthenticated) {
    return <Navigate to={targetPath} replace />;
  }

  return <>{outlet}</>;
}
