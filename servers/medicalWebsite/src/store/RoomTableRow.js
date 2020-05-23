import React, { Component } from 'react'
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import { withStyles } from '@material-ui/core/styles';
import Checkbox from '@material-ui/core/Checkbox';

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
    };

    componentDidMount() {
        const { room } = this.props;
        this.setState({
            id: room.id,
            vacancy: room.vacancy
        });
    };

    render() {
        const { room } = this.props;
        console.log (room.vacancy)
        return (
            <TableRow key={room.id}>
                <TableCell style={{width: '1.5rem'}} padding="checkbox">
                    <Checkbox />
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