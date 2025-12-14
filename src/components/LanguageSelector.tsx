import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
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

declare global {
  interface Window {
    google: {
      translate: {
        TranslateElement: {
          InlineLayout: {
            SIMPLE: number;
          };
        };
      };
    };
  }
}

export const LanguageSelector = () => {
  const [currentLang, setCurrentLang] = useState("en");

  useEffect(() => {
    // Check if there's a saved language preference
    const savedLang = localStorage.getItem("farmcare-language");
    if (savedLang) {
      setCurrentLang(savedLang);
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    setCurrentLang(langCode);
    localStorage.setItem("farmcare-language", langCode);

    // Trigger Google Translate
    const selectElement = document.querySelector(
      ".goog-te-combo"
    ) as HTMLSelectElement;
    
    if (selectElement) {
      selectElement.value = langCode;
      selectElement.dispatchEvent(new Event("change"));
    } else {
      // Fallback: Use cookie method
      const domain = window.location.hostname;
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${domain}`;
      document.cookie = `googtrans=/en/${langCode}; path=/`;
      window.location.reload();
    }
  };

  const currentLanguage = languages.find((l) => l.code === currentLang) || languages[0];

  return (
    <>
      {/* Hidden Google Translate element */}
      <div id="google_translate_element" className="hidden" />
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative">
            <Globe className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48 max-h-80 overflow-y-auto">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => changeLanguage(lang.code)}
              className={currentLang === lang.code ? "bg-accent" : ""}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
