# MiniServer - A Minimalist Nodejs HTTP Server

Creating a Nodejs server should be easy. Keep It Super Simple right?

## Features

- Filename based api *(Inspired by Nextjs api routes)*.
- File upload via multipart form supported, no need to install middlewares.
- Mongoose supported out of the box, with utility functions.
- Miscroservices integration with other miniservers. see [Miscroservice Example](/example/docker-example)

## Preview

See this code snippet:

```typescript
/**
* For example, if you have a multipart-form data similar to this:
*
*  handler = myFileUpload
*  myImage = my_image.png
*
* And then,
* Your api file should be located at src/myFileUpload.ts
* see the filename should be the same as your "handler"
* field on your multipart form data.
*/
import fs from 'fs';

export const handler = ({ input }) => {
  /**
  * this will create a file to the root directory and
  * name the file img.png
  */
  fs.writeFileSync('img.png', input.myImage.fileData);
}
```

The form data is in the input parameter, which can be accessed right away from the function - See no imports and no middleware Mom!, just plain simple right?

How about mongoose crud?

```typescript
// src/addProduct.ts

export const handler = async ({ db }) => db.create();
```

The above code snippet will add data to the mongo database. But where's the input? Believe me, it's in there, you don't need to explicitly add it, the handler knows your input data.

Want to see the long version?

```typescript
// src/addProduct.ts

export const handler = async ({ mongoose, input }) => {
  const model = mongoose.model('Product');
  const res = await model.create(input);

  return res;
}
```

How about microservices?

```typescript
/**
 * main service miniserver
 * 
 * mainService/src/someApi.ts
 */
export const handler = async ({ services, input }) => {
  const product = await services.products.getItem(input.id);

  return product.data;
}

/**
 * and then from the product service miniserver
 * 
 * productService/src/getItem.ts
 */
export const handler = async ({ db, input }) => db.findById(input)

```

### Example
see examples directory [example](/example)

## Getting Started

### Automatic Install

```bash
npx create-miniserver my-project
```

### Manual Install

```bash
npm install @mavvy/miniserver
```

install typescript
```bash
npm install typescript --save-dev
```

#### package.json

Set type to module and add start script
```json
{
  "type": "module",
  "scripts": {
    "start": "miniserver start"
  }
}
```

#### sample tsconfig.json file
```json
{
  "compilerOptions": {
    "lib": ["es2020"],
    "target": "es2020",
    "module": "esnext",
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

#### .env

Optional. You can skip this step, the default PORT is 3000.
```bash
export PORT = 3333
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

## Everything is a POST request - simple yet effective!

All requests are POSTs, so you don't need to worry about any other things - query parameters, routes, payload, url encoding, etc. You can just focus on what features are you going to make.

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

#### Handling multipart-form

Just add the *handler* field, all the other fields will be automatically injected to the *input* object

the file value contains:
|key|description|
|---|-----------|
|filename|original file name|
|encoding|file ecoding, eg: 7bit|
|mimeType|eg: image/png|
|fileData|buffer string of the file|

##### file input example
If you have a multipart-form data like this:

```bash
handler = myFileUpload
myImage = my_image.png
```

You should have a *src/myfileUpload.ts* file
```typescript
// src/myFileUpload.ts
import fs from 'fs';

export const handler = ({ input }) => {
  console.log(input)

  fs.writeFileSync('img.png', input.myImage.fileData);

  return 'ok'
}
```

it should log:
```json
{
  "input": {
    "myImage": {
      "filename": "my_image.png",
      "encoding": "7bit",
      "mimeType": "image/png",
      "fileData": <Buffer 89 50 4e 47 0d 0a 1a 0a 00 00 00 0d 49 48 44 52 00 00 07 54 00 00 00 a0 08 06 00 00 00 bb 53
 5e 4d 00 00 0c 6c 69 43 43 50 49 43 43 20 50 72 6f 66 69 ... 47402 more bytes>
    }
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

The above code snippet adds a Product to the collection with the given input from the post request. The handler knows the model from the name of the file which is `addProduct`, because it gets the last uppercase first letter word and it also has the input data so you don't have to add it explicitly. simple.


If you want to use the short version, but the handler name's substring didn't match the model name, you can export a model from your handler:

```typescript
// src/addProduct2.ts

export const model = 'Product';

export const handler = async ({db }) => db.create();
```

**NOTE**: handler names or file names can be in kebab case.

Also, if you want to use the long version:

```typescript
// src/addProduct.ts

export const handler = async ({ mongoose, input }) => {
  const model = mongoose.model('Product');
  const res = await model.create(input);

  return res;
}
```

## Services

Creating a microservice using miniserver is super easy.

### Usage

#### create the services config

```typescript
// _config.ts

export const SERVICES = {
  user: {
    url: 'http://localhost:3000/api',
    methods: ['users', 'userById']
  }
}
```

Take a look at the example above. The key **user** is the label for your service, you can name it anything. The value **url** is the url of your miniserver service. And the **methods** are the api handler that is exposed and that will be used by the service consumer.

Here is the sample usage on your handler

```typescript
// src/getAllUsers.ts

export const handler = async ({ services }) => {
  const users = await services.user.users();

  return users.data;
}
```

```typescript
// src/getUserById.ts

export const handler = async ({ services, input }) => {
 const user = await services.user.userById(input);

 return user.data;
}
```

See the [Docker Example](/example/docker-example) to see it in action.

### Services Context

Shared context among your services

Example:

Product Service
```typescript
export const handler = async ({ services, context }) => {
  context.add('myData', 'foo');
  const result = await services.review.getData();

  return result.data;
}
```

Review Service
```typescript
// src/getData.ts
export const handler = ({ context }) => {
  const ctx = context.data();

  return `Data = ${ctx.myData}`; // returns "Data = foo"
}
```

## Advanced Configuration - _config.ts

### PRE_INIT hook
Runs the PRE_INIT hook before initiating the server

```javascript
// src/_config.ts

import http from 'node:http';

export const PRE_INIT = async (server: http.Server) => {
  console.log('Hello World!');
}
```

### Change api root uri

The default api root uri is **/api** , to change it - go to your .env file and set the ROOT_URI

```javascript
// src/_config.ts

export const ROOT_URI = '/foo';
```

### Disable CORS

```javascript
// src/_config.ts

export const DISABLE_CORS = true;
```
