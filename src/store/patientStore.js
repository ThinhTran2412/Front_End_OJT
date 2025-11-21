import { create } from "zustand";

export const usePatientStore = create((set) => ({
  patients: [],
  selectedPatient: null,

  setPatients: (data) => set({ patients: data }),
  selectPatient: (patient) => set({ selectedPatient: patient }),
  clearSelected: () => set({ selectedPatient: null }),
}));
