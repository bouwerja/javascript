# Tests

No database, no `.env` file and no network are needed. Clone the repository, run `npm install`, then `npm test`.

## Running tests

| Command | Runs |
|---|---|
| `npm test` | Every test, for every developer |
| `npm run test:watch` | Every test, again on each file save |
| `npm run test:models` | All `models/` folders |
| `npm run test:controllers` | All `controllers/` folders |
| `npm run test:integration` | All `integration/` folders |
| `npm run test:coverage` | Every test, with a coverage report for `src/` |

To run only **your own** tests, or a single file:

```
node --test "tests/<your-name>/**/*.test.js"
node --test tests/jason/models/userModel.test.js
```

To focus on one test while debugging, change `test(` to `test.only(` and run `npm run test:only`.

## Folder layout

```
tests/
  README.md            this file
  _template/           copy these files to start a new test
  helpers/             shared tools: import them all from helpers/index.js
  <developer-name>/
    controllers/       call a controller directly (no server)
    integration/       the real app over HTTP (routing + auth + controllers + models)
    models/            a real model with in-memory storage
```

**Getting started as a new developer:**

1. Create `tests/<your-name>/` with the three folders `controllers/`, `integration/` and `models/`.
2. Copy a file from `tests/_template/` into the matching folder.
3. Rename it to `<thing>.test.js`. Only files ending in `.test.js` are run.
4. Run `npm run test:watch` and start writing.

`tests/jason/` contains complete, working examples of each kind of test.

## Which kind of test should I write?

| I want to test... | Folder | Main helper |
|---|---|---|
| A model's rules (normalisation, validation, duplicates, auditing) | `models/` | `createInMemoryModel(Model)` |
| A controller's handling of input and its status codes | `controllers/` | `mockRequest()`, `mockResponse()` |
| A full HTTP request: routes, auth, error responses | `integration/` | `startTestServer()` |

## Helpers

Import everything from one place:

```js
import { createInMemoryModel, buildUser, mockRequest, mockResponse, startTestServer } from '../../helpers/index.js';
```

| Helper | What it does |
|---|---|
| `createInMemoryModel(Model)` | A **real** model whose storage is in memory. Returns `{ model, auditLog, rows, seed }`. Enforces the schema's NOT NULL, lengths, UNIQUE and defaults. Works for every model, so you never write a fake model |
| `buildUser(overrides)` | Valid user input with a unique email. Override only what matters to your test |
| `buildDiscordApiMessage(overrides)` | A Discord API message with realistic 64-bit ids |
| `mockRequest({ params, body, ... })` / `mockResponse()` | Minimal Express `req` / `res` for calling controllers directly |
| `startTestServer()` | Starts the real app on a random port. Returns `{ request, models, stores, close }` |

### Custom queries in models

`createInMemoryModel` emulates `findById`, `findAll`, `insertRecord`, `updateRecord` and `deleteRecord`. Model methods that query `this.db` directly (for example `UserModel.findByEmail` or `search`) throw a clear error explaining what to do. In a test that needs one, stub it:

```js
test('...', async (t) => {
  const { model } = createInMemoryModel(UserModel);
  t.mock.method(model, 'findByEmail', async () => ({ id: 1, email: 'a@example.com' }));
  // ...
});
```

`t.mock.method` is restored automatically when the test ends.

## Rules

1. **No real network and no real database.** Never import `src/db/index.js` in a test. It opens a MySQL connection pool. If `npm test` hangs after the results, that import is the most likely cause.
2. **Every test asserts something.** A test that only uses `console.log` always passes and proves nothing.
3. **One behaviour per test.** The test name states the expected outcome, for example `'responds 404 for a missing user'`.
4. **Use the builders for data,** and override only the fields your test is about.
5. **Keep tests independent.** Create fresh models or servers in each test (or in `beforeEach`); never rely on another test having run first.
6. **Silence expected log output** with `t.mock.method(console, 'error', () => {})`, and assert on it if the logging matters.
