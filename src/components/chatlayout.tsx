import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuthStore } from '../lib/store';

function Chatlayout({ children }) {
    const user = useAuthStore((state) => state.user);
    let location = useLocation();
    const currentPath = location.pathname;
    console.log(currentPath);

    // Hide children if the currentPath is "/chat" or starts with "/chat/"
    const shouldShowChildren = user && !(
        currentPath === "/chat" ||
        currentPath.startsWith("/chat/") ||
        currentPath === "/user" ||
        currentPath.startsWith("/user") || currentPath === "/home"
    );

    return <>{shouldShowChildren ? children : null}</>;
}

export default Chatlayout;