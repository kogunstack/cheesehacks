import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

export default function LandingPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        // If user is already authenticated, maybe they shouldn't see the landing page, 
        // but a landing page can just change the CTA instead of forcing a redirect.
        // Or we redirect to /app if they try to access the landing page?
        // Let's just alter CTAs to say 'Go to App' instead of 'Log in'.

        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries, _observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

        const navbar = document.getElementById('navbar');
        const handleScroll = () => {
            if (!navbar) return;
            if (window.scrollY > 20) {
                navbar.classList.add('bg-[#0F0F1A]/80', 'backdrop-blur-xl', 'shadow-lg');
                navbar.classList.remove('bg-[#0F0F1A]/50');
            } else {
                navbar.classList.remove('bg-[#0F0F1A]/80', 'backdrop-blur-xl', 'shadow-lg');
                navbar.classList.add('bg-[#0F0F1A]/50');
            }
        };
        window.addEventListener('scroll', handleScroll);

        // Canvas Particles
        const canvas = document.getElementById('hero-particles') as HTMLCanvasElement;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width: number, height: number;
        let particles: Particle[] = [];
        let animationId: number;

        function resize() {
            if (!canvas) return;
            width = canvas.width = canvas.offsetWidth;
            height = canvas.height = canvas.offsetHeight;
        }

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            x: number; y: number; vx: number; vy: number; size: number; alpha: number;
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                this.size = Math.random() * 2;
                this.alpha = Math.random() * 0.5 + 0.1;
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;
            }
            draw() {
                if (!ctx) return;
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = '#7C3AED';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            const particleCount = Math.floor((width * height) / 10000);
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        }

        function animate() {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });

            ctx.lineWidth = 0.5;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(124, 58, 237, ${0.15 - dist / 1000})`;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            animationId = requestAnimationFrame(animate);
        }

        initParticles();
        animate();

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
            observer.disconnect();
        };
    }, []);

    const handleCTA = () => {
        if (isAuthenticated) {
            navigate('/app');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="bg-[#0F0F1A] text-gray-300 font-sans antialiased overflow-x-hidden selection:bg-[#7C3AED]/30 selection:text-white pb-0">
            <div
                className="absolute w-[80vw] h-[80vw] max-w-[800px] max-h-[800px] rounded-full pointer-events-none -z-10"
                style={{
                    background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, rgba(15, 15, 26, 0) 60%)',
                    top: '-20%', left: '50%', transform: 'translateX(-50%)'
                }}>
            </div>

            <nav id="navbar" className="fixed w-full z-50 transition-all duration-300 bg-[#0F0F1A]/50 backdrop-blur-md border-b border-white/5 py-4">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <a href="#" className="flex items-center gap-2 group">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#06B6D4] flex items-center justify-center shadow-lg shadow-[#7C3AED]/20 group-hover:shadow-[#7C3AED]/40 transition-all">
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
                            </svg>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white">Nexus</span>
                    </a>
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">How it Works</a>
                        <a href="#pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Pricing</a>
                    </div>
                    <div className="hidden md:flex items-center gap-4">
                        {isAuthenticated ? (
                            <button onClick={() => navigate('/app')} className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg hover:-translate-y-0.5">
                                Go to Dashboard
                            </button>
                        ) : (
                            <>
                                <button onClick={() => navigate('/login')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Log in</button>
                                <button onClick={() => navigate('/login')} className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-lg hover:-translate-y-0.5">
                                    Get Started Free
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <main>
                {/* HERO */}
                <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 overflow-hidden">
                    <canvas id="hero-particles" className="absolute inset-0 w-full h-full pointer-events-none opacity-40"></canvas>
                    <div className="max-w-7xl mx-auto text-center relative z-10">
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight text-white">
                            Your project workflow, <br className="hidden md:block" />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#8B5CF6] to-[#06B6D4]">visualized.</span>
                        </h1>
                        <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-gray-400 mb-10">
                            The ultimate developer/designer tool that unites Docs, Node Graphs, and Tasks.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button onClick={handleCTA} className="w-full sm:w-auto bg-[#7C3AED] hover:bg-[#8B5CF6] text-white px-8 py-4 rounded-xl font-medium transition-all shadow-[0_0_40px_-10px_rgba(124,58,237,0.5)] hover:shadow-[0_0_60px_-10px_rgba(124,58,237,0.7)] hover:-translate-y-1">
                                {isAuthenticated ? 'Go to App' : 'Start for free'}
                            </button>
                        </div>

                        <div className="mt-20 relative max-w-5xl mx-auto">
                            <div className="absolute inset-0 bg-gradient-to-b from-[#7C3AED]/20 to-transparent blur-3xl -z-10 rounded-full w-3/4 mx-auto opacity-50"></div>
                            <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-white/10 p-1 rounded-2xl overflow-hidden shadow-2xl relative">
                                <div className="bg-[#0F0F1A]/80 border-b border-white/5 px-4 py-3 flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                        <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                    </div>
                                </div>
                                <div className="bg-[#0A0A12] h-[400px] w-full relative overflow-hidden flex items-center justify-center text-gray-500">
                                    Node Canvas Mockup View
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SOCIAL PROOF */}
                <section className="py-10 border-y border-white/5 bg-[rgba(255,255,255,0.03)] backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-6 text-center">
                        <p className="text-sm text-gray-500 font-medium mb-6 uppercase tracking-widest">Trusted by visionary teams</p>
                        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
                            <span className="text-xl md:text-2xl font-bold font-sans tracking-tight hover:text-white transition-colors">ACME Corp</span>
                            <span className="text-xl md:text-2xl font-black italic hover:text-white transition-colors">Globex</span>
                            <span className="text-xl md:text-2xl font-bold tracking-widest hover:text-white transition-colors">SOYLENT</span>
                            <span className="text-xl md:text-2xl font-semibold hover:text-white transition-colors">Initech</span>
                        </div>
                    </div>
                </section>

                {/* FEATURES SECTION (Simplified for translation speed) */}
                <section id="features" className="py-24 px-6 relative">
                    <div className="max-w-7xl mx-auto z-10 relative">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">Everything connects.</h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Reusable glass cards */}
                            <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-white/10 p-8 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,255,255,0.08)] hover:-translate-y-1">
                                <h3 className="text-xl font-semibold text-white mb-3">Visual Node Mapping</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">Map your entire project architecture like an infinite whiteboard.</p>
                            </div>
                            <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-white/10 p-8 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,255,255,0.08)] hover:-translate-y-1">
                                <h3 className="text-xl font-semibold text-white mb-3">Real-time Collaboration</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">Multiplayer by default. See cursors, live edits, and status changes instantly.</p>
                            </div>
                            <div className="bg-[rgba(255,255,255,0.03)] backdrop-blur-xl border border-white/10 p-8 rounded-2xl transition-all duration-300 hover:bg-[rgba(255,255,255,0.08)] hover:-translate-y-1">
                                <h3 className="text-xl font-semibold text-white mb-3">Docs + Tasks, Unified</h3>
                                <p className="text-gray-400 text-sm leading-relaxed">Write your spec precisely where your subtasks are tracked.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA BANNER */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/40 via-[#0F0F1A] to-[#0F0F1A] pointer-events-none"></div>
                    <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
                        <h2 className="text-4xl md:text-6xl font-bold mb-6 text-white tracking-tight">Start mapping your workflow today.</h2>
                        <div className="flex justify-center mt-10">
                            <button onClick={handleCTA} className="bg-[#7C3AED] hover:bg-[#8B5CF6] text-white px-10 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:-translate-y-1">
                                Get Started Free
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-[#0A0A12] py-16 border-t border-white/5">
                <div className="max-w-7xl mx-auto px-6 text-center text-gray-500">
                    <p>© 2026 Nexus. Built with React and Tailwind.</p>
                </div>
            </footer>
        </div>
    );
}
