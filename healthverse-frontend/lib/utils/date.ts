/**
 * Date utilities for health data
 */
export const formatHealthDate = (date = new Date()): string => {
    // Returns date in YYYY-MM-DD format for daily health data
    return new Date(date).toISOString().split('T')[0];
};

export const parseHealthDate = (dateString: string): Date => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
    }
    return date;
};

export const getDateRange = (period = 'week') => {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
        case 'day':
            startDate.setDate(endDate.getDate() - 1);
            break;
        case 'week':
            startDate.setDate(endDate.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        case 'year':
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        default:
            startDate.setDate(endDate.getDate() - 7);
    }

    return {
        startDate: formatHealthDate(startDate),
        endDate: formatHealthDate(endDate),
    };
};

export const DATE_FORMATS = {
    ISO: 'YYYY-MM-DD',
    DISPLAY: 'DD/MM/YYYY',
    DATABASE: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
};
