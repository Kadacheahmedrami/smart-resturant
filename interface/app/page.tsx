import Link from "next/link"
import { ArrowRight, ChefHat, User, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ESP32StatusButton } from "@/components/esp32-status-button"
import { ThemeToggle } from "@/components/theme-toggle"
import { HeroParallax } from "@/components/hero-parallax"
import { MobileNav } from "@/components/mobile-nav"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-heading">Gourmet Status</h1>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
                Home
              </Link>
              <Link href="/menu" className="transition-colors hover:text-foreground/80 text-muted-foreground">
                Menu
              </Link>
              <Link href="/orders" className="transition-colors hover:text-foreground/80 text-muted-foreground">
                My Orders
              </Link>
              <Link href="/ratings" className="transition-colors hover:text-foreground/80 text-muted-foreground">
                Ratings
              </Link>
              <Link href="/chef" className="transition-colors hover:text-foreground/80 text-muted-foreground">
                Chef Dashboard
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <ESP32StatusButton />
            <MobileNav />
          </div>
        </div>
      </header>
      <main className="flex-1">
        <HeroParallax />

        <section className="container px-4 md:px-6 py-12 md:py-24 lg:py-32">
          <div className="mx-auto max-w-[58rem] text-center">
            <h2 className="text-3xl font-heading leading-tight sm:text-4xl md:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70 dark:from-primary dark:to-primary/70">
              Restaurant Order System
            </h2>
            <p className="mt-4 text-muted-foreground">Order food easily and track your order status in real-time.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
            <div className="relative group overflow-hidden rounded-lg border bg-background p-6 shadow-md transition-all hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <User className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-heading mb-2">Order Food</h3>
                <p className="text-muted-foreground mb-4">
                  Browse our menu and place your order with just a few clicks.
                </p>
                <Link href="/menu">
                  <Button className="group">
                    View Menu
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative group overflow-hidden rounded-lg border bg-background p-6 shadow-md transition-all hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <ChefHat className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-heading mb-2">Chef Dashboard</h3>
                <p className="text-muted-foreground mb-4">For restaurant staff to manage incoming orders.</p>
                <Link href="/chef">
                  <Button className="group">
                    Chef Login
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative group overflow-hidden rounded-lg border bg-background p-6 shadow-md transition-all hover:shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-green-600/20 to-emerald-600/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                  <Star className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-heading mb-2">Customer Ratings</h3>
                <p className="text-muted-foreground mb-4">See what our customers are saying about their orders.</p>
                <Link href="/ratings">
                  <Button className="group">
                    View Ratings
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
            © 2024 Gourmet Status. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </footer>
    </div>
  )
}
