export function resolveSafeInternalPath(
  from: unknown,
  options: {
    fallback: string
    allowedPrefix?: string
    disallowedPaths?: string[]
  },
): string {
  if (typeof from !== 'string') {
    return options.fallback
  }

  const path = from.trim()

  if (!path.startsWith('/') || path.startsWith('//') || path.includes('://')) {
    return options.fallback
  }

  if (options.allowedPrefix && !path.startsWith(options.allowedPrefix)) {
    return options.fallback
  }

  if (options.disallowedPaths?.includes(path)) {
    return options.fallback
  }

  return path
}
