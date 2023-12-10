# MiniServer - A Minimalist Nodejs Express Server

Creating a Nodejs server should be easy. Keep It Super Simple right?

## Everything is a POST request - simple yet effective!

So, what keeps this framework simple is that all requests are a POST request, so you don't need to worry about any other things - query parameters, routes, payload. You can just foucs on what features are you going to make.

## Getting Started

### Install
install typescript
```bash
npm install typescript @types/node --save-dev
```

### package.json

Set type to module and add start script
```json
{
  "type": "module",
  "scripts": {
    "start": "miniserver start"
  }
}
```

### sample tsconfig.json file
```json
{
  "compilerOptions": {
    "lib": ["es2020"],
    "target": "es2020",
    "module": "esnext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "types": ["node"]
  }
}
```

### .env

```bash
export PORT = 3000
```

### Create your API

```javascript
// src/hello.ts

export async function handler() {
  return 'hello world!';
}
```
### Usage


```javascript
fetch('http://localhost:3000/api', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    body: JSON.stringify({
      "handler": "hello",
    })
  }
})

```

returns:

```javascript
{
  "data": "hello world!"
}
```

#### Handling inputs
```javascript
// addProduct.ts

export async function handler({input}) {
  return input;
}
```
Call the API
```javascript
fetch('http://localhost:3000/api', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    body: JSON.stringify({
      "handler": "addProduct",
      "input": {
        "name": "foo"
      }
    })
  }
})
```

returns:

```javascript
{
  "data": {
    "name": "foo"
  }
}
```

## Advanced Configuration

### preInit
Runs this function block before initiating the server

```javascript
// src/server.ts

export const preInit = () => {
  console.log('Hello World!');
}
```
