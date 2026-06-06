/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/website-builder',
  reactStrictMode: true,
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    optimizePackageImports: [
      "@codesandbox/sandpack-react",
      "lucide-react",
      "react-markdown",
    ],
  },
};

export default nextConfig;
