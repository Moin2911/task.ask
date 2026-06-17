import axios from "utils/axios";

const getAuthToken = () => window.localStorage.getItem("authToken");

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getProjectMaster = async (projectId) => {
  const response = await axios.get(`/projects/master?project_id=${projectId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};

export const saveProjectMaster = async (payload) => {
  const response = await axios.post("/projects/master", payload, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};
