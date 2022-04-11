export function parseRoute(path: string): Path {
  // split path and do special case handling
  const parts = path.split('/');

  if (parts[0] || parts.length === 1) {
    // don't allow empty string or 'abc/...'
    throw new Error(`'${path}' is not a valid route path.`);
  } else if (!parts[1] && parts.length === 2) {
    // path is /
    return new StaticPath('/');
  }

  // parse path
  const components = new Array<string | Placeholder>();

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    let c;

    if (!part) {
      throw new Error(`'${path}' is not a valid route.`);
    } else if (part[0] === ':') {
      const name = part.substring(1);

      if (!name) {
        throw new Error(`'${path}' is not a valid route.`);
      }

      c = new Placeholder(name);
    } else {
      c = part;
    }

    components.push(c);
  }

  if (components.every(c => typeof c === 'string')) {
    return new StaticPath('/' + components.join('/'));
  } else {
    return new DynamicPath(components);
  }
}

export abstract class Path {
}

export class StaticPath extends Path {
  constructor(readonly path: string) {
    super();
  }
}

export class DynamicPath extends Path {
  constructor(private readonly components: Array<string | Placeholder>) {
    super();
  }

  match(path: string): Map<string, string> | undefined {
    // split path
    const parts = path.split('/');

    if (parts.length === 1) {
      throw new Error(`'${path}' is not a valid path.`);
    } else if (parts.length - 1 !== this.components.length) {
      return undefined;
    }

    // check if matched
    const params = new Map<string, string>();

    for (let i = 1; i < parts.length; i++) {
      const p = parts[i];
      const c = this.components[i];

      if (typeof c === 'string') {
        if (p !== c) {
          return undefined;
        }
      } else {
        params.set(c.name, p);
      }
    }

    return params;
  }

  resolve(params: Map<string, string>): string {
    let path = '';

    for (const c of this.components) {
      let v;

      if (typeof c === 'string') {
        v = c;
      } else {
        v = params.get(c.name);

        if (v === undefined) {
          throw new Error(`Parameter '${c.name}' not found.`);
        }
      }

      path += '/' + v;
    }

    return path;
  }
}

export class Placeholder {
  constructor(readonly name: string) {
  }
}
