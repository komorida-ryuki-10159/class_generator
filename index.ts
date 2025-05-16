type AccessModifier = 'public' | 'private' | 'protected' | 'package';

interface PhpClass {
  name: string;
  extends?: string;
  implements?: string[];
  fields: (PhpClassMethod | PhpClassProperty)[];
}

interface PhpClassProperty {
  accessModifier?: AccessModifier;
  name: string;
  type: string;
  description?: string;
}

interface PhpClassMethod {
  accessModifier?: AccessModifier;
  name: string;
  type: string;
  args: {
    name: string;
    type: string;
  }[];
  description?: string;
}
