import './App.css';

import { useAuth0 } from "@auth0/auth0-react";
import React, { Component, useState } from 'react'
import 'draft-js/dist/Draft.css';
import axios from 'axios';
import NotesEditor from './editor';
import {EditorState, convertToRaw} from 'draft-js';

const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();

  return <button onClick={() => loginWithRedirect()}>Log In</button>;
};

const LogoutButton = () => {
  const { logout, user } = useAuth0();

  return (
    <div>
    <span>{user.email}</span>
    <button onClick={() => logout({ returnTo: window.location.origin })}>
      Log Out
    </button>
    </div>
  );
};





class Notes extends Component {
  constructor(props) {
    super(props)
  
    this.state = {
       notes: [],
       note: null,
       loading: true
    }
    this.onSave = this.onSave.bind(this);
    this.addNote = this.addNote.bind(this);
    this.documentClicked = this.documentClicked.bind(this);
  }
  apiUrl = "https://tb7nnzwzpc.less-dev.com/notes/notes";
  apiConfig = {
    headers: {
      "X-Api-Key": "2KaFdTPX9y9g3p3lS4YcGu9RlG4dAp64ekECb23b"
    }
  };
  getNotes() {
    this.apiConfig.headers.Authorization = `Bearer ${this.props.accessToken}`;
    axios.get(`${this.apiUrl}?user=${encodeURIComponent(this.props.user.sub)}`, this.apiConfig).then(res => {
      this.setState({
        notes: res.data,
        loading: false
      })
    });
    
  }
  componentDidMount() {
    if (this.props.accessToken) {
      this.getNotes();
    }
  }
  componentDidUpdate(prevProps, prevState) {
    if (!prevProps.accessToken && this.props.accessToken) {
      this.getNotes();
    }
  }
  
  
  onSave(note) {
    return new Promise((resolve) => {
      if (note.id !== '') {
        // update case
        axios.post(`${this.apiUrl}?id=${encodeURIComponent(note.id)}`, {
          name: note.name,
          content: note.content,
        }, this.apiConfig).then(res => {
          const notes = [...this.state.notes];
          const existingNote = notes.find(n => n.id === note.id);
          existingNote.name =  note.name;
          existingNote.content = note.content;
          this.setState({notes});
          resolve(res.data);
        });
      } else {
        // new note case
        axios.post(this.apiUrl, note, this.apiConfig).then(res => {
          const notes = [...this.state.notes];
          notes.push(res.data);
          this.setState({notes, note: res.data});
          resolve(res.data);
  
        });
      }
    });

  }
  addNote(name) {
    return new Promise((resolve) => {
      axios.post(this.apiUrl, {
        name: name,
        content: JSON.stringify(convertToRaw(EditorState.createEmpty().getCurrentContent()))
      }, this.apiConfig).then(res => {
        const notes = [...this.state.notes];
        notes.push(res.data);
        this.setState({notes});
        resolve(res.data);
      })
    });
  }
  documentClicked(id) {
    const note = this.state.notes.find(n => n.id === id);
    if (note) {
      this.setState({note});
    }
  }
  render() {
    return (
      <div id="grid-container">
        <div id="sidebar">
          {this.state.loading ? <p>Loading...</p> : 
          ( this.state.notes.length > 0 ? 
          <ul>
          {this.state.notes.map(n => <li key={n.id} onClick={() => this.documentClicked(n.id)}>{n.name}</li>)}
          </ul> :
          <p>No notes yet</p>)}
        </div>
        <div><NotesEditor note={this.state.note} notes={this.state.notes} onSave={this.onSave} addNote={this.addNote} documentClicked={this.documentClicked} /></div>
      </div>
    )
  }
}

function App() {
  const { isAuthenticated, isLoading, getAccessTokenSilently, user } = useAuth0();

  const [accessToken, setAccessToken] = useState(null);
  if (accessToken === null && isAuthenticated) {
    getAccessTokenSilently().then(token => setAccessToken(token));
  }
  if (isLoading) {
    return <div>Loading ...</div>;
  }

  if (!isAuthenticated) {
    return <LoginButton />
  }
  return (
    <div>
      <LogoutButton />
      <Notes accessToken={accessToken} user={user} />
    </div>
  );
}

export default App;
