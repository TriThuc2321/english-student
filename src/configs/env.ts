const ENV = {
  API_URL: process.env.NEXT_PUBLIC_API_URL,
  COOKIE: {
    ACCESS_TOKEN_NAME:
      process.env.ACCESS_TOKEN_COOKIE_NAME || 'st_access_token',
    REFRESH_TOKEN_NAME:
      process.env.REFRESH_TOKEN_COOKIE_NAME || 'st_refresh_token',
  },
  CLIENT_IP: {
    HEADER: process.env.CLIENT_IP_HEADER?.toLowerCase() || undefined,
    HOPS: Number(process.env.TRUSTED_PROXY_HOPS) || 0,
  },
};

export default ENV;
