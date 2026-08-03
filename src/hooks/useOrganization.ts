import { useState, useEffect } from 'react';
import api from '../lib/api';

// Helper to convert snake_case object to camelCase
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce(
      (result, key) => {
        const camelKey = key.replace(/_([a-z])/g, g => g[1].toUpperCase());
        result[camelKey] = toCamelCase(obj[key]);
        return result;
      },
      {} as any
    );
  }
  return obj;
};

export const useOrganizationMetrics = () => {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setLoading(true);
        // By default fetch up to 100 recent metrics
        const data = await api.organization.getHistory({ limit: 100 });
        
        // Convert to camelCase so existing UI components don't break
        const mappedData = data.map(toCamelCase).map((item: any) => ({
          ...item,
          // Handle specific conversions if needed, like string to float for UI
          revenue: parseFloat(item.revenue),
          operatingCost: parseFloat(item.operatingCost),
          ebitda: parseFloat(item.ebitda),
          netProfit: parseFloat(item.netProfit),
          csat: parseFloat(item.csat)
        }));
        
        setMetrics(mappedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch organization metrics'));
        console.error("Error fetching organization metrics:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, []);

  return { metrics, loading, error };
};

export const useOrganizationScenarios = () => {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setLoading(true);
        const data = await api.organization.getScenarios({ limit: 100 });
        
        // Convert to camelCase to match the mock data structure
        const mappedData = data.map(toCamelCase).map((item: any) => ({
          ...item,
          // Map backend field names to the mock data format expected by UI
          scenarioName: item.scenarioName,
          targetMetric: item.targetMetric,
          predictedImpactPercentage: parseFloat(item.predictedImpactPercentage),
          predictedCostSavings: 0, // Fallback since it's not in DB
          predictedROI: parseFloat(item.predictedRoi),
          confidenceLevel: item.confidenceLevel,
          timeToRealizeMonths: item.timeToImpactMonths, // Map to what UI expects
          status: item.aiRecommendation.replace('Status: ', '') // Extract status
        }));
        
        setScenarios(mappedData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch organization scenarios'));
        console.error("Error fetching organization scenarios:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchScenarios();
  }, []);

  return { scenarios, loading, error };
};
