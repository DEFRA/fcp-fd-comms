const isServerErrorCode = (code) => {
  return code >= 500 && code < 600
}

export {
  isServerErrorCode
}
