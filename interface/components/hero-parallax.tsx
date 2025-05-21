"use client"

import { useRef } from "react"
import Image from "next/image"
import { motion, useScroll, useTransform } from "framer-motion"

export function HeroParallax() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "100%"])
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "200%"])
  const opacityText = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div ref={ref} className="w-full h-[90vh] overflow-hidden relative grid place-items-center">
      <motion.div style={{ y: backgroundY }} className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background z-10" />
        <Image
          src="/resturant.jpeg?height=1080&width=1920"
          alt="Restaurant background"
          fill
          className="object-cover"
          priority
        />
      </motion.div>

      <motion.div style={{ y: textY, opacity: opacityText }} className="relative z-10 text-center max-w-4xl px-4">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl md:text-6xl lg:text-7xl font-heading text-white mb-6"
        >
          Restaurant Order System
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-lg font-extrabold md:text-xl text-white/90 mb-8 max-w-2xl mx-auto"
        >
          A beautiful, award-winning interface for managing restaurant orders with real-time status updates
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <a href="/menu">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-md font-medium"
            >
              Order Now
            </motion.button>
          </a>
          <a href="/chef">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-background/10 backdrop-blur-sm hover:bg-background/20 text-white border border-white/20 px-6 py-3 rounded-md font-medium"
            >
              Chef Dashboard
            </motion.button>
          </a>
        </motion.div>
      </motion.div>
    </div>
  )
}
