import { Calendar, Home, Inbox, Search, Settings, MessageCircle,CircleFadingPlus,X} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { NavUser } from "@/components/nav-user"

// Menu items.
const items = [
    {
        title: "Home",
        url: "#",
        icon: Home,
    },
    {
        title: "Inbox",
        url: "#",
        icon: Inbox,
    },
    {
        title: "Calendar",
        url: "#",
        icon: Calendar,
    },
    {
        title: "Search",
        url: "#",
        icon: Search,
    },
    {
        title: "Settings",
        url: "#",
        icon: Settings,
    },
]

// Add your new chat menu item details here
const newChatItem = {
    title: "New Chat",
    url: "#", // Replace with the actual URL if needed
    icon: MessageCircle,
}

export function AppSidebar() {
    return (
        <Sidebar>
            <SidebarHeader>
                <NavUser user={{ name: "shadcn", email: "m@example.com", avatar: "https://github.com/shadcn.png" }} />
            </SidebarHeader>
            <SidebarContent>
                <SidebarMenuItem className={"flex p-2"}>
                    <SidebarMenuButton className="flex items-center gap-2">
                        <CircleFadingPlus/>
                        <span>Start New Chat</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarGroup>
                    <SidebarGroupLabel>Chat History</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton className="flex justify-between gap-2" asChild>
                                        <a href={item.url}>
                                            <span>{item.title}</span>
                                            <X className="opacity-0 hover:opacity-100 transition-opacity" />
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
