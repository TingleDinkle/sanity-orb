// Vercel Edge Middleware for Anti-Scraping Protection
// This runs at the edge, before requests reach your application

export function middleware(request) {
  const url = new URL(request.url);
  const userAgent = request.headers.get('user-agent') || '';
  const clientIP = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

  // ============================================
  // BOT DETECTION PATTERNS
  // ============================================

  // Known bot patterns
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /python/i,
    /curl/i,
    /wget/i,
    /postman/i,
    /insomnia/i,
    /httpie/i,
    /scrapy/i,
    /selenium/i,
    /chrome-headless/i,
    /phantomjs/i,
    /nightmare/i,
    /puppeteer/i,
    /playwright/i,
    /webdriver/i,
    /headless/i,
    /dataminer/i,
    /extractor/i,
    /harvest/i,
    /miner/i,
    /collector/i
  ];

  // Check for suspicious User-Agent
  const isBot = botPatterns.some(pattern => pattern.test(userAgent));

  // Additional bot detection heuristics
  const isHeadless = /headless/i.test(userAgent) ||
                    request.headers.get('x-requested-with') === 'XMLHttpRequest' &&
                    !userAgent.includes('Mozilla');

  // Check for automation headers
  const automationHeaders = [
    'x-crawler',
    'x-scraper',
    'x-bot',
    'x-automation',
    'x-selenium-ide',
    'x-puppeteer',
    'x-playwright'
  ];

  const hasAutomationHeader = automationHeaders.some(header =>
    request.headers.has(header)
  );

  // ============================================
  // REQUEST PATTERN ANALYSIS
  // ============================================

  // API enumeration detection (too many different API calls)
  if (url.pathname.startsWith('/api/')) {
    // Allow legitimate API calls but block obvious enumeration
    const suspiciousApiPatterns = [
      /\/api\/.*\?.*=.*=.*=.*=/, // Multiple query params (enumeration)
      /\/api\/(admin|config|debug|test|phpmyadmin|wp-admin|adminer)/i,
      /\/api\/.*\.(php|asp|jsp|do)$/i,
      /\/api\/.*%/, // URL encoded characters (often used in attacks)
    ];

    if (suspiciousApiPatterns.some(pattern => pattern.test(url.pathname + url.search))) {
      return createBlockedResponse('API enumeration detected');
    }
  }

  // ============================================
  // RATE LIMITING CHECKS
  // ============================================

  // Basic rate limiting for API endpoints
  if (url.pathname.startsWith('/api/')) {
    // This is a simple implementation - for production, consider using
    // a more sophisticated rate limiting service like Upstash Rate Limit

    // Check for rapid successive requests (basic implementation)
    // In a real implementation, you'd use Redis or similar for persistence
    // For now, we'll rely on the backend rate limiting
  }

  // ============================================
  // BLOCKING LOGIC
  // ============================================

  if (isBot || isHeadless || hasAutomationHeader) {
    console.log(`🚫 Blocked suspicious request from ${clientIP}: ${userAgent}`);

    // Return different responses to confuse scrapers
    const responses = [
      createBlockedResponse('Access Denied'),
      createBlockedResponse('Forbidden'),
      createBlockedResponse('Rate Limited'),
      createRedirectResponse(),
      createCaptchaResponse()
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  // ============================================
  // ALLOWED REQUESTS
  // ============================================

  // Add custom headers for legitimate requests
  const response = new Response(null, {
    headers: {
      'X-Protected-By': 'SanityOrb-AntiScrape-v1',
      'X-Request-ID': generateRequestId(),
    }
  });

  return response;
}

// Helper function to create blocked responses
function createBlockedResponse() {
  const responses = [
    { status: 403, message: 'Access Denied' },
    { status: 429, message: 'Too Many Requests' },
    { status: 401, message: 'Unauthorized' },
    { status: 451, message: 'Unavailable For Legal Reasons' }
  ];

  const selected = responses[Math.floor(Math.random() * responses.length)];

  return new Response(JSON.stringify({
    error: selected.message,
    code: selected.status,
    timestamp: new Date().toISOString(),
    // Add some noise to confuse scrapers
    noise: Math.random().toString(36).substring(7)
  }), {
    status: selected.status,
    headers: {
      'Content-Type': 'application/json',
      'X-Blocked-By': 'Anti-Scrape Protection',
      'Retry-After': '300', // 5 minutes
    }
  });
}

// Create a redirect response to confuse scrapers
function createRedirectResponse() {
  return new Response(null, {
    status: 302,
    headers: {
      'Location': 'https://httpstat.us/403', // Redirect to a 403 page
      'X-Blocked': 'true'
    }
  });
}

// Create a fake captcha response
function createCaptchaResponse() {
  return new Response(JSON.stringify({
    requires_captcha: true,
    captcha_site_key: 'fake-captcha-key-' + Math.random().toString(36).substring(7),
    message: 'Please complete the captcha to continue'
  }), {
    status: 403,
    headers: {
      'Content-Type': 'application/json',
      'X-Captcha-Required': 'true'
    }
  });
}

// Generate a unique request ID
function generateRequestId() {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

// Configure which paths this middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};
