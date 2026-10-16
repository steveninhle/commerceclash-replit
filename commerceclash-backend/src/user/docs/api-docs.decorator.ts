import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiGetUser = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Get Self' }),
    ApiResponse({ status: 200, description: 'Return the user.' }),
    ApiResponse({ status: 404, description: 'User not found.' }),
  );
};

export const ApiUpdateUser = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update Self' }),
    ApiResponse({ status: 200, description: 'User has been updated successfully.' }),
    ApiResponse({ status: 404, description: 'User not found.' }),
  );
};

export const ApiDeleteUser = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Delete Self' }),
    ApiResponse({ status: 200, description: 'User has been deleted successfully.' }),
    ApiResponse({ status: 404, description: 'User not found.' }),
  );
};

export const ApiUpdateMetadata = () => {
  return applyDecorators(
    ApiOperation({ summary: 'Update User Metadata' }),
    ApiResponse({ status: 200, description: 'User metadata has been updated successfully.' }),
    ApiResponse({ status: 404, description: 'User not found.' }),
  );
};
