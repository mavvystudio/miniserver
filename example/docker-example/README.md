# Miniserver Docker Microservices Example

## Running

```bash
docker compose up
```

## Services

- blog 
- article
- comment

## api

```bash
# url
http://localhost:3003/api
```

### blogs from all users

```bash
{
  "handler": "blogs"
}
```

### blog by user id

```bash
{
  "handler": "blog",
  "input": {
    "userId": 1
  }
}
```
