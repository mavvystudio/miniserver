# MiniServer - A Minimalist Nodejs Express Server

Creating a Nodejs Express server should be simple. Keep It Super Simple right?

## Getting Started

### Install

```bash
npm install @mavvy/miniserver express mongoose
```

install typescript
```bash
npm install typescript @types/node --save-dev
```

### .env

```bash
export PORT = 3000 #YOUR_PORT

export MONGODB_URI = YOUR MONGODB_URI

export DEFAULT_MODEL = YOUR DEFAULT COLLECTION NAME
```

### Add models

create a `models.ts` file under src

```javascript
import mongoose from 'mongoose';

export default [
  {
    name: 'Product',
    schema: {
      name: String,
      price: mongoose.SchemaTypes.Decimal128,
      description: String,
    },
    schemaOptions: {
      timestamps: true,
    },
  },
];
```

### Create Handlers

```javascript
// src/handlers/products.ts

export async function handler({ model }) {
  const data = await model('Product').find();

  return data.map((doc: any) => ({
    id: doc.id,
    name: doc.name,
  }));
}
```

```javascript
// src/handlers/addProduct.ts

export async function handler({ currentModel, input }) {
  const doc = await currentModel.create(input);

  return {
    id: doc.id,
    name: doc.name,
  };
}
```

### Usage

addProduct demo
```javascript
fetch('http://localhost:3000/service', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    body: JSON.stringify({
	  "serviceMethod": "addProduct",
	  "input": {
		"name": "myproductname02"
	  }
    })
  }
})

```

returns:

```javascript
{
  "data": {
    "id": "651b0ac27630523985921880",
    "name": "myproductname02"
  }
}
```
