import React, { Component } from 'react'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    formControl: {
        margin: theme.spacing.unit,
        minWidth: 120,
      },
})

class RoomSelection extends Component {
    constructor(props) {
        super(props);
        this.state = {
            item: null
        }
    }

    handleChange = (e) => {
        this.setState({ item: e.target.value })
        this.props.onChange(e, e.target.value, this.props.anchor);
    };
    
    render() {
        const { classes, rooms } = this.props;
        const { item } = this.state;
        return (
            <FormControl className={classes.formControl}>
                <InputLabel htmlFor="Room">Room</InputLabel>
                <Select
                id={1}
                autoWidth={true}
                value={this.state.item}
                onChange={this.handleChange}
            >
                {rooms.map(x => (
                    <MenuItem
                        key={x.id}
                        value={x.id + 1}
                    >{x.id + 1}</MenuItem>
                ))}}
            </Select></FormControl>
        )}
}

export default withStyles(styles)(RoomSelection)