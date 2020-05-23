import React, { Component } from 'react'
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import Draggable from 'react-draggable';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button'
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField'
import Select from '@material-ui/core/Select'
import MenuItem from '@material-ui/core/MenuItem'
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';

function PaperComponent(props) {
    return (
      <Draggable>
        <Paper {...props} />
      </Draggable>
    );
  }

  const styles = theme => ({
    root: {
      width: '100%',
      marginTop: theme.spacing.unit,
      overflowX: 'auto',
    },
    container: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    table: {
      minWidth: 700,
    },
    button: {
      margin: theme.spacing.unit,
    },
    input: {
        display: 'none'
    },
    leftIcon: {
      marginLeft: theme.spacing.unit,
    },
    textField: {
      marginLeft: theme.spacing.unit,
      marginRight: theme.spacing.unit,
    },
    formControl: {
        margin: theme.spacing.unit,
        minWidth: 120,
      },
});

class MaterialDialogForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            item: null
        }
        this.handleSubmitButton = this.handleSubmitButton.bind(this);
    }


    handleClickOpen = () => {
        this.setState({ open: true });
    };

    handleChange = (e) => {
        this.props.onChange(e);
        this.setState({ item: e.target.value })
    };

    handleLoadMap = (e) => {
        this.props.onLoadMap(e);
        this.setState({ item: e.target.value })
    }

    handleClose = () => {
        this.props.onClose();
    };

    handleSubmitButton = (e) => {
        this.props.onSubmit(e, this.state.item);
    };

    handleImageChange = (e) => {
        this.props.onImgChange(e);
    };

    render() {
        const { onClose, onChange, onImgChange, onImgUpload, onLoadMap, classes, title, text, rows, onSubmit, aria_id, ...other } = this.props;
        return (
            <Dialog
            maxWidth={false}
            onClose={this.handleClose}
            PaperComponent={PaperComponent}
            aria-labelledby={aria_id}
            {...other}
            >
            <DialogTitle id={aria_id}>{title}</DialogTitle>
            <DialogContent>
                { rows.map(({key, type, defaultValue, readOnly, items, required, label, maxRows}) => {
                    if (type === 'text') { 
                        return <TextField
                            required={required}
                            disabled={readOnly}
                            id={key}
                            label={label}
                            className={classes.textField}
                            defaultValue={defaultValue != null ? defaultValue : void 0}
                            onChange={this.handleChange}
                            variant= "outlined"
                            multiline= "controlled"
                            rows={maxRows}
                        />
                    }
                    else if (type === 'file') {
                        return <input
                            accept="image/*"
                            className={classes.button}
                            id="image"
                            multiple
                            type="file"
                            onChange={this.handleImageChange}
                        />
                    }
                    else if (type === 'select') {
                        return (<div><FormControl className={classes.formControl}>
                            <InputLabel 
                            htmlFor={aria_id}>id</InputLabel>
                            <Select
                            id={key}
                            autoWidth={true}
                            value={this.state.item}
                            inputProps={{
                                name: label,
                                id: aria_id
                            }}
                            onChange={this.handleChange}
                        >
                            {items.map(x => (
                                <MenuItem
                                    key={x}
                                    value={x}
                                >{x}</MenuItem>
                            ))}}
                        </Select></FormControl></div>)

                    }
                })}
            </DialogContent>
            <DialogActions>
                <Button onClick={this.handleClose} color="primary">
                Cancel
                </Button>
                <Button onClick={this.handleSubmitButton} color="primary">
                Submit
                </Button>
            </DialogActions>
            </Dialog>
        );
    }

}

export default withStyles(styles)(MaterialDialogForm)