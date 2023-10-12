# MiniServer - A Minimalist Nodejs Express Server

Creating a Nodejs Express server should be simple. Keep It Super Simple right?

## Getting Started

### Install
install typescript
```bash
npm install typescript @types/node --save-dev
```

### package.json

Set type to module
```json
{
  "type": "module"
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
export PORT = 3000 #YOUR_PORT
```

### Create Handlers

```javascript
// src/handlers/hello.ts

export async function handler() {
  return 'hello world!';
}
```
### Usage


```javascript
fetch('http://localhost:3000/service', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    body: JSON.stringify({
      "serviceMethod": "hello",
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
// handlers/addProduct.ts

export async function handler({input}) {
  return input;
}
```
Call the API
```javascript
fetch('http://localhost:3000/service', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    body: JSON.stringify({
      "serviceMethod": "addProduct",
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

### mongoose integrations

#### install
```bash
npm install mongoose
```

#### add env file

```bash
export MONGODB_URI = 'MONGO DB URI'
```

#### add server.ts
```javascript
// src/server.ts
import mongoose from 'mongoose';

export const preInit = async ({ addContext }) => {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('connected to db');

  mongoose.model(
    'Product',
    new mongoose.Schema({
      name: String,
      price: mongoose.SchemaTypes.Decimal128,
      description: String,
    }),
  );

  // optional, if you want to add this model function to the context of function handlers.
  addContext({
    model: mongoose.model,
  });
};
};
```

#### add a handler

```javascript
//handlers/products.ts
export async function handler({ context }) {
  const data = await context.model('Product').find();

  return data.map((doc: any) => ({
    id: doc.id,
    name: doc.name,
  }));
}
```
