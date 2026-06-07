const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,   // ← skips ESLint on Vercel build
  },
}

export default nextConfig
