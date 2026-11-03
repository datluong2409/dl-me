import type { HTMLAttributes } from 'react'

export function Container({ className = '', children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`mx-auto w-full max-w-[1120px] px-4 sm:px-6 lg:px-8 ${className}`.trim()} {...rest}>
      {children}
    </div>
  )
}
