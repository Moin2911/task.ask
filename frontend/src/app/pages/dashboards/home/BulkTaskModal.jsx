import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { getStoredUserId, getStoredUserName, getStoredUserRole } from "utils/authUser";
import { toast } from "sonner";
const createEmptyRow = (defaultEmployeeId = "") => ({
  title: "",
  description: "",
  employeeId: defaultEmployeeId,
  priority: "Medium",
  status: "pending",
});

export function BulkTaskModal({
  open,
  onClose,
  employees = [],
  onCreateTasks,
  projects = [],
}) {
  const userRole = (getStoredUserRole() || "").trim().toLowerCase();
  const isAdmin = userRole === "admin";
  const currentUserName = getStoredUserName();
  const currentUserId = getStoredUserId();
  const [loading, setLoading] = useState(false);

const validateTasks = () => {
  if (!selectedProjectId) {
    toast.error("Please select a project");
    return false;
  }

  const validRows = rows.filter((r) => r.title.trim());

  if (validRows.length === 0) {
    toast.error("Please add at least one task title");
    return false;
  }

  if (isAdmin) {
    const invalidEmployee = validRows.some((r) => !r.employeeId);
    if (invalidEmployee) {
      toast.error("Please assign employee to all tasks");
      return false;
    }
  }

  return true;
};

  const [selectedProjectId, setSelectedProjectId] = useState(
    projects[0]?.id || "",
  );
  const [rows, setRows] = useState(() =>
    Array.from({ length: 5 }, () => createEmptyRow(isAdmin ? "" : String(currentUserId || ""))),
  );

  const employeeOptions = useMemo(
    () =>
      employees
        .filter((e) => e?.id && e?.name)
        .map((e) => ({ id: String(e.id), name: e.name })),
    [employees],
  );

  const fixedEmployeeLabel = useMemo(() => {
    const fromList = employees.find((e) => Number(e?.id) === Number(currentUserId));
    if (fromList?.name) return fromList.name;
    return currentUserName || "Employee";
  }, [employees, currentUserId, currentUserName]);

  useEffect(() => {
    if (open) {
      setSelectedProjectId(projects[0]?.id || "");
      setRows(
        Array.from({ length: 5 }, () =>
          createEmptyRow(isAdmin ? "" : String(currentUserId || "")),
        ),
      );
    }
  }, [open, projects, isAdmin, currentUserId]);

  if (!open) return null;

  const handleRowChange = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      createEmptyRow(isAdmin ? "" : String(currentUserId || "")),
    ]);
  };
  const handleCreate = async () => {
    if (!validateTasks()) return;

    const tasks = rows
      .map((row) => {
        const selectedEmployeeId = isAdmin
          ? Number(row.employeeId) || null
          : Number(currentUserId) || null;

        return {
          title: row.title.trim(),
          description: row.description.trim(),
          project_id: parseInt(selectedProjectId),
          assigned_to: selectedEmployeeId,
          priority: row.priority.toLowerCase(),
          status: row.status,
        };
      })
      .filter((row) => row.title);

    try {
      setLoading(true);

      if (onCreateTasks) {
        await onCreateTasks(tasks); // 👈 important (await)
      }

      onClose(); // success → close modal
    } catch (err) {
      console.error("Task creation failed", err);
      alert("Failed to create tasks");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 backdrop-blur-sm overflow-y-auto pt-10 pb-10">
      <div className="w-full max-w-5xl mx-auto rounded-xl bg-white dark:bg-gray-900 shadow-xl border border-gray-200 dark:border-gray-800">
        {/* HEADER */}
        <div className="flex items-start justify-between px-6 py-4 border-b dark:border-gray-800">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Add Task
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Add multiple tasks to a project efficiently.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="w-full sm:w-64">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Project
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 dark:border-gray-700 text-gray-900 dark:text-gray-100"
              >
                {projects.length === 0 && <option value="">No projects</option>}
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border dark:border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-3 py-3 text-left w-10">#</th>
                  <th className="px-3 py-3 text-left min-w-[300px]">Task Title</th>
                  <th className="px-3 py-3 text-left min-w-[250px]">Description</th>
                  <th className="px-3 py-3 text-left min-w-[160px]">Employee</th>
                  <th className="px-3 py-3 text-left min-w-[140px]">Priority</th>
                  <th className="px-3 py-3 text-left min-w-[150px]">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr
                    key={index}
                    className="border-t dark:border-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    <td className="px-3 py-2">{index + 1}</td>
                    <td className="px-3 py-2">
                      <input
                        placeholder="Enter task title..."
                        value={row.title}
                        onChange={(e) =>
                          handleRowChange(index, "title", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        placeholder="Enter description..."
                        value={row.description}
                        onChange={(e) =>
                          handleRowChange(index, "description", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      />
                    </td>
                    <td className="px-3 py-2">
                      {isAdmin ? (
                        <select
                          value={row.employeeId}
                          onChange={(e) =>
                            handleRowChange(index, "employeeId", e.target.value)
                          }
                          className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                        >
                          <option value="">Select employee</option>
                          {employeeOptions.map((employee) => (
                            <option key={employee.id} value={employee.id}>
                              {employee.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-2 py-1.5 text-sm font-medium text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100">
                          {fixedEmployeeLabel}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.priority}
                        onChange={(e) =>
                          handleRowChange(index, "priority", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={row.status}
                        onChange={(e) =>
                          handleRowChange(index, "status", e.target.value)
                        }
                        className="w-full rounded-md border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-800 outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
                      >
                        <option value="pending">To Do</option>
                        <option value="in progress">In Progress</option>
                        <option value="Completed">Done</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={handleAddRow}
            className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span className="text-lg">+</span> Add Another Row
          </button>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between px-6 py-4 border-t dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You are creating <b>{rows.filter((r) => r.title).length}</b> tasks
            for{" "}
            <b>
              {projects.find((p) => p.id == selectedProjectId)?.name ||
                "selected project"}
            </b>
            .
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className={`px-6 py-2 text-sm font-medium rounded-lg text-white shadow-sm transition-colors
    ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {loading ? "Creating..." : "Create Tasks"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
