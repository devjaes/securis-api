import { HttpStatus, applyDecorators, Type } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'
import { ApiPaginatedRes, ApiRes } from '../dtos/res/api-response.dto'

export function ApiStandardResponse<T>(
  model?: Type<T> | Type<T>[] | string,
  status: HttpStatus = HttpStatus.OK,
) {
  // Verificamos si model es un array de tipos
  const isArrayType = Array.isArray(model)
  const actualModel = isArrayType ? model[0] : model

  return applyDecorators(
    ApiExtraModels(
      model ? ApiRes : ApiRes<T>,
      ...(typeof actualModel === 'function' ? [actualModel] : []),
    ),
    ApiResponse({
      status,
      description: getStatusDescription(status),
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiRes) },
          ...(model
            ? [
                {
                  properties: {
                    data: isArrayType
                      ? {
                          type: 'array',
                          // @ts-expect-error default
                          items: { $ref: getSchemaPath(actualModel) },
                        } // @ts-expect-error default
                      : { $ref: getSchemaPath(actualModel) },
                  },
                },
              ]
            : []),
        ],
      },
    }),
  )
}

export function ApiPaginatedResponse<T>(
  model: Type<T>,
  status: HttpStatus = HttpStatus.OK,
) {
  return applyDecorators(
    ApiExtraModels(ApiRes, ApiPaginatedRes, model),
    ApiResponse({
      status,
      description: getStatusDescription(status),
      schema: {
        allOf: [
          { $ref: getSchemaPath(ApiRes) },
          {
            properties: {
              data: {
                allOf: [
                  { $ref: getSchemaPath(ApiPaginatedRes) },
                  {
                    properties: {
                      records: {
                        type: 'array',
                        items: { $ref: getSchemaPath(model) },
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
    }),
  )
}
// Función auxiliar para descripciones de estado
function getStatusDescription(status: HttpStatus): string {
  const descriptions = {
    [HttpStatus.OK]: 'Successful operation',
    [HttpStatus.CREATED]: 'Resource created successfully',
    [HttpStatus.ACCEPTED]: 'Request accepted for processing',
    [HttpStatus.NO_CONTENT]: 'Request successful but no content to return',
    [HttpStatus.BAD_REQUEST]: 'Bad request, invalid input',
    [HttpStatus.UNAUTHORIZED]: 'Authentication required',
    [HttpStatus.FORBIDDEN]: 'Access forbidden',
    [HttpStatus.NOT_FOUND]: 'Resource not found',
    [HttpStatus.INTERNAL_SERVER_ERROR]: 'Internal server error',
  }
  return descriptions[status] || `Status code ${status}`
}
