
import { memo } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";
import { CATEGORY_THEMES, BookCategory } from "@/lib/book-themes";

interface CategoryGridItemProps {
  category: BookCategory;
  count: number;
  onClick: () => void;
}

export const CategoryGridItem = memo(({
  category,
  count,
  onClick
}: CategoryGridItemProps) => {
  const theme = CATEGORY_THEMES[category];
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <Card className="p-4 cursor-pointer overflow-hidden relative group">
        {/* Background */}
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
        
        <div className="relative flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center text-xl shadow-md`}>
            {theme.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{category}</h4>
            <p className="text-xs text-muted-foreground">{count} books</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      </Card>
    </motion.div>
  );
});

CategoryGridItem.displayName = 'CategoryGridItem';
