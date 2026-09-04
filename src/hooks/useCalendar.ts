import { useQuery, useMutation } from '@tanstack/react-query'
import { useToast } from '@/components/ui/use-toast'

// Types
export type CalendarStatus = 'disconnected' | 'connected' | 'connecting' | 'error'

export type CalendarEvent = {
  id: string
  title: string
  description?: string
  start: string // ISO date string
  end: string   // ISO date string
  // Add more fields as needed
}

// API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export const useCalendar = () => {
  const { toast } = useToast()
  
  // Get calendar connection status
  const { data: status = 'disconnected', isLoading: statusLoading, error: statusError } = useQuery({
    queryKey: ['calendar-status'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/calendar/status`)
      if (!response.ok) {
        throw new Error('Failed to fetch calendar status')
      }
      const data = await response.json()
      return data.connected ? 'connected' : 'disconnected'
    },
  })
  
  // Connect to Google Calendar (initiates OAuth flow)
  const { 
    mutate: connectCalendar, 
    isLoading: isConnecting,
    isError: isConnectError,
    error: connectError
  } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/calendar/auth`)
      if (!response.ok) {
        throw new Error('Failed to get auth URL')
      }
      const data = await response.json()
      if (!data.authUrl) {
        throw new Error('No auth URL received')
      }
      // Redirect to auth URL
      window.location.href = data.authUrl
    },
    onSuccess: () => {
      toast({
        title: 'Connecting to Google Calendar',
        description: 'Please complete the authorization in the new window.',
      })
    },
    onError: () => {
      toast({
        title: 'Connection Failed',
        description: 'Failed to initiate Google Calendar connection.',
        variant: 'destructive'
      })
    }
  })
  
  // Disconnect from Google Calendar
  const { 
    mutate: disconnectCalendar, 
    isLoading: isDisconnecting,
    isError: isDisconnectError,
    error: disconnectError
  } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/calendar/disconnect`, {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }
    },
    onSuccess: () => {
      toast({
        title: 'Disconnected',
        description: 'Google Calendar has been disconnected.',
      })
    },
    onError: () => {
      toast({
        title: 'Disconnect Failed',
        description: 'Failed to disconnect from Google Calendar.',
        variant: 'destructive'
      })
    }
  })
  
  // Pull calendar events for a given date
  const useCalendarEvents = (date: Date) => {
    return useQuery({
      queryKey: ['calendar-events', date.toISOString()],
      queryFn: async () => {
        const response = await fetch(`${API_URL}/api/calendar/events?date=${date.toISOString()}`)
        if (!response.ok) {
          throw new Error('Failed to fetch calendar events')
        }
        const data = await response.json()
        return data.events || []
      },
    })
  }
  
  // Sync calendar (placeholder)
  const { 
    mutate: syncCalendar, 
    isLoading: isSyncing,
    isError: isSyncError,
    error: syncError
  } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/api/calendar/sync`, {
        method: 'POST'
      })
      if (!response.ok) {
        throw new Error('Sync failed')
      }
    },
    onSuccess: () => {
      toast({
        title: 'Sync Completed',
        description: 'Calendar sync completed.',
      })
    },
    onError: () => {
      toast({
        title: 'Sync Failed',
        description: 'Calendar sync failed.',
        variant: 'destructive'
      })
    }
  })
  
  return {
    // Status
    calendarStatus: status,
    isLoadingStatus: statusLoading,
    errorStatus: statusError,
    
    // Actions
    connectCalendar,
    isConnecting,
    isConnectError,
    connectError,
    
    disconnectCalendar,
    isDisconnecting,
    isDisconnectError,
    disconnectError,
    
    // Events
    useCalendarEvents,
    
    // Sync
    syncCalendar,
    isSyncing,
    isSyncError,
    syncError
  }
}