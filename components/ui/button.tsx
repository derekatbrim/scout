import * as React from "react"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline'
  size?: 'default' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', ...props }, ref) => {
const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"


    
    const variants = {
      default: "bg-[#fd8ae6] text-white hover:bg-[#fc6fdf]",
      outline: "border-2 border-slate-400 bg-white text-slate-900 hover:bg-slate-100 hover:border-slate-500" // DARKER BORDER
    }
    
    const sizes = {
      default: "h-10 px-4 py-2 text-sm font-semibold", // Added font-semibold
      lg: "h-12 px-8 py-3 text-base font-semibold"
    }
    
    return (
      <button
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }