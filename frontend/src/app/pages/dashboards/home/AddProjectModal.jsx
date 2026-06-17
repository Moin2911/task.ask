import { useEffect, useState } from "react";
import { X } from "lucide-react";

const initialForm = {
  name: "",
  description: "",
  status: "active",
};

export function AddProjectModal({ open, onClose, onCreateProject, loading }) {
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (open) {
      setForm(initialForm);
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim() || !form.description.trim()) return;
    if (onCreateProject) {
      await onCreateProject({
        name: form.name.trim(),
        description: form.description.trim(),
        status: form.status,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm">
      <div className="mx-auto mt-12 w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-start justify-between border-b px-6 py-4 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Add Project
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Create a new project for your dashboard.
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

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Name
            </label>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="e.g. CRM System"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              placeholder="e.g. Customer relationship management project"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Status
            </label>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border px-4 py-2 text-sm dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

