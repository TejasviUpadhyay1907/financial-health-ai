import { Check } from 'lucide-react'
import { cn } from '../lib/utils'

const steps = [
  { id: 1, name: 'Business Info', description: 'Enter your business details' },
  { id: 2, name: 'Upload File', description: 'Upload financial data (CSV/Excel)' },
  { id: 3, name: 'Results', description: 'View your financial health analysis' }
]

export default function Stepper({ currentStep }) {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = currentStep > step.id
          const isCurrent = currentStep === step.id
          
          return (
            <div key={step.id} className="flex items-center">
              <div className="flex items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isCurrent
                      ? "border-primary text-primary"
                      : "border-muted-foreground text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                <div className="ml-4 hidden sm:block">
                  <div className={cn("text-sm font-medium", isCurrent ? "text-primary" : "text-muted-foreground")}>
                    {step.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {step.description}
                  </div>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "ml-4 h-0.5 w-8 sm:w-16",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
