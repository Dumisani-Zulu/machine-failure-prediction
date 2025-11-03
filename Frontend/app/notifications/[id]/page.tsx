"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useNotifications, type Notification } from "@/contexts/NotificationsContext"
import {
  ArrowLeft,
  Check,
  Trash2,
  EyeOff,
  AlertCircle,
  CheckCircle,
  UserPlus,
  MessageSquare,
  Calendar,
  CreditCard,
  Settings,
  TrendingUp,
  Clock,
  Eye,
  Bell,
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

const getPriorityColor = (priority: string) => {
  const colors = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-green-100 text-green-800",
  }
  return colors[priority as keyof typeof colors] || "bg-gray-100 text-gray-800"
}

export default function NotificationDetails() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const { 
    getNotificationById, 
    markAsRead: contextMarkAsRead, 
    markAsUnread: contextMarkAsUnread, 
    deleteNotification: contextDeleteNotification 
  } = useNotifications()
  
  const [notification, setNotification] = useState<Notification | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (params.id) {
      const notificationData = getNotificationById(parseInt(params.id as string))
      setNotification(notificationData || null)
      setIsLoading(false)
    }
  }, [params.id, getNotificationById])

  const markAsRead = () => {
    if (notification) {
      contextMarkAsRead(notification.id)
      setNotification({ ...notification, read: true })
      toast({
        title: "Notification marked as read",
        description: "The notification has been marked as read.",
      })
    }
  }

  const markAsUnread = () => {
    if (notification) {
      contextMarkAsUnread(notification.id)
      setNotification({ ...notification, read: false })
      toast({
        title: "Notification marked as unread",
        description: "The notification has been marked as unread.",
      })
    }
  }

  const deleteNotification = () => {
    if (notification) {
      contextDeleteNotification(notification.id)
      toast({
        title: "Notification deleted",
        description: `"${notification?.title}" has been deleted.`,
        variant: "destructive",
      })
      router.push('/notifications')
    }
  }

  const handleAction = (action: any) => {
    toast({
      title: "Action triggered",
      description: `"${action.label}" action has been triggered.`,
    })
  }

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!notification) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <Header 
          title="Notification Not Found" 
          breadcrumbs={[
            { label: "Notifications", href: "/notifications" },
            { label: "Not Found" }
          ]} 
        />
        <Card>
          <CardContent className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">Notification not found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              The notification you're looking for doesn't exist or has been deleted.
            </p>
            <Button onClick={() => router.push('/notifications')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Notifications
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const IconComponent = iconMap[notification.icon as keyof typeof iconMap] || Bell

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
      <Header 
        title="Notification Details" 
        breadcrumbs={[
          { label: "Notifications", href: "/notifications" },
          { label: notification.title }
        ]} 
      />

      <div className="grid gap-4 md:grid-cols-4">
        {/* Main Content */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {/* Icon or Avatar */}
                  <div className="flex-shrink-0">
                    {notification.avatar ? (
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={notification.avatar || "/placeholder.svg"} alt={notification.user} />
                        <AvatarFallback>
                          {notification.user
                            ?.split(" ")
                            .map((n: string) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className={`p-3 rounded-full ${getIconColor(notification.color)}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-lg md:text-2xl font-bold">{notification.title}</h1>
                      {!notification.read && <div className="w-3 h-3 bg-blue-600 rounded-full" />}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {notification.timestamp}
                      </div>
                      {notification.user && (
                        <div className="flex items-center gap-1">
                          <span>from {notification.user}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mb-4">
                      <Badge variant="outline" className="text-xs">
                        {notification.type}
                      </Badge>
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(notification.priority || "low")}`}>
                        {notification.priority} priority
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {notification.category}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/notifications')}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                {/* Summary */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Summary</h3>
                  <p className="text-muted-foreground">{notification.message}</p>
                </div>

                <Separator />

                {/* Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-2">Details</h3>
                  <p className="text-sm leading-relaxed">{notification.details}</p>
                </div>

                {/* Actions */}
                {notification.actions && notification.actions.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Available Actions</h3>
                      <div className="flex flex-wrap gap-2">
                        {notification.actions.map((action: any, index: number) => (
                          <Button
                            key={index}
                            variant={action.variant}
                            onClick={() => handleAction(action)}
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {!notification.read ? (
                <Button variant="outline" className="w-full justify-start" onClick={markAsRead}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark as Read
                </Button>
              ) : (
                <Button variant="outline" className="w-full justify-start" onClick={markAsUnread}>
                  <EyeOff className="mr-2 h-4 w-4" />
                  Mark as Unread
                </Button>
              )}
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700" onClick={deleteNotification}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </CardContent>
          </Card>

          {/* Notification Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm font-medium">Type</div>
                <div className="text-sm text-muted-foreground capitalize">{notification.type}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Priority</div>
                <div className="text-sm text-muted-foreground capitalize">{notification.priority}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Category</div>
                <div className="text-sm text-muted-foreground">{notification.category}</div>
              </div>
              <div>
                <div className="text-sm font-medium">Status</div>
                <div className="text-sm text-muted-foreground">
                  {notification.read ? 'Read' : 'Unread'}
                </div>
              </div>
              {notification.user && (
                <div>
                  <div className="text-sm font-medium">From</div>
                  <div className="text-sm text-muted-foreground">{notification.user}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
