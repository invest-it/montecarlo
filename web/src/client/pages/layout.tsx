import React from "react";
import {
    createRootRoute,
    Outlet,
    Link,
    useLocation,
} from "@tanstack/react-router";

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
        <div className="drawer lg:drawer-open min-h-screen bg-base-200">
            <input
                id="sidebar-toggle"
                type="checkbox"
                className="drawer-toggle"
            />

            <div className="drawer-content flex flex-col">
                <nav
                    className="navbar bg-base-100 shadow-custom h-[87px] px-5 sm:px-10 flex justify-between sticky top-0 z-10"
                    aria-label="Main navigation"
                >
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
                        <Link to="/" className="flex items-center">
                            <img
                                src="/assets/investit-logo.svg"
                                alt="Invest It"
                                className="w-[166px]"
                            />
                        </Link>
                    </div>
                    <div className="navbar-end">
                        <div className="flex flex-row items-center gap-3">
                            {action && (
                                <Link
                                    to={action.to}
                                    className="btn btn-sm bg-primary text-white"
                                >
                                    {action.label}
                                </Link>
                            )}
                        </div>
                    </div>
                </nav>

                <main className="flex-1 bg-base-200 px-4 py-8 sm:px-6 lg:px-10">
                    {children}
                </main>

                {footer && (
                    <footer className="footer footer-center p-4 bg-base-100 border-t border-base-200 text-base-content">
                        {footer}
                    </footer>
                )}
                {!footer && <InvestItFooter />}
            </div>

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

function InvestItFooter() {
    return (
        <footer
            className="bg-base-100 text-base-content border-t border-t-primary pb-5 pt-10"
            aria-label="Site footer"
        >
            <div className="footer sm:footer-horizontal px-10">
                <aside>
                    <Link to="/" aria-label="Go to homepage">
                        <img
                            src="/assets/investit-footer-logo.svg"
                            alt="Invest It"
                            className="w-[78px]"
                        />
                    </Link>
                    <address className="not-italic mt-2">
                        <strong>Invest it&nbsp;e.V.</strong>
                        <br />
                        Finanzielle Bildung - unabhängig. kostenlos. fundiert.
                        <br />
                        Alsterchaussee 26
                        <br />
                        20149 Hamburg
                        <br />
                        VR 24456
                    </address>
                </aside>
            </div>
            <div className="border-t border-base-300 mt-6 pt-4">
                <p className="mx-auto font-light text-xs text-center">
                    © 2026 Invest it e.V. | Alle Rechte vorbehalten.
                </p>
            </div>
        </footer>
    );
}

export const rootRoute = createRootRoute({
    component: RootComponent,
});
