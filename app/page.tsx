'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import SiteHeader from '@/components/SiteHeader';

export default function HomePage() {
  const { data: session } = useSession();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
        delayChildren: 0.1,
      },
    },
  };

  const letterVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        damping: 12,
        stiffness: 200,
      },
    },
  };

  const headline = "Grade at the speed of thought";
  const characters = headline.split("");

  return (
    <div className="bg-white bg-grainy text-neutral-900 selection:bg-blue-100 selection:text-blue-900 overflow-x-hidden relative">
      {/* Background Flares - Moved to parent for global blending */}
      <div className="blue-glow" />
      <div className="blue-flare" />
      <div className="blue-flare" style={{ top: '10%', left: '70%', width: '50%', height: '50%', opacity: 0.8 }} />
      <div className="blue-flare" style={{ top: '40%', left: '80%', width: '40%', height: '40%', opacity: 0.6 }} />

      <div className="min-h-screen flex flex-col relative">
        <SiteHeader />

        <main className="relative flex-1 flex flex-col items-center justify-center px-4">
          <div className="relative z-10 w-full text-center px-4 max-w-5xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="antigravity-text text-[clamp(2.5rem,6vw,5.5rem)] font-medium mb-8 text-black leading-[1.05] tracking-tight"
            >
              Grade at the <span className="italic">speed</span> of thought
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto mb-10 font-medium leading-relaxed"
            >
              The definitive platform for AI-powered testing and forms. <br className="hidden md:block" />
              Secure, scalable, and startlingly precise.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
            >
              {session ? (
                <Link
                  href="/dashboard"
                  className="btn-pill bg-black text-white hover:bg-neutral-800 flex items-center group transition-all"
                >
                  Go to Dashboard
                  <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              ) : (
                <Link
                  href="/auth"
                  className="btn-pill bg-black text-white hover:bg-neutral-800 flex items-center group transition-all"
                >
                  Initialize Now
                  <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
              <Link
                href="https://github.com/Amber-bisht/askSync"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-pill bg-transparent text-neutral-900 border border-neutral-200 hover:bg-neutral-50 transition-all font-medium"
              >
                View GitHub
              </Link>
            </motion.div>

            {/* Trust Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="flex -space-x-3 items-center">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-9 h-9 rounded-full border-2 border-white bg-neutral-100 overflow-hidden relative shadow-sm">
                    <img src={`/avatars/avatar${i}.webp`} alt="user" className="w-full h-full object-cover" />
                  </div>
                ))}
                <div className="pl-4 text-sm text-neutral-600 font-medium flex items-center gap-1.5">
                  <span className="text-black font-bold">4.9 /5</span>
                  <span>from 10+ customers</span>
                  <span className="text-blue-500 text-lg">★</span>
                </div>
              </div>
            </motion.div>

          </div>
        </main>
      </div>

      {/* Subtle Bottom Section */}
      <footer className="py-24 bg-transparent relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center w-full relative z-20">
          <div className="text-neutral-500 text-sm tracking-[0.2em] uppercase font-medium mb-16">
            © {new Date().getFullYear()} AskSync by amber bisht. Built for the future of learning.
          </div>

          <div className="flex justify-center items-center gap-10">
            {[
              { name: 'GitHub', href: 'https://github.com/Amber-bisht/askSync' },
              { name: 'X (Twitter)', href: 'https://x.com/amber_bisht' },
              { name: 'Instagram', href: 'https://www.instagram.com/amber_bisht/' },
              { name: 'LinkedIn', href: 'https://www.linkedin.com/in/amber-bisht-05a096294/' }
            ].map((social) => (
              <Link
                key={social.name}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-600 hover:text-black transition-all text-sm font-medium uppercase tracking-[0.1em]"
              >
                {social.name}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
