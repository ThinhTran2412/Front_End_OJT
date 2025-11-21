/**
 * Utility functions for file operations
 */

/**
 * Download a blob as a file
 * @param {Blob} blob - The blob to download
 * @param {string} filename - The filename for the downloaded file
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Open a blob file in a new tab
 * @param {Blob} blob - The blob to open
 * @param {string} mimeType - The MIME type of the file
 */
export const openFileInNewTab = (blob, mimeType = 'application/pdf') => {
  const url = window.URL.createObjectURL(blob);
  window.open(url, '_blank');
  // Clean up after a delay
  setTimeout(() => window.URL.revokeObjectURL(url), 100);
};

/**
 * Validate filename - no special characters
 * @param {string} fileName - The filename to validate
 * @returns {boolean} - True if valid, false otherwise
 */
export const validateFileName = (fileName) => {
  const invalidChars = /[<>:"/\\|?*]/;
  return !invalidChars.test(fileName) && fileName.length > 0;
};

/**
 * Generate default filename for Excel export
 * @param {string} patientName - Optional patient name
 * @returns {string} - Generated filename
 */
export const generateExportFileName = (patientName = '') => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const patientPart = patientName ? `-${patientName.replace(/\s+/g, '_')}` : '';
  return `Test Orders${patientPart}-${dateStr}.xlsx`;
};

/**
 * Generate default filename for PDF print
 * @param {string} patientName - Patient name
 * @returns {string} - Generated filename
 */
export const generatePrintFileName = (patientName = '') => {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const patientPart = patientName ? `${patientName.replace(/\s+/g, '_')}-` : '';
  return `Chi_tiet-${patientPart}${dateStr}.pdf`;
};

/**
 * Get current month date range for default export
 * @returns {object} - { dateFrom, dateTo }
 */
export const getCurrentMonthRange = () => {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  return {
    dateFrom: firstDay.toISOString().split('T')[0],
    dateTo: lastDay.toISOString().split('T')[0],
  };
};

