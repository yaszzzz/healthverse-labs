import { google } from "googleapis";
import { createOAuth2Client } from "../utils/oauthClient.js";
import { AuthenticationError, AppError } from "../middleware/errorHandler.js";
import logger from "../utils/logger.js";

class FitDataService {
  constructor() {
    this.fitnessScopes = [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.heart_rate.read',
      'https://www.googleapis.com/auth/fitness.body.read'
    ];
  }

  /**
   * Get fitness data from Google Fit
   */
  async getFitnessData(tokens, days = 7) {
    try {
      // Validate tokens
      if (!tokens?.access_token) {
        throw new AuthenticationError('No valid OAuth tokens found');
      }

      // Create OAuth client with user tokens
      const oauth2Client = createOAuth2Client(tokens);
      
      // Verify token is still valid
      try {
        await oauth2Client.getAccessToken();
      } catch (tokenError) {
        logger.warn('Google Fit token invalid or expired', tokenError);
        throw new AuthenticationError('Google Fit session expired. Please re-authenticate.');
      }

      const fitness = google.fitness({ version: "v1", auth: oauth2Client });

      // Validate and parse days parameter
      const validatedDays = Math.max(1, Math.min(30, parseInt(days) || 7));
      const now = Date.now();
      const startTime = now - (validatedDays * 24 * 60 * 60 * 1000);

      logger.debug('Fetching Google Fit data', {
        days: validatedDays,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(now).toISOString()
      });

      // Fetch data from Google Fit
      const response = await fitness.users.dataset.aggregate({
        userId: "me",
        requestBody: {
          aggregateBy: [
            { dataTypeName: "com.google.step_count.delta" },
            { dataTypeName: "com.google.heart_rate.bpm" },
            { dataTypeName: "com.google.calories.expended" },
            { dataTypeName: "com.google.distance.delta" },
            { dataTypeName: "com.google.active_minutes" }
          ],
          bucketByTime: { durationMillis: 86400000 }, // Daily buckets
          startTimeMillis: startTime,
          endTimeMillis: now
        }
      });

      // Transform and format the response
      const formattedData = this.formatFitnessData(response.data, validatedDays);

      logger.info('Google Fit data fetched successfully', {
        days: validatedDays,
        dataPoints: formattedData.length,
        dataTypes: Object.keys(formattedData[0]?.metrics || {}).length
      });

      return formattedData;

    } catch (error) {
      logger.error('Failed to fetch Google Fit data', error);
      
      if (error instanceof AuthenticationError) {
        throw error;
      }

      // Handle Google API specific errors
      if (error.code === 403) {
        throw new AppError('Access to Google Fit data denied. Please check permissions.', 403, 'GOOGLE_FIT_ACCESS_DENIED');
      } else if (error.code === 429) {
        throw new AppError('Google Fit API rate limit exceeded. Please try again later.', 429, 'GOOGLE_API_RATE_LIMIT');
      }

      throw new AppError(
        'Failed to fetch fitness data from Google Fit', 
        500, 
        'GOOGLE_FIT_API_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * Format raw Google Fit data into structured format
   */
  formatFitnessData(rawData, days) {
    if (!rawData?.bucket) {
      return [];
    }

    const formattedData = rawData.bucket.map((bucket, index) => {
      const dayData = {
        date: new Date(parseInt(bucket.startTimeMillis)).toISOString().split('T')[0],
        timestamp: parseInt(bucket.startTimeMillis),
        day: days - index, // Day offset from today
        metrics: {}
      };

      // Extract step count
      const stepsDataset = bucket.dataset?.find(d => 
        d.dataSourceId.includes('step_count')
      );
      if (stepsDataset?.point?.length > 0) {
        dayData.metrics.steps = stepsDataset.point[0].value[0].intVal || 0;
      }

      // Extract heart rate data
      const heartRateDataset = bucket.dataset?.find(d => 
        d.dataSourceId.includes('heart_rate')
      );
      if (heartRateDataset?.point?.length > 0) {
        const heartRateValues = heartRateDataset.point.map(p => p.value[0].fpVal);
        dayData.metrics.heartRate = {
          average: heartRateValues.reduce((a, b) => a + b, 0) / heartRateValues.length,
          min: Math.min(...heartRateValues),
          max: Math.max(...heartRateValues),
          readings: heartRateValues.length
        };
      }

      // Extract calories
      const caloriesDataset = bucket.dataset?.find(d => 
        d.dataSourceId.includes('calories')
      );
      if (caloriesDataset?.point?.length > 0) {
        dayData.metrics.calories = caloriesDataset.point[0].value[0].fpVal || 0;
      }

      // Extract distance
      const distanceDataset = bucket.dataset?.find(d => 
        d.dataSourceId.includes('distance')
      );
      if (distanceDataset?.point?.length > 0) {
        dayData.metrics.distance = distanceDataset.point[0].value[0].fpVal || 0;
      }

      // Extract active minutes
      const activityDataset = bucket.dataset?.find(d => 
        d.dataSourceId.includes('active_minutes')
      );
      if (activityDataset?.point?.length > 0) {
        dayData.metrics.activeMinutes = activityDataset.point[0].value[0].intVal || 0;
      }

      return dayData;
    });

    // Sort by date (most recent first)
    return formattedData.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get fitness data summary (aggregated stats)
   */
  async getFitnessSummary(tokens, days = 7) {
    try {
      const fitnessData = await this.getFitnessData(tokens, days);
      
      if (fitnessData.length === 0) {
        return {
          period: `${days} days`,
          summary: {},
          message: 'No fitness data available for the specified period'
        };
      }

      const summary = {
        steps: this.calculateSummary(fitnessData, 'steps'),
        calories: this.calculateSummary(fitnessData, 'calories'),
        distance: this.calculateSummary(fitnessData, 'distance'),
        activeMinutes: this.calculateSummary(fitnessData, 'activeMinutes'),
        heartRate: this.calculateHeartRateSummary(fitnessData)
      };

      logger.debug('Fitness summary generated', {
        days,
        dataPoints: fitnessData.length
      });

      return {
        period: `${days} days`,
        summary,
        dataPoints: fitnessData.length
      };

    } catch (error) {
      logger.error('Failed to generate fitness summary', error);
      throw error;
    }
  }

  /**
   * Calculate summary statistics for a metric
   */
  calculateSummary(data, metric) {
    const values = data
      .map(day => day.metrics[metric])
      .filter(value => value !== undefined && value !== null);

    if (values.length === 0) return null;

    return {
      total: values.reduce((sum, value) => sum + value, 0),
      average: values.reduce((sum, value) => sum + value, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      daysWithData: values.length
    };
  }

  /**
   * Calculate heart rate summary
   */
  calculateHeartRateSummary(data) {
    const allHeartRates = data
      .map(day => day.metrics.heartRate)
      .filter(hr => hr !== undefined)
      .flatMap(hr => Array(hr.readings).fill(hr.average)); // Approximate distribution

    if (allHeartRates.length === 0) return null;

    return {
      average: allHeartRates.reduce((sum, hr) => sum + hr, 0) / allHeartRates.length,
      min: Math.min(...allHeartRates),
      max: Math.max(...allHeartRates),
      readings: allHeartRates.length
    };
  }
}

export const fitDataService = new FitDataService();
export default fitDataService;