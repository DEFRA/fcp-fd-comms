import { DefaultAzureCredential } from '@azure/identity'
import { BlobServiceClient } from '@azure/storage-blob'

const account = 'devstoreaccount1'
const defaultAzureCredential = new DefaultAzureCredential()

const blobServiceClient = new BlobServiceClient(
  `https://${account}.blob.core.windows.net`,
  defaultAzureCredential
)

const containerName = 'fcp-fd-comms-temp'

const retrieve = async () => {
  const containerClient = blobServiceClient.getContainerClient(containerName)

  let i = 1
  const blobs = containerClient.listBlobsFlat()

  for await (const blob of blobs) {
    console.log(`Blob ${i++}: ${blob.name}`)
  }
}

export default retrieve
