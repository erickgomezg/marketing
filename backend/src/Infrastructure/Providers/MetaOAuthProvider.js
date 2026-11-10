const DEFAULT_SCOPES = [
  'pages_show_list',
  'pages_read_engagement',
  'read_insights',
  'pages_manage_posts',
  'pages_read_user_content',
  'pages_manage_engagement',
  'instagram_basic',
  'instagram_manage_insights',
  'instagram_content_publish',
  'instagram_manage_comments',
  'ads_read',
];

function required(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name}_NOT_CONFIGURED`);
  return value;
}

export class MetaOAuthProvider {
  configuration() {
    const appId = required('META_APP_ID');
    const appSecret = required('META_APP_SECRET');
    const redirectUri = required('META_REDIRECT_URI');
    const version = process.env.META_GRAPH_API_VERSION || 'v27.0';
    if (!/^v\\d+\\.\\d+$/.test(version)) throw new Error('META_GRAPH_API_VERSION_INVALID');
    return { appId, appSecret, redirectUri, version };
  }

  scopes() {
    const configured = process.env.META_SCOPES?.split(',').map((value) => value.trim()).filter(Boolean);
    return [...new Set(configured?.length ? configured : DEFAULT_SCOPES)];
  }

  createAuthorizationUrl({ state }) {
    const { appId, redirectUri } = this.configuration();
    const url = new URL('https://www.facebook.com/' + (process.env.META_GRAPH_API_VERSION || 'v27.0') + '/dialog/oauth');
    url.searchParams.set('client_id', appId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('state', state);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', this.scopes().join(','));
    url.searchParams.set('auth_type', 'rerequest');
    return url.toString();
  }

  async exchangeCode(code) {
    const config = this.configuration();
    const endpoint = new URL(`https://graph.facebook.com/${config.version}/oauth/access_token`);
    endpoint.searchParams.set('client_id', config.appId);
    endpoint.searchParams.set('client_secret', config.appSecret);
    endpoint.searchParams.set('redirect_uri', config.redirectUri);
    endpoint.searchParams.set('code', code);
    const shortLived = await this.request(endpoint);
    const longLivedUrl = new URL(`https://graph.facebook.com/${config.version}/oauth/access_token`);
    longLivedUrl.searchParams.set('grant_type', 'fb_exchange_token');
    longLivedUrl.searchParams.set('client_id', config.appId);
    longLivedUrl.searchParams.set('client_secret', config.appSecret);
    longLivedUrl.searchParams.set('fb_exchange_token', shortLived.access_token);
    try {
      const longLived = await this.request(longLivedUrl);
      return {
        accessToken: longLived.access_token,
        tokenType: longLived.token_type || 'bearer',
        expiresIn: Number(longLived.expires_in || 0),
      };
    } catch {
      // Do not persist the short-lived token if the long-lived exchange fails.
      throw new Error('META_LONG_LIVED_TOKEN_EXCHANGE_FAILED');
    }
  }

  async request(url) {
    const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(12000) });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.error || !payload.access_token) {
      throw new Error('META_OAUTH_EXCHANGE_FAILED');
    }
    return payload;
  }
}
