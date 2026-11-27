import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Download,
  FolderPlus,
  History,
  ListTodo,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { Page } from "components/shared/Page";
import { SidebarToggleBtn } from "components/shared/SidebarToggleBtn";
import { BulkTaskModal } from "./BulkTaskModal";
import {
  createProject,
  getProjects,
  deleteProject,
  notifyProjectsUpdated,
  PROJECTS_UPDATED_EVENT,
} from "app/services/projects";
import { ProjectModal } from "./ProjectModal";
import { getEmployees } from "app/services/employees";
import { createTask, getTaskHistory } from "app/services/tasks";
import { createNote, deleteNote, getNotes, updateNote } from "app/services/notes";
import { getStoredUserId, getStoredUserName, getStoredUserRole } from "utils/authUser";

const toLocalISODate = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const todayISO = () => toLocalISODate(new Date());

const startOfCurrentMonthISO = () => {
  const date = new Date();
  return toLocalISODate(new Date(date.getFullYear(), date.getMonth(), 1));
};

const initialsFor = (value) =>
  String(value || "")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

const normalize = (value) => String(value || "").trim().toLowerCase();

const getEmployeeName = (task) =>
  task?.assigned_user || task?.lead || task?.employee || "Unassigned";

const getTaskStatus = (status) => {
  const value = normalize(status);
  if (["pending", "todo", "to do"].includes(value)) return "TODO";
  if (["in progress", "in_progress", "progress"].includes(value))
    return "IN_PROGRESS";
  if (["done", "completed", "complete"].includes(value)) return "DONE";
  return "TODO";
};

const toDateOnly = (value) => {
  if (!value) return "";
  const str = String(value).trim();
  const isoMatch = str.match(/^\d{4}-\d{2}-\d{2}/);
  if (isoMatch) return isoMatch[0];

  const parsed = new Date(str);
  if (Number.isNaN(parsed.getTime())) return str;
  return toLocalISODate(parsed);
};

const formatDateLabel = (value) => {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return "-";
  const date = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const escapeCsvValue = (value) =>
  `"${String(value ?? "")
    .replaceAll('"', '""')
    .replace(/\r?\n/g, " ")
    .trim()}"`;

const normalizeDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return {
      startDate: startDate || "",
      endDate: endDate || "",
    };
  }

  if (startDate <= endDate) {
    return { startDate, endDate };
  }

  return { startDate: endDate, endDate: startDate };
};

const buildTaskCsv = (rows) => {
  const headers = ["Date", "Task"];
  const csvRows = [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) =>
      [row.date, row.task]
        .map(escapeCsvValue)
        .join(","),
    ),
  ];
  return csvRows.join("\n");
};

const downloadCsv = (filename, csv) => {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

function Modal({ open, title, subtitle, onClose, children, className = "" }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center overflow-y-auto p-4 pt-10">
        <div
          className={`w-full rounded-2xl border border-slate-200 bg-white shadow-2xl ${className}`}
        >
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              {subtitle ? (
                <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
              ) : null}
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, children, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <select
        {...props}
        className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${props.className || ""}`}
      >
        {children}
      </select>
    </label>
  );
}

function TextAreaField({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <textarea
        {...props}
        className={`min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${props.className || ""}`}
      />
    </label>
  );
}

function NoteModal({
  open,
  title,
  subtitle,
  onClose,
  onSubmit,
  projectOptions,
  defaultProject,
  initialValue,
}) {
  const [form, setForm] = useState({ project_name: "", note: "" });

  useEffect(() => {
    if (open) {
      setForm({
        project_name:
          initialValue?.project_name || defaultProject || projectOptions[0] || "",
        note: initialValue?.note || "",
      });
    }
  }, [open, defaultProject, initialValue, projectOptions]);

  return (
    <Modal
      open={open}
      title={title}
      subtitle={subtitle}
      onClose={onClose}
      className="max-w-2xl"
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!form.project_name || !form.note.trim()) return;
          await onSubmit({
            project_name: form.project_name,
            note: form.note.trim(),
          });
        }}
        className="space-y-5 px-6 py-5"
      >
        <SelectField
          label="Project"
          value={form.project_name}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, project_name: e.target.value }))
          }
        >
          {projectOptions.map((project) => (
            <option key={project} value={project}>
              {project}
            </option>
          ))}
        </SelectField>
        <TextAreaField
          label="Note"
          value={form.note}
          onChange={(e) => setForm((prev) => ({ ...prev, note: e.target.value }))}
          placeholder="Enter note details..."
          rows={6}
        />
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            {title}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const userRole = String(getStoredUserRole() || "").trim().toLowerCase();
  const isAdmin = userRole === "admin";
  const currentUserId = getStoredUserId();
  const currentUserName = getStoredUserName();
  const currentUserLabel = currentUserName || "My Tasks";
  const defaultEmployeeId = isAdmin ? "ALL" : String(currentUserId || "");

  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [notes, setNotes] = useState([]);
  const [historyTasks, setHistoryTasks] = useState([]);
  const [dailyUpdateTasks, setDailyUpdateTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("dashboard");
  const [historyStartDate, setHistoryStartDate] = useState(startOfCurrentMonthISO());
  const [historyEndDate, setHistoryEndDate] = useState(todayISO());
  const [historyEmployee, setHistoryEmployee] = useState(defaultEmployeeId);
  const [dailyUpdateDate, setDailyUpdateDate] = useState(todayISO());
  const [dailyUpdateEmployee, setDailyUpdateEmployee] = useState(defaultEmployeeId);
  const [openProjectModal, setOpenProjectModal] = useState(false);
  const [openNoteModal, setOpenNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [openBulkTask, setOpenBulkTask] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [inlineNoteProject, setInlineNoteProject] = useState("");
  const [inlineNoteText, setInlineNoteText] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingNote, setCreatingNote] = useState(false);
  const [draggedNote, setDraggedNote] = useState(null);
  const profileMenuRef = useRef(null);
  const inlineNoteInputRef = useRef(null);
  const inlineNoteComposerRef = useRef(null);

  useEffect(() => {
    if (!profileMenuOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!profileMenuRef.current?.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") setProfileMenuOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [profileMenuOpen]);

  useEffect(() => {
    const projectIds = new Set(projects.map((project) => String(project.id)));
    setSelectedProjectIds((current) =>
      current.filter((projectId) => projectIds.has(projectId)),
    );
  }, [projects]);

  useEffect(() => {
    if (inlineNoteProject && inlineNoteText === "") {
      inlineNoteInputRef.current?.focus();
    }
  }, [inlineNoteProject, inlineNoteText]);

  useEffect(() => {
    if (!inlineNoteProject) return undefined;

    const closeComposerOutside = (event) => {
      if (inlineNoteComposerRef.current?.contains(event.target)) return;
      setInlineNoteProject("");
      setInlineNoteText("");
    };

    document.addEventListener("pointerdown", closeComposerOutside);
    return () => {
      document.removeEventListener("pointerdown", closeComposerOutside);
    };
  }, [inlineNoteProject]);

  const handleDragStart = (e, note) => {
    setDraggedNote(note);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetNote) => {
    e.preventDefault();
    if (!draggedNote || draggedNote.id === targetNote.id) return;

    setNotes((prevNotes) => {
      const newNotes = [...prevNotes];
      const draggedIndex = newNotes.findIndex((n) => n.id === draggedNote.id);
      const targetIndex = newNotes.findIndex((n) => n.id === targetNote.id);

      if (draggedIndex !== -1 && targetIndex !== -1) {
        const [movedItem] = newNotes.splice(draggedIndex, 1);
        newNotes.splice(targetIndex, 0, movedItem);
      }
      return newNotes;
    });
    setDraggedNote(null);
  };

  const queryView = new URLSearchParams(location.search).get("view");
  const queryAction = new URLSearchParams(location.search).get("action");

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [projectsRes, employeesRes, notesRes] = await Promise.all([
        getProjects(),
        getEmployees(),
        getNotes(),
      ]);

      setProjects(Array.isArray(projectsRes) ? projectsRes : []);
      setEmployees(
        Array.isArray(employeesRes?.data) ? employeesRes.data : employeesRes || [],
      );
      setNotes(Array.isArray(notesRes?.data) ? notesRes.data : []);
    } catch (error) {
      toast.error(error?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (
    startDate = historyStartDate,
    endDate = historyEndDate,
    employee = historyEmployee,
  ) => {
    setLoading(true);
    try {
      const range = normalizeDateRange(startDate, endDate);
      const employeesPromise =
        employees.length === 0 ? getEmployees() : Promise.resolve(null);
      const selectedEmployeeId = isAdmin
        ? employee === "ALL"
          ? ""
          : employee
        : String(currentUserId || employee || "");
      const [employeeResponse, response] = await Promise.all([
        employeesPromise,
        getTaskHistory({
          startDate: range.startDate,
          endDate: range.endDate,
          employeeId: selectedEmployeeId,
        }),
      ]);

      if (employeeResponse?.data && Array.isArray(employeeResponse.data)) {
        setEmployees(employeeResponse.data);
      }

      setHistoryTasks(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      toast.error(error?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const loadDailyUpdate = async (
    date = dailyUpdateDate,
    employee = dailyUpdateEmployee,
  ) => {
    setLoading(true);
    try {
      const employeesPromise =
        employees.length === 0 ? getEmployees() : Promise.resolve(null);
      const selectedEmployeeId = isAdmin
        ? employee === "ALL"
          ? ""
          : employee
        : String(currentUserId || employee || "");
      const [employeeResponse, response] = await Promise.all([
        employeesPromise,
        getTaskHistory({
          date,
          employeeId: selectedEmployeeId,
        }),
      ]);

      if (employeeResponse?.data && Array.isArray(employeeResponse.data)) {
        setEmployees(employeeResponse.data);
      }

      setDailyUpdateTasks(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      toast.error(error?.message || "Failed to load daily update");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryView === "history") {
      setView("history");
    } else if (queryView === "daily-update") {
      setView("daily-update");
    } else {
      setView("dashboard");
    }
  }, [queryView]);

  useEffect(() => {
    if (!queryAction) return;

    if (queryAction === "add-note") setOpenNoteModal(true);
    if (queryAction === "add-project") setOpenProjectModal(true);
    if (queryAction === "add-task") setOpenBulkTask(true);
    navigate("/dashboards/home", { replace: true });
  }, [navigate, queryAction]);

  useEffect(() => {
    if (view === "history") {
      loadHistory(historyStartDate, historyEndDate, historyEmployee);
    } else if (view === "daily-update") {
      loadDailyUpdate(dailyUpdateDate, dailyUpdateEmployee);
    } else {
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    const handleProjectsUpdated = () => loadDashboard();
    window.addEventListener(PROJECTS_UPDATED_EVENT, handleProjectsUpdated);
    return () =>
      window.removeEventListener(PROJECTS_UPDATED_EVENT, handleProjectsUpdated);
    // loadDashboard only updates state and does not depend on render state.
  }, []);

  useEffect(() => {
    if (view === "history") {
      loadHistory(historyStartDate, historyEndDate, historyEmployee);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyStartDate, historyEndDate, historyEmployee]);

  useEffect(() => {
    if (view === "daily-update") {
      loadDailyUpdate(dailyUpdateDate, dailyUpdateEmployee);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailyUpdateDate, dailyUpdateEmployee]);

  const filteredProjects = useMemo(() => {
    const query = normalize(search);
    return projects.filter((project) => {
      const showInGrid =
        project.show_in_grid === undefined ||
        project.show_in_grid === true ||
        Number(project.show_in_grid) === 1;
      if (!showInGrid) return false;

      const name = normalize(project.name);
      const noteText = notes
        .filter((item) => normalize(item.project_name) === name)
        .map((item) => item.note)
        .join(" ");
      return !query || name.includes(query) || normalize(noteText).includes(query);
    });
  }, [projects, notes, search]);

  const displayedProjects =
    selectedProjectIds.length === 0
      ? filteredProjects
      : filteredProjects.filter((project) =>
          selectedProjectIds.includes(String(project.id)),
        );
  const notesByProject = useMemo(() => {
    return notes.reduce((acc, item) => {
      const key = normalize(item.project_name);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [notes]);

  const groupedHistory = useMemo(() => {
    const sortedTasks = [...historyTasks].sort((a, b) => {
      const dateA = toDateOnly(a.task_date || a.due_date || a.created_at || "");
      const dateB = toDateOnly(b.task_date || b.due_date || b.created_at || "");
      return dateB.localeCompare(dateA) || String(b.id || "").localeCompare(String(a.id || ""));
    });

    return sortedTasks.reduce((acc, task) => {
      const employeeName = getEmployeeName(task);
      const taskDate = toDateOnly(task.task_date || task.due_date || task.created_at || "") || "Unknown";
      if (!acc[employeeName]) acc[employeeName] = {};
      if (!acc[employeeName][taskDate]) acc[employeeName][taskDate] = [];
      acc[employeeName][taskDate].push(task);
      return acc;
    }, {});
  }, [historyTasks]);

  const groupedDailyUpdate = useMemo(() => {
    const sortedTasks = [...dailyUpdateTasks].sort((a, b) =>
      String(b.id || "").localeCompare(String(a.id || "")),
    );

    return sortedTasks.reduce((acc, task) => {
      const employeeName = getEmployeeName(task);
      if (!acc[employeeName]) acc[employeeName] = [];
      acc[employeeName].push(task);
      return acc;
    }, {});
  }, [dailyUpdateTasks]);

  const historyEmployeeOptions = useMemo(() => {
    if (!isAdmin) {
      return currentUserId
        ? [
          {
            id: String(currentUserId),
            name: currentUserName || currentUserLabel,
          },
        ]
        : [];
    }

    return employees
      .filter((employee) => employee?.id)
      .map((employee) => ({
        id: String(employee.id),
        name: employee.name || `Employee ${employee.id}`,
      }));
  }, [employees, isAdmin, currentUserId, currentUserLabel, currentUserName]);

  const historyExportRows = useMemo(() => {
    return historyTasks.map((task) => ({
      date: toDateOnly(task.task_date || task.due_date || task.created_at || "-"),
      task: task.title || task.name || "Task",
    }));
  }, [historyTasks]);

  const dailyUpdateExportRows = useMemo(() => {
    return dailyUpdateTasks.map((task) => ({
      date: toDateOnly(task.task_date || task.due_date || task.created_at || "-"),
      task: task.title || task.name || "Task",
    }));
  }, [dailyUpdateTasks]);

  const historySummary = useMemo(() => {
    const range = normalizeDateRange(historyStartDate, historyEndDate);
    const selectedEmployeeName =
      historyEmployee === "ALL"
        ? "All Employees"
        : historyEmployeeOptions.find((item) => item.id === String(historyEmployee))?.name ||
        currentUserLabel;

    return {
      selectedEmployeeName,
      taskCount: historyTasks.length,
      rangeLabel: `${formatDateLabel(range.startDate)} - ${formatDateLabel(range.endDate)}`,
    };
  }, [currentUserLabel, historyEmployee, historyEmployeeOptions, historyStartDate, historyEndDate, historyTasks.length]);

  const dailyUpdateSummary = useMemo(() => {
    const selectedEmployeeName =
      dailyUpdateEmployee === "ALL"
        ? "All Employees"
        : historyEmployeeOptions.find((item) => item.id === String(dailyUpdateEmployee))?.name ||
        currentUserLabel;

    return {
      selectedEmployeeName,
      taskCount: dailyUpdateTasks.length,
      dateLabel: formatDateLabel(dailyUpdateDate),
    };
  }, [dailyUpdateEmployee, dailyUpdateDate, currentUserLabel, historyEmployeeOptions, dailyUpdateTasks.length]);

  const handleHistoryExport = () => {
    if (historyExportRows.length === 0) {
      toast.info("Export karne ke liye history data nahi mila");
      return;
    }

    const csv = buildTaskCsv(historyExportRows);
    const safeEmployee = historySummary.selectedEmployeeName.replaceAll(" ", "_");
    downloadCsv(`task-history_${safeEmployee}_${historyStartDate}_to_${historyEndDate}.csv`, csv);
  };

  const handleDailyUpdateExport = () => {
    if (dailyUpdateExportRows.length === 0) {
      toast.info("Export karne ke liye daily update data nahi mila");
      return;
    }

    const csv = buildTaskCsv(dailyUpdateExportRows);
    const selectedEmployeeName =
      dailyUpdateEmployee === "ALL"
        ? "All_Employees"
        : historyEmployeeOptions.find((item) => item.id === String(dailyUpdateEmployee))?.name ||
        currentUserLabel.replaceAll(" ", "_");
    downloadCsv(`daily-update_${selectedEmployeeName}_${dailyUpdateDate}.csv`, csv);
  };

  const handleInlineNoteSubmit = async (projectName) => {
    if (!inlineNoteText.trim()) return;
    setCreatingNote(true);
    try {
      await createNote({
        project_name: projectName,
        note: inlineNoteText.trim(),
      });
      toast.success("Note saved");
      setInlineNoteText("");
      await loadDashboard();
    } catch (error) {
      toast.error(error?.message || "Failed to save note");
    } finally {
      setCreatingNote(false);
    }
  };

  const handleProjectDelete = async (project) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await deleteProject(project.id);
      toast.success("Project deleted");
      notifyProjectsUpdated();
    } catch (error) {
      toast.error(error?.message || "Failed to delete project");
    }
  };

  const handleNoteStatusToggle = async (note) => {
    try {
      await updateNote(note.id, { is_completed: note.is_completed ? 0 : 1 });
      await loadDashboard();
    } catch (error) {
      toast.error(error?.message || "Failed to update status");
    }
  };

  const handleNoteDelete = async (note) => {
    try {
      await deleteNote(note.id);
      toast.success("Note deleted");
      await loadDashboard();
    } catch (error) {
      toast.error(error?.message || "Failed to delete note");
    }
  };

  const handleNoteSave = async (note, projectName, value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue === note.note) {
      setEditingNote(null);
      return;
    }

    setCreatingNote(true);
    try {
      await updateNote(note.id, {
        project_name: projectName,
        note: trimmedValue,
      });
      await loadDashboard();
    } catch (error) {
      toast.error(error?.message || "Failed to update note");
    } finally {
      setCreatingNote(false);
      setEditingNote(null);
    }
  };

  const projectCardTasks = (projectName) => {
    const key = normalize(projectName);
    return notesByProject[key] || [];
  };

  const noteDisplayProjects =
    selectedProjectIds.length === 0 && !search.trim()
      ? displayedProjects.filter((project) => projectCardTasks(project.name).length > 0)
      : displayedProjects;

  return (
    <Page title="Task Dashboard">
      <>
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 bg-[#f7f9fc] px-4 sm:px-6">
          <SidebarToggleBtn />
          <button
            type="button"
            onClick={() => navigate("/dashboards/home")}
            aria-label="Go to dashboard home"
            className="shrink-0"
          >
            <img
              src="/images/askinnovationlogo.webp"
              alt="Ask Innovations"
              className="h-10 w-28 object-contain"
            />
          </button>

          {view === "dashboard" ? (
            <div className="relative ml-1 hidden w-36 shrink sm:block sm:w-52 lg:w-64">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search..."
                aria-label="Search projects and notes"
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          ) : null}

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => setOpenNoteModal(true)}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:gap-2 sm:px-4"
          >
            <Plus size={16} />
            <span>Add Note</span>
          </button>

          <div className="relative shrink-0" ref={profileMenuRef}>
            <button
              type="button"
              onClick={() => setProfileMenuOpen((open) => !open)}
              aria-label="Open profile menu"
              aria-expanded={profileMenuOpen}
              className="flex h-10 items-center gap-1 rounded-full p-0.5 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                {initialsFor(currentUserName || (isAdmin ? "Admin" : "User"))}
              </span>
              <ChevronDown size={15} className="mr-1 text-slate-500" />
            </button>

            {profileMenuOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/dashboards/home?view=history");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <History size={16} className="text-slate-500" /> History
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/dashboards/home?view=daily-update");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <CalendarDays size={16} className="text-slate-500" /> Daily Update
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setOpenProjectModal(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <FolderPlus size={16} className="text-slate-500" /> Add Project
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setOpenBulkTask(true);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <ListTodo size={16} className="text-slate-500" /> Add Task
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    navigate("/dashboards/listing");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <Users size={16} className="text-slate-500" /> Employee
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <div className="min-h-[calc(100vh-4rem)] bg-[#f7f9fc] text-slate-900">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1600px]">
          <aside className="hidden">
            <div className="px-5 py-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                <div className="text-3xl font-black leading-none tracking-tight text-slate-900">
                  ASK
                </div>
                <div className="-mt-1 text-sm font-semibold tracking-[0.25em] text-blue-700">
                  INNOVATIONS
                </div>
              </div>
            </div>

            <div className="px-3">
              <button
                onClick={() => setView("dashboard")}
                className={`flex w-full items-center justify-start rounded-xl px-4 py-3 text-left text-sm font-medium transition ${view === "dashboard"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-700 hover:bg-slate-50"
                  }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate("/dashboards/allproject")}
                className="mt-1 flex w-full items-center justify-start rounded-xl px-4 py-3 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                All Project
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-3">
              <div className="mb-3 px-1 text-sm font-semibold text-slate-700">
                All Project
              </div>
              <div className="space-y-1">
                {[
                  "Real estate CRM",
                  "DTG Tampa",
                  "Divya Santan",
                  "Ask_Innovation",
                  "Polystox",
                  "Kailtech",
                  "KRL",
                  "Kanishk",
                  "Shaleen Overseas",
                  "TGTX",
                  "Way'da",
                  "Nutrition Tracker",
                ].map((project) => (
                  <button
                    key={project}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                    <span className="truncate">{project}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 p-4">
              <div className="flex rounded-2xl bg-slate-100 p-1">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-800 shadow-sm">
                  <span>☼</span> Light
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-slate-500">
                  <span>☾</span> Dark
                </button>
              </div>
              <button className="mt-3 flex w-full items-center justify-center rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-200">
                Logout
              </button>
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            {view === "dashboard" ? (
              <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
                  <section className="min-w-0 self-start">
                    <div className="mb-3 flex items-center gap-3 px-1">
                      <h2 className="text-sm font-bold text-slate-800">
                        Projects ({filteredProjects.length})
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                      {filteredProjects.map((project) => {
                        const projectId = String(project.id);
                        const isSelected = selectedProjectIds.includes(projectId);

                        return (
                          <button
                            key={project.id}
                            type="button"
                            onClick={() => {
                              setSelectedProjectIds((current) =>
                                current.includes(projectId)
                                  ? current.filter((id) => id !== projectId)
                                  : [...current, projectId],
                              );
                            }}
                            aria-pressed={isSelected}
                            className={`min-h-[42px] min-w-0 rounded-md border px-2 py-1.5 text-left transition ${
                              isSelected
                                ? "border-blue-300 bg-blue-50 ring-1 ring-blue-100"
                                : "border-slate-200 bg-white hover:border-blue-200 hover:bg-slate-50"
                            }`}
                          >
                            <span className="block truncate text-xs font-semibold text-slate-800">
                              {project.name}
                            </span>
                          </button>
                        );
                      })}
                      {filteredProjects.length === 0 ? (
                        <p className="col-span-2 rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-sm text-slate-400">
                          {projects.length === 0 ? "No projects yet." : "No matching projects."}
                        </p>
                      ) : null}
                    </div>
                  </section>

                  <section className="min-w-0">
                    <div className="mb-3 flex items-center justify-between gap-3 px-1">
                      <div>
                        <h2 className="text-sm font-bold text-slate-800">Notes</h2>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProjectIds([]);
                          setSearch("");
                          setInlineNoteProject("");
                          setInlineNoteText("");
                        }}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Reset
                      </button>
                    </div>

                    <div className="columns-1 gap-2.5 md:columns-2">
                      {noteDisplayProjects.map((selectedProject) => {
                        const selectedProjectNotes = projectCardTasks(selectedProject.name);
                        const showSelectedComposer = inlineNoteProject === selectedProject.name;

                        return (
                          <div
                            key={selectedProject.id}
                            className="group/project mb-2.5 inline-block w-full break-inside-avoid overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
                          >
                      <>
                        <div className="flex items-center justify-between gap-3 px-3 pb-1 pt-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-sm font-bold text-slate-800">
                              {selectedProject.name}
                            </h2>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleProjectDelete(selectedProject)}
                              className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-red-50 text-red-500 opacity-0 transition-opacity hover:bg-red-100 group-hover/project:opacity-100 group-focus-within/project:opacity-100"
                              title="Delete project"
                            >
                              <Trash2 size={13} strokeWidth={2.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (showSelectedComposer) {
                                  setInlineNoteProject("");
                                  setInlineNoteText("");
                                } else {
                                  setInlineNoteProject(selectedProject.name);
                                  setInlineNoteText("");
                                }
                              }}
                              className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-blue-50 text-blue-500 opacity-0 transition-opacity hover:bg-blue-100 group-hover/project:opacity-100 group-focus-within/project:opacity-100"
                              title="Add note"
                            >
                              <Plus size={15} strokeWidth={2.5} />
                            </button>
                          </div>
                        </div>

                        <div className="space-y-1.5 px-3 pb-3 pt-1">
                          {showSelectedComposer ? (
                            <div ref={inlineNoteComposerRef} className="flex gap-2">
                              <textarea
                                ref={inlineNoteInputRef}
                                value={inlineNoteText}
                                onChange={(event) => setInlineNoteText(event.target.value)}
                                placeholder="Type note and press Enter..."
                                className="min-h-[40px] w-full flex-1 resize-none overflow-hidden rounded-md border border-blue-300 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-blue-100"
                                onInput={(event) => {
                                  event.target.style.height = "auto";
                                  event.target.style.height = `${event.target.scrollHeight}px`;
                                }}
                                onKeyDown={(event) => {
                                  if (event.key === "Enter" && !event.shiftKey) {
                                    event.preventDefault();
                                    handleInlineNoteSubmit(selectedProject.name);
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleInlineNoteSubmit(selectedProject.name)}
                                disabled={creatingNote}
                                className="self-start rounded-md bg-blue-600 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                Add
                              </button>
                            </div>
                          ) : null}

                          {selectedProjectNotes.length === 0 && !showSelectedComposer ? (
                            <div className="rounded-lg border border-dashed border-slate-200 px-4 py-10 text-center">
                              <p className="text-sm text-slate-500">No notes for this project yet.</p>
                              <button
                                type="button"
                                onClick={() => setInlineNoteProject(selectedProject.name)}
                                className="mt-3 text-sm font-semibold text-blue-600 hover:text-blue-700"
                              >
                                Add the first note
                              </button>
                            </div>
                          ) : null}

                          <div className="space-y-3">
                            {selectedProjectNotes.map((note) => {
                              const isEditing = editingNote?.id === note.id;
                              return (
                                <div
                                  key={note.id}
                                  draggable
                                  onDragStart={(event) => handleDragStart(event, note)}
                                  onDragOver={handleDragOver}
                                  onDrop={(event) => handleDrop(event, note)}
                                  className="group/note relative flex items-start gap-2 px-0.5 py-0.5 transition"
                                >
                                  <div
                                    role="checkbox"
                                    aria-checked={Boolean(note.is_completed)}
                                    tabIndex={0}
                                    className={`mt-[4px] flex h-[14px] w-[14px] shrink-0 cursor-pointer items-center justify-center rounded-[3px] border transition ${note.is_completed ? "border-blue-500 bg-blue-500 text-white" : "border-slate-300 hover:border-blue-400"}`}
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleNoteStatusToggle(note);
                                    }}
                                    onKeyDown={(event) => {
                                      if (event.key !== "Enter" && event.key !== " ") return;
                                      event.preventDefault();
                                      handleNoteStatusToggle(note);
                                    }}
                                  >
                                    {note.is_completed ? <Check size={10} strokeWidth={4} /> : null}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    {isEditing ? (
                                      <div className="flex w-full items-start gap-2">
                                        <textarea
                                          autoFocus
                                          defaultValue={note.note}
                                          className="min-h-[28px] w-full flex-1 resize-none overflow-hidden rounded-[4px] border border-blue-400 bg-white px-2 py-1 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                                          onInput={(event) => {
                                            event.target.style.height = "auto";
                                            event.target.style.height = `${event.target.scrollHeight}px`;
                                          }}
                                          onBlur={(event) =>
                                            handleNoteSave(
                                              note,
                                              selectedProject.name,
                                              event.target.value,
                                            )
                                          }
                                          onKeyDown={(event) => {
                                            if (event.key === "Enter" && !event.shiftKey) {
                                              event.preventDefault();
                                              event.target.blur();
                                            } else if (event.key === "Escape") {
                                              setEditingNote(null);
                                            }
                                          }}
                                        />
                                        <button
                                          type="button"
                                          onMouseDown={(event) => {
                                            event.preventDefault();
                                            event.currentTarget.previousSibling.blur();
                                          }}
                                          className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[4px] bg-[#10b981] text-white transition hover:bg-[#059669]"
                                        >
                                          <Check size={16} strokeWidth={3} />
                                        </button>
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() => setEditingNote(note)}
                                        className="cursor-text whitespace-pre-wrap text-[13px] leading-[20px] text-slate-600"
                                      >
                                        {note.note}
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      handleNoteDelete(note);
                                    }}
                                    className="shrink-0 p-1 text-red-400 opacity-0 transition hover:text-red-600 group-hover/note:opacity-100 group-focus-within/note:opacity-100"
                                    title="Delete note"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </>
                          </div>
                        );
                      })}
                      {noteDisplayProjects.length === 0 ? (
                        <div className="flex min-h-[160px] items-center justify-center rounded-lg border border-dashed border-slate-200 px-6 text-center text-sm text-slate-400">
                          {displayedProjects.length === 0
                            ? projects.length === 0
                              ? "Create a project to add notes."
                              : "No projects match your search."
                            : "No notes yet. Select a project to add notes."}
                        </div>
                      ) : null}
                    </div>
                  </section>
                </div>
              </div>
            ) : view === "history" ? (
              <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <h2 className="text-[18px] font-semibold text-slate-900">
                          Task History
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={handleHistoryExport}
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={historyExportRows.length === 0}
                      >
                        <Download size={16} />
                        Export CSV
                      </button>
                    </div>

                    <div className="mt-5 grid w-full gap-4 xl:grid-cols-[repeat(3,minmax(0,1fr))_auto]">
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Start Date
                        </span>
                        <div className="relative">
                          <CalendarDays
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type="date"
                            value={historyStartDate}
                            onChange={(e) => setHistoryStartDate(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                          End Date
                        </span>
                        <div className="relative">
                          <CalendarDays
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type="date"
                            value={historyEndDate}
                            onChange={(e) => setHistoryEndDate(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Employee
                        </span>
                        {isAdmin ? (
                          <select
                            value={historyEmployee}
                            onChange={(e) => setHistoryEmployee(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="ALL">All Employees</option>
                            {historyEmployeeOptions.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                            {currentUserLabel}
                          </div>
                        )}
                      </label>

                      <div className="flex items-end">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
                          <div className="font-semibold text-slate-900">
                            {historySummary.taskCount} Records
                          </div>
                          <div className="text-xs text-slate-500">
                            {historySummary.selectedEmployeeName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {historySummary.rangeLabel}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-2">
                    {Object.entries(groupedHistory).map(([employeeName, byDate]) => {
                      const employeeTaskCount = Object.values(byDate).reduce(
                        (sum, list) => sum + list.length,
                        0,
                      );

                      return (
                        <div
                          key={employeeName}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="mb-4 flex items-center justify-between gap-3">
                            <div className="text-[15px] font-semibold text-slate-900">
                              {employeeName}
                            </div>
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                              {employeeTaskCount}
                            </span>
                          </div>

                          <div className="space-y-3">
                            {Object.entries(byDate).map(([taskDate, list]) => (
                              <div key={taskDate} className="rounded-xl bg-slate-50/80 p-3">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    {formatDateLabel(taskDate)}
                                  </div>
                                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                                    {list.length}
                                  </span>
                                </div>

                                <div className="space-y-1.5">
                                  {list.map((task) => {
                                    const status = getTaskStatus(task.status);
                                    const referenceDate = toDateOnly(
                                      task.task_date || task.due_date || task.created_at || historyEndDate,
                                    );
                                    const isTaskOverdue =
                                      status !== "DONE" &&
                                      (task.due_date
                                        ? new Date(task.due_date).setHours(0, 0, 0, 0) <
                                        new Date().setHours(0, 0, 0, 0)
                                        : String(referenceDate) < todayISO());
                                    return (
                                      <div key={task.id} className="flex items-start gap-2">
                                        <div className={`mt-[3px] h-3.5 w-3.5 shrink-0 rounded-[3px] border ${status === "DONE" ? "border-emerald-400 bg-emerald-400" : status === "IN_PROGRESS" ? "border-blue-400 bg-blue-400" : "border-slate-300"}`} />
                                        <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                          <div className="min-w-0">
                                            <div className="text-[13px] leading-[20px] text-slate-600">
                                              {task.title || task.name || "Task"}
                                            </div>
                                            <div className="text-[11px] text-slate-400">
                                              {task.project_name || task.project || "General"}
                                            </div>
                                          </div>
                                          <div className="flex shrink-0 items-center gap-1.5">
                                            {isTaskOverdue ? (
                                              <span className="rounded-[3px] bg-red-600 px-1.5 py-[3px] text-[9px] font-bold uppercase leading-none tracking-wider text-white">
                                                OVERDUE
                                              </span>
                                            ) : status === "TODO" ? (
                                              <span className="rounded-[3px] bg-orange-100 px-1.5 py-[3px] text-[9px] font-bold uppercase leading-none tracking-wider text-orange-600">
                                                TO DO
                                              </span>
                                            ) : status === "IN_PROGRESS" ? (
                                              <span className="rounded-[3px] bg-blue-100 px-1.5 py-[3px] text-[9px] font-bold uppercase leading-none tracking-wider text-blue-600">
                                                IN PROGRESS
                                              </span>
                                            ) : (
                                              <span className="rounded-[3px] bg-emerald-100 px-1.5 py-[3px] text-[9px] font-bold uppercase leading-none tracking-wider text-emerald-600">
                                                DONE
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {Object.keys(groupedHistory).length === 0 && !loading && (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center text-slate-400">
                        No history found for the selected range.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="border-b border-slate-200 px-6 py-5">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                      <div>
                        <h2 className="text-[18px] font-semibold text-slate-900">
                          Daily Update
                        </h2>
                      </div>

                      <button
                        type="button"
                        onClick={handleDailyUpdateExport}
                        className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={dailyUpdateExportRows.length === 0}
                      >
                        <Download size={16} />
                        Export CSV
                      </button>
                    </div>

                    <div className={isAdmin ? "mt-5 grid w-full gap-4 xl:grid-cols-[repeat(2,minmax(0,1fr))_auto]" : "mt-5 grid w-full gap-4 xl:grid-cols-[repeat(2,minmax(0,1fr))_auto]"}>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Date
                        </span>
                        <div className="relative">
                          <CalendarDays
                            size={16}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
                          <input
                            type="date"
                            value={dailyUpdateDate}
                            onChange={(e) => setDailyUpdateDate(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Employee
                        </span>
                        {isAdmin ? (
                          <select
                            value={dailyUpdateEmployee}
                            onChange={(e) => setDailyUpdateEmployee(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="ALL">All Employees</option>
                            {historyEmployeeOptions.map((employee) => (
                              <option key={employee.id} value={employee.id}>
                                {employee.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700">
                            {currentUserLabel}
                          </div>
                        )}
                      </label>

                      <div className="flex items-end">
                        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
                          <div className="font-semibold text-slate-900">
                            {dailyUpdateSummary.taskCount} Records
                          </div>
                          <div className="text-xs text-slate-500">
                            {dailyUpdateSummary.selectedEmployeeName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {dailyUpdateSummary.dateLabel}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-2">
                    {Object.entries(groupedDailyUpdate).map(([employeeName, list]) => (
                      <div
                        key={employeeName}
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                      >
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div className="text-[15px] font-semibold text-slate-900">
                            {employeeName}
                          </div>
                          <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {list.length}
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {list.map((task) => {
                            const status = getTaskStatus(task.status);
                            const isTaskOverdue =
                              status !== "DONE" &&
                              (task.due_date
                                ? new Date(task.due_date).setHours(0, 0, 0, 0) <
                                new Date().setHours(0, 0, 0, 0)
                                : String(
                                  toDateOnly(task.task_date || task.created_at || dailyUpdateDate),
                                ) < todayISO());

                            return (
                              <div key={task.id} className="flex items-start gap-2">
                                <div
                                  className={`mt-[3px] h-3.5 w-3.5 shrink-0 rounded-[3px] border ${status === "DONE" ? "border-emerald-400 bg-emerald-400" : status === "IN_PROGRESS" ? "border-blue-400 bg-blue-400" : "border-slate-300"}`}
                                />
                                <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="text-[13px] leading-[20px] text-slate-600">
                                      {task.title || task.name || "Task"}
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      {task.project_name || task.project || "General"}
                                    </div>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-1.5">
                                    {isTaskOverdue ? (
                                      <span className="rounded-[3px] bg-red-600 px-1.5 py-[3px] text-[9px] font-bold uppercase leading-none tracking-wider text-white">
                                        OVERDUE
                                      </span>
                                    ) : status === "TODO" ? (
                                      <span className="rounded-[3px] bg-orange-100 px-1.5 py-[3px] text-[9px] font-bold uppercase leading-none tracking-wider text-orange-600">
                                        TO DO
                                      </span>
                                    ) : status === "IN_PROGRESS" ? (
                                      <span className="rounded-[3px] bg-blue-100 px-1.5 py-[3px] text-[9px] font-bold uppercase leading-none tracking-wider text-blue-600">
                                        IN PROGRESS
                                      </span>
                                    ) : (
                                      <span className="rounded-[3px] bg-emerald-100 px-1.5 py-[3px] text-[9px] font-bold uppercase leading-none tracking-wider text-emerald-600">
                                        DONE
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {Object.keys(groupedDailyUpdate).length === 0 && !loading && (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center text-slate-400">
                        No daily update found for the selected date.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        <ProjectModal
          open={openProjectModal}
          loading={creatingProject}
          project={null}
          onClose={() => setOpenProjectModal(false)}
          onSubmit={async (payload) => {
            setCreatingProject(true);
            try {
              await createProject(payload);
              toast.success("Project created");
              setOpenProjectModal(false);
              notifyProjectsUpdated();
            } catch (error) {
              toast.error(error?.message || "Failed to create project");
            } finally {
              setCreatingProject(false);
            }
          }}
        />

        <NoteModal
          open={openNoteModal}
          title="Save Note"
          projectOptions={projects.map((project) => project.name).filter(Boolean)}
          onClose={() => setOpenNoteModal(false)}
          onSubmit={async (payload) => {
            setCreatingNote(true);
            try {
              await createNote(payload);
              toast.success("Note saved");
              setOpenNoteModal(false);
              await loadDashboard();
            } catch (error) {
              toast.error(error?.message || "Failed to save note");
            } finally {
              setCreatingNote(false);
            }
          }}
        />

        {/* Update note modal removed for inline editing */}

        <BulkTaskModal
          open={openBulkTask}
          onClose={() => setOpenBulkTask(false)}
          employees={employees}
          projects={projects}
          onCreateTasks={async (items) => {
            try {
              for (const task of items) {
                await createTask(task);
              }
              toast.success("Tasks created successfully");
              setOpenBulkTask(false);
              await loadDashboard();
            } catch (error) {
              toast.error(error?.message || "Failed to create tasks");
            }
          }}
        />
      </div>
      </>
    </Page>
  );
}
