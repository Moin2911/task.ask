import axios from "utils/axios";

export const PROJECTS_UPDATED_EVENT = "askinnovation:projects-updated";

export const notifyProjectsUpdated = (detail) => {
  window.dispatchEvent(new CustomEvent(PROJECTS_UPDATED_EVENT, { detail }));
};

const getAuthToken = () => window.localStorage.getItem("authToken");

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getProjects = async () => {
  const response = await axios.get("/projects", {
    headers: getAuthHeaders(),
  });
  const projects = response?.data?.data;
  return Array.isArray(projects) ? projects : [];
};

export const createProject = async (payload) => {
  const response = await axios.post("/projects", payload, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};

export const updateProject = async (id, payload) => {
  const response = await axios.put(`/projects/${id}`, payload, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};

export const deleteProject = async (id) => {
  const response = await axios.delete(`/projects/${id}`, {
    headers: getAuthHeaders(),
  });
  return response?.data;
};
