/** @type {import('next').NextConfig} */
const nextConfig = {
  // Explicitly restrict Next.js file tracing and root detection to the local project folder.
  // This prevents it from scanning C:\\Users\\Margil and picking up legacy or conflicting page definitions.
  outputFileTracingRoot: __dirname,
  reactStrictMode: true,
};

module.exports = nextConfig;
