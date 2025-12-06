import { ApiCustomRes, ApiMessage } from '../dtos/res/api-response.dto'

export const formatNumber = (
  value: string | number,
  maxDecimals: number = 5,
): number => {
  // Convertir a número si es string
  const numero = typeof value === 'string' ? parseFloat(value) : value

  // Verificar si es un número válido
  if (isNaN(numero)) {
    throw new Error('El valor proporcionado no es un número válido')
  }

  // Redondear al número máximo de decimales especificado
  const factor = Math.pow(10, maxDecimals)
  const numeroRedondeado = Math.round(numero * factor) / factor

  return numeroRedondeado
}

export const createCustomResponse = <T>(
  data: T,
  message: string | string[],
  displayable = true,
): ApiCustomRes<T> => {
  const customMessage: ApiMessage = {
    content: Array.isArray(message) ? message : [message],
    displayable,
  }

  return {
    data,
    customMessage,
  }
}

export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

export const formatDateTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('es-EC', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
