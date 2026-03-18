import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";

export default function Header() {
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from("categories").select("*");
      setCategories(data || []);
    };

    fetchCategories();
  }, []);

  const parentCategories = categories.filter(c => !c.parent_id);
  const childCategories = categories.filter(c => c.parent_id);

  return (
    <header className="w-full border-b bg-white">
      <div className="container mx-auto flex items-center justify-between p-4">

        {/* LOGO */}
        <Link to="/" className="text-xl font-bold">
          ANNOVA
        </Link>

        {/* MENU */}
        <NavigationMenu>
          <NavigationMenuList>

            {parentCategories.map(parent => (
              <NavigationMenuItem key={parent.id}>

                <NavigationMenuTrigger>
                  {parent.name}
                </NavigationMenuTrigger>

                <NavigationMenuContent>
                  <div className="w-56 p-2">
                    {childCategories
                      .filter(child => child.parent_id === parent.id)
                      .map(child => (
                        <Link
                          key={child.id}
                          to={`/shop?category=${parent.id}`}
                          className="block px-3 py-2 rounded hover:bg-gray-100"
                        >
                          {child.name}
                        </Link>
                      ))}
                  </div>
                </NavigationMenuContent>

              </NavigationMenuItem>
            ))}

          </NavigationMenuList>
        </NavigationMenu>

      </div>
    </header>
  );
}
