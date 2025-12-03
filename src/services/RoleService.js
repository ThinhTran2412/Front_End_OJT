import api from "./api";

export const RoleService = {
  // Create Role
  createRole: async (data) => {
    try {
      const ids = Array.isArray(data.privilegeIds)
        ? data.privilegeIds
        : data.privilegeIds
        ? [data.privilegeIds]
        : [];

      const normalizedPrivilegeIds = ids
        .map((id) => (typeof id === "string" ? parseInt(id, 10) : id))
        .filter((n) => Number.isFinite(n));

      const response = await api.post("/Roles", {
        name: data.name,
        code: data.code,
        description: data.description,
        privilegeIds: normalizedPrivilegeIds,
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ Error in createRole:", error);
      const message =
        error.response?.data?.message || "Unexpected error occurred.";
      return { success: false, message };
    }
  },

  // Get all Roles list
  getAll: async () => {
    try {
      const response = await api.get("/Roles");
      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ Error in getAll:", error);
      return { success: false, message: "Failed to fetch roles." };
    }
  },

  // Get Role details by ID
  getById: async (id) => {
    try {
      if (!id) {
        return { success: false, message: "Role ID is required" };
      }

      console.log(`Fetching role with ID: ${id}`);
      const response = await api.get(`/Roles/${id}`);
      
      console.log("API Response:", response);
      console.log("Response data:", response.data);
      
      // Handle different response formats
      const roleData = response.data?.data || response.data;
      
      if (!roleData) {
        console.warn("No data in response:", response);
        return { success: false, message: "No role data found in response" };
      }

      return { success: true, data: roleData };
    } catch (error) {
      console.error("❌ Error in getById:", error);
      console.error("Error response:", error.response);
      
      const status = error.response?.status;
      let message = "Failed to fetch role details.";
      
      if (status === 404) {
        message = `Role with ID ${id} not found.`;
      } else if (status === 401) {
        message = "Authentication required. Please login again.";
      } else if (status === 403) {
        message = "You don't have permission to view this role.";
      } else if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.response?.data?.detail) {
        message = error.response.data.detail;
      } else if (error.message) {
        message = error.message;
      }
      
      return { success: false, message, error: error.response?.data };
    }
  },

  // Update Role
  update: async (id, data) => {
    try {
      const ids = Array.isArray(data.privilegeIds)
        ? data.privilegeIds
        : data.privilegeIds
        ? [data.privilegeIds]
        : [];

      const normalizedPrivilegeIds = ids
        .map((id) => (typeof id === "string" ? parseInt(id, 10) : id))
        .filter((n) => Number.isFinite(n));

      const response = await api.put(`/Roles/${id}`, {
        name: data.name,
        code: data.code,
        description: data.description,
        privilegeIds: normalizedPrivilegeIds,
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ Error in update:", error);
      const message =
        error.response?.data?.message || "Failed to update role.";
      return { success: false, message };
    }
  },

  // Delete Role
  delete: async (id) => {
    try {
      const response = await api.delete(`/Roles/${id}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error("❌ Error in delete:", error);
      const message =
        error.response?.data?.message || "Failed to delete role.";
      return { success: false, message };
    }
  },

  // Get Privileges list
  // Get Privileges list
  getAllPrivileges: async () => {
    try {
      const response = await api.get("/Privileges");
      console.log('✅ getAllPrivileges response:', response.data);
      
      return { 
        success: true, 
        data: Array.isArray(response.data) ? response.data : []
      };
    } catch (error) {
      console.error("❌ Error in getAllPrivileges:", error);
      return { 
        success: false, 
        message: error.response?.data?.message || "Failed to fetch privileges.",
        data: []
      };
    }
  },
};
