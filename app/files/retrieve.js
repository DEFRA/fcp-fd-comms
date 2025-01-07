import { BlobServiceClient } from '@azure/storage-blob'

const connectionString = 'UseDevelopmentStorage=true'

const blobServiceClient = BlobServiceClient.fromConnectionString(connectionString)

const containerName = 'fcp-fd-comms-temp'

const retrieve = async () => {
  const containerClient = blobServiceClient.getContainerClient(containerName)

  let i = 1
  const blobs = containerClient.listBlobsFlat()

  for await (const blob of blobs) {
    console.log(`Blob ${i++}: ${blob.name}`)
  }
}

export { retrieve }
