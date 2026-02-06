import { useState } from 'react'
import { Globe, TrendingUp } from 'lucide-react'
import { Button } from './ui/button'

export default function Navbar({ currentLanguage, onLanguageChange }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' }
  ]

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo and Tagline */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold">Financial Health</span>
          </div>
          <span className="text-sm text-muted-foreground hidden sm:inline">
            SME Assessment Tool
          </span>
        </div>

        {/* Language Toggle */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2"
          >
            <Globe className="h-4 w-4" />
            <span>{languages.find(l => l.code === currentLanguage)?.flag}</span>
            <span className="hidden sm:inline">
              {languages.find(l => l.code === currentLanguage)?.name}
            </span>
          </Button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-40 rounded-md border bg-popover shadow-lg z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code)
                    setIsDropdownOpen(false)
                  }}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left text-sm hover:bg-accent ${
                    currentLanguage === lang.code ? 'bg-accent' : ''
                  }`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
