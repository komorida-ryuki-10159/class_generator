import { stdin as input, stdout as output } from "node:process";
import * as readline from "node:readline";
import fs from 'node:fs';

type AccessModifier = 'public' | 'private' | 'protected' | 'package';

interface PhpClass {
  name: string;
  extends?: string;
  implements?: string[];
  fields: (PhpClassMethod | PhpClassProperty | PhpClassUse)[];
}

interface PhpClassProperty {
  accessModifier?: AccessModifier;
  name: string;
  type: string;
  val?: string;
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

interface PhpClassUse {
  name: string;
}

function codeGenerator(c: PhpClass) {
  let code = `class ${c.name}`;

  if (c.extends) {
    code += ` extends ${c.extends.split('/').slice(-1)[0]}`
  } else if (c.implements) {
    code += ` implements ${c.implements.map(v => v.split('/').slice(-1)[0]).join(', ')}`
  }

  if (c.fields.length) {
    code += `\n{\n`;

    for (const field of c.fields) {
      if (!('accessModifier' in field)) {
        code += `  use ${field.name}`;
      } else {
        if ('args' in field) {
          code += `  ${field.accessModifier} ${field.name}`
          code += `(${field.args.map(arg => `${arg.type} ${arg.name}`)}): ${field.type} {}`
        } else {
          code += `  ${field.accessModifier} ${field.name.startsWith('$') ? field.name : ('$' + field.name)}`
        }

        if (field.type)
          code += `: ${field.type}`;

        if ('val' in field && field.val)
          code += ` = ${field.val}`
      }

      code += ';\n'
    }

    code += `\n}\n`;
  }

  return code;
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
  const path = await new ReadLine().question('file name > ');

  if (fs.existsSync('dist'))
    fs.rmSync('dist', { recursive: true });

  fs.mkdirSync('dist');

  const file = fs.readFileSync(path, 'utf-8');
  const defs = file.match(/#\s.*/g)?.filter(Boolean) ?? [];

  file
    .split('\n')
    .map(l => l.trim())
    .reduce<string[]>((acc, l) => {
      if (defs.includes(l))
        acc.unshift(l)
      else
        acc[0] += '\n' + l;

      return acc;
    }, [])
    .forEach((doc) => {
      const lines = doc.split('\n').map(l => l.trim()).filter(l => l !== '');
      const className = lines
        .at(0)
        ?.match(/\{.*\}/g)
        ?.at(0)
        ?.replace('{', '')
        .replace('}', '')
        .split('_')
        .map(t => t[0].toUpperCase() + t.slice(1))
        .join('');

      const fillable = JSON.stringify(lines
        .filter(l => l.startsWith('|') && l.endsWith('|'))
        .slice(2)
        .map(p => p.split('|').filter(r => r !== ''))
        .filter(([_, name]) => name != 'id' && name != 'updated_at' && name != 'created_at' && !name.match(/.*_id/))
        .map(([_, name]) => name))

      if (className) {
        const code = codeGenerator({
          name: className,
          extends: 'Model',
          fields: [
            { name: 'HasFactory' },
            { name: 'fillable', accessModifier: 'protected', val: fillable }
          ]
        });

        fs.writeFileSync(
          `dist/${className}.php`,
          `<?php\n\nnamespace App\Models;\n\nuse Illuminate\\Database\\Eloquent\\Factories\\HasFactory;\nuse Illuminate\\Database\\Eloquent\\Model;\n\n${code}`
        );
      }
    });
}

main();
