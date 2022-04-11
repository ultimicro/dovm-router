import { Component, ComponentParams, Container, Placeholder, RenderBuffer, Slot } from '@dovm/core';
import { Navigation } from './route';
import { Page, Router } from './router';

export interface RouterViewParams extends ComponentParams {
  slots: {
    main: Slot,
    loading?: Slot
  }
}

export class RouterView extends Component {
  constructor(params: RouterViewParams) {
    super(params);
    this.router = this.services.resolve(Router);
    this.notFound = params.slots.main;
    this.loading = params.slots.loading;
  }

  async render() {
    const placeholder = new Placeholder(this.container);

    this.addDependencies(placeholder);

    await this.watch(this.router.location, page => this.renderPage(page, placeholder));
  }

  private async renderPage(page: Page<Navigation> | undefined, container: Container) {
    // remove current page
    let i;

    if (this.current) {
      i = this.children.indexOf(this.current);

      if (i === -1) {
        throw new Error(`Cannot find component '${this.current.constructor.name}' in the children.`);
      }

      this.children.splice(i, 1);

      try {
        await this.current.dispose();
      } finally {
        this.current = undefined;
      }
    }

    // activate and render loading
    let loading;

    if (this.loading) {
      loading = await this.loading({ services: this.services, container });

      if (i === undefined) {
        this.children.push(loading);
      } else {
        this.children.splice(i, 0, loading);
      }

      await loading.render();
    }

    // activate new page
    const buffer = new RenderBuffer(container);

    if (page) {
      this.current = await page.view({ navigation: page.navigation, services: this.services, container: buffer });
    } else {
      this.current = await this.notFound({ services: this.services, container: buffer });
    }

    if (loading) {
      i = this.children.indexOf(loading);
      this.children.splice(i + 1, 0, this.current);
    } else if (i === undefined) {
      this.children.push(this.current);
    } else {
      this.children.splice(i, 0, this.current);
    }

    // render
    await this.current.render();

    if (loading) {
      this.children.splice(this.children.indexOf(loading), 1);
      await loading.dispose();
    }

    buffer.flush();
  }

  private readonly router: Router;
  private readonly notFound: Slot;
  private readonly loading?: Slot;
  private current?: Component;
}
