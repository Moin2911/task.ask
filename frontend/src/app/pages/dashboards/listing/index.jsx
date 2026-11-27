import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import {
  CalendarDays,
  ChevronDown,
  Check,
  Edit2,
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
import { getStoredUserName } from "utils/authUser";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from "app/services/employees";
import { getProjects, PROJECTS_UPDATED_EVENT } from "app/services/projects";
import { getTasksPage } from "app/services/tasks";


const normalize = (value) => String(value || "").trim().toLowerCase();
const initialsFor = (value) =>
  String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AD";

const normalizeProjectOptions = (projects = []) =>
  projects
    .map((project) =>
      typeof project === "string"
        ? { id: String(project), name: project }
        : {
            id: String(project?.id ?? ""),
            name: project?.name || String(project?.id ?? ""),
          },
    )
    .filter((project) => project.id && project.name);

const normalizeProjectIds = (value) => {
  if (Array.isArray(value)) {
    return value
      .flatMap((item) => String(item).split(","))
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (!value) return [];

  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const getEmployeeProjectIds = (employee) => {
  const projectIds = normalizeProjectIds(employee?.project_ids);
  if (projectIds.length > 0) return projectIds;
  if (employee?.project_id) return [String(employee.project_id)];
  return [];
};

const getProjectButtonLabel = (employee, draftIds = []) => {
  const count = draftIds.length;
  if (count === 0) return "Select projects";

  const names = Array.isArray(employee?.project_names) ? employee.project_names : [];
  if (names.length === count && names.length > 0) {
    return names.slice(0, 2).join(", ") + (names.length > 2 ? ` +${names.length - 2}` : "");
  }

  return `${count} project${count > 1 ? "s" : ""} selected`;
};

const defaultForm = {
  name: "",
  role: "",
  phone: "",
  email: "",
  password: "",
  bank_account_name: "",
  bank_account_number: "",
  bank_ifsc: "",
  aadhar_file: null,
  pan_file: null,
  status: "active",
  project_ids: [],
};

function Modal({ open, title, onClose, children, widthClass = "max-w-4xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center overflow-y-auto p-4 pt-10">
        <div className={`w-full rounded-2xl border border-slate-200 bg-white shadow-2xl ${widthClass}`}>
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            </div>
            <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
              <X size={18} />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function Field({ label, ...props }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">{label}</span>
      <input
        {...props}
        className={`h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 ${props.className || ""}`}
      />
    </label>
  );
}

function Switch({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-14 rounded-full transition ${
        checked ? "bg-blue-600" : "bg-slate-300"
      }`}
    >
      <span
        className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? "left-8" : "left-1"
        }`}
      />
    </button>
  );
}

function EmployeeModal({
  open,
  title,
  onClose,
  onSubmit,
  loading,
  initialValue,
  projects = [],
}) {
  const [form, setForm] = useState(defaultForm);
  const normalizedProjects = useMemo(() => normalizeProjectOptions(projects), [projects]);

  useEffect(() => {
    if (open) {
      setForm({
        ...defaultForm,
        ...initialValue,
        password: "",
        aadhar_file: null,
        pan_file: null,
        project_ids: getEmployeeProjectIds(initialValue),
      });
    }
  }, [open, initialValue]);

  const toggleProject = (projectId) => {
    setForm((prev) => {
      const current = Array.isArray(prev.project_ids) ? prev.project_ids : [];
      return {
        ...prev,
        project_ids: current.includes(projectId)
          ? current.filter((id) => id !== projectId)
          : [...current, projectId],
      };
    });
  };

  return (
    <Modal open={open} title={title} onClose={onClose} widthClass="max-w-4xl">
      <form
        className="max-h-[82vh] overflow-y-auto px-6 py-5"
        onSubmit={async (event) => {
          event.preventDefault();
          await onSubmit(form);
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Employee Name"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="e.g. Rahul Sharma"
          />
          <Field
            label="Employee Role"
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            placeholder="e.g. Frontend Developer"
          />
          <Field
            label="Phone Number"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="e.g. +91 90000 00000"
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="e.g. rahul@company.com"
          />
          <Field
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="e.g. 123456"
            className="md:col-span-2"
          />
          <Field
            label="Account Name"
            value={form.bank_account_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bank_account_name: e.target.value }))
            }
            placeholder="e.g. Rahul Sharma"
          />
          <Field
            label="Account Number"
            value={form.bank_account_number}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bank_account_number: e.target.value }))
            }
            placeholder="e.g. 1234567890"
          />
          <Field
            label="IFSC Code"
            value={form.bank_ifsc}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, bank_ifsc: e.target.value }))
            }
            placeholder="e.g. SBIN0001234"
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Aadhar Photo (Optional)</span>
            <input
              type="file"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, aadhar_file: e.target.files?.[0] || null }))
              }
              className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">PAN Photo (Optional)</span>
            <input
              type="file"
              onChange={(e) =>
                setForm((prev) => ({ ...prev, pan_file: e.target.files?.[0] || null }))
              }
              className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600"
            />
          </label>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">Projects</span>
            <span className="text-xs text-slate-500">
              {Array.isArray(form.project_ids) ? form.project_ids.length : 0} selected
            </span>
          </div>
          <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
            {normalizedProjects.length === 0 ? (
              <div className="text-sm text-slate-400">No projects available</div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {normalizedProjects.map((project) => {
                  const checked = Array.isArray(form.project_ids)
                    ? form.project_ids.includes(project.id)
                    : false;

                  return (
                    <label
                      key={project.id}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleProject(project.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="truncate">{project.name}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Fields mirror the backend register/update payload.
          </div>
          <div className="flex gap-3">
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
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : title}
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default function Listing() {
  const navigate = useNavigate();
  const currentUserName = getStoredUserName() || "ADMIN";
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [saving, setSaving] = useState(false);
  const [projectDrafts, setProjectDrafts] = useState({});
  const [openProjectMenuId, setOpenProjectMenuId] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const projectMenuRef = useRef(null);
  const profileMenuRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [employeesRes, projectsRes, tasksRes] = await Promise.all([
        getEmployees(),
        getProjects(),
        getTasksPage({ page: 1, limit: 500 }),
      ]);
      setEmployees(Array.isArray(employeesRes?.data) ? employeesRes.data : employeesRes || []);
      setProjects(Array.isArray(projectsRes) ? projectsRes : []);
      setTasks(Array.isArray(tasksRes?.data) ? tasksRes.data : []);
    } catch (error) {
      toast.error(error?.message || "Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const handleProjectsUpdated = () => loadData();
    window.addEventListener(PROJECTS_UPDATED_EVENT, handleProjectsUpdated);
    return () =>
      window.removeEventListener(PROJECTS_UPDATED_EVENT, handleProjectsUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const nextDrafts = employees.reduce((acc, employee) => {
      acc[employee.id] = getEmployeeProjectIds(employee);
      return acc;
    }, {});
    setProjectDrafts(nextDrafts);
  }, [employees]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (
        projectMenuRef.current?.contains(event.target) ||
        profileMenuRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpenProjectMenuId(null);
      setProfileMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenProjectMenuId(null);
        setProfileMenuOpen(false);
      }
    };

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const taskCounts = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const name = task.assigned_user || task.lead || "";
      if (!name) return acc;
      const status = normalize(task.status);
      if (["completed", "done", "complete"].includes(status)) return acc;
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
  }, [tasks]);

  const filteredEmployees = useMemo(() => {
    const q = normalize(search);
    return employees.filter((employee) => {
      const combined = normalize(
        [employee.name, employee.email, employee.phone, employee.role].join(" "),
      );
      return !q || combined.includes(q);
    });
  }, [employees, search]);

  const buildFormData = (form) => {
    const data = new FormData();
    data.append("name", form.name || "");
    data.append("role", form.role || "");
    data.append("phone", form.phone || "");
    data.append("email", form.email || "");
    if (form.password) data.append("password", form.password);
    if (form.bank_account_name) data.append("bank_account_name", form.bank_account_name);
    if (form.bank_account_number) data.append("bank_account_number", form.bank_account_number);
    if (form.bank_ifsc) data.append("bank_ifsc", form.bank_ifsc);
    if (form.status) data.append("status", form.status);
    const projectIds = normalizeProjectIds(form.project_ids);
    if (projectIds.length === 0) {
      data.append("project_ids", "");
    } else {
      projectIds.forEach((projectId) => data.append("project_ids", projectId));
      if (projectIds[0]) data.append("project_id", projectIds[0]);
    }
    if (form.aadhar_file) data.append("aadhar_file", form.aadhar_file);
    if (form.pan_file) data.append("pan_file", form.pan_file);
    return data;
  };

  const saveProjectAssignments = async (employee) => {
    const projectIds = projectDrafts[employee.id] || [];
    const payload = new FormData();
    if (projectIds.length === 0) {
      payload.append("project_ids", "");
    } else {
      projectIds.forEach((projectId) => payload.append("project_ids", projectId));
      if (projectIds[0]) payload.append("project_id", projectIds[0]);
    }

    try {
      await updateEmployee(employee.id, payload);
      toast.success("Projects updated successfully");
      setOpenProjectMenuId(null);
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Failed to update projects");
    }
  };

  const submitEmployee = async (form) => {
    setSaving(true);
    try {
      const payload = buildFormData(form);
      await createEmployee(payload);
      toast.success("Employee created successfully");
      setOpenAdd(false);
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Failed to create employee");
    } finally {
      setSaving(false);
    }
  };

  const submitEdit = async (form) => {
    if (!editingEmployee) return;
    setSaving(true);
    try {
      const payload = buildFormData(form);
      await updateEmployee(editingEmployee.id, payload);
      toast.success("Employee updated successfully");
      setOpenEdit(false);
      setEditingEmployee(null);
      await loadData();
    } catch (error) {
      toast.error(error?.message || "Failed to update employee");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page title="Employee Listing">
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

          <div className="relative ml-1 hidden w-36 shrink sm:block sm:w-52 lg:w-64">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search..."
              aria-label="Search employees"
              className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => navigate("/dashboards/home?action=add-note")}
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
                {initialsFor(currentUserName)}
              </span>
              <ChevronDown size={15} className="mr-1 text-slate-500" />
            </button>

            {profileMenuOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
                <button
                  type="button"
                  onClick={() => navigate("/dashboards/home?view=history")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <History size={16} className="text-slate-500" /> History
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboards/home?view=daily-update")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <CalendarDays size={16} className="text-slate-500" /> Daily Update
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => navigate("/dashboards/home?action=add-project")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  <FolderPlus size={16} className="text-slate-500" /> Add Project
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/dashboards/home?action=add-task")}
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

        <div className="min-h-[calc(100vh-4rem)] bg-[#f7f9fc]">
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-[1600px]">
          <main className="flex min-w-0 flex-1 flex-col">


            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
              <div className="mb-6 flex justify-end">
                <div className="flex flex-wrap gap-2">
                  <div className="hidden items-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm md:flex">
                    {employees.length} Employees / {projects.length} Projects
                  </div>
                  <button
                    onClick={() => setOpenAdd(true)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <Plus size={18} /> Add Employee
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-6 py-4 text-left font-semibold">Name</th>
                      <th className="px-6 py-4 text-left font-semibold">Role</th>
                      <th className="px-6 py-4 text-left font-semibold">Email</th>
                      <th className="px-6 py-4 text-left font-semibold">Phone</th>
                      <th className="px-6 py-4 text-left font-semibold">Projects</th>
                      <th className="px-6 py-4 text-left font-semibold">Status</th>
                      <th className="px-6 py-4 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                          Loading employees...
                        </td>
                      </tr>
                    )}
                    {filteredEmployees.map((employee) => (
                      <tr key={employee.id} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900">{employee.name}</div>
                          <div className="text-xs text-slate-500">
                            {taskCounts[employee.name] || 0} active tasks
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {employee.role ? (
                            <span className="rounded-md bg-indigo-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                              {employee.role}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-600">{employee.email}</td>
                        <td className="px-6 py-4 text-slate-600">{employee.phone || "-"}</td>
                        <td className="px-6 py-4 align-top">
                          <div
                            className="relative mx-auto w-full max-w-[210px]"
                            ref={openProjectMenuId === employee.id ? projectMenuRef : null}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenProjectMenuId((current) =>
                                  current === employee.id ? null : employee.id,
                                )
                              }
                              className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 text-left text-sm text-slate-700 shadow-sm transition hover:border-blue-300 hover:bg-blue-50"
                            >
                              <span className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {getProjectButtonLabel(
                                  employee,
                                  projectDrafts[employee.id] || getEmployeeProjectIds(employee),
                                )}
                              </span>
                              <ChevronDown size={16} className="shrink-0 text-slate-400" />
                            </button>

                            {openProjectMenuId === employee.id && (
                              <div className="absolute left-0 top-[calc(100%+8px)] z-30 w-full min-w-[280px] rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl">
                                <div className="mb-2 flex items-center justify-between">
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                                    Assign Projects
                                  </div>
                                  <div className="text-[11px] text-slate-500">
                                    {(projectDrafts[employee.id] || getEmployeeProjectIds(employee)).length} selected
                                  </div>
                                </div>
                                <div className="max-h-52 overflow-y-auto pr-1">
                                  <div className="grid gap-2">
                                    {projects.map((project) => {
                                      const current = projectDrafts[employee.id] || getEmployeeProjectIds(employee);
                                      const checked = current.includes(String(project.id));

                                      return (
                                        <label
                                          key={project.id}
                                          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                                            checked
                                              ? "border-blue-200 bg-blue-50 text-blue-700"
                                              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                          }`}
                                        >
                                          <span
                                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border ${
                                              checked
                                                ? "border-blue-600 bg-blue-600 text-white"
                                                : "border-slate-300 bg-white"
                                            }`}
                                          >
                                            {checked ? <Check size={13} strokeWidth={3} /> : null}
                                          </span>
                                          <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={() => {
                                              setProjectDrafts((prev) => {
                                                const currentIds =
                                                  prev[employee.id] || getEmployeeProjectIds(employee);
                                                const next = currentIds.includes(String(project.id))
                                                  ? currentIds.filter((id) => id !== String(project.id))
                                                  : [...currentIds, String(project.id)];
                                                return { ...prev, [employee.id]: next };
                                              });
                                            }}
                                            className="sr-only"
                                          />
                                          <span className="truncate">{project.name}</span>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                                  <button
                                    type="button"
                                    onClick={() => setOpenProjectMenuId(null)}
                                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                                  >
                                    Close
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => saveProjectAssignments(employee)}
                                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                                  >
                                    Save
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Switch
                              checked={normalize(employee.status) !== "inactive"}
                              onChange={async (enabled) => {
                                try {
                                  await updateEmployee(employee.id, {
                                    status: enabled ? "active" : "inactive",
                                  });
                                  toast.success("Status updated");
                                  await loadData();
                                } catch (error) {
                                  toast.error(error?.message || "Failed to update status");
                                }
                              }}
                            />
                            <span className="font-medium text-blue-600">
                              {normalize(employee.status) !== "inactive" ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingEmployee(employee);
                                setOpenEdit(true);
                              }}
                              className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={async () => {
                                if (!window.confirm("Delete this employee?")) return;
                                try {
                                  await deleteEmployee(employee.id);
                                  toast.success("Employee deleted successfully");
                                  await loadData();
                                } catch (error) {
                                  toast.error(error?.message || "Failed to delete employee");
                                }
                              }}
                              className="rounded-lg border border-rose-200 p-2 text-rose-500 transition hover:bg-rose-50"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>

        <EmployeeModal
          open={openAdd}
          title="Add Employee"
          loading={saving}
          onClose={() => setOpenAdd(false)}
          onSubmit={submitEmployee}
          initialValue={defaultForm}
          projects={projects}
        />

        <EmployeeModal
          open={openEdit}
          title="Update Employee"
          loading={saving}
          onClose={() => {
            setOpenEdit(false);
            setEditingEmployee(null);
          }}
          onSubmit={submitEdit}
          initialValue={
            editingEmployee
              ? {
                  name: editingEmployee.name || "",
                  role: editingEmployee.role || "",
                  phone: editingEmployee.phone || "",
                  email: editingEmployee.email || "",
                  bank_account_name: editingEmployee.bank_account_name || "",
                  bank_account_number: editingEmployee.bank_account_number || "",
                  bank_ifsc: editingEmployee.bank_ifsc || "",
                  status: editingEmployee.status || "active",
                  project_ids: getEmployeeProjectIds(editingEmployee),
                }
              : defaultForm
          }
          projects={projects}
        />
      </div>
      </>
    </Page>
  );
}
