import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

const DocsLayout: React.FC = () => {
    const navLinkClasses = "block px-4 py-2 rounded-md text-base font-medium transition-colors";
    const activeClass = "bg-gray-100 text-black";
    const inactiveClass = "text-gray-600 hover:bg-gray-100 hover:text-black";

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
                {/* Docs Sidebar */}
                <aside className="md:w-1/4 lg:w-1/5">
                    <h2 className="text-lg font-bold text-black mb-4">Documentación</h2>
                    <nav className="space-y-2">
                         <NavLink
                            to="/docs/style-guide"
                            className={({isActive}) => `${navLinkClasses} ${isActive ? activeClass : inactiveClass}`}
                        >
                            Guía de Estilo
                        </NavLink>
                        <NavLink
                            to="/docs/changelog"
                            className={({isActive}) => `${navLinkClasses} ${isActive ? activeClass : inactiveClass}`}
                        >
                            Log de Versiones
                        </NavLink>
                        <NavLink
                            to="/docs/flujos"
                            className={({isActive}) => `${navLinkClasses} ${isActive ? activeClass : inactiveClass}`}
                        >
                            Flujos de Usuario
                        </NavLink>
                    </nav>
                </aside>

                {/* Docs Content */}
                <main className="md:w-3/4 lg:w-4/5">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DocsLayout;