import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/AuthTokenError";
import decode from 'jwt-decode';
import { validateUserPermissions } from "./validateUserPermission";

type WithSSRAuthOptions = {
    permissions?: string[];
    roles?: string[];
}

export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOptions): GetServerSideProps {
    return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
        const cookies = parseCookies(ctx);
        const token = cookies['nextauth.token'];

        if (!token) {
            return {
                redirect: {
                    destination: '/',
                    permanent: false,
                }
            }
        }

        if (options) {
            const user = decode<{ permissions: string[], roles: [] }>(token);
            const { permissions, roles } = options;

            const useHasValidPermissions = validateUserPermissions({
                user,
                permissions,
                roles
            });

            if (!useHasValidPermissions) {
                return {
                    redirect: {
                        destination: '/dashboard',
                        permanent: true
                    }

                }
            }
        }

        try {
            return await fn(ctx);

        } catch (err) {
            if (err instanceof AuthTokenError) {
                destroyCookie(ctx, 'nextauth.token')
                destroyCookie(ctx, 'nextauth.refreshToken')

                return {
                    redirect: {
                        destination: '/',
                        permanent: false,
                    }
                }
            }
        }
    }
}