import { buildApiUrl } from "./apiConfig";

const STORAGE_KEY = "selectedElderlyUser";

export function getSelectedElderlyUser() {
  try {
    const rawValue = localStorage.getItem(STORAGE_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch {
    return null;
  }
}

export function setSelectedElderlyUser(elderlyUser) {
  if (!elderlyUser) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(elderlyUser));
}

export function clearSelectedElderlyUser() {
  localStorage.removeItem(STORAGE_KEY);
}

export function buildCaregiverEndpoint(elderlyId, suffix) {
  return buildApiUrl(`/api/caregiver/elderly-users/${elderlyId}${suffix}`);
}
