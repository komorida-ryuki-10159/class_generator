import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline";
import fs from 'fs/promises';

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

class ReadLine {
  private rl = readline.createInterface({ input, output });
  public question(message: string) {
    return new Promise<string>((resolve, reject) => {
      try {
        this.rl.question(message, (ans) => resolve(ans));
      } catch (e) {
        // 握りつぶし
      }
    });
  }
}

async function main() {
  const rl = new ReadLine();

  const name = await rl.question('class name > ');
  const fields: (PhpClassMethod | PhpClassProperty)[] = await rl
    .question('csv file path >')
    .then(async path => await fs.readFile(path, 'utf-8'))
    .then(file => file.split('\n').map(row => {
      const [name, accessModifier, type, description] = <[string, AccessModifier, string, string | undefined]>row.split(',');
      const args = name
        .match(/\(([^)]*)\)/)?.[1]
        ?.split(',')
        .filter(arg => arg.length > 0)
        .map(arg => {
          const [type, name] = arg.split(/\s+/);
          return { name, type };
        });

      return args
        ? { name: name.replace(/\(.*\)/g, ''), accessModifier, type, args, description }
        : { name, accessModifier, type, description }
    }));
  const impl = await rl
    .question('implements (none)> ')
    .then(s => s.trim() === 'none' ? undefined : s.split(''));
  const exten = await rl
    .question('extends (none)> ')
    .then(s => s.trim() === 'none' ? undefined : s);

  const code = codeGenerator({
    name,
    fields,
    implements: impl,
    extends: exten,
  });

  await fs.writeFile(`${name}.php`, code);
}

main();