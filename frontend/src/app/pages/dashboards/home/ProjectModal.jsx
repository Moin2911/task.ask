import { useEffect, useState } from "react";
import { X } from "lucide-react";

function Modal({ open, title, subtitle, onClose, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/35 backdrop-blur-sm">
      <div className="flex min-h-full items-start justify-center overflow-y-auto p-4 pt-10">
        <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close project dialog"
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

const isProjectShownInGrid = (project) =>
  project?.show_in_grid === undefined ||
  project?.show_in_grid === true ||
  Number(project?.show_in_grid) === 1;

export function ProjectModal({ open, project, onClose, onSubmit, loading }) {
  const isEditing = Boolean(project?.id);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "active",
    show_in_grid: true,
  });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: project?.name || "",
      description: project?.description || "",
      status: project?.status || "active",
      show_in_grid: isProjectShownInGrid(project),
    });
  }, [open, project]);

  return (
    <Modal
      open={open}
      title={isEditing ? "Edit Project" : "Add Project"}
      subtitle={
        isEditing
          ? "Update the project details and dashboard visibility."
          : "Create a new project section for the dashboard."
      }
      onClose={onClose}
    >
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (!form.name.trim()) return;
          await onSubmit({
            name: form.name.trim(),
            description: form.description.trim(),
            status: form.status,
            show_in_grid: form.show_in_grid,
          });
        }}
        className="space-y-5 px-6 py-5"
      >
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Project Name
          </span>
          <input
            required
            value={form.name}
            onChange={(event) =>
              setForm((current) => ({ ...current, name: event.target.value }))
            }
            placeholder="e.g. Ask Innovation"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Description
          </span>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Short project description"
            rows={4}
            className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Status
          </span>
          <select
            value={form.status}
            onChange={(event) =>
              setForm((current) => ({ ...current, status: event.target.value }))
            }
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 px-4 py-3">
          <div>
            <div className="text-sm font-medium text-slate-800">Show in grid</div>
            <div className="mt-0.5 text-xs text-slate-500">
              Show this project in the dashboard project grid.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={form.show_in_grid}
            aria-label="Show project in dashboard grid"
            onClick={() =>
              setForm((current) => ({
                ...current,
                show_in_grid: !current.show_in_grid,
              }))
            }
            className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition ${
              form.show_in_grid ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                form.show_in_grid ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>

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
            disabled={loading || !form.name.trim()}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? isEditing
                ? "Saving..."
                : "Creating..."
              : isEditing
                ? "Save Changes"
                : "Create Project"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

