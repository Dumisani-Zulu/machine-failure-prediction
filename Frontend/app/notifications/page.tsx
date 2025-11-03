"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useNotifications } from "@/contexts/NotificationsContext"
import {
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  Check,
  Trash2,
  AlertCircle,
  CheckCircle,
  UserPlus,
  MessageSquare,
  Calendar,
  CreditCard,
  Settings,
  TrendingUp,
  Eye,
  EyeOff,
} from "lucide-react"
// Icon mapping
const iconMap = {
  Settings,
  UserPlus,
  AlertCircle,
  MessageSquare,
  Calendar,
  CreditCard,
  TrendingUp,
  CheckCircle,
}

const getIconColor = (color: string) => {
  const colors = {
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    red: "text-red-600 bg-red-100",
    purple: "text-purple-600 bg-purple-100",
    orange: "text-orange-600 bg-orange-100",
  }
  return colors[color as keyof typeof colors] || "text-gray-600 bg-gray-100"
}

export default function Notifications() {
  const router = useRouter()
  const { toast } = useToast()
  const { 
    notifications, 
    markAsRead: contextMarkAsRead, 
    markAsUnread: contextMarkAsUnread, 
    markAllAsRead: contextMarkAllAsRead, 
    deleteNotification: contextDeleteNotification 
  } = useNotifications()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState("all")

  const unreadCount = notifications.filter((n) => !n.read).length
  const todayCount = notifications.filter(
    (n) => n.timestamp.includes("minutes ago") || n.timestamp.includes("hour") || n.timestamp.includes("hours ago"),
  ).length

  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase())

    if (selectedTab === "all") return matchesSearch
    if (selectedTab === "unread") return matchesSearch && !notification.read
    if (selectedTab === "today")
      return (
        matchesSearch &&
        (notification.timestamp.includes("minutes ago") ||
          notification.timestamp.includes("hour") ||
          notification.timestamp.includes("hours ago"))
      )
    return matchesSearch && notification.type === selectedTab
  })

  const markAsRead = (id: number) => {
    contextMarkAsRead(id)
    toast({
      title: "Notification marked as read",
      description: "The notification has been marked as read.",
    })
  }

  const markAsUnread = (id: number) => {
    contextMarkAsUnread(id)
    toast({
      title: "Notification marked as unread",
      description: "The notification has been marked as unread.",
    })
  }

  const markAllAsRead = () => {
    contextMarkAllAsRead()
    toast({
      title: "All notifications marked as read",
      description: `${unreadCount} notifications have been marked as read.`,
    })
  }

  const deleteNotification = (id: number) => {
    const notification = notifications.find(n => n.id === id)
    contextDeleteNotification(id)
    toast({
      title: "Notification deleted",
      description: `"${notification?.title}" has been deleted.`,
      variant: "destructive",
    })
  }

  const viewNotification = (id: number) => {
    // Mark as read when viewing
    contextMarkAsRead(id)
    // Navigate to details page
    router.push(`/notifications/${id}`)
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Header title="Notifications" breadcrumbs={[{ label: "Notifications" }]} />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-xs text-muted-foreground">All notifications</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayCount}</div>
            <p className="text-xs text-muted-foreground">Recent activity</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actions</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="w-full bg-transparent"
            >
              Mark All Read
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Stay updated with your latest activities and alerts</CardDescription>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notifications..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="user">Team</TabsTrigger>
              <TabsTrigger value="alert">Alerts</TabsTrigger>
              <TabsTrigger value="message">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value={selectedTab} className="mt-4">
              <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8">
                    <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">No notifications found</h3>
                    <p className="text-sm text-muted-foreground">
                      {searchQuery ? "Try adjusting your search terms" : "You're all caught up!"}
                    </p>
                  </div>
                ) : (
                  filteredNotifications.map((notification) => {
                    const IconComponent = iconMap[notification.icon as keyof typeof iconMap] || Bell
                    return (
                      <div
                        key={notification.id}
                        className={`flex items-start space-x-4 p-4 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                          !notification.read ? "bg-blue-50 border-blue-200" : "bg-white hover:bg-gray-50"
                        }`}
                        onClick={() => viewNotification(notification.id)}
                      >
                        {/* Icon or Avatar */}
                        <div className="flex-shrink-0">
                          {notification.avatar ? (
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={notification.avatar || "/placeholder.svg"} alt={notification.user} />
                              <AvatarFallback>
                                {notification.user
                                  ?.split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className={`p-2 rounded-full ${getIconColor(notification.color)}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                            <div className="flex items-center space-x-2">
                              {!notification.read && <div className="w-2 h-2 bg-blue-600 rounded-full" />}
                              <span className="text-xs text-muted-foreground">{notification.timestamp}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation()
                                  viewNotification(notification.id)
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View details
                                </DropdownMenuItem>
                                {!notification.read ? (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    markAsRead(notification.id)
                                  }}>
                                    <Check className="mr-2 h-4 w-4" />
                                    Mark as read
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={(e) => {
                                    e.stopPropagation()
                                    markAsUnread(notification.id)
                                  }}>
                                    <EyeOff className="mr-2 h-4 w-4" />
                                    Mark as unread
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteNotification(notification.id)
                                  }}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
