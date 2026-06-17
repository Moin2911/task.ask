import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { projectTasks } from "app/constants/projectTasks";

export function AssignTaskModal({
  open,
  onClose,
  employee,
  onAssign,
  projectOptions = [],
}) {
  const [form, setForm] = useState({
    project: "",
    task: "",
    priority: "Medium",
  });

  useEffect(() => {
    if (open) {
      const defaultProject = projectOptions[0] || "";
      const tasks = projectTasks[defaultProject] || [];
      setForm({
        project: defaultProject,
        task: tasks[0] || "",
        priority: "Medium",
      });
    }
  }, [open, projectOptions]);

  if (!open || !employee) return null;

  const handleChange = (field, value) => {
    if (field === "project") {
      const tasks = projectTasks[value] || [];
      setForm((prev) => ({
        ...prev,
        project: value,
        task: tasks[0] || "",
      }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.project || !form.task) return;
    if (onAssign) {
      onAssign({
        employee: employee.name,
        project: form.project,
        task: form.task,
        priority: form.priority,
      });
    }
    onClose();
  };

  const taskOptions = projectTasks[form.project] || [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm">
      <div className="mt-12 w-full max-w-md mx-auto rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
        <div className="flex items-start justify-between px-6 py-4 border-b dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Assign Task
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Assign task to {employee.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project
            </label>
            <select
              value={form.project}
              onChange={(e) => handleChange("project", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {projectOptions.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Task
            </label>
            <select
              value={form.task}
              onChange={(e) => handleChange("task", e.target.value)}
              disabled={taskOptions.length === 0}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              {taskOptions.length === 0 && (
                <option value="">No predefined tasks</option>
              )}
              {taskOptions.map((task) => (
                <option key={task} value={task}>
                  {task}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={(e) => handleChange("priority", e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border dark:border-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
            >
              Done
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
