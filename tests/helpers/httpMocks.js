/**
 * Minimal Express request/response stand-ins for CONTROLLER tests.
 *
 * Controllers are plain async functions (req, res) => { ... }. These mocks let you
 * call them directly, without starting a server:
 *
 *   const req = mockRequest({ params: { id: '1' } });
 *   const res = mockResponse();
 *   await controller.getById(req, res);
 *   assert.equal(res.statusCode, 200);
 *   assert.equal(res.body.data.id, 1);
 *
 * Errors: in Express 5, controllers simply throw. Test that with assert.rejects():
 *
 *   await assert.rejects(controller.getById(req, res), NotFoundError);
 */

export function mockRequest({ params = {}, query = {}, body, headers = {}, user } = {}) {
  return {
    method: 'GET',
    originalUrl: '/',
    params,
    query,
    body,
    headers,
    user,
  };
}

export function mockResponse() {
  return {
    statusCode: 200,
    body: undefined,
    headersSent: false,

    status(code) {
      this.statusCode = code;
      return this;
    },

    json(data) {
      this.body = data;
      this.headersSent = true;
      return this;
    },
  };
}
