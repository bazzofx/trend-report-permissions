import { FileUpload } from "@/components/file-upload"
import { ThemeToggle } from "@/components/theme-toggle"
import { LockKeyParticles } from "@/components/lock-key-particles"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24 relative overflow-hidden">
      <LockKeyParticles />
      <div className="z-10 max-w-5xl w-full flex flex-col items-center justify-between font-mono text-sm">
        <div className="flex w-full justify-between items-center mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-red-500">Trend Permissions Visualizer</h1>
          <ThemeToggle />
        </div>

        <div className="w-full bg-card rounded-lg shadow-lg p-6 border border-red-500/20">
          <h2 className="text-xl font-semibold mb-4 text-red-400">Upload the Permissions CSV Extracted from Trend</h2>
          <FileUpload />
        </div>
      </div>
    </main>
  )
}
