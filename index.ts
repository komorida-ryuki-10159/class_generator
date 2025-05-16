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

function codeGenerator(c: PhpClass) {
  let code: {
    use: string[]
    class: string;
  } = {
    use: [],
    class: `class ${c.name}`
  };

  if (c.extends) {
    code.use.push(`use ${c.extends};`);
    code.class += ` extends ${c.extends.split('/').slice(-1)[0]}`
  } else if (c.implements) {
    code.use.push(...c.implements.map(
      c => `use ${c};`
    ));
    code.class += ` implements ${c.implements.map(v => v.split('/').slice(-1)[0]).join(', ')}`
  }

  if (c.fields.length) {
    code.class += `\n{\n`;

    for (const field of c.fields) {
      code.class += `  ${field.accessModifier} ${field.name}`
      code.class += 'args' in field
        ? `(${field.args.map(arg => `${arg.type} ${arg.name}`)}): ${field.type} {}`
        : `: ${field.type}`;
    }

    code.class += `\n}\n`;
  }

  return `${code.use.join('\n')}\n\n${code.class}`;
}
