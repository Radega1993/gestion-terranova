import React, { useState } from 'react';
import { TextField, TextFieldProps } from '@mui/material';
import { formatCurrency, parseCurrency, isValidCurrency } from '../../utils/formatters';

interface CurrencyInputProps extends Omit<TextFieldProps, 'onChange'> {
    value: number | string;
    onChange: (value: number) => void;
    decimals?: number;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
    value,
    onChange,
    decimals = 2,
    ...props
}) => {
    const [inputValue, setInputValue] = useState<string>('');

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        let newValue = event.target.value;

        // Si el input está vacío, permitir que se limpie
        if (!newValue) {
            setInputValue('');
            onChange(0);
            return;
        }

        // Normalizar: convertir coma a punto para procesamiento interno
        // Pero mantener la coma visualmente si el usuario la escribió
        const hasComma = newValue.includes(',');
        const normalizedValue = newValue.replace(',', '.');

        // Solo permitir números y un separador decimal (punto o coma)
        if (!/^\d*[,.]?\d*$/.test(newValue)) {
            return;
        }

        // Limitar a 2 decimales
        const parts = normalizedValue.split('.');
        if (parts.length > 1 && parts[1].length > decimals) {
            return;
        }

        // Mantener la coma si el usuario la escribió, pero procesar con punto
        setInputValue(newValue);

        // Convertir a número usando el valor normalizado
        const numericValue = parseFloat(normalizedValue);
        if (!isNaN(numericValue)) {
            onChange(numericValue);
        }
    };

    const handleBlur = () => {
        // Si el input está vacío, establecer a 0
        if (!inputValue) {
            setInputValue('0');
            onChange(0);
            return;
        }

        // Formatear el valor al perder el foco
        const numericValue = parseFloat(inputValue);
        if (!isNaN(numericValue)) {
            const formattedValue = formatCurrency(numericValue, decimals);
            setInputValue(formattedValue);
            onChange(numericValue);
        } else {
            setInputValue('0');
            onChange(0);
        }
    };

    const handleFocus = () => {
        // Al recibir el foco, mostrar el valor sin formato
        if (typeof value === 'number') {
            setInputValue(value.toFixed(decimals));
        }
    };

    return (
        <TextField
            {...props}
            value={inputValue || formatCurrency(value, decimals)}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            inputProps={{
                ...props.inputProps,
                inputMode: 'decimal',
                pattern: '[0-9]*'
            }}
        />
    );
}; 