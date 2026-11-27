// Import Dependencies
import { useEffect, useMemo, useState } from "react";
import { Radio, RadioGroup } from "@headlessui/react";
import clsx from "clsx";
import PropTypes from "prop-types";
import {
  ArrowLeftStartOnRectangleIcon,
  ChevronLeftIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/20/solid";
import { toast } from "sonner";
import { useNavigate } from "react-router";

// Local Imports
import { useThemeContext } from "app/contexts/theme/context";
import { useAuthContext } from "app/contexts/auth/context";
import { Button } from "components/ui";
import { Menu } from "./Menu";
import { NAV_TYPE_ITEM } from "constants/app.constant";
import { ProjectModal } from "app/pages/dashboards/home/ProjectModal";
import {
  PROJECTS_UPDATED_EVENT,
  deleteProject,
  getProjects,
  notifyProjectsUpdated,
  updateProject,
} from "app/services/projects";
import { getStoredUserRole } from "utils/authUser";

// ----------------------------------------------------------------------

export function PrimePanel({
  currentSegment,
  pathname,
  close,
}) {
  const { cardSkin, themeMode, setThemeMode } = useThemeContext();
  const { logout } = useAuthContext();
  const navigate = useNavigate();
  const [dynamicProjects, setDynamicProjects] = useState([]);
  const [role, setRole] = useState("");
  const [editingProject, setEditingProject] = useState(null);
  const [savingProject, setSavingProject] = useState(false);

  useEffect(() => {
    const syncRole = () => {
      setRole(getStoredUserRole());
    };

    syncRole();
    window.addEventListener("storage", syncRole);
    return () => window.removeEventListener("storage", syncRole);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadProjects = async () => {
      try {
        const projects = await getProjects();
        if (!mounted) return;
        setDynamicProjects(projects.filter((project) => project?.name));
      } catch {
        if (!mounted) return;
        setDynamicProjects([]);
      }
    };

    loadProjects();

    const handleProjectsUpdated = () => {
      loadProjects();
    };

    window.addEventListener(PROJECTS_UPDATED_EVENT, handleProjectsUpdated);
    return () => {
      mounted = false;
      window.removeEventListener(PROJECTS_UPDATED_EVENT, handleProjectsUpdated);
    };
  }, []);

  const resolvedSegment = useMemo(() => {
    if (!currentSegment?.childs) return currentSegment;
    if (currentSegment.id !== "dashboards") return currentSegment;

    const isAdmin = role.trim().toLowerCase() === "admin";
    const baseItems = currentSegment.childs.filter((item) => {
      if (item.isStatic) return false;
      if (isAdmin) return true;
      return item.id !== "dashboards.home";
    });
    const projectItems = dynamicProjects.map((project, index) => ({
      id: `dashboards.dynamic-project-${project.id}`,
      type: NAV_TYPE_ITEM,
      title: project.name,
      showBullet: true,
      hasTopGap: index === 0,
      project,
      path: `/dashboards/allproject?project=${encodeURIComponent(project.name)}`,
    }));

    return {
      ...currentSegment,
      childs: [...baseItems, ...projectItems],
    };
  }, [currentSegment, dynamicProjects, role]);

  const isAdmin = role.trim().toLowerCase() === "admin";

  const handleProjectSave = async (payload) => {
    if (!editingProject) return;
    setSavingProject(true);
    try {
      const response = await updateProject(editingProject.id, payload);
      toast.success("Project updated");
      setEditingProject(null);
      notifyProjectsUpdated({
        project: response?.data,
        previousName: editingProject.name,
      });
    } catch (error) {
      toast.error(error?.message || "Failed to update project");
    } finally {
      setSavingProject(false);
    }
  };

  const handleProjectDelete = async (project) => {
    if (!window.confirm(`Delete project "${project.name}"?`)) return;
    try {
      await deleteProject(project.id);
      toast.success("Project deleted");
      notifyProjectsUpdated();
    } catch (error) {
      toast.error(error?.message || "Failed to delete project");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div
      className={clsx(
        "prime-panel flex h-full flex-col",
        cardSkin === "shadow"
          ? "shadow-soft dark:shadow-dark-900/60"
          : "dark:border-dark-600/80 ltr:border-r rtl:border-l",
      )}
    >
      <div
        className={clsx(
          "flex h-full grow flex-col bg-white",
          cardSkin === "shadow" ? "dark:bg-dark-750" : "dark:bg-dark-900",
        )}
      >
        <div className="relative mb-2 flex h-14 w-full shrink-0 items-center justify-between px-4">
          <div className="flex min-w-0 flex-1 items-center">
            <img
              src="/images/askinnovationlogo.webp"
              alt="Ask Innovation"
              className="mt-6 ml-5 h-18 w-full max-w-[calc(100%-0.5rem)] object-contain ltr:object-left rtl:object-right dark:brightness-0 dark:invert"
            />
          </div>
          <Button
            onClick={close}
            isIcon
            variant="flat"
            className="size-7 rounded-full xl:hidden"
          >
            <ChevronLeftIcon className="size-6 rtl:rotate-180" />
          </Button>
        </div>

        {resolvedSegment?.childs && (
          <div className="min-h-0 flex-1 overflow-hidden pt-1">
            <Menu
              nav={resolvedSegment?.childs}
              pathname={pathname}
              canManageProjects={isAdmin}
              onEditProject={setEditingProject}
              onDeleteProject={handleProjectDelete}
            />
          </div>
        )}

        <div className="mt-auto border-t border-gray-200 p-4 pb-5 dark:border-dark-600">
          <RadioGroup
            value={themeMode === "dark" ? "dark" : "light"}
            onChange={setThemeMode}
            className="flex w-full rounded-lg bg-gray-200 p-1 text-gray-600 dark:bg-dark-700 dark:text-dark-200"
          >
            <Radio
              value="light"
              as={Button}
              unstyled
              className={({ checked }) =>
                clsx(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium",
                  checked
                    ? "bg-white shadow dark:bg-dark-500 dark:text-dark-100"
                    : "hover:text-gray-800 dark:hover:text-dark-100",
                )
              }
            >
              <SunIcon className="size-4" />
              <span>Light</span>
            </Radio>
            <Radio
              value="dark"
              as={Button}
              unstyled
              className={({ checked }) =>
                clsx(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium",
                  checked
                    ? "bg-white shadow dark:bg-dark-500 dark:text-dark-100"
                    : "hover:text-gray-800 dark:hover:text-dark-100",
                )
              }
            >
              <MoonIcon className="size-4" />
              <span>Dark</span>
            </Radio>
          </RadioGroup>

          <Button onClick={handleLogout} className="mt-3 w-full gap-2">
            <ArrowLeftStartOnRectangleIcon className="size-4.5" />
            <span>Logout</span>
          </Button>
        </div>
      </div>
      <ProjectModal
        open={Boolean(editingProject)}
        project={editingProject}
        loading={savingProject}
        onClose={() => setEditingProject(null)}
        onSubmit={handleProjectSave}
      />
    </div>
  );
}

PrimePanel.propTypes = {
  currentSegment: PropTypes.object,
  close: PropTypes.func,
};
