import { useContext } from "react"
import { AuthContext } from "../contexts/AuthContext"
import { validateUserPermissions } from "../utils/validateUserPermission";

type UseCanParams = {
    permissions?: string[];
    roles?: string[];
}

export function useCan({ permissions, roles }: UseCanParams) {
    const { user, isAuthenticated } = useContext(AuthContext);
    if (!isAuthenticated) {
        return false;
    }

    const useHasValidPermissions = validateUserPermissions({
        user,
        permissions,
        roles
    });

    return useHasValidPermissions;
}