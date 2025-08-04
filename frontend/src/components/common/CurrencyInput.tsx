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
        const newValue = event.target.value;

        // Si el input está vacío, permitir que se limpie
        if (!newValue) {
            setInputValue('');
            onChange(0);
            return;
        }

        // Solo permitir números y un punto decimal
        if (!/^\d*\.?\d*$/.test(newValue)) {
            return;
        }

        // Limitar a 2 decimales
        const parts = newValue.split('.');
        if (parts.length > 1 && parts[1].length > 2) {
            return;
        }

        setInputValue(newValue);

        // Convertir a número solo si es un valor válido
        const numericValue = parseFloat(newValue);
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