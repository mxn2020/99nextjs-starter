'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Button } from '@99packages/ui/components/button';
import { Badge } from '@99packages/ui/components/badge';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface FogHeroSectionProps {
  session: any;
}

interface RevealedArea {
  x: number;
  y: number;
  id: number;
  timestamp: number;
}

export function FogHeroSection({ session }: FogHeroSectionProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [revealedAreas, setRevealedAreas] = useState<RevealedArea[]>([]);
  const [isMouseMoving, setIsMouseMoving] = useState(false);
  
  const sectionRef = useRef<HTMLElement>(null);
  const areaIdRef = useRef(0);
  const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMousePositionRef = useRef({ x: 0, y: 0 });
  const lastCleanupRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);

  const REVEAL_RADIUS = 80;
  const AREA_LIFETIME = 3000;
  const MIN_DISTANCE_THRESHOLD = 8;
  const THROTTLE_MS = 16; // ~60fps
  const CLEANUP_INTERVAL = 500; // Less frequent cleanup when not moving

  // Optimized activeAreas calculation with better caching
  const activeAreas = useMemo(() => {
    const now = Date.now();
    const filtered = revealedAreas.filter(area => now - area.timestamp < AREA_LIFETIME);
    
    // Only return new array if something actually changed
    if (filtered.length === revealedAreas.length) {
      return revealedAreas;
    }
    
    return filtered;
  }, [revealedAreas]);

  // Smart cleanup that only runs when needed
  const cleanupAreas = useCallback(() => {
    const now = Date.now();
    
    // Only cleanup if we haven't cleaned up recently AND we have areas to potentially clean
    if (now - lastCleanupRef.current < CLEANUP_INTERVAL || revealedAreas.length === 0) {
      return;
    }
    
    setRevealedAreas(prev => {
      const filtered = prev.filter(area => now - area.timestamp < AREA_LIFETIME);
      
      // Only update state if something was actually removed
      if (filtered.length === prev.length) {
        return prev;
      }
      
      lastCleanupRef.current = now;
      return filtered;
    });
  }, [revealedAreas.length]);

  // Use requestAnimationFrame for cleanup instead of setInterval
  const scheduleCleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      cleanupAreas();
      
      // Only schedule next cleanup if we have areas and mouse is not moving
      if (revealedAreas.length > 0) {
        setTimeout(() => scheduleCleanup(), isMouseMoving ? 100 : 400);
      }
    });
  }, [cleanupAreas, revealedAreas.length, isMouseMoving]);

  // Start cleanup cycle when areas are added
  useEffect(() => {
    if (revealedAreas.length > 0) {
      scheduleCleanup();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [revealedAreas.length > 0]); // Only depend on whether we have areas or not

  // Optimized canvas sizing with ResizeObserver
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const resizeObserver = new ResizeObserver(() => {
      // Only trigger re-render if we have active areas
      if (revealedAreas.length > 0) {
        setRevealedAreas(prev => [...prev]);
      }
    });

    resizeObserver.observe(section);
    return () => resizeObserver.disconnect();
  }, [revealedAreas.length > 0]);

  // Optimized mouse handling with proper throttling
  useEffect(() => {
    let lastMoveTime = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!sectionRef.current || !isHovering) return;
      
      const now = performance.now();
      if (now - lastMoveTime < THROTTLE_MS) return;
      lastMoveTime = now;

      const rect = sectionRef.current.getBoundingClientRect();
      const newX = e.clientX - rect.left;
      const newY = e.clientY - rect.top;
      
      // Check distance threshold before updating
      const distance = Math.sqrt(
        Math.pow(newX - lastMousePositionRef.current.x, 2) + 
        Math.pow(newY - lastMousePositionRef.current.y, 2)
      );
      
      if (distance < MIN_DISTANCE_THRESHOLD) return;
      
      lastMousePositionRef.current = { x: newX, y: newY };
      setMousePosition({ x: newX, y: newY });
      setIsMouseMoving(true);

      // Add new revealed area
      setRevealedAreas(prev => {
        const newArea = { 
          x: newX, 
          y: newY, 
          id: areaIdRef.current++, 
          timestamp: Date.now() 
        };
        
        // Limit array size for performance
        const newAreas = [...prev, newArea];
        return newAreas.length > 80 ? newAreas.slice(-80) : newAreas;
      });

      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }

      mouseMoveTimeoutRef.current = setTimeout(() => {
        setIsMouseMoving(false);
      }, 150);
    };

    const handleMouseEnter = (e: MouseEvent) => {
      setIsHovering(true);
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const newX = e.clientX - rect.left;
        const newY = e.clientY - rect.top;
        setMousePosition({ x: newX, y: newY });
        lastMousePositionRef.current = { x: newX, y: newY };
      }
    };
    
    const handleMouseLeave = () => {
      setIsHovering(false);
      setIsMouseMoving(false);
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
    };

    const section = sectionRef.current;
    if (section) {
      section.addEventListener('mousemove', handleMouseMove, { passive: true });
      section.addEventListener('mouseenter', handleMouseEnter, { passive: true });
      section.addEventListener('mouseleave', handleMouseLeave, { passive: true });
    }

    return () => {
      if (section) {
        section.removeEventListener('mousemove', handleMouseMove);
        section.removeEventListener('mouseenter', handleMouseEnter);
        section.removeEventListener('mouseleave', handleMouseLeave);
      }
      if (mouseMoveTimeoutRef.current) {
        clearTimeout(mouseMoveTimeoutRef.current);
      }
    };
  }, [isHovering]);

  // Memoize button content to prevent unnecessary re-renders
  const buttonContent = useMemo(() => {
    if (!session) {
      return (
        <>
          <Link href="/login" className="cursor-pointer">
            <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 border-0 dark:from-amber-600 dark:via-orange-600 dark:to-red-600 dark:hover:from-amber-700 dark:hover:via-orange-700 dark:hover:to-red-700 shadow-lg transition-all duration-300 transform hover:scale-105 cursor-pointer">
              Enter the Vibe
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/signup" className="cursor-pointer">
            <Button size="lg" variant="outline" className="w-full sm:w-auto border-pink-300/70 text-pink-200 hover:bg-pink-900/50 backdrop-blur-sm dark:border-amber-600 dark:text-amber-800 dark:hover:bg-amber-100/50 transition-all duration-300 cursor-pointer">
              Join the Flow
            </Button>
          </Link>
        </>
      );
    }
    
    return (
      <Link href="/dashboard" className="cursor-pointer">
        <Button size="lg" className="bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500 hover:from-pink-600 hover:via-purple-600 hover:to-cyan-600 border-0 dark:from-amber-600 dark:via-orange-600 dark:to-red-600 shadow-lg transform hover:scale-105 transition-all duration-300 cursor-pointer">
          Continue Vibing
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    );
  }, [session]);

  const mvpButtonContent = useMemo(() => {
    if (!session) {
      return (
        <>
          <Link href="/login" className="cursor-pointer">
            <Button size="lg" className="w-full sm:w-auto cursor-pointer">
              Start Building
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <Link href="/signup" className="cursor-pointer">
            <Button size="lg" variant="outline" className="w-full sm:w-auto cursor-pointer">
              Create Account
            </Button>
          </Link>
        </>
      );
    }
    
    return (
      <Link href="/dashboard" className="cursor-pointer">
        <Button size="lg" className="cursor-pointer">
          Go to Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    );
  }, [session]);

  // Memoize visible circles to avoid recalculation
  const visibleCircles = useMemo(() => {
    const now = Date.now();
    return activeAreas.map(area => {
      const age = now - area.timestamp;
      const ageRatio = Math.min(age / AREA_LIFETIME, 1);
      const currentRadius = REVEAL_RADIUS * (1 - ageRatio * 0.85);
      const opacity = 1 - ageRatio * 0.9;
      
      return {
        ...area,
        currentRadius,
        opacity,
        visible: opacity > 0.05 && currentRadius > 8
      };
    }).filter(circle => circle.visible);
  }, [activeAreas]);

  return (
    <section 
      ref={sectionRef}
      className="relative py-48 md:py-64 lg:py-72 overflow-hidden"
    >
      {/* Background layer - Vibe Coding Theme (revealed when MVP fog clears) */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950 via-purple-900 to-fuchsia-900 dark:from-amber-50 dark:via-yellow-50 dark:to-orange-50">
        <div className="container mx-auto px-4 text-center h-full flex items-center justify-center relative">
          <div className="mx-auto max-w-4xl">
            <Badge variant="outline" className="mb-4 border-pink-300/70 text-pink-200 dark:border-amber-600 dark:text-amber-800 backdrop-blur-sm bg-pink-500/10 dark:bg-amber-200/30">
              ✨ Vibe-Driven Development ✨
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white dark:text-gray-900 drop-shadow-lg">
              Code with <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-purple-300 to-cyan-300 dark:from-amber-600 dark:via-orange-600 dark:to-red-600 animate-pulse">Pure Vibes</span>
            </h1>
            <p className="text-xl text-pink-100/90 dark:text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed drop-shadow-sm">
              Forget deadlines, embrace the flow. Build beautiful things when inspiration strikes. 
              This isn't just a starter—it's your creative playground for digital art and experimental code.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {buttonContent}
            </div>

            {/* Vibe Tech Stack */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-pink-200/80 dark:text-gray-600">
              <span className="font-medium">Powered by vibes:</span>
              <Badge variant="secondary" className="bg-pink-800/40 text-pink-200 border-pink-600/30 dark:bg-amber-200/70 dark:text-amber-800 dark:border-amber-400/50 backdrop-blur-sm">Flow State</Badge>
              <Badge variant="secondary" className="bg-purple-800/40 text-purple-200 border-purple-600/30 dark:bg-orange-200/70 dark:text-orange-800 dark:border-orange-400/50 backdrop-blur-sm">Creative Energy</Badge>
              <Badge variant="secondary" className="bg-cyan-800/40 text-cyan-200 border-cyan-600/30 dark:bg-yellow-200/70 dark:text-yellow-800 dark:border-yellow-400/50 backdrop-blur-sm">Pure Magic</Badge>
              <Badge variant="secondary" className="bg-fuchsia-800/40 text-fuchsia-200 border-fuchsia-600/30 dark:bg-red-200/70 dark:text-red-800 dark:border-red-400/50 backdrop-blur-sm">Digital Art</Badge>
              <Badge variant="secondary" className="bg-violet-800/40 text-violet-200 border-violet-600/30 dark:bg-pink-200/70 dark:text-pink-800 dark:border-pink-400/50 backdrop-blur-sm">Inspiration</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* MVP Fog Layer - This acts as the fog that covers the vibe theme */}
      <div 
        className="absolute inset-0 z-10 bg-background" 
        style={{ 
          maskImage: 'url(#fog-mask)', 
          WebkitMaskImage: 'url(#fog-mask)',
          willChange: isMouseMoving ? 'mask-image' : 'auto'
        }}
      >
        <div className="container mx-auto px-4 text-center h-full flex items-center justify-center">
          <div className="mx-auto max-w-4xl">
            <Badge variant="outline" className="mb-4">
              <Link href="http://99nextjs-starter.cloud" target="_blank" rel="noopener noreferrer" className="hover:underline cursor-pointer">
                Open Source 99NextJS-Starter
              </Link>
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Build MVPs <span className="text-primary">Lightning Fast</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Skip the boilerplate and start building. A modern <Link href="http://99nextjs-starter.cloud" target="_blank" rel="noopener noreferrer" className="hover:underline cursor-pointer">Next.js starter</Link> optimized for rapid prototyping 
              and vibe-driven development. Get your MVP to market in days, not weeks.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              {mvpButtonContent}
            </div>

            {/* Tech Stack */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
              <span>Built with:</span>
              <Link href="https://nextjs.org" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">Next.js 15</Badge>
              </Link>
              <Link href="https://react.dev" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">React 19</Badge>
              </Link>
              <Link href="https://www.typescriptlang.org" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">TypeScript</Badge>
              </Link>
              <Link href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">Supabase</Badge>
              </Link>
              <Link href="https://tailwindcss.com" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">Tailwind CSS</Badge>
              </Link>
              <Link href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer" className="cursor-pointer">
                <Badge variant="secondary" className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer">shadcn/ui</Badge>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* SVG mask definition for the fog effect - CRITICAL for fog of war */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{ opacity: 0 }}>
        <defs>
          <mask id="fog-mask">
            <rect width="100%" height="100%" fill="white" />
            {visibleCircles.map(circle => (
              <circle
                key={circle.id}
                cx={circle.x}
                cy={circle.y}
                r={circle.currentRadius}
                fill="black"
                opacity={circle.opacity}
              />
            ))}
          </mask>
        </defs>
      </svg>

      {/* Enhanced custom cursor when hovering and moving */}
      {isHovering && (
        <div
          className={`absolute pointer-events-none z-50 transition-all duration-200 ${
            isMouseMoving 
              ? 'w-4 h-4 opacity-80' 
              : 'w-2 h-2 opacity-40'
          }`}
          style={{
            left: mousePosition.x - (isMouseMoving ? 8 : 4),
            top: mousePosition.y - (isMouseMoving ? 8 : 4),
            transform: `scale(${isMouseMoving ? 1.2 : 0.8})`,
            willChange: 'transform'
          }}
        >
          {/* Outer ring */}
          <div className={`absolute inset-0 rounded-full border-2 transition-all duration-200 ${
            isMouseMoving 
              ? 'border-purple-400/60 bg-purple-300/10' 
              : 'border-gray-400/40 bg-gray-300/10'
          }`}>
            {/* Inner dot */}
            <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 rounded-full transition-all duration-200 ${
              isMouseMoving 
                ? 'bg-purple-400 shadow-lg shadow-purple-400/50' 
                : 'bg-gray-400'
            }`} />
            
            {/* Animated pulse ring when moving */}
            {isMouseMoving && (
              <div className="absolute inset-0 rounded-full border border-purple-300/30 animate-ping" />
            )}
          </div>
          
          {/* Trailing effect */}
          {isMouseMoving && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-sm animate-pulse" />
          )}
        </div>
      )}
    </section>
  );
}