# MiniServer - A Minimalist Nodejs HTTP Server with Mongoose

Creating a Nodejs server should be easy. Keep It Super Simple right?

## Everything is a POST request - simple yet effective!

All requests are POSTs, so you don't need to worry about any other things - query parameters, routes, payload, url encoding, etc. You can just focus on what features are you going to make.

### Example
see examples directory [example](/example)

## Getting Started

### Install

```bash
npm install @mavvy/miniserver
```

install typescript
```bash
npm install typescript --save-dev
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
// src/greet.ts

export async function handler() {
  return 'hello world!';
}
```

### Usage

Client side request

```javascript
fetch('http://localhost:3000/api', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    body: JSON.stringify({
      "handler": "greet",
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

## With Mongoose

Mongoose is supported out of the box, just add .env and _schema.ts and you are good to go

### env
```bash
export MONGO_URI = your mongo uri
```

### _schema.ts

```typescript
// src/_schema.ts


export default [{
  name: 'Product',
  fields: {
    name: String,
    productType: String
  }
}]
```

### usage

```typescript
// src/addProduct.ts

export const handler = async ({ db }) => db.create();
```

The above code snippet adds a Product to the collection with the given input from the post request. The handler knows the model from the name of the file which is `addProduct`, and it also has the input data so you don't have to add it explicitly. simple.

long version

```typescript
// src/addProduct.ts

export const handler = async ({ mongoose, input }) => {
  const model = mongoose.model('Product');
  const res = await model.create(input);

  return res;
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
