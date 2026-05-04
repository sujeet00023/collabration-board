export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white font-sans">
      <div className="text-center px-6">
        <h1 className="text-4xl sm:text-6xl font-bold mb-4 tracking-tight">
          🚀 Collaboration Board
        </h1>

        <p className="text-lg sm:text-xl text-zinc-400 mb-6">
          A real-time team collaboration platform is currently under development.
        </p>

        <p className="text-sm text-zinc-500 mb-10">
          Built with Next.js, TypeScript, and modern full-stack technologies.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://github.com/YOUR_USERNAME"
            target="_blank"
            className="px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-zinc-200 transition"
          >
            View GitHub
          </a>

          <a
            href="https://linkedin.com/in/YOUR_PROFILE"
            target="_blank"
            className="px-6 py-3 rounded-full border border-white/20 hover:bg-white/10 transition"
          >
            Connect on LinkedIn
          </a>
        </div>
      </div>
    </div>
  );
}