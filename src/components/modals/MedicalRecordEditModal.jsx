import { useState, useEffect } from "react";
import {
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Typography,
} from "@mui/material";
import { X, Save, User, Phone, MapPin, FileText } from "lucide-react";

// Add custom CSS for animations
const styles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fade-in-up 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined' && !document.getElementById('edit-medical-modal-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'edit-medical-modal-styles';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default function MedicalRecordEditModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) {
  const [formData, setFormData] = useState({
    fullName: "",
    dateOfBirth: "",
    gender: "",
    phoneNumber: "",
    email: "",
    address: "",
    identifyNumber: "",
  });

  useEffect(() => {
    if (initialData) {
      // Capitalize gender to match MenuItem values
      const capitalizeGender = (gender) => {
        if (!gender) return "";
        return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
      };

      setFormData({
        fullName: initialData.fullName || "",
        dateOfBirth: initialData.dateOfBirth?.split("T")[0] || "",
        gender: capitalizeGender(initialData.gender),
        phoneNumber: initialData.phoneNumber || "",
        email: initialData.email || "",
        address: initialData.address || "",
        identifyNumber: initialData.identifyNumber || "",
      });
    }
  }, [initialData]);

  const handleChange = (field) => (e) =>
    setFormData({ ...formData, [field]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
          onClick={handleClose}
        />
        
        <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-hidden animate-fade-in-up border border-gray-100">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-emerald-50 via-white to-green-50 flex items-center justify-between p-8 border-b border-gray-100 z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  Update Medical Record
                </h2>
                <p className="text-sm text-gray-500 mt-1 font-medium">
                  Edit patient medical information
                </p>
              </div>
            </div>
            <IconButton
              onClick={handleClose}
              sx={{ 
                width: 40, 
                height: 40, 
                borderRadius: 3, 
                bgcolor: 'grey.100', 
                '&:hover': { 
                  bgcolor: 'grey.200', 
                  transform: 'scale(1.05)' 
                } 
              }}
            >
              <X size={20} />
            </IconButton>
          </div>

          {/* Body */}
          <form onSubmit={handleSubmit}>
            <div className="p-8 pb-24 bg-gradient-to-br from-gray-50/30 via-white to-emerald-50/20 overflow-y-auto max-h-[calc(92vh-180px)]">
              <div className="space-y-8">
                {/* Personal Information Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-emerald-50 to-green-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Personal Information
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Basic patient identification details
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                      gap: 3 
                    }}>
                      <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                        <TextField
                          label="Full Name"
                          fullWidth
                          required
                          value={formData.fullName}
                          onChange={handleChange("fullName")}
                          variant="outlined"
                          placeholder="e.g., Nguyen Van A"
                          autoFocus
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Box>

                      <TextField
                        label="Date of Birth"
                        type="date"
                        fullWidth
                        required
                        value={formData.dateOfBirth}
                        onChange={handleChange("dateOfBirth")}
                        InputLabelProps={{ shrink: true }}
                        variant="outlined"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <FormControl fullWidth required variant="outlined">
                        <InputLabel>Gender</InputLabel>
                        <Select
                          value={formData.gender}
                          onChange={handleChange("gender")}
                          label="Gender"
                          sx={{
                            borderRadius: 2,
                          }}
                        >
                          <MenuItem value="">Select Gender</MenuItem>
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </Select>
                      </FormControl>

                      <TextField
                        label="Identify Number"
                        fullWidth
                        required
                        value={formData.identifyNumber}
                        onChange={handleChange("identifyNumber")}
                        variant="outlined"
                        placeholder="e.g., 123456789003"
                        inputProps={{ maxLength: 12 }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />
                    </Box>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                        <Phone className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Contact Information
                        </h3>
                        <p className="text-xs text-gray-600 mt-0.5">
                          Phone, email and address details
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
                      gap: 3 
                    }}>
                      <TextField
                        label="Phone Number"
                        fullWidth
                        value={formData.phoneNumber}
                        onChange={handleChange("phoneNumber")}
                        variant="outlined"
                        placeholder="e.g., 0123456789"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        value={formData.email}
                        onChange={handleChange("email")}
                        variant="outlined"
                        placeholder="e.g., patient@example.com"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          },
                        }}
                      />

                      <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' } }}>
                        <TextField
                          label="Address"
                          fullWidth
                          multiline
                          rows={3}
                          value={formData.address}
                          onChange={handleChange("address")}
                          variant="outlined"
                          placeholder="e.g., 123 Main Street, City"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gradient-to-r from-gray-50 via-white to-gray-50 flex items-center justify-end gap-4 p-6 border-t border-gray-100">
              <Button
                onClick={handleClose}
                variant="outlined"
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                  fontWeight: 600
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                startIcon={<Save size={18} />}
                sx={{ 
                  borderRadius: 2, 
                  textTransform: 'none',
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                  }
                }}
              >
                Update Medical Record
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}