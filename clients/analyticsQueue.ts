/**
 * Analytics Queue (Serverless-native push model)
 *
 * Replaces the long-running BullMQ worker with a simple concurrency-limited
 * HTTP caller that pushes jobs to the `/api/analytics-worker/snapshot` endpoint.
 * This runs within the Vercel cron execution window, fanning out the work
 * to individual serverless functions for isolated execution.
 */

export async function processAnalyticsJobs(jobIds: string[]) {
  const CONCURRENCY = 5
  
  // Use absolute URL since this runs server-side
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  const workerUrl = `${baseUrl}/api/analytics-worker/snapshot`

  console.log(`[ANALYTICS_QUEUE] Pushing ${jobIds.length} jobs to worker endpoint...`)

  // Simple concurrency limiter
  for (let i = 0; i < jobIds.length; i += CONCURRENCY) {
    const batch = jobIds.slice(i, i + CONCURRENCY)
    
    await Promise.allSettled(
      batch.map(async (jobId) => {
        try {
          const res = await fetch(workerUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.CRON_SECRET}`,
            },
            body: JSON.stringify({ jobId }),
          })

          if (!res.ok) {
            console.error(`[ANALYTICS_QUEUE] Worker HTTP error for job ${jobId}: ${res.status}`)
          }
        } catch (err) {
          console.error(`[ANALYTICS_QUEUE] Failed to push job ${jobId}:`, err)
        }
      })
    )
  }

  console.log(`[ANALYTICS_QUEUE] Finished pushing ${jobIds.length} jobs`)
}
