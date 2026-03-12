import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const ScrollToTop = () => {
    const { pathname, state } = useLocation();
    
    useEffect(() => {
        if (state?.noScroll) return;
        
        window.scrollTo({
            top: 0,
            behavior: 'instant'
        });
    }, [pathname]);

    return null;
};

export default ScrollToTop;
