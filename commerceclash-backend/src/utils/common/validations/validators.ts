import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

type ClassType<T = any> = {
  new (...args: any[]): T;
};

@ValidatorConstraint({ name: 'IfOneThenAll', async: false })
export class IfOneThenAllConstraint implements ValidatorConstraintInterface {
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as Record<string, any>;
    const [props] = args.constraints as [string[]];
    const presentKeys = props.filter((key) => obj[key] !== undefined && obj[key] !== null);
    return presentKeys.length === 0 || presentKeys.length === props.length;
  }

  defaultMessage(args: ValidationArguments) {
    const props = args.constraints[0] as string[];
    return `If one of the following properties is provided, all must be provided: ${props.join(', ')}`;
  }
}

export function ValidateIfOneThenAll(props: string[], validationOptions?: ValidationOptions) {
  return function (target: ClassType) {
    registerDecorator({
      name: 'ValidateIfOneThenAll',
      target,
      propertyName: '___classLevel', // internal placeholder
      constraints: [props],
      options: validationOptions,
      validator: IfOneThenAllConstraint,
    });
  };
}

export function RequiredZakIfHost(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'RequiredZakIfHost',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as Record<string, any>;
          if (obj['role'] === 1) {
            return value !== undefined && value !== null && value !== '';
          }
          return true;
        },
        defaultMessage() {
          return `zak must be provided when role is set to host (1).`;
        },
      },
    });
  };
}
