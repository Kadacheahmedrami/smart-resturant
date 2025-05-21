import { CheckCircle, Clock, XCircle } from "lucide-react"

import { cn } from "@/lib/utils"

interface StatusDisplayProps {
  status: string
  className?: string
}

export function StatusDisplay({ status, className }: StatusDisplayProps) {
  const steps = [
    { id: "PENDING", name: "Pending", description: "Your order is waiting to be accepted" },
    { id: "ACCEPTED", name: "Accepted", description: "Your order has been accepted and is being prepared" },
    { id: "READY", name: "Ready", description: "Your order is ready for pickup" },
  ]

  // Handle rejected status separately
  if (status === "REJECTED") {
    return (
      <div
        className={cn(
          "rounded-lg border border-red-200 bg-red-50 p-6 dark:bg-red-900/20 dark:border-red-900/30",
          className,
        )}
      >
        <div className="flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-4 dark:bg-red-900/40">
            <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-red-800 dark:text-red-400 mb-2">Order Rejected</h3>
          <p className="text-red-700 dark:text-red-300">
            We're sorry, but your order cannot be fulfilled at this time. Please contact the restaurant for more
            information.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("rounded-lg border p-6", className)}>
      <nav aria-label="Progress">
        <ol role="list" className="overflow-hidden">
          {steps.map((step, stepIdx) => {
            const isActive = step.id === status
            const isCompleted =
              (status === "ACCEPTED" && step.id === "PENDING") ||
              (status === "READY" && (step.id === "PENDING" || step.id === "ACCEPTED"))

            return (
              <li key={step.id} className={cn(stepIdx !== steps.length - 1 ? "pb-10" : "", "relative")}>
                {stepIdx !== steps.length - 1 ? (
                  <div
                    className={cn(
                      "absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5",
                      isCompleted ? "bg-primary" : "bg-muted",
                    )}
                    aria-hidden="true"
                  />
                ) : null}
                <div className="group relative flex items-start">
                  <span className="flex h-9 items-center">
                    <span
                      className={cn(
                        "relative z-10 flex h-8 w-8 items-center justify-center rounded-full",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" aria-hidden="true" />
                      ) : isActive ? (
                        <Clock className="h-5 w-5 animate-pulse" aria-hidden="true" />
                      ) : (
                        <span className="h-2.5 w-2.5 rounded-full bg-current" aria-hidden="true" />
                      )}
                    </span>
                  </span>
                  <div className="ml-4 min-w-0 flex-1">
                    <div className="flex items-center">
                      <h3
                        className={cn(
                          "text-base font-semibold tracking-tight",
                          isActive || isCompleted ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {step.name}
                      </h3>
                      {isActive && (
                        <div className="ml-2 px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full">Current</div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
