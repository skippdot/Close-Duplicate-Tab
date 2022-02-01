// Duplicate Detection Tests

describe('Duplicate Detection Logic', () => {
    beforeEach(() => {
        resetAllMocks();
    });

    describe('Tab Processing', () => {
        test('should identify duplicate tabs correctly', () => {
            const mockTabs = [
                createMockTab(1, 'https://example.com', 'Example 1'),
                createMockTab(2, 'https://example.com', 'Example 2', { active: true }),
                createMockTab(3, 'https://google.com', 'Google'),
                createMockTab(4, 'https://github.com', 'GitHub')
            ];

            // Simulate the duplicate detection logic
            const urls = {};
            const duplicates = [];

            mockTabs.forEach(tab => {
                if (tab.url in urls) {
                    duplicates.push(tab.id);
                } else {
                    urls[tab.url] = tab;
                }
            });

            expect(duplicates).toContain(2); // Second example.com tab should be marked as duplicate (first one is kept)
            expect(duplicates).not.toContain(1); // First tab should be preserved
            expect(duplicates).not.toContain(3); // Unique tabs should not be duplicates
            expect(duplicates).not.toContain(4);
        });

        test('should prefer active tabs over inactive ones', () => {
            const mockTabs = [
                createMockTab(1, 'https://example.com', 'Example 1'),
                createMockTab(2, 'https://example.com', 'Example 2', { active: true })
            ];

            const urls = {};
            const toClose = [];

            mockTabs.forEach(tab => {
                if (tab.url in urls) {
                    const existing = urls[tab.url];
                    if (!existing.pinned && (tab.pinned || tab.active)) {
                        toClose.push(existing.id);
                        urls[tab.url] = tab;
                    } else {
                        toClose.push(tab.id);
                    }
                } else {
                    urls[tab.url] = tab;
                }
            });

            expect(toClose).toContain(1); // Inactive tab should be closed
            expect(toClose).not.toContain(2); // Active tab should be preserved
        });

        test('should prefer pinned tabs over unpinned ones', () => {
            const mockTabs = [
                createMockTab(1, 'https://example.com', 'Example 1'),
                createMockTab(2, 'https://example.com', 'Example 2', { pinned: true })
            ];

            const urls = {};
            const toClose = [];

            mockTabs.forEach(tab => {
                if (tab.url in urls) {
                    const existing = urls[tab.url];
                    if (!existing.pinned && (tab.pinned || tab.active)) {
                        toClose.push(existing.id);
                        urls[tab.url] = tab;
                    } else {
                        toClose.push(tab.id);
                    }
                } else {
                    urls[tab.url] = tab;
                }
            });

            expect(toClose).toContain(1); // Unpinned tab should be closed
            expect(toClose).not.toContain(2); // Pinned tab should be preserved
        });
    });

    describe('Suspended Tab Handling', () => {
        test('should detect suspended tabs as duplicates of normal tabs', () => {
            const normalUrl = 'https://example.com';
            const suspendedUrl = createSuspendedUrl(normalUrl);

            const mockTabs = [
                createMockTab(1, normalUrl, 'Example Normal'),
                createMockTab(2, suspendedUrl, 'Example Suspended')
            ];

            // Simulate URL extraction and duplicate detection
            const extractRealUrl = (url) => {
                if (url.includes('suspended.html#uri=')) {
                    const match = url.match(/uri=([^&]+)/);
                    return match ? decodeURIComponent(match[1]) : url;
                }
                return url;
            };

            const urls = {};
            const duplicates = [];

            mockTabs.forEach(tab => {
                const realUrl = extractRealUrl(tab.url);
                if (realUrl in urls) {
                    duplicates.push(tab.id);
                } else {
                    urls[realUrl] = tab;
                }
            });

            expect(duplicates).toContain(2); // Suspended tab should be detected as duplicate
            expect(duplicates).not.toContain(1); // Normal tab should be preserved
        });

        test('should handle multiple suspended tabs with same real URL', () => {
            const realUrl = 'https://example.com';
            const suspendedUrl1 = createSuspendedUrl(realUrl, 'suspender1');
            const suspendedUrl2 = createSuspendedUrl(realUrl, 'suspender2');

            const mockTabs = [
                createMockTab(1, suspendedUrl1, 'Example Suspended 1'),
                createMockTab(2, suspendedUrl2, 'Example Suspended 2'),
                createMockTab(3, realUrl, 'Example Normal')
            ];

            const extractRealUrl = (url) => {
                if (url.includes('suspended.html#uri=')) {
                    const match = url.match(/uri=([^&]+)/);
                    return match ? decodeURIComponent(match[1]) : url;
                }
                return url;
            };

            const urls = {};
            const duplicates = [];

            mockTabs.forEach(tab => {
                const realUrl = extractRealUrl(tab.url);
                if (realUrl in urls) {
                    duplicates.push(tab.id);
                } else {
                    urls[realUrl] = tab;
                }
            });

            expect(duplicates).toHaveLength(2); // Both suspended tabs should be duplicates
            expect(duplicates).toContain(2);
            expect(duplicates).toContain(3);
        });
    });

    describe('Window Filtering', () => {
        test('should filter tabs by window when currentWindowOnly is enabled', () => {
            const mockTabs = [
                createMockTab(1, 'https://example.com', 'Example 1', { windowId: 1 }),
                createMockTab(2, 'https://example.com', 'Example 2', { windowId: 2 }),
                createMockTab(3, 'https://google.com', 'Google', { windowId: 1 })
            ];

            // Simulate currentWindowOnly filtering (assuming current window is 1)
            const currentWindowId = 1;
            const filteredTabs = mockTabs.filter(tab => tab.windowId === currentWindowId);

            expect(filteredTabs).toHaveLength(2);
            expect(filteredTabs.map(t => t.id)).toEqual([1, 3]);
        });
    });

    describe('Tab Sorting', () => {
        test('should sort tabs by URL when sortTabs is enabled', () => {
            const mockTabs = [
                createMockTab(1, 'https://zebra.com', 'Zebra'),
                createMockTab(2, 'https://apple.com', 'Apple'),
                createMockTab(3, 'https://banana.com', 'Banana')
            ];

            // Simulate sorting
            const sortedTabs = [...mockTabs].sort((a, b) => 
                a.url.toLowerCase().localeCompare(b.url.toLowerCase())
            );

            expect(sortedTabs.map(t => t.url)).toEqual([
                'https://apple.com',
                'https://banana.com',
                'https://zebra.com'
            ]);
        });

        test('should sort by window ID first, then by URL', () => {
            const mockTabs = [
                createMockTab(1, 'https://zebra.com', 'Zebra', { windowId: 2 }),
                createMockTab(2, 'https://apple.com', 'Apple', { windowId: 1 }),
                createMockTab(3, 'https://banana.com', 'Banana', { windowId: 2 })
            ];

            // Simulate window + URL sorting
            const sortedTabs = [...mockTabs].sort((a, b) => {
                if (a.windowId !== b.windowId) {
                    return a.windowId - b.windowId;
                }
                return a.url.toLowerCase().localeCompare(b.url.toLowerCase());
            });

            expect(sortedTabs.map(t => t.id)).toEqual([2, 3, 1]); // Window 1 first, then window 2 sorted by URL
        });
    });

    describe('Edge Cases', () => {
        test('should handle empty tab list', () => {
            const mockTabs = [];
            const urls = {};
            const duplicates = [];

            mockTabs.forEach(tab => {
                if (tab.url in urls) {
                    duplicates.push(tab.id);
                } else {
                    urls[tab.url] = tab;
                }
            });

            expect(duplicates).toHaveLength(0);
            expect(Object.keys(urls)).toHaveLength(0);
        });

        test('should handle tabs with identical URLs but different protocols', () => {
            const mockTabs = [
                createMockTab(1, 'http://example.com', 'Example HTTP'),
                createMockTab(2, 'https://example.com', 'Example HTTPS')
            ];

            const urls = {};
            const duplicates = [];

            mockTabs.forEach(tab => {
                if (tab.url in urls) {
                    duplicates.push(tab.id);
                } else {
                    urls[tab.url] = tab;
                }
            });

            expect(duplicates).toHaveLength(0); // Different protocols = different URLs
            expect(Object.keys(urls)).toHaveLength(2);
        });

        test('should handle very long URLs', () => {
            const longPath = 'a'.repeat(1000);
            const longUrl = `https://example.com/${longPath}`;
            
            const mockTabs = [
                createMockTab(1, longUrl, 'Long URL 1'),
                createMockTab(2, longUrl, 'Long URL 2')
            ];

            const urls = {};
            const duplicates = [];

            mockTabs.forEach(tab => {
                if (tab.url in urls) {
                    duplicates.push(tab.id);
                } else {
                    urls[tab.url] = tab;
                }
            });

            expect(duplicates).toContain(2);
            expect(duplicates).toHaveLength(1);
        });
    });
});
