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
  Divider,
  CircularProgress,
  Avatar,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel
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

        const res = await api.get(`/User/getUserProfile`, {
          params: { userId },
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
      size="small"
      label={label}
      name={name}
      type={type}
      value={form[name] || ""}
      onChange={handleInput}
      variant="outlined"
      multiline={name === "address"}
      rows={name === "address" ? 3 : 1}
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
        }
      }}
    />
  );

  const GenderSelect = () => (
    <FormControl fullWidth size="small">
      <InputLabel id="gender-select-label">Gender</InputLabel>
      <Select
        labelId="gender-select-label"
        name="gender"
        value={form.gender || ""}
        label="Gender"
        onChange={handleInput}
        sx={{
          borderRadius: 2,
        }}
      >
        <MenuItem value="Male">Male</MenuItem>
        <MenuItem value="Female">Female</MenuItem>
        <MenuItem value="Other">Other</MenuItem>
      </Select>
    </FormControl>
  );

  const initials = (profile?.fullName || profile?.email || 'U')
    .split(' ')
    .map((part) => part[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <DashboardLayout>
      <Box
        sx={{
          minHeight: '100vh',
          py: 4,
          px: { xs: 1, sm: 2 },
          bgcolor: 'radial-gradient(circle at top, #e0f2fe 0, #f9fafb 45%, #eef2ff 100%)',
        }}
      >
        <Box sx={{ maxWidth: 1100, mx: 'auto' }}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid rgba(148,163,184,0.35)',
              backdropFilter: 'blur(14px)',
              background:
                'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(239,246,255,0.9))',
              boxShadow:
                '0 18px 45px rgba(15,23,42,0.18), 0 0 0 1px rgba(255,255,255,0.6) inset',
            }}
          >
            {/* Header with avatar and actions */}
            <Box
              sx={{
                px: { xs: 3, md: 4 },
                pt: { xs: 3, md: 4 },
                pb: 3,
                borderBottom: '1px solid rgba(148,163,184,0.35)',
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                alignItems: { xs: 'flex-start', md: 'center' },
                justifyContent: 'space-between',
                gap: 3,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
                <Avatar
                  sx={{
                    width: 72,
                    height: 72,
                    bgcolor: 'primary.main',
                    fontSize: 28,
                    boxShadow: '0 14px 35px rgba(37,99,235,0.45)',
                  }}
                >
                  {initials}
                </Avatar>
                <Box>
                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{
                      background: 'linear-gradient(90deg,#1d4ed8,#7c3aed)',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                    }}
                  >
                    {profile?.fullName || 'My Profile'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {profile?.email || 'View and manage your personal information.'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {!editMode && profile && (
                  <Chip
                    label="Profile up to date"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(22,163,74,0.07)',
                      color: 'success.main',
                      fontWeight: 500,
                      borderRadius: 999,
                    }}
                  />
                )}
                {!editMode && profile && (
                  <Button
                    variant="contained"
                    startIcon={<Edit />}
                    onClick={() => setEditMode(true)}
                    sx={{
                      borderRadius: 999,
                      textTransform: 'none',
                      px: 3,
                      boxShadow: '0 10px 25px rgba(37,99,235,0.35)',
                    }}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>
            </Box>

            {/* Alerts */}
            {(error || success) && (
              <Box sx={{ px: { xs: 3, md: 4 }, pt: 2 }}>
                {error && (
                  <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>
                    {error}
                  </Alert>
                )}
                {success && (
                  <Alert severity="success" sx={{ mb: 1.5, borderRadius: 2 }}>
                    {success}
                  </Alert>
                )}
              </Box>
            )}

            {/* Content area */}
            <Box sx={{ px: { xs: 3, md: 4 }, py: 3.5 }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                  <CircularProgress />
                  <Typography sx={{ ml: 2 }} color="text.secondary">
                    Loading profile...
                  </Typography>
                </Box>
              ) : !profile ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="text.secondary">
                    No profile data available.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ maxWidth: 900, mx: 'auto' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      borderRadius: 3,
                      p: { xs: 2.5, md: 3 },
                      bgcolor: 'white',
                      border: '1px solid rgba(226,232,240,0.9)',
                    }}
                  >
                    <Box
                      sx={{
                        mb: 3,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Typography variant="h6" fontWeight={600}>
                        Personal Information
                      </Typography>
                      {!editMode && (
                        <Chip
                          label="Read-only view"
                          size="small"
                          sx={{
                            bgcolor: 'grey.100',
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        />
                      )}
                    </Box>

                    {/* Grid layout 2 cột */}
                    <Grid container spacing={3}>
                      {/* Cột trái */}
                      <Grid item xs={12} md={6}>
                        {/* Basic Info */}
                        <Box sx={{ mb: 3 }}>
                          <Typography 
                            variant="overline" 
                            sx={{ 
                              color: 'primary.main', 
                              fontWeight: 700,
                              letterSpacing: 1.2,
                              display: 'block',
                              mb: 2
                            }}
                          >
                            Basic Information
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {editMode ? (
                              <>
                                {FieldEdit("Full Name", "fullName")}
                                {FieldEdit("Email", "email", "email")}
                              </>
                            ) : (
                              <>
                                {FieldView("Full Name", profile.fullName)}
                                <Divider sx={{ my: 0.5 }} />
                                {FieldView("Email", profile.email)}
                              </>
                            )}
                          </Box>
                        </Box>

                        {/* Contact Info */}
                        <Box>
                          <Typography 
                            variant="overline" 
                            sx={{ 
                              color: 'primary.main', 
                              fontWeight: 700,
                              letterSpacing: 1.2,
                              display: 'block',
                              mb: 2
                            }}
                          >
                            Contact Details
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {editMode ? (
                              <>
                                {FieldEdit("Phone Number", "phoneNumber")}
                                {FieldEdit("Address", "address")}
                              </>
                            ) : (
                              <>
                                {FieldView("Phone Number", profile.phoneNumber)}
                                <Divider sx={{ my: 0.5 }} />
                                {FieldView("Address", profile.address)}
                              </>
                            )}
                          </Box>
                        </Box>
                      </Grid>

                      {/* Cột phải */}
                      <Grid item xs={12} md={6}>
                        {/* Personal Details */}
                        <Box>
                          <Typography 
                            variant="overline" 
                            sx={{ 
                              color: 'primary.main', 
                              fontWeight: 700,
                              letterSpacing: 1.2,
                              display: 'block',
                              mb: 2
                            }}
                          >
                            Personal Details
                          </Typography>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {editMode ? (
                              <>
                                <GenderSelect />
                                {FieldEdit("Age", "age", "number")}
                                {FieldEdit("Date of Birth", "dateOfBirth", "date")}
                              </>
                            ) : (
                              <>
                                {FieldView("Gender", profile.gender)}
                                <Divider sx={{ my: 0.5 }} />
                                {FieldView("Age", profile.age)}
                                <Divider sx={{ my: 0.5 }} />
                                {FieldView(
                                  "Date of Birth",
                                  profile.dateOfBirth
                                    ? new Date(profile.dateOfBirth).toLocaleDateString("en-GB")
                                    : ""
                                )}
                              </>
                            )}
                          </Box>
                        </Box>
                      </Grid>
                    </Grid>

                    {/* Action buttons */}
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
                  </Paper>
                </Box>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>
    </DashboardLayout>
  );
}