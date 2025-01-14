const getOptions = (_headers) => ({
  headers: {
    'Content-Type': 'application/octet-stream'
  }
})

const handleResponse = async (response) => {
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.statusText}`)
  }

  return response.json()
}

const get = async (url) => {
  const options = getOptions()
  const response = await fetch(url, options)
  return handleResponse(response)
}

export {
  get
}
