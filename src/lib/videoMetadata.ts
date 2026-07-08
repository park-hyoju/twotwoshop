export interface VideoMetadata {
  duration: number | null
  width: number | null
  height: number | null
  thumbnail: string | null
}

export function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)
    let settled = false

    function finish(result: VideoMetadata) {
      if (settled) {
        return
      }

      settled = true
      URL.revokeObjectURL(objectUrl)
      resolve(result)
    }

    function fail(error: unknown) {
      if (settled) {
        return
      }

      settled = true
      URL.revokeObjectURL(objectUrl)
      reject(error)
    }

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(0.1, (video.duration || 0.1) * 0.05)
    })

    video.addEventListener('seeked', () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = video.videoWidth || 320
        canvas.height = video.videoHeight || 180
        const context = canvas.getContext('2d')

        if (!context || canvas.width === 0 || canvas.height === 0) {
          finish({
            duration: Number.isFinite(video.duration) ? video.duration : null,
            width: video.videoWidth > 0 ? video.videoWidth : null,
            height: video.videoHeight > 0 ? video.videoHeight : null,
            thumbnail: null,
          })
          return
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height)
        const thumbnail = canvas.toDataURL('image/jpeg', 0.82)

        finish({
          duration: Number.isFinite(video.duration) ? video.duration : null,
          width: video.videoWidth > 0 ? video.videoWidth : null,
          height: video.videoHeight > 0 ? video.videoHeight : null,
          thumbnail,
        })
      } catch (error) {
        finish({
          duration: Number.isFinite(video.duration) ? video.duration : null,
          width: video.videoWidth > 0 ? video.videoWidth : null,
          height: video.videoHeight > 0 ? video.videoHeight : null,
          thumbnail: null,
        })
        if (import.meta.env.DEV) {
          console.warn('[video-metadata] thumbnail capture failed', error)
        }
      }
    })

    video.addEventListener('error', () => {
      fail(new Error('영상 정보를 읽지 못했습니다.'))
    })

    video.src = objectUrl
  })
}
