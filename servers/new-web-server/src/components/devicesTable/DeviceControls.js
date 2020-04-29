import React from 'react'
import Button from '@material-ui/core/Button'
import EditIcon from '@material-ui/icons/Edit'
import DeleteIcon from '@material-ui/icons/Delete'
import { withStyles } from '@material-ui/core/styles';

const styles = theme => ({
    root: {
        background: 'linear-gradient(45deg, #17beed 10%, #1757ed 90%)',
        border: 0,
        borderRadius: 300,
        boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
        color: 'white',
        height: 48,
        padding: '0 30px',
        margin: theme.spacing.unit,
      },
  });

const DeviceControls = (props) => {
    const { onDelete, onEdit, classes } = props;
    return(
        <div>
            <Button aria-label="Edit" variant="fab" className={classes.root} onClick={onEdit}>
                <EditIcon />
            </Button>
            <Button aria-label="Delete" variant="fab" className={classes.root} onClick={onDelete}>
                <DeleteIcon />
            </Button>
        </div>
    )
}

export default withStyles(styles)(DeviceControls)