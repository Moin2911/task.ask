import axios from "utils/axios";

const getAuthToken = () => window.localStorage.getItem("authToken");

const getAuthHeaders = () => {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const getNotes = async () => {
  const response = await axios.get("/notes", {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};

export const createNote = async (payload) => {
  const response = await axios.post("/notes", payload, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};

export const updateNote = async (noteId, payload) => {
  const response = await axios.patch(`/notes/${noteId}`, payload, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};

export const deleteNote = async (noteId) => {
  const response = await axios.delete(`/notes/${noteId}`, {
    headers: {
      ...getAuthHeaders(),
    },
  });
  return response?.data;
};
