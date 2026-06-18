import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Page } from "components/shared/Page";
import { BulkTaskModal } from "./BulkTaskModal";
import { createProject, getProjects, deleteProject } from "app/services/projects";
import { getEmployees } from "app/services/employees";
import { createTask, getTaskHistory, getTasksPage } from "app/services/tasks";
import { createNote, deleteNote, getNotes, updateNote } from "app/services/notes";
import { getStoredUserRole } from "utils/authUser";

const todayISO = () => new Date().toISOString().slice(0, 10);

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

const getProjectName = (task) =>
  task?.project_name || task?.project || task?.projectName || "General";

const getTaskStatus = (status) => {
  const value = normalize(status);
  if (["pending", "todo", "to do"].includes(value)) return "TODO";
  if (["in progress", "in_progress", "progress"].includes(value))
    return "IN_PROGRESS";
  if (["done", "completed", "complete"].includes(value)) return "DONE";
  return "TODO";
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

function TextField({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      <input
        {...props}
        className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${props.className || ""}`}
      />
    </label>
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

function Avatar({ name, email, size = "md", className = "" }) {
  const dims = size === "lg" ? "h-12 w-12 text-base" : "h-9 w-9 text-sm";
  return (
    <div
      className={`flex items-center gap-3 rounded-full ${className}`}
    >
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-blue-500 font-semibold text-white ${dims}`}
      >
        {initialsFor(name || email)}
      </div>
    </div>
  );
}



function AddProjectModal({ open, onClose, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
  });

  useEffect(() => {
    if (open) {
      setForm({ name: "", description: "", status: "active" });
    }
  }, [open]);

  return (
    <Modal
      open={open}
      title="Add Project"
      subtitle="Create a new project section for the dashboard."
      onClose={onClose}
      className="max-w-2xl"
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!form.name.trim()) return;
          await onSubmit({
            name: form.name.trim(),
            description: form.description.trim(),
            status: form.status,
          });
        }}
        className="space-y-5 px-6 py-5"
      >
        <TextField
          label="Project Name"
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="e.g. Ask Innovation"
        />
        <TextAreaField
          label="Description"
          value={form.description}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, description: e.target.value }))
          }
          placeholder="Short project description"
          rows={4}
        />
        <SelectField
          label="Status"
          value={form.status}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, status: e.target.value }))
          }
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </SelectField>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
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

  useEffect(() => {
    const role = getStoredUserRole();
    if (role === "developer") {
      navigate("/dashboards/allproject", { replace: true });
    }
  }, [navigate]);

  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [notes, setNotes] = useState([]);
  const [historyTasks, setHistoryTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState("dashboard");
  const [historyDate, setHistoryDate] = useState(todayISO());
  const [historyEmployee, setHistoryEmployee] = useState("ALL");
  const [openProjectModal, setOpenProjectModal] = useState(false);
  const [openNoteModal, setOpenNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [openBulkTask, setOpenBulkTask] = useState(false);
  const [inlineNoteProject, setInlineNoteProject] = useState("");
  const [inlineNoteText, setInlineNoteText] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);
  const [creatingNote, setCreatingNote] = useState(false);
  const [draggedNote, setDraggedNote] = useState(null);

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

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [projectsRes, employeesRes, tasksRes, notesRes] = await Promise.all([
        getProjects(),
        getEmployees(),
        getTasksPage({ page: 1, limit: 500 }),
        getNotes(),
      ]);

      setProjects(Array.isArray(projectsRes) ? projectsRes : []);
      setEmployees(
        Array.isArray(employeesRes?.data) ? employeesRes.data : employeesRes || [],
      );
      setTasks(Array.isArray(tasksRes?.data) ? tasksRes.data : []);
      setNotes(Array.isArray(notesRes?.data) ? notesRes.data : []);
    } catch (error) {
      toast.error(error?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (date = historyDate, employee = historyEmployee) => {
    setLoading(true);
    try {
      const employeesPromise =
        employees.length === 0 ? getEmployees() : Promise.resolve(null);
      const selectedEmployeeId =
        employee === "ALL"
          ? ""
          : employees.find((item) => normalize(item.name) === normalize(employee))?.id;
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

      setHistoryTasks(Array.isArray(response?.data) ? response.data : []);
    } catch (error) {
      toast.error(error?.message || "Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryView === "history") {
      setView("history");
    } else {
      setView("dashboard");
    }
  }, [queryView]);

  useEffect(() => {
    if (view === "history") {
      loadHistory(historyDate, historyEmployee);
    } else {
      loadDashboard();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  useEffect(() => {
    if (view === "history") {
      loadHistory(historyDate, historyEmployee);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [historyDate, historyEmployee]);

  const employeesWithStats = useMemo(() => {
    const activeTasksByEmployee = tasks.reduce((acc, task) => {
      const employeeName = getEmployeeName(task);
      const status = getTaskStatus(task.status);
      if (status === "DONE") return acc;
      acc[employeeName] = (acc[employeeName] || 0) + 1;
      return acc;
    }, {});

    const projectsByEmployee = tasks.reduce((acc, task) => {
      const employeeName = getEmployeeName(task);
      const projectName = getProjectName(task);
      if (!employeeName) return acc;
      if (!acc[employeeName]) acc[employeeName] = new Set();
      acc[employeeName].add(projectName);
      return acc;
    }, {});

    return (employees || []).map((employee) => {
      const count = activeTasksByEmployee[employee.name] || 0;
      return {
        ...employee,
        taskCount: count,
        progress: Math.min(100, count * 18),
        assignedProjects: Array.from(projectsByEmployee[employee.name] || []),
      };
    });
  }, [employees, tasks]);

  const filteredProjects = useMemo(() => {
    const query = normalize(search);
    return projects.filter((project) => {
      const name = normalize(project.name);
      const noteText = notes
        .filter((item) => normalize(item.project_name) === name)
        .map((item) => item.note)
        .join(" ");
      return !query || name.includes(query) || normalize(noteText).includes(query);
    });
  }, [projects, notes, search]);

  const notesByProject = useMemo(() => {
    return notes.reduce((acc, item) => {
      const key = normalize(item.project_name);
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});
  }, [notes]);

  const groupedHistory = useMemo(() => {
    return historyTasks.reduce((acc, task) => {
      const employeeName = getEmployeeName(task);
      if (!acc[employeeName]) acc[employeeName] = [];
      acc[employeeName].push(task);
      return acc;
    }, {});
  }, [historyTasks]);

  const historyNames = useMemo(() => {
    const names = employees.map((employee) => employee.name).filter(Boolean);
    return ["ALL", ...names];
  }, [employees]);

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
      setInlineNoteProject("");
      await loadDashboard();
    } catch (error) {
      toast.error(error?.message || "Failed to save note");
    } finally {
      setCreatingNote(false);
    }
  };

  const projectCardTasks = (projectName) => {
    const key = normalize(projectName);
    return notesByProject[key] || [];
  };

  const dashboardEmployees = employeesWithStats.slice(0, 10);

  if (getStoredUserRole() === "developer") {
    return null;
  }

  return (
    <Page title="Developer Directory">
      <div className="min-h-screen bg-[#f7f9fc] text-slate-900">
        <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
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
                <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="relative w-full max-w-[420px]">
                    <Search
                      size={16}
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search..."
                      className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setOpenProjectModal(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                    >
                      <Plus size={18} /> Add Project
                    </button>
                    <button
                      onClick={() => setOpenNoteModal(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Plus size={18} /> Add Note
                    </button>
                    <button
                      onClick={() => setOpenBulkTask(true)}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Plus size={18} /> Add Task
                    </button>
                    <button
                      onClick={() => navigate("/dashboards/listing")}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                      <Plus size={18} /> Employee
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="space-y-5">
                    <div className="columns-1 gap-4 xl:columns-2">
                      {filteredProjects.map((project) => {
                        const projectNotes = projectCardTasks(project.name);
                        const showComposer = inlineNoteProject === project.name;

                        if (projectNotes.length === 0 && !showComposer) return null;

                        return (
                          <div
                            key={project.id}
                            className="mb-4 inline-block w-full break-inside-avoid rounded-xl border border-slate-200 bg-white shadow-sm"
                          >
                            <div className="flex items-center justify-between px-4 pb-2 pt-4">
                              <h3 className="text-[14px] font-bold text-slate-800">
                                {project.name}
                              </h3>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={async () => {
                                    if (!window.confirm("Delete this project?")) return;
                                    try {
                                      await deleteProject(project.id);
                                      toast.success("Project deleted");
                                      await loadDashboard();
                                    } catch (error) {
                                      toast.error(error?.message || "Failed to delete project");
                                    }
                                  }}
                                  className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-red-50 text-red-500 transition hover:bg-red-100"
                                  title="Delete project"
                                >
                                  <Trash2 size={13} strokeWidth={2.5} />
                                </button>
                                <button
                                  onClick={() =>
                                    setInlineNoteProject(
                                      showComposer ? "" : project.name,
                                    )
                                  }
                                  className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-blue-50 text-blue-500 transition hover:bg-blue-100"
                                  title="Add note"
                                >
                                  <Plus size={15} strokeWidth={2.5} />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-2 px-4 pb-4 pt-1">
                              {showComposer ? (
                                <div className="mb-2 flex gap-2">
                                  <textarea
                                    value={inlineNoteText}
                                    onChange={(e) =>
                                      setInlineNoteText(e.target.value)
                                    }
                                    placeholder="Type note and press Enter..."
                                    className="min-h-[36px] w-full flex-1 resize-none overflow-hidden rounded-md border border-blue-300 px-3 py-2 text-[13px] outline-none focus:ring-2 focus:ring-blue-100"
                                    onInput={(e) => {
                                      e.target.style.height = "auto";
                                      e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleInlineNoteSubmit(project.name);
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => handleInlineNoteSubmit(project.name)}
                                    disabled={creatingNote}
                                    className="rounded-md bg-blue-600 px-3 text-[13px] font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                                  >
                                    Add
                                  </button>
                                </div>
                              ) : null}

                              <div className="space-y-[10px]">
                                {projectNotes.map((note) => {
                                  const isEditing = editingNote?.id === note.id;
                                  return (
                                    <div
                                      key={note.id}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, note)}
                                      onDragOver={handleDragOver}
                                      onDrop={(e) => handleDrop(e, note)}
                                      className="group relative flex items-start gap-2.5 transition"
                                    >
                                      <div className="mt-[4px] h-[13px] w-[13px] shrink-0 rounded-[3px] border border-slate-300 cursor-grab active:cursor-grabbing" />
                                      <div className="min-w-0 flex-1">
                                        {isEditing ? (
                                          <div className="flex w-full items-start gap-2">
                                            <textarea
                                              autoFocus
                                              defaultValue={note.note}
                                              className="min-h-[28px] w-full flex-1 resize-none overflow-hidden rounded-[4px] border border-blue-400 bg-white px-2 py-1 text-[13px] text-slate-700 outline-none focus:ring-2 focus:ring-blue-100"
                                              onInput={(e) => {
                                                e.target.style.height = "auto";
                                                e.target.style.height = `${e.target.scrollHeight}px`;
                                              }}
                                              onBlur={async (e) => {
                                                const val = e.target.value.trim();
                                                if (!val) {
                                                  setEditingNote(null);
                                                  return;
                                                }
                                                if (val !== note.note) {
                                                  setCreatingNote(true);
                                                  try {
                                                    await updateNote(note.id, { project_name: project.name, note: val });
                                                    await loadDashboard();
                                                  } catch (error) {
                                                    toast.error(error?.message || "Failed to update note");
                                                  } finally {
                                                    setCreatingNote(false);
                                                  }
                                                }
                                                setEditingNote(null);
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === "Enter" && !e.shiftKey) {
                                                  e.preventDefault();
                                                  e.target.blur();
                                                } else if (e.key === "Escape") {
                                                  setEditingNote(null);
                                                }
                                              }}
                                            />
                                            <button
                                              type="button"
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                e.currentTarget.previousSibling.blur();
                                              }}
                                              className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[4px] bg-[#10b981] text-white transition hover:bg-[#059669]"
                                            >
                                              <Check size={16} strokeWidth={3} />
                                            </button>
                                          </div>
                                        ) : (
                                          <div
                                            onClick={() => setEditingNote(note)}
                                            className="cursor-text whitespace-pre-wrap text-[13px] leading-[20px] text-slate-500"
                                          >
                                            {note.note}
                                          </div>
                                        )}
                                      </div>
                                      <div className="flex shrink-0 items-center opacity-0 transition group-hover:opacity-100">
                                        <button
                                          type="button"
                                          onClick={async (event) => {
                                            event.stopPropagation();
                                            if (!window.confirm("Delete this note?")) return;
                                            try {
                                              await deleteNote(note.id);
                                              toast.success("Note deleted");
                                              await loadDashboard();
                                            } catch (error) {
                                              toast.error(error?.message || "Failed to delete note");
                                            }
                                          }}
                                          className="p-1 text-red-400 hover:text-red-600"
                                          title="Delete note"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Empty state removed */}

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <aside className="self-start rounded-[18px] border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-200 px-5 py-4">
                      <h3 className="text-[18px] font-semibold text-slate-900">
                        Employees
                      </h3>
                    </div>
                    <div className="max-h-[calc(100vh-260px)] space-y-4 overflow-y-auto px-4 py-4">
                      {dashboardEmployees.map((employee) => (
                        <div
                          key={employee.id}
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar
                              name={employee.name}
                              email={employee.email}
                              size="md"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[15px] font-semibold text-slate-900">
                                {employee.name}
                              </div>
                              <div className="truncate text-[13px] text-slate-500">
                                {employee.email}
                              </div>
                            </div>
                            <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-600">
                              {employee.taskCount} Active Tasks
                            </span>
                          </div>

                          {employee.assignedProjects.length > 0 && (
                            <div className="mt-4">
                              <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Assigned Projects
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {employee.assignedProjects.slice(0, 3).map((project) => (
                                  <span
                                    key={project}
                                    className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-600"
                                  >
                                    {project}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </aside>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
                <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 xl:flex-row xl:items-center xl:justify-between">
                    <div>
                      <h2 className="text-[18px] font-semibold text-slate-900">
                        Task History
                      </h2>
                    </div>

                    <div className="grid w-full gap-4 xl:max-w-2xl xl:grid-cols-2">
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
                            value={historyDate}
                            onChange={(e) => setHistoryDate(e.target.value)}
                            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                          />
                        </div>
                      </label>

                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Employee
                        </span>
                        <select
                          value={historyEmployee}
                          onChange={(e) => setHistoryEmployee(e.target.value)}
                          className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                        >
                          {historyNames.map((name) => (
                            <option key={name} value={name}>
                              {name === "ALL" ? "All Employees" : name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 p-6 xl:grid-cols-2">
                    {Object.entries(groupedHistory).map(([employeeName, list]) => (
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
                            const isTaskOverdue = status !== "DONE" && (task.due_date ? new Date(task.due_date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) : (task.date ? task.date < todayISO() : historyDate < todayISO()));
                            return (
                            <div
                              key={task.id}
                              className="flex items-start gap-2"
                            >
                              <div className={`mt-[3px] h-3.5 w-3.5 shrink-0 rounded-[3px] border ${status === "DONE" ? "border-emerald-400 bg-emerald-400" : status === "IN_PROGRESS" ? "border-blue-400 bg-blue-400" : "border-slate-300"}`} />
                              <div className="flex min-w-0 flex-1 items-center justify-between gap-2">
                                <div className="text-[13px] leading-[20px] text-slate-600">
                                  {task.title || task.name || "Task"}
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

                    {Object.keys(groupedHistory).length === 0 && !loading && (
                      <div className="col-span-full rounded-2xl border border-dashed border-slate-200 px-6 py-16 text-center text-slate-400">
                        No task
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>

        <AddProjectModal
          open={openProjectModal}
          loading={creatingProject}
          onClose={() => setOpenProjectModal(false)}
          onSubmit={async (payload) => {
            setCreatingProject(true);
            try {
              await createProject(payload);
              toast.success("Project created");
              setOpenProjectModal(false);
              await loadDashboard();
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
          projectOptions={projects.map((project) => project.name).filter((name) => projectCardTasks(name).length === 0)}
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
    </Page>
  );
}
