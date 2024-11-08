const notifyCallback = {
  method: 'POST',
  path: '/notify-callback',
  handler: (request, h) => {
    const { id, reference, content, template, status } = request.payload

    console.log(`Notification ID: ${id}`)
    console.log(`Reference: ${reference}`)
    console.log(`Content: ${content}`)
    console.log(`Template: ${template}`)
    console.log(`Status: ${status}`)

    return h.response('ok').code(200)
  }
}

export default notifyCallback
