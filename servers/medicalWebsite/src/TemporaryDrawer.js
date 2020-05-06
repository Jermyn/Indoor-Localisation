import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import Divider from '@material-ui/core/Divider';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import HomeIcon from '@material-ui/icons/Home';
import PersonAddIcon from '@material-ui/icons/PersonAdd';
import LocationOnIcon from '@material-ui/icons/LocationOn';
import AddIcon from '@material-ui/icons/Add';
import PeopleIcon from '@material-ui/icons/People';
import { Link } from 'react-router-dom';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';

const styles = {
  list: {
    width: 250,
  },
  fullList: {
    width: 'auto',
  },
  addStaffIcon: {
    marginRight: '14px'
  },
  addIcon: {
    width: '.6em'
  },
  mdIcon: {
    marginLeft: '-.2em',
    fontSize: '1.3em',
    display: 'inline',
  },
  briefcaseIcon: {
    fontSize: '1.2em',
    marginLeft: '.2em',
  }
};

class TemporaryDrawer extends React.Component {
  state = {
    top: false,
    left: false,
    bottom: false,
    right: false,
  };

  componentWillReceiveProps(nextProps) {
    if(nextProps.toggle !== this.state.toggle) {
      this.setState({left: nextProps.toggle})
    }
  }

  handleDrawerClose = () => {
      this.setState({left: false})
      this.setState({ toggle: false });
  }

  toggleDrawer = (side, open) => () => {
    this.setState({
      [side]: open,
    });
  };

  render() {
    const { classes, toggle } = this.props;
    const links = ['/home', '/addPatient', '/addAsset']
    const links2 = ['/locationTracking', '/contactTracing']
    const sideList = (
      <div className={classes.list}>
        <List>
          {['Home', 'Add Patient', 'Add Asset'].map((text, index) => (
            <ListItem button component={Link} to={links[index]} key={text}>
              <ListItemIcon>{index === 0 ? <HomeIcon /> : index % 2 === 0 ?  <div className={classes.briefcaseIcon}><i className="fas fa-briefcase-medical" /></div> : <PersonAddIcon />}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
          <ListItem button component={Link} to='/addStaff' key={'Add Staff'}>
            <ListItemIcon className={classes.addStaffIcon}><div><AddIcon className={classes.addIcon}/><div className={classes.mdIcon}><i className="fas fa-user-md fa-sm"/></div></div></ListItemIcon>
            <ListItemText primary={'Add Staff'}/>
          </ListItem>
        </List>
        <Divider />
        <List>
          {['Location Tracking', 'Contact Tracing'].map((text, index) => (
            <ListItem button component={Link} to={links2[index]} key={text}>
              <ListItemIcon>{index % 2 === 0 ? <LocationOnIcon /> : <PeopleIcon />}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </div>
    );

    const fullList = (
      <div className={classes.fullList}>
        <List>
          {['Home', 'Add Patient', 'Add Asset', 'Add Staff'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>{index % 2 === 0 ? <HomeIcon /> : <PersonAddIcon />}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <List>
          {['Location Tracking', 'Contact Tracing'].map((text, index) => (
            <ListItem button key={text}>
              <ListItemIcon>{index % 2 === 0 ? <LocationOnIcon /> : <div><AddIcon /><i className="fas fa-user-md fa-sm" /></div>}</ListItemIcon>
              <ListItemText primary={text} />
            </ListItem>
          ))}
        </List>
      </div>
    );

    return (
      <div>
      <ClickAwayListener onClickAway={this.handleDrawerClose}>
      <div>
        <Drawer open={this.state.left} onClose={this.toggleDrawer('left', false)}>
          <div
            tabIndex={0}
            role="button"
            onClick={this.toggleDrawer('left', false)}
            onKeyDown={this.toggleDrawer('left', false)}
          >
            {sideList}
          </div>
        </Drawer>
        <Drawer anchor="top" open={this.state.top} onClose={this.toggleDrawer('top', false)}>
          <div
            tabIndex={0}
            role="button"
            onClick={this.toggleDrawer('top', false)}
            onKeyDown={this.toggleDrawer('top', false)}
          >
            {fullList}
          </div>
        </Drawer>
        <Drawer
          anchor="bottom"
          open={this.state.bottom}
          onClose={this.toggleDrawer('bottom', false)}
        >
          <div
            tabIndex={0}
            role="button"
            onClick={this.toggleDrawer('bottom', false)}
            onKeyDown={this.toggleDrawer('bottom', false)}
          >
            {fullList}
          </div>
        </Drawer>
        <Drawer anchor="right" open={this.state.right} onClose={this.toggleDrawer('right', false)}>
          <div
            tabIndex={0}
            role="button"
            onClick={this.toggleDrawer('right', false)}
            onKeyDown={this.toggleDrawer('right', false)}
          >
            {sideList}
          </div>
        </Drawer>
        </div>
      </ClickAwayListener>
      </div>
    );
  }
}

TemporaryDrawer.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(TemporaryDrawer);
