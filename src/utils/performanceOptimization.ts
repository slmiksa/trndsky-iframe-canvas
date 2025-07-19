// أدوات تحسين الأداء للتطبيق

// دالة لتجنب التحديثات المتكررة (debounce)
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// دالة لتجنب التحديثات المتكررة مع استدعاء فوري أول مرة (throttle)
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
};

// دالة للتحقق من حالة الاتصال
export const checkConnectionStatus = async (): Promise<boolean> => {
  try {
    const response = await fetch('https://httpbin.org/get', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache'
    });
    return true;
  } catch {
    return navigator.onLine;
  }
};

// دالة لتحسين تحديث البيانات
export const optimizedDataFetch = async <T>(
  fetchFunction: () => Promise<T>,
  cacheKey: string,
  cacheTime: number = 30000 // 30 ثانية افتراضياً
): Promise<T> => {
  const cached = sessionStorage.getItem(cacheKey);
  const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);
  
  if (cached && cacheTimestamp) {
    const age = Date.now() - parseInt(cacheTimestamp);
    if (age < cacheTime) {
      return JSON.parse(cached);
    }
  }
  
  try {
    const data = await fetchFunction();
    sessionStorage.setItem(cacheKey, JSON.stringify(data));
    sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
    return data;
  } catch (error) {
    // إرجاع البيانات المخزنة مؤقتاً في حالة الخطأ
    if (cached) {
      return JSON.parse(cached);
    }
    throw error;
  }
};

// دالة لإدارة memory leaks
export const createCleanupManager = () => {
  const cleanupTasks: (() => void)[] = [];
  
  return {
    add: (cleanup: () => void) => {
      cleanupTasks.push(cleanup);
    },
    
    cleanup: () => {
      cleanupTasks.forEach(task => {
        try {
          task();
        } catch (error) {
          console.warn('Cleanup task failed:', error);
        }
      });
      cleanupTasks.length = 0;
    }
  };
};

// دالة لتحسين معالجة الأخطاء
export const withErrorBoundary = <T extends (...args: any[]) => any>(
  func: T,
  fallback?: () => void
): T => {
  return ((...args: Parameters<T>) => {
    try {
      return func(...args);
    } catch (error) {
      console.error('Function execution failed:', error);
      if (fallback) {
        fallback();
      }
      return null;
    }
  }) as T;
};

// دالة لمراقبة الأداء
export const performanceMonitor = {
  start: (label: string) => {
    performance.mark(`${label}-start`);
  },
  
  end: (label: string) => {
    performance.mark(`${label}-end`);
    performance.measure(label, `${label}-start`, `${label}-end`);
    
    const measure = performance.getEntriesByName(label)[0];
    console.log(`⏱️ ${label}: ${measure.duration.toFixed(2)}ms`);
    
    // تنظيف العلامات
    performance.clearMarks(`${label}-start`);
    performance.clearMarks(`${label}-end`);
    performance.clearMeasures(label);
  }
};