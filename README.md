# MiniServer - A Minimalist Nodejs HTTP Server with Mongoose

Creating a Nodejs server should be easy. Keep It Super Simple right?

## Steps to get started
1. install the package
2. update package.json script and type
3. create env file
4. create your api eg: src/greet.ts
5. optional - create _schema.ts to create mongoose schema

If you notice, you don't need to setup a server, or code anything related to starting a server - You just go ahead and create your api. Steps 1 - 3 were just common nodejs practices, like 99% of the time you do that on your projects. Get started in the simplest terms.

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

export const handler = ({ input }) => {
  console.log(input)
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
      "fileData": "
      �PNG\r\n' +
        '\x1A\n' +
        '\x00\x00\x00\rIHDR\x00\x00\x07T\x00\x00\x00�\b\x06\x00\x00\x00�S^M\x00\x0
0\fliCCPICC Profile\x00\x00H��W\x07XS�\x16�[����\x02�H\t�\tҫ�\x10Z\x04\x01����\x04
\x12J�\tAŎ�\n' +
...
      "
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

## Advanced Configuration

### preInit
Runs this function block before initiating the server

```javascript
// src/server.ts

import http from 'node:http';

export const preInit = (server: http.Server) => {
  console.log('Hello World!');
}
```

### Change api root uri

The default api root uri is **/api** , to change it - go to your .env file and set the ROOT_URI

```bash
export ROOT_URI = /foo
```