import MainLayout from '@/components/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Cloud, Download, Upload } from 'lucide-react'
import { useSettings } from '@/hooks/useSettings'
import { useUpdateSettings } from '@/hooks/useSettings'
import { useEffect, useState } from 'react'

export default function SettingsView() {
  const { data: settings, isLoading: settingsLoading, error: settingsError } = useSettings()
  const { 
    mutate: updateSettings, 
    isLoading: isUpdating,
    isError: isUpdateError,
    error: updateError
  } = useUpdateSettings()
  
  const [editSettingsId, setEditSettingsId] = useState<string | null>(null)
  const [editTimezone, setEditTimezone] = useState('')
  const [editMultipleThreadsPerWeekTarget, setEditMultipleThreadsPerWeekTarget] = useState(3)
  
  // Calendar connection state
  const [calendarStatus, setCalendarStatus] = useState<'disconnected' | 'connected' | 'connecting' | 'error'>('disconnected')
  const [calendarError, setCalendarError] = useState<string | null>(null)
  
  // Check query params on mount for OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const calendarParam = urlParams.get('calendar')
    if (calendarParam === 'connected') {
      setCalendarStatus('connected')
      setCalendarError(null)
      // Clear the query param to avoid persistent message
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (calendarParam === 'error') {
      const message = urlParams.get('message') || 'Unknown error'
      setCalendarStatus('error')
      setCalendarError(decodeURIComponent(message))
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])
  
  const handleSaveEdit = () => {
    if (!editSettingsId) return
    
    const updates: Partial<any> = {
      timezone: editTimezone,
      multipleThreadsPerWeekTarget: editMultipleThreadsPerWeekTarget
      // Note: weeklyGenerationRules is omitted for simplicity as it's a complex object
    }
    
    updateSettings(updates)
    setEditSettingsId(null)
  }
  
  const handleCancelEdit = () => {
    setEditSettingsId(null)
    // Reset form values to current settings or defaults
    if (settings) {
      setEditTimezone(settings.timezone)
      setEditMultipleThreadsPerWeekTarget(settings.multipleThreadsPerWeekTarget || 3)
    } else {
      setEditTimezone('Africa/Lagos')
      setEditMultipleThreadsPerWeekTarget(3)
    }
  }
  
  // Initialize edit form with current settings
  useEffect(() => {
    if (settings && !editSettingsId) {
      setEditTimezone(settings.timezone)
      setEditMultipleThreadsPerWeekTarget(settings.multipleThreadsPerWeekTarget || 3)
    }
  }, [settings, editSettingsId])
  
  const handleConnectCalendar = async () => {
    try {
      // Fetch auth URL from backend
      const response = await fetch('/api/calendar/auth')
      if (!response.ok) {
        throw new Error('Failed to get auth URL')
      }
      const data = await response.json()
      if (data.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl
      } else {
        throw new Error('No auth URL received')
      }
    } catch (error) {
      setCalendarStatus('error')
      setCalendarError(error instanceof Error ? error.message : 'Unknown error')
    }
  }
  
  const handleDisconnectCalendar = async () => {
    try {
      const response = await fetch('/api/calendar/disconnect', {
        method: 'DELETE'
      })
      if (!response.ok) {
        throw new Error('Failed to disconnect')
      }
      setCalendarStatus('disconnected')
      setCalendarError(null)
    } catch (error) {
      setCalendarStatus('error')
      setCalendarError(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  // PWA Install handler
  const handleInstall = async () => {
    if (window.deferredPrompt) {
      window.deferredPrompt.prompt()
      const choiceResult = await window.deferredPrompt.userChoice
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
      }
      window.deferredPrompt = null
    }
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-lg text-muted-foreground">Manage your workspace configuration</p>
        </div>

        {/* Loading state */}
        {settingsLoading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading settings...</p>
          </div>
        )}
        
        {/* Error state */}
        {settingsError && (
          <div className="text-center py-8">
            <p className="text-destructive">Error loading settings: {settingsError.message}</p>
          </div>
        )}
        
        {/* Settings Content */}
        {!settingsLoading && !settingsError && (
          <>
            {/* Google Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cloud size={20} />
                  Google Calendar Sync
                </CardTitle>
                <CardDescription>Connect your Google Calendar for two-way sync</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-secondary">
                  <p className="text-sm font-medium mb-2">Connection Status</p>
                  {calendarStatus === 'connected' && (
                    <p className="text-sm text-success">Connected</p>
                  )}
                  {calendarStatus === 'disconnected' && (
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  )}
                  {calendarStatus === 'connecting' && (
                    <p className="text-sm text-info">Connecting...</p>
                  )}
                  {calendarStatus === 'error' && (
                    <>
                      <p className="text-sm text-destructive">Error: {calendarError}</p>
                    </>
                  )}
                  <div className="mt-4">
                    {calendarStatus === 'disconnected' && (
                      <Button onClick={handleConnectCalendar}>
                        Connect Google Calendar
                      </Button>
                    )}
                    {calendarStatus === 'connected' && (
                      <Button onClick={handleDisconnectCalendar} variant="outline">
                        Disconnect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Data Management */}  
            <Card>
              <CardHeader>
                <CardTitle>Data Management</CardTitle>
                <CardDescription>Export or import your workspace data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Download size={18} />
                  Export All Data (JSON)
                </Button>
                <Button className="w-full justify-start gap-2" variant="outline">
                  <Upload size={18} />
                  Import Data
                </Button>
                <Button
                  id="pwa-install-button"
                  onClick={handleInstall}
                  className="w-full justify-start gap-2 mt-2"
                  variant="outline"
                  style={{ display: 'none' }} // Initially hidden, will be shown by the script in index.html
                >
                  Install App
                </Button>
              </CardContent>
            </Card>
            
            {/* Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>Customize your experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Timezone</label>
                  <select
                    value={editTimezone}
                    onChange={(e) => setEditTimezone(e.target.value)}
                    className="mt-2 w-full p-2 rounded-lg border border-border bg-background"
                  >
                    <option value="Africa/Lagos">Africa/Lagos</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                    <option value="Australia/Sydney">Australia/Sydney</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">Weekly Generation</label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Auto-generate weekly schedule starting Monday
                  </p>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium mb-1">Tasks per Week for Multiple Threads</label>
                  <input
                    type="number"
                    value={editMultipleThreadsPerWeekTarget}
                    onChange={(e) => setEditMultipleThreadsPerWeekTarget(parseInt(e.target.value) || 3)}
                    min="1"
                    max="7"
                    className="w-full p-2 rounded-lg border border-border bg-background"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    How many times per week should multiple-frequency threads appear?
                  </p>
                </div>
                {editSettingsId !== null && (
                  <div className="flex justify-end gap-3 mt-4">
                    <Button 
                      type="button"
                      onClick={handleCancelEdit}
                      variant="outline"
                      disabled={isUpdating}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={isUpdating || !editTimezone}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-destructive">Danger Zone</CardTitle>
                <CardDescription>Irreversible actions</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="destructive">Reset All Data</Button>
              </CardContent>
            </Card>
          </>
        )}
        
        {/* Loading states for mutations */}  
        {isUpdating && (
          <div className="fixed bottom-4 right-4">
            <p className="bg-blue-500 text-white px-3 py-1 rounded">Updating settings...</p>
          </div>
        )}
        
        {/* Error states for mutations */}
        {isUpdateError && (
          <div className="fixed bottom-4 right-4">
            <p className="bg-destructive text-white px-3 py-1 rounded">
              Error updating settings: {updateError?.message || 'Unknown error'}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}