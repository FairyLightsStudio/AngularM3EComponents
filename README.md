# ComponentWorkspace

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) and is now supercharged with [Nx](https://nx.dev/).

## Development server

To start a local development server for the demo app, run:

```bash
nx serve demo-app
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Nx uses Angular CLI's powerful code scaffolding tools under the hood. To generate a new component in a specific project, run:

```bash
nx generate component component-name --project=demo-app
```

For a complete list of available schematics, run:

```bash
nx generate --help
```

## Building

To build the application or the component library, run:

```bash
nx build demo-app
# or
nx build @fairylights-studio/navigation-rail
```

This will compile your project and store the build artifacts in the `dist/` directory. Nx uses computation caching, making subsequent builds nearly instantaneous if the code hasn't changed.

## Running unit tests

To execute unit tests, use the following command:

```bash
nx test demo-app
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
nx e2e demo-app
```

## Affected Commands

When working in this monorepo, you can run tasks only on the projects affected by your changes:

```bash
nx affected -t build
nx affected -t test
```

## Dependency Graph

To view a visual representation of your dependencies, run:

```bash
nx graph
```

## Additional Resources

For more information on using Nx with Angular, visit the [Nx Angular Documentation](https://nx.dev/angular).
