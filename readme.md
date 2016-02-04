# Mocked API

This server can mock the responses of an API with files on disk. Most likely to be used in automatic testing or in early development of an API-depending project.

## Installation
```
$ npm install mocked-api --save-dev
```

## Usage

### Configuration
To get things running (to use it in your test-suite for example), initialize it like this:

```js
import MockedApi from 'mocked-api';

const api = MockedApi.setup({
  port: 3000, // port where you want the API to run on
  dir: './mocks' // directory where your JSON-files live
});

api.start(() => {
  console.log('API ready')
});
```

You can do this once (like in a script that's running your test-suite). The server will keep running until that process is killed, so you don't have to setup the server for every single test.

### JSON-files
Place JSON-files in the configured directory to accomodate the responses. You can use nested directories to simulate a path-hierarchy. For example, the file at `./mocks/content/article/42.json` will be served at `http://localhost:3000/content/article/42.json` for the configuration above.

### Custom responses
Once initialized, you can mutate responses with the following methods:

```js
import { api } from 'mocked-api';

api
  .respondTo(path) // Defines the path you're about to change
  .andReplace(pointer, value) // Replace a property in your JSON-file. This is based on JSON-pointers, described in [RFC 6901](https://tools.ietf.org/html/rfc6901).
  .withStatus(status) // Custom status-code (`200`, `404`, `500`, etc)

api
  .onResponse((status, body) => {}) // Callback fired for every request, handy for debugging
  .reset() // Removes _all_ custom mutations
```

You can use these methods to make small changes in a response and test your UI for every little variation that you make. This way your tests can be small and specific, and still cover a lot of edge-cases.

The following example is based on mocha/chai/jsdom, but you can use it similarly in other environments:

```js
import { api } from 'mocked-api';

describe('article', () => {
  beforeEach(() => {
    // Don't forget to reset the API if
    // you're overriding responses:
    api.reset();
  });

  describe('title', () => {
    describe('when it has a title', () => {
      it('renders the title', (done) => {
        api
          .respondTo('/content/article/42.json')
          .andReplace('/title', 'test title');

        browser
          .go(`${baseUrl}/article/42`)
          .then(window => {
            expect(window.$('#title').text()).to.equal('test title');
            done();
          });
      });
    });

    describe('when it has no title', () => {
      it('renders no title', (done) => {
        api
          .respondTo('/content/article/42.json')
          .andReplace('/title', null);

        browser
          .go(`${baseUrl}/article/42`)
          .then(window => {
            expect(window.$('#title').length).to.equal(0);
            done();
          });
      });
    });
  });
});
```

### Two API's at the same time
You can run multiple instances of MockedApi simultaneously. For that, pass it a name when you setup each:

```js
import MockedApi from 'mocked-api';
const userApi = MockedApi.setup({ name: 'user', port: 3000, dir: './mocks/user' });
const blogApi = MockedApi.setup({ name: 'blog', port: 3001, dir: './mocks/blog' });
```

Anytime you need one of those API's to override, make sure you use that same name:

```js
import MockedApi from 'mocked-api';
const userApi = MockedApi.getByName('user');

describe('user', () => {
  beforeEach(() => userApi.reset());

  describe('when logged in', () => {
    it('shows avatar', (done) => {
      const kitty = 'http://placekitten.com/200/300';

      userApi
        .respondTo('/me')
        .andReplace('/image/src', kitty);

      browser
        .go('/')
        .then(window => {
          expect(window.$('#avatar').attr('src')).to.equal(kitty);
          done();
        });
    });
  });

  describe('when not logged in', () => {
    it('does not show avatar', (done) => {
      userApi
        .respondTo('/me')
        .withStatus(401)

      browser
        .go('/')
        .then(window => {
          expect(window.$('#avatar').length).to.equal(0);
          done();
        });
    });
  });
});
```

## Standalone
You can also run the server standalone, from your CLI:

```
$ node_modules/.bin/mocked-api --port 6000 --dir ./mocks
```

This will serve JSON-files in `./mocks` at `localhost:6000`, but that's it. Custom mutation of responses is not possible through the CLI.

## Notes

- POST/PUT/DELETE are not yet implemented. If you need one of those, please ping me and give me some time to work it out.
- Don't let anyone tell you different: Setting up a test-suite in the javascript world is not always super duper easy. Let me know if you're having problems with MockedApi!
