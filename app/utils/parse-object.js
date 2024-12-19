const parseObject = (value) => {
  if (typeof value === 'object') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch (error) {
    return null
  }
}

export default parseObject
