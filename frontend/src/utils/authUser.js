export const getStoredUserRole = () => {
  if (typeof window === "undefined") return "";

  const roleFromKey = window.localStorage.getItem("role");
  if (roleFromKey && roleFromKey.trim()) return roleFromKey.trim();

  const userDetailRaw = window.localStorage.getItem("userdetail");
  if (!userDetailRaw) return "";

  try {
    const userDetail = JSON.parse(userDetailRaw);
    if (userDetail && typeof userDetail.role === "string") {
      return userDetail.role.trim();
    }
  } catch (error) {
    console.error("Failed to parse userdetail role", error);
  }

  return "";
};

export const getStoredUser = () => {
  if (typeof window === "undefined") return null;

  const userDetailRaw = window.localStorage.getItem("userdetail");
  if (!userDetailRaw) return null;

  try {
    const userDetail = JSON.parse(userDetailRaw);
    return userDetail && typeof userDetail === "object" ? userDetail : null;
  } catch (error) {
    console.error("Failed to parse userdetail", error);
    return null;
  }
};

export const getStoredUserName = () => {
  const userDetail = getStoredUser();
  if (!userDetail) return "";

  const possibleNames = [
    userDetail.name,
    userDetail.full_name,
    userDetail.username,
    userDetail.employee_name,
  ];

  const name = possibleNames.find(
    (value) => typeof value === "string" && value.trim(),
  );

  if (name) return name.trim();

  if (typeof userDetail.email === "string" && userDetail.email.trim()) {
    return userDetail.email.split("@")[0];
  }

  return "";
};

export const getStoredUserId = () => {
  const userDetail = getStoredUser();
  if (!userDetail) return null;

  const possibleIds = [userDetail.id, userDetail.user_id, userDetail.employee_id];
  const id = possibleIds.find((value) => value !== null && value !== undefined && `${value}`.trim());

  return id !== undefined ? Number(id) || null : null;
};
