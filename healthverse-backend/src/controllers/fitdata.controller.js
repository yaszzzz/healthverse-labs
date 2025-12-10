import { fitDataService } from '../services/fitdata.service.js';
import { ApiResponse, asyncHandler } from '../utils/response.js';
import { ValidationError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

export const getFitData = asyncHandler(async (req, res) => {
  const { days = 7, summary = false } = req.query;
  
  // Validate days parameter
  const validatedDays = parseInt(days);
  if (isNaN(validatedDays) || validatedDays < 1 || validatedDays > 30) {
    throw new ValidationError('Days must be a number between 1 and 30');
  }

  logger.debug('Fetching fitness data', {
    userId: req.user?.id,
    days: validatedDays,
    summary: summary === 'true'
  });

  let result;
  
  if (summary === 'true') {
    // Get aggregated summary
    result = await fitDataService.getFitnessSummary(req.session.tokens, validatedDays);
  } else {
    // Get detailed data
    result = await fitDataService.getFitnessData(req.session.tokens, validatedDays);
  }

  ApiResponse.success(res, result, 'Fitness data fetched successfully');
});

export const getFitDataSummary = asyncHandler(async (req, res) => {
  const { days = 7 } = req.query;
  
  const validatedDays = parseInt(days);
  if (isNaN(validatedDays) || validatedDays < 1 || validatedDays > 30) {
    throw new ValidationError('Days must be a number between 1 and 30');
  }

  logger.debug('Fetching fitness data summary', {
    userId: req.user?.id,
    days: validatedDays
  });

  const result = await fitDataService.getFitnessSummary(req.session.tokens, validatedDays);

  ApiResponse.success(res, result, 'Fitness summary fetched successfully');
});