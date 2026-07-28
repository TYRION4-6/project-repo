import { useEffect, useState, useRef } from "react";

export default function NeonCursor() {
    const cursorRef = useRef(null);
    const followerRef = useRef(null);
    const positionRef = useRef({ x: 0, y: 0 });
    const followerPosRef = useRef({ x: 0, y: 0 });
    const requestRef = useRef(null);
    
    const [isHovered, setIsHovered] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [isTouchDevice, setIsTouchDevice] = useState(false);

    useEffect(() => {
        const touchQuery = window.matchMedia("(pointer: coarse)");
        if (touchQuery.matches) {
            setIsTouchDevice(true);
            return;
        }

        const handleMouseMove = (e) => {
            positionRef.current.x = e.clientX;
            positionRef.current.y = e.clientY;
            
            if (!isVisible) setIsVisible(true);
            
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }
        };

        const handleMouseEnter = () => setIsVisible(true);
        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseDown = () => setIsClicked(true);
        const handleMouseUp = () => setIsClicked(false);

        window.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseenter", handleMouseEnter);
        document.addEventListener("mouseleave", handleMouseLeave);
        window.addEventListener("mousedown", handleMouseDown);
        window.addEventListener("mouseup", handleMouseUp);

        const handleMouseOver = (e) => {
            const target = e.target;
            if (!target) return;

            const interactive = 
                target.closest("button") || 
                target.closest("a") || 
                target.closest("input") || 
                target.closest("select") || 
                target.closest("textarea") || 
                target.closest("[role='button']") || 
                target.closest(".sidebar-item") || 
                target.closest(".pos-product-card") || 
                target.closest(".clickable") || 
                window.getComputedStyle(target).cursor === "pointer";

            setIsHovered(!!interactive);
        };

        document.addEventListener("mouseover", handleMouseOver);

        const animateFollower = () => {
            const ease = 0.15;
            
            const dx = positionRef.current.x - followerPosRef.current.x;
            const dy = positionRef.current.y - followerPosRef.current.y;
            
            followerPosRef.current.x += dx * ease;
            followerPosRef.current.y += dy * ease;

            if (followerRef.current) {
                followerRef.current.style.transform = `translate3d(${followerPosRef.current.x}px, ${followerPosRef.current.y}px, 0)`;
            }

            requestRef.current = requestAnimationFrame(animateFollower);
        };

        requestRef.current = requestAnimationFrame(animateFollower);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseenter", handleMouseEnter);
            document.removeEventListener("mouseleave", handleMouseLeave);
            window.removeEventListener("mousedown", handleMouseDown);
            window.removeEventListener("mouseup", handleMouseUp);
            document.removeEventListener("mouseover", handleMouseOver);
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, [isVisible]);

    if (isTouchDevice) return null;

    return (
        <div className={`neon-cursor-container ${isVisible ? "visible" : ""} ${isHovered ? "hovered" : ""} ${isClicked ? "clicked" : ""}`}>
            <div ref={cursorRef} className="neon-cursor-dot" />
            <div ref={followerRef} className="neon-cursor-follower" />
        </div>
    );
}
