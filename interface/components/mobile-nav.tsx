"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Menu, Home, ShoppingCart, Clock, ChefHat, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

export function MobileNav() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="text-left font-heading">Gourmet Status</SheetTitle>
        </SheetHeader>
        <div className="mt-8 space-y-4">
          <NavItem href="/" icon={<Home className="h-5 w-5" />} label="Home" onClick={() => setOpen(false)} />
          <NavItem
            href="/menu"
            icon={<ShoppingCart className="h-5 w-5" />}
            label="Menu"
            onClick={() => setOpen(false)}
          />
          <NavItem
            href="/orders"
            icon={<Clock className="h-5 w-5" />}
            label="My Orders"
            onClick={() => setOpen(false)}
          />
          <NavItem href="/ratings" icon={<Star className="h-5 w-5" />} label="Ratings" onClick={() => setOpen(false)} />
          <NavItem
            href="/chef"
            icon={<ChefHat className="h-5 w-5" />}
            label="Chef Dashboard"
            onClick={() => setOpen(false)}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  onClick?: () => void
}

function NavItem({ href, icon, label, onClick }: NavItemProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-muted transition-colors"
      onClick={onClick}
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  )
}
