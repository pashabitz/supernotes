import React from 'react';
import Autosuggest from 'react-autosuggest';

export default class NotesAutosuggest extends React.Component {
	constructor(props) {
		super(props)
	
		this.state = {
			 suggestions: [],
			 val: ''
        }
        this.inputRef = React.createRef();
        this.suggestionSelected = this.suggestionSelected.bind(this);
	}
	
	onChange(e, { newValue }) {
		this.setState({val: newValue});
		this.props.onChange(newValue);
	}
	onSuggestionsFetchRequested =({value, reason}) => {
        value = value.toLowerCase();
        this.setState({suggestions: this.props.notes.filter(d => d.name.toLowerCase().includes(value))})
	};
	renderSuggestion = suggestion => {
        const {name} = suggestion;
        let elem = <p>{name}</p>;
        const {val} = this.state;
        const pos = suggestion.name.toLowerCase().indexOf(val.toLowerCase());
        if (pos >= 0) {
            elem = <p style={{cursor: "pointer"}}>{name.substring(0, pos)}<strong>{name.substring(pos, pos + val.length)}</strong>{name.substring(pos + val.length)}</p>;
        }
		return elem;
    }
    focus() {
        this.inputRef.current.focus();
    }
    suggestionSelected(e, info) {
        this.props.onSelected(info.suggestion);
        this.setState({val: ''});
    }
	render() {
		return <Autosuggest
			suggestions={this.state.suggestions}
			onSuggestionsFetchRequested={this.onSuggestionsFetchRequested.bind(this)}
			onSuggestionsClearRequested={() => this.setState({suggestions: []})}
			renderSuggestion={this.renderSuggestion}
			getSuggestionValue={(s) => s.name}
			inputProps={{
				value: this.state.val,
                onChange: this.onChange.bind(this),
                ref: this.inputRef,
                onKeyPress: this.props.onKeyPress
            }}
            onSuggestionSelected={this.suggestionSelected}
		/>
	}
}