import React from "react";
import {
    createRootRoute,
    Outlet,
    Link,
    useLocation,
} from "@tanstack/react-router";
import { ThemeController } from "./common/ThemeController";

type NavAction = {
    label: string;
    to: string;
};

const navActions: Record<string, NavAction> = {
    "/": { label: "Join Room", to: "/rooms" },
    "/rooms": { label: "Go Home", to: "/" },
};

type LayoutProps = {
    children: React.ReactNode;
    sidebar?: React.ReactNode;
    footer?: React.ReactNode;
};

function Layout({ children, sidebar, footer }: LayoutProps) {
    const { pathname } = useLocation();
    const action = navActions[pathname];

    return (
        <div className="drawer lg:drawer-open min-h-screen">
            <input
                id="sidebar-toggle"
                type="checkbox"
                className="drawer-toggle"
            />

            <div className="drawer-content flex flex-col">
                {/* Navbar */}
                <div className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-10">
                    {sidebar && (
                        <label
                            htmlFor="sidebar-toggle"
                            className="btn btn-ghost drawer-button lg:hidden"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </label>
                    )}
                    <div className="navbar-start">
                        <span className="text-xl font-bold">Monte Carlo</span>
                    </div>
                    <div className="navbar-end">
                        <div className="flex flex-row items-center gap-3">
                            <ThemeController />
                            {action && (
                                <Link
                                    to={action.to}
                                    className="btn btn-sm btn-primary"
                                >
                                    {action.label}
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main content */}
                <main className="flex-1 p-6 bg-base-200">{children}</main>

                {/* Footer */}
                {footer && (
                    <footer className="footer footer-center p-4 bg-base-100 border-t border-base-200 text-base-content">
                        {footer}
                    </footer>
                )}
            </div>

            {/* Sidebar */}
            {sidebar && (
                <div className="drawer-side z-20">
                    <label
                        htmlFor="sidebar-toggle"
                        className="drawer-overlay"
                    />
                    <aside className="menu bg-base-100 min-h-full w-64 p-4 border-r border-base-200">
                        {sidebar}
                    </aside>
                </div>
            )}
        </div>
    );
}

function RootComponent() {
    return (
        <Layout>
            <Outlet />
        </Layout>
    );
}

export const rootRoute = createRootRoute({
    component: RootComponent,
});
