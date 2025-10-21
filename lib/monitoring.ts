/**
 * Monitoring and Logging Utilities
 *
 * Provides logging for database operations, query performance,
 * and egress tracking to identify optimization opportunities.
 */

interface QueryLog {
  operation: string;
  table: string;
  columns: string[];
  recordCount: number;
  timestamp: Date;
  duration: number;
  error?: string;
}

interface EgressStats {
  totalQueries: number;
  totalRecords: number;
  estimatedBytes: number;
  heavyQueries: QueryLog[];
}

class MonitoringService {
  private queryLogs: QueryLog[] = [];
  private readonly MAX_LOGS = 100;
  private readonly HEAVY_QUERY_THRESHOLD = 100; // records

  /**
   * Log a database query
   */
  logQuery(log: Omit<QueryLog, 'timestamp'>): void {
    const entry: QueryLog = {
      ...log,
      timestamp: new Date()
    };

    this.queryLogs.push(entry);

    // Keep only recent logs
    if (this.queryLogs.length > this.MAX_LOGS) {
      this.queryLogs.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const emoji = entry.error ? '❌' : entry.recordCount > this.HEAVY_QUERY_THRESHOLD ? '⚠️' : '✅';
      console.log(
        `${emoji} [${entry.operation}] ${entry.table}`,
        `| Columns: ${entry.columns.length}`,
        `| Records: ${entry.recordCount}`,
        `| Time: ${entry.duration}ms`
      );

      if (entry.error) {
        console.error('  Error:', entry.error);
      }

      if (entry.recordCount > this.HEAVY_QUERY_THRESHOLD) {
        console.warn('  ⚠️ Heavy query detected! Consider pagination or filtering.');
      }
    }
  }

  /**
   * Get egress statistics
   */
  getEgressStats(): EgressStats {
    const heavyQueries = this.queryLogs
      .filter(log => log.recordCount > this.HEAVY_QUERY_THRESHOLD)
      .sort((a, b) => b.recordCount - a.recordCount)
      .slice(0, 10);

    // Estimate bytes (rough approximation)
    const estimatedBytes = this.queryLogs.reduce((total, log) => {
      // Assume average 1KB per record for form data
      const recordSize = log.table === 'forms' ? 1024 : 256;
      return total + (log.recordCount * recordSize);
    }, 0);

    return {
      totalQueries: this.queryLogs.length,
      totalRecords: this.queryLogs.reduce((sum, log) => sum + log.recordCount, 0),
      estimatedBytes,
      heavyQueries
    };
  }

  /**
   * Print egress report to console
   */
  printEgressReport(): void {
    const stats = this.getEgressStats();

    console.log('\n' + '='.repeat(60));
    console.log('📊 EGRESS STATISTICS REPORT');
    console.log('='.repeat(60));
    console.log(`Total Queries: ${stats.totalQueries}`);
    console.log(`Total Records: ${stats.totalRecords}`);
    console.log(`Estimated Data Transfer: ${(stats.estimatedBytes / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Heavy Queries: ${stats.heavyQueries.length}`);

    if (stats.heavyQueries.length > 0) {
      console.log('\n⚠️ TOP HEAVY QUERIES:');
      stats.heavyQueries.forEach((query, i) => {
        console.log(
          `  ${i + 1}. ${query.operation} ${query.table}`,
          `- ${query.recordCount} records`,
          `- ${query.columns.length} columns`,
          `- ${query.duration}ms`
        );
      });

      console.log('\n💡 Optimization Tips:');
      console.log('  • Add pagination with .limit() and .range()');
      console.log('  • Select only needed columns instead of *');
      console.log('  • Add filters with .eq(), .gt(), .lt()');
      console.log('  • Consider caching frequently accessed data');
    }

    console.log('='.repeat(60) + '\n');
  }

  /**
   * Clear query logs
   */
  clearLogs(): void {
    this.queryLogs = [];
    console.log('✅ Query logs cleared');
  }

  /**
   * Get recent query logs
   */
  getRecentLogs(limit: number = 20): QueryLog[] {
    return this.queryLogs.slice(-limit);
  }
}

// Singleton instance
export const monitoring = new MonitoringService();

/**
 * Wrap a Supabase query with monitoring
 *
 * Usage:
 *   const result = await monitorQuery(
 *     'getForms',
 *     'forms',
 *     ['id', 'status', 'created_at'],
 *     async () => {
 *       const { data, error } = await supabase
 *         .from('forms')
 *         .select('id, status, created_at');
 *       return { data, error };
 *     }
 *   );
 */
export async function monitorQuery<T>(
  operation: string,
  table: string,
  columns: string[],
  queryFn: () => Promise<{ data: T[] | null; error: any }>
): Promise<{ data: T[] | null; error: any }> {
  const startTime = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    const recordCount = result.data?.length || 0;

    monitoring.logQuery({
      operation,
      table,
      columns,
      recordCount,
      duration,
      error: result.error?.message
    });

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;

    monitoring.logQuery({
      operation,
      table,
      columns,
      recordCount: 0,
      duration,
      error: String(error)
    });

    throw error;
  }
}

/**
 * Storage usage tracking
 */
interface StorageStats {
  totalFiles: number;
  totalSize: number;
  filesByType: Record<string, number>;
  largestFiles: { name: string; size: number }[];
}

/**
 * Get storage usage statistics
 * Note: This requires listing files which may be expensive
 */
export async function getStorageStats(bucket: string): Promise<StorageStats | null> {
  try {
    console.log(`📦 Analyzing storage bucket: ${bucket}...`);

    // This is a placeholder - actual implementation would require
    // iterating through storage paths
    console.log('⚠️ Storage stats not yet implemented');
    console.log('💡 Use Supabase Dashboard > Storage to view usage');

    return null;
  } catch (error) {
    console.error('❌ Failed to get storage stats:', error);
    return null;
  }
}

/**
 * User-friendly error messages
 */
export function getUserFriendlyError(error: any): string {
  if (!error) return 'Bir hata oluştu';

  // Network errors
  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    return 'İnternet bağlantınızı kontrol edin';
  }

  // Auth errors
  if (error.message?.includes('auth') || error.message?.includes('JWT')) {
    return 'Oturum süreniz dolmuş. Lütfen tekrar giriş yapın';
  }

  // Permission errors
  if (error.message?.includes('permission') || error.message?.includes('policy')) {
    return 'Bu işlem için yetkiniz bulunmuyor';
  }

  // Not found
  if (error.code === 'PGRST116' || error.message?.includes('not found')) {
    return 'İstenen kayıt bulunamadı';
  }

  // Storage errors
  if (error.message?.includes('storage') || error.message?.includes('bucket')) {
    return 'Dosya yüklenirken bir hata oluştu';
  }

  // Default
  return error.message || 'Beklenmeyen bir hata oluştu';
}

/**
 * Log telemetry event (placeholder for future integration)
 */
export function logTelemetry(event: string, properties?: Record<string, any>): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Telemetry:', event, properties);
  }

  // Future: Send to analytics service (e.g., Plausible, PostHog, etc.)
}

/**
 * Performance timing helper
 */
export class PerformanceTimer {
  private startTime: number;
  private operation: string;

  constructor(operation: string) {
    this.operation = operation;
    this.startTime = Date.now();
    console.time(this.operation);
  }

  end(metadata?: Record<string, any>): number {
    const duration = Date.now() - this.startTime;
    console.timeEnd(this.operation);

    if (metadata) {
      console.log(`  Metadata:`, metadata);
    }

    logTelemetry('performance', {
      operation: this.operation,
      duration,
      ...metadata
    });

    return duration;
  }
}

// Export for browser console access
if (typeof window !== 'undefined') {
  (window as any).monitoring = monitoring;
  console.log('💡 Monitoring tools available via window.monitoring');
  console.log('   • monitoring.getEgressStats()');
  console.log('   • monitoring.printEgressReport()');
  console.log('   • monitoring.clearLogs()');
}
