import * as handlerModule from '../src/handler';

describe('handler', () => {
  it('createHandlersObject shoud create', () => {
    const handlers = [
      {
        name: 'foo',
        handler: () => {},
        model: undefined,
      },
    ];
    const result = handlerModule.createHandlersObject(handlers);
  });
});
