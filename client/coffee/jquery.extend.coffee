jQuery.extend jQuery,
  sendJSON: (type, url, data, complete) ->
    this.ajax
      type: type
      url: url
      contentType: 'application/json'
      data: JSON.stringify data
      complete: complete
