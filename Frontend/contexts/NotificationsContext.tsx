"use client"

import React, { createContext, useContext, useState } from 'react'

export interface Notification {
  id: number
  type: string
  title: string
  message: string
  timestamp: string
  read: boolean
  icon: any
  color: string
  avatar?: string
  user?: string
  details?: string
  priority?: string
  category?: string
  actions?: Array<{ label: string; variant: 'default' | 'outline' }>
}

interface NotificationsContextType {
  notifications: Notification[]
  updateNotification: (id: number, updates: Partial<Notification>) => void
  deleteNotification: (id: number) => void
  markAsRead: (id: number) => void
  markAsUnread: (id: number) => void
  markAllAsRead: () => void
  getNotificationById: (id: number) => Notification | undefined
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}

interface NotificationsProviderProps {
  children: React.ReactNode
}

// Initial notifications data
const initialNotifications: Notification[] = [
  {
    id: 1,
    type: "system",
    title: "System Update Available",
    message: "A new system update is available. Please update to version 2.1.0 for the latest features and security improvements.",
    timestamp: "2 minutes ago",
    read: false,
    icon: "Settings",
    color: "blue",
    details: "This system update includes important security patches, performance improvements, and new features. The update process will take approximately 10-15 minutes and requires a system restart. Please save all your work before proceeding with the update.",
    priority: "high",
    category: "System Maintenance",
    actions: [
      { label: "Update Now", variant: "default" },
      { label: "Schedule Later", variant: "outline" }
    ]
  },
  {
    id: 2,
    type: "user",
    title: "New Team Member",
    message: "Sarah Wilson has joined your team and has been assigned to the Analytics Dashboard project.",
    timestamp: "15 minutes ago",
    read: false,
    icon: "UserPlus",
    color: "green",
    avatar: "/placeholder.svg?height=32&width=32",
    user: "Sarah Wilson",
    details: "Sarah Wilson has been added to your team with the role of Frontend Developer. She has been assigned to the Analytics Dashboard project and will be working on improving the user interface and user experience. Please welcome her to the team and provide any necessary onboarding materials.",
    priority: "medium",
    category: "Team Management",
    actions: [
      { label: "View Profile", variant: "default" },
      { label: "Send Welcome Message", variant: "outline" }
    ]
  },
  {
    id: 3,
    type: "alert",
    title: "High CPU Usage Detected",
    message: "Server CPU usage has exceeded 85% for the past 10 minutes. Consider scaling your infrastructure.",
    timestamp: "1 hour ago",
    read: true,
    icon: "AlertCircle",
    color: "red",
    details: "Your server's CPU usage has been consistently high at 87% for the past 10 minutes. This may impact application performance and user experience. Consider scaling your infrastructure or optimizing your application to handle the increased load. Current affected services: API Gateway, Database Connections, Background Jobs.",
    priority: "high",
    category: "Infrastructure Alert",
    actions: [
      { label: "Scale Infrastructure", variant: "default" },
      { label: "View Metrics", variant: "outline" },
      { label: "Optimize Resources", variant: "outline" }
    ]
  },
  {
    id: 4,
    type: "message",
    title: "New Comment on Project",
    message: "Mike Johnson commented on the E-commerce Platform project: 'Great progress on the checkout flow!'",
    timestamp: "2 hours ago",
    read: true,
    icon: "MessageSquare",
    color: "purple",
    avatar: "/placeholder.svg?height=32&width=32",
    user: "Mike Johnson",
    details: "Mike Johnson left a comment on the E-commerce Platform project regarding the checkout flow improvements. The comment includes feedback on the new streamlined checkout process and suggestions for further enhancements. This is part of the ongoing project review process.",
    priority: "low",
    category: "Project Collaboration",
    actions: [
      { label: "Reply to Comment", variant: "default" },
      { label: "View Project", variant: "outline" }
    ]
  },
  {
    id: 5,
    type: "calendar",
    title: "Meeting Reminder",
    message: "Team standup meeting starts in 30 minutes. Join the call in the main conference room.",
    timestamp: "3 hours ago",
    read: false,
    icon: "Calendar",
    color: "orange",
    details: "Your team standup meeting is scheduled to start in 30 minutes at 2:00 PM in the main conference room. The agenda includes project updates, blocker discussions, and sprint planning. Please prepare your status update and any blockers you're facing.",
    priority: "medium",
    category: "Meetings",
    actions: [
      { label: "Join Meeting", variant: "default" },
      { label: "View Agenda", variant: "outline" },
      { label: "Reschedule", variant: "outline" }
    ]
  },
  {
    id: 6,
    type: "billing",
    title: "Payment Successful",
    message: "Your monthly subscription payment of $99.00 has been processed successfully.",
    timestamp: "1 day ago",
    read: true,
    icon: "CreditCard",
    color: "green",
    details: "Your monthly subscription payment of $99.00 for the Pro Plan has been successfully processed. Payment method: Credit Card ending in 4242. Next billing date: February 15, 2024. You can view your invoice and payment history in the billing section.",
    priority: "low",
    category: "Billing",
    actions: [
      { label: "View Invoice", variant: "default" },
      { label: "Download Receipt", variant: "outline" },
      { label: "Manage Billing", variant: "outline" }
    ]
  },
  {
    id: 7,
    type: "analytics",
    title: "Traffic Spike Detected",
    message: "Your website traffic has increased by 150% in the last 24 hours. Check your analytics dashboard for details.",
    timestamp: "1 day ago",
    read: false,
    icon: "TrendingUp",
    color: "blue",
    details: "Your website has experienced a significant traffic spike with a 150% increase in the last 24 hours. Peak traffic occurred between 2-4 PM with 15,000 concurrent users. This appears to be organic traffic from social media mentions and search engine improvements. Monitor your server performance to ensure optimal user experience.",
    priority: "medium",
    category: "Analytics",
    actions: [
      { label: "View Analytics", variant: "default" },
      { label: "Check Performance", variant: "outline" },
      { label: "Scale Resources", variant: "outline" }
    ]
  },
  {
    id: 8,
    type: "system",
    title: "Backup Completed",
    message: "Daily backup has been completed successfully. All your data is safely backed up.",
    timestamp: "2 days ago",
    read: true,
    icon: "CheckCircle",
    color: "green",
    details: "Your scheduled daily backup has been completed successfully at 3:00 AM. All databases, user files, and system configurations have been securely backed up to the cloud storage. Backup size: 2.3GB. Retention period: 30 days. You can restore from this backup if needed.",
    priority: "low",
    category: "System Operations",
    actions: [
      { label: "View Backup Details", variant: "default" },
      { label: "Download Backup", variant: "outline" },
      { label: "Test Restore", variant: "outline" }
    ]
  },
]

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

  const updateNotification = (id: number, updates: Partial<Notification>) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, ...updates } : notification
      )
    )
  }

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const markAsRead = (id: number) => {
    updateNotification(id, { read: true })
  }

  const markAsUnread = (id: number) => {
    updateNotification(id, { read: false })
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })))
  }

  const getNotificationById = (id: number) => {
    return notifications.find(notification => notification.id === id)
  }

  const value: NotificationsContextType = {
    notifications,
    updateNotification,
    deleteNotification,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    getNotificationById
  }

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  )
}
