import { useState, useCallback, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { Home, BookOpen, MessageSquare, Compass, Clock, Heart, Lightbulb, Info, Mail, User } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import kaabaImage from "@/assets/kaaba.png";

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Quran", url: "/quran", icon: BookOpen },
  { title: "Daily Hadith", url: "/hadith", icon: MessageSquare },
  { title: "Qibla Finder", url: "/qibla", icon: Compass },
  { title: "Duas", url: "/duas", icon: Heart },
  { title: "Tasbeeh", url: "/tasbeeh", icon: Lightbulb },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border/40 p-4">
        <div className="flex items-center gap-3">
          <img src={kaabaImage} alt="Kaaba" className="w-8 h-8 object-contain" loading="lazy" />
          {open && (
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Noor Connect
              </h1>
              <p className="text-xs text-muted-foreground">Your Islamic Companion</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-accent/50"
                      }
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}