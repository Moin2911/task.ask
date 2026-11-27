import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";

export function AddEmployeeModal({
  open,
  onClose,
  onCreateEmployee,
  projectOptions = [],
  loading = false,
}) {
  const [form, setForm] = useState({
    name: "",
    role: "",
    phone: "",
    email: "",
    password: "",
    project_ids: [],
    priority: "",
  });

  const normalizedProjects = useMemo(
    () =>
      projectOptions
        .map((project) =>
          typeof project === "string"
            ? { id: project, name: project }
            : {
                id: String(project?.id ?? ""),
                name: project?.name || String(project?.id ?? ""),
              },
        )
        .filter((project) => project.id && project.name),
    [projectOptions],
  );

  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        role: "",
        phone: "",
        email: "",
        password: "",
        project_ids: [],
        priority: "",
      });
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleProject = (projectId) => {
    setForm((prev) => {
      const current = Array.isArray(prev.project_ids) ? prev.project_ids : [];
      const next = current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId];

      return {
        ...prev,
        project_ids: next,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !form.name.trim() ||
      !form.role.trim() ||
      !form.email.trim() ||
      !form.password.trim()
    ) {
      return;
    }
    if (onCreateEmployee) {
      const created = await onCreateEmployee(form);
      if (!created) return;
    }
    setForm({
      name: "",
      role: "",
      phone: "",
      email: "",
      password: "",
      project_ids: [],
      priority: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm">
      <div className="mt-8 flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between px-6 py-4 border-b dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Add Employee
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add a new team member to the dashboard.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            disabled={loading}
          >
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Employee Name
            </label>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="e.g. Rahul Sharma"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Employee Role
            </label>
            <input
              value={form.role}
              onChange={(e) => handleChange("role", e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="e.g. Frontend Developer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="e.g. +91 90000 00000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="e.g. rahul@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => handleChange("password", e.target.value)}
              required
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="e.g. 123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Projects (Optional)
            </label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
              {normalizedProjects.length === 0 ? (
                <div className="text-sm text-gray-400">No projects available</div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {normalizedProjects.map((project) => {
                    const checked = Array.isArray(form.project_ids)
                      ? form.project_ids.includes(project.id)
                      : false;

                    return (
                      <label
                        key={project.id}
                        className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700 dark:border-gray-800 dark:text-gray-200"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleProject(project.id)}
                          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{project.name}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Selected: {Array.isArray(form.project_ids) ? form.project_ids.length : 0}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority (Optional)
              </label>
              <select
                value={form.priority}
                onChange={(e) => handleChange("priority", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">No priority</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg border dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
