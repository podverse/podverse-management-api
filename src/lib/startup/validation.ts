import { isValidUUID, ValidationResult, ValidationSummary, validateRequired, validateOptional } from 'podverse-helpers';

/**
 * Validates critical environment variables and configuration at application startup.
 * This function runs early in the initialization process to catch configuration errors
 * before the application attempts to start serving requests.
 * 
 * @throws Error if any critical validation fails
 */
export const validateStartupRequirements = (): void => {
  console.log('Running startup validation...');

  const summary = validateAllEnvironmentVariables();
  displayValidationResults(summary);
  
  if (summary.requiredMissing > 0) {
    const errorMessage = `FATAL: ${summary.requiredMissing} required environment variable(s) are missing or invalid. Please check the validation output above for details.`;
    console.error(errorMessage);
    // Throw error - stack trace will be suppressed in index.ts for validation errors
    throw new Error(errorMessage);
  }

  console.log('Startup validation completed successfully');
};

/**
 * Validates all environment variables and returns a comprehensive summary
 */
const validateAllEnvironmentVariables = (): ValidationSummary => {
  const results: ValidationResult[] = [];
  
  // Auth & Security
  results.push(validateJwtSecret());
  results.push(validateUserAgent());

  // Database
  results.push(validateRequired('DB_HOST', 'Database'));
  results.push(validateRequired('DB_PORT', 'Database'));
  results.push(validateRequired('DB_READ_USERNAME', 'Database'));
  results.push(validateRequired('DB_READ_PASSWORD', 'Database'));
  results.push(validateRequired('DB_READ_WRITE_USERNAME', 'Database'));
  results.push(validateRequired('DB_READ_WRITE_PASSWORD', 'Database'));
  results.push(validateRequired('DB_DATABASE', 'Database'));
  results.push(validateOptional('DB_SSL_CONNECTION', 'Database'));

  // API Configuration
  results.push(validateRequired('API_PORT', 'API'));
  results.push(validateRequired('API_PREFIX', 'API'));
  results.push(validateRequired('API_VERSION', 'API'));
  results.push(validateRequired('COOKIE_DOMAIN', 'API'));
  results.push(validateRequired('API_ALLOWED_CORS_ORIGINS', 'API'));

  // Web
  results.push(validateRequired('WEB_PROTOCOL', 'Web'));
  results.push(validateRequired('WEB_DOMAIN', 'Web'));

  // General
  results.push(validateOptional('NODE_ENV', 'General'));
  results.push(validateOptional('LOG_LEVEL', 'General'));

  // Calculate summary
  const total = results.length;
  const passed = results.filter(r => r.isValid && r.isSet).length;
  const failed = results.filter(r => !r.isValid).length;
  const requiredMissing = results.filter(r => r.isRequired && !r.isValid).length;
  const skipped = results.filter(r => !r.isRequired && !r.isSet).length;

  return {
    total,
    passed,
    failed,
    requiredMissing,
    skipped,
    results
  };
};

/**
 * Validates the AUTH_JWT_SECRET environment variable.
 * The JWT secret MUST be a valid UUID to ensure secure token generation.
 */
const validateJwtSecret = (): ValidationResult => {
  const jwtSecret = process.env.AUTH_JWT_SECRET || '';

  if (!jwtSecret) {
    return {
      name: 'AUTH_JWT_SECRET',
      isSet: false,
      isValid: false,
      isRequired: true,
      message: 'Missing - must be a valid UUID',
      category: 'Auth & Security'
    };
  }

  if (!isValidUUID(jwtSecret)) {
    return {
      name: 'AUTH_JWT_SECRET',
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Invalid UUID format: "${jwtSecret}"`,
      category: 'Auth & Security'
    };
  }

  return {
    name: 'AUTH_JWT_SECRET',
    isSet: true,
    isValid: true,
    isRequired: true,
    message: 'Valid UUID',
    category: 'Auth & Security'
  };
};

/**
 * Validates the USER_AGENT environment variable.
 * The User-Agent MUST follow the format: BrandName Environment/AppName/Version
 * Example: "Podverse Bot Local/Management-API/5"
 */
const validateUserAgent = (): ValidationResult => {
  const userAgent = process.env.USER_AGENT || '';
  const USER_AGENT_PATTERN = /^[^/]+\/[^/]+\/[^/]+$/;

  if (!userAgent) {
    return {
      name: 'USER_AGENT',
      isSet: false,
      isValid: false,
      isRequired: true,
      message: 'Missing - must follow format: BrandName Bot Environment/AppName/Version',
      category: 'Auth & Security'
    };
  }

  const trimmedUserAgent = userAgent.trim();
  
  if (!USER_AGENT_PATTERN.test(trimmedUserAgent)) {
    return {
      name: 'USER_AGENT',
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Invalid format: "${userAgent}" - must follow format: BrandName Bot Environment/AppName/Version`,
      category: 'Auth & Security'
    };
  }

  // Check that "Bot" is included in the first part (before the first slash)
  const parts = trimmedUserAgent.split('/');
  if (parts.length > 0 && !parts[0].includes('Bot')) {
    return {
      name: 'USER_AGENT',
      isSet: true,
      isValid: false,
      isRequired: true,
      message: `Missing "Bot" in first part: "${userAgent}"`,
      category: 'Auth & Security'
    };
  }

  return {
    name: 'USER_AGENT',
    isSet: true,
    isValid: true,
    isRequired: true,
    message: 'Valid format',
    category: 'Auth & Security'
  };
};

/**
 * Displays validation results in a formatted table
 */
const displayValidationResults = (summary: ValidationSummary): void => {
  console.log('=== Environment Variable Validation ===');
  
  // Group results by category
  const byCategory = summary.results.reduce((acc, result) => {
    if (!acc[result.category]) {
      acc[result.category] = [];
    }
    acc[result.category].push(result);
    return acc;
  }, {} as Record<string, ValidationResult[]>);

  // Display by category
  const categories = Object.keys(byCategory).sort();
  for (const category of categories) {
    console.log(`[${category}]`);
    for (const result of byCategory[category]) {
      const status = result.isValid ? '✓' : '✗';
      const requiredText = result.isRequired ? '' : ' (optional)';
      const logMessage = `  ${status} ${result.name}${requiredText} - ${result.message}`;
      // Log failures as errors, skipped optional vars as warn, passes as info
      if (!result.isValid) {
        console.error(logMessage);
      } else if (!result.isSet && !result.isRequired) {
        console.warn(logMessage);
      } else {
        console.log(logMessage);
      }
    }
  }

  // Display summary
  console.log('=== Validation Summary ===');
  console.log(`Total: ${summary.total}`);
  console.log(`Passed: ${summary.passed}`);
  if (summary.skipped > 0) {
    console.warn(`Skipped: ${summary.skipped}`);
  }
  console.log(`Failed: ${summary.failed}`);
  console.log(`Required Missing: ${summary.requiredMissing}`);
  
  if (summary.requiredMissing > 0) {
    console.error('The following required environment variables are missing or invalid:');
    summary.results
      .filter(r => r.isRequired && !r.isValid)
      .forEach(r => {
        console.error(`  - ${r.name}: ${r.message}`);
      });
  }
};
