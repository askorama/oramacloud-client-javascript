import Fastify from 'fastify'
import fFormBody from '@fastify/formbody'
import { AddressInfo } from 'net'

async function setUpServer(t: any): Promise<{
  port: number
}> {
  const fastify = Fastify()

  await fastify.register(fFormBody)
  fastify.get('/index/my-index/init', async (request, reply) => {
    return {
      collectUrl: `http://localhost:${port}/collect`,
      deploymentID: 'the-deployment-id',
      index: 'my-index'
    }
  })

  fastify.post('/index/my-index/identify', async (request, reply) => {
    return {
      success: true
    }
  })

  await fastify.listen({
    port: 3001,
    host: '0.0.0.0'
  })
  const port = (fastify.server.address() as AddressInfo).port

  console.log(port)

  return {
    port
  }
}

// Run the server
setUpServer({}).then(() => console.log('Server is running'))
