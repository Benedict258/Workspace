import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import MainLayout from '@/components/MainLayout'
import { Calendar, Clock, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { useTasks } from '@/hooks/useTasks'
import { useThreads } from '@/hooks/useThreads'
import { useCalendarEvents } from '@/hooks/useCalendar'

export default function TodayView() {
  const today = new Date()
  const todayString = today.toISOString().split('T')[0] // YYYY-MM-DD format
  
  // Fetch tasks for today
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useTasks({ 
    date: todayString 
  })
  
  // Fetch all threads to get thread names
  const { data: threads = [], isLoading: threadsLoading, error: threadsError } = useThreads()
  
  // Fetch calendar events for today
  const { data: calendarEvents = [], isLoading: calendarLoading, error: calendarError } = useCalendarEvents(today)
  
  // Create a map of threadId -> thread name for easy lookup
  const threadMap = new Map(
    threads.map(thread => [thread._id, thread.name])
  )
  
  // Group tasks by time block
  const timeBlocks = [
    { id: 'morning', label: 'Morning', time: '9:00 AM - 12:00 PM', icon: Calendar },
    { id: 'afternoon', label: 'Afternoon', time: '1:00 PM - 5:00 PM', icon: Clock },
    { id: 'evening', label: 'Evening', time: '6:00 PM - 9:00 PM', icon: Clock }
  ].map(block => ({ 
    ...block, 
    tasks: tasks
      .filter(task => task.timeBlock === block.id)
      .map(task => ({
        id: task._id,
        title: task.title,
        threadId: task.threadId,
        threadName: task.threadId ? threadMap.get(task.threadId) || 'Unknown Thread' : null,
        status: task.status
      })) 
  }))
  
  // Handle loading and error states
  const isLoading = tasksLoading || threadsLoading || calendarLoading
  const hasError = tasksError || threadsError || calendarError
  
  if (isLoading) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Today</h1>
            <p className="text-lg text-muted-foreground">{format(today, 'EEEE, MMMM d, yyyy')}</p>
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
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Today</h1>
            <p className="text-lg text-muted-foreground">{format(today, 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <div className="text-center py-12">
            <p className="text-destructive">Error loading data</p>
          </div>
        </div>
      </MainLayout>
    )
  }
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold mb-2">Today</h1>
          <p className="text-lg text-muted-foreground">{format(today, 'EEEE, MMMM d, yyyy')}</p>
        </div>

        {/* Time Blocks */}  
        {timeBlocks.map((block) => {
          const Icon = block.icon
          return (
            <Card key={block.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Icon className="text-primary" size={24} />
                  <div>
                    <CardTitle>{block.label}</CardTitle>
                    <CardDescription>{block.time}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {block.tasks.length > 0 ? (  
                  block.tasks.map((task) => ( 
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={task.status === 'done'}
                        onChange={() => {}} 
                        className="w-5 h-5 rounded cursor-pointer accent-primary"
                      />
                      <span className={task.status === 'done' ? 'line-through text-muted-foreground' : ''}>
                        {task.title}
                      </span>
                      {task.threadId && (
                        <span className="text-xs text-muted-foreground ml-2">
                          [{task.threadName}]
                        </span>
                      )}  
                      {task.status === 'done' && <CheckCircle2 size={18} className="text-primary ml-auto" />}
                    </div>
                  )) 
                ) : (
                  <p className="text-sm text-muted-foreground py-2">No tasks scheduled for this time block</p>
                )} 
              </CardContent>
            </Card>
          )
        })}

        {/* Calendar Events Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar size={20} />
              Today's Events
            </CardTitle>
            <CardDescription>Events from your Google Calendar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {calendarEvents.length > 0 ? (
              <>
                {calendarEvents.map((event: any, index: number) => (
                  <div
                    key={`event-${index}`}
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
              <p className="text-center py-4 text-muted-foreground">
                No events today...
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quick Add Button */}
        <Button className="w-full" size="lg">
          Add Task
        </Button>
      </div>
    </MainLayout>
  )
}