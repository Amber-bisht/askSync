'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import SiteHeader from '@/components/SiteHeader';
import ParticleBackground from '@/components/ParticleBackground';

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
    <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black overflow-x-hidden">
      <SiteHeader />

      <main className="relative flex flex-col items-center justify-center min-h-[85vh] px-4 overflow-hidden">
        {/* Particle System */}
        <ParticleBackground />

        <div className="relative z-10 w-full text-center px-4">
          <motion.h1
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="antigravity-text text-[clamp(2.5rem,7vw,9.5rem)] font-medium mb-12"
          >
            {headline.split(" ").map((word, wordIndex) => (
              <span key={wordIndex} className="inline-block whitespace-nowrap pr-[0.2em]">
                {word.split("").map((char, charIndex) => (
                  <motion.span
                    key={charIndex}
                    variants={letterVariants}
                    className="inline-block"
                  >
                    {char}
                  </motion.span>
                ))}
              </span>
            ))}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg md:text-xl text-white max-w-2xl mx-auto mb-12 font-normal leading-relaxed"
          >
            The definitive platform for AI-powered testing and forms. <br className="hidden md:block" />
            Secure, scalable, and startlingly precise.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {session ? (
              <Link
                href="/dashboard"
                className="btn-pill bg-white text-black hover:bg-neutral-200 flex items-center group transition-all"
              >
                Go to Dashboard
                <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link
                href="/auth"
                className="btn-pill bg-white text-black hover:bg-neutral-200 flex items-center group transition-all"
              >
                Initialize Now
                <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            )}
            <Link
              href="https://github.com/Amber-bisht/askSync"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill bg-transparent text-white border border-neutral-700 hover:bg-white/10 transition-all font-medium"
            >
              Learn More
            </Link>
          </motion.div>
        </div>
      </main>

      {/* Subtle Bottom Section */}
      <footer className="py-12 border-t border-neutral-900 bg-black relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-400 text-sm tracking-tight uppercase font-medium">
          © {new Date().getFullYear()} AskSync by amber bisht. Built for the future of learning.
        </div>
      </footer>
    </div>
  );
}
