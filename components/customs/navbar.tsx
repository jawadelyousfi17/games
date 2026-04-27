"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ChevronDown,
  Home,
  Tent,
  User,
  LogOut,
  Settings,
  LayoutDashboard,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signOut } from "next-auth/react";
import { ModeToggle } from "@/components/theme-toggle";

// const navLinks = [];

type NavbarProps = {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  intraUser?: {
    avatar?: string;
    name?: string;
    login?: string;
  } | null;
};

const Navbar = ({ user, intraUser }: NavbarProps) => {
  const pathname = usePathname();

  const displayName = intraUser?.name || user?.name || "User";
  const displayEmail = user?.email || intraUser?.login || "";
  const displayImage =
    intraUser?.avatar || user?.image || "https://github.com/shadcn.png";

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b px-6 bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
            {/* <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground"></div> */}
            <span>Wedesign Polls</span>
          </div>

          <div>
            <ul className="flex gap-8">
              <li>
                <Link className="flex gap-1" href={"/create-poll"}>
                  <Plus />
                  Create
                </Link>
              </li>
              <li>
                <Link href={"/all-polls"}>My polls</Link>
              </li>
            </ul>
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-auto p-1 pr-3 rounded-full hover:bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage
                        src={displayImage}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {displayName.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden md:flex flex-col items-start text-xs">
                      <span className="font-medium">{displayName}</span>
                      <span className="text-muted-foreground">
                        {displayEmail}
                      </span>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <div className="flex flex-col space-y-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => signOut()}
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </nav>
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/60 backdrop-blur-md supports-[backdrop-filter]:bg-background/60 md:hidden">
        <div className="flex items-center justify-around h-16 px-2"></div>
      </div>
    </>
  );
};

export default Navbar;
