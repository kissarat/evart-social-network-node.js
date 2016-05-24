class App.Peer
  constructor: (params) ->
    _.extend @, Backbone.Events
    if 'string' == typeof params
      params =
        target_id: params
      App.config.peer

    constrains = {
      optional: [
        { DtlsSrtpKeyAgreement: true },
        { RtpDataChannels: true }
      ]
    };

    rtc = new RTCPeerConnection App.config.peer, constrains
    @candidates = []
    @params = params
    if DEV
      register rtc,
        identityresult: App.debug.trace
        idpassertionerror: App.debug.error
        idpvalidationerror: App.debug.error
        negotiationneeded: App.debug.trace
        peeridentity: App.debug.trace
        iceconnectionstatechange: (e) -> App.debug.trace 'CONNECTION: ' + e.target.iceConnectionState
        signalingstatechange: (e) -> App.debug.trace 'SIGNAL: ' + e.target.signalingState
    for name, method of @
      if 0 == name.indexOf('on')
        rtc.addEventListener name.replace(/^on/, '').toLowerCase(), method.bind @
    @connection = rtc

  initializeDataChannel: (channel) =>
    @channel = channel
    register channel,
      open: () -> App.debug.trace 'OPEN CHANNEL'
      message: (e) -> App.debug.trace 'CHANNEL MESSAGE', e.data
      close: () -> App.debug.trace 'CLOSE CHANNEL'

  onDataChannel: (e) =>
    @initializeDataChannel e.channel

  addCandidates: () =>
    candidate = @candidates.shift()
    if candidate
      @connection.addIceCandidate candidate
      @addCandidates()

  onSignalingStateChange: (e) =>
    if 'have-remote-offer' == e.target.signalingState
      @addCandidates()

  onIceCandidate: (e) ->
    if e.candidate
      @pushMessage
        type: 'candidate'
        candidate: e.candidate
    else
      App.debug.error 'No candidate'

  onAddStream: (e) ->
    @on 'addstream', e

  trace: () ->
    connection: @connection.iceConnectionState
    signal: @connection.signalingState
    streams: @connection.getRemoteStreams()

  isClosed: () -> ['closed', 'disconnected', 'failed'].indexOf(@connection.iceConnectionState) >= 0
  isCompleted: () -> @isClosed and 'completed' == @connection.iceConnectionState

  offer: (options) ->
    if not options
      options = App.Peer.makeMediaConstraints true, true
    @connection.createOffer(options)
    .then (offer) =>
      @connection.setLocalDescription(offer)
      return offer

  pushMessage: (o) ->
    o.target_id = @params.target_id
    App.push o

  offerCall: (audio = true, video = true) ->
    navigator.mediaDevices.getUserMedia({audio: audio, video: video}).then (camera) =>
      App.camera = camera
      @offer(App.Peer.makeMediaConstraints audio, video)
      .then (offer) =>
        @pushMessage
          type: 'offer',
          sdp: offer.sdp

  answer: (offer, options) ->
    if not _instanceof(offer, RTCSessionDescription)
      offer = new RTCSessionDescription
        type: 'offer'
        sdp: if 'string' == typeof offer then offer else offer.sdp
    @connection.setRemoteDescription(offer).then () =>
      delete @receivedOffer
      @addCandidates()
      @connection.createAnswer(options).then (answer) =>
        @connection.setLocalDescription(answer).then () =>
#          dataChannelOptions =
#            ordered: true
#            maxRetransmitTime: 1000
#          @initializeDataChannel @connection.createDataChannel('default', dataChannelOptions)
          return answer

  receiveCall: (offer) ->
    @receivedOffer = offer
    App.phone = @
    @trigger 'call', offer
#    App.debug.trace 'RECEIVE_CALL', offer.sdp

  answerCall: (audio = true, video = true) ->
    navigator.mediaDevices.getUserMedia({audio: audio, video: video}).then (camera) =>
      App.camera = camera
      @answer(@receivedOffer.sdp, Peer.makeMediaConstraints(true, true))
    .then (answer) =>
      @trigger 'answer', answer
      @pushMessage
        type: 'answer'
        sdp: answer.sdp

  @makeMediaConstraints: (audio, video) ->
    audio = !!audio
    video = !!video
    if not App.camera
      navigator.mediaDevices.getUserMedia({audio: audio, video: video}).then (camera) ->
        App.camera = camera
        App.trigger 'camera', camera
    if isFirefox
      offerToReceiveAudio: audio
      offerToReceiveVideo: video
    else
      mandatory:
        OfferToReceiveAudio: audio
        OfferToReceiveVideo: video

  @clients = {}

  @find: (target_id) ->
    if not Peer.clients[target_id]
      Peer.clients[target_id] = new App.Peer(target_id)
    return Peer.clients[target_id]

  @remoteEvents =
    candidate: (message) ->
#      App.debug.trace 'CANDIDATE', JSON.stringify message.candidate
      candidate = new RTCIceCandidate message.candidate
      if @receivedOffer
        @candidates.push candidate
      else
        @connection.addIceCandidate candidate
    offer: (message) ->
      @receiveCall message
    answer: (message) ->
      App.debug.trace 'ANSWER', message
      answer = new RTCSessionDescription
        type: 'answer'
        sdp: message.sdp
      @connection.setRemoteDescription answer

App.on 'login', () ->
  react App, ((message) -> App.Peer.find(message.source_id)), App.Peer.remoteEvents