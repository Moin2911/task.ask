import axios from "utils/axios";

const getAuthToken = () => window.localStorage.getItem("authToken");

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getTasks = async () => {
  const response = await axios.get("/tasks", {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};

export const createTask = async (payload) => {
  const response = await axios.post("/tasks", payload, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};


export const updateTaskStatus = async (taskId, status) => {
  const payload = { status };

  try {
    const response = await axios.patch(`/tasks/${taskId}/status`, payload, {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    });

    return response.data;
  } catch (error) {
    console.error("Update failed:", error);
    throw error;
  }
};
export const deleteTask = async (taskId) => {
  const response = await axios.delete(`/tasks/${taskId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};

export const getMyTasks = async () => {
  const response = await axios.get("/tasks/my-tasks", {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};


export const getTasks1 = async (page = 1) => {
  const response = await axios.get(`/tasks?page=${page}`, {
    headers: { ...getAuthHeaders() },
  });
  return response?.data;
};

export const getTasksPage = async ({ page = 1, limit = 10, search = "" } = {}) => {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("limit", limit);
  if (search) params.set("search", search);

  const response = await axios.get(`/tasks?${params.toString()}`, {
    headers: { ...getAuthHeaders() },
  });
  return response?.data;
};

export const getMyTasks1 = async (page = 1) => {
  const response = await axios.get(`/tasks/my-tasks?page=${page}`, {
    headers: { ...getAuthHeaders() },
  });
  return response?.data;
};

export const getMyTasksPage = async ({ page = 1, limit = 10, search = "" } = {}) => {
  const params = new URLSearchParams();
  params.set("page", page);
  params.set("limit", limit);
  if (search) params.set("search", search);

  const response = await axios.get(`/tasks/my-tasks?${params.toString()}`, {
    headers: { ...getAuthHeaders() },
  });
  return response?.data;
};

export const getTaskHistory = async ({ date, employeeId } = {}) => {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (employeeId) params.set("userId", employeeId);

  const response = await axios.get(`/tasks/history?${params.toString()}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};

export const addComment = async (taskId, comment) => {
  const res = await axios.post(
    `/comments/${taskId}`,
    { comment },
    {
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
    }
  );

  return res.data;
};

export const getCommentsByTask = async (taskId) => {
  const res = await axios.get(`/comments/${taskId}`, {
    headers: { ...getAuthHeaders() },
  });

  return res.data;
};
