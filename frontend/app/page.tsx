import { TopNav } from '@/components/street-guard/top-nav'
import { HeroSection } from '@/components/street-guard/home/hero-section'
import { HowItWorks } from '@/components/street-guard/home/how-it-works'
import { WhyItMatters } from '@/components/street-guard/home/why-it-matters'
import { RecentRescues } from '@/components/street-guard/home/recent-rescues'
import { Footer } from '@/components/street-guard/home/footer'

export default function HomePage() {
  return (
    <>
      <TopNav />
      <main className="pt-20 pb-10">
        <HeroSection />
        <HowItWorks />
        <WhyItMatters />
        <RecentRescues />
      </main>
      <Footer />
    </>
  )
}
