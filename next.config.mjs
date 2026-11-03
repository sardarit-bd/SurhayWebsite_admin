/** @type {import('next').NextConfig} */
const nextConfig = {
  // No `output: "export"` here: the admin app needs a Node server
  // for API routes, Prisma and iron-session.
  reactStrictMode: true,
};

export default nextConfig;