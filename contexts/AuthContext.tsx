import Router from 'next/dist/client/router';
import { createContext, ReactNode, useEffect, useState } from 'react';
import { api } from "../services/apiClient";
import { setCookie, parseCookies, destroyCookie } from 'nookies';

type User = {
    email: string;
    permissions: string[];
    roles: string[];
}

type SignInCredentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn: (creadentials: SignInCredentials) => Promise<void>;
    signOut: () => void;
    isAuthenticated: boolean;
    user: User;
}

type AuthProviderProps = {
    children: ReactNode;
}

let authChannel: BroadcastChannel


export const AuthContext = createContext({} as AuthContextData);

export function signOut() {

    destroyCookie(undefined, 'nextauth.token');
    destroyCookie(undefined, 'nextauth.refreshToken');

    authChannel.postMessage('signOut');

    Router.push('/');
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>(null);
    const isAuthenticated = !!user;

    useEffect(() => {
        authChannel = new BroadcastChannel('auth');

        authChannel.onmessage = (message) => {
            switch (message.data) {
                case 'signOut':
                    signOut();
                    break;
                case 'signIn':
                    Router.push('/dashboard');
                    break;
                default:
                    break;
            }
        }
    }, []);

    useEffect(() => {
        const { 'nextauth.token': token } = parseCookies();
        if (token) {
            api.get(`/me`).then(response => {
                const { email, permissions, roles } = response.data

                setUser({ email, permissions, roles })
            }).catch(() => {
                signOut();
            })
        }
    }, []);

    async function signIn({ email, password }: SignInCredentials) {
        try {
            const response = await api.post('/sessions', {
                email,
                password
            });

            const { token, refreshToken, permissions, roles } = response.data;

            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            });

            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            });

            setUser({
                email,
                permissions,
                roles
            });

            api.defaults.headers['Authorization'] = `Bearer ${token}`

            Router.push('/dashboard');

            // authChannel.postMessage('signIn');
        } catch (error) {
            console.log(error);
        }

    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, signIn, user, signOut }}>
            {children}
        </AuthContext.Provider>
    )
}