# DOVM Router

This is the official router for DOVM.

## Usage

Declare a route table:

```ts
// routes.ts
import { Navigation, Route, RouteParams } from '@dovm/router';

export class IndexNavigation extends Navigation {
  static resolve(params: RouteParams): IndexNavigation | undefined {
    return new IndexNavigation();
  }
}

export const Routes: Route[] = [
  new Route(IndexNavigation, {
    path: '/',
    view: async c => {
      const { default: component } = await import(/* webpackChunkName: "home" */ './home');

      return new component({
        services: c.services,
        container: c.container,
        attrs: {},
        slots: {}
      });
    }
  })
];
```

Register a router to IoC container:

```ts
import { ServiceCollection } from '@dovm/core';
import { Router } from '@dovm/router';
import { Routes } from './routes';

const services = new ServiceCollection();

services.add(Router, () => new Router(Routes));
```

Render view:

```html
<component class="RouterView" src="@dovm/router"></component>

<template>
  <router-view>
    <template #main>The page you are requested does not exists.</template>
    <template #loading>Loading...</template>
  </router-view>
</template>
```

## License

MIT
