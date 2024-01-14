import * as ctx from '../src/context';

describe('context', () => {
  it('should save the context', () => {
    ctx.save('foo=bar;fiz=baz;kv=true;');
    const data = ctx.data();
    expect(data).toEqual({ foo: 'bar', fiz: 'baz', kv: true });
  });

  it('should add an item to the context', () => {
    ctx.add('foo', true);
    let data = ctx.data();
    expect(data.foo).toBe(true);

    ctx.clear();
    ctx.add('bar', '');
    data = ctx.data();
    expect(data.bar).toBe('');

    ctx.clear();
    ctx.add('foo', { bar: null });
    data = ctx.data();
    expect(data.foo).toEqual({ bar: null });

    ctx.clear();
    ctx.add('foo', null);
    data = ctx.data();
    expect(data.foo).toBeNull();

    ctx.clear();
    ctx.add('foo', undefined);
    data = ctx.data();
    expect(data.foo).toBe(undefined);

    ctx.clear();
    ctx.add('foo', []);
    data = ctx.data();
    expect(data.foo).toEqual([]);
  });

  it('should convert context to string', () => {
    ctx.clear();
    ctx.add('foo', { bar: true });
    ctx.add('bar', [1, 2]);
    let str = ctx.toString();

    expect(str).toEqual('foo={"bar":true};bar=[1,2];');

    ctx.clear();

    str = ctx.toString();
    expect(str).toBe('');
  });
});
