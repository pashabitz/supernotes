import './App.css';

import { useAuth0 } from "@auth0/auth0-react";
import React, { Component, useState } from 'react'
import 'draft-js/dist/Draft.css';
import axios from 'axios';
import NotesEditor from './editor';
import {EditorState, convertToRaw} from 'draft-js';

const LoginButton = () => {
  const { loginWithRedirect } = useAuth0();

  return <button id="login" onClick={() => loginWithRedirect()}>Log In</button>;
};

const MadeWith = () => {
  return <footer>Made with <a href="https://less-dev.com">less</a></footer>;
}
const PublicHome = () => {
  return <div id="public-home">
    <h1>Take beautiful interlinked notes</h1>
    <LoginButton />
    <MadeWith />
  </div>;
}
const LogoutButton = () => {
  const { logout, user } = useAuth0();

  return (
    <div id="logout">
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
    this.onDelete = this.onDelete.bind(this);
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
  onDelete(id) {
    axios.delete(`${this.apiUrl}?id=${encodeURIComponent(id)}`, this.apiConfig).then(res => {
      const notes = this.state.notes.filter(n => n.id !== id);
      this.setState({notes});
    });
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
        <div>
          <NotesEditor
          note={this.state.note}
          notes={this.state.notes}
          onSave={this.onSave}
          addNote={this.addNote}
          documentClicked={this.documentClicked}
          onDelete={this.onDelete} />
        </div>
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
    return <PublicHome />
  }
  return (
    <div>
      <header>
        <span id="logo">Supernotes</span>
        <LogoutButton />
      </header>
      <Notes accessToken={accessToken} user={user} />
      <MadeWith />
    </div>
  );
}

export default App;
