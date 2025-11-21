import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";

export default function Profile() {
  const { user: authUser, accessToken } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  // ===== Decode JWT =====
  const decodeJWT = (token) => {
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  // ===== Resolve user info =====
  let resolvedUser = authUser;
  if (!resolvedUser) {
    try {
      const raw = localStorage.getItem("user");
      resolvedUser = raw ? JSON.parse(raw) : null;
    } catch {
      resolvedUser = null;
    }
  }

  const jwtPayload = useMemo(() => {
    const token = accessToken || localStorage.getItem("accessToken");
    return token ? decodeJWT(token) : null;
  }, [accessToken]);

  const jwtUserId = useMemo(() => {
    if (!jwtPayload) return null;
    const candidates = [
      jwtPayload?.userId,
      jwtPayload?.UserId,
      jwtPayload?.uid,
      jwtPayload?.nameid,
      jwtPayload?.sub,
      jwtPayload?.["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
    ];
    return candidates.find((v) => v !== undefined && v !== null) || null;
  }, [jwtPayload]);

  const userId = useMemo(() => {
    const fromUserObj =
      resolvedUser?.userId ||
      resolvedUser?.id ||
      resolvedUser?.user?.userId ||
      resolvedUser?.user?.id ||
      null;
    return fromUserObj || jwtUserId || null;
  }, [resolvedUser, jwtUserId]);

  // ===== Fetch profile =====
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError("Cannot determine current user ID. Please log in again.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const token = accessToken || localStorage.getItem("accessToken");

        // Call API with correct query param
        const res = await api.get(`/User/getUserProfile`, {
          params: { userId }, // Pass userId as query parameter
          headers: { Authorization: `Bearer ${token}` },
        });

        const u = res?.data;
        if (!u) {
          setError("User not found.");
          setProfile(null);
          return;
        }

        const normalized = {
          userId: u.userId,
          fullName: u.fullName ?? "",
          email: u.email ?? "",
          phoneNumber: u.phoneNumber ?? "",
          gender: u.gender ?? "",
          age: u.age ?? "",
          address: u.address ?? "",
          dateOfBirth: u.dateOfBirth ?? "",
        };

        setProfile(normalized);
        setForm(normalized);
      } catch (err) {
        console.error(err);
        setError(
          err.response?.data?.message || "Failed to load profile from server."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, accessToken]);

  // ===== Handle input =====
  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSuccess("");
    setError("");
  };

  // ===== Save changes =====
  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = { userId: form.userId };

      Object.keys(form).forEach((key) => {
        if (form[key] !== "" && key !== "userId") payload[key] = form[key];
      });

      await api.put("/User/update", payload);

      setSuccess("Profile updated successfully.");
      setProfile(form);
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setForm(profile);
    setEditMode(false);
    setError("");
    setSuccess("");
  };

  // ===== Render helpers =====
  const FieldView = (label, value) => (
    <div>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-gray-900 font-medium break-words">{value || "-"}</div>
    </div>
  );

  const FieldEdit = (label, name, type = "text") => (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <input
        type={type}
        name={name}
        value={form[name] || ""}
        onChange={handleInput}
        className="w-full mt-1 px-3 py-2 border rounded-lg"
      />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 py-4">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg border p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-custom-dark-blue">
                PROFILE
              </h1>

              {!editMode && profile && (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Edit Profile
                </button>
              )}
            </div>

            {error && <div className="mb-2 text-red-600">{error}</div>}
            {success && <div className="mb-2 text-green-600">{success}</div>}

            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : profile ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {editMode ? (
                    <>
                      {FieldEdit("Fullname", "fullName")}
                      {FieldEdit("Email", "email", "email")}
                      {FieldEdit("Phone number", "phoneNumber")}
                      {FieldEdit("Gender", "gender")}
                      {FieldEdit("Age", "age", "number")}
                      {FieldEdit("Date of birth", "dateOfBirth", "date")}
                      {FieldEdit("Address", "address")}
                    </>
                  ) : (
                    <>
                      {FieldView("Fullname", profile.fullName)}
                      {FieldView("Email", profile.email)}
                      {FieldView("Phone number", profile.phoneNumber)}
                      {FieldView("Gender", profile.gender)}
                      {FieldView("Age", profile.age)}
                      {FieldView(
                        "Date of birth",
                        profile.dateOfBirth
                          ? new Date(profile.dateOfBirth).toLocaleDateString("en-GB")
                          : ""
                      )}
                      {FieldView("Address", profile.address)}
                    </>
                  )}
                </div>

                {editMode && (
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div>No profile data.</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
