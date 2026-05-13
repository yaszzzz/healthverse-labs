import { fitness_v1, google } from 'googleapis';
import { createOAuth2Client } from '@/lib/utils/oauth-client';
import { logger } from '@/lib/utils/logger';

interface FitTokens {
    accessToken: string;
    refreshToken?: string;
}

interface DayMetrics {
    steps?: number;
    heartRate?: {
        average: number;
        min: number;
        max: number;
        readings: number;
    };
    calories?: number;
    distance?: number;
    activeMinutes?: number;
}

interface FormattedDayData {
    date: string;
    timestamp: number;
    day: number;
    metrics: DayMetrics;
}

interface FitPointValue {
    intVal?: number | null;
    fpVal?: number | null;
}

interface FitPoint {
    value?: FitPointValue[] | null;
}

interface FitDataset {
    dataSourceId?: string | null;
    point?: FitPoint[] | null;
}

interface FitBucket {
    startTimeMillis?: string | null;
    dataset?: FitDataset[] | null;
}

interface FitAggregateResponse {
    bucket?: FitBucket[] | null;
}

export class FitDataService {
    private fitnessScopes = [
        'https://www.googleapis.com/auth/fitness.activity.read',
        'https://www.googleapis.com/auth/fitness.heart_rate.read',
        'https://www.googleapis.com/auth/fitness.body.read',
    ];

    /**
     * Get fitness data from Google Fit
     */
    async getFitnessData(tokens: FitTokens, days = 7): Promise<FormattedDayData[]> {
        if (!tokens?.accessToken) {
            throw new Error('No valid OAuth tokens found');
        }

        const oauth2Client = createOAuth2Client(tokens);

        // Verify token is still valid
        try {
            await oauth2Client.getAccessToken();
        } catch {
            logger.warn('Google Fit token invalid or expired');
            throw new Error('Google Fit session expired. Please re-authenticate.');
        }

        const fitness = google.fitness({ version: 'v1', auth: oauth2Client });

        const validatedDays = Math.max(1, Math.min(30, days));
        const now = Date.now();
        const startTime = now - validatedDays * 24 * 60 * 60 * 1000;

        logger.debug('Fetching Google Fit data', {
            days: validatedDays,
            startTime: new Date(startTime).toISOString(),
            endTime: new Date(now).toISOString(),
        });

        const aggregateParams: fitness_v1.Params$Resource$Users$Dataset$Aggregate = {
            userId: 'me',
            requestBody: {
                aggregateBy: [
                    { dataTypeName: 'com.google.step_count.delta' },
                    { dataTypeName: 'com.google.heart_rate.bpm' },
                    { dataTypeName: 'com.google.calories.expended' },
                    { dataTypeName: 'com.google.distance.delta' },
                    { dataTypeName: 'com.google.active_minutes' },
                ],
                bucketByTime: { durationMillis: '86400000' },
                startTimeMillis: String(startTime),
                endTimeMillis: String(now),
            },
        };

        const response = await fitness.users.dataset.aggregate(aggregateParams);

        const formattedData = this.formatFitnessData(response.data, validatedDays);

        logger.info('Google Fit data fetched successfully', {
            days: validatedDays,
            dataPoints: formattedData.length,
        });

        return formattedData;
    }

    /**
     * Format raw Google Fit data into structured format
     */
    private formatFitnessData(rawData: FitAggregateResponse, days: number): FormattedDayData[] {
        if (!rawData?.bucket) {
            return [];
        }

        const formattedData = rawData.bucket.map((bucket, index) => {
            const timestamp = Number(bucket.startTimeMillis || 0);
            const dayData: FormattedDayData = {
                date: new Date(timestamp).toISOString().split('T')[0],
                timestamp,
                day: days - index,
                metrics: {},
            };

            // Extract step count
            const stepsDataset = bucket.dataset?.find((dataset) =>
                dataset.dataSourceId?.includes('step_count')
            );
            const stepsPoint = stepsDataset?.point?.[0];
            if (stepsPoint) {
                dayData.metrics.steps = stepsPoint.value?.[0]?.intVal || 0;
            }

            // Extract heart rate data
            const heartRateDataset = bucket.dataset?.find((dataset) =>
                dataset.dataSourceId?.includes('heart_rate')
            );
            if (heartRateDataset?.point?.length) {
                const heartRateValues = heartRateDataset.point
                    .map((point) => point.value?.[0]?.fpVal)
                    .filter((value): value is number => value !== undefined && value !== null);

                if (heartRateValues.length > 0) {
                dayData.metrics.heartRate = {
                    average: heartRateValues.reduce((a: number, b: number) => a + b, 0) / heartRateValues.length,
                    min: Math.min(...heartRateValues),
                    max: Math.max(...heartRateValues),
                    readings: heartRateValues.length,
                };
                }
            }

            // Extract calories
            const caloriesDataset = bucket.dataset?.find((dataset) =>
                dataset.dataSourceId?.includes('calories')
            );
            const caloriesPoint = caloriesDataset?.point?.[0];
            if (caloriesPoint) {
                dayData.metrics.calories = caloriesPoint.value?.[0]?.fpVal || 0;
            }

            // Extract distance
            const distanceDataset = bucket.dataset?.find((dataset) =>
                dataset.dataSourceId?.includes('distance')
            );
            const distancePoint = distanceDataset?.point?.[0];
            if (distancePoint) {
                dayData.metrics.distance = distancePoint.value?.[0]?.fpVal || 0;
            }

            // Extract active minutes
            const activityDataset = bucket.dataset?.find((dataset) =>
                dataset.dataSourceId?.includes('active_minutes')
            );
            const activityPoint = activityDataset?.point?.[0];
            if (activityPoint) {
                dayData.metrics.activeMinutes = activityPoint.value?.[0]?.intVal || 0;
            }

            return dayData;
        });

        return formattedData.sort((a: FormattedDayData, b: FormattedDayData) => b.timestamp - a.timestamp);
    }

    /**
     * Get fitness data summary (aggregated stats)
     */
    async getFitnessSummary(tokens: FitTokens, days = 7) {
        const fitnessData = await this.getFitnessData(tokens, days);

        if (fitnessData.length === 0) {
            return {
                period: `${days} days`,
                summary: {},
                message: 'No fitness data available for the specified period',
            };
        }

        const summary = {
            steps: this.calculateSummary(fitnessData, 'steps'),
            calories: this.calculateSummary(fitnessData, 'calories'),
            distance: this.calculateSummary(fitnessData, 'distance'),
            activeMinutes: this.calculateSummary(fitnessData, 'activeMinutes'),
            heartRate: this.calculateHeartRateSummary(fitnessData),
        };

        return {
            period: `${days} days`,
            summary,
            dataPoints: fitnessData.length,
        };
    }

    /**
     * Calculate summary statistics for a metric
     */
    private calculateSummary(data: FormattedDayData[], metric: keyof DayMetrics) {
        const values = data
            .map((day) => day.metrics[metric] as number | undefined)
            .filter((value): value is number => value !== undefined && value !== null);

        if (values.length === 0) return null;

        return {
            total: values.reduce((sum, value) => sum + value, 0),
            average: values.reduce((sum, value) => sum + value, 0) / values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            daysWithData: values.length,
        };
    }

    /**
     * Calculate heart rate summary
     */
    private calculateHeartRateSummary(data: FormattedDayData[]) {
        const allHeartRates = data
            .map((day) => day.metrics.heartRate)
            .filter((hr): hr is NonNullable<typeof hr> => hr !== undefined)
            .flatMap((hr) => Array(hr.readings).fill(hr.average));

        if (allHeartRates.length === 0) return null;

        return {
            average: allHeartRates.reduce((sum: number, hr: number) => sum + hr, 0) / allHeartRates.length,
            min: Math.min(...allHeartRates),
            max: Math.max(...allHeartRates),
            readings: allHeartRates.length,
        };
    }
}

export const fitDataService = new FitDataService();
export default fitDataService;
