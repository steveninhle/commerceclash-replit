import {
  IsNotEmpty,
  IsUUID,
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsNotEqualTo(property: string, validationOptions?: ValidationOptions) {
  return function (object: Record<string, any>, propertyName: string) {
    registerDecorator({
      name: 'isNotEqualTo',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          const obj = args.object as Record<string, unknown>;
          const relatedValue = obj[relatedPropertyName];
          if (typeof value === 'string' && typeof relatedValue === 'string') {
            return value !== relatedValue;
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints as [string];
          return `${propertyName} must not be equal to ${relatedPropertyName}`;
        },
      },
    });
  };
}

export class ShiftSkillPointRequest {
  @IsUUID('all')
  @IsNotEmpty()
  fromSkill!: string;

  @IsUUID('all')
  @IsNotEmpty()
  @IsNotEqualTo('fromSkill', { message: 'toSkill must not be the same as fromSkill' })
  toSkill!: string;
}
