import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { tabulaStore } from "../../lib/store";
import { roleCanAccess, getRoleAccess } from "../../lib/rbac";
import { UserRole } from "../../types";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const [currentUser, setCurrentUser] = useState(tabulaStore.getCurrentUser());
  const location = useLocation();

  useEffect(() => {
    return tabulaStore.subscribe(() => {
      setCurrentUser(tabulaStore.getCurrentUser());
    });
  }, []);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const permittedRoles =
    allowedRoles && allowedRoles.length > 0
      ? allowedRoles
      : getRoleAccess(location.pathname);

  if (
    permittedRoles &&
    permittedRoles.length > 0 &&
    !permittedRoles.includes(currentUser.role)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  if (
    location.pathname !== "/" &&
    location.pathname !== "/login" &&
    !roleCanAccess(location.pathname, currentUser.role)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
