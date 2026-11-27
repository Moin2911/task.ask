const {
  getAllProjects,
  getProjectsByUser,
  createProject,
  updateProject,
  deleteProject,
  upsertProjectMaster,
  getProjectMasterByProjectId,
} = require("../models/project.model.js");

const parseShowInGrid = (value, fallback = true) => {
  if (value === undefined || value === null) return fallback;
  return value === true || value === 1 || ["true", "1"].includes(String(value).toLowerCase());
};

module.exports.getProjectsService = async (user, options = {}) => {
  const role = String(user?.role || "").trim().toLowerCase();
  const scope = String(options?.scope || "").trim().toLowerCase();

  if (role === "admin" || role === "manager" || scope === "all") {
    return await getAllProjects();
  }

  return await getProjectsByUser(user.id);
};


module.exports.createProjectService = async (data, user) => {

  if (user.role !== "admin") {
    throw {
      status: 403,
      message: "Only admin can create projects"
    };
  }

  const name = String(data.name || "").trim();
  if (!name) {
    throw {
      status: 400,
      message: "Project name is required"
    };
  }

  const project = await createProject({
    name,
    description: data.description || "",
    status: data.status || "active",
    show_in_grid: parseShowInGrid(data.show_in_grid),
  });

  return project;
};

module.exports.updateProjectService = async (projectId, data, user) => {
  if (user.role !== "admin") {
    throw {
      status: 403,
      message: "Only admin can update projects",
    };
  }

  const numericId = Number(projectId);
  if (!numericId || Number.isNaN(numericId)) {
    throw {
      status: 400,
      message: "Valid project ID is required",
    };
  }

  const allProjects = await getAllProjects();
  const existingProject = allProjects.find((project) => Number(project.id) === numericId);
  if (!existingProject) {
    throw {
      status: 404,
      message: "Project not found",
    };
  }

  const name = String(data.name ?? existingProject.name).trim();
  if (!name) {
    throw {
      status: 400,
      message: "Project name is required",
    };
  }

  const showInGrid = parseShowInGrid(
    data.show_in_grid,
    Number(existingProject.show_in_grid) !== 0,
  );

  await updateProject(numericId, {
    name,
    description: String(data.description ?? existingProject.description ?? ""),
    status: String(data.status ?? existingProject.status ?? "active"),
    show_in_grid: showInGrid,
    previous_name: existingProject.name,
  });

  return {
    id: numericId,
    name,
    description: String(data.description ?? existingProject.description ?? ""),
    status: String(data.status ?? existingProject.status ?? "active"),
    show_in_grid: showInGrid ? 1 : 0,
  };
};

module.exports.upsertProjectMasterService = async (data, user) => {
  const projectId = Number(data.project_id);
  const value = String(data.value || "").trim();

  if (!projectId || Number.isNaN(projectId)) {
    throw {
      status: 400,
      message: "Valid project_id is required",
    };
  }

  if (!value) {
    throw {
      status: 400,
      message: "Value is required",
    };
  }

  const allProjects = await getAllProjects();
  const foundProject = allProjects.find((project) => Number(project.id) === projectId);
  if (!foundProject) {
    throw {
      status: 404,
      message: "Project not found",
    };
  }

  await upsertProjectMaster({
    projectId,
    value,
    userId: user.id,
  });

  return {
    project_id: projectId,
    project_name: foundProject.name,
    value,
  };
};

module.exports.getProjectMasterService = async (projectId) => {
  const numericProjectId = Number(projectId);
  if (!numericProjectId || Number.isNaN(numericProjectId)) {
    throw {
      status: 400,
      message: "Valid project_id is required",
    };
  }

  const allProjects = await getAllProjects();
  const foundProject = allProjects.find((project) => Number(project.id) === numericProjectId);
  if (!foundProject) {
    throw {
      status: 404,
      message: "Project not found",
    };
  }

  const master = await getProjectMasterByProjectId(numericProjectId);
  return {
    project_id: numericProjectId,
    project_name: foundProject.name,
    value: master?.value || "",
    updated_at: master?.updated_at || null,
  };
};

module.exports.deleteProjectService = async (projectId, user) => {
  if (user.role !== "admin") {
    throw {
      status: 403,
      message: "Only admin can delete projects",
    };
  }

  const numericId = Number(projectId);
  if (!numericId || Number.isNaN(numericId)) {
    throw {
      status: 400,
      message: "Valid project ID is required",
    };
  }

  const allProjects = await getAllProjects();
  const foundProject = allProjects.find((p) => Number(p.id) === numericId);
  if (!foundProject) {
    throw {
      status: 404,
      message: "Project not found",
    };
  }

  await deleteProject(numericId);

  return {
    id: numericId,
    name: foundProject.name,
  };
};
