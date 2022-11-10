import React, {useState} from 'react'

export function NostrCommentsCreateProfile({ onSubmit }) {

  const [userName, setUserName] = useState('')
  const [profilePicUrl, setProfilePicUrl] = useState('')
  const [about, setAbout] = useState('')

  async function createProfileEvent(ev) {
    console.log(userName, profilePicUrl)
    onSubmit({ userName, about, profilePicUrl });
  }

  return (
    <div className='nostr-comments-8015-input-section'>
        <div className="nostr-comments-8015-form-group">
          <label htmlFor='username'> Username </label>
          <input type='text' id='username' value={userName} onChange={e => setUserName(e.target.value) } />
        </div>

        <div className="nostr-comments-8015-form-group">
          <label htmlFor='profilePic'> Profile pic URL </label>
          <input type='text' id='profilePic' value={profilePicUrl} onChange={e => setProfilePicUrl(e.target.value) } />
        </div>

        <div className="nostr-comments-8015-form-group">
          <label htmlFor='about'> About you </label>
          <input type='text' id='about' value={about} onChange={e => setAbout(e.target.value) } />
        </div>

        <div className='nostr-comments-8015-input-section-button-row'>

            <div> Step 3 / 3 </div>
            <button className='nostr-comments-8015-post-button' onClick={createProfileEvent}>
              Create profile
            </button>

        </div>
    </div>
  )
}
