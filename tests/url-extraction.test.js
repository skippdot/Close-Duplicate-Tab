// URL Extraction Tests
// We need to extract the function from close_tabs.js for testing

// Copy the extractRealUrl function for testing
function extractRealUrl(tabUrl) {
  // Handle null/undefined inputs
  if (!tabUrl) {
    return tabUrl;
  }

  // Check if this is a suspended tab URL
  if (tabUrl.includes('suspended.html#')) {
    try {
      const hashPart = tabUrl.split('#')[1];
      const params = new URLSearchParams(hashPart);
      const realUrl = params.get('uri');
      if (realUrl) {
        return decodeURIComponent(realUrl);
      }
    } catch (error) {
      console.warn('Failed to extract real URL from suspended tab:', error);
    }
  }

  // Check for other common tab suspender patterns
  if (tabUrl.includes('chrome-extension://') && tabUrl.includes('suspended')) {
    try {
      const url = new URL(tabUrl);
      // Handle different suspender extension patterns
      const realUrl = url.searchParams.get('uri') || url.hash.match(/uri=([^&]+)/)?.[1];
      if (realUrl) {
        return decodeURIComponent(realUrl);
      }
    } catch (error) {
      console.warn('Failed to extract URL from suspender:', error);
    }
  }

  return tabUrl; // Return original URL if not suspended
}

describe('URL Extraction', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('Marvellous Suspender URLs', () => {
    test('should extract real URL from Marvellous Suspender format', () => {
      const suspendedUrl =
        'chrome-extension://noogafoofpebimajpfpamcfhoaifemoa/suspended.html#ttl=Test&pos=0&uri=https://example.com/page';
      const realUrl = extractRealUrl(suspendedUrl);
      expect(realUrl).toBe('https://example.com/page');
    });

    test('should handle URL encoded characters in suspended URLs', () => {
      const suspendedUrl =
        'chrome-extension://test/suspended.html#uri=https%3A//example.com/page%3Fq%3Dtest%26foo%3Dbar';
      const realUrl = extractRealUrl(suspendedUrl);
      expect(realUrl).toBe('https://example.com/page?q=test&foo=bar');
    });

    test('should handle complex URLs with special characters', () => {
      const complexUrl =
        'https://developer.chrome.com/docs/webstore/program-policies/user-data-faq';
      const suspendedUrl = `chrome-extension://test/suspended.html#uri=${encodeURIComponent(complexUrl)}`;
      const realUrl = extractRealUrl(suspendedUrl);
      expect(realUrl).toBe(complexUrl);
    });

    test('should handle URLs with hash fragments', () => {
      const urlWithHash = 'https://example.com/page#section1';
      const suspendedUrl = `chrome-extension://test/suspended.html#uri=${encodeURIComponent(urlWithHash)}`;
      const realUrl = extractRealUrl(suspendedUrl);
      expect(realUrl).toBe(urlWithHash);
    });
  });

  describe('Other Suspender Patterns', () => {
    test('should handle Great Suspender format', () => {
      const suspendedUrl = 'chrome-extension://greatid/suspended.html?uri=https%3A//example.com';
      const realUrl = extractRealUrl(suspendedUrl);
      expect(realUrl).toBe('https://example.com');
    });

    test('should handle suspender URLs with hash-based URI parameter', () => {
      const suspendedUrl =
        'chrome-extension://test/suspended.html#title=Test&uri=https%3A//example.com';
      const realUrl = extractRealUrl(suspendedUrl);
      expect(realUrl).toBe('https://example.com');
    });
  });

  describe('Normal URLs', () => {
    test('should return normal URLs unchanged', () => {
      const normalUrls = [
        'https://www.google.com',
        'https://github.com/user/repo',
        'http://localhost:3000',
        'https://example.com/path?query=value#hash'
      ];

      normalUrls.forEach(url => {
        expect(extractRealUrl(url)).toBe(url);
      });
    });

    test('should handle chrome:// URLs that are not suspended', () => {
      const chromeUrls = ['chrome://extensions/', 'chrome://settings/', 'chrome://newtab/'];

      chromeUrls.forEach(url => {
        expect(extractRealUrl(url)).toBe(url);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle malformed suspended URLs gracefully', () => {
      const testCases = [
        {
          input: 'chrome-extension://test/suspended.html#invalid',
          expected: 'chrome-extension://test/suspended.html#invalid' // No uri param, return original
        },
        {
          input: 'chrome-extension://test/suspended.html#uri=',
          expected: 'chrome-extension://test/suspended.html#uri=' // Empty uri, return original
        },
        {
          input: 'chrome-extension://test/suspended.html#uri=invalid-url',
          expected: 'invalid-url' // Valid extraction, even if URL is invalid
        },
        {
          input: 'chrome-extension://test/suspended.html',
          expected: 'chrome-extension://test/suspended.html' // No hash, return original
        }
      ];

      testCases.forEach(testCase => {
        expect(() => extractRealUrl(testCase.input)).not.toThrow();
        expect(extractRealUrl(testCase.input)).toBe(testCase.expected);
      });
    });

    test('should handle empty and null inputs', () => {
      expect(extractRealUrl('')).toBe('');
      expect(extractRealUrl(null)).toBe(null);
      expect(extractRealUrl(undefined)).toBe(undefined);
    });

    test('should handle very long URLs', () => {
      const longPath = 'a'.repeat(1000);
      const longUrl = `https://example.com/${longPath}`;
      const suspendedUrl = `chrome-extension://test/suspended.html#uri=${encodeURIComponent(longUrl)}`;
      const realUrl = extractRealUrl(suspendedUrl);
      expect(realUrl).toBe(longUrl);
    });
  });

  describe('Real-world Examples', () => {
    test('should handle the exact Marvellous Suspender URL from user report', () => {
      const userReportedUrl =
        'chrome-extension://noogafoofpebimajpfpamcfhoaifemoa/suspended.html#ttl=Updated%20Privacy%20Policy%20%26%20Secure%20Handling%20Requirements%20%C2%A0%7C%C2%A0%20Chrome%20Web%20Store%20-%20Program%20Policies%20%C2%A0%7C%C2%A0%20Chrome%20for%20Developers&pos=0&uri=https://developer.chrome.com/docs/webstore/program-policies/user-data-faq';
      const expectedUrl =
        'https://developer.chrome.com/docs/webstore/program-policies/user-data-faq';
      const realUrl = extractRealUrl(userReportedUrl);
      expect(realUrl).toBe(expectedUrl);
    });

    test('should handle multiple suspender extensions', () => {
      const testCases = [
        {
          name: 'Marvellous Suspender',
          url: 'chrome-extension://noogafoofpebimajpfpamcfhoaifemoa/suspended.html#uri=https%3A//example.com'
        },
        {
          name: 'The Great Suspender',
          url: 'chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html#uri=https%3A//example.com'
        },
        {
          name: 'Auto Tab Discard',
          url: 'chrome-extension://jhnleheckmknfcgijgkadoemagpecfol/suspended.html#uri=https%3A//example.com'
        }
      ];

      testCases.forEach(testCase => {
        const realUrl = extractRealUrl(testCase.url);
        expect(realUrl).toBe('https://example.com');
      });
    });
  });
});
