import fs from 'fs/promises'
import path from 'path'

interface Video {
  title: string
  url: string
  description: string
}

async function getVideos(): Promise<Video[]> {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), 'content', 'training', 'videos.json'),
      'utf-8'
    )
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export default async function TrainingPage() {
  const videos = await getVideos()

  return (
    <div className="max-w-3xl mx-auto py-16 px-4">
      <h1 className="text-3xl font-bold text-white mb-8">Training Videos</h1>
      {videos.length === 0 && <p className="text-gray-500">No videos yet.</p>}
      <div className="space-y-10">
        {videos.map((video, i) => (
          <div key={i}>
            <h2 className="font-semibold text-white mb-1">{video.title}</h2>
            <p className="text-gray-400 text-sm mb-3">{video.description}</p>
            <div className="aspect-video w-full">
              <iframe
                src={video.url}
                className="w-full h-full rounded"
                allowFullScreen
                title={video.title}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
