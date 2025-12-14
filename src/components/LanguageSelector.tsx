import { useState, useEffect } from "react";
import { Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "sw", name: "Kiswahili", flag: "🇰🇪" },
  { code: "ha", name: "Hausa", flag: "🇳🇬" },
  { code: "yo", name: "Yorùbá", flag: "🇳🇬" },
  { code: "ig", name: "Igbo", flag: "🇳🇬" },
  { code: "zu", name: "isiZulu", flag: "🇿🇦" },
  { code: "am", name: "አማርኛ", flag: "🇪🇹" },
  { code: "so", name: "Soomaali", flag: "🇸🇴" },
  { code: "rw", name: "Kinyarwanda", flag: "🇷🇼" },
  { code: "wo", name: "Wolof", flag: "🇸🇳" },
];

export const LanguageSelector = () => {
  const [currentLang, setCurrentLang] = useState("en");

  useEffect(() => {
    // Check for saved language or Google Translate cookie
    const savedLang = localStorage.getItem("farmcare-language");
    if (savedLang) {
      setCurrentLang(savedLang);
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    localStorage.setItem("farmcare-language", langCode);

    // Set Google Translate cookie
    const domain = window.location.hostname;
    
    // Clear existing googtrans cookies
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${domain}`;
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain}`;
    
    if (langCode === "en") {
      // For English, just clear cookies and reload
      window.location.reload();
      return;
    }
    
    // Set new cookies for translation
    document.cookie = `googtrans=/en/${langCode}; path=/`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain}`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${domain}`;
    
    // Reload to apply translation
    window.location.reload();
  };

  const currentLanguage = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <>
      {/* Hidden Google Translate element */}
      <div id="google_translate_element" className="hidden" />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" title={currentLanguage.name}>
            <Globe className="h-5 w-5" />
            <span className="absolute -bottom-1 -right-1 text-xs">{currentLanguage.flag}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-y-auto">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={`flex items-center justify-between ${currentLang === lang.code ? "bg-accent" : ""}`}
            >
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                {lang.name}
              </span>
              {currentLang === lang.code && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
