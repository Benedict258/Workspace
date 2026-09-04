import { defineConfig, Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// In-memory data store for the dev API
function createApiPlugin(): Plugin {
  const todayStr = new Date().toISOString().split('T')[0]
  
  let threads = [
    { _id: 't-1', name: 'Workspace Build', category: 'Active Build', frequency: 'daily', status: 'active', notes: 'Core development thread' },
    { _id: 't-2', name: 'TypeScript & React Mastery', category: 'Learning Track', frequency: 'weekly', status: 'active', notes: 'Advanced typing and architecture' },
    { _id: 't-3', name: 'Weekly System Review', category: 'Role/Program', frequency: 'fixed-day', fixedDay: 4, status: 'active', notes: 'Friday retrospective' },
  ]
  
  let tasks = [
    { _id: 'tsk-1', title: 'Review project architecture & roadmap', threadId: 't-1', date: todayStr, timeBlock: 'morning', status: 'done', completedAt: new Date().toISOString(), source: 'manual' },
    { _id: 'tsk-2', title: 'Start dev server & verify PWA configuration', threadId: 't-1', date: todayStr, timeBlock: 'morning', status: 'done', completedAt: new Date().toISOString(), source: 'manual' },
    { _id: 'tsk-3', title: 'Check weekly grid schedule and habits', threadId: 't-2', date: todayStr, timeBlock: 'afternoon', status: 'pending', source: 'auto-generated' },
    { _id: 'tsk-4', title: 'Review backlog and update quarterly goals', threadId: 't-3', date: todayStr, timeBlock: 'evening', status: 'pending', source: 'manual' },
  ]
  
  let goals = [
    { _id: 'g-1', period: 'Q3-2026', text: 'Ship production-ready offline-first PWA Workspace hub' },
    { _id: 'g-2', period: 'Q4-2026', text: 'Maintain 90%+ weekly thread execution consistency' },
  ]
  
  let wishlist = [
    { _id: 'w-1', item: 'Ergonomic mechanical keyboard', note: 'Low-profile wireless', acquired: false },
    { _id: 'w-2', item: 'Focus noise-cancelling headset', note: 'Deep work sessions', acquired: true },
  ]
  
  let settings = {
    timezone: 'Africa/Lagos',
    multipleThreadsPerWeekTarget: 3,
    weeklyGenerationRules: {},
  }

  return {
    name: 'workspace-api-server',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)
        const pathname = url.pathname

        if (!pathname.startsWith('/api')) {
          return next()
        }

        res.setHeader('Content-Type', 'application/json')

        // Helper to parse JSON body
        const parseBody = (): Promise<any> => {
          return new Promise((resolve) => {
            let body = ''
            req.on('data', (chunk) => { body += chunk })
            req.on('end', () => {
              try {
                resolve(body ? JSON.parse(body) : {})
              } catch {
                resolve({})
              }
            })
          })
        }

        // Health
        if (pathname === '/api/health') {
          res.end(JSON.stringify({ status: 'ok', timestamp: new Date() }))
          return
        }

        // Threads
        if (pathname === '/api/threads') {
          if (req.method === 'GET') {
            res.end(JSON.stringify(threads))
            return
          }
          if (req.method === 'POST') {
            parseBody().then((body) => {
              const newThread = { _id: `t-${Date.now()}`, ...body }
              threads.push(newThread)
              res.statusCode = 201
              res.end(JSON.stringify(newThread))
            })
            return
          }
        }
        if (pathname.startsWith('/api/threads/')) {
          const id = pathname.replace('/api/threads/', '')
          if (req.method === 'PUT') {
            parseBody().then((body) => {
              threads = threads.map(t => t._id === id ? { ...t, ...body } : t)
              const updated = threads.find(t => t._id === id)
              res.end(JSON.stringify(updated || body))
            })
            return
          }
          if (req.method === 'DELETE') {
            threads = threads.filter(t => t._id !== id)
            res.end(JSON.stringify({ success: true }))
            return
          }
        }

        // Tasks
        if (pathname === '/api/tasks') {
          if (req.method === 'GET') {
            const dateFilter = url.searchParams.get('date')
            const statusFilter = url.searchParams.get('status')
            const threadIdFilter = url.searchParams.get('threadId')
            let result = [...tasks]
            if (dateFilter) {
              result = result.filter(t => t.date && t.date.startsWith(dateFilter))
            }
            if (statusFilter) {
              result = result.filter(t => t.status === statusFilter)
            }
            if (threadIdFilter) {
              result = result.filter(t => t.threadId === threadIdFilter)
            }
            res.end(JSON.stringify(result))
            return
          }
          if (req.method === 'POST') {
            parseBody().then((body) => {
              const newTask = {
                _id: `tsk-${Date.now()}`,
                status: 'pending',
                timeBlock: 'unscheduled',
                source: 'manual',
                ...body,
                createdAt: new Date().toISOString(),
              }
              tasks.push(newTask)
              res.statusCode = 201
              res.end(JSON.stringify(newTask))
            })
            return
          }
        }
        if (pathname.startsWith('/api/tasks/')) {
          const id = pathname.replace('/api/tasks/', '')
          if (req.method === 'PUT') {
            parseBody().then((body) => {
              tasks = tasks.map(t => t._id === id ? { ...t, ...body } : t)
              const updated = tasks.find(t => t._id === id)
              res.end(JSON.stringify(updated || body))
            })
            return
          }
          if (req.method === 'DELETE') {
            tasks = tasks.filter(t => t._id !== id)
            res.end(JSON.stringify({ success: true }))
            return
          }
        }

        // Goals
        if (pathname === '/api/goals') {
          if (req.method === 'GET') {
            res.end(JSON.stringify(goals))
            return
          }
          if (req.method === 'POST') {
            parseBody().then((body) => {
              const newGoal = { _id: `g-${Date.now()}`, ...body }
              goals.push(newGoal)
              res.statusCode = 201
              res.end(JSON.stringify(newGoal))
            })
            return
          }
        }
        if (pathname.startsWith('/api/goals/')) {
          const id = pathname.replace('/api/goals/', '')
          if (req.method === 'PUT') {
            parseBody().then((body) => {
              goals = goals.map(g => g._id === id ? { ...g, ...body } : g)
              const updated = goals.find(g => g._id === id)
              res.end(JSON.stringify(updated || body))
            })
            return
          }
          if (req.method === 'DELETE') {
            goals = goals.filter(g => g._id !== id)
            res.end(JSON.stringify({ success: true }))
            return
          }
        }

        // Wishlist
        if (pathname === '/api/wishlist') {
          if (req.method === 'GET') {
            res.end(JSON.stringify(wishlist))
            return
          }
          if (req.method === 'POST') {
            parseBody().then((body) => {
              const newItem = { _id: `w-${Date.now()}`, acquired: false, ...body }
              wishlist.push(newItem)
              res.statusCode = 201
              res.end(JSON.stringify(newItem))
            })
            return
          }
        }
        if (pathname.startsWith('/api/wishlist/')) {
          const id = pathname.replace('/api/wishlist/', '')
          if (req.method === 'PUT') {
            parseBody().then((body) => {
              wishlist = wishlist.map(w => w._id === id ? { ...w, ...body } : w)
              const updated = wishlist.find(w => w._id === id)
              res.end(JSON.stringify(updated || body))
            })
            return
          }
          if (req.method === 'DELETE') {
            wishlist = wishlist.filter(w => w._id !== id)
            res.end(JSON.stringify({ success: true }))
            return
          }
        }

        // Grid
        if (pathname === '/api/grid') {
          res.end(JSON.stringify({ week: tasks }))
          return
        }
        if (pathname === '/api/grid/regenerate') {
          res.end(JSON.stringify({ success: true, tasksGenerated: tasks.length }))
          return
        }

        // Settings
        if (pathname === '/api/settings') {
          if (req.method === 'GET') {
            res.end(JSON.stringify(settings))
            return
          }
          if (req.method === 'PUT') {
            parseBody().then((body) => {
              settings = { ...settings, ...body }
              res.end(JSON.stringify(settings))
            })
            return
          }
        }

        // Calendar
        if (pathname === '/api/calendar/status') {
          res.end(JSON.stringify({ connected: false }))
          return
        }
        if (pathname === '/api/calendar/events') {
          res.end(JSON.stringify({ events: [] }))
          return
        }
        if (pathname === '/api/calendar/disconnect') {
          res.end(JSON.stringify({ success: true }))
          return
        }
        if (pathname === '/api/calendar/sync') {
          res.end(JSON.stringify({ success: true, eventCount: 0 }))
          return
        }

        // Default API fallback
        res.statusCode = 200
        res.end(JSON.stringify({ ok: true }))
      })
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    createApiPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      pwaAssets: {
        disabled: false,
        config: true,
      },
      manifest: false, // we will create our own manifest.json in public
      workbox: {
        additionalManifestEntries: [
          { url: '/', revision: '1' },
        ],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /.*\.(?:png|jpg|jpeg|svg|gif|js|css|woff|woff2|ttf|ico)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'static-cache',
              expiration: {
                maxEntries: 1000,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})
