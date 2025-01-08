const handleFileRetrieval = async (path) => {
  let file
  file = await cleanRepo.getObject(path)
  console.log(`File ${path} retrieved from clean storage.`)
  return [file, null]
}

export {
  handleFileRetrieval
}
