/**
 * Utility functions for parsing User-Agent strings
 */

export interface ParsedUserAgent {
  browser?: string;
  os?: string;
  deviceType?: 'mobile' | 'tablet' | 'desktop';
  deviceName?: string;
}

/**
 * Parse user agent string to extract browser, OS, device type, and device name
 */
export function parseUserAgent(userAgent: string): ParsedUserAgent {
  if (!userAgent || userAgent === 'Unknown') {
    return {};
  }

  const ua = userAgent.toLowerCase();
  const result: ParsedUserAgent = {};

  // Detect Browser
  if (ua.includes('edg/')) {
    result.browser = 'Microsoft Edge';
  } else if (ua.includes('chrome/') && !ua.includes('edg/')) {
    result.browser = 'Chrome';
  } else if (ua.includes('safari/') && !ua.includes('chrome/')) {
    result.browser = 'Safari';
  } else if (ua.includes('firefox/')) {
    result.browser = 'Firefox';
  } else if (ua.includes('opera/') || ua.includes('opr/')) {
    result.browser = 'Opera';
  } else if (ua.includes('msie') || ua.includes('trident/')) {
    result.browser = 'Internet Explorer';
  } else if (ua.includes('samsungbrowser/')) {
    result.browser = 'Samsung Internet';
  } else if (ua.includes('ucbrowser/')) {
    result.browser = 'UC Browser';
  }

  // Detect OS
  if (ua.includes('windows nt 10')) {
    result.os = 'Windows 10/11';
  } else if (ua.includes('windows nt 6.3')) {
    result.os = 'Windows 8.1';
  } else if (ua.includes('windows nt 6.2')) {
    result.os = 'Windows 8';
  } else if (ua.includes('windows nt 6.1')) {
    result.os = 'Windows 7';
  } else if (ua.includes('windows nt')) {
    result.os = 'Windows';
  } else if (ua.includes('mac os x') || ua.includes('macintosh')) {
    const match = ua.match(/mac os x (\d+)[._](\d+)/);
    if (match) {
      const major = parseInt(match[1], 10);
      const minor = parseInt(match[2], 10);
      if (major >= 11) {
        result.os = `macOS ${major}.${minor}`;
      } else {
        result.os = `macOS ${match[1]}.${match[2]}`;
      }
    } else {
      result.os = 'macOS';
    }
  } else if (ua.includes('android')) {
    const match = ua.match(/android ([\d.]+)/);
    if (match) {
      result.os = `Android ${match[1]}`;
    } else {
      result.os = 'Android';
    }
  } else if (ua.includes('iphone') || ua.includes('ipod')) {
    const match = ua.match(/os ([\d_]+)/);
    if (match) {
      result.os = `iOS ${match[1].replace(/_/g, '.')}`;
    } else {
      result.os = 'iOS';
    }
  } else if (ua.includes('ipad')) {
    const match = ua.match(/os ([\d_]+)/);
    if (match) {
      result.os = `iPadOS ${match[1].replace(/_/g, '.')}`;
    } else {
      result.os = 'iPadOS';
    }
  } else if (ua.includes('linux')) {
    result.os = 'Linux';
  } else if (ua.includes('ubuntu')) {
    result.os = 'Ubuntu';
  } else if (ua.includes('fedora')) {
    result.os = 'Fedora';
  }

  // Detect Device Type
  const mobileRegex =
    /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i;
  const tabletRegex = /ipad|android(?!.*mobile)|tablet/i;

  if (tabletRegex.test(userAgent)) {
    result.deviceType = 'tablet';
  } else if (mobileRegex.test(userAgent)) {
    result.deviceType = 'mobile';
  } else {
    result.deviceType = 'desktop';
  }

  // Generate Device Name
  const deviceParts: string[] = [];

  // Try to extract device model for mobile/tablet
  if (ua.includes('iphone')) {
    const match = ua.match(/iphone\s*os\s*[\d_]+/);
    deviceParts.push('iPhone');
  } else if (ua.includes('ipad')) {
    deviceParts.push('iPad');
  } else if (ua.includes('android')) {
    // Try to extract device model from Android user agent
    const modelMatch = ua.match(/\s*([^)]+)\s*\)/);
    if (
      modelMatch &&
      !modelMatch[1].includes('linux') &&
      !modelMatch[1].includes('android')
    ) {
      deviceParts.push(modelMatch[1].trim());
    } else {
      deviceParts.push('Android Device');
    }
  } else if (result.os) {
    deviceParts.push(result.os);
  }

  if (result.browser) {
    deviceParts.push(result.browser);
  }

  if (deviceParts.length > 0) {
    result.deviceName = deviceParts.join(' on ');
  } else if (result.browser && result.os) {
    result.deviceName = `${result.browser} on ${result.os}`;
  } else if (result.browser) {
    result.deviceName = result.browser;
  } else if (result.os) {
    result.deviceName = result.os;
  }

  return result;
}
