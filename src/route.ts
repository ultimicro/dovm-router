import { Component, Container, ServiceCollection } from '@dovm/core';
import { RouteParams } from './params';

export type ViewFactory<N extends Navigation> = (ctx: ViewContext<N>) => Promise<Component> | Component;

export interface ViewContext<N extends Navigation> {
  readonly navigation: N;
  readonly services: ServiceCollection;
  readonly container: Container;
}

export interface NavigationConstructor<N extends Navigation> {
  new (...args: any): N;
  resolve(params: RouteParams): N | undefined;
}

export interface RouteOptions<N extends Navigation> {
  readonly path: string;
  readonly view?: ViewFactory<N>;
  readonly redirect?: (current: N) => Navigation;
}

export class Route<N extends Navigation = any> {
  readonly navgiation: NavigationConstructor<N>;
  readonly options: RouteOptions<N>;

  constructor(navgiation: NavigationConstructor<N>, options: RouteOptions<N>) {
    this.navgiation = navgiation;
    this.options = options;
  }
}

export abstract class Navigation {
  equals(other: Navigation): boolean {
    return other.constructor === this.constructor;
  }

  params(): RouteParams {
    return EmptyParams;
  }
}

const EmptyParams: RouteParams = {
  path: new Map(),
  query: new URLSearchParams(),
  hash: ''
};
