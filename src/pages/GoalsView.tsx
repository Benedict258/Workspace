import MainLayout from '@/components/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Flame, TrendingUp } from 'lucide-react'
import { useGoals } from '@/hooks/useGoals'
import { useCreateGoal, useUpdateGoal, useDeleteGoal } from '@/hooks/useGoals'
import { useState } from 'react'

export default function GoalsView() {
  const { data: goals = [], isLoading: goalsLoading, error: goalsError } = useGoals()
  const { 
    mutate: createGoal, 
    isLoading: isCreating,
    isError: isCreateError,
    error: createError
  } = useCreateGoal()
  const { 
    mutate: updateGoal, 
    isLoading: isUpdating,
    isError: isUpdateError,
    error: updateError
  } = useUpdateGoal()
  const { 
    mutate: deleteGoal, 
    isLoading: isDeleting,
    isError: isDeleteError,
    error: deleteError
  } = useDeleteGoal()
  
  const [editGoalId, setEditGoalId] = useState<string | null>(null)
  const [editGoalPeriod, setEditGoalPeriod] = useState('')
  const [editGoalText, setEditGoalText] = useState('')
  
  const handleSaveEdit = () => {
    if (!editGoalId) return
    
    const updates: Partial<any> = {
      period: editGoalPeriod,
      text: editGoalText
    }
    
    updateGoal({ id: editGoalId, updates })
    setEditGoalId(null)
  }
  
  const handleCancelEdit = () => {
    setEditGoalId(null)
    // Reset form values
    setEditGoalPeriod('')
    setEditGoalText('')
  }
  
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">Goals & Analytics</h1>
            <p className="text-lg text-muted-foreground">Track your progress and streaks</p>
          </div>
          <Button onClick={() => setEditGoalId('new')}>
            Add Goal
          </Button>
        </div>
        
        {/* Edit/Create Goal Modal */}
        {editGoalId !== null && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {editGoalId === 'new' ? 'Create New Goal' : 'Edit Goal'}
              </h2>
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault()
                if (editGoalId === 'new') {
                  createGoal({
                    period: editGoalPeriod,
                    text: editGoalText
                  })
                } else {
                  handleSaveEdit()
                }
              }}>
                <div>
                  <label className="block text-sm font-medium mb-1">Period</label>
                  <input
                    type="text"
                    value={editGoalPeriod}
                    onChange={(e) => setEditGoalPeriod(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded"
                    placeholder="e.g., Q4-2026"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Goal Text</label>
                  <textarea
                    value={editGoalText}
                    onChange={(e) => setEditGoalText(e.target.value)}
                    required
                    className="w-full px-3 py-2 border rounded"
                    rows="3"
                  />
                </div>
                
                <div className="flex justify-end gap-3">
                  <Button 
                    type="button"
                    onClick={handleCancelEdit}
                    variant="outline"
                    disabled={isCreating || isUpdating}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit"
                    disabled={isCreating || isUpdating || !(editGoalPeriod && editGoalText)}
                  >
                    {editGoalId === 'new' ? 'Create' : 'Save'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
        
        {/* Loading state */}
        {goalsLoading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading goals...</p>
          </div>
        )}
        
        {/* Error state */}
        {goalsError && (
          <div className="text-center py-8">
            <p className="text-destructive">Error loading goals: {goalsError.message}</p>
          </div>
        )}
        
        {/* Stats */}
        {!goalsLoading && !goalsError && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Daily Streak', value: '12', icon: Flame, color: 'text-orange-500' },
              { label: 'Monthly Completion', value: '76%', icon: TrendingUp, color: 'text-green-500' },
              { label: 'Active Threads', value: '15', icon: BarChart3, color: 'text-blue-500' },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label}>
                  <CardContent className="p-6 flex items-center gap-4">
                    <Icon className={`${stat.color} flex-shrink-0`} size={32} />
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
        
        {/* Quarterly Goals */}
        {!goalsLoading && !goalsError && (
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Goals</CardTitle>
              <CardDescription>Set your quarterly objectives</CardDescription>
            </CardHeader>
            <CardContent>
              {goals.length > 0 ? (
                <div className="space-y-3">
                  {goals.map((goal) => (
                    <div key={goal._id} className="border-b pb-3">
                      <div className="flex justify-between text-sm">
                        <p className="font-medium">{goal.period}</p>
                        {editGoalId === goal._id ? (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handleCancelEdit}
                          >
                            Edit
                          </Button>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => {
                              setEditGoalId(goal._id)
                              setEditGoalPeriod(goal.period)
                              setEditGoalText(goal.text)
                            }}
                          >
                            Edit
                          </Button>
                        )}
                      </div>
                      <p className="text-sm">{goal.text}</p>
                      {editGoalId === goal._id && (
                        <form className="mt-2 space-y-2" onSubmit={(e) => {
                          e.preventDefault()
                          if (editGoalId === 'new') {
                            createGoal({
                              period: editGoalPeriod,
                              text: editGoalText
                            })
                          } else {
                            handleSaveEdit()
                          }
                        }}>
                          <div>
                            <label className="block text-sm font-medium mb-1">Period</label>
                            <input
                              type="text"
                              value={editGoalPeriod}
                              onChange={(e) => setEditGoalPeriod(e.target.value)}
                              required
                              className="w-full px-3 py-2 border rounded"
                              placeholder="e.g., Q4-2026"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium mb-1">Goal Text</label>
                            <textarea
                              value={editGoalText}
                              onChange={(e) => setEditGoalText(e.target.value)}
                              required
                              className="w-full px-3 py-2 border rounded"
                              rows="3"
                            />
                          </div>
                          
                          <div className="flex justify-end gap-3">
                            <Button 
                              type="button"
                              onClick={handleCancelEdit}
                              variant="outline"
                              disabled={isCreating || isUpdating}
                            >
                              Cancel
                            </Button>
                            <Button 
                              type="submit"
                              disabled={isCreating || isUpdating || !(editGoalPeriod && editGoalText)}
                            >
                              {editGoalId === 'new' ? 'Create' : 'Save'}
                            </Button>
                          </div>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-muted-foreground">
                  No goals yet. Add your first goal above!
                </p>
              )}
            </CardContent>
          </Card>
        )}
        
        {/* Per-Thread Stats (placeholder - would use analytics hook in full implementation) */}
        <Card>
          <CardHeader>
            <CardTitle>Thread Performance</CardTitle>
            <CardDescription>Completion rates by thread</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { name: 'ECAPs R&D', completed: 8, total: 10 },
              { name: 'AWS Architect', completed: 5, total: 5 },
              { name: 'Python Learning', completed: 12, total: 14 },
            ].map((thread) => (
              <div key={thread.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <p className="font-medium">{thread.name}</p>
                  <p className="text-muted-foreground">
                    {thread.completed}/{thread.total}
                  </p>
                </div>
                <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(thread.completed / thread.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        
        {/* Loading states for mutations */}
        {isCreating && (
          <div className="fixed bottom-4 right-4">
            <p className="bg-blue-500 text-white px-3 py-1 rounded">Creating goal...</p>
          </div>
        )}
        {isUpdating && (
          <div className="fixed bottom-4 right-4">
            <p className="bg-blue-500 text-white px-3 py-1 rounded">Updating goal...</p>
          </div>
        )}
        {isDeleting && (
          <div className="fixed bottom-4 right-4">
            <p className="bg-blue-500 text-white px-3 py-1 rounded">Deleting goal...</p>
          </div>
        )}
        
        {/* Error states for mutations */}
        {isCreateError && (
          <div className="fixed bottom-4 right-4">
            <p className="bg-destructive text-white px-3 py-1 rounded">
              Error creating goal: {createError?.message || 'Unknown error'}
            </p>
          </div>
        )}
        {isUpdateError && (
          <div className="fixed bottom-4 right-4">
            <p className="bg-destructive text-white px-3 py-1 rounded">
              Error updating goal: {updateError?.message || 'Unknown error'}
            </p>
          </div>
        )}
        {isDeleteError && (
          <div className="fixed bottom-4 right-4">
            <p className="bg-destructive text-white px-3 py-1 rounded">
              Error deleting goal: {deleteError?.message || 'Unknown error'}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
