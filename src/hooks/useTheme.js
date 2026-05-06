import { useEffect, useState } from 'react'

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem('ksm-theme') || 'dark')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'light') {
      root.classList.add('light')
    } else {
      root.classList.remove('light')
    }
    localStorage.setItem('ksm-theme', theme)
  }, [theme])

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark')

  return { theme, toggle }
}
