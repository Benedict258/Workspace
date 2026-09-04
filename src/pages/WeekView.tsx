import MainLayout from '@/components/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { format, startOfWeek, addDays } from 'date-fns'
import { useQueries } from '@tanstack/react-query'
import { useWeek } from '@/hooks/useGrid'
import { useThreads } from '@/hooks/useThreads'

export default function WeekView() {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }) // Monday
  
  // Format dates for display
  const weekStartString = weekStart.toISOString().split('T')[0] // YYYY-MM-DD
  
  // Fetch week data
  const { data: weekData = { week: [] }, isLoading: weekLoading, error: weekError } = useWeek(weekStartString)
  const tasks = weekData.week || []
  
  // Fetch all threads to get thread names
  const { data: threads = [], isLoading: threadsLoading, error: threadsError } = useThreads()
  
  // Create a map of threadId -> thread name for easy lookup
  const threadMap = new Map(
    threads.map(thread => [thread._id, thread.name])
  )
  
  // Organize tasks by day and time block
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const timeBlocks = ['Morning', 'Afternoon', 'Evening']
  
  // Create a 2D array: [dayIndex][timeBlockIndex] = tasks
  const tasksByDayAndBlock: any[][][] = Array.from({ length: 7 }, () => 
    Array.from({ length: 3 }, () => [] as any[])
  )
  
  // Populate the tasks array
  tasks.forEach((task: any) => {
    const taskDate = new Date(task.date)
    const dayIndex = taskDate.getDay() === 0 ? 6 : taskDate.getDay() - 1 // Convert to Monday=0, Sunday=6
    const timeBlockIndex = timeBlocks.indexOf(
      task.timeBlock.charAt(0).toUpperCase() + task.timeBlock.slice(1).toLowerCase()
    )  
    
    if (dayIndex >= 0 && dayIndex < 7 && timeBlockIndex >= 0 && timeBlockIndex < 3) {
      tasksByDayAndBlock[dayIndex][timeBlockIndex].push({
        id: task._id,
        title: task.title,
        threadId: task.threadId,
        threadName: task.threadId ? threadMap.get(task.threadId) || 'Unknown Thread' : null,
        status: task.status,
        source: task.source
      })
    }
  })
  
  // Fetch calendar events for each day in the week
  const calendarQueries = useQueries({
    queries: days.map((_, dayIndex) => {
      const dayDate = addDays(weekStart, dayIndex)
      return {
        queryKey: ['calendar-events', dayDate.toISOString().split('T')[0]],
        queryFn: async () => {
          try {
            const response = await fetch(`/api/calendar/events?date=${dayDate.toISOString()}`)
            if (!response.ok) return []
            const data = await response.json()
            return (data.events || []) as any[]
          } catch {
            return []
          }
        },
      }
    }),
  })
  
  // Handle loading and error states
  const isLoading = weekLoading || threadsLoading || calendarQueries.some(q => q.isLoading)
  const hasError = weekError || threadsError
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Week View</h1>
            <p className="text-lg text-muted-foreground">
              {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </MainLayout>
    )
  }
  
  if (hasError) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Week View</h1>
            <p className="text-lg text-muted-foreground">
              {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-destructive">Error loading week data</p>
          </div>
        </div>
      </MainLayout>
    )
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">Week View</h1>
          <p className="text-lg text-muted-foreground">
            {format(weekStart, 'MMM d')} — {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </p>
        </div>

        {/* Weekly Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
          {days.map((day, dayIndex) => {
            const calendarEvents = (calendarQueries[dayIndex]?.data as any[]) || []
            return (
              <Card key={day} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-lg">{day}</CardTitle>
                  <CardDescription>
                    {format(addDays(weekStart, dayIndex), 'MMM d')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  {/* Time Blocks */}
                  <div className="space-y-2">
                    {timeBlocks.map((block, timeBlockIndex) => {
                      const blockTasks = tasksByDayAndBlock[dayIndex][timeBlockIndex];
                      return (
                        <div
                          key={`${day}-${block}`} 
                          className="p-2 rounded bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer"
                        >
                          <p className="font-semibold text-xs text-muted-foreground mb-1">{block}</p>
                          {blockTasks.length > 0 ? (
                            <>
                              {blockTasks.map((task: any, index: number) => (
                                <div
                                  key={`${day}-${block}-${index}`}
                                  className="flex items-center gap-2 p-1 rounded bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer mb-1"
                                >
                                  <input
                                    type="checkbox"
                                    checked={task.status === 'done'}
                                    onChange={() => {}} 
                                    className="w-4 h-4 rounded cursor-pointer accent-primary"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <span className={task.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                                      {task.title}
                                    </span>
                                    {task.threadId && (
                                      <span className="text-xs text-muted-foreground block">
                                        [{task.threadName}]
                                      </span>
                                    )}
                                    {task.source === 'manual' && (
                                      <span className="text-xs text-primary">(manual)</span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              No tasks...
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Calendar Events Section */}
                  <div className="mt-4">
                    <p className="font-semibold text-xs text-muted-foreground mb-1">Events</p>
                    {calendarEvents.length > 0 ? (
                      <>
                        {calendarEvents.map((event, index) => (
                          <div
                            key={`${day}-event-${index}`}
                            className="flex items-center gap-2 p-1 rounded bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer mb-1"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="font-medium">{event.title}</span>
                              {event.description && (
                                <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                {new Date(event.end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No events...
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button>Create New Task</Button>
          <Button variant="outline" onClick={() => {
            // TODO: Implement regeneration confirmation
          }}>
            Regenerate Week
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}