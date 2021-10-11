import { APP_MESSAGE_QUEUE_NAME } from '../utils/constants'
import BeeQueue from 'bee-queue'

export class TxTimeOutError extends Error {}

const createTradeQueue = (redisUrl) => {
  const queueName = `${APP_MESSAGE_QUEUE_NAME}__main`
  const ret = new BeeQueue(queueName, {
    redis: {
      url: redisUrl,
    },
  })

  ret.dispatch = (...args) => {
    const job = ret.createJob(...args)
    return waitForJob(queueName, job)
  }

  return ret
}

const waitForJob = (queueName, job) =>
  new Promise((resolve, reject) => {
    job
      .save()
      .then(() => {
        job.on('succeeded', (result) => {
          resolve(result)
        })
        job.on('retrying', (err) => {
          $logger.warn(
            { queueName },
            err,
            `Job #${job.id} failed with error ${err.message} but is being retried!`
          )
        })
        job.on('failed', (err) => {
          $logger.warn(
            { queueName },
            err,
            `Job #${job.id} failed with error ${err.message}.`
          )
          reject(err)
        })
      })
      .catch(reject)
  })

export default createTradeQueue
export { waitForJob, createTradeQueue }
