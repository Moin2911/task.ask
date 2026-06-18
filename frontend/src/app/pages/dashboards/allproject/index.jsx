import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router";
import { toast } from "sonner";
import {
  CalendarDays,
  ClipboardList,
  Grid2X2,
  LayoutGrid,
  List,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Page } from "components/shared/Page";
import { TextEditor } from "components/shared/form/TextEditor";
import { htmlToDelta } from "utils/quillUtils";
import { getStoredUserRole, getStoredUserName } from "utils/authUser";
import { BulkTaskModal } from "../home/BulkTaskModal";
import {
  addComment,
  createTask,
  deleteTask,
  getCommentsByTask,
  getMyTasksPage,
  getTasksPage,
  updateTaskStatus,
} from "app/services/tasks";
import { getEmployees } from "app/services/employees";
import { getProjects } from "app/services/projects";
import { getProjectMaster, saveProjectMaster } from "app/services/projectMaster";

const normalize = (value) => String(value || "").trim().toLowerCase();

const mapStatus = (status) => {
  const value = normalize(status);
  if (["pending", "todo", "to do"].includes(value)) return "TODO";
  if (["in progress", "in_progress", "progress"].includes(value))
    return "IN_PROGRESS";
  if (["done", "completed", "complete"].includes(value)) return "DONE";
  return "TODO";
};

const statusMapToApi = {
  TODO: "pending",
  IN_PROGRESS: "in progress",
  DONE: "Completed",
};

const statusStyles = {
  TODO: "text-orange-600 border-orange-200 bg-orange-50",
  IN_PROGRESS: "text-blue-600 border-blue-200 bg-blue-50",
  DONE: "text-emerald-600 border-emerald-200 bg-emerald-50",
};

const KANBAN_COLUMNS = [
  { title: "TO DO", status: "TODO", color: "text-orange-600" },
  { title: "IN PROGRESS", status: "IN_PROGRESS", color: "text-blue-600" },
  { title: "DONE", status: "DONE", color: "text-emerald-600" },
];

const getProjectName = (task) => task.project_name || task.project || "General";

const getLeadName = (task) => task.assigned_user || task.lead || "Unassigned";

const isOverdue = (task) => {
  if (task.status === "DONE" || !task.due_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(task.due_date);
  due.setHours(0, 0, 0, 0);
  return due < today;
};

function Modal({ open, title, subtitle, onClose, children, widthClass = "max-w-6xl" }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center overflow-y-auto p-4 pt-10">
        <div className={`w-full rounded-2xl border border-slate-200 bg-white shadow-2xl ${widthClass}`}>
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
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

function ProjectMasterDrawer({ open, onClose, projects, selectedProjectId, onChangeProject }) {
  const [value, setValue] = useState("");
  const [deltaValue, setDeltaValue] = useState(undefined);

  useEffect(() => {
    if (!open || !selectedProjectId) return;
    let mounted = true;
    getProjectMaster(selectedProjectId)
      .then((res) => {
        if (!mounted) return;
        const textValue = res?.data?.value || "";
        setValue(textValue);
        setDeltaValue(htmlToDelta(textValue));
      })
      .catch(() => {
        if (mounted) {
          setValue("");
          setDeltaValue(undefined);
        }
      });
    return () => {
      mounted = false;
    };
  }, [open, selectedProjectId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-sm">
      <div className="absolute inset-y-0 right-0 w-full max-w-[760px] border-l border-slate-200 bg-white shadow-2xl">
        <div className="flex h-full flex-col">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Master</h3>
              <p className="mt-1 text-sm text-slate-500">Save project credential/details.</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={selectedProjectId}
                onChange={(e) => onChangeProject(e.target.value)}
                className="h-9 rounded-full border border-blue-200 bg-white px-4 text-sm text-blue-600 outline-none focus:border-blue-400"
              >
                <option value="">Select Project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            <TextEditor
              value={deltaValue}
              onChange={(delta, quill) => {
                setValue(quill.root.innerHTML);
              }}
              placeholder="Enter credential/details here..."
              className="h-[550px]"
              classNames={{
                root: "border border-slate-200 rounded-lg overflow-hidden",
                container: "h-full",
              }}
            />
          </div>

          <div className="mt-auto flex justify-end border-t border-slate-200 px-6 py-4">
            <button
              onClick={async () => {
                if (!selectedProjectId || !value.trim() || value.trim() === "<p><br></p>") return;
                await saveProjectMaster({
                  project_id: Number(selectedProjectId),
                  value: value.trim(),
                });
                toast.success("Master updated");
                onClose();
              }}
              className="rounded-lg bg-blue-600 px-6 py-2.5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              Update
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskDetailModal({ open, task, comments, comment, onCommentChange, onClose, onAddComment, onDelete, isAdmin }) {
  if (!open || !task) return null;
  
  const leadName = getLeadName(task);
  const initials = leadName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";
  const statusDisplay = task.status === "TODO" ? "TO DO" : task.status === "IN_PROGRESS" ? "IN PROGRESS" : "DONE";

  const formatDate = (dateString) => {
    if (!dateString) return "No date";
    return new Date(dateString).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <Modal
      open={open}
      title={task.title || task.name || "Task"}
      onClose={onClose}
      widthClass="max-w-4xl"
    >
      <div className="grid gap-6 px-6 py-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex flex-col gap-6">
          <div>
            <div className="mb-2 text-sm font-bold text-slate-800">Description</div>
            <div className="rounded-xl border border-slate-200 p-4 text-sm text-slate-600 min-h-[120px]">
              {task.description || "No description"}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-bold text-slate-800">Comments</div>
            <div className="space-y-2 mb-3 max-h-[200px] overflow-y-auto">
              {comments.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                  <div className="font-semibold text-slate-900">{item.user_name}</div>
                  <div className="text-slate-600 mt-0.5">{item.comment}</div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-400">
                  No comments yet
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                value={comment}
                onChange={(e) => onCommentChange(e.target.value)}
                placeholder="Add comment..."
                className="h-11 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <button onClick={onAddComment} className="rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-700">
                Add
              </button>
            </div>
          </div>
        </div>

        <div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Assignee</div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#6366f1] text-sm font-semibold text-white">
                {initials}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">{leadName}</div>
                <div className="text-[12px] font-medium text-slate-500">Employee</div>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Project</span>
                <span className="font-semibold text-slate-900">{getProjectName(task)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-slate-900">{statusDisplay}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Created Date</span>
                <span className="font-semibold text-slate-900">
                  {formatDate(task.created_at || task.date)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Deadline</span>
                <span className="font-semibold text-slate-900">
                  {formatDate(task.due_date || task.due)}
                </span>
              </div>
            </div>
            
            {isAdmin && (
              <div className="mt-6 border-t border-slate-100 pt-4">
                <button onClick={() => onDelete(task.id)} className="w-full inline-flex justify-center items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100">
                  <Trash2 size={16} /> Delete Task
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function AllProject() {
  const location = useLocation();
  const role = normalize(getStoredUserRole());
  const isAdmin = role === "admin";

  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState("KANBAN");
  const [search, setSearch] = useState("");
  const [selectedProject, setSelectedProject] = useState("ALL");
  const [selectedEmployee, setSelectedEmployee] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [openTaskModal, setOpenTaskModal] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [comment, setComment] = useState("");
  const [openMaster, setOpenMaster] = useState(false);
  const [selectedMasterProject, setSelectedMasterProject] = useState("");
  const [taskToDelete, setTaskToDelete] = useState(null);

  const loadData = async () => {
    try {
      const [projectsRes, employeesRes, tasksRes] = await Promise.all([
        getProjects(),
        getEmployees(),
        isAdmin ? getTasksPage({ page, limit: 500 }) : getMyTasksPage({ page, limit: 500 }),
      ]);

      const normalizedTasks = Array.isArray(tasksRes?.data)
        ? tasksRes.data.map((task) => ({
            ...task,
            title: task.title,
            project: getProjectName(task),
            lead: getLeadName(task),
            status: mapStatus(task.status),
            due: task.due_date || task.created_at || "",
          }))
        : [];

      setProjects(Array.isArray(projectsRes) ? projectsRes : []);
      setEmployees(Array.isArray(employeesRes?.data) ? employeesRes.data : employeesRes || []);
      setTasks(normalizedTasks);
      setTotalPages(tasksRes?.pagination?.totalPages || 1);
    } catch (error) {
      toast.error(error?.message || "Failed to load tasks");
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("project")) setSelectedProject(params.get("project"));
    if (params.get("employee")) setSelectedEmployee(params.get("employee"));
  }, [location.search]);

  const filteredTasks = useMemo(() => {
    const q = normalize(search);
    return tasks.filter((task) => {
      const matchesProject =
        normalize(selectedProject) === "all" || normalize(task.project) === normalize(selectedProject);
      const matchesEmployee =
        normalize(selectedEmployee) === "all" || normalize(task.lead) === normalize(selectedEmployee);
      const matchesSearch =
        !q ||
        normalize(task.title).includes(q) ||
        normalize(task.description).includes(q) ||
        normalize(task.project).includes(q) ||
        normalize(task.lead).includes(q);
      return matchesProject && matchesEmployee && matchesSearch;
    });
  }, [search, selectedEmployee, selectedProject, tasks]);

  const groupedTasks = useMemo(() => {
    return KANBAN_COLUMNS.reduce((acc, col) => {
      acc[col.status] = filteredTasks.filter((task) => task.status === col.status);
      return acc;
    }, {});
  }, [filteredTasks]);

  const openTask = async (task) => {
    setActiveTask(task);
    setComment("");
    setOpenTaskModal(true);
    try {
      const res = await getCommentsByTask(task.id);
      setComments(res?.data?.comments || []);
    } catch {
      setComments([]);
    }
  };

  const handleStatusChange = async (taskId, nextStatus) => {
    await updateTaskStatus(taskId, statusMapToApi[nextStatus]);
    setTasks((prev) => prev.map((item) => (item.id === taskId ? { ...item, status: nextStatus } : item)));
    toast.success("Task status updated");
  };

  const employeeOptions = useMemo(() => ["ALL", ...employees.map((employee) => employee.name).filter(Boolean)], [employees]);
  const projectOptions = useMemo(() => ["ALL", ...projects.map((project) => project.name).filter(Boolean)], [projects]);

  return (
    <Page title="All Projects">
      <div className="min-h-screen bg-[#f7f9fc]">
        <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
          <main className="flex min-w-0 flex-1 flex-col">


            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-1 flex-wrap gap-3">
                  <select
                    value={selectedProject}
                    onChange={(e) => setSelectedProject(e.target.value)}
                    className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                  >
                    {projectOptions.map((project) => (
                      <option key={project} value={project}>
                        {project === "ALL" ? "Select Project" : project}
                      </option>
                    ))}
                  </select>
                  {isAdmin ? (
                    <select
                      value={selectedEmployee}
                      onChange={(e) => setSelectedEmployee(e.target.value)}
                      className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none"
                    >
                      {employeeOptions.map((employee) => (
                        <option key={employee} value={employee}>
                          {employee === "ALL" ? "Select Employee" : employee}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="flex h-11 items-center rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700">
                      {getStoredUserName() || "Employee"}
                    </div>
                  )}
                  <div className="relative min-w-[260px] flex-1">
                    <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search task, project, assignee..."
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => {
                      setActiveTask(null);
                      setComments([]);
                      setOpenTaskModal(true);
                    }}
                    className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <Plus size={18} /> Add Task
                  </button>
                  <button
                    onClick={() => setOpenMaster(true)}
                    className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    <Grid2X2 size={16} /> Master
                  </button>
                  <div className="flex h-11 rounded-xl bg-slate-100 p-1">
                    <button
                      onClick={() => setView("KANBAN")}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
                        view === "KANBAN" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
                      }`}
                    >
                      <LayoutGrid size={16} /> Kanban
                    </button>
                    <button
                      onClick={() => setView("LIST")}
                      className={`inline-flex items-center gap-2 rounded-lg px-4 text-sm font-semibold transition ${
                        view === "LIST" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600"
                      }`}
                    >
                      <List size={16} /> List
                    </button>
                  </div>
                </div>
              </div>

              {view === "KANBAN" ? (
                <div className="grid grid-cols-1 gap-4 min-[700px]:grid-cols-2 xl:grid-cols-3">
                  {KANBAN_COLUMNS.map((column) => (
                    <section 
                      key={column.status} 
                      className="rounded-2xl border border-slate-200 bg-white shadow-sm"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const taskId = Number(e.dataTransfer.getData("taskId"));
                        if (taskId) {
                          handleStatusChange(taskId, column.status);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
                        <h3 className={`text-sm font-bold tracking-wide ${column.color}`}>
                          {column.title}
                        </h3>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[column.status]}`}>
                          {groupedTasks[column.status].length}
                        </span>
                      </div>

                      <div className="min-h-[520px] space-y-3 p-3">
                        {groupedTasks[column.status].map((task) => (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("taskId", task.id);
                            }}
                            onClick={() => openTask(task)}
                            className="group w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="line-clamp-2 text-[15px] font-semibold text-slate-900">
                                  {task.title || task.name}
                                </div>
                                <div className="mt-2 flex items-center gap-2 flex-wrap">
                                  <span className="text-sm text-slate-500">{task.project}</span>
                                  {task.comment_count > 0 && (
                                    <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600" title={`${task.comment_count} comments`}>
                                      💬 {task.comment_count}
                                    </span>
                                  )}
                                  {isOverdue(task) && (
                                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-red-600">
                                      OVERDUE
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTaskToDelete(task.id);
                                }}
                                className="rounded-full p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-500"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>

                            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                              <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white">
                                  {getLeadName(task).split(" ").map((n) => n[0]).join("").slice(0, 2)}
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-slate-900">{getLeadName(task)}</div>
                                  <div className="text-[11px] text-slate-500">Employee</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                <CalendarDays size={12} />
                                {task.due ? new Date(task.due).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "No date"}
                              </div>
                            </div>
                          </div>
                        ))}
                        {groupedTasks[column.status].length === 0 && (
                          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                            <ClipboardList size={34} className="mb-2 opacity-40" />
                            <div className="text-sm">No tasks</div>
                          </div>
                        )}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-6 py-4 text-left font-semibold">TASK</th>
                        <th className="px-6 py-4 text-left font-semibold">STATUS</th>
                        <th className="px-6 py-4 text-left font-semibold">ASSIGNEE</th>
                        <th className="px-6 py-4 text-left font-semibold">PROJECT</th>
                        <th className="px-6 py-4 text-left font-semibold"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTasks.map((task) => (
                        <tr key={task.id} className="border-t border-slate-100 hover:bg-slate-50">
                          <td className="px-6 py-4">
                            <button onClick={() => openTask(task)} className="text-left">
                              <div className="font-semibold text-slate-900">{task.title || task.name}</div>
                              <div className="mt-1 flex items-center gap-2">
                                <span className="text-xs text-slate-500">Task details</span>
                                {task.comment_count > 0 && (
                                  <span className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600" title={`${task.comment_count} comments`}>
                                    💬 {task.comment_count}
                                  </span>
                                )}
                                {isOverdue(task) && (
                                  <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-red-600">
                                    OVERDUE
                                  </span>
                                )}
                              </div>
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <select
                              value={task.status}
                              onChange={async (e) => {
                                await handleStatusChange(task.id, e.target.value);
                              }}
                              className={`rounded-full border px-3 py-1 text-xs font-semibold outline-none ${statusStyles[task.status]}`}
                            >
                              <option value="TODO">To Do</option>
                              <option value="IN_PROGRESS">In Progress</option>
                              <option value="DONE">Done</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-slate-900">{getLeadName(task)}</div>
                            <div className="mt-1 text-xs text-slate-500">Employee</div>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{task.project}</td>
                          <td className="px-6 py-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setTaskToDelete(task.id);
                              }}
                              className="text-slate-400 transition hover:text-rose-500"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-4 py-6">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage((prev) => prev - 1)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <div className="text-sm font-medium text-slate-700">
                    Page {page} of {totalPages}
                  </div>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </main>
        </div>

        <BulkTaskModal
          open={openTaskModal && !activeTask}
          onClose={() => setOpenTaskModal(false)}
          employees={employees}
          projects={projects}
          onCreateTasks={async (rows) => {
            try {
              for (const row of rows) {
                await createTask(row);
              }
              toast.success("Tasks created successfully");
              setOpenTaskModal(false);
              await loadData();
            } catch (error) {
              toast.error(error?.message || "Failed to create task");
            }
          }}
        />

        <TaskDetailModal
          open={openTaskModal && Boolean(activeTask)}
          task={activeTask}
          comments={comments}
          comment={comment}
          isAdmin={isAdmin}
          onCommentChange={setComment}
          onClose={() => {
            setOpenTaskModal(false);
            setActiveTask(null);
          }}
          onAddComment={async () => {
            if (!activeTask || !comment.trim()) return;
            await addComment(activeTask.id, comment.trim());
            const res = await getCommentsByTask(activeTask.id);
            const newComments = res?.data?.comments || [];
            setComments(newComments);
            setComment("");
            // Update comment_count in tasks state so UI reflects immediately
            setTasks((prev) =>
              prev.map((t) =>
                t.id === activeTask.id
                  ? { ...t, comment_count: newComments.length }
                  : t
              )
            );
            toast.success("Comment added");
          }}
          onDelete={(taskId) => {
            setTaskToDelete(taskId);
          }}
        />

        <ProjectMasterDrawer
          open={openMaster}
          projects={projects}
          selectedProjectId={selectedMasterProject || projects[0]?.id || ""}
          onChangeProject={setSelectedMasterProject}
          onClose={() => setOpenMaster(false)}
        />

        {taskToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
              <h3 className="text-lg font-bold text-slate-900">Delete Task</h3>
              <p className="mt-2 text-sm text-slate-500">Are you sure you want to delete this task? This action cannot be undone.</p>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setTaskToDelete(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">Cancel</button>
                <button onClick={() => {
                  deleteTask(taskToDelete).then(() => {
                    setTasks((prev) => prev.filter((item) => item.id !== taskToDelete));
                    toast.success("Task deleted successfully");
                    setTaskToDelete(null);
                    setOpenTaskModal(false);
                    setActiveTask(null);
                  });
                }} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 transition">Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Page>
  );
}
