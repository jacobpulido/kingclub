/**
 * Standardized system responses for consistent API behavior
 */

export interface SystemResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  warning?: string;
  issues?: string[];
  requiresReview?: boolean;
}

export interface PaginatedResponse<T> extends SystemResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create a success response
 */
export function successResponse<T>(data: T, message?: string): SystemResponse<T> {
  return {
    success: true,
    data,
    ...(message && { warning: message }),
  };
}

/**
 * Create an error response
 */
export function errorResponse(
  message: string,
  issues?: string[]
): SystemResponse<never> {
  return {
    success: false,
    error: message,
    ...(issues && { issues }),
  };
}

/**
 * Create a warning response (partial success)
 */
export function warningResponse<T>(
  data: T,
  message: string,
  issues?: string[]
): SystemResponse<T> {
  return {
    success: true,
    data,
    warning: message,
    ...(issues && { issues }),
    requiresReview: true,
  };
}

/**
 * Create a paginated success response
 */
export function paginatedSuccessResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T[]> {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * Handle Supabase errors and convert to system response
 */
export function handleSupabaseError(error: { message: string; code?: string }): SystemResponse<never> {
  // Map common Supabase error codes to user-friendly messages
  const errorMessages: Record<string, string> = {
    "23505": "Ya existe un registro con estos datos",
    "23503": "El registro referenciado no existe",
    "23514": "Los datos no cumplen con las restricciones",
    "42501": "No tienes permisos para realizar esta acción",
    "P0001": "Error en la operación de base de datos",
    "PGRST116": "No se encontró el registro solicitado",
    "PGRST301": "Error en la consulta a la base de datos",
  };

  const userMessage = error.code
    ? errorMessages[error.code] || error.message
    : error.message;

  return errorResponse(userMessage);
}

/**
 * Validate that required fields are present
 */
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[]
): string[] | null {
  const missing: string[] = [];

  for (const field of requiredFields) {
    if (
      data[field] === undefined ||
      data[field] === null ||
      data[field] === ""
    ) {
      missing.push(field);
    }
  }

  return missing.length > 0 ? missing : null;
}

/**
 * Format validation errors from Zod
 */
export function formatZodErrors(error: { errors?: Array<{ path: (string | number)[]; message: string }> }): string[] {
  if (!error.errors) {
    return ["Error de validación"];
  }

  return error.errors.map((err) => {
    const path = err.path.join(".");
    return path ? `${path}: ${err.message}` : err.message;
  });
}
