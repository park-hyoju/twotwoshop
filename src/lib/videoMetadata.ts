export interface VideoMetadata {
  duration: number | null
  width: number | null
  height: number | null
  thumbnail: string | null
}

const EMPTY_METADATA: VideoMetadata = {
  duration: null,
  width: null,
  height: null,
  thumbnail: null,
}

const METADATA_TIMEOUT_MS = 8000

/**
 * 영상 메타/썸네일 추출.
 * 실패해도 업로드를 막지 않도록 항상 resolve합니다.
 * (iPhone HEVC/HDR 등에서 decode 실패해도 Storage 업로드는 진행)
 */
export function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    const objectUrl = URL.createObjectURL(file)
    let settled = false

    function finish(result: VideoMetadata) {
      if (settled) {
        return
      }

      settled = true
      window.clearTimeout(timeoutId)
      URL.revokeObjectURL(objectUrl)
      resolve(result)
    }

    const timeoutId = window.setTimeout(() => {
      if (import.meta.env.DEV) {
        console.warn('[video-metadata] timed out; continuing upload without thumbnail')
      }
      finish(EMPTY_METADATA)
    }, METADATA_TIMEOUT_MS)

    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    video.addEventListener('loadedmetadata', () => {
      const duration = Number.isFinite(video.duration) ? video.duration : null
      if (!duration || duration <= 0 || !video.videoWidth) {
        finish({
          duration,
          width: video.videoWidth > 0 ? video.videoWidth : null,
          height: video.videoHeight > 0 ? video.videoHeight : null,
          thumbnail: null,
        })
        return
      }

      video.currentTime = Math.min(0.1, duration * 0.05)
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
        if (import.meta.env.DEV) {
          console.warn('[video-metadata] thumbnail capture failed', error)
        }
        finish({
          duration: Number.isFinite(video.duration) ? video.duration : null,
          width: video.videoWidth > 0 ? video.videoWidth : null,
          height: video.videoHeight > 0 ? video.videoHeight : null,
          thumbnail: null,
        })
      }
    })

    video.addEventListener('error', () => {
      if (import.meta.env.DEV) {
        console.warn('[video-metadata] browser could not decode preview; continuing upload')
      }
      finish(EMPTY_METADATA)
    })

    video.src = objectUrl
  })
}
