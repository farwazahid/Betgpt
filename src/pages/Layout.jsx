
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  LayoutDashboard, 
  TrendingUp, 
  Target, 
  Wallet,
  TestTube2,
  Settings,
  Activity,
  Crosshair,
  Newspaper,
  PlayCircle,
  CreditCard
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import NotificationCenter from "./components/notifications/NotificationCenter";
import UserProfileDropdown from "./components/user/UserProfileDropdown";
import OnboardingModal from "./components/user/OnboardingModal";
import GlobalSearch from "./components/navigation/GlobalSearch";

const navigationItems = [
  {
    title: "Dashboard",
    url: createPageUrl("Dashboard"),
    icon: LayoutDashboard,
  },
  {
    title: "Testing Guide",
    url: createPageUrl("TestingGuide"),
    icon: PlayCircle,
    highlight: true,
  },
  {
    title: "Alpha Hunter",
    url: createPageUrl("AlphaHunter"),
    icon: Crosshair,
  },
  {
    title: "Markets",
    url: createPageUrl("Markets"),
    icon: TrendingUp,
  },
  {
    title: "Opportunities",
    url: createPageUrl("Opportunities"),
    icon: Target,
  },
  {
    title: "News",
    url: createPageUrl("News"),
    icon: Newspaper,
  },
  {
    title: "Portfolio",
    url: createPageUrl("Portfolio"),
    icon: Wallet,
  },
  {
    title: "Analytics",
    url: createPageUrl("Analytics"),
    icon: Activity,
  },
  {
    title: "Backtest",
    url: createPageUrl("Backtest"),
    icon: TestTube2,
  },
  {
    title: "Subscription",
    url: createPageUrl("Subscription"),
    icon: CreditCard,
  },
  {
    title: "Settings",
    url: createPageUrl("Settings"),
    icon: Settings,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
    <>
      <OnboardingModal />
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-white">
          <Sidebar className="border-r border-slate-200 bg-white">
            <SidebarHeader className="border-b border-slate-200 p-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">BG</span>
                </div>
                <div>
                  <h2 className="font-semibold text-base text-slate-900">BetGPT</h2>
                  <p className="text-xs text-slate-500">Prediction Markets</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-2">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => {
                      const isActive = location.pathname === item.url;
                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton 
                            asChild 
                            className={`
                              transition-all duration-150 rounded-md mb-0.5
                              ${isActive 
                                ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                                : item.highlight
                                  ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-300'
                                  : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                              }
                            `}
                          >
                            <Link to={item.url} className="flex items-center gap-3 px-3 py-2">
                              <item.icon className="w-4 h-4" />
                              <span className="font-medium text-sm">{item.title}</span>
                              {item.highlight && (
                                <span className="ml-auto text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded font-bold">
                                  NEW
                                </span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <main className="flex-1 flex flex-col bg-slate-50">
            <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="md:hidden">
                  <SidebarTrigger className="hover:bg-slate-100 p-2 rounded-md transition-colors duration-150" />
                </div>
                <div className="hidden md:block">
                  <GlobalSearch />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <NotificationCenter />
                <UserProfileDropdown />
              </div>
            </header>

            <div className="flex-1 overflow-auto">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </>
  );
}
