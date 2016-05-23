class App.Peer extends Backbone.Events
  construct: (params) ->
    rtc = new RTCPeerConnection(config.peer.servers, config.peer.constants)
    @params = params
    if DEV
      register rtc,
        identityresult: debug.trace
        idpassertionerror: debug.error
        idpvalidationerror: debug.error
        negotiationneeded: debug.trace
        peeridentity: debug.trace
        iceconnectionstatechange: (e) -> debug.trace 'CONNECTION: ' + e.target.iceConnectionState
        signalingstatechange: (e) -> debug.trace 'SIGNAL: ' + e.target.signalingState
    for name, method of @
      if 0 == name.indexOf('on')
        rtc.addEventListener name.replace(/^on/, '').toLowerCase(), method.bind @
    @connection = rtc

  onIceCandidate: (e) ->
    if e.candidate
      candidate =
        type: 'candidate'
        candidate: e.candidate
    else
      debug.error 'No candidate'

  onAddStream: (e) ->
    @on 'addstream', e

  trace: () ->
    connection: @connection.iceConnectionState
    signal: @connection.signalingState
    streams: @connection.getRemoteStreams()

  isClosed: () -> ['closed', 'disconnected', 'failed'].indexOf(@connection.iceConnectionState) >= 0
  isCompleted: () -> @isClosed and 'completed' == @connection.iceConnectionState

  offer: (options) ->
    @connection.createOffer(options)
    .then (offer) =>
      @connection.setLocalDescription(offer)

  answer: (offer, options) ->
    if not _instanceof(offer, RTCSessionDescription)
      offer = new RTCSessionDescription
      type: 'offer'
      sdp: if 'string' == typeof offer then offer else offer.sdp
    @connection.setRemoteDescription(offer).then () ->
      @connection.createAnswer(options).then (answer) ->
        @connection.setLocalDescription(answer)


  @makeMediaConstraints: (audio, video) ->
    audio = !!audio
    video = !!video
    if isFirefox
      offerToReceiveAudio: audio
      offerToReceiveVideo: video
    else
      mandatory:
        OfferToReceiveAudio: audio
        OfferToReceiveVideo: video

  @find: (target_id) ->
    peer = Peer.clients[target_id]
    if not peer
      peer = new Peer(target_id)
    return peer


App.on 'login', () ->
  react App, ((message) -> App.Peer.find(message.source)),
    candidate: (message) ->
      @connection.addIceCandidate new RTCIceCandidate message.candidate

    offer: (message) ->
      @answer message, Peer.makeMediaConstraints true, true

    answer: (message) ->
      @connection.setRemoteDescription new RTCSessionDescription message
