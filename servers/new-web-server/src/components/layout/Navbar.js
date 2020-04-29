import React from 'react'
import { NavLink } from 'react-router-dom'
import { connect } from 'react-redux'
import IconButton from '@material-ui/core/IconButton'
import { withStyles } from '@material-ui/core/styles'
import Avatar from '@material-ui/core/Avatar'
import pink from '@material-ui/core/colors/pink'
import MapConfigIcon from '@material-ui/icons/EditLocation'


const styles = theme => ({
	button: {
		position: 'absoulute',
	  	// left: 10,
	},
	input: {
	  display: 'none',
	},
	pinkAvatar: {
		margin: 10,
		color: '#fff',
		backgroundColor: pink[500],
	  },
  });

function swapTheme(props) {
	console.log(props)
	return props.palette.type = "dark"
}

const switchTheme = (props) => {
	const { classes, theme } = props;

	

	return(
		<ul className="right">
			<IconButton 
			// className={classes.menuButton}
			// aria-owns={openConfig ? 'map-config' : undefined}
			aria-haspopup="true"
			onClick={swapTheme(theme)}
			color="inherit"
			>
				<MapConfigIcon/>
			</IconButton>
		</ul>
		
		
	)
}

export default withStyles(styles)(switchTheme)