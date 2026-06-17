import { useEffect, useState } from "react";
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
    project: "",
    priority: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        role: "",
        phone: "",
        email: "",
        password: "",
        project: "",
        priority: "",
      });
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
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
      project: "",
      priority: "",
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm">
      <div className="mt-12 w-full max-w-lg mx-auto rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
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

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Projects (Optional)
              </label>
              <select
                value={form.project}
                onChange={(e) => handleChange("project", e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                <option value="">No project</option>
                {projectOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

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
