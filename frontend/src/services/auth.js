// ✅ Webpack/CRA-ისთვის
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:8000";


/**
 * მომხმარებლის რეგისტრაცია
 */
export const registerUser = async (userData) => {
  console.log("Registering user with data:", userData);
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "რეგისტრაცია ვერ მოხერხდა");
    }

    return data;
  } catch (error) {
    console.error("Registration error:", error);
    throw error;
  }
};

/**
 * მომხმარებლის ავტორიზაცია (Login)
 */
export const loginUser = async (credentials) => {
  console.log("🔐 Logging in user:", credentials.username);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "ავტორიზაცია ვერ მოხერხდა");
    }

    // Token და user-ის შენახვა localStorage-ში
    localStorage.setItem("access_token", data.access_token);
    localStorage.setItem("user", JSON.stringify(data.user));

    console.log("✅ Login successful:", data.user);
    return data;
    
  } catch (error) {
    console.error("❌ Login error:", error);
    throw error;
  }
};

/**
 * Logout
 */
export const logoutUser = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
  console.log("👋 User logged out");
};

/**
 * მიმდინარე მომხმარებლის მიღება
 */
export const getCurrentUser = () => {
  console.log("Getting current user from localStorage");
  const userStr = localStorage.getItem("user");
  console.log("User string from localStorage:", userStr);
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Token-ის არსებობის შემოწმება
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem("access_token");
};

/**
 * Token-ის მიღება
 */
export const getToken = () => {
  return localStorage.getItem("access_token");
};

/**
 * შემოწმება: არის თუ არა მომხმარებელი Admin
 */
export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.is_admin === true;
};

/**
 * შემოწმება: არის თუ არა მომხმარებელი Moderator
 */
export const isModerator = () => {
  const user = getCurrentUser();
  return user?.is_moder === true;
};

/**
 * შემოწმება: არის თუ არა მომხმარებელი Admin ან Moderator
 */
export const isAdminOrModerator = () => {
  const user = getCurrentUser();
  return user?.is_admin === true || user?.is_moder === true;
};

/**
 * მომხმარებლის როლის მიღება (string)
 */
export const getUserRole = () => {
  const user = getCurrentUser();
  if (user?.is_admin) return 'admin';
  if (user?.is_moder) return 'moderator';
  return 'user';
};