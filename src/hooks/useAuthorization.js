import { useCallback, useState, useEffect } from "react";

export function useAuthorization() {
  const [privileges, setPrivileges] = useState([]);

  useEffect(() => {
    // Get user from sessionStorage every time page reloads
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setPrivileges(user.privileges || []);
    }
  }, []);

  // Check a specific privilege
  const can = useCallback(
    (privilegeName) => privileges.includes(privilegeName),
    [privileges]
  );

  // Check if has at least one of the privileges (OR)
  const canAny = useCallback(
    (list) => Array.isArray(list) && list.some((p) => privileges.includes(p)),
    [privileges]
  );

  // Check if has all required privileges (AND)
  const canAll = useCallback(
    (list) => Array.isArray(list) && list.every((p) => privileges.includes(p)),
    [privileges]
  );

  return { can, canAny, canAll, privileges };
}
