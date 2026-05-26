import { withSerwist } from '@serwist/turbopack'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {},
}

export default withSerwist(nextConfig)
