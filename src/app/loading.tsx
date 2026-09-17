import { SplashVisual } from "@/components/SplashVisual"

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] hidden md:block">
      <SplashVisual />
    </div>
  )
}
