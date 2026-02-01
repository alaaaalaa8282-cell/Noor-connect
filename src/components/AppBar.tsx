import { ArrowLeft, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface AppBarProps {
  title: string;
  showBack?: boolean;
  actions?: React.ReactNode;
}

export function AppBar({ title, showBack = false, actions }: AppBarProps) {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-[#E5EBE6]/90 backdrop-blur-md shadow-sm border-b border-[#4A5D4F]/10 transition-colors">
      <div className="flex items-center h-14 px-4 max-w-lg mx-auto">
        {showBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="mr-2 -ml-2 text-[#4A5D4F] hover:bg-[#4A5D4F]/10 hover:text-[#4A5D4F]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <h1 className="text-lg font-bold font-serif tracking-wide flex-1 text-[#4A5D4F]">
          {title}
        </h1>
        <div className="flex items-center gap-2">
          {actions}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/profile")}
            className="rounded-full text-[#4A5D4F] hover:bg-[#4A5D4F]/10 hover:text-[#4A5D4F]"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
