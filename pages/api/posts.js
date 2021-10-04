import * as braid from '@braid-protocol/server'

const clients = new Set()
const posts = []

const getDate = () => new Date().toLocaleString()

const broadcastMessage = (data) => {
  for (const c of clients) {
    c.append({
      value: JSON.stringify(data),
    })
  }
}

const validateBody = body => {
  return typeof body?.id === 'string' && typeof body?.text === 'string' && body?.text.length <= 280 && body?.text.length > 0
}

const handler = async (req, res) => {
  if (req.method === 'GET') {
    if (req.headers.subscribe === 'keep-alive') {
      const stream = braid.stream(res, {
        initialValue: JSON.stringify(posts),
        contentType: 'text/plain',
        onclose() {
          if (stream) clients.delete(stream)
        },
      })
      if (stream) clients.add(stream)
    } else {
      res.end(JSON.stringify(posts))
    }
  } else if (req.method === 'POST') {
    if (!validateBody(req.body)) {
      res.json('Error: Invalid parameters.')
      res.status(405).end()
      return
    }
    const { id, text } = req.body
    posts.unshift({ id, createdAt: getDate(), text })
    if (posts.length > 10) {
      posts.pop()
    }
    broadcastMessage(posts)
    res.status(200).json({ message: 'Success' })
  }
}

export default handler
