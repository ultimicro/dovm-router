import { Observable, ReactiveData } from '@dovm/core';
import { DynamicPath, parseRoute, Path, StaticPath } from './path';
import { Navigation, Route, ViewFactory } from './route';

export interface Page<N extends Navigation> {
  readonly navigation: N;
  readonly view: ViewFactory<N>;
}

export class Router {
  constructor(routes: Route[]) {
    // setup route table
    this.r = [];

    for (const r of routes) {
      this.r.push({ route: r, path: parseRoute(r.options.path) });
    }

    // setup location
    this.l = new ReactiveData(this.resolve(), (a, b) => a.navigation.equals(b.navigation));

    window.addEventListener('popstate', () => this.l.set(this.resolve()));
  }

  get location(): Observable<Page<Navigation> | undefined> {
    return this.l;
  }

  navigate(nav: Navigation): Promise<void> {
    // find target route
    const d = this.r.find(r => r.route.constructor === nav.constructor);

    if (!d) {
      throw new Error(`No route has been defined for '${nav.constructor.name}'.`);
    }

    // update url
    const p = nav.params();
    let l;

    if (d.path instanceof StaticPath) {
      l = d.path.path;
    } else if (d.path instanceof DynamicPath) {
      l = d.path.resolve(p.path);
    }

    const s = p.query.toString();

    if (s) {
      l += '?' + s;
    }

    const h = p.hash;

    if (h) {
      l +=' #' + h;
    }

    window.history.pushState(null, '', l);

    // check for redirection
    let r;

    if (d.route.options.redirect) {
      r = this.redirect(d.route.options.redirect(nav));
    } else {
      r = d.route;
    }

    if (!r.options.view) {
      throw new Error(`No view has been defined for '${r.navgiation.name}'.`);
    }

    return this.l.set({ navigation: nav, view: r.options.view });
  }

  private resolve(): Page<Navigation> | undefined {
    // get current path
    let path = window.location.pathname;

    if (!path) {
      path = '/';
    }

    // find matching route
    let route, params;

    for (const r of this.r) {
      if (r.path instanceof StaticPath) {
        if (r.path.path === path) {
          route = r.route;
        }
      } else if (r.path instanceof DynamicPath) {
        params = r.path.match(path);

        if (params) {
          route = r.route;
        }
      }

      if (route) {
        break;
      }
    }

    if (!route) {
      return undefined;
    }

    // construct navigation
    const search = window.location.search.substring(1); // remove ?
    const hash = window.location.hash.substring(1); // remove #
    const nav = route.navgiation.resolve({ path: params ?? new Map(), query: new URLSearchParams(search), hash });

    if (!nav) {
      return undefined;
    }

    // handle redirect
    if (route.options.redirect) {
      route = this.redirect(route.options.redirect(nav));
    }

    // construct page data
    const view = route.options.view;

    if (!view) {
      throw new Error(`No view has been defined for '${route.navgiation.name}'.`);
    }

    return { navigation: nav, view };
  }

  private redirect(n: Navigation): Route {
    // construct path
    const p = n.params();
    const r = this.r.find(r => r.route.navgiation === n.constructor);
    let l;

    if (!r) {
      throw new Error(`No route has been defined for '${n.constructor.name}'.`);
    } else if (r.path instanceof StaticPath) {
      l = r.path.path;
    } else if (r.path instanceof DynamicPath) {
      l = r.path.resolve(p.path);
    }

    // construct search and hash
    const s = p.query.toString();

    if (s) {
      l += '?' + s;
    }

    const h = p.hash;

    if (h) {
      l += '#' + h;
    }

    window.history.pushState(null, '', l);

    // check if the current navigation also redirect to other navigation
    if (r.route.options.redirect) {
      return this.redirect(r.route.options.redirect(n));
    } else {
      return r.route;
    }
  }

  private readonly r: Array<{ route: Route, path: Path }>;
  private readonly l: ReactiveData<Page<Navigation> | undefined>;
}
