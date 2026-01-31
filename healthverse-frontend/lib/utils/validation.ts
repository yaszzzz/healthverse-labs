import { HEALTH_METRICS, HEALTH_RANGES, ERROR_MESSAGES } from './constants';

interface HealthData {
    [key: string]: number | undefined;
}

/**
 * Validate a single health metric against defined ranges
 */
export const validateHealthMetric = (metric: string, value: number | undefined | null): boolean => {
    if (value === null || value === undefined) return true; // Allow null/undefined for optional fields

    const numValue = Number(value);
    if (isNaN(numValue)) return false;

    switch (metric) {
        case HEALTH_METRICS.STEPS:
            return numValue >= HEALTH_RANGES.STEPS.MIN && numValue <= HEALTH_RANGES.STEPS.MAX;

        case HEALTH_METRICS.CALORIES:
            return numValue >= HEALTH_RANGES.CALORIES.MIN && numValue <= HEALTH_RANGES.CALORIES.MAX;

        case HEALTH_METRICS.BPM_AVG:
        case HEALTH_METRICS.BPM_MIN:
        case HEALTH_METRICS.BPM_MAX:
            return numValue >= HEALTH_RANGES.HEART_RATE.MIN && numValue <= HEALTH_RANGES.HEART_RATE.MAX;

        default:
            return false;
    }
};

/**
 * Validate entire health data object
 */
export const validateHealthData = (data: HealthData) => {
    const errors: string[] = [];
    const validatedData: HealthData = {};

    // Validate each provided metric
    for (const [metric, value] of Object.entries(data)) {
        if (Object.values(HEALTH_METRICS).includes(metric)) {
            if (!validateHealthMetric(metric, value)) {
                errors.push(`Invalid value for ${metric}: ${value}`);
            } else if (value !== undefined) {
                validatedData[metric] = Number(value);
            }
        }
    }

    // At least one metric must be provided
    if (Object.keys(validatedData).length === 0) {
        errors.push(ERROR_MESSAGES.INVALID_HEALTH_METRIC || 'Invalid health metrics');
    }

    // Validate BPM consistency if multiple BPM fields provided
    if (validatedData.bpmMin && validatedData.bpmMax && validatedData.bpmAvg) {
        if (validatedData.bpmMin > validatedData.bpmMax) {
            errors.push('bpmMin cannot be greater than bpmMax');
        }
        if (validatedData.bpmAvg < validatedData.bpmMin || validatedData.bpmAvg > validatedData.bpmMax) {
            errors.push('bpmAvg must be between bpmMin and bpmMax');
        }
    }

    return {
        isValid: errors.length === 0,
        data: validatedData,
        errors,
    };
};

/**
 * Sanitize email input
 */
export const sanitizeEmail = (email: string | null | undefined): string | null => {
    if (!email) return null;
    return email.toLowerCase().trim();
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: unknown, maxLength = 255): string => {
    if (typeof input !== 'string') return '';

    return input
        .slice(0, maxLength)
        .replace(/[<>]/g, '') // Basic XSS protection
        .trim();
};

/**
 * Validate Ethereum wallet address
 */
export const validateWalletAddress = (address: string): boolean => {
    if (!address) return false;
    // Basic Ethereum address validation
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};
