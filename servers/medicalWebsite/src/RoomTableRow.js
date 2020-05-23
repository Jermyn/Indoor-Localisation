import React, { Component } from 'react'
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { withStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';
import Radio from '@material-ui/core/Radio';

const styles = theme => ({
    button: {
        margin: theme.spacing.unit,
    },
    textField: {
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
    },
})

class RoomTableRow extends Component {
    state = {
        id: '',
        vacancy: null,
        selected: null,
    };

    componentDidMount() {
        const { room } = this.props;
        this.setState({
            id: room.id,
            vacancy: room.vacancy
        });
    };

    handleChange = event => {
        this.setState({ selected: event.target.value });
      };

    handleClick = (event, id, vacancy) => {
        const { selected } = this.state;
        let selectedIndex = selected.indexOf(id);
        if(selectedIndex === -1) {
            let index = 0
            selected.map(check => {
              if(typeof check === 'object') {
                if(id == check.id) {
                  selectedIndex = index
                }
              }
              index += 1
            })
          }
        let newSelected = [];

        if (selectedIndex === -1) {
        newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
        newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
        newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
        newSelected = newSelected.concat(
            selected.slice(0, selectedIndex),
            selected.slice(selectedIndex + 1),
        );
        }

        this.setState({ selected: newSelected });
        // if(newSelected.length > 0) {
        // let data = this.state.data;
        // let chosen = []
        // newSelected.map(select => {
        //     if(typeof select === 'object'  | select == "None") {
        //         chosen.push(select)
        //     } else {
        //         let item = {id: data[select].serialno, uuid: data[select].uuid}
        //         chosen.push(item)
        //     }
        // })


    }

    render() {
        const { room, isSelected } = this.props;
        const { selected } = this.state;
        console.log (selected)
        return (
            <TableRow key={room.id} hover tabIndex={-1}>
                <TableCell style={{width: '1.5rem'}} padding="radio">
                    <Radio checked={selected} onChange={this.handleChange} value={room.id}/>
                </TableCell>
                <TableCell component="th" scope="row" padding="none">
                    {room.id}
                </TableCell>
                <TableCell component="th" scope="row" padding="none">
                    {room.vacancy}
                </TableCell>
            </TableRow>
        )
    }
}

export default withStyles(styles)(RoomTableRow)