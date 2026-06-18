import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Edit2,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Page } from "components/shared/Page";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
  updateEmployee,
} from "app/services/employees";
import { getProjects } from "app/services/projects";
import { getTasksPage } from "app/services/tasks";


const normalize = (value) => String(value || "").trim().toLowerCase();

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
  project_id: "",
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

function EmployeeModal({ open, title, onClose, onSubmit, loading, initialValue }) {
  const [form, setForm] = useState(defaultForm);

  useEffect(() => {
    if (open) {
      setForm({
        ...defaultForm,
        ...initialValue,
        password: "",
        aadhar_file: null,
        pan_file: null,
      });
    }
  }, [open, initialValue]);

  return (
    <Modal open={open} title={title} onClose={onClose} widthClass="max-w-4xl">
      <form
        className="px-6 py-5"
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
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [saving, setSaving] = useState(false);

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

  const projectsByEmployee = useMemo(() => {
    return tasks.reduce((acc, task) => {
      const name = task.assigned_user || task.lead || task.employee || "";
      const projectName = task.project_name || task.project || task.projectName || "General";
      if (!name) return acc;
      if (!acc[name]) acc[name] = new Set();
      acc[name].add(projectName);
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
    if (form.project_id) data.append("project_id", form.project_id);
    if (form.aadhar_file) data.append("aadhar_file", form.aadhar_file);
    if (form.pan_file) data.append("pan_file", form.pan_file);
    return data;
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
      <div className="min-h-screen bg-[#f7f9fc]">
        <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
          <main className="flex min-w-0 flex-1 flex-col">


            <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
              <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="relative max-w-[440px] flex-1">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search..."
                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none"
                  />
                </div>

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

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
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
                        <td className="px-6 py-4">
                          <select className="h-9 w-full min-w-[130px] rounded-lg border border-slate-200 bg-slate-50 px-2 text-[13px] text-slate-700 outline-none">
                            {projectsByEmployee[employee.name] && Array.from(projectsByEmployee[employee.name]).length > 0 ? (
                              Array.from(projectsByEmployee[employee.name]).map((proj) => (
                                <option key={proj} value={proj}>{proj}</option>
                              ))
                            ) : (
                              <option value="" disabled>No Projects</option>
                            )}
                          </select>
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
                  project_id: editingEmployee.project_id || "",
                }
              : defaultForm
          }
        />
      </div>
    </Page>
  );
}
