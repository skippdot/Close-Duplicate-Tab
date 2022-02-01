// Simple test for URL extraction functionality
// This can be run in the browser console to test the extractRealUrl function

// Copy the extractRealUrl function here for testing
function extractRealUrl(tabUrl) {
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
			const realUrl = url.searchParams.get('uri') || 
							url.hash.match(/uri=([^&]+)/)?.[1];
			if (realUrl) {
				return decodeURIComponent(realUrl);
			}
		} catch (error) {
			console.warn('Failed to extract URL from suspender:', error);
		}
	}
	
	return tabUrl; // Return original URL if not suspended
}

// Test cases
console.log('Testing URL extraction...');

// Test 1: Marvellous Suspender URL
const suspendedUrl1 = 'chrome-extension://noogafoofpebimajpfpamcfhoaifemoa/suspended.html#ttl=Updated%20Privacy%20Policy%20%26%20Secure%20Handling%20Requirements%20%C2%A0%7C%C2%A0%20Chrome%20Web%20Store%20-%20Program%20Policies%20%C2%A0%7C%C2%A0%20Chrome%20for%20Developers&pos=0&uri=https://developer.chrome.com/docs/webstore/program-policies/user-data-faq';
const result1 = extractRealUrl(suspendedUrl1);
console.log('Test 1 - Marvellous Suspender:');
console.log('Input:', suspendedUrl1);
console.log('Output:', result1);
console.log('Expected: https://developer.chrome.com/docs/webstore/program-policies/user-data-faq');
console.log('✅ Pass:', result1 === 'https://developer.chrome.com/docs/webstore/program-policies/user-data-faq');
console.log('');

// Test 2: Normal URL (should return unchanged)
const normalUrl = 'https://www.google.com';
const result2 = extractRealUrl(normalUrl);
console.log('Test 2 - Normal URL:');
console.log('Input:', normalUrl);
console.log('Output:', result2);
console.log('✅ Pass:', result2 === normalUrl);
console.log('');

// Test 3: Another suspended URL pattern
const suspendedUrl3 = 'chrome-extension://test123/suspended.html#uri=https%3A//example.com/page%3Fq%3Dtest';
const result3 = extractRealUrl(suspendedUrl3);
console.log('Test 3 - URL encoded suspended URL:');
console.log('Input:', suspendedUrl3);
console.log('Output:', result3);
console.log('Expected: https://example.com/page?q=test');
console.log('✅ Pass:', result3 === 'https://example.com/page?q=test');
console.log('');

console.log('URL extraction tests completed!');
