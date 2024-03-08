# Basic Example

## Usage

### Install

```bash
npm install
```

### Add your .env file
```bash
export PORT = 3000
export MONGO_URI = YOUR_MONGO_URI
```

### Usage on Client Side

```javascript
fetch('http://localhost:3000/api', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    handler: 'greet'
  })
})
```
