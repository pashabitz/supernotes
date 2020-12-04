import React from 'react'
import {Editor, EditorState,RichUtils, getDefaultKeyBinding, KeyBindingUtil, convertToRaw, convertFromRaw, Modifier, CompositeDecorator} from 'draft-js';
import NotesAutosuggest from './AutoSuggest';

export default class NotesEditor extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        editorState: EditorState.createEmpty(this.makeDecorator()),
        name: '',
        id: '',
        linkingToNote: false,
        linkedNoteName: '',
        isDirty: false,
        isSaving: false
      };
      this.onChange = editorState => {
        const newState = {editorState};
        if (editorState.getCurrentContent() !== this.state.editorState.getCurrentContent()) {
          newState.isDirty = true;
        }
        this.setState(newState);
      }
      this.handleKeyCommand = this.handleKeyCommand.bind(this);
      this.handleNew = this.handleNew.bind(this);
      this.handleBeforeInput = this.handleBeforeInput.bind(this);
      this.linkedNoteRef = React.createRef();
      this.editorRef = React.createRef();
      this.insertLink = this.insertLink.bind(this);
      this.onLinkedNotePress = this.onLinkedNotePress.bind(this);
      this.noteLink = this.noteLink.bind(this);
      this.toggleStyle = this.toggleStyle.bind(this);
      this.toggleBlock = this.toggleBlock.bind(this);
      this.saveInterval = window.setInterval(() => {
        if (this.state.isDirty && !this.state.isSaving) {
          this.props.onSave({
            name: this.state.name,
            content: JSON.stringify(convertToRaw(this.state.editorState.getCurrentContent())),
            id: this.state.id
          }).then(note => this.setState({isSaving: false}));
          this.setState({
            isDirty: false,
            isSaving: true
          })  
        }
      }, 2000);
    }
  
    createDefaultName() {
      for (let i = 1; i <= 1000; i++) {
        let name = `New Note ${i}`;
        if (this.props.notes.every(n => n.name !== name)) {
          return name;
        }
      }
      return 'New Note';
    }
    
    myKeyBindingFn(e) {
      const {hasCommandModifier} = KeyBindingUtil;
      if (e.keyCode === "8".charCodeAt(0) /* `8` key */ && hasCommandModifier(e) && e.shiftKey) {
        return 'toggle-list';
      }
      if (e.keyCode === "S".charCodeAt(0) && hasCommandModifier(e)) {
        return 'save';
      }
      return getDefaultKeyBinding(e);
    }
    toggleBlock(type) {
      const editorState = RichUtils.toggleBlockType(
        this.state.editorState,
        type
      );
      this.setState({editorState});
    }
    handleKeyCommand(command, editorState) {
      const newState = RichUtils.handleKeyCommand(editorState, command);
  
      if (newState) {
        this.onChange(newState);
        return 'handled';
      }
      if (command === 'toggle-list') {
        this.toggleBlock('unordered-list-item');
      }
      if (command === 'save') {
        this.props.onSave({
          name: this.state.name,
          content: JSON.stringify(convertToRaw(this.state.editorState.getCurrentContent())),
          id: this.state.id
        })
      }
  
      return 'not-handled';
    }
    componentDidMount() {
      this.editorRef.current.focus();
    }
    
    componentDidUpdate(prevProps, prevState) {
      if (this.props.note && (!prevProps.note || prevProps.note.id !== this.props.note.id)) {
        const id = this.props.note.id
        const newState = {id};
        if (!this.state.isDirty) {
          newState.editorState = EditorState.createWithContent(convertFromRaw(JSON.parse(this.props.note.content)), this.makeDecorator());
          newState.name = this.props.note.name;
        }
        this.setState(newState);
      }
      if (!prevState.linkingToNote && this.state.linkingToNote) {
        this.linkedNoteRef.current.focus();
      }
      if (prevProps.notes !== this.props.notes && this.state.name === '') {
        this.setState({name: this.createDefaultName()});
      }
    }
    handleNew() {
      const editorState = EditorState.createEmpty(this.makeDecorator());
      const name = this.createDefaultName();
      const id = '';
      this.setState({editorState, name, id});
    }
    toggleStyle(newStyle) {
      const editorState = RichUtils.toggleInlineStyle(this.state.editorState, newStyle);
      this.setState({editorState});
    }
  
    handleBeforeInput(chars, editorState, eventTimeStamp) {
      if (chars === "[") {
        let selection = editorState.getSelection();
        const contentState = Modifier.replaceText(
          editorState.getCurrentContent(),
          selection,
          "[]"
        );
        let newEditorState = EditorState.set(editorState, {
          currentContent: contentState,
        });
  
        const nextOffSet = selection.getFocusOffset() + 1;
    
        selection = selection.merge({
          focusOffset: nextOffSet,
          anchorOffset: nextOffSet
        })
        newEditorState = EditorState.acceptSelection(newEditorState, selection);
        this.setState({
          editorState: newEditorState,
          linkingToNote: true
        })
        return 'handled';
      }
    }
  
    insertLink(note) {
      const contentState = this.state.editorState.getCurrentContent();
      const contentStateWithEntity = contentState.createEntity('NOTE-LINK', 'IMMUTABLE', {
        name: note.name,
        id: note.id
      });
      const entityKey = contentStateWithEntity.getLastCreatedEntityKey();
  
      const newContentState = Modifier.insertText(
        contentState,
        this.state.editorState.getSelection(),
        note.name,
        null,
        entityKey
      );
      const editorState = EditorState.set(this.state.editorState, {
        currentContent: newContentState,
      });
      this.setState({
        editorState,
        linkingToNote: false,
        linkedNoteName: '',
        isDirty: true
      });
    }
    onLinkedNotePress(e) {
      if (e.key === 'Enter' && this.state.linkedNoteName.trim() !== '') {
        this.props.addNote(this.state.linkedNoteName).then(note => {
          this.insertLink(note);
        })
      }
    }
  
    findLinkEntities(contentBlock, callback, contentState) {
      contentBlock.findEntityRanges(
        (character) => {
          const entityKey = character.getEntity();
          return (
            entityKey !== null &&
            contentState.getEntity(entityKey).getType() === 'NOTE-LINK'
          );
        },
        callback
      );
    }
    noteLink(props) {
      const {id} = props.contentState.getEntity(props.entityKey).getData();
      return (
        <span onClick={() => this.props.documentClicked(id)} style={{textDecoration: "underline", color: "blue", cursor: "pointer"}}>
          {props.children}
        </span>
      );
    }
    makeDecorator() {
      return new CompositeDecorator([
        {
          strategy: this.findLinkEntities,
          component: this.noteLink,
        }
      ]);
    }
    render() {
      return (
        <div>
          <div><button onClick={this.handleNew}>New</button></div>
          <input type="text" placeholder="name" value={this.state.name} onChange={(e) => this.setState({name: e.target.value, isDirty: true})} />
          <div>
          <button onClick={() => this.toggleStyle('BOLD')}><b>B</b></button>
          <button onClick={() => this.toggleStyle('ITALIC')}><i>I</i></button>
          <button onClick={() => this.toggleStyle('UNDERLINE')}><u>U</u></button>
          <button onClick={() => this.toggleBlock('unordered-list-item')}>•</button>
          </div>
        <div style={{display: this.state.linkingToNote ? 'block': 'none'}}>
          <label>Link to:</label>
          <NotesAutosuggest
          ref={this.linkedNoteRef}
          onKeyPress={this.onLinkedNotePress}
          onSelected={this.insertLink}
          notes={this.props.notes}
          onChange={(val) => this.setState({linkedNoteName: val})}
           />
        </div>
        <Editor 
        ref={this.editorRef}
        editorState={this.state.editorState} 
        onChange={this.onChange}
        handleKeyCommand={this.handleKeyCommand}
        keyBindingFn={this.myKeyBindingFn}
        handleBeforeInput={this.handleBeforeInput} />
        </div>
      );
    }
  }