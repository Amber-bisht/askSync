'use client';

import React, { useEffect, useRef } from 'react';

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    originX: number;
    originY: number;
}

export default function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: -1000, y: -1000 });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const particleCount = 200;
        const interactionRadius = 150;

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY };
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        resize();

        const createParticle = (): Particle => {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            return {
                x,
                y,
                originX: x,
                originY: y,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: 0.5 + Math.random() * 1.5,
                color: '#FFFFFF',
            };
        };

        // Initialize
        for (let i = 0; i < particleCount; i++) {
            particles.push(createParticle());
        }

        const radiusSq = interactionRadius * interactionRadius;

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.beginPath();
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.5;

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i];

                // Natural movement
                p.x += p.vx;
                p.y += p.vy;

                // Border bounce
                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

                // Mouse interaction - Optimized distance check
                const dx = mouseRef.current.x - p.x;
                const dy = mouseRef.current.y - p.y;
                const distSq = dx * dx + dy * dy;

                if (distSq < radiusSq) {
                    const distance = Math.sqrt(distSq);
                    const force = (interactionRadius - distance) / interactionRadius;
                    const angle = Math.atan2(dy, dx);
                    p.x -= Math.cos(angle) * force * 5;
                    p.y -= Math.sin(angle) * force * 5;
                }

                // Draw particle - Batching arcs
                ctx.moveTo(p.x + p.size, p.y);
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            }

            ctx.fill();
            animationFrameId = requestAnimationFrame(draw);
        };

        draw();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 pointer-events-none z-0"
            style={{ background: 'transparent' }}
        />
    );
}
