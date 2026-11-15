import type { NextConfig } from "next";

// Pages read cookies and live EUDIPLO state on every request (SSR), so Cache
// Components stay off and the classic dynamic rendering model applies.
const nextConfig: NextConfig = {};

export default nextConfig;
