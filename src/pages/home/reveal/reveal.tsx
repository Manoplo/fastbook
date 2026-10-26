import classNames from 'classnames'
import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import './reveal.css'

type RevealProps = {
  as?: ElementType
  className?: string
  /** Retraso en ms para escalonar elementos hermanos */
  delay?: number
  children: ReactNode
}

export function Reveal({ as: Tag = 'div', className, delay = 0, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element) return
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag
      ref={ref}
      className={classNames('reveal', { 'reveal--visible': visible }, className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  )
}
