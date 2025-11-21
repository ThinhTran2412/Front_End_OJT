function getPrivilegeColor(raw) {
  const groupMap = {
    // System / Read Only
    READ_ONLY: "gray",
    VIEW_EVENT_LOGS: "gray",

    // Test Order
    CREATE_TEST_ORDER: "blue",
    MODIFY_TEST_ORDER: "blue",
    DELETE_TEST_ORDER: "blue",
    REVIEW_TEST_ORDER: "blue",
    EXECUTE_BLOOD_TESTING: "blue",

    // Comments
    ADD_COMMENT: "teal",
    MODIFY_COMMENT: "teal",
    DELETE_COMMENT: "teal",

    // Configuration
    VIEW_CONFIGURATION: "red",
    CREATE_CONFIGURATION: "red",
    MODIFY_CONFIGURATION: "red",
    DELETE_CONFIGURATION: "red",

    // User Management
    VIEW_USER: "orange",
    CREATE_USER: "orange",
    MODIFY_USER: "orange",
    DELETE_USER: "orange",
    LOCK_UNLOCK_USER: "orange",

    // Role Management
    VIEW_ROLE: "yellow",
    CREATE_ROLE: "yellow",
    UPDATE_ROLE: "yellow",
    DELETE_ROLE: "yellow",

    // Reagents
    ADD_REAGENTS: "green",
    MODIFY_REAGENTS: "green",
    DELETE_REAGENTS: "green",

    // Instruments
    ADD_INSTRUMENT: "pink",
    VIEW_INSTRUMENT: "pink",
    ACTIVATE_DEACTIVATE_INSTRUMENT: "pink",
  };

  return groupMap[raw] || "gray";
}


export default function PrivilegeTag({ privilege, size = "default", closable = false, onClose, className = "" }) {
  if (!privilege) return null;

  const rawName = privilege.raw; // Original enum
  const displayName = privilege.name; // Formatted name for display
  const color = getPrivilegeColor(rawName);

  const sizeClasses = {
    small: "text-xs px-2 py-0.5",
    default: "text-sm px-3 py-1"
  };

  const bgColor = {
  blue: "bg-blue-100 text-blue-800",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  orange: "bg-orange-100 text-orange-800",
  gray: "bg-gray-100 text-gray-800",
  teal: "bg-teal-100 text-teal-800",
  yellow: "bg-yellow-100 text-yellow-800",
  pink: "bg-pink-100 text-pink-800",
}[color];


  return (
    <span className={`inline-flex items-center rounded-full font-medium ${bgColor} ${sizeClasses[size]} ${className}`}>
      {displayName}
      {closable && (
        <button onClick={onClose} className="ml-2 text-gray-600 hover:text-gray-900 text-sm leading-none">
          ×
        </button>
      )}
    </span>
  );
}
