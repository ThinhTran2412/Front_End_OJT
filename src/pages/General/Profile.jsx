import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../layouts/DashboardLayout";
import api from "../../services/api";
import { useAuthStore } from "../../store/authStore";
import {
  TextField,
  Button,
  Alert,
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  CircularProgress
} from '@mui/material';
import { Edit, Save, Cancel } from '@mui/icons-material';

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

      await api.patch("/User/updateUserProfile", payload);

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
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
        {value || "-"}
      </Typography>
    </Box>
  );

  const FieldEdit = (label, name, type = "text") => (
    <TextField
      fullWidth
      label={label}
      name={name}
      type={type}
      value={form[name] || ""}
      onChange={handleInput}
      variant="outlined"
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
        }
      }}
    />
  );

  return (
    <DashboardLayout>
      <Box sx={{ minHeight: '100vh', bgcolor: 'grey.50', py: 3 }}>
        <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 } }}>
          <Paper elevation={3} sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ p: { xs: 3, md: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
                  Profile
                </Typography>

                {!editMode && profile && (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setEditMode(true)}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 3
                    }}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  {success}
                </Alert>
              )}

              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }} color="text.secondary">Loading profile...</Typography>
                </Box>
              ) : profile ? (
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3}>
                      {editMode ? (
                        <>
                          <Grid item xs={12} md={6}>
                            {FieldEdit("Full Name", "fullName")}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {FieldEdit("Email", "email", "email")}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {FieldEdit("Phone Number", "phoneNumber")}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {FieldEdit("Gender", "gender")}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {FieldEdit("Age", "age", "number")}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {FieldEdit("Date of Birth", "dateOfBirth", "date")}
                          </Grid>
                          <Grid item xs={12}>
                            {FieldEdit("Address", "address")}
                          </Grid>
                        </>
                      ) : (
                        <>
                          <Grid item xs={12} md={6}>
                            {FieldView("Full Name", profile.fullName)}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {FieldView("Email", profile.email)}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {FieldView("Phone Number", profile.phoneNumber)}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {FieldView("Gender", profile.gender)}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {FieldView("Age", profile.age)}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {FieldView(
                              "Date of Birth",
                              profile.dateOfBirth
                                ? new Date(profile.dateOfBirth).toLocaleDateString("en-GB")
                                : ""
                            )}
                          </Grid>
                          <Grid item xs={12}>
                            {FieldView("Address", profile.address)}
                          </Grid>
                        </>
                      )}
                    </Grid>

                    {editMode && (
                      <>
                        <Divider sx={{ my: 3 }} />
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                          <Button
                            variant="outlined"
                            startIcon={<Cancel />}
                            onClick={handleCancel}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              px: 3
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="contained"
                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                            onClick={handleSave}
                            disabled={saving}
                            sx={{
                              borderRadius: 2,
                              textTransform: 'none',
                              px: 3,
                              bgcolor: 'success.main',
                              '&:hover': {
                                bgcolor: 'success.dark',
                              }
                            }}
                          >
                            {saving ? 'Saving...' : 'Save Changes'}
                          </Button>
                        </Box>
                      </>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="text.secondary">
                    No profile data available.
                  </Typography>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </DashboardLayout>
  );
}