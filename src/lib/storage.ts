// IndexedDB storage layer for offline support

const DB_NAME = 'workspace-db'
const DB_VERSION = 1
const STORES = ['threads', 'tasks', 'goals']

let db: IDBDatabase | null = null

export const initDB = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      resolve()
    }

    request.onupgradeneeded = () => {
      db = request.result
      STORES.forEach(storeName => {
        if (!db.objectStoreNames.contains(storeName)) {
          db.createObjectStore(storeName, { keyPath: 'id' })
        }
      })
    }
  })
}

const getStore = (mode: IDBTransactionMode = 'readonly') => {
  if (!db) {
    throw new Error('Database not initialized')
  }
  const transaction = db.transaction(STORES, mode)
  return {
    threads: transaction.objectStore('threads'),
    tasks: transaction.objectStore('tasks'),
    goals: transaction.objectStore('goals'),
    done: () => new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => reject(transaction.error)
    })
  }
}

export const cacheThreads = async (threads: any[]) => {
  const store = getStore('readwrite')
  try {
    // Clear existing entries
    store.threads.clear()
    // Add new entries
    for (const thread of threads) {
      store.threads.put(thread)
    }
    await store.done()
  } catch (error) {
    console.error('Failed to cache threads:', error)
    throw error
  }
}

export const getCachedThreads = async (): Promise<any[]> => {
  const store = getStore()
  try {
    const threads: any[] = []
    await new Promise((resolve, reject) => {
      const request = store.threads.openCursor()
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          threads.push(cursor.value)
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
    return threads
  } catch (error) {
    console.error('Failed to get cached threads:', error)
    return []
  }
}

export const cacheTasks = async (tasks: any[]) => {
  const store = getStore('readwrite')
  try {
    store.tasks.clear()
    for (const task of tasks) {
      store.tasks.put(task)
    }
    await store.done()
  } catch (error) {
    console.error('Failed to cache tasks:', error)
    throw error
  }
}

export const getCachedTasks = async (): Promise<any[]> => {
  const store = getStore()
  try {
    const tasks: any[] = []
    await new Promise((resolve, reject) => {
      const request = store.tasks.openCursor()
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          tasks.push(cursor.value)
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
    return tasks
  } catch (error) {
    console.error('Failed to get cached tasks:', error)
    return []
  }
}

export const cacheGoals = async (goals: any[]) => {
  const store = getStore('readwrite')
  try {
    store.goals.clear()
    for (const goal of goals) {
      store.goals.put(goal)
    }
    await store.done()
  } catch (error) {
    console.error('Failed to cache goals:', error)
    throw error
  }
}

export const getCachedGoals = async (): Promise<any[]> => {
  const store = getStore()
  try {
    const goals: any[] = []
    await new Promise((resolve, reject) => {
      const request = store.goals.openCursor()
      request.onsuccess = () => {
        const cursor = request.result
        if (cursor) {
          goals.push(cursor.value)
          cursor.continue()
        } else {
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
    return goals
  } catch (error) {
    console.error('Failed to get cached goals:', error)
    return []
  }
}

export const clearCache = async () => {
  const store = getStore('readwrite')
  try {
    for (const storeName of STORES) {
      store[storeName].clear()
    }
    await store.done()
  } catch (error) {
    console.error('Failed to clear cache:', error)
    throw error
  }
}