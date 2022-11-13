import React, {useState, useEffect, useRef} from 'react'
import useComputedState from 'use-computed-state'
import {useDebounce} from 'use-debounce'
import uniq from 'uniq'
import {generatePrivateKey, getPublicKey, relayPool} from 'nostr-tools'
import {queryName} from 'nostr-tools/nip05'
import Modal from './Modal'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime)

import './NostrComments.css'

import {normalizeURL, nameFromMetadata} from './util'
import {NostrCommentsLoader} from './NostrCommentsLoader'
import {NostrCommentsNoNip07,
  NostrCommentsNoPubkey,
  NostrCommentsCreateProfile
} from './NostrCommentsAuth'

const url = normalizeURL(location.href)
const pool = relayPool()

export function NostrComments({relays = []}) {
  
  console.log('NostrComments :: Load')

  const [loaderText, setLoaderText] = useState('loading...')
  const [me, setMe] = useState(null);
  const [firstEvent, setFirstEvent] = useState(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false)
  const [comment, setComment] = useState('')
  const [publicKey, setPublicKey] = useState(null)
  const [events, setEvents] = useState({})
  const [editable, setEditable] = useState(true)
  const [notices, setNotices] = useState([])
  const [metadata, setMetadata] = useState({})

  // loading, noNip07, noPubkey, noProfile, allSet
  const [userStatus, setUserStatus] = useState('loading')
  const metasubRef = useRef(null)

  // 1. Relay setup; 2. Look for 'Foundational event' with #r tag
  useEffect(() => {
    console.log('Connect to relays');
    relays.forEach(url => {
      pool.addRelay(url, {read: true, write: true})
    })

    pool.onNotice((notice, relay) => {
      showNotice(`${relay.url} says: ${notice}`)
    })

    let sub = pool.sub({
      filter: {kinds: [1], '#r': [url]},
      cb: event => setFirstEvent(event)
    })

    return () => {
      sub.unsub()
    }
  }, [])

  // Look for Comments, if firstEvent is present
  useEffect(() => {

    let sub;
    if (firstEvent) {
      sub = pool.sub({
        filter: {kinds: [1], '#e': [firstEvent.id]},
        cb: event => {
          if (event.id in events) return
          events[event.id] = event
          setEvents({...events})
          // console.log('ev: ', event);
        }
      })
    }

    return () => {
      if (sub) {
        sub.unsub()
      }
    }

  }, [firstEvent])

  // Check for nip07
  useEffect(() => {
    ;(async () => {
      // TODO:
      console.log('window.nostr: ', window.nostr)
      await new Promise((resolve) => setTimeout(() => resolve(), 100));
      if (window.nostr) {
        setUserStatus('noPubkey')
      } else {
        setUserStatus('noNip07')
      }
    })()
  }, [])

  const wantedMetadataImmediate = useComputedState(
    () => uniq(Object.values(events).map(ev => ev.pubkey)),
    [events],
    []
  )

  const [wantedMetadata] = useDebounce(wantedMetadataImmediate, 2000)

  useEffect(() => {
    if (!publicKey) return

    const filter = {kinds: [0], authors: wantedMetadata.concat(publicKey)}
    console.log('author filter', filter)
    if (metasubRef.current) {
      // update metadata subscription with new keys
      metasubRef.current.sub({filter})
    } else {
      // start listening for metadata information
      metasubRef.current = pool.sub({
        filter,
        cb: event => {
          console.log('metadata event', event)
          if (
            !metadata[event.pubkey] ||
            metadata[event.pubkey].created_at < event.created_at
          ) {
            metadata[event.pubkey] = event
            setMetadata({...metadata})

            console.log(metadata)

            try {
              const nip05 = JSON.parse(event.content).nip05
              queryName(nip05).then(name => {
                if (name === nip05) {
                  event.nip05verified = true
                }
              })
            } catch (err) {}
          }
        }
      })
    }

    return () => {
      metasubRef.current.unsub()
    }
  }, [publicKey, wantedMetadata])

  const orderedEvents = useComputedState(
    () => Object.values(events).sort((a, b) => b.created_at - a.created_at),
    [events],
    []
  )

  return (
    <div className="nostr-comments-8015-container">

      { userStatus === 'noNip07' ?
        <NostrCommentsNoNip07 /> : null }

      { userStatus === 'noPubkey' ?
        <NostrCommentsNoPubkey onGetKey={getPublicKeyEvent} /> : null }

      { userStatus === 'noProfile' ?
          <NostrCommentsCreateProfile onSubmit={saveMetaData} />: null }

      { userStatus === 'loading' ?
          <NostrCommentsLoader text={loaderText} />: null }

      { userStatus === 'allSet' ?
      <div className='nostr-comments-8015-input-section'>
        <textarea className='nostr-comments-8015-textarea'
          value={comment}
          readOnly={!editable}
          onChange={e => setComment(e.target.value)}
          autoFocus
        />
        <div className='nostr-comments-8015-input-section-button-row'>

            <button className='nostr-comments-8015-info-button' onClick={infoEvent}>
              <svg className='nostr-comments-8015-svg-info' version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
                  width="24px" height="24px" viewBox="0 0 416.979 416.979" xmlSpace="preserve">

                  <g>
                      <path d="M356.004,61.156c-81.37-81.47-213.377-81.551-294.848-0.182c-81.47,81.371-81.552,213.379-0.181,294.85
                      c81.369,81.47,213.378,81.551,294.849,0.181C437.293,274.636,437.375,142.626,356.004,61.156z M237.6,340.786
                      c0,3.217-2.607,5.822-5.822,5.822h-46.576c-3.215,0-5.822-2.605-5.822-5.822V167.885c0-3.217,2.607-5.822,5.822-5.822h46.576
                      c3.215,0,5.822,2.604,5.822,5.822V340.786z M208.49,137.901c-18.618,0-33.766-15.146-33.766-33.765
                      c0-18.617,15.147-33.766,33.766-33.766c18.619,0,33.766,15.148,33.766,33.766C242.256,122.755,227.107,137.901,208.49,137.901z"/>
                  </g>

              </svg>
            </button>
            <button className='nostr-comments-8015-post-button' onClick={publishEvent} disabled={!editable}>
              { editable ? 'Post comment': 'Submitting' }
            </button>

            { /*
            <button className='nostr-comments-8015-post-button' onClick={testEvent}>
              Test
            </button>
            */ }
        </div>
      </div>: null }
      <div>
        {notices.map(n => (
          <div className='nostr-comments-8015-notice-div' key={`${n.text}${n.time}`}>{n.text}</div>
        ))}
      </div>
      <div>
        {orderedEvents.map(evt => (
          <div className='nostr-comments-8015-comment-card' key={evt.id}>
            <div style={{ fontFamily: 'monospace', fontSize: '1.2em' }}>
                {/*
                <span className='nostr-comments-8015-comment-title'> from <b> {evt.pubkey.slice(0, 10)}…</b> </span>
                */ }
                <span className='nostr-comments-8015-comment-title'> from <b> {nameFromMetadata(metadata[evt.pubkey] || {pubkey: evt.pubkey})} </b> </span>
                <span style={{ fontFamily: 'arial', fontSize: '0.7em' }}>
                    { dayjs(evt.created_at * 1000).from(new Date()) }
                </span>
            </div>
            <div style={{ marginTop: '8px' }}>{evt.content}</div>
          </div>
        ))}
      </div>

      {isInfoOpen && <Modal setIsOpen={setIsInfoOpen} title="Info">

        <span>
          Commenting as{' '}
          <em style={{color: 'green'}}>
          {nameFromMetadata(metadata[publicKey] || {pubkey: publicKey})} { me.about && me.about.length > 0 ? `(${me.about})`: null }
          </em>{' '}
          using relays <br/>
          {relays.map(url => (
            <em key={url} style={{color: 'orange', paddingRight: '5px'}}>
            {url} <br/>
            </em>
          ))}
        </span>


      </Modal>}

    </div>
  )

  function showNotice(text) {
    setNotices([
      ...notices,
      {time: Date.now(), text}
    ])
    setTimeout(() => {
      setNotices(notices.filter(n => n.time - Date.now() > 5000))
    }, 5050)
  }

  async function infoEvent() {
    setIsInfoOpen(true)
  }

  async function getPublicKeyEvent(ev) {
    try {
      // and if it has a key stored on it
      const pubkey = await window.nostr.getPublicKey()
      console.log('...public key: ', pubkey)
      // setNip07(true)
      setPublicKey(pubkey)
      setUserStatus('loading')
      setLoaderText('Fetching profile...')

      // look for profile
      // setTimeout(() => {
      // getMetaData(pubkey)
      // }, 1000)
    } catch (err) {
      alert('ERROR fetching public key: Pls check if your private key is configured. ' + JSON.stringify(err, Object.getOwnPropertyNames(err)))
      console.error('ERROR fetching public key: Pls check if your private key is configured', JSON.stringify(err, Object.getOwnPropertyNames(err)))
      setPublicKey('')
    }
  }

  async function saveMetaData({userName, about, profilePicUrl}) {

    try {

      let event = {
        pubkey: publicKey,
        created_at: Math.round(Date.now() / 1000),
        kind: 0,
        tags: [],
        content: JSON.stringify({
          name: userName,
          about: about,
          picture: profilePicUrl
        })
      }

      // console.log('event to publish: ', event)

      const response = await window.nostr.signEvent(event)
      // console.log('sign response: ', response);
      if (response.error) {
        throw new Error(response.error)
      }
      event = response

      const saveTimeout = setTimeout(() => {
        showNotice(
          `failed to publish event ${event.id.slice(0, 5)}… to any relay.`
        )
      }, 5000)

      pool.publish(event, (status, relay) => {
        console.log('publish status: ', status, relay)
        switch (status) {
          case -1:
            showNotice(`failed to send ${JSON.stringify(event)} to ${relay}`)
            break
          case 1:
            clearTimeout(saveTimeout)
            setUserStatus('allSet')
            showNotice(`event ${event.id.slice(0, 5)}… published to ${relay}.`)
            break
        }

      })

    } catch (err) {
      console.log('setmeta error: ', err)
    }
  }

  async function getMetaData(pubkey) {
    try {

      let sub = pool.sub({
        filter: {kinds: [0], 'authors': [pubkey]},
        cb: event => {
          if (!me) {
            clearTimeout(getMetaTimeout)
            console.log('author meta: ', event)
            setMe(JSON.parse(event.content));
            setUserStatus('allSet')
          }
        }
      })

      const getMetaTimeout = setTimeout(() => {
        setUserStatus('noProfile')
        console.log('No author')
      }, 1000)

    } catch (err) {
      console.log('setmeta error: ', err)
    }
  }

  // TODO
  async function publishFirstEvent() {

    return new Promise(async (resolve, reject) => {
      setEditable(false)

      let event = {
        pubkey: publicKey,
        created_at: Math.round(Date.now() / 1000),
        kind: 1,
        tags: [['r', url]],
        content: "comments for " + url
      }

      console.log('event: ', event)

      // we will sign this event using the nip07 extension if it was detected
      // otherwise it should just be signed automatically when we call .publish()
      // if (hasNip07) {
      const response = await window.nostr.signEvent(event)
      if (response.error) {
        throw new Error(response.error)
      }
      event = response
      // }

      const publishTimeout = setTimeout(() => {
        showNotice(
          `failed to publish event ${event.id.slice(0, 5)}… to any relay.`
        )
        setEditable(true)
      }, 5000)

      console.log('publishing...')
      pool.publish(event, (status, relay) => {
        console.log('publish status: ', status, relay)
        switch (status) {
          case -1:
            showNotice(`failed to send ${JSON.stringify(event)} to ${relay}`)
            setEditable(true)
            reject()
            break
          case 1:
            clearTimeout(publishTimeout)
            showNotice(`event ${event.id.slice(0, 5)}… published to ${relay}.`)
            setComment('')
            setEditable(true)
            resolve(event)
            break
        }
      })
    })

  }

  async function publishEvent(ev) {
    ev.preventDefault()
    setEditable(false)

    let fevent = firstEvent;
    if (!firstEvent) {
      fevent = await publishFirstEvent()
    }

    let event = {
      pubkey: publicKey,
      created_at: Math.round(Date.now() / 1000),
      kind: 1,
      tags: [['e', fevent.id]],
      content: comment
    }

    console.log('event: ', event);

    // we will sign this event using the nip07 extension if it was detected
    // otherwise it should just be signed automatically when we call .publish()
    // if (hasNip07) {
      const response = await window.nostr.signEvent(event)
      if (response.error) {
        throw new Error(response.error)
      }
      event = response
    // }

    const publishTimeout = setTimeout(() => {
      showNotice(
        `failed to publish event ${event.id.slice(0, 5)}… to any relay.`
      )
      setEditable(true)
    }, 8000)

    console.log('publishing...');
    pool.publish(event, (status, relay) => {
      console.log('publish status: ', status, relay);
      switch (status) {
        case -1:
          showNotice(`failed to send ${JSON.stringify(event)} to ${relay}`)
          setEditable(true)
          break
        case 1:
          clearTimeout(publishTimeout)
          showNotice(`event ${event.id.slice(0, 5)}… published to ${relay}.`)
          setComment('')
          setEditable(true)
          break
      }
    })
  }
}

