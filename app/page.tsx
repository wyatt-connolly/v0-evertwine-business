import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Logo } from "@/components/logo"
import { ArrowRight, BarChart3, Users, Zap, Star, CheckCircle, Target, Info } from "lucide-react"
import Image from "next/image"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-evertwine-50 via-white to-evertwine-100">
      {/* Navigation */}
      <nav className="border-b nav-gradient sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Logo size="md" />
            <div className="flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost" className="text-evertwine-700 hover:text-evertwine-800">
                  Sign In
                </Button>
              </Link>
              <Link href="/signup">
                <Button className="btn-gradient text-white">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center animate-slide-up">
            <Badge className="mb-6 bg-evertwine-100 text-evertwine-700 border-evertwine-200">
              ✨ Transform Your Business Promotions
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Grow Your Business with <span className="text-gradient">Smart Promotions</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create, manage, and track powerful promotional campaigns that drive customer engagement and boost your
              revenue.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="btn-gradient text-white hover-lift">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="https://evertwine.social" target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-evertwine-300 text-evertwine-700 hover:bg-evertwine-50 hover-lift"
                >
                  Learn More
                  <Info className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Everything you need to succeed</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful tools designed to help your business create compelling promotions and track their performance.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="glass-card hover-lift animate-scale-in">
              <CardHeader>
                <div className="w-12 h-12 bg-evertwine-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-evertwine-600" />
                </div>
                <CardTitle className="text-evertwine-900">Quick Setup</CardTitle>
                <CardDescription>Create professional promotions in minutes with our intuitive builder.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card hover-lift animate-scale-in" style={{ animationDelay: "0.1s" }}>
              <CardHeader>
                <div className="w-12 h-12 bg-evertwine-100 rounded-lg flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-evertwine-600" />
                </div>
                <CardTitle className="text-evertwine-900">Real-time Analytics</CardTitle>
                <CardDescription>Track performance and optimize your campaigns with detailed insights.</CardDescription>
              </CardHeader>
            </Card>

            <Card className="glass-card hover-lift animate-scale-in" style={{ animationDelay: "0.2s" }}>
              <CardHeader>
                <div className="w-12 h-12 bg-evertwine-100 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-evertwine-600" />
                </div>
                <CardTitle className="text-evertwine-900">Customer Engagement</CardTitle>
                <CardDescription>Build lasting relationships with targeted promotional campaigns.</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Choose Evertwine Section */}
      <section className="py-20 bg-evertwine-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Why choose Evertwine?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-12">
              We're building the future of business promotions with innovative features and user-focused design.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center animate-fade-in">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-evertwine-200">
                <Star className="h-8 w-8 text-evertwine-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation First</h3>
              <p className="text-gray-600">Cutting-edge features designed for modern businesses</p>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: "0.1s" }}>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-evertwine-200">
                <CheckCircle className="h-8 w-8 text-evertwine-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy to Use</h3>
              <p className="text-gray-600">Intuitive interface that anyone can master quickly</p>
            </div>

            <div className="text-center animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-evertwine-200">
                <Target className="h-8 w-8 text-evertwine-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Results Driven</h3>
              <p className="text-gray-600">Built to help you achieve measurable business growth</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-primary">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">Ready to transform your business?</h2>
          <p className="text-xl text-blue-100 mb-8">
            Start creating powerful promotions today and watch your customer base grow.
          </p>
          <Link href="/signup">
            <Button
              size="lg"
              className="bg-white text-evertwine-700 hover:bg-gray-50 hover:text-evertwine-800 hover-lift font-medium px-8 py-6 shadow-lg"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <div className="flex items-center gap-3">
                <div className="rounded-full overflow-hidden w-8 h-8">
                  <Image src="/images/evertwine-logo.png" alt="Evertwine" width={32} height={32} />
                </div>
                <span className="text-xl font-bold text-white">Evertwine</span>
              </div>
            </div>
            <div className="text-gray-400 text-sm">© 2024 Evertwine. All rights reserved.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}
