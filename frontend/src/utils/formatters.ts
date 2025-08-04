/**
 * Formatea un número a formato de moneda
 * @param value - Valor numérico a formatear
 * @param decimals - Número de decimales (por defecto 2)
 * @returns Valor formateado como moneda
 */
export const formatCurrency = (value: number | string | undefined | null, decimals: number = 2): string => {
    if (value === undefined || value === null) return '0.00';

    // Convertir a número y redondear a los decimales especificados
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '0.00';

    // Formatear con separadores de miles y decimales
    return numValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

/**
 * Convierte un valor monetario formateado a número
 * @param value - Valor formateado como moneda
 * @returns Número sin formato
 */
export const parseCurrency = (value: string): number => {
    if (!value) return 0;

    // Eliminar todos los caracteres no numéricos excepto el punto decimal
    const cleanValue = value.replace(/[^\d.-]/g, '');
    const numValue = parseFloat(cleanValue);
    return isNaN(numValue) ? 0 : numValue;
};

/**
 * Valida si un valor es un número válido para moneda
 * @param value - Valor a validar
 * @returns true si es un valor válido para moneda
 */
export const isValidCurrency = (value: string | number): boolean => {
    if (typeof value === 'number') return !isNaN(value) && isFinite(value);

    const numValue = parseFloat(value);
    return !isNaN(numValue) && isFinite(numValue);
};

/**
 * Formatea un valor monetario para input
 * @param value - Valor a formatear
 * @returns Valor formateado para input
 */
export const formatCurrencyForInput = (value: number | string | undefined | null): string => {
    if (value === undefined || value === null) return '';

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '';

    return numValue.toFixed(2);
};