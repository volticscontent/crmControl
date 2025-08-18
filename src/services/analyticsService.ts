import { logger } from '../utils/logger';
import { database } from '../database/connection';

export interface MetricEvent {
  id?: string;
  timestamp: Date;
  type: 'success' | 'error' | 'warning' | 'info';
  category: 'webhook' | 'evolution_api' | 'monday_api' | 'database' | 'system';
  operation: string;
  details: any;
  duration?: number;
  error_code?: string;
  error_message?: string;
}

export interface Analytics {
  total_events: number;
  success_rate: number;
  error_rate: number;
  categories: Record<string, number>;
  operations: Record<string, number>;
  recent_errors: MetricEvent[];
  hourly_stats: Array<{
    hour: string;
    success: number;
    error: number;
    total: number;
  }>;
}

class AnalyticsService {
  
  async initialize(): Promise<void> {
    try {
      // Criação da tabela principal
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS analytics_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
          type TEXT NOT NULL,
          category TEXT NOT NULL,
          operation TEXT NOT NULL,
          details TEXT,
          duration INTEGER,
          error_code TEXT,
          error_message TEXT
        )
      `;
      
      await database.run(createTableSQL);
      logger.info('📊 Analytics table created successfully');
      
      // Criação dos índices
      await database.run('CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_events(timestamp)');
      await database.run('CREATE INDEX IF NOT EXISTS idx_analytics_type ON analytics_events(type)');
      await database.run('CREATE INDEX IF NOT EXISTS idx_analytics_category ON analytics_events(category)');
      
      // Teste de inserção para verificar se a tabela foi criada
      await database.run(`
        INSERT INTO analytics_events (type, category, operation, details) 
        VALUES ('info', 'system', 'analytics_initialized', '{"message": "Analytics system started"}')
      `);
      
      logger.info('📊 Analytics Service initialized and tested successfully');
    } catch (error) {
      logger.error('Failed to initialize analytics service:', error);
      throw error; // Re-throw para que o erro apareça no startup
    }
  }

  async trackEvent(event: Omit<MetricEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const eventData: MetricEvent = {
        ...event,
        timestamp: new Date()
      };

      await database.run(`
        INSERT INTO analytics_events (
          type, category, operation, details, duration, error_code, error_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        eventData.type,
        eventData.category,
        eventData.operation,
        JSON.stringify(eventData.details),
        eventData.duration || null,
        eventData.error_code || null,
        eventData.error_message || null
      ]);

      // Log crítico para erros
      if (eventData.type === 'error') {
        logger.error(`📊 ${eventData.category.toUpperCase()} ERROR: ${eventData.operation}`, {
          error_code: eventData.error_code,
          error_message: eventData.error_message,
          details: eventData.details
        });
      }
    } catch (error) {
      logger.error('Failed to track analytics event:', error);
    }
  }

  async getAnalytics(hours: number = 24): Promise<Analytics> {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);
      
      // Total events
      const totalResult = await database.get(
        'SELECT COUNT(*) as total FROM analytics_events WHERE timestamp >= ?',
        [since.toISOString()]
      );
      const total_events = totalResult?.total || 0;

      // Success/Error rates
      const successResult = await database.get(
        'SELECT COUNT(*) as success FROM analytics_events WHERE timestamp >= ? AND type = ?',
        [since.toISOString(), 'success']
      );
      const errorResult = await database.get(
        'SELECT COUNT(*) as errors FROM analytics_events WHERE timestamp >= ? AND type = ?',
        [since.toISOString(), 'error']
      );
      
      const success_count = successResult?.success || 0;
      const error_count = errorResult?.errors || 0;
      const success_rate = total_events > 0 ? (success_count / total_events) * 100 : 0;
      const error_rate = total_events > 0 ? (error_count / total_events) * 100 : 0;

      // Categories breakdown
      const categoriesResult = await database.all(
        'SELECT category, COUNT(*) as count FROM analytics_events WHERE timestamp >= ? GROUP BY category',
        [since.toISOString()]
      );
      const categories: Record<string, number> = {};
      categoriesResult?.forEach((row: any) => {
        categories[row.category] = row.count;
      });

      // Operations breakdown
      const operationsResult = await database.all(
        'SELECT operation, COUNT(*) as count FROM analytics_events WHERE timestamp >= ? GROUP BY operation ORDER BY count DESC LIMIT 10',
        [since.toISOString()]
      );
      const operations: Record<string, number> = {};
      operationsResult?.forEach((row: any) => {
        operations[row.operation] = row.count;
      });

      // Recent errors
      const recentErrorsResult = await database.all(
        'SELECT * FROM analytics_events WHERE timestamp >= ? AND type = "error" ORDER BY timestamp DESC LIMIT 20',
        [since.toISOString()]
      );
      const recent_errors: MetricEvent[] = recentErrorsResult?.map((row: any) => ({
        id: row.id,
        timestamp: new Date(row.timestamp),
        type: row.type,
        category: row.category,
        operation: row.operation,
        details: JSON.parse(row.details || '{}'),
        duration: row.duration,
        error_code: row.error_code,
        error_message: row.error_message
      })) || [];

      // Hourly stats
      const hourlyResult = await database.all(`
        SELECT 
          strftime('%Y-%m-%d %H:00', timestamp) as hour,
          SUM(CASE WHEN type = 'success' THEN 1 ELSE 0 END) as success,
          SUM(CASE WHEN type = 'error' THEN 1 ELSE 0 END) as error,
          COUNT(*) as total
        FROM analytics_events 
        WHERE timestamp >= ? 
        GROUP BY hour 
        ORDER BY hour DESC 
        LIMIT 24
      `, [since.toISOString()]);
      
      const hourly_stats = hourlyResult?.map((row: any) => ({
        hour: row.hour,
        success: row.success,
        error: row.error,
        total: row.total
      })) || [];

      return {
        total_events,
        success_rate: Math.round(success_rate * 100) / 100,
        error_rate: Math.round(error_rate * 100) / 100,
        categories,
        operations,
        recent_errors,
        hourly_stats
      };
    } catch (error) {
      logger.error('Failed to get analytics:', error);
      return {
        total_events: 0,
        success_rate: 0,
        error_rate: 0,
        categories: {},
        operations: {},
        recent_errors: [],
        hourly_stats: []
      };
    }
  }

  async getSystemHealth(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    metrics: Record<string, any>;
    issues: string[];
  }> {
    try {
      const analytics = await this.getAnalytics(1); // Last hour
      const issues: string[] = [];
      let status: 'healthy' | 'warning' | 'critical' = 'healthy';

      // Check error rate
      if (analytics.error_rate > 50) {
        status = 'critical';
        issues.push(`Taxa de erro muito alta: ${analytics.error_rate}%`);
      } else if (analytics.error_rate > 20) {
        status = 'warning';
        issues.push(`Taxa de erro elevada: ${analytics.error_rate}%`);
      }

      // Check recent errors
      const criticalErrors = analytics.recent_errors.filter(e => 
        e.category === 'evolution_api' || e.category === 'monday_api'
      );
      
      if (criticalErrors.length > 5) {
        status = 'critical';
        issues.push(`Muitos erros críticos recentes: ${criticalErrors.length}`);
      }

      // Check activity
      if (analytics.total_events === 0) {
        status = 'warning';
        issues.push('Nenhuma atividade detectada na última hora');
      }

      return {
        status,
        metrics: {
          total_events: analytics.total_events,
          success_rate: analytics.success_rate,
          error_rate: analytics.error_rate,
          critical_errors: criticalErrors.length
        },
        issues
      };
    } catch (error) {
      logger.error('Failed to get system health:', error);
      return {
        status: 'critical',
        metrics: {},
        issues: ['Falha ao verificar saúde do sistema']
      };
    }
  }

  // Wrapper para facilitar o tracking de operações
  async trackOperation<T>(
    category: MetricEvent['category'],
    operation: string,
    fn: () => Promise<T>,
    details?: any
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      await this.trackEvent({
        type: 'success',
        category,
        operation,
        details: { ...details, result_type: typeof result },
        duration
      });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      await this.trackEvent({
        type: 'error',
        category,
        operation,
        details,
        duration,
        error_code: (error as any)?.code || 'UNKNOWN',
        error_message: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
}

export const analyticsService = new AnalyticsService();

