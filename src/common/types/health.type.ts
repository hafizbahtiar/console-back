/**
 * Health Status Types
 * 
 * Defines the types used for health check endpoints
 */

export interface DatabaseHealth {
  healthy: boolean;
  status: 'connected' | 'disconnected' | 'error';
  name: string;
  host: string;
}

export interface RedisHealth {
  healthy: boolean;
  connected: boolean;
  status: string;
  host?: string;
  port?: number;
}

export interface ServiceHealth {
  database: DatabaseHealth;
  redis: RedisHealth;
}

export type HealthStatus = 
  | ({
      status: 'healthy';
      timestamp: string;
      uptime: number;
      environment: string;
      version: string;
      services: ServiceHealth;
      responseTime: number;
    })
  | ({
      status: 'degraded';
      timestamp: string;
      uptime: number;
      environment: string;
      version: string;
      services: ServiceHealth;
      responseTime: number;
    })
  | ({
      status: 'unhealthy';
      timestamp: string;
      uptime: number;
      environment: string;
      version: string;
      services: ServiceHealth;
      responseTime: number;
      error: string;
    });
